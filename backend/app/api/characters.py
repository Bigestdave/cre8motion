from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.show import Character, CharacterReference
from app.models.system import Artifact
from app.core.storage import get_artifact_path
import os

router = APIRouter(prefix="/api", tags=["Characters"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/shows/{show_id}/characters")
def list_characters(show_id: str, db: Session = Depends(get_db)):
    return db.query(Character).filter(Character.show_id == show_id).all()

@router.post("/characters/{character_id}/references")
async def upload_reference(character_id: str, reference_type: str = "front_view", file: UploadFile = File(...), db: Session = Depends(get_db)):
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(404, "Character not found")
    
    storage_key = f"references/{character_id}/{reference_type}_{file.filename}"
    full_path = get_artifact_path(storage_key)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    
    content = await file.read()
    with open(full_path, "wb") as f:
        f.write(content)

    artifact = Artifact(
        artifact_type="character_reference",
        storage_key=storage_key,
        mime_type=file.content_type or "image/png",
        file_size_bytes=len(content),
        status="approved",
        data=content,
    )
    db.add(artifact)
    db.commit()
    
    ref = CharacterReference(
        character_id=character_id,
        reference_type=reference_type,
        artifact_id=artifact.id,
        is_canonical=True
    )
    db.add(ref)
    db.commit()
    db.refresh(ref)
    return ref

@router.get("/characters/{character_id}/references")
def get_references(character_id: str, db: Session = Depends(get_db)):
    return db.query(CharacterReference).filter(CharacterReference.character_id == character_id).all()
