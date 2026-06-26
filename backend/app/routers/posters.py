from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Poster
from ..schemas import PosterCreate, PosterOut

router = APIRouter(tags=["posters"])

TEMPLATES = ["aurora", "sunset", "ocean", "ink"]


@router.get("/posters", response_model=list[PosterOut], summary="海报列表")
def list_posters(db: Session = Depends(get_db)):
    return db.query(Poster).order_by(Poster.id.desc()).all()


@router.get("/posters/templates", response_model=list[str], summary="海报样式模板")
def poster_templates():
    return TEMPLATES


@router.post("/posters", response_model=PosterOut, status_code=201, summary="新建海报")
def create_poster(payload: PosterCreate, db: Session = Depends(get_db)):
    poster = Poster(**payload.model_dump())
    db.add(poster)
    db.commit()
    db.refresh(poster)
    return poster
