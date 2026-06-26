#!/usr/bin/env python3
"""End-to-end test for the Nebula stack (stdlib only — no pip deps required).

Exercises the core loop against a running `docker compose` stack:
  inbound message -> event bus -> scoring + automation -> auto welcome reply + tag,
plus channels/dashboard/AI endpoints. Run AFTER `docker compose up`.

Usage:  python3 e2e/test_e2e.py            (defaults to http://localhost:8000)
        BASE=http://host:8000 python3 e2e/test_e2e.py
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request

BASE = os.getenv("BASE", "http://localhost:8000")
passed = 0
failed = 0


def _req(method, path, body=None):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw = resp.read().decode()
        return resp.status, (json.loads(raw) if raw else None)


def get(path):
    return _req("GET", path)


def post(path, body):
    return _req("POST", path, body)


def check(name, cond, detail=""):
    global passed, failed
    if cond:
        passed += 1
        print(f"  \033[32m✓\033[0m {name}")
    else:
        failed += 1
        print(f"  \033[31m✗\033[0m {name}  {detail}")


def wait_for_health(retries=60, delay=2.0):
    for i in range(retries):
        try:
            status, body = get("/health")
            if status == 200 and body.get("status") == "ok":
                return True
        except Exception:
            pass
        time.sleep(delay)
        print(f"  …waiting for backend ({i + 1}/{retries})")
    return False


def main():
    print(f"E2E against {BASE}\n")

    print("[0] backend health")
    check("backend healthy", wait_for_health(), "backend never became healthy")
    if failed:
        return

    print("[1] seed + dashboard")
    _, stats = get("/api/dashboard/stats")
    check("dashboard customers > 0", stats["customers"] > 0, str(stats.get("customers")))
    check("messages_trend has 7 points", len(stats["messages_trend"]) == 7)
    check("channels enabled >= 1", stats["channels_enabled"] >= 1)

    print("[2] channels seeded (9)")
    _, channels = get("/api/channels")
    check("9 channels", len(channels) == 9, f"got {len(channels)}")

    print("[3] inbound message triggers automation + scoring")
    _, msg = post(
        "/api/messages/inbound",
        {"customer_name": "E2E访客", "channel_key": "wechat", "content": "你好，这款多少钱？"},
    )
    cid = msg["customer_id"]
    check("inbound message stored", msg["direction"] == "in" and msg["id"] > 0)

    # Poll for async automation effects (welcome reply + tag + score).
    ok_tag = ok_out = ok_score = False
    detail = {}
    for _ in range(20):
        _, cust = get(f"/api/customers/{cid}")
        detail = {"score": cust["score"], "tags": cust["tags"], "msgs": len(cust["messages"])}
        ok_tag = "已互动" in cust["tags"]
        ok_out = any(m["direction"] == "out" for m in cust["messages"])
        ok_score = cust["score"] >= 10
        if ok_tag and ok_out and ok_score:
            break
        time.sleep(1.5)

    check("automation added tag 已互动", ok_tag, str(detail))
    check("automation sent welcome (outbound msg)", ok_out, str(detail))
    check("scoring applied (score >= 10)", ok_score, str(detail))

    print("[4] event bus recorded events")
    _, events = get("/api/events?limit=50")
    types = {e["type"] for e in events}
    check("message_received event present", "message_received" in types, str(types))
    check("ai.suggestion event present", "ai.suggestion" in types, str(types))

    print("[5] AI suggest endpoint")
    _, ai = post("/api/ai/suggest", {"customer_id": cid, "content": "这个产品怎么卖？"})
    check("AI returns non-empty suggestion", bool(ai.get("suggestion")), str(ai)[:200])
    print(f"      intent={ai.get('intent')!r} source={ai.get('source')!r}")

    print("[6] outbound send endpoint")
    _, sent = post("/api/messages/send", {"customer_id": cid, "content": "为您奉上产品手册～"})
    check("send returns outbound message", sent["direction"] == "out")

    print(f"\n{'='*40}\nPASSED {passed}  FAILED {failed}\n{'='*40}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    try:
        main()
    except urllib.error.URLError as e:
        print(f"\033[31mCONNECTION ERROR\033[0m: {e}\nIs the stack up? `docker compose up -d`")
        sys.exit(2)
