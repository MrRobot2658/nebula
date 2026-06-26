"""Conversational assistant: maps a user message to a reply + inline view cards.

Quasar-style: the chat returns `views[]` and the frontend renders each as an inline
card inside the conversation. View selection is deterministic keyword routing so it's
fast and reliable (no LLM dependency); the reply text is a short Chinese sentence.
"""
import re


def route_message(text: str):
    t = text or ""

    def has(*words) -> bool:
        return any(w in t for w in words)

    m = re.search(r"(\d{2,8})", t)

    if has("画像", "档案", "360", "profile") and m:
        cid = int(m.group(1))
        return f"已为你打开客户 #{cid} 的画像。", [{"type": "profile", "customer_id": cid}]
    if has("看板", "概览", "指标", "趋势", "dashboard", "kpi", "数据"):
        return "这是当前的概览看板。", [{"type": "dashboard"}]
    if has("会员", "积分", "等级", "vip"):
        return "这是会员列表（按积分排序）。", [{"type": "members"}]
    if has("自动化", "流程", "画布", "canvas", "编排", "旅程"):
        return "这是已部署的自动化流程，可直接运行查看执行日志。", [{"type": "flows"}]
    if has("渠道", "channel", "微信", "企微", "公众号", "小程序", "短信", "邮件", "飞书", "钉钉"):
        return "这是渠道接入与配置，可在卡片里模拟事件。", [{"type": "channels"}]
    if has("评分", "打分", "scoring", "线索分"):
        return "这是评分规则。", [{"type": "scoring"}]
    if has("事件", "event", "总线"):
        return "这是实时事件流。", [{"type": "events"}]
    if has("模板"):
        return "这是消息模板库。", [{"type": "templates"}]
    if has("营销活动", "campaign", "活动列表"):
        return "这是营销活动。", [{"type": "campaigns"}]
    if has("表单", "线索收集"):
        return "这是线索收集表单。", [{"type": "forms"}]
    if has("落地页", "landing"):
        return "这是落地页（含公开链接）。", [{"type": "landing"}]
    if has("海报", "poster"):
        return "这是营销海报。", [{"type": "posters"}]
    if has("直播", "webinar"):
        return "这是线上直播。", [{"type": "webinars"}]
    if has("线下", "会议", "签到", "展会"):
        return "这是线下会议（扫码报名）。", [{"type": "offline"}]
    if has("客户", "人群", "用户", "线索", "圈选", "圈人"):
        # Pass a query only if the user named a specific term (e.g. 搜索X / 查找X), else show all.
        mq = re.search(r"(?:搜索|查找|查|找|叫)\s*([\w一-龥]{1,12})", t)
        view = {"type": "customers"}
        if mq:
            view["query"] = mq.group(1)
        return "为你打开了客户列表，可继续输入姓名/手机搜索。", [view]

    return (
        "你可以让我：看客户 / 打开某个客户画像、看渠道、跑自动化流程、看会员与积分、看板指标、事件流、模板/活动/表单/落地页/海报/直播/线下会议。试试「看板」「客户」「自动化」「会员」。",
        [],
    )
