import os

ARTIFACTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "artifacts")

def get_artifact_path(relative_path: str) -> str:
    return os.path.join(ARTIFACTS_DIR, relative_path)

os.makedirs(ARTIFACTS_DIR, exist_ok=True)
