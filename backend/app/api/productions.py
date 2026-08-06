import asyncio
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.episode import Episode
from app.models.production import ProductionRun
from app.models.show import Show
from app.models.system import Artifact
from app.services.orchestrator import execute_production_pipeline

router = APIRouter(prefix="/api/productions", tags=["Productions"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/{episode_id}")
def start_production(episode_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    episode = db.query(Episode).filter(Episode.id == episode_id).first()
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")

    next_version = (
        db.query(func.coalesce(func.max(ProductionRun.version), 0))
        .filter(ProductionRun.episode_id == episode_id)
        .scalar()
        + 1
    )
    run = ProductionRun(
        episode_id=episode_id,
        version=next_version,
        status="queued",
        current_stage="QUEUED",
        started_at=datetime.utcnow(),
    )
    db.add(run)
    episode.status = "in_production"
    db.commit()
    db.refresh(run)

    background_tasks.add_task(asyncio.run, execute_production_pipeline(run.id))
    return {"message": "Production started", "production_id": run.id, "version": run.version}

@router.get("/")
def list_productions(db: Session = Depends(get_db)):
    """All production runs with their episode and show context, newest first."""
    runs = db.query(ProductionRun).order_by(ProductionRun.started_at.desc().nullslast()).all()
    result = []
    for run in runs:
        episode = db.query(Episode).filter(Episode.id == run.episode_id).first()
        show = db.query(Show).filter(Show.id == episode.show_id).first() if episode else None
        result.append({
            "id": run.id,
            "episode_id": run.episode_id,
            "version": run.version,
            "status": run.status,
            "current_stage": run.current_stage,
            "budget_limit": run.budget_limit,
            "budget_used": run.budget_used,
            "started_at": str(run.started_at) if run.started_at else None,
            "completed_at": str(run.completed_at) if run.completed_at else None,
            "failure_reason": run.failure_reason,
            "episode_number": episode.episode_number if episode else None,
            "episode_title": episode.title if episode else None,
            "show_id": show.id if show else None,
            "show_title": show.title if show else None,
        })
    return result

@router.get("/{production_id}")
def get_production(production_id: str, db: Session = Depends(get_db)):
    run = db.query(ProductionRun).filter(ProductionRun.id == production_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Production not found")
    episode = db.query(Episode).filter(Episode.id == run.episode_id).first()
    show = db.query(Show).filter(Show.id == episode.show_id).first() if episode else None
    # Surface the assembled episode so the Final Review screen can play it.
    final_video = (
        db.query(Artifact)
        .filter(
            Artifact.production_run_id == run.id,
            Artifact.artifact_type == "final_video",
        )
        .order_by(Artifact.created_at.desc())
        .first()
    )
    return {
        "id": run.id,
        "episode_id": run.episode_id,
        "version": run.version,
        "status": run.status,
        "current_stage": run.current_stage,
        "budget_limit": run.budget_limit,
        "budget_used": run.budget_used,
        "retry_reserve": run.retry_reserve,
        "started_at": str(run.started_at) if run.started_at else None,
        "completed_at": str(run.completed_at) if run.completed_at else None,
        "failure_reason": run.failure_reason,
        "episode_number": episode.episode_number if episode else None,
        "episode_title": episode.title if episode else None,
        "target_duration_seconds": episode.target_duration_seconds if episode else None,
        "show_id": show.id if show else None,
        "show_title": show.title if show else None,
        "final_video_artifact_id": final_video.id if final_video else None,
        "final_video_status": final_video.status if final_video else None,
    }

@router.post("/{production_id}/pause")
def pause_production(production_id: str, db: Session = Depends(get_db)):
    run = db.query(ProductionRun).filter(ProductionRun.id == production_id).first()
    if not run:
        raise HTTPException(404, "Production not found")
    # Only mark status paused — keep current_stage intact so resume knows where
    # the run actually is (previously this clobbered current_stage to "PAUSED").
    run.status = "paused"
    db.commit()
    return {"message": "Production paused", "current_stage": run.current_stage}

@router.post("/{production_id}/resume")
def resume_production(production_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    run = db.query(ProductionRun).filter(ProductionRun.id == production_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Production not found")
    # Nothing to resume if the run already finished.
    if (run.status or "").lower() in ("complete", "needs_review") or run.current_stage in ("READY_FOR_REVIEW", "FINAL_QC"):
        return {"message": "Production already complete", "current_stage": run.current_stage}
    run.status = "in_production"
    db.commit()
    # Re-kick the pipeline; it is idempotent per stage (re-generates from the
    # current stage's inputs) and validates transitions from run.current_stage.
    background_tasks.add_task(asyncio.run, execute_production_pipeline(run.id))
    return {"message": "Production resumed", "current_stage": run.current_stage}


@router.post("/{production_id}/approve")
def approve_production(production_id: str, db: Session = Depends(get_db)):
    """Mark a reviewed episode as approved/complete (Final Review 'Approve episode')."""
    run = db.query(ProductionRun).filter(ProductionRun.id == production_id).first()
    if not run:
        raise HTTPException(404, "Production not found")
    run.status = "complete"
    db.commit()
    return {"message": "Episode approved", "status": run.status}
