import os
import subprocess
from pathlib import Path

from app.core.storage import get_artifact_path


def create_stage_image(storage_key: str, label: str, sequence_number: int) -> str:
    """Create a local placeholder only when a cloud asset is unavailable in demo mode."""
    output_path = get_artifact_path(storage_key)
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    color = ["#29485f", "#6a4730", "#4e6540", "#70504e", "#57466a", "#647139"][sequence_number % 6]
    filter_graph = (
        f"color=c={color}:s=1080x1920,"
        f"drawbox=x=54:y=54:w=972:h=1812:color=white@0.22:t=3,"
        f"drawtext=text='{label}':fontcolor=white:fontsize=62:x=(w-text_w)/2:y=(h-text_h)/2,"
        f"drawtext=text='Local demo placeholder':fontcolor=white@0.8:fontsize=34:x=(w-text_w)/2:y=h-180"
    )
    command = ["ffmpeg", "-y", "-f", "lavfi", "-i", filter_graph, "-frames:v", "1", output_path]
    try:
        subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except (FileNotFoundError, subprocess.CalledProcessError):
        # A valid one-pixel PNG preserves the artifact API contract if FFmpeg is not installed.
        with open(output_path, "wb") as image_file:
            image_file.write(
                bytes.fromhex(
                    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489"
                    "0000000d49444154789c6360f8cfc0000004010100a7f789d30000000049454e44ae426082"
                )
            )
    return output_path


def create_stage_video(storage_key: str, label: str, sequence_number: int, duration_seconds: int) -> str:
    """Create a playable local MP4 placeholder only when a cloud clip is unavailable."""
    output_path = get_artifact_path(storage_key)
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    color = ["#29485f", "#6a4730", "#4e6540", "#70504e", "#57466a", "#647139"][sequence_number % 6]
    filter_graph = (
        f"color=c={color}:s=1080x1920:r=24,"
        f"drawbox=x=54:y=54:w=972:h=1812:color=white@0.22:t=3,"
        f"drawtext=text='{label}':fontcolor=white:fontsize=62:x=(w-text_w)/2:y=(h-text_h)/2,"
        f"drawtext=text='Local demo placeholder':fontcolor=white@0.8:fontsize=34:x=(w-text_w)/2:y=h-180"
    )
    command = [
        "ffmpeg", "-y", "-f", "lavfi", "-i", filter_graph,
        "-t", str(max(duration_seconds, 1)), "-pix_fmt", "yuv420p",
        "-c:v", "libx264", output_path,
    ]
    try:
        subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except (FileNotFoundError, subprocess.CalledProcessError):
        # The browser falls back to the associated keyframe preview when local FFmpeg is unavailable.
        # Production Docker/ECS installs FFmpeg, so deployed demo clips remain playable MP4 files.
        Path(output_path).touch()
    return output_path
