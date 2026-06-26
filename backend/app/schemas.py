from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- Channels ----------
class ChannelOut(ORMModel):
    id: int
    key: str
    name: str
    category: str
    enabled: bool
    config: dict
    created_at: datetime


class ChannelPatch(BaseModel):
    enabled: Optional[bool] = None
    config: Optional[dict] = None


# ---------- Customers ----------
class CustomerOut(ORMModel):
    id: int
    name: str
    oneid: str
    phone: Optional[str] = None
    email: Optional[str] = None
    source_channel: Optional[str] = None
    tags: list[str]
    score: int
    stage: str
    created_at: datetime
    updated_at: datetime


class CustomerCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    source_channel: Optional[str] = None


class TagsUpdate(BaseModel):
    tags: list[str]


# ---------- Messages ----------
class MessageOut(ORMModel):
    id: int
    customer_id: int
    channel_id: Optional[int] = None
    channel_key: Optional[str] = None
    direction: str
    content: str
    template_id: Optional[int] = None
    status: str
    created_at: datetime


class MessageSend(BaseModel):
    customer_id: int
    channel_id: Optional[int] = None
    content: str
    template_id: Optional[int] = None


class MessageInbound(BaseModel):
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    channel_key: str
    content: str


# ---------- Score ----------
class ScoreLogOut(ORMModel):
    id: int
    customer_id: int
    delta: int
    reason: str
    total_after: int
    created_at: datetime


class CustomerDetailOut(CustomerOut):
    messages: list[MessageOut] = []
    score_logs: list[ScoreLogOut] = []


class ScoreRuleOut(ORMModel):
    id: int
    name: str
    event_type: str
    dimension: str
    points: int
    created_at: datetime


class ScoreRuleCreate(BaseModel):
    name: str
    event_type: str
    dimension: str = "behavior"
    points: int


# ---------- Templates ----------
class TemplateOut(ORMModel):
    id: int
    name: str
    category: str
    channel_key: Optional[str] = None
    content: str
    created_at: datetime


class TemplateCreate(BaseModel):
    name: str
    category: str = "general"
    channel_key: Optional[str] = None
    content: str


# ---------- Campaigns ----------
class CampaignOut(ORMModel):
    id: int
    name: str
    status: str
    channel_key: Optional[str] = None
    stats: dict
    created_at: datetime


class CampaignCreate(BaseModel):
    name: str
    channel_key: Optional[str] = None


# ---------- Automations ----------
class AutomationOut(ORMModel):
    id: int
    name: str
    enabled: bool
    trigger_event: str
    conditions: dict
    actions: list[Any]
    created_at: datetime


class AutomationCreate(BaseModel):
    name: str
    trigger_event: str
    conditions: dict = {}
    actions: list[Any] = []


class AutomationPatch(BaseModel):
    enabled: bool


class AutomationRunOut(ORMModel):
    id: int
    automation_id: int
    automation_name: str
    customer_id: Optional[int] = None
    status: str
    log: dict
    created_at: datetime


# ---------- Events ----------
class EventOut(ORMModel):
    id: int
    type: str
    customer_id: Optional[int] = None
    channel_key: Optional[str] = None
    payload: dict
    created_at: datetime


# ---------- Dashboard ----------
class TrendPoint(BaseModel):
    date: str
    count: int


class AiSuggestRequest(BaseModel):
    customer_id: Optional[int] = None
    content: str


class AiSuggestResponse(BaseModel):
    intent: str
    suggestion: str
    sentiment: str = "neutral"
    source: str = "fallback"
    error: Optional[str] = None


class DashboardStats(BaseModel):
    customers: int
    messages_today: int
    running_campaigns: int
    avg_score: float
    channels_enabled: int
    automations_enabled: int
    messages_trend: list[TrendPoint]
    recent_events: list[EventOut]
