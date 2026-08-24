"""Production orchestration services and background workers."""
import asyncio
import os
import logging
from datetime import datetime, timedelta
from app.db.session import SessionLocal
from app.models.production import ProductionRun, Shot, GenerationAttempt
from app.models.episode import Episode
from app.models.system import Artifact
from app.core.storage import get_artifact_path
from app.schemas.state_machine import ProductionStage
from app.services.events import emit_event
from app.services.assembly import assemble_production
from app.services.quality import final_qc
from app.services.demo_media import create_stage_video
from app.services.budget import debit, COST_TABLE
from app.providers.qwen import QwenVideoProvider

logger = logging.getLogger("cre8motion.poller")
video_provider = QwenVideoProvider()


async def check_and_process_pending_videos():
    """Single polling pass over all pending productions."""
    db = SessionLocal()
    try:
        pending_runs = (
            db.query(ProductionRun)
            .filter(
                ProductionRun.status == "in_production",
                ProductionRun.current_stage.in_([
                    ProductionStage.VIDEO_GENERATION.value,
                    ProductionStage.VIDEO_QC.value,
                    ProductionStage.AUDIO_GENERATION.value,
                ])
            )
            .all()
        )

        for run in pending_runs:
            shots = (
                db.query(Shot)
                .filter(Shot.production_run_id == run.id)
                .order_by(Shot.sequence_number)
                .all()
            )
            if not shots:
                continue

            all_shots_ready = True
            for shot in shots:
                if shot.approved_video_artifact_id:
                    continue

                attempt = (
                    db.query(GenerationAttempt)
                    .filter(
                        GenerationAttempt.shot_id == shot.id,
                        GenerationAttempt.operation == "video_generation",
                    )
                    .order_by(GenerationAttempt.started_at.desc())
                    .first()
                )

                if not attempt or not attempt.provider_request_id or attempt.provider_request_id == "mock_task":
                    video_key = f"productions/{run.id}/shots/{shot.sequence_number:02d}/clip.mp4"
                    create_stage_video(
                        video_key,
                        f"Animation · Shot {shot.sequence_number:02d}",
                        shot.sequence_number,
                        int(shot.duration_seconds or 5),
                    )
                    art = Artifact(
                        production_run_id=run.id,
                        shot_id=shot.id,
                        artifact_type="video_clip",
                        storage_key=video_key,
                        mime_type="video/mp4",
                        duration_seconds=int(shot.duration_seconds or 5),
                        status="demo_placeholder",
                    )
                    db.add(art)
                    db.commit()
                    db.refresh(art)

                    shot.approved_video_artifact_id = art.id
                    shot.status = "video_approved"
                    db.commit()

                    emit_event(db, "shot_video_ready", run.id, {
                        "shot_id": shot.id,
                        "status": "demo_placeholder",
                        "message": f"Shot {shot.sequence_number:02d}: placeholder clip generated.",
                    }, shot_id=shot.id)
                    continue

                task_id = attempt.provider_request_id
                res = await asyncio.to_thread(video_provider.poll_video_task, task_id)
                status = res.get("status")

                is_timed_out = attempt.started_at and (datetime.utcnow() - attempt.started_at > timedelta(minutes=15))

                if status == "SUCCEEDED" and res.get("video_url"):
                    video_key = f"productions/{run.id}/shots/{shot.sequence_number:02d}/clip.mp4"
                    video_path = get_artifact_path(video_key)
                    os.makedirs(os.path.dirname(video_path), exist_ok=True)
                    await asyncio.to_thread(video_provider.download_video, res["video_url"], video_path)

                    art_status = "approved" if (os.path.isfile(video_path) and os.path.getsize(video_path) > 0) else "demo_placeholder"
                    art = Artifact(
                        production_run_id=run.id,
                        shot_id=shot.id,
                        artifact_type="video_clip",
                        storage_key=video_key,
                        mime_type="video/mp4",
                        duration_seconds=int(shot.duration_seconds or 5),
                        status=art_status,
                    )
                    db.add(art)
                    db.commit()
                    db.refresh(art)

                    shot.approved_video_artifact_id = art.id
                    shot.status = "video_approved"
                    attempt.status = "succeeded"
                    attempt.result_artifact_id = art.id
                    db.commit()

                    debit(db, run.id, "VIDEO", "video_generation", COST_TABLE['video_generation_per_sec'] * 5, shot.id)
                    emit_event(db, "shot_video_ready", run.id, {
                        "shot_id": shot.id,
                        "status": art_status,
                        "message": f"Shot {shot.sequence_number:02d}: animation clip ready.",
                    }, shot_id=shot.id)

                elif status == "FAILED" or is_timed_out:
                    video_key = f"productions/{run.id}/shots/{shot.sequence_number:02d}/clip.mp4"
                    create_stage_video(
                        video_key,
                        f"Animation · Shot {shot.sequence_number:02d}",
                        shot.sequence_number,
                        int(shot.duration_seconds or 5),
                    )
                    art = Artifact(
                        production_run_id=run.id,
                        shot_id=shot.id,
                        artifact_type="video_clip",
                        storage_key=video_key,
                        mime_type="video/mp4",
                        duration_seconds=int(shot.duration_seconds or 5),
                        status="demo_placeholder",
                    )
                    db.add(art)
                    db.commit()
                    db.refresh(art)

                    shot.approved_video_artifact_id = art.id
                    shot.status = "video_approved"
                    attempt.status = "failed"
                    attempt.result_artifact_id = art.id
                    db.commit()

                    emit_event(db, "shot_video_ready", run.id, {
                        "shot_id": shot.id,
                        "status": "demo_placeholder",
                        "message": f"Shot {shot.sequence_number:02d}: animation completed with placeholder clip.",
                    }, shot_id=shot.id)
                else:
                    all_shots_ready = False

            if all_shots_ready:
                run.current_stage = ProductionStage.ASSEMBLY.value
                db.commit()
                emit_event(db, "stage_changed", run.id, {
                    "new_stage": ProductionStage.ASSEMBLY.value,
                    "message": "All clips ready. Assembling final episode cut...",
                })

                final_art = assemble_production(db, run.id)
                if final_art:
                    run.current_stage = ProductionStage.FINAL_QC.value
                    db.commit()
                    emit_event(db, "stage_changed", run.id, {
                        "new_stage": ProductionStage.FINAL_QC.value,
                        "message": "Running final quality check on full episode cut...",
                    })

                    episode = db.query(Episode).filter(Episode.id == run.episode_id).first()
                    brief = (episode.creative_input if episode and episode.creative_input else {})
                    final_qc(db, run.id, get_artifact_path(final_art.storage_key), brief)

                run.current_stage = ProductionStage.READY_FOR_REVIEW.value
                run.status = "needs_review"
                run.completed_at = datetime.utcnow()
                db.commit()

                emit_event(db, "stage_changed", run.id, {
                    "new_stage": ProductionStage.READY_FOR_REVIEW.value,
                    "message": "Episode assembled and ready for review.",
                })
                emit_event(db, "production_completed", run.id, {
                    "stage": run.current_stage,
                    "message": "Production completed successfully.",
                })
                print(f"[Poller] Production {run.id} assembled and marked READY_FOR_REVIEW.")
    except Exception as e:
        logger.error(f"Error in check_and_process_pending_videos: {e}", exc_info=True)
    finally:
        db.close()


async def start_video_poller_loop():
    """Background polling loop started on FastAPI startup."""
    print("[Poller] Starting background video polling loop (interval: 15s)...")
    while True:
        try:
            await check_and_process_pending_videos()
        except Exception as exc:
            print(f"[Poller] Unexpected error in polling loop: {exc}")
        await asyncio.sleep(15)

