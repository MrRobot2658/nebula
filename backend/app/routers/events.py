from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Event
from ..schemas import EventOut

router = APIRouter(tags=["events"])


@router.get("/events", response_model=list[EventOut], summary="事件流")
def list_events(limit: int = Query(50, le=200), db: Session = Depends(get_db)):
    return db.query(Event).order_by(Event.id.desc()).limit(limit).all()
