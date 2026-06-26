import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..channel_catalog import get_catalog
from ..database import get_db
from ..events import emit_event
from ..models import Channel, Customer, Event, Message
from ..schemas import (
    ChannelDetailOut,
    ChannelOut,
    ChannelPatch,
    ChannelSimulateRequest,
    ChannelSimulateResponse,
)

router = APIRouter(tags=["channels"])


@router.get("/channels", response_model=list[ChannelOut], summary="渠道列表")
def list_channels(db: Session = Depends(get_db)):
    return db.query(Channel).order_by(Channel.id).all()


@router.patch("/channels/{channel_id}", response_model=ChannelOut, summary="启用/配置渠道")
def update_channel(channel_id: int, patch: ChannelPatch, db: Session = Depends(get_db)):
    channel = db.get(Channel, channel_id)
    if not channel:
        raise HTTPException(404, "channel not found")
    if patch.enabled is not None:
        channel.enabled = patch.enabled
    if patch.config is not None:
        channel.config = patch.config
    db.commit()
    db.refresh(channel)
    return channel


@router.get("/channels/{key}", response_model=ChannelDetailOut, summary="渠道详情（能力/事件/配置/最近事件/统计）")
def get_channel(key: str, db: Session = Depends(get_db)):
    channel = db.query(Channel).filter(Channel.key == key).first()
    if not channel:
        raise HTTPException(404, "channel not found")

    catalog = get_catalog(key)

    recent_events = (
        db.query(Event)
        .filter(Event.channel_key == key)
        .order_by(Event.id.desc())
        .limit(20)
        .all()
    )

    messages_in = (
        db.query(Message)
        .filter(Message.channel_key == key, Message.direction == "in")
        .count()
    )
    messages_out = (
        db.query(Message)
        .filter(Message.channel_key == key, Message.direction == "out")
        .count()
    )

    return {
        "channel": channel,
        "capabilities": catalog.get("capabilities", []),
        "events": catalog.get("events", []),
        "config_schema": catalog.get("config_schema", []),
        "recent_events": recent_events,
        "stats": {"messages_in": messages_in, "messages_out": messages_out},
    }


@router.post(
    "/channels/{key}/simulate",
    response_model=ChannelSimulateResponse,
    summary="模拟渠道事件（驱动事件总线：评分/自动化/AI）",
)
def simulate_channel_event(
    key: str, payload: ChannelSimulateRequest, db: Session = Depends(get_db)
):
    channel = db.query(Channel).filter(Channel.key == key).first()
    if not channel:
        raise HTTPException(404, "channel not found")

    # Resolve or create a visitor customer for this channel.
    customer: Optional[Customer] = None
    if payload.customer_id is not None:
        customer = db.get(Customer, payload.customer_id)
        if customer is None:
            raise HTTPException(404, "customer not found")
    if customer is None:
        customer = (
            db.query(Customer)
            .filter(Customer.source_channel == key, Customer.name == f"{channel.name} 访客")
            .first()
        )
    if customer is None:
        customer = Customer(
            name=f"{channel.name} 访客",
            oneid=uuid.uuid4().hex[:16],
            source_channel=key,
            tags=[],
            score=0,
            stage="new",
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)

    content = payload.content or "（模拟内容）"
    message: Optional[Message] = None

    if payload.event_key == "message_received":
        message = Message(
            customer_id=customer.id,
            channel_id=channel.id,
            channel_key=key,
            direction="in",
            content=content,
            status="received",
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        event = emit_event(
            db,
            "message_received",
            customer_id=customer.id,
            channel_key=key,
            payload={"message_id": message.id, "content": content, "simulated": True},
        )
    else:
        event = emit_event(
            db,
            payload.event_key,
            customer_id=customer.id,
            channel_key=key,
            payload={"content": content, "simulated": True},
        )

    return {"event": event, "message": message}
