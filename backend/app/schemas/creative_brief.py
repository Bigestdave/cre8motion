from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum

class InputMode(str, Enum):
    QUICK_IDEA = "quick_idea"
    CREATIVE_BRIEF = "creative_brief"
    STRUCTURED_SCRIPT = "structured_script"

class StoryBeat(BaseModel):
    sequence: int
    purpose: str
    description: str

class CharacterSpec(BaseModel):
    character_id: Optional[str] = None
    name: Optional[str] = None
    expression: Optional[str] = None
    action: Optional[str] = None

class CameraSpec(BaseModel):
    framing: str = "medium"
    angle: str = "eye level"
    movement: str = "static"

class QuickIdeaInput(BaseModel):
    show_id: str
    title: str
    idea: str
    duration_seconds: int = 45

class CreativeBriefInput(BaseModel):
    show_id: str
    title: str
    idea: str
    characters: List[str] = []
    locations: List[str] = []
    story_type: Optional[str] = None
    ending_type: Optional[str] = None
    emotional_intensity: str = "moderate"
    duration_seconds: int = 45
    dialogue_mode: str = "non_verbal"
    creative_direction: Optional[str] = None

class StructuredScriptInput(BaseModel):
    show_id: str
    title: str
    duration_seconds: int = 45
    beats: List[StoryBeat] = []

class SceneSpec(BaseModel):
    scene_id: str
    location_id: Optional[str] = None
    location_description: Optional[str] = None
    characters: List[str] = []
    required_props: List[str] = []
    estimated_duration: float = 10.0
    estimated_shots: int = 2
    mood: Optional[str] = None

class ShotSpec(BaseModel):
    sequence_number: int
    scene_id: str
    duration_seconds: float = 5.0
    story_function: str
    characters: List[CharacterSpec] = []
    location_id: Optional[str] = None
    props: List[str] = []
    camera: CameraSpec = CameraSpec()
    continuity_locks: List[str] = []
    budget_priority: str = "normal"
    keyframe_prompt: Optional[str] = None
    motion_prompt: Optional[str] = None
    negative_prompt: Optional[str] = None

class EpisodeCreativeBrief(BaseModel):
    premise: str
    story_goal: str
    characters: List[str] = []
    locations: List[str] = []
    props: List[str] = []
    target_duration: int = 45
    dialogue_mode: str = "non_verbal"
    constraints: List[str] = []
    emotional_arc: Optional[str] = None
    ending_description: Optional[str] = None

class ProductionPlanSpec(BaseModel):
    scenes: List[SceneSpec] = []
    estimated_total_shots: int = 6
    estimated_budget_units: int = 50
    production_risks: List[str] = []

class ReferenceManifest(BaseModel):
    characters_ready: bool = False
    locations_ready: bool = False
    props_ready: bool = False
    missing: List[dict] = []

class BudgetSummary(BaseModel):
    maximum_units: int = 100
    used_units: int = 0
    reserved_units: int = 16
    available_units: int = 84
    saved_units: int = 0

class QCResult(BaseModel):
    status: str  # approved, retry, failed
    overall_score: float = 0.0
    scores: dict = {}
    failures: List[dict] = []
    retry_instruction: Optional[str] = None

class RetryPlan(BaseModel):
    preserve: List[str] = []
    change: List[str] = []
    estimated_retry_cost: int = 5
    modified_prompt: Optional[str] = None
