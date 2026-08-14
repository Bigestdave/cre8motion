from app.providers.qwen import QwenReasoningProvider
from app.models.production import Shot
from app.models.show import Location

reasoning = QwenReasoningProvider()


def _to_int(value, default):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _to_float(value, default):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def create_episode_plan(db, production_id, brief, show_style=None):
    """Call Qwen to create scene breakdown and shot list."""
    plan_spec = reasoning.create_episode_plan(brief, show_style)
    shots_spec = reasoning.generate_shot_list(plan_spec, brief, show_style)

    if not isinstance(shots_spec, list) or not shots_spec:
        raise ValueError(
            "Planner returned no usable shot list "
            f"(got {type(shots_spec).__name__} with {len(shots_spec) if isinstance(shots_spec, list) else 'n/a'} entries)"
        )

    # Ensure idempotency: clear any prior unapproved/stale shots for this run
    db.query(Shot).filter(Shot.production_run_id == production_id).delete()

    shots = []
    for index, spec in enumerate(shots_spec, start=1):
        if not isinstance(spec, dict):
            continue

        # The planner returns a free-text location NAME (e.g. "Kitchen"), but
        # shots.location_id is a foreign key to locations.id. Writing the raw
        # name violates the FK on Postgres and crashed the pipeline mid-PLANNING.
        # Only set the FK when a matching Location row actually exists; always
        # keep the human-readable name in the environment JSON for prompting.
        location_name = spec.get('location_id') or spec.get('location') or ''
        location_fk = None
        if location_name:
            existing = db.query(Location).filter(Location.id == location_name).first()
            if existing:
                location_fk = existing.id

        camera = spec.get('camera') if isinstance(spec.get('camera'), dict) else {}
        if not camera:
            camera = {
                "framing": spec.get('framing', 'medium shot'),
                "movement": spec.get('camera_movement', 'static'),
                "angle": spec.get('camera_angle', 'eye level'),
            }

        props = spec.get('props') if isinstance(spec.get('props'), list) else []
        continuity = spec.get('continuity_locks') if isinstance(spec.get('continuity_locks'), list) else []
        characters = spec.get('characters') if isinstance(spec.get('characters'), list) else []

        shot = Shot(
            production_run_id=production_id,
            sequence_number=_to_int(spec.get('sequence_number'), index),
            story_function=str(spec.get('story_function', '')),
            duration_seconds=_to_float(spec.get('duration_seconds'), 5.0),
            characters=characters,
            location_id=location_fk,
            environment={
                "props": props,
                "prop_state": spec.get('prop_state'),
                "lighting": spec.get('lighting'),
                "location_name": location_name,
                "primary_emotion": spec.get('primary_emotion'),
                "character_expression": spec.get('character_expression'),
            },
            camera=camera,
            continuity_requirements=continuity,
            keyframe_prompt=str(spec.get('keyframe_prompt', '')),
            motion_prompt=str(spec.get('motion_prompt', '')),
            negative_prompt=str(spec.get('negative_prompt', ''))
        )
        db.add(shot)
        shots.append(shot)

    if not shots:
        raise ValueError("Planner returned a shot list without any valid shot objects")

    db.commit()
    return shots
