from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON
import uuid
from datetime import datetime
from app.db.base_class import Base

def generate_uuid():
    return str(uuid.uuid4())

class Episode(Base):
    __tablename__ = "episodes"
    id = Column(String, primary_key=True, default=generate_uuid)
    show_id = Column(String, ForeignKey("shows.id"))
    season_number = Column(Integer, default=1)
    episode_number = Column(Integer)
    title = Column(String)
    input_type = Column(String, default="structured_script")
    creative_input = Column(JSON, default=dict)
    status = Column(String, default="draft")
    target_duration_seconds = Column(Integer, default=45)
    aspect_ratio = Column(String, default="9:16")
    style_profile_id = Column(String, ForeignKey("style_profiles.id"), nullable=True)
    audio_profile_id = Column(String, nullable=True)
    base_continuity_version = Column(Integer, default=1)
    approved_production_run_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class EpisodeCharacter(Base):
    __tablename__ = "episode_characters"
    id = Column(String, primary_key=True, default=generate_uuid)
    episode_id = Column(String, ForeignKey("episodes.id"))
    character_id = Column(String, ForeignKey("characters.id"))
    role = Column(String)
    episode_wardrobe = Column(JSON, default=list)
    episode_state_override = Column(JSON, default=dict)

class EpisodeLocation(Base):
    __tablename__ = "episode_locations"
    id = Column(String, primary_key=True, default=generate_uuid)
    episode_id = Column(String, ForeignKey("episodes.id"))
    location_id = Column(String, ForeignKey("locations.id"))
    usage = Column(String, default="primary")
    episode_override = Column(JSON, default=dict)
