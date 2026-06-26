"""Flow execution engine.

Walks an automation flow graph (nodes + edges) and produces a per-node run log.
Shared by the synchronous /run path and the Airflow DAG (via /_execute).
Node types: trigger / condition / action / wait / abtest / branch / end.
"""
import random

from .models import AbAssignment, Customer, Message, ScoreLog, Template


def _index(flow):
    nodes = {n["id"]: n for n in (flow.nodes or [])}
    out: dict = {}
    for e in flow.edges or []:
        out.setdefault(e["source"], []).append(e)
    return nodes, out


def _pick_edge(edges, handle):
    if handle is not None:
        for e in edges:
            if (e.get("sourceHandle") or None) == handle:
                return e
    return edges[0] if edges else None


def _eval_condition(customer, field, op, value) -> bool:
    if customer is None:
        return True  # no context -> assume pass so the flow can be exercised
    if field == "score":
        try:
            target = int(value)
        except (TypeError, ValueError):
            return False
        s = customer.score
        return {">": s > target, ">=": s >= target, "==": s == target, "<": s < target, "<=": s <= target}.get(op, False)
    if field == "tag":
        return str(value) in (customer.tags or [])
    return True


def _weighted_variant(variants):
    keys = [v.get("key", "A") for v in variants] or ["A"]
    weights = [max(0, int(v.get("weight", 1))) for v in variants] or [1]
    if sum(weights) <= 0:
        weights = [1] * len(keys)
    return random.choices(keys, weights=weights, k=1)[0]


def _do_action(db, customer, data) -> str:
    action = data.get("action", "")
    sim = customer is None
    if action == "add_tag":
        tag = data.get("tag", "")
        if customer and tag and tag not in (customer.tags or []):
            customer.tags = list(customer.tags or []) + [tag]
        return ("（模拟）" if sim else "") + f"打标签「{tag}」"
    if action == "adjust_score":
        pts = int(data.get("points", 0) or 0)
        if customer:
            customer.score += pts
            db.add(ScoreLog(customer_id=customer.id, delta=pts, reason="流程动作", total_after=customer.score))
        return ("（模拟）" if sim else "") + f"评分 {'+' if pts >= 0 else ''}{pts}"
    if action == "send_template":
        name = data.get("template", "")
        tpl = db.query(Template).filter(Template.name == name).first() if name else None
        if customer:
            db.add(
                Message(
                    customer_id=customer.id,
                    channel_key=customer.source_channel,
                    direction="out",
                    content=tpl.content if tpl else (name or "（模板）"),
                    template_id=tpl.id if tpl else None,
                    status="queued",
                )
            )
        return ("（模拟）" if sim else "") + f"发送模板「{name}」"
    return f"动作：{action or '未配置'}"


def execute_flow(db, flow, customer_id=None):
    """Return (log, assignments). Mutates customer/db when a customer context is given."""
    nodes, out = _index(flow)
    log: list = []
    assignments: list = []
    customer = db.get(Customer, customer_id) if customer_id else None

    start = next((n for n in nodes.values() if n.get("type") == "trigger"), None)
    if start is None and nodes:
        targets = {e["target"] for e in (flow.edges or [])}
        start = next((n for n in nodes.values() if n["id"] not in targets), None)
    if start is None:
        return log, assignments

    current = start
    steps = 0
    while current and steps < 50:
        steps += 1
        ntype = current.get("type")
        data = current.get("data") or {}
        nid = current["id"]
        edges = out.get(nid, [])
        next_handle = None

        if ntype == "condition":
            ok = _eval_condition(customer, data.get("field", "score"), data.get("op", ">="), data.get("value", ""))
            next_handle = "true" if ok else "false"
            log.append({"node_id": nid, "type": ntype, "detail": f"条件 {data.get('field','score')} {data.get('op','>=')} {data.get('value','')} → {'是' if ok else '否'}"})
        elif ntype == "abtest":
            variants = data.get("variants") or [{"key": "A", "weight": 50}, {"key": "B", "weight": 50}]
            chosen = _weighted_variant(variants)
            next_handle = chosen
            assignments.append({"node_id": nid, "variant": chosen})
            db.add(AbAssignment(flow_id=flow.id, node_id=nid, variant=chosen))
            log.append({"node_id": nid, "type": ntype, "detail": f"AB 测试 → 命中分支 {chosen}"})
        elif ntype == "action":
            log.append({"node_id": nid, "type": ntype, "detail": _do_action(db, customer, data)})
        elif ntype == "wait":
            log.append({"node_id": nid, "type": ntype, "detail": f"等待 {data.get('seconds', 0)} 秒"})
        elif ntype == "trigger":
            log.append({"node_id": nid, "type": ntype, "detail": f"触发：{data.get('event', 'message_received')}"})
        elif ntype == "end":
            log.append({"node_id": nid, "type": ntype, "detail": "结束"})
            break
        else:
            log.append({"node_id": nid, "type": ntype, "detail": ntype})

        edge = _pick_edge(edges, next_handle)
        if not edge:
            break
        current = nodes.get(edge["target"])

    return log, assignments
