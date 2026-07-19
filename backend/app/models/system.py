from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON, Boolean
import uuid
from datetime import datetime
from app.db.base_class import Base

def generate_uuid():
    return str(uuid.uuid4())

class Artifact(Base):
    __tablename__ = "artifacts"
    id = Column(String, primary_key=True, default=generate_uuid)
    production_run_id = Column(String, nullable=True)
    shot_id = Column(String, nullable=True)
    artifact_type = Column(String)
    storage_key = Column(String)
    mime_type = Column(String)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    checksum = Column(String, nullable=True)
    status = Column(String, default="created")
    created_at = Column(DateTime, default=datetime.utcnow)

class WorkflowEvent(Base):
    __tablename__ = "workflow_events"
    id = Column(String, primary_key=True, default=generate_uuid)
    workspace_id = Column(String, nullable=True)
    show_id = Column(String, nullable=True)
    episode_id = Column(String, nullable=True)
    production_run_id = Column(String, nullable=True)
    shot_id = Column(String, nullable=True)
    event_type = Column(String)
    severity = Column(String, default="info")
    payload = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

class BudgetLedger(Base):
    __tablename__ = "budget_ledgers"
    id = Column(String, primary_key=True, default=generate_uuid)
    production_run_id = Column(String)
    maximum_units = Column(Integer, default=100)
    used_units = Column(Integer, default=0)
    reserved_units = Column(Integer, default=16)
    available_units = Column(Integer, default=84)
    saved_units = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class BudgetEntry(Base):
    __tablename__ = "budget_entries"
    id = Column(String, primary_key=True, default=generate_uuid)
    budget_ledger_id = Column(String, ForeignKey("budget_ledgers.id"))
    stage = Column(String)
    operation = Column(String)
    shot_id = Column(String, nullable=True)
    attempt_id = Column(String, nullable=True)
    units = Column(Integer)
    entry_type = Column(String, default="debit")
    created_at = Column(DateTime, default=datetime.utcnow)

class ContinuityEvent(Base):
    __tablename__ = "continuity_events"
    id = Column(String, primary_key=True, default=generate_uuid)
    show_id = Column(String)
    episode_id = Column(String)
    entity_type = Column(String)
    entity_id = Column(String)
    field = Column(String)
    previous_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    continuity_version = Column(Integer)
    approved_at = Column(DateTime, default=datetime.utcnow)
