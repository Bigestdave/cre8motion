from app.providers.qwen import QwenReasoningProvider

reasoning = QwenReasoningProvider()

def should_retry(db, shot_id, max_attempts=3):
    return True

def diagnose_and_retry(db, production_id, shot_id, qc_report, original_prompt):
    return reasoning.diagnose_failure(qc_report, original_prompt)

def get_fallback_strategy(attempt_count):
    if attempt_count == 1: return 'simplify_camera'
    if attempt_count == 2: return 'keyframe_push_in'
    return 'select_best_attempt'
