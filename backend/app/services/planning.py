from app.providers.qwen import QwenReasoningProvider
from app.models.production import Shot

reasoning = QwenReasoningProvider()

def create_episode_plan(db, production_id, brief, show_style=None):
    """Call Qwen to create scene breakdown and shot list."""
    plan_spec = reasoning.create_episode_plan(brief, show_style)
    shots_spec = reasoning.generate_shot_list(plan_spec, brief, show_style)
    
    shots = []
    for spec in shots_spec:
        shot = Shot(
            production_run_id=production_id,
            sequence_number=spec.get('sequence_number', 0),
            story_function=spec.get('story_function', ''),
            duration_seconds=spec.get('duration_seconds', 5.0),
            characters=spec.get('characters', []),
            location_id=spec.get('location_id'),
            environment={"props": spec.get('props', [])},
            camera=spec.get('camera', {}),
            continuity_requirements=spec.get('continuity_locks', []),
            keyframe_prompt=spec.get('keyframe_prompt', ''),
            motion_prompt=spec.get('motion_prompt', ''),
            negative_prompt=spec.get('negative_prompt', '')
        )
        db.add(shot)
        shots.append(shot)
    
    db.commit()
    return shots
