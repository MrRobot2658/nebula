# Nebula 星云

**Marketing Automation Agent** — 以 ChatUI 为核心交互，9 渠道 / 5 内容 / 6 活动 Skill 插件化架构。

🚀 **官网（线上）**: https://nebula-eight-taupe.vercel.app
📖 **产品文档（线上）**: https://nebula-eight-taupe.vercel.app/docs/

本仓库包含三部分：**官网 + 产品文档（静态站，部署在 Vercel）** 与 **可运行的全栈应用（Docker Compose）**。

## 一、目录结构

```
site/                官网 + 产品文档站（部署到 Vercel）
├── index.html       ← 落地页
└── docs/index.html  ← 产品文档阅读器（渲染 prd/ 的 Markdown）
prd/                 产品文档（PRD）源文件：4 篇总览 + 20 个 Skill 模块
backend/             FastAPI + SQLAlchemy + Celery 后端
├── app/             模型 / 路由 / 事件总线 / Celery 任务 / DeepSeek 集成
└── tests/           Python unittest（16 用例）
frontend/            React + TypeScript + Vite + Tailwind（TailAdmin 风格）后台
└── cypress/         Cypress e2e 测试（按页面）
e2e/test_e2e.py      纯标准库 API 冒烟测试
docker-compose.yml   一键启动：mysql + redis + backend + worker + frontend
vercel.json          静态站路由：/ → 官网，/docs → 产品文档
.env                 DeepSeek 密钥（不提交，见 .env.example）
```

## 二、技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | React 18 · TypeScript · Vite · Tailwind（TailAdmin 风格）· Recharts |
| 后端 | FastAPI · SQLAlchemy 2 · Pydantic v2 |
| 异步 | Celery（Redis broker）—— 评分 / 自动化 / AI 异步消费事件总线 |
| 存储 | MySQL 8（业务数据）· Redis 7（broker / result） |
| LLM | DeepSeek（`deepseek-chat`，OpenAI 兼容；失败回退本地启发式） |
| 编排 | Docker Compose |

## 三、快速启动

```bash
# 1. 配置 DeepSeek 密钥
cp .env.example .env   # 然后填入真实的 DEEPSEEK_API_KEY

# 2. 一键启动全栈
docker compose up -d --build
```

| 服务 | 地址 |
| --- | --- |
| 前端控制台 | http://localhost:5173 |
| 后端 API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |
| MySQL | localhost:3306（nebula / nebula） |
| Redis | localhost:6379 |

首次启动后端会自动建表并写入演示数据（9 渠道、示例客户、模板、评分规则、两条自动化）。

## 四、核心闭环

```
收到消息 (POST /api/messages/inbound)
   └─ 事件总线 message_received
        ├─ 评分模型：ScoreRule 加分（达阈值发出 score.threshold_reached）
        ├─ 自动化：匹配规则 → 发模板 / 打标签 / 加分
        └─ AI（DeepSeek）：意图分析 + 回复建议 → ai.suggestion
```

在前端「对话（Inbox）」页点击 **模拟客户来消息**，即可看到评分上升、自动欢迎回复、标签写入与 AI 建议。

## 五、测试

```bash
# 后端 Python 单元测试（16 用例，SQLite + Celery eager，无需外部依赖）
docker compose run --rm -e DEEPSEEK_API_KEY="" backend python -m unittest discover -t . -s tests -v

# 前端 Cypress e2e（需先 docker compose up 起整套栈）
cd frontend && npm install && npm run cypress:run

# 纯标准库 API 冒烟测试（需整套栈运行）
python3 e2e/test_e2e.py
```

## 六、官网 / 文档站（Vercel）

静态站（`site/` + `prd/`）已部署：

- 官网：https://nebula-eight-taupe.vercel.app
- 产品文档：https://nebula-eight-taupe.vercel.app/docs/

`vercel.json` 将 `/` 重写到 `site/index.html`、`/docs` 重写到 `site/docs/index.html`，`/prd/*.md` 作为文档内容源被前端 `fetch` 渲染。
