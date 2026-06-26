from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ScoreRule
from ..schemas import ScoreRuleCreate, ScoreRuleOut

router = APIRouter(tags=["scoring"])


@router.get("/scoring/rules", response_model=list[ScoreRuleOut], summary="评分规则列表")
def list_rules(db: Session = Depends(get_db)):
    return db.query(ScoreRule).order_by(ScoreRule.id).all()


@router.post("/scoring/rules", response_model=ScoreRuleOut, status_code=201, summary="新建评分规则")
def create_rule(payload: ScoreRuleCreate, db: Session = Depends(get_db)):
    rule = ScoreRule(**payload.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule
