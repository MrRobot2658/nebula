from celery import Celery

from .config import settings

celery_app = Celery(
    "nebula",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

# Import task modules so the worker registers them (avoids circular import at module load).
celery_app.conf.update(
    imports=("app.tasks",),
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)
