"""Static catalog for each channel: capabilities, simulatable events and config schema.

This is presentation/metadata only — it powers the 渠道详情 page (能力列表、事件模拟器、
配置表单). Keyed by the channel `key` used in the DB. Runtime state (enabled/config) still
lives on the Channel model; this module never persists anything.
"""

CHANNEL_CATALOG: dict[str, dict] = {
    "wechat": {
        "capabilities": [
            "消息收发：文本/图片/语音/视频/链接多类型双向收发",
            "好友管理：好友添加、删除与备注标签维护",
            "朋友圈：发布品牌内容并采集点赞、评论互动",
            "支付：收款码、红包、转账等微信支付场景接入",
            "群聊管理：品牌微信群消息与成员统一运营",
            "朋友圈广告：定向投放内容曝光与拉新引流",
        ],
        "events": [
            {"key": "message_received", "label": "收到消息"},
            {"key": "friend_added", "label": "新增好友"},
            {"key": "moments_interacted", "label": "朋友圈互动"},
            {"key": "payment_received", "label": "收到付款"},
        ],
        "config_schema": [
            {"key": "api_key", "label": "API 密钥", "type": "password", "required": True, "placeholder": "your_wechat_api_key"},
            {"key": "webhook_url", "label": "回调地址", "type": "url", "required": False, "placeholder": "https://your-domain.com/webhook"},
        ],
    },
    "wecom": {
        "capabilities": [
            "客户联系：一对一及群聊客户连接通道",
            "客户群管理：客户群创建、运营与裂变增长",
            "标签体系：自动打标签与标签分组分层",
            "会话存档：合规留存员工与客户聊天记录",
            "群发助手：批量向客户或客户群触达内容",
            "渠道活码：按投放来源引流并自动打标签",
            "离职继承：客户关系自动转移给接替人",
            "侧边栏：快捷回复与客户信息卡片接待",
        ],
        "events": [
            {"key": "message_received", "label": "收到消息"},
            {"key": "customer_added", "label": "新增客户"},
            {"key": "group_joined", "label": "客户入群"},
            {"key": "tag_changed", "label": "标签变更"},
        ],
        "config_schema": [
            {"key": "api_key", "label": "API 密钥", "type": "password", "required": True, "placeholder": "your_wecom_api_key"},
            {"key": "webhook_url", "label": "回调地址", "type": "url", "required": False, "placeholder": "https://your-domain.com/webhook"},
        ],
    },
    "mp": {
        "capabilities": [
            "模板消息：订单通知、活动提醒等结构化消息下发",
            "自定义菜单：三级菜单配置与点击统计",
            "图文推送：图文编辑、发布、定时与分组推送",
            "粉丝管理：关注/取关事件与粉丝标签维护",
            "智能回复：关键词自动回复与 AI 客服",
            "二维码：带参二维码追踪渠道来源归因",
            "卡券：优惠券、会员卡推送连接营销转化",
        ],
        "events": [
            {"key": "message_received", "label": "收到消息"},
            {"key": "subscribe", "label": "关注公众号"},
            {"key": "unsubscribe", "label": "取消关注"},
            {"key": "menu_click", "label": "菜单点击"},
            {"key": "qrcode_scanned", "label": "扫码"},
        ],
        "config_schema": [
            {"key": "api_key", "label": "API 密钥", "type": "password", "required": True, "placeholder": "your_mp_api_key"},
            {"key": "webhook_url", "label": "回调地址", "type": "url", "required": False, "placeholder": "https://your-domain.com/webhook"},
            {"key": "app_id", "label": "AppID", "type": "text", "required": True, "placeholder": "wx1234567890abcdef"},
            {"key": "app_secret", "label": "AppSecret", "type": "password", "required": True, "placeholder": "your_mp_app_secret"},
        ],
    },
    "miniapp": {
        "capabilities": [
            "小程序商城：商品展示、购物车、下单支付的交易闭环",
            "模板消息订阅：下单/物流/活动等订阅消息下发",
            "客服消息：小程序内客服会话与售后承接",
            "用户授权：获取手机号、头像昵称用于会员沉淀",
            "支付：集成微信支付与支付宝在线收款",
            "分享裂变：拼团、砍价、分销等社交拉新玩法",
            "数据分析：访问、转化、复购数据采集与决策",
        ],
        "events": [
            {"key": "order_placed", "label": "提交订单"},
            {"key": "payment_success", "label": "支付成功"},
            {"key": "customer_service_msg", "label": "客服消息"},
            {"key": "share_clicked", "label": "分享点击"},
        ],
        "config_schema": [
            {"key": "api_key", "label": "API 密钥", "type": "password", "required": True, "placeholder": "your_miniapp_api_key"},
            {"key": "webhook_url", "label": "Webhook 地址", "type": "url", "required": True, "placeholder": "https://your-domain.com/webhook"},
            {"key": "app_id", "label": "小程序 AppID", "type": "text", "required": True, "placeholder": "wx1234567890abcdef"},
            {"key": "mch_id", "label": "商户号 MchID", "type": "text", "required": True, "placeholder": "1900000000"},
        ],
    },
    "website": {
        "capabilities": [
            "建站系统：拖拽式官网搭建与模板库",
            "落地页：营销活动独立落地页与内置 A/B 测试",
            "表单：线索收集表单与智能分发路由",
            "SEO：页面优化、站点地图与结构化数据",
            "在线客服：官网悬浮客服与 AI 自动回复",
            "访客追踪：识别匿名访客并记录浏览轨迹",
            "聊天插件：嵌入 Nebula ChatUI 打通统一会话",
        ],
        "events": [
            {"key": "form_submitted", "label": "表单提交"},
            {"key": "visit_recorded", "label": "访问记录"},
            {"key": "chat_started", "label": "发起对话"},
            {"key": "lead_generated", "label": "线索生成"},
        ],
        "config_schema": [
            {"key": "api_key", "label": "API 密钥", "type": "password", "required": True, "placeholder": "your_website_api_key"},
            {"key": "webhook_url", "label": "Webhook 地址", "type": "url", "required": True, "placeholder": "https://your-domain.com/webhook"},
            {"key": "site_url", "label": "官网地址", "type": "url", "required": True, "placeholder": "https://www.your-brand.com"},
            {"key": "tracking_id", "label": "访客追踪 ID", "type": "text", "required": False, "placeholder": "NB-TRACK-XXXX"},
        ],
    },
    "feishu": {
        "capabilities": [
            "交互式消息卡片：图文、按钮、表单等富交互卡片",
            "群机器人：自动回复、定时推送与关键词触发",
            "审批：营销活动审批流嵌入执行链路",
            "文档：自动生成营销方案文档并分发",
            "日历：营销活动日程管理与提醒",
            "联系人：同步组织架构并关联客户主档",
        ],
        "events": [
            {"key": "message_received", "label": "收到消息"},
            {"key": "approval_processed", "label": "审批处理"},
            {"key": "bot_mentioned", "label": "机器人被提及"},
            {"key": "doc_created", "label": "文档创建"},
        ],
        "config_schema": [
            {"key": "api_key", "label": "API 密钥", "type": "password", "required": True, "placeholder": "your_feishu_api_key"},
            {"key": "webhook_url", "label": "Webhook 地址", "type": "url", "required": True, "placeholder": "https://your-domain.com/webhook"},
            {"key": "app_id", "label": "应用 App ID", "type": "text", "required": True, "placeholder": "cli_xxxxxxxxxxxx"},
            {"key": "app_secret", "label": "应用 App Secret", "type": "password", "required": True, "placeholder": "your_feishu_app_secret"},
        ],
    },
    "dingtalk": {
        "capabilities": [
            "工作通知：向企业用户工作台下发系统消息与营销推送",
            "群机器人：Webhook 消息推送与关键词自动回复",
            "审批：营销活动与预算审批流程嵌入执行链路",
            "日历：营销活动排期与提醒协同",
            "通讯录：同步企业组织架构构建人企映射",
            "触达结果回流事件总线并经 OneID 关联客户主档",
            "送达率/已读率/审批时长等关键指标追踪",
        ],
        "events": [
            {"key": "message_received", "label": "收到消息"},
            {"key": "group_joined", "label": "加入群组"},
            {"key": "approval_completed", "label": "审批完成"},
        ],
        "config_schema": [
            {"key": "api_key", "label": "API 密钥", "type": "password", "required": True, "placeholder": "your_dingtalk_api_key"},
            {"key": "app_key", "label": "应用 AppKey", "type": "text", "required": True, "placeholder": "dingxxxxxxxxxxxx"},
            {"key": "app_secret", "label": "应用 AppSecret", "type": "password", "required": True, "placeholder": "应用 AppSecret"},
            {"key": "webhook_url", "label": "Webhook 回调地址", "type": "url", "required": True, "placeholder": "https://your-domain.com/webhook"},
            {"key": "agent_id", "label": "AgentId（应用 ID）", "type": "text", "required": False, "placeholder": "如 123456789"},
            {"key": "robot_webhook", "label": "群机器人 Webhook", "type": "url", "required": False, "placeholder": "https://oapi.dingtalk.com/robot/send?access_token=xxx"},
        ],
    },
    "sms": {
        "capabilities": [
            "单发/群发短信：覆盖验证码、通知与营销推文",
            "短信模板管理与审批：保障内容合规并提升发送效率",
            "发送回执追踪：每条短信送达结果可见可分析",
            "定时发送：按设定时间匹配营销节奏与活跃时段",
            "黑名单管理：维护退订/投诉用户避免错误触达",
            "发送频率控制：限制对同一用户发送防止过度打扰",
            "送达/失败/回复事件回流并经 OneID 绑定客户主档",
        ],
        "events": [
            {"key": "sms_delivered", "label": "短信送达"},
            {"key": "sms_failed", "label": "发送失败"},
            {"key": "sms_replied", "label": "短信回复"},
        ],
        "config_schema": [
            {"key": "api_key", "label": "API 密钥", "type": "password", "required": True, "placeholder": "your_sms_api_key"},
            {"key": "webhook_url", "label": "回执回调地址", "type": "url", "required": True, "placeholder": "https://your-domain.com/webhook"},
            {"key": "sign_name", "label": "短信签名", "type": "text", "required": True, "placeholder": "如 【Nebula】"},
            {"key": "template_id", "label": "短信模板 ID", "type": "text", "required": True, "placeholder": "如 SMS_123456789"},
            {"key": "sender_id", "label": "发送方/通道号", "type": "text", "required": False, "placeholder": "网关分配的通道号"},
            {"key": "rate_limit", "label": "单用户发送频率上限（条/日）", "type": "number", "required": False, "placeholder": "如 5"},
        ],
    },
    "email": {
        "capabilities": [
            "HTML 邮件模板编辑器：制作专业品牌化邮件内容",
            "批量发送与定时：向目标人群批量并按时下发",
            "打开率追踪：量化邮件触达的初步效果",
            "链接点击率追踪：识别客户兴趣与高意向行为",
            "退订管理：维护退订列表保障合规与发送健康度",
            "发送域名配置（DKIM/SPF）：提升送达率与防伪信誉",
            "打开/点击/退信/退订事件回流并经 OneID 绑定客户主档",
        ],
        "events": [
            {"key": "email_opened", "label": "邮件打开"},
            {"key": "email_clicked", "label": "链接点击"},
            {"key": "email_bounced", "label": "邮件退信"},
            {"key": "email_unsubscribed", "label": "邮件退订"},
        ],
        "config_schema": [
            {"key": "api_key", "label": "API 密钥", "type": "password", "required": True, "placeholder": "your_email_api_key"},
            {"key": "webhook_url", "label": "事件回调地址", "type": "url", "required": True, "placeholder": "https://your-domain.com/webhook"},
            {"key": "smtp_host", "label": "SMTP 服务器地址", "type": "text", "required": True, "placeholder": "如 smtp.your-domain.com"},
            {"key": "smtp_port", "label": "SMTP 端口", "type": "number", "required": False, "placeholder": "如 465 / 587"},
            {"key": "from_email", "label": "发件邮箱地址", "type": "text", "required": True, "placeholder": "如 marketing@your-domain.com"},
            {"key": "dkim", "label": "DKIM 私钥/选择器", "type": "textarea", "required": False, "placeholder": "粘贴 DKIM 私钥或选择器配置"},
        ],
    },
}


_DEFAULT_CATALOG: dict = {
    "capabilities": ["消息收发：渠道双向消息接入", "事件回流：行为事件统一进入事件总线"],
    "events": [
        {"key": "message_received", "label": "收到消息"},
        {"key": "form_submitted", "label": "表单提交"},
    ],
    "config_schema": [
        {"key": "api_key", "label": "API 密钥", "type": "password", "required": True, "placeholder": "your_api_key"},
        {"key": "webhook_url", "label": "回调地址", "type": "url", "required": False, "placeholder": "https://your-domain.com/webhook"},
    ],
}


def get_catalog(key: str) -> dict:
    """Return the catalog entry for a channel key, falling back to a sane default."""
    return CHANNEL_CATALOG.get(key, _DEFAULT_CATALOG)
