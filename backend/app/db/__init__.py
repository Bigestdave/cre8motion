"""Database setup and session helpers."""
import logging
from sqlalchemy.orm import Session
from app.db.base_class import Base
from app.db.session import engine, SessionLocal
from app.models.show import Workspace, Show, StyleProfile, Character, CharacterReference
from app.models.episode import Episode
from app.models.production import ProductionRun, Shot, GenerationAttempt, QualityReport
from app.models.system import Artifact, WorkflowEvent, BudgetLedger, BudgetEntry

logger = logging.getLogger("cre8motion.seed")


def init_and_seed_db():
    """Create all missing tables and seed initial demo shows if database has no shows."""
    try:
        # Create all tables in the database if they don't exist
        Base.metadata.create_all(bind=engine)

        db: Session = SessionLocal()
        try:
            show_count = db.query(Show).count()
            if show_count > 0:
                print(f"[Database] Found {show_count} existing show(s). Skipping seed.")
                return

            print("[Database] Empty database detected. Auto-seeding studio demo shows...")

            # 1. Create Workspace
            workspace = Workspace(name="Cre8Motion Studio", owner_id="demo_user")
            db.add(workspace)
            db.commit()
            db.refresh(workspace)

            # 2. Show 1: Fruitful Secrets
            show1 = Show(
                workspace_id=workspace.id,
                title="Fruitful Secrets",
                slug="fruitful-secrets",
                premise=(
                    "A curious child, Lumi, spends evenings with a quiet grandparent in an old countryside house. "
                    "Each episode she finds an object tied to a hidden family history - and the grandparent conceals "
                    "the truth not with words, but with expressions, gestures, and locked things."
                ),
                status="active",
                default_aspect_ratio="9:16",
                default_duration_seconds=45,
            )
            db.add(show1)
            db.commit()
            db.refresh(show1)

            style1 = StyleProfile(
                show_id=show1.id,
                name="Cinematic Stylized 3D",
                animation_style="Cinematic Stylized 3D",
                canonical_prompt=(
                    "Warm volumetric sunbeam lighting, high-contrast wood textures, vertical 9:16 safe framing. "
                    "Every clue is a physical object: photographs, music boxes, necklaces, keys."
                ),
                negative_prompt="photorealistic, text, watermark, low quality, dialogue, lip-sync",
            )
            db.add(style1)
            db.commit()
            db.refresh(style1)
            show1.default_style_profile_id = style1.id
            db.commit()

            c1 = Character(
                show_id=show1.id,
                name="Lumi",
                canonical_description=(
                    "Young girl, curly hair bun, overalls, big curious eyes. Signature behavior: "
                    "tilts her head when she notices a clue. Signature object: a small pocket magnifier."
                ),
            )
            c2 = Character(
                show_id=show1.id,
                name="Grandparent",
                canonical_description=(
                    "Grey-haired, knit sweater, quiet defensive expressions. Signature behavior: "
                    "touches their locket when a secret is close. Signature object: a ring of old keys."
                ),
            )
            c3 = Character(
                show_id=show1.id,
                name="The Visitor",
                canonical_description=(
                    "Tall figure in a weathered coat, kind tired eyes, wears a pendant with the same symbol as "
                    "the music box. Moves slowly, always seen first as a silhouette or reflection."
                ),
            )
            db.add_all([c1, c2, c3])
            db.commit()

            episodes_data_1 = [
                (
                    1,
                    "The Gift",
                    "The grandparent gives Lumi an old music box. When Lumi opens it, the grandparent sees the symbol inside and quickly closes the lid. Question opened: why is the symbol frightening?",
                ),
                (
                    2,
                    "The Message",
                    "Lumi discovers a folded photograph hidden beneath the music-box lining. One face has been torn away. Question opened: who was removed from the photograph?",
                ),
                (
                    3,
                    "The Visitor",
                    "A stranger arrives at the garden gate wearing the same symbol as the music box. The grandparent sends them away - then secretly watches them leave. Question opened: why does the grandparent recognize the visitor?",
                ),
                (
                    4,
                    "The Moon Necklace",
                    "Lumi finds a moon-shaped necklace under the kitchen table. When she offers it to the grandparent, the reflection of the visitor appears in the window. Someone has been inside the house.",
                ),
            ]

            for num, title, idea in episodes_data_1:
                ep = Episode(
                    show_id=show1.id,
                    episode_number=num,
                    title=title,
                    input_type="quick_idea",
                    creative_input={"show_id": show1.id, "title": title, "idea": idea, "duration_seconds": 45},
                    status="draft",
                    target_duration_seconds=45,
                    aspect_ratio="9:16",
                    style_profile_id=style1.id,
                )
                db.add(ep)
            db.commit()

            # 3. Show 2: The Lucky Wallet
            show2 = Show(
                workspace_id=workspace.id,
                title="The Lucky Wallet",
                slug="the-lucky-wallet",
                premise=(
                    "A broke delivery rider finds a wallet that produces money whenever they act selfishly - "
                    "and empties whenever they help someone. Every episode is one delivery, one temptation, "
                    "and one visible moral choice."
                ),
                status="active",
                default_aspect_ratio="9:16",
                default_duration_seconds=45,
            )
            db.add(show2)
            db.commit()
            db.refresh(show2)

            style2 = StyleProfile(
                show_id=show2.id,
                name="Cinematic Stylized 3D",
                animation_style="Cinematic Stylized 3D",
                canonical_prompt=(
                    "Rain-slick neon city, warm gold glow reserved for the wallet money, cool blue-grey streets. "
                    "The wallet is always the most saturated object in frame."
                ),
                negative_prompt="photorealistic, text, watermark, low quality, dialogue, lip-sync",
            )
            db.add(style2)
            db.commit()
            db.refresh(style2)
            show2.default_style_profile_id = style2.id
            db.commit()

            c4 = Character(
                show_id=show2.id,
                name="Remy",
                canonical_description=(
                    "Wiry delivery rider, patched red windbreaker, tired hopeful eyes, courier bag with a broken buckle. "
                    "Signature behavior: weighs the wallet in one hand before every decision."
                ),
            )
            c5 = Character(
                show_id=show2.id,
                name="The Wallet",
                canonical_description=(
                    "Worn brown leather wallet with a faint gold seam that glows when it fills. "
                    "Its clasp opens by itself when temptation is near. The most saturated object in every frame."
                ),
            )
            db.add_all([c4, c5])
            db.commit()

            ep_wallet = Episode(
                show_id=show2.id,
                episode_number=1,
                title="The First Find",
                input_type="quick_idea",
                creative_input={
                    "show_id": show2.id,
                    "title": "The First Find",
                    "duration_seconds": 45,
                    "idea": (
                        "Remy finds the wallet in the rain beside a crashed bicycle. Returning a dropped banknote to a "
                        "stranger makes the wallet visibly lighter - keeping one makes it heavier. Remy notices, and the clasp clicks open on its own."
                    ),
                },
                status="draft",
                target_duration_seconds=45,
                aspect_ratio="9:16",
                style_profile_id=style2.id,
            )
            db.add(ep_wallet)
            db.commit()

            print("[Database] Demo shows (Fruitful Secrets & The Lucky Wallet) seeded successfully.")
        finally:
            db.close()
    except Exception as e:
        print(f"[Database] Error during init_and_seed_db: {e}")

