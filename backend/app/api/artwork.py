"""Show artwork generation: posters and character references created by Qwen Cloud models.

This is part of the autonomous studio pipeline — when a show is created the backend
generates its poster key art (qwen-image-2.0) and character reference sheets
(wan2.7-image-pro) rather than requiring uploads.
"""
import asyncio
import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.storage import get_artifact_path
from app.db.session import SessionLocal
from app.models.show import Show, StyleProfile, Character, CharacterReference
from app.models.system import Artifact
from app.providers.qwen import QwenImageProvider

router = APIRouter(prefix="/api", tags=["Artwork"])

images = QwenImageProvider()

POSTER_NEGATIVE = (
    "text, title, caption, subtitles, watermark, logo, photorealistic live-action, uncanny faces, "
    "plastic skin, malformed hands, extra fingers, cluttered framing, flat lighting, low quality"
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _poster_prompt(show: Show, style: StyleProfile | None) -> str:
    animation_style = (style.animation_style if style else None) or "Cinematic Stylized 3D"
    direction = (style.canonical_prompt if style else None) or ""
    return (
        f"Cinematic key art for a silent {animation_style} animated drama series titled '{show.title}'. "
        f"Premise: {show.premise or 'an emotional character-driven story'}. {direction} "
        "One clear focal story object catching the brightest light, strong foreground-midground-background depth, "
        "premium animated-film rendering, expressive stylized human characters, dramatic cinematic lighting, "
        "landscape 16:9 composition, movie-poster quality, no text or titles anywhere in the image."
    )


def _reference_prompt(character: Character, style: StyleProfile | None) -> str:
    animation_style = (style.animation_style if style else None) or "Cinematic Stylized 3D"
    return (
        f"Premium {animation_style} animated character reference portrait. "
        f"Character: {character.name}. {character.canonical_description or ''} "
        "Full body visible head to feet, neutral standing pose facing camera, centered, "
        "plain softly-lit dark background, large expressive eyes, readable silhouette, "
        "consistent design suitable as an identity reference for animation, vertical composition, no text."
    )


async def _run_image_task(prompt: str, negative: str, size: str, model: str, timeout_seconds: int = 120) -> str | None:
    """Kick off an async DashScope image task and poll until done. Returns image URL or None."""
    task = images.generate_image(prompt, negative_prompt=negative, size=size, model=model)
    if task.get("status") == "FAILED":
        return None
    for _ in range(timeout_seconds // 3):
        await asyncio.sleep(3)
        result = images.poll_image_task(task["task_id"])
        if result["status"] == "SUCCEEDED":
            return result["image_url"]
        if result["status"] == "FAILED":
            return None
    return None


def _store_artifact(db: Session, image_url: str, storage_key: str, artifact_type: str) -> Artifact:
    local_path = get_artifact_path(storage_key)
    os.makedirs(os.path.dirname(local_path), exist_ok=True)
    images.download_image(image_url, local_path)
    artifact = Artifact(
        artifact_type=artifact_type,
        storage_key=storage_key,
        mime_type="image/png",
        file_size_bytes=os.path.getsize(local_path) if os.path.exists(local_path) else None,
        status="approved",
    )
    db.add(artifact)
    db.commit()
    db.refresh(artifact)
    return artifact


@router.post("/shows/{show_id}/poster/generate")
async def generate_show_poster(show_id: str, db: Session = Depends(get_db)):
    """Generate show key art with qwen-image-2.0 and store it as the show's poster."""
    show = db.query(Show).filter(Show.id == show_id).first()
    if not show:
        raise HTTPException(404, "Show not found")
    style = (
        db.query(StyleProfile).filter(StyleProfile.id == show.default_style_profile_id).first()
        if show.default_style_profile_id
        else None
    )

    url = await _run_image_task(
        _poster_prompt(show, style), POSTER_NEGATIVE, size="1280*720", model="qwen-image-2.0"
    )
    if not url:
        raise HTTPException(502, "Poster generation did not complete")

    artifact = _store_artifact(db, url, f"posters/{show_id}.png", "show_poster")
    return {"show_id": show_id, "artifact_id": artifact.id, "download_url": f"/api/artifacts/{artifact.id}/download"}


@router.get("/shows/{show_id}/poster")
def get_show_poster(show_id: str, db: Session = Depends(get_db)):
    """Return the latest generated poster artifact for a show, if any."""
    artifact = (
        db.query(Artifact)
        .filter(Artifact.artifact_type == "show_poster", Artifact.storage_key == f"posters/{show_id}.png")
        .order_by(Artifact.created_at.desc())
        .first()
    )
    if not artifact:
        raise HTTPException(404, "No poster generated for this show")
    return {"artifact_id": artifact.id, "download_url": f"/api/artifacts/{artifact.id}/download"}


@router.post("/characters/{character_id}/references/generate")
async def generate_character_reference(character_id: str, db: Session = Depends(get_db)):
    """Generate a character reference sheet with wan2.7-image-pro from the canonical description."""
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(404, "Character not found")
    show = db.query(Show).filter(Show.id == character.show_id).first()
    style = (
        db.query(StyleProfile).filter(StyleProfile.id == show.default_style_profile_id).first()
        if show and show.default_style_profile_id
        else None
    )

    url = await _run_image_task(
        _reference_prompt(character, style), POSTER_NEGATIVE, size="720*1280", model="wan2.7-image-pro"
    )
    if not url:
        raise HTTPException(502, "Reference generation did not complete")

    artifact = _store_artifact(
        db, url, f"references/{character_id}/generated_front_view.png", "character_reference"
    )
    ref = CharacterReference(
        character_id=character_id,
        reference_type="front_view",
        artifact_id=artifact.id,
        is_canonical=True,
    )
    db.add(ref)
    db.commit()
    db.refresh(ref)
    return {
        "character_id": character_id,
        "reference_id": ref.id,
        "artifact_id": artifact.id,
        "download_url": f"/api/artifacts/{artifact.id}/download",
    }
