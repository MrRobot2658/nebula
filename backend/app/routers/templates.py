from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Template
from ..schemas import TemplateCreate, TemplateOut

router = APIRouter(tags=["templates"])


@router.get("/templates", response_model=list[TemplateOut], summary="模板列表")
def list_templates(db: Session = Depends(get_db)):
    return db.query(Template).order_by(Template.id.desc()).all()


@router.post("/templates", response_model=TemplateOut, status_code=201, summary="新建模板")
def create_template(payload: TemplateCreate, db: Session = Depends(get_db)):
    tpl = Template(**payload.model_dump())
    db.add(tpl)
    db.commit()
    db.refresh(tpl)
    return tpl
