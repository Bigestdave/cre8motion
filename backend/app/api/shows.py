from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.episode import Episode
from app.models.show import Show, Workspace, StyleProfile, Character
from app.providers.qwen import QwenReasoningProvider
from app.schemas.api import CharacterCreateRequest, ShowCreateRequest

router = APIRouter(prefix="/api/shows", tags=["Shows"])

reasoning = QwenReasoningProvider()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def show_to_dict(show, db: Session = None):
    data = {
        "id": show.id,
        "workspace_id": show.workspace_id,
        "title": show.title,
        "premise": show.premise,
        "status": show.status,
        "default_duration_seconds": show.default_duration_seconds,
        "default_aspect_ratio": show.default_aspect_ratio,
        "default_style_profile_id": show.default_style_profile_id,
        "current_continuity_version": show.current_continuity_version,
        "created_at": str(show.created_at),
    }
    if db is not None:
        episodes = (
            db.query(Episode)
            .filter(Episode.show_id == show.id)
            .order_by(Episode.episode_number)
            .all()
        )
        latest = episodes[-1] if episodes else None
        data["episode_count"] = len(episodes)
        data["episodes"] = [
            {
                "id": ep.id,
                "episode_number": ep.episode_number,
                "title": ep.title,
                "status": ep.status,
            }
            for ep in episodes
        ]
        data["latest_episode"] = (
            {
                "id": latest.id,
                "episode_number": latest.episode_number,
                "title": latest.title,
                "status": latest.status,
            }
            if latest
            else None
        )
    return data

@router.post("/proposal")
def generate_proposal(genre: str, animation_style: str, tone: str, target_audience: str, default_duration_seconds: int = 45, idea_seed: str = None):
    return reasoning.generate_show_proposal(genre, animation_style, tone, target_audience, default_duration_seconds, idea_seed)

@router.post("/")
def create_show(payload: ShowCreateRequest, db: Session = Depends(get_db)):
    workspace = db.query(Workspace).first()
    if not workspace:
        workspace = Workspace(name="Default Workspace", owner_id="user_1")
        db.add(workspace)
        db.commit()
        db.refresh(workspace)

    show = Show(
        title=payload.title,
        premise=payload.premise,
        default_duration_seconds=payload.default_duration_seconds,
        default_aspect_ratio=payload.default_aspect_ratio,
        workspace_id=workspace.id,
    )
    db.add(show)
    db.commit()
    db.refresh(show)

    if payload.animation_style or payload.creative_direction:
        style = StyleProfile(
            show_id=show.id,
            name="Default Style",
            animation_style=payload.animation_style,
            canonical_prompt=payload.creative_direction,
            negative_prompt=payload.negative_constraints,
        )
        db.add(style)
        db.commit()
        db.refresh(style)
        show.default_style_profile_id = style.id
        db.commit()
        db.refresh(show)

    return show_to_dict(show)

@router.get("/")
def list_shows(db: Session = Depends(get_db)):
    return [show_to_dict(s, db) for s in db.query(Show).all()]

@router.get("/{show_id}")
def get_show(show_id: str, db: Session = Depends(get_db)):
    show = db.query(Show).filter(Show.id == show_id).first()
    if not show:
        raise HTTPException(404, "Show not found")
    return show_to_dict(show, db)

@router.post("/{show_id}/characters")
def create_character_from_proposal(show_id: str, payload: CharacterCreateRequest, db: Session = Depends(get_db)):
    """Create a character for a show (used by the autonomous proposal flow)."""
    show = db.query(Show).filter(Show.id == show_id).first()
    if not show:
        raise HTTPException(status_code=404, detail="Show not found")
    character = Character(
        show_id=show.id,
        name=payload.name,
        canonical_description=payload.canonical_description,
    )
    db.add(character)
    db.commit()
    db.refresh(character)
    return {"id": character.id, "name": character.name, "canonical_description": character.canonical_description}

@router.post("/{show_id}/episodes/draft")
def generate_episode_draft_endpoint(show_id: str, idea_seed: str = None, duration_seconds: int = 45, db: Session = Depends(get_db)):
    show = db.query(Show).filter(Show.id == show_id).first()
    if not show:
        raise HTTPException(404, "Show not found")
    
    style = db.query(StyleProfile).filter(StyleProfile.id == show.default_style_profile_id).first()
    style_desc = style.canonical_prompt if style else ""
    
    chars = db.query(Character).filter(Character.show_id == show.id).all()
    char_list = [{"name": c.name, "canonical_description": c.canonical_description} for c in chars]
    
    return reasoning.generate_episode_draft(
        show_premise=show.premise,
        show_style=style_desc,
        characters=char_list,
        seed=idea_seed,
        duration=duration_seconds
    )
