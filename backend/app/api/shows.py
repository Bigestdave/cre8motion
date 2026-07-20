from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.episode import Episode
from app.models.show import Show, Workspace, StyleProfile, Character, CharacterReference, Location, Prop
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


# Curated idea bank distilled from the Cre8Motion story guide — used as few-shot
# examples so qwen-max generates ideas with a visible objective and a visual engine.
IDEA_BANK = [
    "A curious child spends evenings with a quiet grandparent, uncovering what really happened to the old house through objects: a music box, a torn photograph, a moon necklace",
    "A broke delivery rider finds a wallet that produces money for selfish acts and empties when they help someone - every episode is one delivery and one visible moral choice",
    "A ruthless billionaire is magically turned into a baby; their exhausted assistant must secretly run the empire while protecting them",
    "A tiny doctor treats patients whose emotions appear as physical creatures: heartbreak is a cracked glowing heart, anxiety a shadow monster",
    "A clueless courier must deliver a diamond while thieves repeatedly try to swap the package - and accidentally defeats them without noticing",
    "A mysterious shopkeeper buys and sells time: sell a year of life for money, buy five minutes to prevent an accident, steal someone's happiest day",
    "Poor kitchen workers secretly divert food from a selfish king to a hungry village while pretending to cook increasingly ridiculous royal meals",
    "A terrifying debt collector secretly helps each struggling person while pretending to seize their belongings so their cruel employer won't notice",
]


@router.post("/idea")
def generate_idea(genre: str = "Any", tone: str = "Any", db: Session = Depends(get_db)):
    """Generate one fresh silent-story idea seed with qwen-max, few-shot primed with the idea bank."""
    import json as _json
    import random
    examples = "\n".join(f"- {i}" for i in random.sample(IDEA_BANK, 4))
    prompt = f"""You are the Episode Ideator for a dialogue-free 45-second vertical animation studio.
Generate ONE new show idea seed (1-2 sentences) for genre "{genre}" and tone "{tone}".
Rules: it must have a VISIBLE physical objective or object at its heart, a clear visual engine
that can repeat every episode, and be understandable with no dialogue. Do not reuse the examples.

Examples of the right shape:
{examples}

Return JSON: {{"idea": "<the idea seed>"}}"""
    try:
        response = reasoning.client.chat.completions.create(
            model=reasoning.model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
        data = _json.loads(response.choices[0].message.content)
        if isinstance(data.get("idea"), str) and data["idea"].strip():
            return {"idea": data["idea"].strip(), "source": "qwen-max"}
    except Exception as e:
        print(f"Error in generate_idea: {e}")
    # Offline fallback: serve from the curated bank
    import random as _r
    return {"idea": _r.choice(IDEA_BANK), "source": "idea-bank"}

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

@router.delete("/{show_id}")
def delete_show(show_id: str, db: Session = Depends(get_db)):
    from app.models.episode import EpisodeCharacter, EpisodeLocation
    from app.models.production import ProductionRun, Shot, GenerationAttempt, QualityReport

    show = db.query(Show).filter(Show.id == show_id).first()
    if not show:
        raise HTTPException(404, "Show not found")

    episode_ids = [e.id for e in db.query(Episode).filter(Episode.show_id == show_id).all()]
    char_ids = [c.id for c in db.query(Character).filter(Character.show_id == show_id).all()]

    # Production graph: quality reports / attempts -> shots -> runs
    if episode_ids:
        run_ids = [r.id for r in db.query(ProductionRun).filter(ProductionRun.episode_id.in_(episode_ids)).all()]
        if run_ids:
            db.query(QualityReport).filter(QualityReport.production_run_id.in_(run_ids)).delete(synchronize_session=False)
            db.query(GenerationAttempt).filter(GenerationAttempt.production_run_id.in_(run_ids)).delete(synchronize_session=False)
            db.query(Shot).filter(Shot.production_run_id.in_(run_ids)).delete(synchronize_session=False)
            db.query(ProductionRun).filter(ProductionRun.id.in_(run_ids)).delete(synchronize_session=False)
        db.query(EpisodeCharacter).filter(EpisodeCharacter.episode_id.in_(episode_ids)).delete(synchronize_session=False)
        db.query(EpisodeLocation).filter(EpisodeLocation.episode_id.in_(episode_ids)).delete(synchronize_session=False)

    # Character graph
    if char_ids:
        db.query(CharacterReference).filter(CharacterReference.character_id.in_(char_ids)).delete(synchronize_session=False)
        db.query(Prop).filter(Prop.current_owner_character_id.in_(char_ids)).update(
            {Prop.current_owner_character_id: None}, synchronize_session=False
        )

    db.query(Prop).filter(Prop.show_id == show_id).delete(synchronize_session=False)
    db.query(Location).filter(Location.show_id == show_id).delete(synchronize_session=False)
    db.query(Episode).filter(Episode.show_id == show_id).delete(synchronize_session=False)
    db.query(Character).filter(Character.show_id == show_id).delete(synchronize_session=False)
    show.default_style_profile_id = None
    db.flush()
    db.query(StyleProfile).filter(StyleProfile.show_id == show_id).delete(synchronize_session=False)
    db.delete(show)
    db.commit()
    return {"deleted": show_id}

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
