from abc import ABC, abstractmethod

class ReasoningProvider(ABC):
    @abstractmethod
    def normalize_input(self, raw_input: dict, input_mode: str) -> dict:
        pass

    @abstractmethod
    def create_episode_plan(self, brief: dict, show_style: dict = None) -> dict:
        pass

    @abstractmethod
    def generate_shot_list(self, plan: dict, brief: dict, show_style: dict = None) -> list:
        pass

    @abstractmethod
    def diagnose_failure(self, qc_report: dict, original_prompt: str) -> dict:
        pass

    @abstractmethod
    def generate_audio_cues(self, shots: list) -> list:
        pass

    @abstractmethod
    def generate_show_proposal(self, genre: str, style: str, tone: str, audience: str, duration: int, seed: str = None) -> dict:
        pass

    @abstractmethod
    def generate_episode_draft(self, show_premise: str, show_style: str, characters: list, seed: str = None, duration: int = 45) -> dict:
        pass


class VisionProvider(ABC):
    @abstractmethod
    def review_storyboard(self, image_url_or_base64: str, shot_spec: dict) -> dict:
        pass

    @abstractmethod
    def review_keyframe(self, image_url_or_base64: str, shot_spec: dict, character_refs: list = None) -> dict:
        pass

    @abstractmethod
    def review_video_frame(self, frame_base64: str, shot_spec: dict) -> dict:
        pass

    @abstractmethod
    def final_narrative_review(self, video_url: str, episode_brief: dict) -> dict:
        pass


class ImageProvider(ABC):
    @abstractmethod
    def generate_storyboard(self, prompt: str, negative_prompt: str = None) -> dict:
        pass

    @abstractmethod
    def generate_keyframe(self, prompt: str, reference_images: list = None, negative_prompt: str = None) -> dict:
        pass

    @abstractmethod
    def poll_image_task(self, task_id: str) -> dict:
        pass

    @abstractmethod
    def download_image(self, url: str, local_path: str) -> str:
        pass


class VideoProvider(ABC):
    @abstractmethod
    def generate_t2v(self, prompt: str, duration: int = 5, resolution: str = '720P', ratio: str = '16:9') -> dict:
        pass

    @abstractmethod
    def generate_i2v(self, image_url: str, prompt: str, duration: int = 5) -> dict:
        pass

    @abstractmethod
    def generate_r2v(self, reference_images: list, prompt: str, duration: int = 5) -> dict:
        pass

    @abstractmethod
    def poll_video_task(self, task_id: str) -> dict:
        pass

    @abstractmethod
    def download_video(self, url: str, local_path: str) -> str:
        pass


class AudioProvider(ABC):
    @abstractmethod
    def generate_speech(self, text: str, voice: str = 'longxiaochun') -> bytes:
        pass
