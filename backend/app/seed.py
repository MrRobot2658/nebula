"""Idempotent demo-data seeding, run on startup when the DB is empty."""
import uuid

from .database import session_scope
from .membership import level_for
from .models import (
    Automation,
    Campaign,
    Channel,
    Customer,
    Form,
    LandingPage,
    Member,
    Message,
    OfflineEvent,
    Order,
    Poster,
    PointTransaction,
    ScoreRule,
    Template,
    Webinar,
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


def seed_features() -> None:
    """Seed demo data for forms / landing pages / posters / members independently,
    so these modules have content even on an existing (already core-seeded) volume."""
    with session_scope() as db:
        form_id = None
        if db.query(Form).count() == 0:
            form = Form(
                name="新品试用申请",
                channel_key="website",
                fields=[
                    {"key": "name", "label": "姓名", "type": "text", "required": True},
                    {"key": "phone", "label": "手机号", "type": "tel", "required": True},
                    {"key": "demand", "label": "需求描述", "type": "textarea", "required": False},
                ],
            )
            db.add(form)
            db.flush()
            form_id = form.id

        if db.query(LandingPage).count() == 0:
            db.add(
                LandingPage(
                    slug="summer-launch",
                    title="夏日新品首发",
                    headline="限时新品试用，注册即领专属优惠券",
                    body="填写下方表单，抢先体验夏日新品，并获得专属折扣与会员积分。",
                    form_id=form_id,
                    channel_key="website",
                    status="published",
                    views=128,
                )
            )

        if db.query(Poster).count() == 0:
            db.add_all(
                [
                    Poster(name="夏日大促海报", template="sunset", title="夏日大促", subtitle="全场新品低至 7 折", cta="扫码抢购", qr_target="summer-launch"),
                    Poster(name="新品首发海报", template="aurora", title="新品首发", subtitle="注册即领专属优惠券", cta="立即参与", qr_target="summer-launch"),
                ]
            )

        if db.query(Member).count() == 0:
            for name, pts in [("王五", 600), ("李四", 80)]:
                customer = db.query(Customer).filter(Customer.name == name).first()
                if customer:
                    db.add(Member(customer_id=customer.id, level=level_for(pts), points=pts))
                    db.add(
                        PointTransaction(
                            customer_id=customer.id, delta=pts, reason="历史积分", balance_after=pts
                        )
                    )

        if db.query(Order).count() == 0:
            orders_by_name = {
                "王五": [
                    {"amount": 599, "items": [{"name": "夏日真丝连衣裙", "qty": 1, "price": 599}]},
                    {"amount": 358, "items": [{"name": "轻奢小香风外套", "qty": 1, "price": 199}, {"name": "丝巾", "qty": 1, "price": 159}]},
                ],
                "李四": [
                    {"amount": 199, "items": [{"name": "新品体验装", "qty": 1, "price": 199}]},
                ],
            }
            for name, orders in orders_by_name.items():
                customer = db.query(Customer).filter(Customer.name == name).first()
                if customer:
                    for o in orders:
                        db.add(
                            Order(customer_id=customer.id, amount=o["amount"], items=o["items"], status="paid")
                        )

        if db.query(Webinar).count() == 0:
            a_form = db.query(Form).first()
            db.add(
                Webinar(
                    title="夏日新品线上发布会",
                    host="市场部",
                    scheduled_at="2026-07-01T20:00:00",
                    status="scheduled",
                    channel_key="wechat",
                    form_id=a_form.id if a_form else None,
                    stats={"forms_sent": 0},
                )
            )

        if db.query(OfflineEvent).count() == 0:
            a_landing = db.query(LandingPage).filter(LandingPage.slug == "summer-launch").first() or db.query(LandingPage).first()
            a_poster = db.query(Poster).first()
            db.add(
                OfflineEvent(
                    title="城市新品品鉴会 · 上海站",
                    location="上海 · 静安",
                    scheduled_at="2026-07-15T14:00:00",
                    status="upcoming",
                    landing_page_id=a_landing.id if a_landing else None,
                    poster_id=a_poster.id if a_poster else None,
                    stats={"checkins": 0},
                )
            )
