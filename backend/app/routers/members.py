from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..events import emit_event
from ..membership import level_for, next_level
from ..models import Customer, Member, PointTransaction
from ..schemas import (
    MemberCreate,
    MemberDetailOut,
    MemberOut,
    PointAdjust,
    PointTransactionOut,
)

router = APIRouter(tags=["members"])


def _to_out(db: Session, member: Member) -> MemberOut:
    customer = db.get(Customer, member.customer_id)
    data = MemberOut.model_validate(member).model_dump()
    data["customer_name"] = customer.name if customer else None
    return MemberOut(**data)


@router.get("/members", response_model=list[MemberOut], summary="会员列表 / 搜索")
def list_members(
    search: Optional[str] = Query(None, description="按会员（客户）姓名搜索"),
    db: Session = Depends(get_db),
):
    q = db.query(Member).join(Customer, Customer.id == Member.customer_id)
    if search:
        q = q.filter(Customer.name.like(f"%{search}%"))
    members = q.order_by(Member.points.desc()).all()
    return [_to_out(db, m) for m in members]


@router.post("/members", response_model=MemberOut, status_code=201, summary="开通会员")
def enroll(payload: MemberCreate, db: Session = Depends(get_db)):
    customer = db.get(Customer, payload.customer_id)
    if not customer:
        raise HTTPException(404, "customer not found")
    member = db.query(Member).filter(Member.customer_id == payload.customer_id).first()
    if member:
        return _to_out(db, member)
    member = Member(customer_id=customer.id, level=level_for(0), points=0)
    db.add(member)
    db.commit()
    db.refresh(member)
    return _to_out(db, member)


@router.get("/members/{customer_id}", response_model=MemberDetailOut, summary="会员详情（含积分流水）")
def get_member(customer_id: int, db: Session = Depends(get_db)):
    member = db.query(Member).filter(Member.customer_id == customer_id).first()
    if not member:
        raise HTTPException(404, "member not found")
    txns = (
        db.query(PointTransaction)
        .filter(PointTransaction.customer_id == customer_id)
        .order_by(PointTransaction.id.desc())
        .all()
    )
    nxt, need = next_level(member.points)
    base = _to_out(db, member).model_dump()
    return MemberDetailOut(
        **base,
        next_level=nxt,
        points_to_next=need,
        transactions=[PointTransactionOut.model_validate(t) for t in txns],
    )


@router.post("/members/{customer_id}/points", response_model=MemberOut, summary="调整积分（自动升级）")
def adjust_points(customer_id: int, payload: PointAdjust, db: Session = Depends(get_db)):
    member = db.query(Member).filter(Member.customer_id == customer_id).first()
    if not member:
        raise HTTPException(404, "member not found")

    old_level = member.level
    member.points = max(0, member.points + payload.delta)
    member.level = level_for(member.points)
    db.add(
        PointTransaction(
            customer_id=customer_id,
            delta=payload.delta,
            reason=payload.reason,
            balance_after=member.points,
        )
    )
    db.commit()
    db.refresh(member)

    if member.level != old_level:
        emit_event(
            db,
            "member.level_up",
            customer_id=customer_id,
            payload={"from": old_level, "to": member.level, "points": member.points},
        )
    return _to_out(db, member)
