"""Idempotent demo-data seeding, run on startup when the DB is empty."""
import uuid

from .database import session_scope
from .models import (
    Automation,
    Campaign,
    Channel,
    Customer,
    Message,
    ScoreRule,
    Template,
)

CHANNELS = [
    ("wechat", "微信 WeChat"),
    ("wecom", "企业微信 WeCom"),
    ("mp", "公众号 MP"),
    ("miniapp", "小程序 Mini Program"),
    ("website", "官网 Website"),
    ("feishu", "飞书 Feishu"),
    ("dingtalk", "钉钉 DingTalk"),
    ("sms", "短信 SMS"),
    ("email", "邮件 Email"),
]

ENABLED_BY_DEFAULT = {"wechat", "wecom", "miniapp"}


def seed_if_empty() -> bool:
    with session_scope() as db:
        if db.query(Channel).count() > 0:
            return False

        # Channels
        for key, name in CHANNELS:
            db.add(
                Channel(
                    key=key,
                    name=name,
                    category="channel",
                    enabled=key in ENABLED_BY_DEFAULT,
                    config={"api_key": "", "webhook_url": "", "enabled": key in ENABLED_BY_DEFAULT},
                )
            )

        # Templates
        welcome = Template(
            name="新客欢迎",
            category="welcome",
            channel_key="wechat",
            content="您好 {{customer.name}}！欢迎咨询，我们为您准备了产品介绍和夏日优惠券 🎁",
        )
        followup = Template(
            name="高意向跟进",
            category="promotion",
            channel_key="wechat",
            content="{{customer.name}}，您关注的产品现有专属优惠，回复「领取」即可获得优惠券～",
        )
        db.add_all([welcome, followup])

        # Score rules
        db.add_all(
            [
                ScoreRule(name="消息互动", event_type="message_received", dimension="interaction", points=5),
                ScoreRule(name="下单转化", event_type="order_placed", dimension="behavior", points=20),
                ScoreRule(name="表单提交", event_type="form_submitted", dimension="behavior", points=10),
            ]
        )

        # Automations
        db.add(
            Automation(
                name="新客欢迎流程",
                enabled=True,
                trigger_event="message_received",
                conditions={},
                actions=[
                    {"type": "send_template", "template": "新客欢迎"},
                    {"type": "add_tag", "tag": "已互动"},
                    {"type": "adjust_score", "points": 5},
                ],
            )
        )
        db.add(
            Automation(
                name="高意向客户跟进",
                enabled=True,
                trigger_event="score.threshold_reached",
                conditions={},
                actions=[
                    {"type": "add_tag", "tag": "高意向"},
                    {"type": "set_stage", "stage": "engaged"},
                    {"type": "send_template", "template": "高意向跟进"},
                ],
            )
        )

        # Campaign
        db.add(Campaign(name="夏日促销", status="running", channel_key="wechat", stats={"reach": 1280, "conversion": 86}))

        # Customers
        c1 = Customer(
            name="李四",
            oneid=uuid.uuid4().hex[:16],
            phone="138****0001",
            email=None,
            source_channel="wechat",
            tags=["新客"],
            score=60,
            stage="new",
        )
        c2 = Customer(
            name="王五",
            oneid=uuid.uuid4().hex[:16],
            phone="139****0002",
            source_channel="miniapp",
            tags=["老客", "高价值"],
            score=88,
            stage="engaged",
        )
        c3 = Customer(
            name="赵敏",
            oneid=uuid.uuid4().hex[:16],
            email="zhao@example.com",
            source_channel="website",
            tags=["官网线索"],
            score=35,
            stage="new",
        )
        db.add_all([c1, c2, c3])
        db.flush()

        db.add(
            Message(
                customer_id=c1.id,
                channel_key="wechat",
                direction="in",
                content="你好，这款皮草怎么卖？",
                status="received",
            )
        )
        return True
