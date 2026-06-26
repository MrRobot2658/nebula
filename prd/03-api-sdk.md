# API & SDK 接口规范

> **文档版本** v0.2 ｜ 对应后端实现：FastAPI（`backend/`）

Nebula 通过 **REST API + 事件总线 + Skill SDK** 与第三方系统对接，并支持开发自定义 Skill。
后端已随项目提供可运行实现，并自带 **Swagger / OpenAPI** 交互式文档。

## 一、交互式文档（Swagger）

后端基于 FastAPI，所有接口自动生成 OpenAPI 文档：

| 文档 | 地址（本地启动后） |
| --- | --- |
| Swagger UI | `http://localhost:8000/docs` |
| ReDoc | `http://localhost:8000/redoc` |
| OpenAPI JSON | `http://localhost:8000/openapi.json` |

> 启动方式见根目录 `README.md`：`docker compose up -d --build`。

## 二、核心闭环

后端演示了 Nebula 的核心事件驱动闭环：

```
收到消息 (POST /api/messages/inbound)
   └─ 写入事件总线：message_received
        ├─ 评分模型：按 ScoreRule 给客户加分（达阈值再发出 score.threshold_reached）
        ├─ 自动化：匹配 trigger_event 的规则 → 发模板 / 打标签 / 加分
        └─ AI（DeepSeek）：意图分析 + 回复建议 → 事件 ai.suggestion
```

评分与自动化由 **Celery Worker** 异步消费事件总线（Redis 为 broker），数据持久化于 **MySQL**。

## 三、REST API 一览

所有业务接口以 `/api` 为前缀。Base URL（本地）：`http://localhost:8000`。

### 概览 Dashboard
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/dashboard/stats` | 概览统计：客户数、今日消息、进行中活动、平均评分、7 日消息趋势、最近事件 |
| `GET` | `/health` · `/api/health` | 健康检查 |

### 渠道 Channels
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/channels` | 渠道列表（9 个） |
| `PATCH` | `/api/channels/{channel_id}` | 启用/停用、更新配置 |

### 客户 Customers
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/customers?search=&limit=` | 客户列表 / 搜索 |
| `POST` | `/api/customers` | 新建客户 |
| `GET` | `/api/customers/{id}` | 客户详情（含消息 + 评分时间线） |
| `PATCH` | `/api/customers/{id}/tags` | 更新标签 |

### 消息 Messages
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/messages?customer_id=` | 消息历史 |
| `POST` | `/api/messages/send` | 发送消息（出站，模拟渠道投递） |
| `POST` | `/api/messages/inbound` | 模拟收到消息（入站，**触发事件总线**） |

入站请求示例：

```json
{ "customer_name": "李四", "channel_key": "wechat", "content": "你好，这款多少钱？" }
```

### 内容 / 活动 / 评分
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` · `POST` | `/api/templates` | 模板列表 / 新建模板 |
| `GET` · `POST` | `/api/campaigns` | 活动列表 / 新建活动 |
| `GET` · `POST` | `/api/automations` | 自动化列表 / 新建规则 |
| `PATCH` | `/api/automations/{id}` | 启用/停用自动化 |
| `GET` | `/api/automations/runs` | 自动化执行记录 |
| `GET` · `POST` | `/api/scoring/rules` | 评分规则列表 / 新建规则 |
| `GET` | `/api/events?limit=` | 事件总线事件流 |

### AI（DeepSeek）
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/api/ai/suggest` | 意图分析与回复建议（`deepseek-chat`，失败回退本地启发式） |

请求 / 响应示例：

```json
// POST /api/ai/suggest
{ "customer_id": 1, "content": "这个产品怎么卖？" }
// →
{ "intent": "价格询问", "suggestion": "您好，这就为您介绍并附上优惠～", "sentiment": "neutral", "source": "deepseek" }
```

## 四、事件类型

| 事件 | 触发时机 |
| --- | --- |
| `message_received` | 收到入站消息 |
| `score.threshold_reached` | 客户评分越过阈值（默认 80） |
| `ai.suggestion` | AI 完成意图分析与建议 |

## 五、Skill SDK

基于 SDK 开发自定义 Skill 的接口规范（设计态）。

### 注册结构

```json
{
  "name": "my-custom-skill",
  "version": "1.0.0",
  "category": "channel",
  "handlers": { "message_received": "fn" },
  "ui": { "component": "...", "icon": "...", "label": "..." }
}
```

### SDK 核心方法

| 方法 | 说明 |
| --- | --- |
| `nebula.message.send(ch, cid, c)` | 发送消息 |
| `nebula.customer.get(id)` | 获取客户 |
| `nebula.customer.update(id, d)` | 更新客户 |
| `nebula.event.emit(ev, d)` | 发出事件 |
| `nebula.event.on(ev, h)` | 监听事件 |
| `nebula.asset.query(opts)` | 搜索素材 |
| `nebula.log.info(m)` | 审计日志 |

相关阅读：[核心概念](01-concepts.md) ｜ [统一数据层](02-data-layer.md)
