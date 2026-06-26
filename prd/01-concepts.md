# 核心概念 Core Concepts

> **文档版本** v0.2

理解 Nebula 只需要四个概念：Skill、ChatUI、事件总线、OneID。

## 一、Skill（插件）

Skill 是 Nebula 的基本功能单元。渠道、内容、活动能力全部以 Skill 形式接入，可插拔、可组合。每个 Skill 包含四部分：

| 组成 | 说明 |
| --- | --- |
| **Handler** | 业务逻辑，处理输入并产生输出 |
| **UI Component** | 在 ChatUI 中的展示组件 |
| **Config Schema** | JSON Schema 定义的配置项 |
| **Events** | 该 Skill 发出和监听的事件 |

> 20 个核心 Skill 预装开箱即用；特殊定制可通过 Skill SDK 开发自有 Skill。

## 二、ChatUI 三栏布局

ChatUI 是 Nebula 的核心交互范式，对话居中、上下文环绕，所有营销动作都围绕一次真实对话自然展开。

| 区域 | 宽度 | 内容 |
| --- | --- | --- |
| **左栏** | 260px | 导航面板，渠道 / 内容 / 活动分区 |
| **中栏** | 700px | 对话主界面 + AI 建议 + 快捷回复 |
| **右栏** | 540px | 客户卡片 + 活动状态 + 自动化规则 |

日常操作在 ChatUI 中完成；复杂配置（自动化画布、评分模型、报表）通过弹出侧滑面板或独立页面承载。

## 三、事件总线

事件总线是驱动所有 Skill 协同的中枢。采用发布/订阅模式，至少一次投递，事件持久化至数据库并支持回放，跨 Skill 消息延迟 < 100ms。

常见事件：

- `message_received` / `message_sent`
- `customer_updated` / `score_changed`
- `action_triggered` / `schedule_fired`

任一渠道 Skill 发出的事件都可被触发器、评分、自动化等活动模块消费。

## 四、OneID（身份统一）

OneID 负责跨渠道身份自动关联，把同一个人在不同渠道留下的身份合并为一个客户。

- **ID 映射**：微信 OpenID → 企微 ExternalUserID → 小程序 UnionID → 手机号 → 邮箱 → 设备 ID
- **合并策略**：确定性匹配（手机号 / UnionID）+ 概率匹配（行为相似度）
- **冲突解决**：优先级规则 + 人工合并

> 微信、小程序、企微、官网上的同一客户会被自动识别并合并到同一份客户档案中。

相关阅读：[统一数据层](02-data-layer.md)
