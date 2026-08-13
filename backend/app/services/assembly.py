import os
import subprocess
import uuid
from sqlalchemy.orm import Session
from app.models.production import ProductionRun, Shot
from app.models.system import Artifact
from app.core.storage import get_artifact_path, resolve_ffmpeg
from app.services.events import emit_event


FFMPEG = resolve_ffmpeg() or "ffmpeg"


def _ffmpeg_available() -> bool:
    return resolve_ffmpeg() is not None


def _collect_clip_paths(db: Session, shots) -> list:
    """Return on-disk, non-empty approved video clip paths in shot order."""
    video_paths = []
    for shot in shots:
        if not shot.approved_video_artifact_id:
            continue
        artifact = db.query(Artifact).filter(Artifact.id == shot.approved_video_artifact_id).first()
        if not artifact:
            continue
        full_path = get_artifact_path(artifact.storage_key)
        if os.path.isfile(full_path) and os.path.getsize(full_path) > 0:
            video_paths.append(full_path)
    return video_paths


def _collect_keyframe_specs(db: Session, shots) -> list:
    """Return (keyframe_path, duration) pairs for a slideshow fallback."""
    specs = []
    for shot in shots:
        if not shot.approved_keyframe_artifact_id:
            continue
        artifact = db.query(Artifact).filter(Artifact.id == shot.approved_keyframe_artifact_id).first()
        if not artifact:
            continue
        full_path = get_artifact_path(artifact.storage_key)
        if os.path.isfile(full_path) and os.path.getsize(full_path) > 0:
            specs.append((full_path, max(int(shot.duration_seconds or 5), 1)))
    return specs


def _concat_clips(video_paths: list, production_id: str, final_video_path: str) -> bool:
    """Stream-copy concat of same-codec clips. Returns True on success."""
    concat_list_path = get_artifact_path(f"productions/{production_id}/concat.txt")
    os.makedirs(os.path.dirname(concat_list_path), exist_ok=True)
    with open(concat_list_path, "w", encoding="utf-8") as f:
        for path in video_paths:
            clean_path = os.path.abspath(path).replace("\\", "/")
            f.write(f"file '{clean_path}'\n")

    cmd = [
        FFMPEG, "-y", "-f", "concat", "-safe", "0",
        "-i", os.path.abspath(concat_list_path),
        "-c", "copy",
        os.path.abspath(final_video_path),
    ]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return True
    except (FileNotFoundError, subprocess.CalledProcessError) as e:
        stderr = getattr(e, "stderr", b"") or b""
        print(f"Concat stream-copy failed ({stderr[:200]!r}); retrying with re-encode.")
        cmd_reencode = [
            FFMPEG, "-y", "-f", "concat", "-safe", "0",
            "-i", os.path.abspath(concat_list_path),
            "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,"
                   "pad=1080:1920:(ow-iw)/2:(oh-ih)/2,format=yuv420p",
            "-r", "24", "-c:v", "libx264",
            os.path.abspath(final_video_path),
        ]
        try:
            subprocess.run(cmd_reencode, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            return True
        except (FileNotFoundError, subprocess.CalledProcessError) as e2:
            print(f"Concat re-encode also failed: {getattr(e2, 'stderr', b'')[:200]!r}")
            return False


def _slideshow_from_keyframes(specs: list, final_video_path: str) -> bool:
    """Build a Ken-Burns-free slideshow MP4 from keyframes when no clips exist."""
    concat_list_path = os.path.join(os.path.dirname(final_video_path), "slideshow.txt")
    os.makedirs(os.path.dirname(concat_list_path), exist_ok=True)
    with open(concat_list_path, "w", encoding="utf-8") as f:
        for path, duration in specs:
            clean_path = os.path.abspath(path).replace("\\", "/")
            f.write(f"file '{clean_path}'\n")
            f.write(f"duration {duration}\n")
        # ffmpeg concat demuxer needs the last image repeated (without duration).
        if specs:
            clean_path = os.path.abspath(specs[-1][0]).replace("\\", "/")
            f.write(f"file '{clean_path}'\n")

    cmd = [
        FFMPEG, "-y", "-f", "concat", "-safe", "0",
        "-i", os.path.abspath(concat_list_path),
        "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,"
               "pad=1080:1920:(ow-iw)/2:(oh-ih)/2,format=yuv420p",
        "-r", "24", "-c:v", "libx264",
        os.path.abspath(final_video_path),
    ]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return True
    except (FileNotFoundError, subprocess.CalledProcessError) as e:
        print(f"Slideshow build failed: {getattr(e, 'stderr', b'')[:200]!r}")
        return False


def assemble_production(db: Session, production_id: str):
    """Combine approved clips into one episode MP4.

    Never silently yields nothing: falls back to a keyframe slideshow so the
    website always has a playable final video, and emits an event explaining
    which path was taken.
    """
    run = db.query(ProductionRun).filter(ProductionRun.id == production_id).first()
    if not run:
        raise ValueError("Production not found")

    shots = (
        db.query(Shot)
        .filter(Shot.production_run_id == production_id)
        .order_by(Shot.sequence_number)
        .all()
    )

    final_video_key = f"productions/{production_id}/final_output_{uuid.uuid4().hex[:8]}.mp4"
    final_video_path = get_artifact_path(final_video_key)
    os.makedirs(os.path.dirname(final_video_path), exist_ok=True)

    if not _ffmpeg_available():
        emit_event(db, "assembly_skipped", production_id, {
            "reason": "ffmpeg_missing",
            "message": "Assembly skipped: ffmpeg is not installed on the server.",
        })
        return None

    video_paths = _collect_clip_paths(db, shots)
    assembly_mode = None

    if video_paths:
        if _concat_clips(video_paths, production_id, final_video_path):
            assembly_mode = "clips"
    else:
        specs = _collect_keyframe_specs(db, shots)
        if specs and _slideshow_from_keyframes(specs, final_video_path):
            assembly_mode = "keyframe_slideshow"

    if not assembly_mode or not (os.path.isfile(final_video_path) and os.path.getsize(final_video_path) > 0):
        emit_event(db, "assembly_skipped", production_id, {
            "reason": "no_playable_source",
            "message": "Assembly skipped: no playable clips or keyframes were available.",
        })
        return None

    final_artifact = Artifact(
        production_run_id=production_id,
        artifact_type="final_video",
        storage_key=final_video_key,
        mime_type="video/mp4",
        status="approved" if assembly_mode == "clips" else "demo_placeholder",
    )
    db.add(final_artifact)
    db.commit()
    db.refresh(final_artifact)

    emit_event(db, "assembly_completed", production_id, {
        "artifact_id": final_artifact.id,
        "mode": assembly_mode,
        "clip_count": len(video_paths),
        "message": (
            f"Final episode cut assembled from {len(video_paths)} approved clips."
            if assembly_mode == "clips"
            else "Final cut assembled as a keyframe slideshow (no animated clips available)."
        ),
    })
    return final_artifact
