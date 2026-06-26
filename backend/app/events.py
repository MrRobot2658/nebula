"""Lightweight event bus.

`emit_event` persists an Event row and dispatches it to the Celery worker, which runs
scoring + automations asynchronously. This mirrors Nebula's "事件总线" concept: any
channel action produces an event that downstream content/activity skills consume.
"""
from typing import Optional

from sqlalchemy.orm import Session

from .models import Event


def emit_event(
    db: Session,
    type: str,
    *,
    customer_id: Optional[int] = None,
    channel_key: Optional[str] = None,
    payload: Optional[dict] = None,
) -> Event:
    event = Event(
        type=type,
        customer_id=customer_id,
        channel_key=channel_key,
        payload=payload or {},
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # Dispatch asynchronously. Imported lazily to avoid import cycles at startup.
    try:
        from .tasks import dispatch_event

        dispatch_event.delay(event.id)
    except Exception:
        # If the broker is unavailable we still keep the persisted event;
        # the API call should not fail because of async dispatch problems.
        pass

    return event
