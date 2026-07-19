from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.db.base_class import Base

def generate_uuid():
    return str(uuid.uuid4())

class Workspace(Base):
    __tablename__ = "workspaces"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    owner_id = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Show(Base):
    __tablename__ = "shows"
    id = Column(String, primary_key=True, default=generate_uuid)
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=False)
    title = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True)
    premise = Column(String)
    target_audience = Column(String)
    status = Column(String, default="active")
    default_aspect_ratio = Column(String, default="9:16")
    default_duration_seconds = Column(Integer, default=45)
    default_style_profile_id = Column(String) # ForeignKey resolved later
    default_audio_profile_id = Column(String)
    current_continuity_version = Column(Integer, default=1)
    cover_artifact_id = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    workspace = relationship("Workspace")

class StyleProfile(Base):
    __tablename__ = "style_profiles"
    id = Column(String, primary_key=True, default=generate_uuid)
    show_id = Column(String, ForeignKey("shows.id"))
    name = Column(String)
    animation_style = Column(String)
    canonical_prompt = Column(String)
    negative_prompt = Column(String)
    color_palette = Column(JSON, default=list)
    lighting_rules = Column(JSON, default=list)
    camera_rules = Column(JSON, default=list)
    motion_rules = Column(JSON, default=list)
    texture_rules = Column(JSON, default=list)
    reference_artifact_ids = Column(JSON, default=list)
    version = Column(Integer, default=1)
    status = Column(String, default="active")

class Character(Base):
    __tablename__ = "characters"
    id = Column(String, primary_key=True, default=generate_uuid)
    show_id = Column(String, ForeignKey("shows.id"))
    name = Column(String)
    canonical_description = Column(String)
    personality_traits = Column(JSON, default=list)
    signature_behaviors = Column(JSON, default=list)
    visual_constraints = Column(JSON, default=list)
    default_wardrobe = Column(JSON, default=list)
    color_palette = Column(JSON, default=list)
    status = Column(String, default="active")
    version = Column(Integer, default=1)

class CharacterReference(Base):
    __tablename__ = "character_references"
    id = Column(String, primary_key=True, default=generate_uuid)
    character_id = Column(String, ForeignKey("characters.id"))
    reference_type = Column(String) # e.g., front_view, expression_happy
    artifact_id = Column(String)
    is_canonical = Column(Boolean, default=True)
    quality_score = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

class Location(Base):
    __tablename__ = "locations"
    id = Column(String, primary_key=True, default=generate_uuid)
    show_id = Column(String, ForeignKey("shows.id"))
    name = Column(String)
    canonical_description = Column(String)
    visual_constraints = Column(JSON, default=list)
    reference_artifact_ids = Column(JSON, default=list)
    version = Column(Integer, default=1)
    status = Column(String, default="active")

class Prop(Base):
    __tablename__ = "props"
    id = Column(String, primary_key=True, default=generate_uuid)
    show_id = Column(String, ForeignKey("shows.id"))
    name = Column(String)
    canonical_description = Column(String)
    visual_constraints = Column(JSON, default=list)
    reference_artifact_ids = Column(JSON, default=list)
    current_owner_character_id = Column(String, ForeignKey("characters.id"), nullable=True)
    status = Column(String, default="active")
