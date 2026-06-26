import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .database import Base, engine
from .routers import (
    ai,
    automations,
    campaigns,
    channels,
    customers,
    dashboard,
    events,
    forms,
    landing,
    members,
    messages,
    offline,
    orders,
    posters,
    public,
    scoring,
    templates,
    webinars,
)
from .seed import seed_features, seed_if_empty

tags_metadata = [
    {"name": "dashboard", "description": "概览统计：客户、消息、活动、评分等汇总指标。"},
    {"name": "channels", "description": "渠道 Skill：9 个渠道的启用状态与配置。"},
    {"name": "customers", "description": "客户：CDP 客户档案、画像、标签、评分与时间线。"},
    {"name": "messages", "description": "消息：会话收发；`inbound` 模拟渠道来消息并触发事件总线。"},
    {"name": "templates", "description": "内容模板：跨渠道消息模板，支持 {{变量}} 注入。"},
    {"name": "campaigns", "description": "活动：营销活动及其统计。"},
    {"name": "automations", "description": "自动化：触发-条件-动作规则与执行记录。"},
    {"name": "scoring", "description": "评分模型：评分规则与评分日志。"},
    {"name": "events", "description": "事件总线：所有 Skill 产生的标准事件流。"},
    {"name": "ai", "description": "AI 能力：基于 DeepSeek 的意图分析与回复建议。"},
    {"name": "forms", "description": "表单：线索收集表单与提交记录，提交即生成线索并触发事件。"},
    {"name": "landing", "description": "落地页：营销活动独立页、表单挂载、访问埋点。"},
    {"name": "posters", "description": "海报：营销海报设计（样式模板 + 文案 + 二维码目标）。"},
    {"name": "members", "description": "会员系统：等级、积分、积分流水与自动升级。"},
    {"name": "public", "description": "对外可访问的公开落地页 `/l/{slug}`（含可提交的线索表单）。"},
    {"name": "webinars", "description": "线上直播：直播管理，可在直播中向观众发送表单。"},
    {"name": "offline", "description": "线下会议：通过落地页扫码报名、现场签到。"},
    {"name": "orders", "description": "订单：客户订单与购买商品；下单为会员累计积分。"},
]

app = FastAPI(
    title="Nebula 星云 API",
    description=(
        "Marketing Automation Agent 的后端 API。\n\n"
        "核心演示闭环：**收到消息 → 事件总线 → 评分 + 自动化 → 自动发送**。\n\n"
        "交互式文档：Swagger UI 见 `/docs`，ReDoc 见 `/redoc`。"
    ),
    version="0.2.0",
    openapi_tags=tags_metadata,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API = "/api"
app.include_router(dashboard.router, prefix=API)
app.include_router(channels.router, prefix=API)
app.include_router(customers.router, prefix=API)
app.include_router(messages.router, prefix=API)
app.include_router(templates.router, prefix=API)
app.include_router(campaigns.router, prefix=API)
app.include_router(automations.router, prefix=API)
app.include_router(scoring.router, prefix=API)
app.include_router(events.router, prefix=API)
app.include_router(ai.router, prefix=API)
app.include_router(forms.router, prefix=API)
app.include_router(landing.router, prefix=API)
app.include_router(posters.router, prefix=API)
app.include_router(members.router, prefix=API)
app.include_router(webinars.router, prefix=API)
app.include_router(offline.router, prefix=API)
app.include_router(orders.router, prefix=API)
app.include_router(public.router)  # public landing pages at /l/{slug} (no /api prefix)


def _wait_for_db(retries: int = 40, delay: float = 2.0) -> None:
    for attempt in range(1, retries + 1):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return
        except Exception as exc:  # noqa: BLE001
            print(f"[startup] waiting for database ({attempt}/{retries}): {exc}")
            time.sleep(delay)
    raise RuntimeError("database not reachable")


@app.on_event("startup")
def on_startup() -> None:
    _wait_for_db()
    Base.metadata.create_all(bind=engine)
    if seed_if_empty():
        print("[startup] seeded demo data")
    seed_features()


@app.get("/health", tags=["dashboard"], summary="健康检查")
@app.get("/api/health", tags=["dashboard"], summary="健康检查 (API 前缀)")
def health() -> dict:
    return {"status": "ok"}
