from sqlalchemy.orm import Session
from app.models.system import WorkflowEvent

def emit_event(db: Session, event_type: str, production_run_id: str, payload: dict, shot_id: str = None):
    event = WorkflowEvent(
        production_run_id=production_run_id,
        event_type=event_type,
        payload=payload,
        shot_id=shot_id
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
