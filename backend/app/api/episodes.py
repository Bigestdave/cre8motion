from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.episode import Episode
from app.models.show import Show
from app.schemas.api import EpisodeCreateRequest

router = APIRouter(prefix="/api/episodes", tags=["Episodes"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/")
def create_episode(payload: EpisodeCreateRequest, db: Session = Depends(get_db)):
    show = db.query(Show).filter(Show.id == payload.show_id).first()
    if not show:
        raise HTTPException(status_code=404, detail="Show not found")

    creative_input = {"duration_seconds": payload.duration_seconds}
    for field in ("idea", "script", "characters", "locations", "story_type", "emotional_intensity", "creative_direction"):
        value = getattr(payload, field)
        if value:
            creative_input[field] = value

    next_episode_number = (
        db.query(func.coalesce(func.max(Episode.episode_number), 0))
        .filter(Episode.show_id == show.id)
        .scalar()
        + 1
    )
    episode = Episode(
        show_id=show.id,
        season_number=1,
        episode_number=next_episode_number,
        title=payload.title,
        target_duration_seconds=payload.duration_seconds,
        aspect_ratio=show.default_aspect_ratio,
        style_profile_id=show.default_style_profile_id,
        audio_profile_id=show.default_audio_profile_id,
        base_continuity_version=show.current_continuity_version,
        creative_input=creative_input,
    )
    db.add(episode)
    db.commit()
    db.refresh(episode)
    return episode

@router.get("/{episode_id}")
def get_episode(episode_id: str, db: Session = Depends(get_db)):
    episode = db.query(Episode).filter(Episode.id == episode_id).first()
    if not episode:
        raise HTTPException(404, "Episode not found")
    return episode
