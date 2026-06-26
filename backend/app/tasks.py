"""Celery tasks: the async heart of Nebula.

Flow demonstrated by the vertical slice:
  inbound message  --> emit `message_received`
                    --> dispatch_event:
                          1. run_scoring  (apply ScoreRules, maybe cross threshold)
                          2. run_automations (fire matching Automations: send template / tag / score)
  threshold crossed --> emit `score.threshold_reached` --> dispatch_event (more automations)
  outbound message --> send_message (simulated delivery -> status 'sent')
"""
import re

from .celery_app import celery_app
from .config import settings
from .database import session_scope
from .membership import level_for
from .models import (
    Automation,
    AutomationRun,
    Channel,
    Customer,
    Event,
    Member,
    Message,
    PointTransaction,
    ScoreLog,
    ScoreRule,
    Template,
)


def _render(template_content: str, customer: Customer) -> str:
    """Minimal {{var}} interpolation for the customer namespace."""
    mapping = {
        "customer.name": customer.name or "",
        "customer.phone": customer.phone or "",
        "customer.email": customer.email or "",
        "customer.score": str(customer.score),
    }

    def repl(match: "re.Match") -> str:
        key = match.group(1).strip()
        return mapping.get(key, match.group(0))

    return re.sub(r"\{\{\s*([\w.]+)\s*\}\}", repl, template_content)


@celery_app.task(name="app.tasks.send_message")
def send_message(message_id: int) -> str:
    """Simulate channel delivery of an outbound message."""
    with session_scope() as db:
        msg = db.get(Message, message_id)
        if not msg:
            return "missing"
        msg.status = "sent"
    return "sent"


def _run_scoring(db, event: Event) -> list[dict]:
    logs: list[dict] = []
    if event.customer_id is None:
        return logs
    customer = db.get(Customer, event.customer_id)
    if not customer:
        return logs

    rules = db.query(ScoreRule).filter(ScoreRule.event_type == event.type).all()
    before = customer.score
    for rule in rules:
        customer.score += rule.points
        db.add(
            ScoreLog(
                customer_id=customer.id,
                delta=rule.points,
                reason=f"{rule.name}（{event.type}）",
                total_after=customer.score,
            )
        )
        logs.append({"rule": rule.name, "delta": rule.points, "total": customer.score})

    db.flush()

    # Threshold crossing -> emit a derived event (consumed by high-intent automations).
    if before < settings.SCORE_THRESHOLD <= customer.score:
        threshold_event = Event(
            type="score.threshold_reached",
            customer_id=customer.id,
            channel_key=event.channel_key,
            payload={"score": customer.score, "threshold": settings.SCORE_THRESHOLD},
        )
        db.add(threshold_event)
        db.flush()
        # Re-enter the dispatcher for the new event.
        dispatch_event.delay(threshold_event.id)
        logs.append({"threshold_reached": customer.score})

    return logs


def _execute_actions(db, automation: Automation, event: Event) -> dict:
    customer = db.get(Customer, event.customer_id) if event.customer_id else None
    log: dict = {"actions": []}
    if not customer:
        return log

    for action in automation.actions or []:
        atype = action.get("type")
        if atype == "add_tag":
            tag = action.get("tag")
            tags = list(customer.tags or [])
            if tag and tag not in tags:
                tags.append(tag)
                customer.tags = tags
            log["actions"].append({"add_tag": tag})

        elif atype == "adjust_score":
            pts = int(action.get("points", 0))
            customer.score += pts
            db.add(
                ScoreLog(
                    customer_id=customer.id,
                    delta=pts,
                    reason=f"自动化：{automation.name}",
                    total_after=customer.score,
                )
            )
            log["actions"].append({"adjust_score": pts})

        elif atype == "set_stage":
            customer.stage = action.get("stage", customer.stage)
            log["actions"].append({"set_stage": customer.stage})

        elif atype == "send_template":
            template = None
            tpl_id = action.get("template_id")
            if tpl_id:
                template = db.get(Template, tpl_id)
            if template is None:
                tpl_name = action.get("template")
                if tpl_name:
                    template = db.query(Template).filter(Template.name == tpl_name).first()

            content = _render(template.content, customer) if template else action.get("content", "")
            channel_key = event.channel_key or customer.source_channel
            channel = db.query(Channel).filter(Channel.key == channel_key).first() if channel_key else None

            out = Message(
                customer_id=customer.id,
                channel_id=channel.id if channel else None,
                channel_key=channel_key,
                direction="out",
                content=content,
                template_id=template.id if template else None,
                status="queued",
            )
            db.add(out)
            db.flush()
            send_message.delay(out.id)
            log["actions"].append({"send_template": template.name if template else "(inline)", "message_id": out.id})

    return log


def _run_automations(db, event: Event) -> list[dict]:
    results: list[dict] = []
    automations = (
        db.query(Automation)
        .filter(Automation.enabled.is_(True), Automation.trigger_event == event.type)
        .all()
    )
    customer = db.get(Customer, event.customer_id) if event.customer_id else None

    for automation in automations:
        # Simple condition support: { "min_score": N }
        cond = automation.conditions or {}
        min_score = cond.get("min_score")
        if min_score is not None and (customer is None or customer.score < int(min_score)):
            continue

        log = _execute_actions(db, automation, event)
        run = AutomationRun(
            automation_id=automation.id,
            automation_name=automation.name,
            customer_id=event.customer_id,
            status="done",
            log=log,
        )
        db.add(run)
        results.append({"automation": automation.name, "log": log})

    return results


@celery_app.task(name="app.tasks.dispatch_event")
def dispatch_event(event_id: int) -> dict:
    """Consume a persisted event: run scoring, then matching automations."""
    with session_scope() as db:
        event = db.get(Event, event_id)
        if not event:
            return {"error": "event not found"}

        scoring = _run_scoring(db, event)
        membership = _run_membership(db, event)
        automations = _run_automations(db, event)
        ai = _run_ai_suggestion(db, event)

    return {"event": event_id, "scoring": scoring, "membership": membership, "automations": automations, "ai": ai}


def _run_membership(db, event: Event) -> dict:
    """Award loyalty points to enrolled members on `order_placed`, auto-upgrading level."""
    if event.type != "order_placed" or event.customer_id is None:
        return {}
    member = db.query(Member).filter(Member.customer_id == event.customer_id).first()
    if not member:
        return {}
    points = int((event.payload or {}).get("points", 50))
    old_level = member.level
    member.points += points
    member.level = level_for(member.points)
    db.add(
        PointTransaction(
            customer_id=event.customer_id,
            delta=points,
            reason="订单积分",
            balance_after=member.points,
        )
    )
    db.flush()
    result = {"points": points, "total": member.points, "level": member.level}
    if member.level != old_level:
        db.add(
            Event(
                type="member.level_up",
                customer_id=event.customer_id,
                payload={"from": old_level, "to": member.level},
            )
        )
        result["level_up"] = f"{old_level} → {member.level}"
    return result


def _run_ai_suggestion(db, event: Event) -> dict:
    """For inbound messages, ask DeepSeek for intent + reply suggestion and record it
    as an `ai.suggestion` event so the ChatUI / event stream can surface AI activity."""
    if event.type != "message_received" or event.customer_id is None:
        return {}
    try:
        from .llm import analyze_message

        customer = db.get(Customer, event.customer_id)
        content = (event.payload or {}).get("content", "")
        result = analyze_message(content, customer)
        db.add(
            Event(
                type="ai.suggestion",
                customer_id=event.customer_id,
                channel_key=event.channel_key,
                payload=result,
            )
        )
        return result
    except Exception as exc:  # noqa: BLE001
        return {"error": str(exc)[:200]}
