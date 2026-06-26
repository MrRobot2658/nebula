import unittest

from fastapi.testclient import TestClient

from app.main import app


class ChannelsTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ctx = TestClient(app)
        cls.client = cls.ctx.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls.ctx.__exit__(None, None, None)

    # ---- detail: capabilities / events / config_schema ----
    def test_channel_detail_has_catalog(self):
        r = self.client.get("/api/channels/wechat")
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertEqual(body["channel"]["key"], "wechat")
        self.assertGreater(len(body["capabilities"]), 0)
        self.assertGreater(len(body["events"]), 0)
        self.assertGreater(len(body["config_schema"]), 0)
        self.assertIn("messages_in", body["stats"])
        self.assertIn("messages_out", body["stats"])

    def test_channel_detail_404(self):
        self.assertEqual(self.client.get("/api/channels/does-not-exist").status_code, 404)

    # ---- simulate message_received -> inbound message + event ----
    def test_simulate_message_received(self):
        r = self.client.post(
            "/api/channels/wechat/simulate",
            json={"event_key": "message_received", "content": "你好，想咨询新品"},
        )
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertIsNotNone(body["message"])
        cid = body["event"]["customer_id"]
        self.assertIsNotNone(cid)
        self.assertEqual(body["message"]["direction"], "in")
        self.assertEqual(body["message"]["channel_key"], "wechat")

        # the customer now has an inbound message
        msgs = self.client.get(f"/api/messages?customer_id={cid}").json()
        self.assertTrue(any(m["direction"] == "in" for m in msgs))

        # detail feed for the channel contains message_received
        detail = self.client.get("/api/channels/wechat").json()
        self.assertIn("message_received", {e["type"] for e in detail["recent_events"]})
        self.assertGreaterEqual(detail["stats"]["messages_in"], 1)

    # ---- simulate form_submitted -> event on the channel feed ----
    def test_simulate_form_submitted(self):
        r = self.client.post(
            "/api/channels/website/simulate",
            json={"event_key": "form_submitted", "content": "官网表单线索"},
        )
        self.assertEqual(r.status_code, 200)
        self.assertIsNone(r.json()["message"])

        detail = self.client.get("/api/channels/website").json()
        self.assertIn("form_submitted", {e["type"] for e in detail["recent_events"]})


if __name__ == "__main__":
    unittest.main()
