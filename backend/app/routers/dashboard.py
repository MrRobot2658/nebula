from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Automation, Campaign, Channel, Customer, Event, Message
from ..schemas import DashboardStats, EventOut, TrendPoint

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard/stats", response_model=DashboardStats, summary="概览统计")
def stats(db: Session = Depends(get_db)):
    today = datetime.utcnow().date()
    start_today = datetime(today.year, today.month, today.day)

    customers = db.query(func.count(Customer.id)).scalar() or 0
    messages_today = (
        db.query(func.count(Message.id)).filter(Message.created_at >= start_today).scalar() or 0
    )
    running_campaigns = (
        db.query(func.count(Campaign.id)).filter(Campaign.status == "running").scalar() or 0
    )
    avg_score = db.query(func.avg(Customer.score)).scalar()
    channels_enabled = (
        db.query(func.count(Channel.id)).filter(Channel.enabled.is_(True)).scalar() or 0
    )
    automations_enabled = (
        db.query(func.count(Automation.id)).filter(Automation.enabled.is_(True)).scalar() or 0
    )

    # 7-day message trend
    trend: list[TrendPoint] = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_start = datetime(day.year, day.month, day.day)
        day_end = day_start + timedelta(days=1)
        count = (
            db.query(func.count(Message.id))
            .filter(Message.created_at >= day_start, Message.created_at < day_end)
            .scalar()
            or 0
        )
        trend.append(TrendPoint(date=day.isoformat(), count=count))

    recent_events = db.query(Event).order_by(Event.id.desc()).limit(10).all()

    return DashboardStats(
        customers=customers,
        messages_today=messages_today,
        running_campaigns=running_campaigns,
        avg_score=round(float(avg_score), 1) if avg_score is not None else 0.0,
        channels_enabled=channels_enabled,
        automations_enabled=automations_enabled,
        messages_trend=trend,
        recent_events=[EventOut.model_validate(e) for e in recent_events],
    )
