import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..events import emit_event
from ..models import Channel, Customer, Message, Template
from ..schemas import MessageInbound, MessageOut, MessageSend

router = APIRouter(tags=["messages"])


@router.get("/messages", response_model=list[MessageOut], summary="消息历史")
def list_messages(
    customer_id: Optional[int] = Query(None),
    limit: int = Query(200, le=1000),
    db: Session = Depends(get_db),
):
    q = db.query(Message)
    if customer_id is not None:
        q = q.filter(Message.customer_id == customer_id)
    return q.order_by(Message.created_at.asc()).limit(limit).all()


@router.post("/messages/send", response_model=MessageOut, status_code=201, summary="发送消息（出站）")
def send(payload: MessageSend, db: Session = Depends(get_db)):
    customer = db.get(Customer, payload.customer_id)
    if not customer:
        raise HTTPException(404, "customer not found")

    channel = None
    if payload.channel_id is not None:
        channel = db.get(Channel, payload.channel_id)
    elif customer.source_channel:
        channel = db.query(Channel).filter(Channel.key == customer.source_channel).first()

    content = payload.content
    if payload.template_id:
        tpl = db.get(Template, payload.template_id)
        if tpl:
            content = tpl.content

    msg = Message(
        customer_id=customer.id,
        channel_id=channel.id if channel else None,
        channel_key=channel.key if channel else customer.source_channel,
        direction="out",
        content=content,
        template_id=payload.template_id,
        status="queued",
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    # Simulate async delivery via Celery.
    try:
        from ..tasks import send_message

        send_message.delay(msg.id)
    except Exception:
        pass
    return msg


@router.post("/messages/inbound", response_model=MessageOut, status_code=201, summary="模拟收到消息（入站，触发事件总线）")
def inbound(payload: MessageInbound, db: Session = Depends(get_db)):
    """Simulates a channel webhook delivering an inbound message.

    Creates (or resolves) the customer, stores the message, then emits a
    `message_received` event that the Celery worker consumes to run scoring +
    automations — the core Nebula loop.
    """
    customer: Optional[Customer] = None
    if payload.customer_id is not None:
        customer = db.get(Customer, payload.customer_id)
    if customer is None:
        customer = Customer(
            name=payload.customer_name or "访客",
            oneid=uuid.uuid4().hex[:16],
            source_channel=payload.channel_key,
            tags=[],
            score=0,
            stage="new",
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)

    channel = db.query(Channel).filter(Channel.key == payload.channel_key).first()
    msg = Message(
        customer_id=customer.id,
        channel_id=channel.id if channel else None,
        channel_key=payload.channel_key,
        direction="in",
        content=payload.content,
        status="received",
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    emit_event(
        db,
        "message_received",
        customer_id=customer.id,
        channel_key=payload.channel_key,
        payload={"message_id": msg.id, "content": payload.content},
    )
    return msg
