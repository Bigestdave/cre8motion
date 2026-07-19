import asyncio
import traceback
from app.db.session import SessionLocal
from app.models.production import ProductionRun, Shot, GenerationAttempt
from app.models.episode import Episode
from app.models.show import Show, CharacterReference
from app.models.system import Artifact, BudgetLedger
from app.core.config import settings
from app.core.storage import get_artifact_path

from app.services.events import emit_event
from app.schemas.state_machine import ProductionStage, validate_transition
from app.services.input_normalizer import normalize_creative_input
from app.services.planning import create_episode_plan
from app.services.prompt_compiler import compile_storyboard_prompt, compile_keyframe_prompt, compile_video_prompt
from app.services.budget import create_ledger, debit, check_budget, COST_TABLE
from app.services.reference_resolver import resolve_references
from app.services.assembly import assemble_production
from app.services.demo_media import create_stage_image, create_stage_video
from app.services.quality import review_storyboard, review_keyframe, review_video, final_qc
from app.services.retry import should_retry, diagnose_and_retry

from app.providers.qwen import QwenImageProvider, QwenVideoProvider
image_provider = QwenImageProvider()
video_provider = QwenVideoProvider()


async def wait_for_generation(poll, task_id: str, timeout_seconds: int = 180) -> dict:
    """Poll a provider task without blocking the event loop indefinitely."""
    if not task_id or task_id == "mock_task":
        return {"status": "FAILED"}

    deadline = asyncio.get_running_loop().time() + timeout_seconds
    while asyncio.get_running_loop().time() < deadline:
        result = poll(task_id)
        if result.get("status") in {"SUCCEEDED", "FAILED"}:
            return result
        await asyncio.sleep(5)
    return {"status": "TIMED_OUT"}


async def execute_production_pipeline(production_id: str):
    db = SessionLocal()
    try:
        run = db.query(ProductionRun).filter(ProductionRun.id == production_id).first()
        if not run:
            return
            
        def transition(new_stage: ProductionStage):
            try:
                current = ProductionStage(run.current_stage)
            except ValueError:
                current = ProductionStage.CREATED
            
            if not validate_transition(current, new_stage):
                print(f"Warning: Invalid transition from {current} to {new_stage}")
                
            run.current_stage = new_stage.value
            db.commit()
            emit_event(db, "stage_changed", run.id, {"new_stage": new_stage.value})

        episode = db.query(Episode).filter(Episode.id == run.episode_id).first()
        show = db.query(Show).filter(Show.id == episode.show_id).first()
        
        if not db.query(BudgetLedger).filter_by(production_run_id=run.id).first():
            create_ledger(db, run.id, run.budget_limit or 100)
        run.status = "in_production"
        db.commit()

        # 1. Normalizing
        transition(ProductionStage.NORMALIZING_INPUT)
        brief = normalize_creative_input(episode.creative_input)
        debit(db, run.id, "NORMALIZING", "reasoning", COST_TABLE['reasoning_tokens_per_1k'])
        
        # 2. Planning
        transition(ProductionStage.PLANNING)
        shots = create_episode_plan(db, run.id, brief)
        debit(db, run.id, "PLANNING", "reasoning", COST_TABLE['reasoning_tokens_per_1k'])

        transition(ProductionStage.PLAN_VALIDATION)

        # 3. Reference Resolution

        transition(ProductionStage.REFERENCE_RESOLUTION)
        manifest = resolve_references(db, show.id, [])
        if not manifest.get("characters_ready"):
            transition(ProductionStage.FAILED)
            return

        # Fetch references
        char_refs = db.query(CharacterReference).all()
        ref_urls = []
        for ref in char_refs:
            art = db.query(Artifact).filter(Artifact.id == ref.artifact_id).first()
            if art:
                ref_urls.append(get_artifact_path(art.storage_key))

        # Load style details
        from app.models.show import StyleProfile
        style_profile = db.query(StyleProfile).filter(StyleProfile.show_id == show.id).first()
        show_style_dict = {
            "animation_style": style_profile.animation_style if style_profile else "Cinematic Stylized 3D",
            "creative_direction": style_profile.canonical_prompt if style_profile else "Cinematic lighting, polished"
        }

        # 4. Storyboard
        transition(ProductionStage.SHOT_PLANNING)
        transition(ProductionStage.STORYBOARD_GENERATION)
        from app.services.prompt_compiler import CINEMATIC_3D_NEGATIVE, GRAPHIC_25D_NEGATIVE
        style_name = str(show_style_dict["animation_style"]).lower()
        neg_prompt = GRAPHIC_25D_NEGATIVE if ("2.5d" in style_name or "graphic" in style_name or "illustrated" in style_name) else CINEMATIC_3D_NEGATIVE

        for shot in shots:
            shot_spec = {
                "sequence_number": f"S{shot.sequence_number:02d}",
                "story_function": shot.story_function,
                "camera": shot.camera,
                "keyframe_prompt": shot.keyframe_prompt,
                "primary_emotion": shot.environment.get("primary_emotion") if isinstance(shot.environment, dict) else "",
                "character_expression": shot.environment.get("character_expression") if isinstance(shot.environment, dict) else "",
                "important_prop": shot.environment.get("props")[0] if isinstance(shot.environment, dict) and shot.environment.get("props") else "",
                "prop_state": shot.environment.get("prop_state") if isinstance(shot.environment, dict) else "",
                "continuity_locks": shot.continuity_requirements
            }
            prompt = compile_storyboard_prompt(
                shot_spec=shot_spec,
                show_style=show_style_dict,
                character_refs=ref_urls,
                location_ref=shot.location_id
            )
            # Use Qwen Image 2.0 (Fast/Cheap) with compiled style rules
            task = image_provider.generate_storyboard(prompt, negative_prompt=neg_prompt)
            res = await wait_for_generation(image_provider.poll_image_task, task.get("task_id", ""))

            storyboard_key = f"productions/{run.id}/shots/{shot.sequence_number:02d}/storyboard.png"
            storyboard_path = get_artifact_path(storyboard_key)
            if res.get("status") == "SUCCEEDED" and res.get("image_url"):
                image_provider.download_image(res["image_url"], storyboard_path)
                artifact_status = "approved"
            else:
                create_stage_image(storyboard_key, f"Storyboard · Shot {shot.sequence_number:02d}", shot.sequence_number)
                artifact_status = "demo_placeholder"
            artifact = Artifact(
                production_run_id=run.id,
                shot_id=shot.id,
                artifact_type="storyboard",
                storage_key=storyboard_key,
                mime_type="image/png",
                status=artifact_status,
            )
            db.add(artifact)
            db.commit()
            db.refresh(artifact)
            shot.approved_storyboard_artifact_id = artifact.id
            shot.status = "storyboard_approved"
            db.commit()
            debit(db, run.id, "STORYBOARD", "image_generation", COST_TABLE['storyboard_image'], shot.id)

        transition(ProductionStage.STORYBOARD_QC)
        for shot in shots:
            review_storyboard(db, run.id, shot.id, "mock_path", {})
            debit(db, run.id, "STORYBOARD_QC", "vision_review", COST_TABLE['vision_review'], shot.id)

        # 5. Keyframe
        transition(ProductionStage.KEYFRAME_GENERATION)
        for shot in shots:
            shot_spec = {
                "sequence_number": f"S{shot.sequence_number:02d}",
                "story_function": shot.story_function,
                "camera": shot.camera,
                "keyframe_prompt": shot.keyframe_prompt,
                "primary_emotion": shot.environment.get("primary_emotion") if isinstance(shot.environment, dict) else "",
                "character_expression": shot.environment.get("character_expression") if isinstance(shot.environment, dict) else "",
                "important_prop": shot.environment.get("props")[0] if isinstance(shot.environment, dict) and shot.environment.get("props") else "",
                "prop_state": shot.environment.get("prop_state") if isinstance(shot.environment, dict) else "",
                "continuity_locks": shot.continuity_requirements
            }
            prompt = compile_keyframe_prompt(
                shot_spec=shot_spec,
                show_style=show_style_dict,
                character_refs=ref_urls,
                location_ref=shot.location_id
            )
            # Use Wan 2.7 Image Pro with compiled visual memory and negative prompt
            task = image_provider.generate_keyframe(prompt, ref_urls, negative_prompt=neg_prompt)
            res = await wait_for_generation(image_provider.poll_image_task, task.get("task_id", ""))

            keyframe_key = f"productions/{run.id}/shots/{shot.sequence_number:02d}/keyframe.png"
            keyframe_path = get_artifact_path(keyframe_key)
            if res.get("status") == "SUCCEEDED" and res.get("image_url"):
                image_provider.download_image(res["image_url"], keyframe_path)
                artifact_status = "approved"
            else:
                create_stage_image(keyframe_key, f"Keyframe · Shot {shot.sequence_number:02d}", shot.sequence_number)
                artifact_status = "demo_placeholder"
            artifact = Artifact(
                production_run_id=run.id,
                shot_id=shot.id,
                artifact_type="keyframe",
                storage_key=keyframe_key,
                mime_type="image/png",
                status=artifact_status,
            )
            db.add(artifact)
            db.commit()
            db.refresh(artifact)
            shot.approved_keyframe_artifact_id = artifact.id
            shot.status = "keyframe_approved"
            db.commit()
            debit(db, run.id, "KEYFRAME", "image_generation", COST_TABLE['keyframe_image'], shot.id)

        transition(ProductionStage.KEYFRAME_QC)
        for shot in shots:
            review_keyframe(db, run.id, shot.id, "mock_path", {}, ref_urls)
            debit(db, run.id, "KEYFRAME_QC", "vision_review", COST_TABLE['vision_review'], shot.id)

        # 6. Video
        transition(ProductionStage.VIDEO_GENERATION)
        for shot in shots:
            if not check_budget(db, run.id, COST_TABLE['video_generation_per_sec'] * 5):
                transition(ProductionStage.PAUSED)
                emit_event(db, "budget_exhausted", run.id, {"shot_id": shot.id})
                return

            prompt = compile_video_prompt({"motion_prompt": shot.motion_prompt or shot.story_function})
            keyframe_artifact = db.query(Artifact).filter(Artifact.id == shot.approved_keyframe_artifact_id).first()
            keyframe_url = (
                f"{settings.PUBLIC_API_BASE_URL.rstrip('/')}/media/{keyframe_artifact.storage_key}"
                if keyframe_artifact and settings.PUBLIC_API_BASE_URL
                else ""
            )
            # Qwen Cloud can fetch a deployed public HTTPS URL. Without one, use the explicit local demo fallback.
            task = video_provider.generate_i2v(keyframe_url, prompt) if keyframe_url else {"task_id": "mock_task", "status": "FAILED"}
            res = await wait_for_generation(video_provider.poll_video_task, task.get("task_id", ""), timeout_seconds=600)

            video_key = f"productions/{run.id}/shots/{shot.sequence_number:02d}/clip.mp4"
            video_path = get_artifact_path(video_key)
            if res.get("status") == "SUCCEEDED" and res.get("video_url"):
                video_provider.download_video(res["video_url"], video_path)
                artifact_status = "approved"
            else:
                create_stage_video(video_key, f"Animation · Shot {shot.sequence_number:02d}", shot.sequence_number, int(shot.duration_seconds or 5))
                artifact_status = "demo_placeholder"
            art = Artifact(
                production_run_id=run.id,
                shot_id=shot.id,
                artifact_type="video_clip",
                storage_key=video_key,
                mime_type="video/mp4",
                duration_seconds=int(shot.duration_seconds or 5),
                status=artifact_status,
            )
            db.add(art)
            db.commit()
            db.refresh(art)

            shot.approved_video_artifact_id = art.id
            shot.status = "video_approved"
            db.commit()
            debit(db, run.id, "VIDEO", "video_generation", COST_TABLE['video_generation_per_sec'] * 5, shot.id)

        transition(ProductionStage.VIDEO_QC)
        for shot in shots:
            report = review_video(db, run.id, shot.id, "mock_path", {})
            debit(db, run.id, "VIDEO_QC", "vision_review", COST_TABLE['vision_review'], shot.id)
            
            if report.status == "failed" and should_retry(db, shot.id):
                plan = diagnose_and_retry(db, run.id, shot.id, {"score": report.overall_score}, "mock_prompt")
                emit_event(db, "selective_retry", run.id, {"shot_id": shot.id, "plan": plan})

        transition(ProductionStage.AUDIO_GENERATION)

        # 7. Assembly
        transition(ProductionStage.ASSEMBLY)
        final_art = assemble_production(db, run.id)

        # 8. Final QC
        transition(ProductionStage.FINAL_QC)
        if final_art:
            final_qc(db, run.id, get_artifact_path(final_art.storage_key), brief)

        transition(ProductionStage.READY_FOR_REVIEW)
        run.status = "needs_review"
        db.commit()
        emit_event(db, "production_completed", run.id, {"stage": run.current_stage})

    except Exception as e:
        print(f"Pipeline failed: {traceback.format_exc()}")
        run.status = "failed"
        run.failure_reason = str(e)
        db.commit()
        emit_event(db, "production_failed", run.id, {"error": str(e)})
    finally:
        db.close()
