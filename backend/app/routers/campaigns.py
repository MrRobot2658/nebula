from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Campaign
from ..schemas import CampaignCreate, CampaignOut

router = APIRouter(tags=["campaigns"])


@router.get("/campaigns", response_model=list[CampaignOut], summary="活动列表")
def list_campaigns(db: Session = Depends(get_db)):
    return db.query(Campaign).order_by(Campaign.id.desc()).all()


@router.post("/campaigns", response_model=CampaignOut, status_code=201, summary="新建活动")
def create_campaign(payload: CampaignCreate, db: Session = Depends(get_db)):
    campaign = Campaign(name=payload.name, channel_key=payload.channel_key, status="draft", stats={})
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign
