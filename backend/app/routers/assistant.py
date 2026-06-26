from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from ..assistant import route_message

router = APIRouter(tags=["assistant"])


class ChatMessage(BaseModel):
    role: str = "user"
    content: str = ""


class AssistantChatRequest(BaseModel):
    messages: list[ChatMessage] = []


class AssistantChatResponse(BaseModel):
    reply: str
    intent: str
    views: list[dict[str, Any]] = []


@router.post("/assistant/chat", response_model=AssistantChatResponse, summary="对话助手：返回回复 + 内联视图卡片")
def chat(payload: AssistantChatRequest):
    last_user = next((m.content for m in reversed(payload.messages) if m.role == "user"), "")
    reply, views = route_message(last_user)
    intent = views[0]["type"] if views else "chat"
    return AssistantChatResponse(reply=reply, intent=intent, views=views)
