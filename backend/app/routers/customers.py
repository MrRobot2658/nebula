import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Customer, Message, ScoreLog
from ..schemas import (
    CustomerCreate,
    CustomerDetailOut,
    CustomerOut,
    MessageOut,
    ScoreLogOut,
    TagsUpdate,
)

router = APIRouter(tags=["customers"])


@router.get("/customers", response_model=list[CustomerOut], summary="客户列表 / 搜索")
def list_customers(
    search: Optional[str] = Query(None, description="按姓名 / 手机 / 邮箱模糊搜索"),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
):
    q = db.query(Customer)
    if search:
        like = f"%{search}%"
        q = q.filter(
            (Customer.name.like(like))
            | (Customer.phone.like(like))
            | (Customer.email.like(like))
        )
    return q.order_by(Customer.updated_at.desc()).limit(limit).all()


@router.post("/customers", response_model=CustomerOut, status_code=201, summary="新建客户")
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    customer = Customer(
        name=payload.name,
        oneid=uuid.uuid4().hex[:16],
        phone=payload.phone,
        email=payload.email,
        source_channel=payload.source_channel,
        tags=[],
        score=0,
        stage="new",
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/customers/{customer_id}", response_model=CustomerDetailOut, summary="客户详情（含时间线）")
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(404, "customer not found")
    messages = (
        db.query(Message)
        .filter(Message.customer_id == customer_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    score_logs = (
        db.query(ScoreLog)
        .filter(ScoreLog.customer_id == customer_id)
        .order_by(ScoreLog.created_at.asc())
        .all()
    )
    base = CustomerOut.model_validate(customer)
    return CustomerDetailOut(
        **base.model_dump(),
        messages=[MessageOut.model_validate(m) for m in messages],
        score_logs=[ScoreLogOut.model_validate(s) for s in score_logs],
    )


@router.patch("/customers/{customer_id}/tags", response_model=CustomerOut, summary="更新客户标签")
def update_tags(customer_id: int, payload: TagsUpdate, db: Session = Depends(get_db)):
    customer = db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(404, "customer not found")
    customer.tags = payload.tags
    db.commit()
    db.refresh(customer)
    return customer
