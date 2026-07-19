from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Cre8Motion Backend"
    DATABASE_URL: str = "sqlite:///./cre8motion.db"
    REDIS_URL: str = "redis://localhost:6379/0"
    QWEN_API_KEY: str = ""
    QWEN_BASE_URL: str = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
    DEMO_MODE: bool = False
    FRONTEND_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    # Required in a deployed environment for Qwen image-to-video generation to fetch keyframes.
    PUBLIC_API_BASE_URL: str = ""

    @property
    def frontend_origins(self) -> list[str]:
        return [origin.strip() for origin in self.FRONTEND_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
