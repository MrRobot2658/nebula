from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Channel
from ..schemas import ChannelOut, ChannelPatch

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
