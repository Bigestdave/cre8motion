import os
from pathlib import PurePosixPath

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.storage import ARTIFACTS_DIR, get_artifact_path
from app.db.session import SessionLocal
from app.models.system import Artifact

router = APIRouter(prefix="/api", tags=["Artifacts"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def artifact_to_dict(artifact: Artifact) -> dict:
    return {
        "id": artifact.id,
        "production_run_id": artifact.production_run_id,
        "shot_id": artifact.shot_id,
        "artifact_type": artifact.artifact_type,
        "mime_type": artifact.mime_type,
        "width": artifact.width,
        "height": artifact.height,
        "duration_seconds": artifact.duration_seconds,
        "file_size_bytes": artifact.file_size_bytes,
        "status": artifact.status,
        "created_at": artifact.created_at,
        "download_url": f"/api/artifacts/{artifact.id}/download",
    }


@router.get("/productions/{production_id}/artifacts")
def list_artifacts(production_id: str, db: Session = Depends(get_db)):
    artifacts = (
        db.query(Artifact)
        .filter(Artifact.production_run_id == production_id)
        .order_by(Artifact.created_at)
        .all()
    )
    return [artifact_to_dict(artifact) for artifact in artifacts]


@router.get("/artifacts/{artifact_id}")
def get_artifact(artifact_id: str, db: Session = Depends(get_db)):
    artifact = db.query(Artifact).filter(Artifact.id == artifact_id).first()
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")
    return artifact_to_dict(artifact)


@router.get("/artifacts/{artifact_id}/download")
def download_artifact(artifact_id: str, db: Session = Depends(get_db)):
    artifact = db.query(Artifact).filter(Artifact.id == artifact_id).first()
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact not found")

    normalized_key = PurePosixPath(artifact.storage_key)
    if normalized_key.is_absolute() or ".." in normalized_key.parts:
        raise HTTPException(status_code=400, detail="Invalid artifact storage key")

    file_path = os.path.abspath(get_artifact_path(str(normalized_key)))
    artifacts_root = os.path.abspath(ARTIFACTS_DIR)
    if os.path.commonpath([artifacts_root, file_path]) != artifacts_root:
        raise HTTPException(status_code=400, detail="Invalid artifact storage key")
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Artifact file is not available")

    return FileResponse(file_path, media_type=artifact.mime_type or "application/octet-stream")
