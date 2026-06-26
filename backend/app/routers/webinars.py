from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..events import emit_event
from ..models import Form, FormSubmission, Webinar
from ..schemas import (
    FormOut,
    SendFormRequest,
    WebinarCreate,
    WebinarDetailOut,
    WebinarOut,
    WebinarPatch,
)

router = APIRouter(tags=["webinars"])


def _registrations(db: Session, form_id) -> int:
    if not form_id:
        return 0
    return db.query(func.count(FormSubmission.id)).filter(FormSubmission.form_id == form_id).scalar() or 0


@router.get("/webinars", response_model=list[WebinarOut], summary="直播列表")
def list_webinars(db: Session = Depends(get_db)):
    return db.query(Webinar).order_by(Webinar.id.desc()).all()


@router.post("/webinars", response_model=WebinarOut, status_code=201, summary="新建直播")
def create_webinar(payload: WebinarCreate, db: Session = Depends(get_db)):
    webinar = Webinar(
        title=payload.title,
        host=payload.host,
        scheduled_at=payload.scheduled_at,
        channel_key=payload.channel_key,
        form_id=payload.form_id,
        status="scheduled",
        stats={"forms_sent": 0},
    )
    db.add(webinar)
    db.commit()
    db.refresh(webinar)
    return webinar


@router.get("/webinars/{webinar_id}", response_model=WebinarDetailOut, summary="直播详情（含可发送表单与报名数）")
def get_webinar(webinar_id: int, db: Session = Depends(get_db)):
    webinar = db.get(Webinar, webinar_id)
    if not webinar:
        raise HTTPException(404, "webinar not found")
    form = db.get(Form, webinar.form_id) if webinar.form_id else None
    base = WebinarOut.model_validate(webinar)
    return WebinarDetailOut(
        **base.model_dump(),
        form=FormOut.model_validate(form) if form else None,
        registrations=_registrations(db, webinar.form_id),
    )


@router.patch("/webinars/{webinar_id}", response_model=WebinarOut, summary="开始/结束直播")
def patch_webinar(webinar_id: int, payload: WebinarPatch, db: Session = Depends(get_db)):
    webinar = db.get(Webinar, webinar_id)
    if not webinar:
        raise HTTPException(404, "webinar not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(webinar, field, value)
    db.commit()
    db.refresh(webinar)
    return webinar


@router.post("/webinars/{webinar_id}/send-form", response_model=WebinarDetailOut, summary="直播中发送表单给观众")
def send_form(webinar_id: int, payload: SendFormRequest, db: Session = Depends(get_db)):
    """在直播过程中向观众推送一个表单（线索/问卷），发出 `webinar.form_sent` 事件。"""
    webinar = db.get(Webinar, webinar_id)
    if not webinar:
        raise HTTPException(404, "webinar not found")
    form_id = payload.form_id or webinar.form_id
    form = db.get(Form, form_id) if form_id else None
    if not form:
        raise HTTPException(400, "no form to send")

    webinar.form_id = form.id
    stats = dict(webinar.stats or {})
    stats["forms_sent"] = stats.get("forms_sent", 0) + 1
    webinar.stats = stats
    db.commit()
    db.refresh(webinar)

    emit_event(db, "webinar.form_sent", channel_key=webinar.channel_key, payload={"webinar_id": webinar.id, "form_id": form.id})

    base = WebinarOut.model_validate(webinar)
    return WebinarDetailOut(
        **base.model_dump(),
        form=FormOut.model_validate(form),
        registrations=_registrations(db, form.id),
    )
