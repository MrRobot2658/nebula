import re
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..events import emit_event
from ..models import LandingPage
from ..schemas import LandingPageCreate, LandingPageOut, LandingPagePatch

router = APIRouter(tags=["landing"])


def _slugify(title: str) -> str:
    slug = re.sub(r"[^\w一-鿿-]+", "-", title.strip().lower()).strip("-")
    return slug or "page"


@router.get("/landing-pages", response_model=list[LandingPageOut], summary="落地页列表")
def list_pages(db: Session = Depends(get_db)):
    return db.query(LandingPage).order_by(LandingPage.id.desc()).all()


@router.post("/landing-pages", response_model=LandingPageOut, status_code=201, summary="新建落地页")
def create_page(payload: LandingPageCreate, db: Session = Depends(get_db)):
    slug = payload.slug or _slugify(payload.title)
    if db.query(LandingPage).filter(LandingPage.slug == slug).first():
        slug = f"{slug}-{uuid.uuid4().hex[:4]}"
    page = LandingPage(
        slug=slug,
        title=payload.title,
        headline=payload.headline,
        body=payload.body,
        form_id=payload.form_id,
        channel_key=payload.channel_key,
        status="published",
        views=0,
    )
    db.add(page)
    db.commit()
    db.refresh(page)
    return page


@router.get("/landing-pages/{page_id}", response_model=LandingPageOut, summary="落地页详情")
def get_page(page_id: int, db: Session = Depends(get_db)):
    page = db.get(LandingPage, page_id)
    if not page:
        raise HTTPException(404, "landing page not found")
    return page


@router.patch("/landing-pages/{page_id}", response_model=LandingPageOut, summary="更新落地页")
def patch_page(page_id: int, payload: LandingPagePatch, db: Session = Depends(get_db)):
    page = db.get(LandingPage, page_id)
    if not page:
        raise HTTPException(404, "landing page not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(page, field, value)
    db.commit()
    db.refresh(page)
    return page


@router.post("/landing-pages/{page_id}/view", response_model=LandingPageOut, summary="记录访问（埋点）")
def record_view(page_id: int, db: Session = Depends(get_db)):
    page = db.get(LandingPage, page_id)
    if not page:
        raise HTTPException(404, "landing page not found")
    page.views += 1
    db.commit()
    db.refresh(page)
    emit_event(db, "visit_recorded", channel_key=page.channel_key, payload={"landing_page_id": page.id, "slug": page.slug})
    return page
