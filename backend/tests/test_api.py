import time
import unittest

from fastapi.testclient import TestClient

from app.main import app


class ApiTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Entering the context manager fires FastAPI startup: create tables + seed.
        cls.ctx = TestClient(app)
        cls.client = cls.ctx.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls.ctx.__exit__(None, None, None)

    # ---- health / dashboard ----
    def test_health(self):
        r = self.client.get("/health")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["status"], "ok")

    def test_dashboard_stats(self):
        r = self.client.get("/api/dashboard/stats")
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertGreater(data["customers"], 0)
        self.assertEqual(len(data["messages_trend"]), 7)
        self.assertGreaterEqual(data["channels_enabled"], 1)

    # ---- channels ----
    def test_channels_seeded_and_patch(self):
        r = self.client.get("/api/channels")
        self.assertEqual(r.status_code, 200)
        channels = r.json()
        self.assertEqual(len(channels), 9)

        cid = channels[0]["id"]
        r2 = self.client.patch(f"/api/channels/{cid}", json={"enabled": True, "config": {"api_key": "x"}})
        self.assertEqual(r2.status_code, 200)
        self.assertTrue(r2.json()["enabled"])
        self.assertEqual(r2.json()["config"]["api_key"], "x")

    # ---- customers ----
    def test_customer_crud_and_tags(self):
        r = self.client.post("/api/customers", json={"name": "单测客户", "phone": "13000000000"})
        self.assertEqual(r.status_code, 201)
        cid = r.json()["id"]

        r2 = self.client.get(f"/api/customers/{cid}")
        self.assertEqual(r2.status_code, 200)
        self.assertIn("messages", r2.json())
        self.assertIn("score_logs", r2.json())

        r3 = self.client.patch(f"/api/customers/{cid}/tags", json={"tags": ["vip", "test"]})
        self.assertEqual(r3.status_code, 200)
        self.assertEqual(r3.json()["tags"], ["vip", "test"])

    # ---- the core loop: inbound -> scoring + automation (eager) ----
    def test_inbound_triggers_scoring_and_automation(self):
        r = self.client.post(
            "/api/messages/inbound",
            json={"customer_name": "单测访客", "channel_key": "wechat", "content": "你好，这款多少钱？"},
        )
        self.assertEqual(r.status_code, 201)
        cid = r.json()["customer_id"]

        # Eager mode runs tasks inline, but allow a tiny settle margin.
        detail = None
        for _ in range(5):
            detail = self.client.get(f"/api/customers/{cid}").json()
            if "已互动" in detail["tags"] and any(m["direction"] == "out" for m in detail["messages"]):
                break
            time.sleep(0.2)

        self.assertIn("已互动", detail["tags"], f"tags={detail['tags']}")
        self.assertTrue(any(m["direction"] == "out" for m in detail["messages"]), "no welcome reply")
        self.assertGreaterEqual(detail["score"], 10, f"score={detail['score']}")

        events = self.client.get("/api/events?limit=50").json()
        types = {e["type"] for e in events}
        self.assertIn("message_received", types)
        self.assertIn("ai.suggestion", types)

    # ---- messages send ----
    def test_send_message(self):
        c = self.client.post("/api/customers", json={"name": "收信人"}).json()
        r = self.client.post("/api/messages/send", json={"customer_id": c["id"], "content": "您好～"})
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.json()["direction"], "out")

    # ---- templates / campaigns / scoring / automations ----
    def test_templates(self):
        r = self.client.post("/api/templates", json={"name": "单测模板", "content": "hi {{customer.name}}"})
        self.assertEqual(r.status_code, 201)
        self.assertTrue(any(t["name"] == "单测模板" for t in self.client.get("/api/templates").json()))

    def test_campaigns(self):
        r = self.client.post("/api/campaigns", json={"name": "单测活动"})
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.json()["status"], "draft")

    def test_scoring_rules(self):
        before = len(self.client.get("/api/scoring/rules").json())
        r = self.client.post(
            "/api/scoring/rules",
            json={"name": "单测规则", "event_type": "page_view", "dimension": "behavior", "points": 3},
        )
        self.assertEqual(r.status_code, 201)
        self.assertEqual(len(self.client.get("/api/scoring/rules").json()), before + 1)

    def test_automations_crud(self):
        r = self.client.post(
            "/api/automations",
            json={"name": "单测自动化", "trigger_event": "form_submitted", "actions": [{"type": "add_tag", "tag": "x"}]},
        )
        self.assertEqual(r.status_code, 201)
        aid = r.json()["id"]
        r2 = self.client.patch(f"/api/automations/{aid}", json={"enabled": False})
        self.assertEqual(r2.status_code, 200)
        self.assertFalse(r2.json()["enabled"])

        runs = self.client.get("/api/automations/runs")
        self.assertEqual(runs.status_code, 200)

    # ---- assistant: message -> inline views ----
    def test_assistant_chat_views(self):
        def views_for(text):
            r = self.client.post("/api/assistant/chat", json={"messages": [{"role": "user", "content": text}]})
            self.assertEqual(r.status_code, 200)
            return r.json()

        self.assertEqual(views_for("看看客户")["views"][0]["type"], "customers")
        self.assertEqual(views_for("打开渠道")["views"][0]["type"], "channels")
        self.assertEqual(views_for("跑一下自动化流程")["views"][0]["type"], "flows")
        self.assertEqual(views_for("看板指标")["views"][0]["type"], "dashboard")
        prof = views_for("查看客户 100002 的画像")
        self.assertEqual(prof["views"][0]["type"], "profile")
        self.assertEqual(prof["views"][0]["customer_id"], 100002)
        self.assertEqual(views_for("你好")["views"], [])  # 无匹配 -> 仅回复

    # ---- AI endpoint (fallback, no key in tests) ----
    def test_ai_suggest_fallback(self):
        r = self.client.post("/api/ai/suggest", json={"content": "这款多少钱？"})
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertTrue(body["suggestion"])
        self.assertEqual(body["source"], "fallback")
        self.assertEqual(body["intent"], "价格询问")


if __name__ == "__main__":
    unittest.main()
