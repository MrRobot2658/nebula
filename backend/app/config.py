import os


class Settings:
    """Runtime configuration, sourced from environment variables with docker-friendly defaults."""

    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "mysql+pymysql://nebula:nebula@db:3306/nebula?charset=utf8mb4"
    )
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379/0")
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", os.getenv("REDIS_URL", "redis://redis:6379/0"))
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", os.getenv("REDIS_URL", "redis://redis:6379/1"))

    # Score threshold that marks a customer as high-intent
    SCORE_THRESHOLD: int = int(os.getenv("SCORE_THRESHOLD", "80"))

    # DeepSeek LLM (OpenAI-compatible)
    DEEPSEEK_API_KEY: str = os.getenv("DEEPSEEK_API_KEY", "")
    DEEPSEEK_API_BASE: str = os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com")
    DEEPSEEK_MODEL: str = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")


settings = Settings()
