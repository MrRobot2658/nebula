# API & SDK 接口规范

> **文档版本** v0.2

Nebula 通过 **REST API + Webhook + Skill SDK** 与第三方系统对接，并支持开发自定义 Skill。

## 一、REST API

**Base URL**：`https://api.nebula.ai/v1`
**认证**：请求头携带 `Authorization: Bearer <token>`

### 消息 API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/v1/messages/send` | 发送消息到指定渠道 |
| `GET` | `/v1/messages?customer_id={id}&limit=20` | 查询消息历史 |

发送消息请求示例：

```json
{
  "channel": "wechat",
  "customer_id": "wx_123",
  "content": "您好，有什么可以帮您？",
  "template_id": "tpl_welcome"
}
```

### 客户 API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/v1/customers/{id}` | 客户详情（含画像 / 标签 / 评分 / 活动） |
| `GET` | `/v1/customers/search?q={keyword}&tags=high-intent` | 搜索客户 |
| `PATCH` | `/v1/customers/{id}/tags` | 更新标签 |

### 活动 / 自动化 / 评分 API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/v1/campaigns` | 创建活动 |
| `POST` | `/v1/automations` | 创建自动化规则 |
| `GET` | `/v1/customers/{id}/score` | 获取客户评分历史 |
| `POST` | `/v1/customers/{id}/score/adjust` | 手动调整评分 |

## 二、Webhook 事件

Nebula 通过 Webhook 向外部系统推送事件：

| 事件 | 说明 |
| --- | --- |
| `customer.created` | 新客户创建 |
| `message.received` | 收到客户消息 |
| `message.sent` | 消息已发送 |
| `campaign.started` | 活动启动 |
| `campaign.completed` | 活动结束 |
| `automation.triggered` | 自动化触发 |
| `score.threshold_reached` | 评分达阈值 |
| `order.placed` | 新订单产生 |

## 三、Skill SDK

基于 SDK 开发自定义 Skill 的接口规范。

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
