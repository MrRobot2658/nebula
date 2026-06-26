import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..events import emit_event
from ..models import Customer, Form, FormSubmission
from ..schemas import (
    FormCreate,
    FormDetailOut,
    FormOut,
    FormSubmissionOut,
    FormSubmitRequest,
)

router = APIRouter(tags=["forms"])


@router.get("/forms", response_model=list[FormOut], summary="表单列表")
def list_forms(db: Session = Depends(get_db)):
    return db.query(Form).order_by(Form.id.desc()).all()


@router.post("/forms", response_model=FormOut, status_code=201, summary="新建表单")
def create_form(payload: FormCreate, db: Session = Depends(get_db)):
    form = Form(
        name=payload.name,
        channel_key=payload.channel_key,
        fields=[f.model_dump() for f in payload.fields],
    )
    db.add(form)
    db.commit()
    db.refresh(form)
    return form


@router.get("/forms/{form_id}", response_model=FormDetailOut, summary="表单详情（含提交记录）")
def get_form(form_id: int, db: Session = Depends(get_db)):
    form = db.get(Form, form_id)
    if not form:
        raise HTTPException(404, "form not found")
    subs = (
        db.query(FormSubmission)
        .filter(FormSubmission.form_id == form_id)
        .order_by(FormSubmission.id.desc())
        .all()
    )
    base = FormOut.model_validate(form)
    return FormDetailOut(**base.model_dump(), submissions=[FormSubmissionOut.model_validate(s) for s in subs])


@router.post("/forms/{form_id}/submit", response_model=FormSubmissionOut, status_code=201, summary="提交表单（生成线索 + 触发事件）")
def submit_form(form_id: int, payload: FormSubmitRequest, db: Session = Depends(get_db)):
    """提交表单：按手机号/邮箱做 OneID 匹配复用客户，否则新建线索客户，
    记录提交内容并发出 `form_submitted` 事件（评分 +10、可触发自动化）。"""
    form = db.get(Form, form_id)
    if not form:
        raise HTTPException(404, "form not found")

    # OneID-style resolve: match by phone or email, else create a new lead.
    customer = None
    if payload.phone:
        customer = db.query(Customer).filter(Customer.phone == payload.phone).first()
    if customer is None and payload.email:
        customer = db.query(Customer).filter(Customer.email == payload.email).first()
    if customer is None:
        customer = Customer(
            name=payload.name or (payload.data.get("name") if isinstance(payload.data, dict) else None) or "表单线索",
            oneid=uuid.uuid4().hex[:16],
            phone=payload.phone,
            email=payload.email,
            source_channel=payload.channel_key or form.channel_key or "website",
            tags=["表单线索"],
            score=0,
            stage="new",
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)

    sub = FormSubmission(form_id=form.id, customer_id=customer.id, data=payload.data or {})
    db.add(sub)
    db.commit()
    db.refresh(sub)

    emit_event(
        db,
        "form_submitted",
        customer_id=customer.id,
        channel_key=payload.channel_key or form.channel_key,
        payload={"form_id": form.id, "submission_id": sub.id},
    )
    return sub
