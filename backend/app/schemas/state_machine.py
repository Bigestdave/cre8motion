from enum import Enum
from typing import Set, Dict

class ProductionStage(str, Enum):
    CREATED = "CREATED"
    QUEUED = "QUEUED"
    NORMALIZING_INPUT = "NORMALIZING_INPUT"
    PLANNING = "PLANNING"
    PLAN_VALIDATION = "PLAN_VALIDATION"
    REFERENCE_RESOLUTION = "REFERENCE_RESOLUTION"
    REFERENCE_GENERATION = "REFERENCE_GENERATION"
    REFERENCE_QC = "REFERENCE_QC"
    SHOT_PLANNING = "SHOT_PLANNING"
    STORYBOARD_GENERATION = "STORYBOARD_GENERATION"
    STORYBOARD_QC = "STORYBOARD_QC"
    KEYFRAME_GENERATION = "KEYFRAME_GENERATION"
    KEYFRAME_QC = "KEYFRAME_QC"
    VIDEO_GENERATION = "VIDEO_GENERATION"
    VIDEO_QC = "VIDEO_QC"
    AUDIO_GENERATION = "AUDIO_GENERATION"
    ASSEMBLY = "ASSEMBLY"
    FINAL_QC = "FINAL_QC"
    NEEDS_ATTENTION = "NEEDS_ATTENTION"
    READY_FOR_REVIEW = "READY_FOR_REVIEW"
    APPROVED = "APPROVED"
    FAILED = "FAILED"
    PAUSED = "PAUSED"
    CANCELLED = "CANCELLED"

# Valid transitions
VALID_TRANSITIONS: Dict[ProductionStage, Set[ProductionStage]] = {
    ProductionStage.CREATED: {ProductionStage.QUEUED, ProductionStage.CANCELLED},
    ProductionStage.QUEUED: {ProductionStage.NORMALIZING_INPUT, ProductionStage.CANCELLED},
    ProductionStage.NORMALIZING_INPUT: {ProductionStage.PLANNING, ProductionStage.FAILED},
    ProductionStage.PLANNING: {ProductionStage.PLAN_VALIDATION, ProductionStage.FAILED, ProductionStage.PAUSED},
    ProductionStage.PLAN_VALIDATION: {ProductionStage.REFERENCE_RESOLUTION, ProductionStage.PLANNING, ProductionStage.FAILED},
    ProductionStage.REFERENCE_RESOLUTION: {ProductionStage.REFERENCE_GENERATION, ProductionStage.SHOT_PLANNING, ProductionStage.FAILED},
    ProductionStage.REFERENCE_GENERATION: {ProductionStage.REFERENCE_QC, ProductionStage.FAILED},
    ProductionStage.REFERENCE_QC: {ProductionStage.SHOT_PLANNING, ProductionStage.REFERENCE_GENERATION, ProductionStage.FAILED},
    ProductionStage.SHOT_PLANNING: {ProductionStage.STORYBOARD_GENERATION, ProductionStage.FAILED, ProductionStage.PAUSED},
    ProductionStage.STORYBOARD_GENERATION: {ProductionStage.STORYBOARD_QC, ProductionStage.FAILED, ProductionStage.PAUSED},
    ProductionStage.STORYBOARD_QC: {ProductionStage.KEYFRAME_GENERATION, ProductionStage.STORYBOARD_GENERATION, ProductionStage.NEEDS_ATTENTION, ProductionStage.FAILED, ProductionStage.PAUSED},
    ProductionStage.KEYFRAME_GENERATION: {ProductionStage.KEYFRAME_QC, ProductionStage.FAILED, ProductionStage.PAUSED},
    ProductionStage.KEYFRAME_QC: {ProductionStage.VIDEO_GENERATION, ProductionStage.KEYFRAME_GENERATION, ProductionStage.NEEDS_ATTENTION, ProductionStage.FAILED, ProductionStage.PAUSED},
    ProductionStage.VIDEO_GENERATION: {ProductionStage.VIDEO_QC, ProductionStage.FAILED, ProductionStage.PAUSED},
    ProductionStage.VIDEO_QC: {ProductionStage.AUDIO_GENERATION, ProductionStage.VIDEO_GENERATION, ProductionStage.NEEDS_ATTENTION, ProductionStage.FAILED, ProductionStage.PAUSED},
    ProductionStage.AUDIO_GENERATION: {ProductionStage.ASSEMBLY, ProductionStage.FAILED},
    ProductionStage.ASSEMBLY: {ProductionStage.FINAL_QC, ProductionStage.FAILED},
    ProductionStage.FINAL_QC: {ProductionStage.READY_FOR_REVIEW, ProductionStage.NEEDS_ATTENTION, ProductionStage.FAILED},
    ProductionStage.NEEDS_ATTENTION: {ProductionStage.STORYBOARD_GENERATION, ProductionStage.KEYFRAME_GENERATION, ProductionStage.VIDEO_GENERATION, ProductionStage.FAILED, ProductionStage.PAUSED, ProductionStage.CANCELLED},
    ProductionStage.READY_FOR_REVIEW: {ProductionStage.APPROVED, ProductionStage.NEEDS_ATTENTION},
    ProductionStage.PAUSED: {ProductionStage.QUEUED, ProductionStage.CANCELLED},
}

def validate_transition(current: ProductionStage, target: ProductionStage) -> bool:
    allowed = VALID_TRANSITIONS.get(current, set())
    return target in allowed

class ShotStatus(str, Enum):
    PLANNED = "planned"
    STORYBOARD_GENERATING = "storyboard_generating"
    STORYBOARD_QC = "storyboard_qc"
    STORYBOARD_APPROVED = "storyboard_approved"
    STORYBOARD_RETRY = "storyboard_retry"
    KEYFRAME_GENERATING = "keyframe_generating"
    KEYFRAME_QC = "keyframe_qc"
    KEYFRAME_APPROVED = "keyframe_approved"
    KEYFRAME_RETRY = "keyframe_retry"
    VIDEO_GENERATING = "video_generating"
    VIDEO_QC = "video_qc"
    VIDEO_APPROVED = "video_approved"
    VIDEO_RETRY = "video_retry"
    COMPLETED = "completed"
    FAILED = "failed"
    NEEDS_ATTENTION = "needs_attention"
