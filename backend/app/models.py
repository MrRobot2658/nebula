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


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True)
    type = Column(String(64), nullable=False)
    customer_id = Column(Integer, nullable=True)
    channel_key = Column(String(64), nullable=True)
    payload = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, default=_now)
