from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..llm import analyze_message
from ..models import Customer
from ..schemas import AiSuggestRequest, AiSuggestResponse

router = APIRouter(tags=["ai"])


@router.post("/ai/suggest", response_model=AiSuggestResponse, summary="AI 意图分析与回复建议（DeepSeek）")
def suggest(payload: AiSuggestRequest, db: Session = Depends(get_db)):
    """分析一条客户消息，返回意图标签与可直接发送的回复建议。

    优先调用 DeepSeek（`deepseek-chat`）；未配置密钥或调用失败时回退到关键词启发式，
    保证 ChatUI 的「AI 建议」面板始终有结果。
    """
    customer = db.get(Customer, payload.customer_id) if payload.customer_id else None
    result = analyze_message(payload.content, customer)
    return AiSuggestResponse(**result)
