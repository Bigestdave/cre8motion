import os
import shutil

ARTIFACTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "artifacts")

def get_artifact_path(relative_path: str) -> str:
    return os.path.join(ARTIFACTS_DIR, relative_path)

os.makedirs(ARTIFACTS_DIR, exist_ok=True)


def resolve_ffmpeg() -> str | None:
    """Locate the ffmpeg binary.

    Order: explicit FFMPEG_PATH env override, then PATH lookup. Returns an
    absolute path (or bare 'ffmpeg') when found, else None. This lets a freshly
    installed ffmpeg be used without restarting the shell for the new PATH.
    """
    override = os.environ.get("FFMPEG_PATH")
    if not override:
        try:
            from app.core.config import settings
            override = settings.FFMPEG_PATH
        except Exception:
            override = ""
    if override and os.path.isfile(override):
        return override
    found = shutil.which("ffmpeg")
    if found:
        return found
    return None

