from app.providers.qwen import QwenVisionProvider
from app.models.production import QualityReport

vision = QwenVisionProvider()

def review_storyboard(db, production_id, shot_id, image_path, shot_spec):
    res = vision.review_storyboard(image_path, shot_spec)
    report = QualityReport(
        production_run_id=production_id,
        shot_id=shot_id,
        review_type="storyboard",
        status=res.get("status", "failed"),
        overall_score=res.get("overall_score", 0.0),
        review_model="qwen3-vl-plus"
    )
    db.add(report)
    db.commit()
    return report

def review_keyframe(db, production_id, shot_id, image_path, shot_spec, character_refs=None):
    res = vision.review_keyframe(image_path, shot_spec, character_refs)
    report = QualityReport(
        production_run_id=production_id,
        shot_id=shot_id,
        review_type="keyframe",
        status=res.get("status", "failed"),
        overall_score=res.get("overall_score", 0.0),
        review_model="qwen3-vl-plus"
    )
    db.add(report)
    db.commit()
    return report

def review_video(db, production_id, shot_id, video_path, shot_spec):
    res = vision.review_video_frame(video_path, shot_spec)
    report = QualityReport(
        production_run_id=production_id,
        shot_id=shot_id,
        review_type="video",
        status=res.get("status", "failed"),
        overall_score=res.get("overall_score", 0.0),
        review_model="qwen3-vl-plus"
    )
    db.add(report)
    db.commit()
    return report

def final_qc(db, production_id, video_path, episode_brief):
    res = vision.final_narrative_review(video_path, episode_brief)
    report = QualityReport(
        production_run_id=production_id,
        review_type="final",
        status=res.get("status", "failed"),
        overall_score=res.get("overall_score", 0.0),
        review_model="qwen3-vl-plus"
    )
    db.add(report)
    db.commit()
    return report
