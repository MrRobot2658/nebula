from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..events import emit_event
from ..models import FormSubmission, LandingPage, OfflineEvent, Poster
from ..schemas import (
    CheckinRequest,
    LandingPageOut,
    OfflineEventCreate,
    OfflineEventDetailOut,
    OfflineEventOut,
    OfflineEventPatch,
    PosterOut,
)

router = APIRouter(tags=["offline"])


@router.get("/offline-events", response_model=list[OfflineEventOut], summary="线下会议列表")
def list_events(db: Session = Depends(get_db)):
    return db.query(OfflineEvent).order_by(OfflineEvent.id.desc()).all()


@router.post("/offline-events", response_model=OfflineEventOut, status_code=201, summary="新建线下会议")
def create_event(payload: OfflineEventCreate, db: Session = Depends(get_db)):
    event = OfflineEvent(
        title=payload.title,
        location=payload.location,
        scheduled_at=payload.scheduled_at,
        landing_page_id=payload.landing_page_id,
        poster_id=payload.poster_id,
        status="upcoming",
        stats={"checkins": 0},
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.get("/offline-events/{event_id}", response_model=OfflineEventDetailOut, summary="线下会议详情（含扫码报名落地页与报名数）")
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.get(OfflineEvent, event_id)
    if not event:
        raise HTTPException(404, "offline event not found")

    landing = db.get(LandingPage, event.landing_page_id) if event.landing_page_id else None
    poster = db.get(Poster, event.poster_id) if event.poster_id else None

    registrations = 0
    public_url = None
    if landing:
        public_url = f"/l/{landing.slug}"
        if landing.form_id:
            registrations = (
                db.query(func.count(FormSubmission.id)).filter(FormSubmission.form_id == landing.form_id).scalar() or 0
            )

    base = OfflineEventOut.model_validate(event)
    return OfflineEventDetailOut(
        **base.model_dump(),
        landing=LandingPageOut.model_validate(landing) if landing else None,
        public_url=public_url,
        poster=PosterOut.model_validate(poster) if poster else None,
        registrations=registrations,
    )


@router.patch("/offline-events/{event_id}", response_model=OfflineEventOut, summary="更新线下会议状态")
def patch_event(event_id: int, payload: OfflineEventPatch, db: Session = Depends(get_db)):
    event = db.get(OfflineEvent, event_id)
    if not event:
        raise HTTPException(404, "offline event not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    db.commit()
    db.refresh(event)
    return event


@router.post("/offline-events/{event_id}/checkin", response_model=OfflineEventOut, summary="现场签到")
def checkin(event_id: int, payload: CheckinRequest, db: Session = Depends(get_db)):
    event = db.get(OfflineEvent, event_id)
    if not event:
        raise HTTPException(404, "offline event not found")
    stats = dict(event.stats or {})
    stats["checkins"] = stats.get("checkins", 0) + 1
    event.stats = stats
    db.commit()
    db.refresh(event)
    emit_event(db, "offline.checkin", customer_id=payload.customer_id, payload={"event_id": event.id})
    return event
