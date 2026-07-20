import asyncio
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.episode import Episode
from app.models.production import ProductionRun
from app.models.show import Show
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
    }

@router.post("/{production_id}/pause")
def pause_production(production_id: str, db: Session = Depends(get_db)):
    run = db.query(ProductionRun).filter(ProductionRun.id == production_id).first()
    if not run:
        raise HTTPException(404, "Production not found")
    run.current_stage = "PAUSED"
    db.commit()
    return {"message": "Production paused"}

@router.post("/{production_id}/resume")
def resume_production(production_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    run = db.query(ProductionRun).filter(ProductionRun.id == production_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Production not found")
    run.current_stage = "QUEUED"
    run.status = "queued"
    db.commit()
    background_tasks.add_task(asyncio.run, execute_production_pipeline(run.id))
    return {"message": "Production resumed"}
