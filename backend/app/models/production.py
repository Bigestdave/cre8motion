from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON, Boolean, Float
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.db.base_class import Base

def generate_uuid():
    return str(uuid.uuid4())

class ProductionRun(Base):
    __tablename__ = "production_runs"
    id = Column(String, primary_key=True, default=generate_uuid)
    episode_id = Column(String, ForeignKey("episodes.id"))
    version = Column(Integer, default=1)
    status = Column(String, default="created")
    current_stage = Column(String, default="planning")
    budget_limit = Column(Integer, default=100)
    budget_used = Column(Integer, default=0)
    retry_reserve = Column(Integer, default=16)
    workflow_version = Column(String, default="2.0")
    planning_prompt_version = Column(String, default="1.2")
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    failure_reason = Column(String, nullable=True)

class Shot(Base):
    __tablename__ = "shots"
    id = Column(String, primary_key=True, default=generate_uuid)
    production_run_id = Column(String, ForeignKey("production_runs.id"))
    sequence_number = Column(Integer)
    story_function = Column(String)
    duration_seconds = Column(Float)
    status = Column(String, default="planned")
    priority = Column(String, default="normal")
    location_id = Column(String, ForeignKey("locations.id"), nullable=True)
    style_profile_version = Column(Integer, default=1)
    approved_storyboard_artifact_id = Column(String, nullable=True)
    approved_keyframe_artifact_id = Column(String, nullable=True)
    approved_video_artifact_id = Column(String, nullable=True)
    maximum_image_attempts = Column(Integer, default=3)
    maximum_video_attempts = Column(Integer, default=3)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    characters = Column(JSON, default=list)
    camera = Column(JSON, default=dict)
    environment = Column(JSON, default=dict)
    continuity_requirements = Column(JSON, default=list)
    keyframe_prompt = Column(String)
    motion_prompt = Column(String)
    negative_prompt = Column(String)
    audio_cues = Column(JSON, default=list)

class GenerationAttempt(Base):
    __tablename__ = "generation_attempts"
    id = Column(String, primary_key=True, default=generate_uuid)
    production_run_id = Column(String, ForeignKey("production_runs.id"))
    shot_id = Column(String, ForeignKey("shots.id"))
    operation = Column(String)
    attempt_number = Column(Integer, default=1)
    provider = Column(String, default="qwen_cloud")
    model = Column(String)
    prompt_version = Column(String)
    compiled_prompt = Column(String)
    negative_prompt = Column(String)
    reference_artifact_ids = Column(JSON, default=list)
    provider_request_id = Column(String, nullable=True)
    status = Column(String, default="created")
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    media_units = Column(Integer, default=0)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    result_artifact_id = Column(String, nullable=True)
    error = Column(String, nullable=True)

class QualityReport(Base):
    __tablename__ = "quality_reports"
    id = Column(String, primary_key=True, default=generate_uuid)
    artifact_id = Column(String)
    production_run_id = Column(String, ForeignKey("production_runs.id"))
    shot_id = Column(String, ForeignKey("shots.id"))
    review_type = Column(String)
    status = Column(String)
    overall_score = Column(Float)
    scores = Column(JSON, default=dict)
    failures = Column(JSON, default=list)
    retry_recommended = Column(Boolean, default=False)
    retry_instruction = Column(JSON, nullable=True)
    review_model = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
