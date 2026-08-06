import asyncio
import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.system import WorkflowEvent
from app.models.production import ProductionRun

router = APIRouter(prefix="/api", tags=["Events"])

# Event types that mean the run has reached a terminal state — the SSE stream
# sends a final message and closes instead of polling the DB forever.
TERMINAL_EVENT_TYPES = {"production_completed", "production_failed"}

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/events/recent")
def recent_events(limit: int = 20, db: Session = Depends(get_db)):
    """Latest workflow events across all productions — powers the notification bell."""
    events = (
        db.query(WorkflowEvent)
        .order_by(WorkflowEvent.created_at.desc())
        .limit(min(limit, 50))
        .all()
    )
    return [
        {
            "id": e.id,
            "event_type": e.event_type,
            "severity": e.severity,
            "payload": e.payload,
            "production_run_id": e.production_run_id,
            "created_at": str(e.created_at),
        }
        for e in events
    ]

@router.get("/productions/{production_id}/events")
def get_events(production_id: str, db: Session = Depends(get_db)):
    events = db.query(WorkflowEvent).filter(
        WorkflowEvent.production_run_id == production_id
    ).order_by(WorkflowEvent.created_at).all()
    return events

@router.get("/productions/{production_id}/events/stream")
async def stream_events(production_id: str):
    async def event_generator():
        last_id = None
        while True:
            db = SessionLocal()
            try:
                query = db.query(WorkflowEvent).filter(
                    WorkflowEvent.production_run_id == production_id
                ).order_by(WorkflowEvent.created_at)
                if last_id:
                    last_event = db.query(WorkflowEvent).filter(WorkflowEvent.id == last_id).first()
                    if last_event:
                        query = query.filter(WorkflowEvent.created_at > last_event.created_at)
                events = query.all()
                terminal = False
                for event in events:
                    last_id = event.id
                    data = {
                        "id": event.id,
                        "event_type": event.event_type,
                        "payload": event.payload,
                        "created_at": str(event.created_at),
                        "shot_id": event.shot_id
                    }
                    yield f"data: {json.dumps(data)}\n\n"
                    if event.event_type in TERMINAL_EVENT_TYPES:
                        terminal = True
                # Also stop if the run's DB status is terminal (e.g. resumed runs
                # that completed without a fresh production_completed event).
                if not terminal:
                    run = db.query(ProductionRun).filter(
                        ProductionRun.id == production_id
                    ).first()
                    if run and (run.status or "").lower() in ("complete", "needs_review", "failed"):
                        terminal = True
            finally:
                db.close()
            if terminal:
                break
            await asyncio.sleep(2)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )
