import asyncio
import os
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

# Artifacts up to this size are mirrored into the Artifact.data DB column so they
# survive Render's ephemeral disk (matches app/api/artwork.py _store_artifact).
MAX_DB_ARTIFACT_BYTES = 20 * 1024 * 1024

STAGE_MESSAGES = {
    ProductionStage.NORMALIZING_INPUT: "Normalizing the creative input into a structured episode brief.",
    ProductionStage.PLANNING: "Planning the episode: scene breakdown and shot list via qwen-max.",
    ProductionStage.PLAN_VALIDATION: "Validating the generated production plan.",
    ProductionStage.REFERENCE_RESOLUTION: "Resolving character and location references.",
    ProductionStage.SHOT_PLANNING: "Finalizing per-shot specifications.",
    ProductionStage.STORYBOARD_GENERATION: "Generating storyboard frames (wan2.2-t2i-flash).",
    ProductionStage.STORYBOARD_QC: "Reviewing storyboard frames for quality and continuity.",
    ProductionStage.KEYFRAME_GENERATION: "Generating high-detail keyframes (wan2.5-t2i-preview).",
    ProductionStage.KEYFRAME_QC: "Reviewing keyframes against character references.",
    ProductionStage.VIDEO_GENERATION: "Animating shots (happyhorse-1.1 i2v/t2v).",
    ProductionStage.VIDEO_QC: "Reviewing generated video clips.",
    ProductionStage.AUDIO_GENERATION: "Preparing audio cues.",
    ProductionStage.ASSEMBLY: "Assembling approved clips into the final episode cut.",
    ProductionStage.FINAL_QC: "Final narrative quality review of the assembled episode.",
    ProductionStage.READY_FOR_REVIEW: "Episode assembled and ready for human review.",
    ProductionStage.PAUSED: "Production paused (budget exhausted or manual pause).",
    ProductionStage.FAILED: "Production failed.",
}


def _persist_artifact_bytes(artifact: Artifact, local_path: str, max_bytes: int = MAX_DB_ARTIFACT_BYTES):
    """Mirror generated file bytes into Artifact.data so they survive redeploys."""
    try:
        if os.path.isfile(local_path):
            size = os.path.getsize(local_path)
            artifact.file_size_bytes = size
            if 0 < size <= max_bytes:
                with open(local_path, "rb") as f:
                    artifact.data = f.read()
    except OSError as exc:
        print(f"Warning: could not persist artifact bytes for {local_path}: {exc}")


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
            emit_event(db, "stage_changed", run.id, {
                "new_stage": new_stage.value,
                "previous_stage": current.value,
                "message": STAGE_MESSAGES.get(new_stage, new_stage.value),
            })

        episode = db.query(Episode).filter(Episode.id == run.episode_id).first()
        if not episode:
            raise ValueError(f"Episode {run.episode_id} not found for production {run.id}")
        show = db.query(Show).filter(Show.id == episode.show_id).first()
        if not show:
            raise ValueError(f"Show {episode.show_id} not found for episode {episode.id}")

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
        emit_event(db, "plan_created", run.id, {
            "shot_count": len(shots),
            "message": f"Episode plan created with {len(shots)} shots.",
        })

        transition(ProductionStage.PLAN_VALIDATION)

        # 3. Reference Resolution

        transition(ProductionStage.REFERENCE_RESOLUTION)
        manifest = resolve_references(db, show.id, [])
        if not manifest.get("characters_ready"):
            transition(ProductionStage.FAILED)
            run.status = "failed"
            run.failure_reason = "Character references are not ready"
            db.commit()
            emit_event(db, "production_failed", run.id, {
                "error": "Character references are not ready",
                "message": "Production failed: character references are missing.",
            })
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

        def build_shot_spec(shot):
            environment = shot.environment if isinstance(shot.environment, dict) else {}
            props = environment.get("props") or []
            return {
                "sequence_number": f"S{shot.sequence_number:02d}",
                "story_function": shot.story_function,
                "camera": shot.camera if isinstance(shot.camera, dict) else {},
                "keyframe_prompt": shot.keyframe_prompt,
                "primary_emotion": environment.get("primary_emotion") or "",
                "character_expression": environment.get("character_expression") or "",
                "important_prop": props[0] if props else "",
                "prop_state": environment.get("prop_state") or "",
                "continuity_locks": shot.continuity_requirements or [],
            }

        def shot_location(shot):
            environment = shot.environment if isinstance(shot.environment, dict) else {}
            return environment.get("location_name") or shot.location_id

        for shot in shots:
            shot_spec = build_shot_spec(shot)
            prompt = compile_storyboard_prompt(
                shot_spec=shot_spec,
                show_style=show_style_dict,
                character_refs=ref_urls,
                location_ref=shot_location(shot)
            )
            # Storyboards use wan2.2-t2i-flash (fast/cheap) with compiled style rules.
            task = image_provider.generate_storyboard(prompt, negative_prompt=neg_prompt)
            res = await wait_for_generation(image_provider.poll_image_task, task.get("task_id", ""))

            storyboard_key = f"productions/{run.id}/shots/{shot.sequence_number:02d}/storyboard.png"
            storyboard_path = get_artifact_path(storyboard_key)
            os.makedirs(os.path.dirname(storyboard_path), exist_ok=True)
            if res.get("status") == "SUCCEEDED" and res.get("image_url"):
                image_provider.download_image(res["image_url"], storyboard_path)
                artifact_status = "approved"
            else:
                create_stage_image(storyboard_key, f"Storyboard · Shot {shot.sequence_number:02d}", shot.sequence_number)
                artifact_status = "demo_placeholder"
                emit_event(db, "shot_generation_fallback", run.id, {
                    "shot_id": shot.id,
                    "stage": "STORYBOARD_GENERATION",
                    "provider_status": res.get("status"),
                    "message": f"Shot {shot.sequence_number:02d}: storyboard generation failed ({res.get('status')}); placeholder used.",
                }, shot_id=shot.id)
            artifact = Artifact(
                production_run_id=run.id,
                shot_id=shot.id,
                artifact_type="storyboard",
                storage_key=storyboard_key,
                mime_type="image/png",
                status=artifact_status,
            )
            _persist_artifact_bytes(artifact, storyboard_path)
            db.add(artifact)
            db.commit()
            db.refresh(artifact)
            shot.approved_storyboard_artifact_id = artifact.id
            shot.status = "storyboard_approved"
            db.commit()
            debit(db, run.id, "STORYBOARD", "image_generation", COST_TABLE['storyboard_image'], shot.id)
            emit_event(db, "shot_storyboard_ready", run.id, {
                "shot_id": shot.id,
                "status": artifact_status,
                "message": f"Shot {shot.sequence_number:02d}: storyboard {artifact_status}.",
            }, shot_id=shot.id)

        transition(ProductionStage.STORYBOARD_QC)
        for shot in shots:
            review_storyboard(db, run.id, shot.id, "mock_path", {})
            debit(db, run.id, "STORYBOARD_QC", "vision_review", COST_TABLE['vision_review'], shot.id)

        # 5. Keyframe
        transition(ProductionStage.KEYFRAME_GENERATION)
        # Provider-hosted keyframe URLs (valid ~24h) let i2v run without a public
        # backend URL — Qwen Cloud fetches its own OSS asset directly.
        keyframe_remote_urls = {}
        for shot in shots:
            shot_spec = build_shot_spec(shot)
            prompt = compile_keyframe_prompt(
                shot_spec=shot_spec,
                show_style=show_style_dict,
                character_refs=ref_urls,
                location_ref=shot_location(shot)
            )
            # Keyframes use wan2.5-t2i-preview with compiled visual memory and negative prompt.
            task = image_provider.generate_keyframe(prompt, ref_urls, negative_prompt=neg_prompt)
            res = await wait_for_generation(image_provider.poll_image_task, task.get("task_id", ""))

            keyframe_key = f"productions/{run.id}/shots/{shot.sequence_number:02d}/keyframe.png"
            keyframe_path = get_artifact_path(keyframe_key)
            os.makedirs(os.path.dirname(keyframe_path), exist_ok=True)
            if res.get("status") == "SUCCEEDED" and res.get("image_url"):
                image_provider.download_image(res["image_url"], keyframe_path)
                keyframe_remote_urls[shot.id] = res["image_url"]
                artifact_status = "approved"
            else:
                create_stage_image(keyframe_key, f"Keyframe · Shot {shot.sequence_number:02d}", shot.sequence_number)
                artifact_status = "demo_placeholder"
                emit_event(db, "shot_generation_fallback", run.id, {
                    "shot_id": shot.id,
                    "stage": "KEYFRAME_GENERATION",
                    "provider_status": res.get("status"),
                    "message": f"Shot {shot.sequence_number:02d}: keyframe generation failed ({res.get('status')}); placeholder used.",
                }, shot_id=shot.id)
            artifact = Artifact(
                production_run_id=run.id,
                shot_id=shot.id,
                artifact_type="keyframe",
                storage_key=keyframe_key,
                mime_type="image/png",
                status=artifact_status,
            )
            _persist_artifact_bytes(artifact, keyframe_path)
            db.add(artifact)
            db.commit()
            db.refresh(artifact)
            shot.approved_keyframe_artifact_id = artifact.id
            shot.status = "keyframe_approved"
            db.commit()
            debit(db, run.id, "KEYFRAME", "image_generation", COST_TABLE['keyframe_image'], shot.id)
            emit_event(db, "shot_keyframe_ready", run.id, {
                "shot_id": shot.id,
                "status": artifact_status,
                "message": f"Shot {shot.sequence_number:02d}: keyframe {artifact_status}.",
            }, shot_id=shot.id)

        transition(ProductionStage.KEYFRAME_QC)
        for shot in shots:
            review_keyframe(db, run.id, shot.id, "mock_path", {}, ref_urls)
            debit(db, run.id, "KEYFRAME_QC", "vision_review", COST_TABLE['vision_review'], shot.id)

        # 6. Video
        transition(ProductionStage.VIDEO_GENERATION)
        for shot in shots:
            if not check_budget(db, run.id, COST_TABLE['video_generation_per_sec'] * 5):
                transition(ProductionStage.PAUSED)
                emit_event(db, "budget_exhausted", run.id, {
                    "shot_id": shot.id,
                    "message": f"Budget exhausted before animating shot {shot.sequence_number:02d}; production paused.",
                }, shot_id=shot.id)
                return

            prompt = compile_video_prompt({"motion_prompt": shot.motion_prompt or shot.story_function})
            keyframe_artifact = db.query(Artifact).filter(Artifact.id == shot.approved_keyframe_artifact_id).first()
            # Only feed real (non-placeholder) keyframes to i2v. Prefer the
            # provider-hosted OSS URL captured at generation time (Qwen Cloud can
            # always fetch its own assets); fall back to our public media URL.
            keyframe_is_real = bool(keyframe_artifact) and keyframe_artifact.status == "approved"
            keyframe_url = ""
            if keyframe_is_real:
                keyframe_url = keyframe_remote_urls.get(shot.id, "")
                if not keyframe_url and settings.PUBLIC_API_BASE_URL:
                    keyframe_url = f"{settings.PUBLIC_API_BASE_URL.rstrip('/')}/media/{keyframe_artifact.storage_key}"

            # Prefer image-to-video from the approved keyframe; fall back to
            # text-to-video (happyhorse-1.1-t2v) from the motion prompt instead of
            # instantly failing when no usable keyframe URL exists or the i2v
            # request itself is rejected.
            video_mode = "i2v"
            task = video_provider.generate_i2v(keyframe_url, prompt) if keyframe_url else {"status": "FAILED"}
            if task.get("status") == "FAILED":
                video_mode = "t2v"
                task = video_provider.generate_t2v(prompt)
            res = await wait_for_generation(video_provider.poll_video_task, task.get("task_id", ""), timeout_seconds=600)

            video_key = f"productions/{run.id}/shots/{shot.sequence_number:02d}/clip.mp4"
            video_path = get_artifact_path(video_key)
            os.makedirs(os.path.dirname(video_path), exist_ok=True)
            if res.get("status") == "SUCCEEDED" and res.get("video_url"):
                video_provider.download_video(res["video_url"], video_path)
            # Only approve when the clip actually landed on disk — a failed
            # download (e.g. transient SSL error) must not yield an empty
            # "approved" artifact that breaks playback and assembly.
            if os.path.isfile(video_path) and os.path.getsize(video_path) > 0:
                artifact_status = "approved"
            else:
                create_stage_video(video_key, f"Animation · Shot {shot.sequence_number:02d}", shot.sequence_number, int(shot.duration_seconds or 5))
                artifact_status = "demo_placeholder"
                emit_event(db, "shot_generation_fallback", run.id, {
                    "shot_id": shot.id,
                    "stage": "VIDEO_GENERATION",
                    "mode": video_mode,
                    "provider_status": res.get("status"),
                    "message": f"Shot {shot.sequence_number:02d}: {video_mode} animation failed ({res.get('status')}); placeholder clip used.",
                }, shot_id=shot.id)
            art = Artifact(
                production_run_id=run.id,
                shot_id=shot.id,
                artifact_type="video_clip",
                storage_key=video_key,
                mime_type="video/mp4",
                duration_seconds=int(shot.duration_seconds or 5),
                status=artifact_status,
            )
            _persist_artifact_bytes(art, video_path)
            db.add(art)
            db.commit()
            db.refresh(art)

            shot.approved_video_artifact_id = art.id
            shot.status = "video_approved"
            db.commit()
            debit(db, run.id, "VIDEO", "video_generation", COST_TABLE['video_generation_per_sec'] * 5, shot.id)
            emit_event(db, "shot_video_ready", run.id, {
                "shot_id": shot.id,
                "status": artifact_status,
                "mode": video_mode,
                "message": f"Shot {shot.sequence_number:02d}: video clip {artifact_status} ({video_mode}).",
            }, shot_id=shot.id)

        transition(ProductionStage.VIDEO_QC)
        for shot in shots:
            report = review_video(db, run.id, shot.id, "mock_path", {})
            debit(db, run.id, "VIDEO_QC", "vision_review", COST_TABLE['vision_review'], shot.id)

            if report.status == "failed" and should_retry(db, shot.id):
                plan = diagnose_and_retry(db, run.id, shot.id, {"score": report.overall_score}, "mock_prompt")
                emit_event(db, "selective_retry", run.id, {
                    "shot_id": shot.id,
                    "plan": plan,
                    "message": f"Shot {shot.sequence_number:02d}: video QC failed; selective retry planned.",
                }, shot_id=shot.id)

        transition(ProductionStage.AUDIO_GENERATION)

        # 7. Assembly
        # assemble_production emits its own assembly_completed / assembly_skipped
        # event (including which path it took), so we only persist bytes here.
        transition(ProductionStage.ASSEMBLY)
        final_art = assemble_production(db, run.id)
        if final_art:
            _persist_artifact_bytes(final_art, get_artifact_path(final_art.storage_key))
            db.commit()

        # 8. Final QC
        transition(ProductionStage.FINAL_QC)
        if final_art:
            final_qc(db, run.id, get_artifact_path(final_art.storage_key), brief)

        transition(ProductionStage.READY_FOR_REVIEW)
        run.status = "needs_review"
        db.commit()
        emit_event(db, "production_completed", run.id, {
            "stage": run.current_stage,
            "message": "Production completed and ready for review.",
        })

    except Exception as e:
        tb = traceback.format_exc()
        print(f"Pipeline failed: {tb}")
        # The session may hold a failed transaction (PendingRollbackError). Without
        # this rollback the failure bookkeeping below also fails, which is exactly
        # what previously left runs silently frozen at PLANNING.
        try:
            db.rollback()
        except Exception:
            pass
        try:
            run = db.query(ProductionRun).filter(ProductionRun.id == production_id).first()
            if run:
                run.status = "failed"
                run.current_stage = ProductionStage.FAILED.value
                run.failure_reason = str(e)[:500]
                db.commit()
            emit_event(db, "production_failed", production_id, {
                "error": str(e)[:500],
                "traceback": tb[-2000:],
                "message": f"Production failed: {str(e)[:200]}",
            })
        except Exception as record_exc:
            # Last resort: a fresh session so the failure is never silent.
            print(f"Failed to record failure on existing session: {record_exc}")
            try:
                db.close()
            except Exception:
                pass
            recovery = SessionLocal()
            try:
                run = recovery.query(ProductionRun).filter(ProductionRun.id == production_id).first()
                if run:
                    run.status = "failed"
                    run.current_stage = ProductionStage.FAILED.value
                    run.failure_reason = str(e)[:500]
                    recovery.commit()
                emit_event(recovery, "production_failed", production_id, {
                    "error": str(e)[:500],
                    "traceback": tb[-2000:],
                    "message": f"Production failed: {str(e)[:200]}",
                })
            except Exception as final_exc:
                print(f"Could not record production failure at all: {final_exc}")
            finally:
                recovery.close()
    finally:
        try:
            db.close()
        except Exception:
            pass
