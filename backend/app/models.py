from datetime import datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, Integer, String, Text

from .database import Base


def _now() -> datetime:
    return datetime.utcnow()


class Channel(Base):
    __tablename__ = "channels"

    id = Column(Integer, primary_key=True)
    key = Column(String(64), unique=True, nullable=False)
    name = Column(String(128), nullable=False)
    category = Column(String(32), nullable=False, default="channel")
    enabled = Column(Boolean, nullable=False, default=False)
    config = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, default=_now)


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True)
    name = Column(String(128), nullable=False)
    oneid = Column(String(64), unique=True, nullable=False)
    phone = Column(String(32), nullable=True)
    email = Column(String(128), nullable=True)
    source_channel = Column(String(64), nullable=True)
    tags = Column(JSON, nullable=False, default=list)
    score = Column(Integer, nullable=False, default=0)
    stage = Column(String(32), nullable=False, default="new")
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    channel_id = Column(Integer, ForeignKey("channels.id"), nullable=True)
    channel_key = Column(String(64), nullable=True)
    direction = Column(String(8), nullable=False)  # 'in' | 'out'
    content = Column(Text, nullable=False)
    template_id = Column(Integer, nullable=True)
    status = Column(String(16), nullable=False, default="pending")
    created_at = Column(DateTime, default=_now)


class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True)
    name = Column(String(128), nullable=False)
    category = Column(String(32), nullable=False, default="general")
    channel_key = Column(String(64), nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=_now)


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True)
    name = Column(String(128), nullable=False)
    status = Column(String(16), nullable=False, default="draft")
    channel_key = Column(String(64), nullable=True)
    stats = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, default=_now)


class Automation(Base):
    __tablename__ = "automations"

    id = Column(Integer, primary_key=True)
    name = Column(String(128), nullable=False)
    enabled = Column(Boolean, nullable=False, default=True)
    trigger_event = Column(String(64), nullable=False)
    conditions = Column(JSON, nullable=False, default=dict)
    actions = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=_now)


class AutomationRun(Base):
    __tablename__ = "automation_runs"

    id = Column(Integer, primary_key=True)
    automation_id = Column(Integer, ForeignKey("automations.id"), nullable=False)
    automation_name = Column(String(128), nullable=False)
    customer_id = Column(Integer, nullable=True)
    status = Column(String(16), nullable=False, default="done")
    log = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, default=_now)


class ScoreRule(Base):
    __tablename__ = "score_rules"

    id = Column(Integer, primary_key=True)
    name = Column(String(128), nullable=False)
    event_type = Column(String(64), nullable=False)
    dimension = Column(String(32), nullable=False, default="behavior")
    points = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=_now)


class ScoreLog(Base):
    __tablename__ = "score_logs"

    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    delta = Column(Integer, nullable=False, default=0)
    reason = Column(String(255), nullable=False, default="")
    total_after = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=_now)


class Form(Base):
    __tablename__ = "forms"

    id = Column(Integer, primary_key=True)
    name = Column(String(128), nullable=False)
    channel_key = Column(String(64), nullable=True)
    fields = Column(JSON, nullable=False, default=list)  # [{key,label,type,required}]
    created_at = Column(DateTime, default=_now)


class FormSubmission(Base):
    __tablename__ = "form_submissions"

    id = Column(Integer, primary_key=True)
    form_id = Column(Integer, ForeignKey("forms.id"), nullable=False)
    customer_id = Column(Integer, nullable=True)
    data = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, default=_now)


class LandingPage(Base):
    __tablename__ = "landing_pages"

    id = Column(Integer, primary_key=True)
    slug = Column(String(96), unique=True, nullable=False)
    title = Column(String(160), nullable=False)
    headline = Column(String(255), nullable=False, default="")
    body = Column(Text, nullable=False, default="")
    form_id = Column(Integer, nullable=True)
    channel_key = Column(String(64), nullable=True)
    status = Column(String(16), nullable=False, default="published")
    views = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=_now)


class Poster(Base):
    __tablename__ = "posters"

    id = Column(Integer, primary_key=True)
    name = Column(String(128), nullable=False)
    template = Column(String(32), nullable=False, default="aurora")  # 渲染样式
    title = Column(String(160), nullable=False, default="")
    subtitle = Column(String(255), nullable=False, default="")
    cta = Column(String(64), nullable=True)
    qr_target = Column(String(255), nullable=True)  # 落地页 slug 或 URL
    created_at = Column(DateTime, default=_now)


class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), unique=True, nullable=False)
    level = Column(String(32), nullable=False, default="普通会员")
    points = Column(Integer, nullable=False, default=0)
    joined_at = Column(DateTime, default=_now)


class PointTransaction(Base):
    __tablename__ = "point_transactions"

    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    delta = Column(Integer, nullable=False, default=0)
    reason = Column(String(255), nullable=False, default="")
    balance_after = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=_now)


class Webinar(Base):
    __tablename__ = "webinars"

    id = Column(Integer, primary_key=True)
    title = Column(String(160), nullable=False)
    host = Column(String(96), nullable=True)
    scheduled_at = Column(String(32), nullable=True)  # ISO 字符串
    status = Column(String(16), nullable=False, default="scheduled")  # scheduled/live/ended
    channel_key = Column(String(64), nullable=True)
    form_id = Column(Integer, nullable=True)  # 直播中可发送的表单
    stats = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, default=_now)


class OfflineEvent(Base):
    __tablename__ = "offline_events"

    id = Column(Integer, primary_key=True)
    title = Column(String(160), nullable=False)
    location = Column(String(160), nullable=True)
    scheduled_at = Column(String(32), nullable=True)
    status = Column(String(16), nullable=False, default="upcoming")  # upcoming/ongoing/ended
    landing_page_id = Column(Integer, nullable=True)  # 扫码报名落地页
    poster_id = Column(Integer, nullable=True)  # 推广海报
    stats = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, default=_now)


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    amount = Column(Integer, nullable=False, default=0)  # 订单金额（元）
    items = Column(JSON, nullable=False, default=list)  # [{name, qty, price}]
    status = Column(String(16), nullable=False, default="paid")
    created_at = Column(DateTime, default=_now)


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True)
    type = Column(String(64), nullable=False)
    customer_id = Column(Integer, nullable=True)
    channel_key = Column(String(64), nullable=True)
    payload = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, default=_now)
