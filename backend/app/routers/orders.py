from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..events import emit_event
from ..models import Customer, Order
from ..schemas import OrderCreate, OrderOut

router = APIRouter(tags=["orders"])


@router.get("/orders", response_model=list[OrderOut], summary="订单列表")
def list_orders(customer_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    q = db.query(Order)
    if customer_id is not None:
        q = q.filter(Order.customer_id == customer_id)
    return q.order_by(Order.id.desc()).all()


@router.get("/customers/{customer_id}/orders", response_model=list[OrderOut], summary="客户订单与购买商品")
def customer_orders(customer_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Order)
        .filter(Order.customer_id == customer_id)
        .order_by(Order.id.desc())
        .all()
    )


@router.post("/orders", response_model=OrderOut, status_code=201, summary="创建订单（发出 order_placed，会员自动累计积分）")
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    customer = db.get(Customer, payload.customer_id)
    if not customer:
        raise HTTPException(404, "customer not found")

    items = [i.model_dump() for i in payload.items]
    amount = payload.amount if payload.amount is not None else sum(i["qty"] * i["price"] for i in items)

    order = Order(customer_id=customer.id, amount=amount, items=items, status=payload.status)
    db.add(order)
    db.commit()
    db.refresh(order)

    # order_placed -> 评分 + 会员积分（积分按金额 1:1 累计）
    emit_event(
        db,
        "order_placed",
        customer_id=customer.id,
        channel_key=customer.source_channel,
        payload={"order_id": order.id, "amount": amount, "points": int(amount)},
    )
    return order
