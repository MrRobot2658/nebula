"""Test bootstrap.

Importing this package configures the environment BEFORE any `app.*` module is
imported, so the suite runs against in-memory SQLite with Celery in eager mode
(tasks execute synchronously, no broker/worker needed) and no live LLM calls.
"""
import os

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["DEEPSEEK_API_KEY"] = ""  # force deterministic fallback, no network
os.environ.setdefault("CELERY_BROKER_URL", "memory://")
os.environ.setdefault("CELERY_RESULT_BACKEND", "cache+memory://")

from app.celery_app import celery_app  # noqa: E402

celery_app.conf.task_always_eager = True
celery_app.conf.task_eager_propagates = True
