import unittest

from fastapi.testclient import TestClient

from app.database import session_scope
from app.events import emit_event
from app.main import app
from app.membership import level_for, next_level


class FeaturesTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ctx = TestClient(app)
        cls.client = cls.ctx.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls.ctx.__exit__(None, None, None)

    # ---- forms ----
    def test_forms_seeded_create_and_submit(self):
        self.assertGreaterEqual(len(self.client.get("/api/forms").json()), 1)

        form = self.client.post(
            "/api/forms",
            json={"name": "单测表单", "channel_key": "website",
                  "fields": [{"key": "name", "label": "姓名", "type": "text", "required": True}]},
        ).json()

        r = self.client.post(
            f"/api/forms/{form['id']}/submit",
            json={"name": "表单单测客户", "phone": "13900000999", "data": {"name": "表单单测客户", "demand": "想了解新品"}},
        )
        self.assertEqual(r.status_code, 201)
        cid = r.json()["customer_id"]
        self.assertIsNotNone(cid)

        # form_submitted event fired + scoring rule (+10) applied
        types = {e["type"] for e in self.client.get("/api/events?limit=80").json()}
        self.assertIn("form_submitted", types)
        cust = self.client.get(f"/api/customers/{cid}").json()
        self.assertIn("表单线索", cust["tags"])
        self.assertGreaterEqual(cust["score"], 10)

        detail = self.client.get(f"/api/forms/{form['id']}").json()
        self.assertGreaterEqual(len(detail["submissions"]), 1)

    # ---- landing pages ----
    def test_landing_create_and_view(self):
        self.assertGreaterEqual(len(self.client.get("/api/landing-pages").json()), 1)
        page = self.client.post(
            "/api/landing-pages",
            json={"title": "单测落地页", "headline": "标题", "body": "正文"},
        ).json()
        self.assertTrue(page["slug"])

        before = page["views"]
        r = self.client.post(f"/api/landing-pages/{page['id']}/view")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["views"], before + 1)
        self.assertIn("visit_recorded", {e["type"] for e in self.client.get("/api/events?limit=80").json()})

    # ---- posters ----
    def test_posters(self):
        self.assertGreaterEqual(len(self.client.get("/api/posters").json()), 2)
        self.assertIn("aurora", self.client.get("/api/posters/templates").json())
        r = self.client.post("/api/posters", json={"name": "单测海报", "template": "ocean", "title": "标题", "subtitle": "副标题"})
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.json()["template"], "ocean")

    # ---- members: enroll, adjust points, auto level-up ----
    def test_members_enroll_and_levelup(self):
        c = self.client.post("/api/customers", json={"name": "会员单测"}).json()
        m = self.client.post("/api/members", json={"customer_id": c["id"]})
        self.assertEqual(m.status_code, 201)
        self.assertEqual(m.json()["level"], "普通会员")

        r = self.client.post(f"/api/members/{c['id']}/points", json={"delta": 150, "reason": "单测加分"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["level"], "银卡会员")
        self.assertEqual(r.json()["points"], 150)

        detail = self.client.get(f"/api/members/{c['id']}").json()
        self.assertEqual(detail["next_level"], "金卡会员")
        self.assertGreaterEqual(len(detail["transactions"]), 1)

    # ---- membership: order_placed awards points via the event pipeline ----
    def test_order_placed_awards_points(self):
        c = self.client.post("/api/customers", json={"name": "下单会员"}).json()
        self.client.post("/api/members", json={"customer_id": c["id"]})

        with session_scope() as db:
            emit_event(db, "order_placed", customer_id=c["id"], payload={"points": 120})

        member = self.client.get(f"/api/members/{c['id']}").json()
        self.assertEqual(member["points"], 120)
        self.assertEqual(member["level"], "银卡会员")


class MembershipUtilTest(unittest.TestCase):
    def test_level_for(self):
        self.assertEqual(level_for(0), "普通会员")
        self.assertEqual(level_for(99), "普通会员")
        self.assertEqual(level_for(100), "银卡会员")
        self.assertEqual(level_for(500), "金卡会员")
        self.assertEqual(level_for(5000), "钻石会员")

    def test_next_level(self):
        nxt, need = next_level(80)
        self.assertEqual(nxt, "银卡会员")
        self.assertEqual(need, 20)
        nxt2, need2 = next_level(99999)
        self.assertIsNone(nxt2)


if __name__ == "__main__":
    unittest.main()
