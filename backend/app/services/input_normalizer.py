from app.providers.qwen import QwenReasoningProvider

reasoning = QwenReasoningProvider()

def normalize_creative_input(creative_input: dict) -> dict:
    """Detect input mode and normalize to EpisodeCreativeBrief."""
    if 'beats' in creative_input or 'script' in creative_input:
        mode = 'structured_script'
    elif 'characters' in creative_input or 'story_type' in creative_input:
        mode = 'creative_brief'  
    else:
        mode = 'quick_idea'
    
    return reasoning.normalize_input(creative_input, mode)
