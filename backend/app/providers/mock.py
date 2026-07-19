from app.providers.base import ReasoningProvider, VisionProvider, ImageProvider, VideoProvider, AudioProvider

class MockReasoningProvider(ReasoningProvider):
    def normalize_input(self, raw_input: dict, input_mode: str) -> dict:
        return {"premise": "Mock premise", "story_goal": "Mock goal", "target_duration": 45}
    def create_episode_plan(self, brief: dict, show_style: dict = None) -> dict:
        return {"scenes": [{"scene_id": "mock_scene"}], "estimated_total_shots": 1}
    def generate_shot_list(self, plan: dict, brief: dict, show_style: dict = None) -> list:
        return [{"sequence_number": 1, "scene_id": "mock_scene", "story_function": "mock", "duration_seconds": 5}]
    def diagnose_failure(self, qc_report: dict, original_prompt: str) -> dict:
        return {"preserve": [], "change": ["mock change"], "estimated_retry_cost": 0, "modified_prompt": original_prompt}
    def generate_audio_cues(self, shots: list) -> list:
        return [{"shot_id": "mock", "cues": []}]
    def generate_show_proposal(self, genre: str, style: str, tone: str, audience: str, duration: int, seed: str = None) -> dict:
        return {
            "title": "Mock Show",
            "premise": "A mock show proposal description.",
            "characters": [{"name": "MockCharacter", "canonical_description": "A description"}],
            "visual_style": {"animation_style": style, "creative_direction": "", "negative_prompt": ""}
        }
    def generate_episode_draft(self, show_premise: str, show_style: str, characters: list, seed: str = None, duration: int = 45) -> dict:
        return {
            "title": "Mock Episode",
            "idea": "A mock episode plot.",
            "script": "A mock scene description."
        }

class MockVisionProvider(VisionProvider):
    def review_storyboard(self, image_url_or_base64: str, shot_spec: dict) -> dict:
        return {"status": "approved", "overall_score": 0.9}
    def review_keyframe(self, image_url_or_base64: str, shot_spec: dict, character_refs: list = None) -> dict:
        return {"status": "approved", "overall_score": 0.9}
    def review_video_frame(self, frame_base64: str, shot_spec: dict) -> dict:
        return {"status": "approved", "overall_score": 0.9}
    def final_narrative_review(self, video_url: str, episode_brief: dict) -> dict:
        return {"status": "approved", "overall_score": 0.9}

class MockImageProvider(ImageProvider):
    def generate_storyboard(self, prompt: str, negative_prompt: str = None) -> dict:
        return {"task_id": "mock_task", "status": "PENDING"}
    def generate_keyframe(self, prompt: str, reference_images: list = None, negative_prompt: str = None) -> dict:
        return {"task_id": "mock_task", "status": "PENDING"}
    def poll_image_task(self, task_id: str) -> dict:
        return {"status": "SUCCEEDED", "image_url": "mock_url"}
    def download_image(self, url: str, local_path: str) -> str:
        with open(local_path, "w") as f:
            f.write("mock image data")
        return local_path

class MockVideoProvider(VideoProvider):
    def generate_t2v(self, prompt: str, duration: int = 5, resolution: str = '720P', ratio: str = '16:9') -> dict:
        return {"task_id": "mock_task", "status": "PENDING"}
    def generate_i2v(self, image_url: str, prompt: str, duration: int = 5) -> dict:
        return {"task_id": "mock_task", "status": "PENDING"}
    def generate_r2v(self, reference_images: list, prompt: str, duration: int = 5) -> dict:
        return {"task_id": "mock_task", "status": "PENDING"}
    def poll_video_task(self, task_id: str) -> dict:
        return {"status": "SUCCEEDED", "video_url": "mock_url"}
    def download_video(self, url: str, local_path: str) -> str:
        with open(local_path, "w") as f:
            f.write("mock video data")
        return local_path

class MockAudioProvider(AudioProvider):
    def generate_speech(self, text: str, voice: str = 'longxiaochun') -> bytes:
        return b"mock audio data"
