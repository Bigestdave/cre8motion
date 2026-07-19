from typing import Any

from pydantic import BaseModel, Field


class ShowCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    premise: str | None = None
    default_duration_seconds: int = Field(default=45, ge=1, le=600)
    default_aspect_ratio: str = "9:16"
    animation_style: str | None = None
    creative_direction: str | None = None
    negative_constraints: str | None = None
    dialogue_mode: str = "non_verbal"


class CharacterCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    canonical_description: str | None = None


class EpisodeCreateRequest(BaseModel):
    show_id: str = Field(min_length=1)
    title: str = Field(min_length=1, max_length=200)
    idea: str | None = None
    script: str | None = None
    characters: list[str] | None = None
    locations: list[str] | None = None
    story_type: str | None = None
    emotional_intensity: str | None = None
    duration_seconds: int = Field(default=45, ge=1, le=600)
    creative_direction: str | None = None


class ApiErrorResponse(BaseModel):
    detail: str


JsonDict = dict[str, Any]
