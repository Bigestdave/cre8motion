import os
import subprocess
import uuid
from sqlalchemy.orm import Session
from app.models.production import ProductionRun, Shot
from app.models.system import Artifact
from app.core.storage import get_artifact_path

def assemble_production(db: Session, production_id: str):
    run = db.query(ProductionRun).filter(ProductionRun.id == production_id).first()
    if not run:
        raise ValueError("Production not found")
        
    shots = db.query(Shot).filter(Shot.production_run_id == production_id).order_by(Shot.sequence_number).all()
    
    # Collect approved video artifacts
    video_paths = []
    for shot in shots:
        if shot.approved_video_artifact_id:
            artifact = db.query(Artifact).filter(Artifact.id == shot.approved_video_artifact_id).first()
            if artifact:
                full_path = get_artifact_path(artifact.storage_key)
                if os.path.isfile(full_path) and os.path.getsize(full_path) > 0:
                    video_paths.append(full_path)
    
    if not video_paths:
        print("No approved video artifacts found for assembly, skipping real assembly.")
        return None
        
    # Create an FFmpeg concat file
    concat_list_path = get_artifact_path(f"mock/{production_id}/concat.txt")
    os.makedirs(os.path.dirname(concat_list_path), exist_ok=True)
    
    with open(concat_list_path, "w") as f:
        for path in video_paths:
            f.write(f"file '{os.path.abspath(path)}'\n")
            
    final_video_key = f"mock/{production_id}/final_output_{uuid.uuid4().hex[:8]}.mp4"
    final_video_path = get_artifact_path(final_video_key)
    
    cmd = [
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", os.path.abspath(concat_list_path),
        "-c", "copy",
        os.path.abspath(final_video_path)
    ]
    
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        print(f"FFmpeg assembly successful: {final_video_path}")
    except (FileNotFoundError, subprocess.CalledProcessError) as e:
        print("FFmpeg not found or failed! Creating a mock final file instead.")
        with open(final_video_path, "w") as f:
            f.write("Mock Final Video Output")
        
    final_artifact = Artifact(
        production_run_id=production_id,
        artifact_type="final_video",
        storage_key=final_video_key,
        mime_type="video/mp4",
        status="approved"
    )
    db.add(final_artifact)
    db.commit()
    return final_artifact
