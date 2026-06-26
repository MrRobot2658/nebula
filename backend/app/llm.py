"""DeepSeek LLM integration (OpenAI-compatible chat completions).

Used to analyze an inbound customer message and produce an intent label plus a
suggested reply for the ChatUI "AI 建议" panel. Falls back to a lightweight
heuristic when no API key is configured or the call fails, so the system always
returns a usable suggestion and never blocks the core flow.
"""
import json
from typing import Optional

import requests

from .config import settings

SYSTEM_PROMPT = (
    "你是 Nebula 星云的营销自动化 AI 助手。根据客户发来的消息和客户画像，"
    "判断客户意图，并给运营人员一句可直接发送的中文回复建议。"
    "只返回 JSON，格式：{\"intent\": \"意图(如 产品咨询/价格询问/售后/投诉/闲聊)\", "
    "\"suggestion\": \"给运营的一句回复建议\", \"sentiment\": \"positive|neutral|negative\"}。"
)

_KEYWORD_FALLBACK = [
    ("退款", "售后", "您好，已收到您的售后诉求，正在为您核实订单，请稍候～"),
    ("投诉", "投诉", "非常抱歉给您带来不便，已记录您的问题并优先处理。"),
    ("多少钱", "价格询问", "您好，这款产品的价格和优惠我马上为您发送，请稍候～"),
    ("价格", "价格询问", "您好，关于价格我们有专属优惠，稍后为您奉上明细～"),
    ("怎么卖", "产品咨询", "您好！这就为您介绍产品详情，并附上专属优惠券 🎁"),
    ("怎么样", "产品咨询", "您好！很高兴为您介绍，这就把产品资料发给您～"),
]


def _fallback(content: str) -> dict:
    text = content or ""
    for kw, intent, suggestion in _KEYWORD_FALLBACK:
        if kw in text:
            return {"intent": intent, "suggestion": suggestion, "sentiment": "neutral", "source": "fallback"}
    return {
        "intent": "产品咨询",
        "suggestion": "您好！很高兴为您服务，请问有什么可以帮您？",
        "sentiment": "neutral",
        "source": "fallback",
    }


def analyze_message(content: str, customer: Optional[object] = None) -> dict:
    if not settings.DEEPSEEK_API_KEY:
        return _fallback(content)

    profile = ""
    if customer is not None:
        profile = (
            f"客户：{getattr(customer, 'name', '')}，"
            f"标签：{getattr(customer, 'tags', [])}，"
            f"评分：{getattr(customer, 'score', 0)}，"
            f"阶段：{getattr(customer, 'stage', '')}，"
            f"来源渠道：{getattr(customer, 'source_channel', '')}。"
        )

    url = settings.DEEPSEEK_API_BASE.rstrip("/") + "/chat/completions"
    payload = {
        "model": settings.DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"{profile}\n客户消息：{content}"},
        ],
        "temperature": 0.3,
        "response_format": {"type": "json_object"},
        "max_tokens": 300,
    }
    headers = {
        "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=20)
        resp.raise_for_status()
        data = resp.json()
        raw = data["choices"][0]["message"]["content"]
        parsed = json.loads(raw)
        return {
            "intent": parsed.get("intent", "产品咨询"),
            "suggestion": parsed.get("suggestion", ""),
            "sentiment": parsed.get("sentiment", "neutral"),
            "source": "deepseek",
        }
    except Exception as exc:  # noqa: BLE001
        result = _fallback(content)
        result["error"] = str(exc)[:200]
        return result
