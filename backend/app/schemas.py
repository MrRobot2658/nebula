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


# ---------- Forms ----------
class FormField(BaseModel):
    key: str
    label: str
    type: str = "text"
    required: bool = False


class FormOut(ORMModel):
    id: int
    name: str
    channel_key: Optional[str] = None
    fields: list[FormField]
    created_at: datetime


class FormCreate(BaseModel):
    name: str
    channel_key: Optional[str] = None
    fields: list[FormField]


class FormSubmissionOut(ORMModel):
    id: int
    form_id: int
    customer_id: Optional[int] = None
    data: dict
    created_at: datetime


class FormDetailOut(FormOut):
    submissions: list[FormSubmissionOut] = []


class FormSubmitRequest(BaseModel):
    data: dict
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    channel_key: Optional[str] = None


# ---------- Landing pages ----------
class LandingPageOut(ORMModel):
    id: int
    slug: str
    title: str
    headline: str
    body: str
    form_id: Optional[int] = None
    channel_key: Optional[str] = None
    status: str
    views: int
    created_at: datetime


class LandingPageCreate(BaseModel):
    title: str
    headline: str = ""
    body: str = ""
    slug: Optional[str] = None
    form_id: Optional[int] = None
    channel_key: Optional[str] = None


class LandingPagePatch(BaseModel):
    title: Optional[str] = None
    headline: Optional[str] = None
    body: Optional[str] = None
    status: Optional[str] = None
    form_id: Optional[int] = None


# ---------- Posters ----------
class PosterOut(ORMModel):
    id: int
    name: str
    template: str
    title: str
    subtitle: str
    cta: Optional[str] = None
    qr_target: Optional[str] = None
    created_at: datetime


class PosterCreate(BaseModel):
    name: str
    template: str = "aurora"
    title: str = ""
    subtitle: str = ""
    cta: Optional[str] = None
    qr_target: Optional[str] = None


# ---------- Members ----------
class MemberOut(ORMModel):
    id: int
    customer_id: int
    customer_name: Optional[str] = None
    level: str
    points: int
    joined_at: datetime


class MemberCreate(BaseModel):
    customer_id: int


class PointAdjust(BaseModel):
    delta: int
    reason: str = "手动调整"


class PointTransactionOut(ORMModel):
    id: int
    customer_id: int
    delta: int
    reason: str
    balance_after: int
    created_at: datetime


class MemberDetailOut(MemberOut):
    next_level: Optional[str] = None
    points_to_next: int = 0
    transactions: list[PointTransactionOut] = []


# ---------- Orders (订单 / 购买商品) ----------
class OrderItem(BaseModel):
    name: str
    qty: int = 1
    price: int = 0


class OrderOut(ORMModel):
    id: int
    customer_id: int
    amount: int
    items: list[OrderItem]
    status: str
    created_at: datetime


class OrderCreate(BaseModel):
    customer_id: int
    items: list[OrderItem] = []
    amount: Optional[int] = None
    status: str = "paid"


# ---------- Webinars (线上直播) ----------
class WebinarOut(ORMModel):
    id: int
    title: str
    host: Optional[str] = None
    scheduled_at: Optional[str] = None
    status: str
    channel_key: Optional[str] = None
    form_id: Optional[int] = None
    stats: dict
    created_at: datetime


class WebinarCreate(BaseModel):
    title: str
    host: Optional[str] = None
    scheduled_at: Optional[str] = None
    channel_key: Optional[str] = None
    form_id: Optional[int] = None


class WebinarPatch(BaseModel):
    status: Optional[str] = None
    form_id: Optional[int] = None


class WebinarDetailOut(WebinarOut):
    form: Optional[FormOut] = None
    registrations: int = 0


class SendFormRequest(BaseModel):
    form_id: Optional[int] = None


# ---------- Offline events (线下会议) ----------
class OfflineEventOut(ORMModel):
    id: int
    title: str
    location: Optional[str] = None
    scheduled_at: Optional[str] = None
    status: str
    landing_page_id: Optional[int] = None
    poster_id: Optional[int] = None
    stats: dict
    created_at: datetime


class OfflineEventCreate(BaseModel):
    title: str
    location: Optional[str] = None
    scheduled_at: Optional[str] = None
    landing_page_id: Optional[int] = None
    poster_id: Optional[int] = None


class OfflineEventPatch(BaseModel):
    status: Optional[str] = None
    landing_page_id: Optional[int] = None
    poster_id: Optional[int] = None


class OfflineEventDetailOut(OfflineEventOut):
    landing: Optional[LandingPageOut] = None
    public_url: Optional[str] = None
    poster: Optional[PosterOut] = None
    registrations: int = 0


class CheckinRequest(BaseModel):
    customer_id: Optional[int] = None


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
