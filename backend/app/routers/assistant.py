from typing import Any, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..assistant import route_message
from ..database import get_db
from ..models import Customer

router = APIRouter(tags=["assistant"])

# Intent words that, combined with a customer name, jump straight to the member page.
_DETAIL_KW = ("详情", "画像", "档案", "资料", "会员")


class ChatMessage(BaseModel):
    role: str = "user"
    content: str = ""


class AssistantChatRequest(BaseModel):
    messages: list[ChatMessage] = []


class NavigateTarget(BaseModel):
    path: str
    label: Optional[str] = None


class AssistantChatResponse(BaseModel):
    reply: str
    intent: str
    views: list[dict[str, Any]] = []
    navigate: Optional[NavigateTarget] = None


def _find_customer_by_name(db: Session, text: str) -> Optional[Customer]:
    """Return the longest-named customer whose name appears in the message."""
    best = None
    for c in db.query(Customer).all():
        if c.name and len(c.name) >= 2 and c.name in text:
            if best is None or len(c.name) > len(best.name):
                best = c
    return best


@router.post("/assistant/chat", response_model=AssistantChatResponse, summary="对话助手：返回回复 + 内联视图卡片 / 页面跳转")
def chat(payload: AssistantChatRequest, db: Session = Depends(get_db)):
    last_user = next((m.content for m in reversed(payload.messages) if m.role == "user"), "")

    # "查看 王五 的详情" -> 在对话中内联展示该客户的会员详情卡片
    if any(k in last_user for k in _DETAIL_KW):
        customer = _find_customer_by_name(db, last_user)
        if customer:
            return AssistantChatResponse(
                reply=f"这是 {customer.name} 的会员详情。",
                intent="profile",
                views=[{"type": "profile", "customer_id": customer.id}],
            )

    reply, views = route_message(last_user)
    intent = views[0]["type"] if views else "chat"
    return AssistantChatResponse(reply=reply, intent=intent, views=views)
