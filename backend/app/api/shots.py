from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.production import Shot, GenerationAttempt, QualityReport

router = APIRouter(prefix="/api", tags=["Shots"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/productions/{production_id}/shots")
def list_shots(production_id: str, db: Session = Depends(get_db)):
    return db.query(Shot).filter(Shot.production_run_id == production_id).order_by(Shot.sequence_number).all()

@router.get("/shots/{shot_id}")
def get_shot(shot_id: str, db: Session = Depends(get_db)):
    shot = db.query(Shot).filter(Shot.id == shot_id).first()
    if not shot:
        raise HTTPException(404, "Shot not found")
    return shot

@router.get("/shots/{shot_id}/attempts")
def get_attempts(shot_id: str, db: Session = Depends(get_db)):
    return db.query(GenerationAttempt).filter(GenerationAttempt.shot_id == shot_id).all()

@router.get("/shots/{shot_id}/quality-reports")
def get_quality_reports(shot_id: str, db: Session = Depends(get_db)):
    return db.query(QualityReport).filter(QualityReport.shot_id == shot_id).all()

@router.post("/shots/{shot_id}/retry")
def retry_shot(shot_id: str, db: Session = Depends(get_db)):
    shot = db.query(Shot).filter(Shot.id == shot_id).first()
    if not shot:
        raise HTTPException(404, "Shot not found")
    shot.status = "video_retry"
    db.commit()
    return {"message": "Shot queued for retry", "shot_id": shot_id}

@router.post("/shots/{shot_id}/approve-attempt")
def approve_attempt(shot_id: str, attempt_id: str, db: Session = Depends(get_db)):
    attempt = db.query(GenerationAttempt).filter(GenerationAttempt.id == attempt_id, GenerationAttempt.shot_id == shot_id).first()
    if not attempt:
        raise HTTPException(404, "Attempt not found")
    shot = db.query(Shot).filter(Shot.id == shot_id).first()
    shot.approved_video_artifact_id = attempt.result_artifact_id
    shot.status = "video_approved"
    db.commit()
    return {"message": "Attempt approved", "artifact_id": attempt.result_artifact_id}
