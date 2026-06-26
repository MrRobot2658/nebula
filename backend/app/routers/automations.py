from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Automation, AutomationRun
from ..schemas import (
    AutomationCreate,
    AutomationOut,
    AutomationPatch,
    AutomationRunOut,
)

router = APIRouter(tags=["automations"])


@router.get("/automations", response_model=list[AutomationOut], summary="自动化规则列表")
def list_automations(db: Session = Depends(get_db)):
    return db.query(Automation).order_by(Automation.id).all()


@router.post("/automations", response_model=AutomationOut, status_code=201, summary="新建自动化规则")
def create_automation(payload: AutomationCreate, db: Session = Depends(get_db)):
    automation = Automation(
        name=payload.name,
        enabled=True,
        trigger_event=payload.trigger_event,
        conditions=payload.conditions or {},
        actions=payload.actions or [],
    )
    db.add(automation)
    db.commit()
    db.refresh(automation)
    return automation


@router.get("/automations/runs", response_model=list[AutomationRunOut], summary="自动化执行记录")
def list_runs(limit: int = Query(50, le=200), db: Session = Depends(get_db)):
    return db.query(AutomationRun).order_by(AutomationRun.id.desc()).limit(limit).all()


@router.patch("/automations/{automation_id}", response_model=AutomationOut, summary="启用/停用自动化")
def patch_automation(automation_id: int, payload: AutomationPatch, db: Session = Depends(get_db)):
    automation = db.get(Automation, automation_id)
    if not automation:
        raise HTTPException(404, "automation not found")
    automation.enabled = payload.enabled
    db.commit()
    db.refresh(automation)
    return automation
