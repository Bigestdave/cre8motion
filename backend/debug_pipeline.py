"""Standalone pipeline reproduction/debug harness.

Creates a fresh sqlite schema, seeds a show + characters + episode, creates a
ProductionRun and calls execute_production_pipeline() directly with verbose
stage-by-stage logging and timing.

Run from backend/:
  DATABASE_URL=sqlite:///./debug_test.db DEMO_MODE=false python debug_pipeline.py

Set STRICT_FK=1 to enable sqlite foreign key enforcement (mirrors Postgres on
Render, which is where the original PLANNING stall happened).
"""
import os
import sys
import time
import traceback

os.environ.setdefault("DATABASE_URL", "sqlite:///./debug_test.db")
os.environ.setdefault("DEMO_MODE", "false")
os.environ.setdefault("PUBLIC_API_BASE_URL", "https://cre8motion.onrender.com")

DB_FILE = "debug_test.db"
if os.path.exists(DB_FILE) and "--keep-db" not in sys.argv:
    os.remove(DB_FILE)

import asyncio
from sqlalchemy import event

from app.db.session import engine, SessionLocal
from app.db.base_class import Base

# Import every model module so Base.metadata knows all tables.
import app.models.show  # noqa: F401
import app.models.episode  # noqa: F401
import app.models.production  # noqa: F401
import app.models.system  # noqa: F401

# Mirror Postgres: enforce foreign keys on sqlite (Render's Postgres always does).
if os.environ.get("STRICT_FK", "1") == "1" and engine.url.get_backend_name() == "sqlite":
    @event.listens_for(engine, "connect")
    def _fk_pragma(dbapi_conn, _):
        dbapi_conn.execute("PRAGMA foreign_keys=ON")
    print("[debug] sqlite FK enforcement: ON (mirrors Render Postgres)")

Base.metadata.create_all(bind=engine)

from app.models.show import Workspace, Show, StyleProfile, Character
from app.models.episode import Episode
from app.models.production import ProductionRun, Shot
from app.models.system import WorkflowEvent, Artifact


def seed():
    db = SessionLocal()
    ws = Workspace(name="Debug Workspace", owner_id="debug")
    db.add(ws)
    db.commit()

    show = Show(
        workspace_id=ws.id,
        title="Fruitful Secrets",
        slug=f"fruitful-secrets-{int(time.time())}",
        premise="A curious child uncovers family secrets in an old countryside house.",
    )
    db.add(show)
    db.commit()

    style = StyleProfile(
        show_id=show.id,
        name="Default",
        animation_style="Cinematic Stylized 3D",
        canonical_prompt="Warm volumetric sunbeam lighting, high-contrast wood textures, vertical 9:16 safe framing.",
    )
    db.add(style)
    db.commit()
    show.default_style_profile_id = style.id

    for name, desc in [
        ("Lumi", "Young girl with curly hair tied in a bun, overalls, big curious eyes."),
        ("Grandparent", "Grey-haired elder in a knit sweater, quiet, defensive expressions."),
    ]:
        db.add(Character(show_id=show.id, name=name, canonical_description=desc))
    db.commit()

    episode = Episode(
        show_id=show.id,
        episode_number=1,
        title="The Moon Necklace",
        input_type="quick_idea",
        creative_input={
            "idea": "Lumi finds a hidden moon necklace under the kitchen table, "
                    "triggering a suspicious reaction from her Grandparent."
        },
    )
    db.add(episode)
    db.commit()

    run = ProductionRun(
        episode_id=episode.id,
        version=1,
        status="queued",
        current_stage="QUEUED",
        budget_limit=200,
    )
    db.add(run)
    db.commit()
    run_id = run.id
    db.close()
    return run_id


def instrument():
    """Wrap emit_event with timing prints so every stage transition is visible."""
    import app.services.events as events_mod
    import app.services.orchestrator as orch_mod

    t0 = time.monotonic()
    last = {"t": t0}
    original = events_mod.emit_event

    def loud_emit(db, event_type, production_run_id, payload, shot_id=None):
        now = time.monotonic()
        delta = now - last["t"]
        last["t"] = now
        print(f"[{now - t0:8.1f}s] (+{delta:6.1f}s) EVENT {event_type}: {payload}", flush=True)
        return original(db, event_type, production_run_id, payload, shot_id)

    events_mod.emit_event = loud_emit
    orch_mod.emit_event = loud_emit

    # Cap provider polling waits so a debug run finishes in bounded time
    # (placeholder fallbacks kick in on TIMED_OUT, which is a supported path).
    max_wait = int(os.environ.get("DEBUG_MAX_WAIT", "600"))
    original_wait = orch_mod.wait_for_generation

    async def capped_wait(poll, task_id, timeout_seconds=180):
        return await original_wait(poll, task_id, min(timeout_seconds, max_wait))

    orch_mod.wait_for_generation = capped_wait
    print(f"[debug] provider wait cap: {max_wait}s", flush=True)


def main():
    run_id = seed()
    print(f"[debug] seeded production run {run_id}", flush=True)
    instrument()

    from app.services.orchestrator import execute_production_pipeline

    start = time.monotonic()
    try:
        asyncio.run(execute_production_pipeline(run_id))
    except BaseException:
        print("[debug] execute_production_pipeline RAISED OUT of asyncio.run "
              "(this is what kills the Render background task silently):", flush=True)
        traceback.print_exc()
    elapsed = time.monotonic() - start
    print(f"[debug] pipeline returned after {elapsed:.1f}s", flush=True)

    db = SessionLocal()
    run = db.query(ProductionRun).filter(ProductionRun.id == run_id).first()
    print(f"[debug] final run status={run.status} stage={run.current_stage} "
          f"failure_reason={run.failure_reason!r}", flush=True)
    shots = db.query(Shot).filter(Shot.production_run_id == run_id).order_by(Shot.sequence_number).all()
    print(f"[debug] shots created: {len(shots)}")
    for s in shots:
        print(f"  shot {s.sequence_number}: status={s.status} loc={s.location_id!r} "
              f"env_loc={ (s.environment or {}).get('location_name')!r}")
    arts = db.query(Artifact).filter(Artifact.production_run_id == run_id).all()
    for a in arts:
        print(f"  artifact {a.artifact_type} status={a.status} key={a.storage_key} "
              f"db_bytes={len(a.data) if a.data else 0}")
    events = db.query(WorkflowEvent).filter(WorkflowEvent.production_run_id == run_id).all()
    print(f"[debug] workflow events recorded: {len(events)}")
    db.close()


if __name__ == "__main__":
    main()
