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

    # ---- public landing page (real URL) ----
    def test_public_landing_url(self):
        page = self.client.post(
            "/api/landing-pages",
            json={"title": "公开页单测", "headline": "欢迎体验新品", "body": "正文内容"},
        ).json()
        before = page["views"]

        r = self.client.get(f"/l/{page['slug']}")
        self.assertEqual(r.status_code, 200)
        self.assertIn("text/html", r.headers["content-type"])
        self.assertIn("欢迎体验新品", r.text)

        # visiting the public URL records a view
        self.assertGreater(self.client.get(f"/api/landing-pages/{page['id']}").json()["views"], before)

        self.assertEqual(self.client.get("/l/this-slug-does-not-exist").status_code, 404)

    def test_public_landing_renders_form(self):
        # seeded summer-launch has a form attached -> page should render a lead form
        r = self.client.get("/l/summer-launch")
        self.assertEqual(r.status_code, 200)
        self.assertIn("lead-form", r.text)

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

    # ---- orders: create order, list, member points awarded ----
    def test_orders_and_member_points(self):
        c = self.client.post("/api/customers", json={"name": "下单客户A"}).json()
        self.client.post("/api/members", json={"customer_id": c["id"]})

        r = self.client.post(
            "/api/orders",
            json={"customer_id": c["id"], "items": [{"name": "商品X", "qty": 2, "price": 100}]},
        )
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.json()["amount"], 200)  # 2 * 100
        self.assertEqual(r.json()["items"][0]["name"], "商品X")

        orders = self.client.get(f"/api/customers/{c['id']}/orders").json()
        self.assertEqual(len(orders), 1)

        # order_placed awards points (amount 1:1) to the member
        member = self.client.get(f"/api/members/{c['id']}").json()
        self.assertEqual(member["points"], 200)
        self.assertEqual(member["level"], "银卡会员")  # 200 >= 100

    # ---- members: search by name ----
    def test_members_search(self):
        c = self.client.post("/api/customers", json={"name": "搜索会员小张"}).json()
        self.client.post("/api/members", json={"customer_id": c["id"]})
        hit = self.client.get("/api/members", params={"search": "搜索会员小张"}).json()
        self.assertTrue(any(m["customer_name"] == "搜索会员小张" for m in hit))
        miss = self.client.get("/api/members", params={"search": "不存在的名字xyz"}).json()
        self.assertEqual(len(miss), 0)

    # ---- membership: order_placed awards points via the event pipeline ----
    def test_order_placed_awards_points(self):
        c = self.client.post("/api/customers", json={"name": "下单会员"}).json()
        self.client.post("/api/members", json={"customer_id": c["id"]})

        with session_scope() as db:
            emit_event(db, "order_placed", customer_id=c["id"], payload={"points": 120})

        member = self.client.get(f"/api/members/{c['id']}").json()
        self.assertEqual(member["points"], 120)
        self.assertEqual(member["level"], "银卡会员")


    # ---- webinars: create, send form during live ----
    def test_webinar_send_form(self):
        self.assertGreaterEqual(len(self.client.get("/api/webinars").json()), 1)

        form = self.client.post(
            "/api/forms",
            json={"name": "直播问卷", "fields": [{"key": "name", "label": "姓名", "type": "text", "required": True}]},
        ).json()
        w = self.client.post("/api/webinars", json={"title": "单测直播", "host": "主持", "form_id": form["id"]}).json()
        self.assertEqual(w["status"], "scheduled")

        # go live
        self.client.patch(f"/api/webinars/{w['id']}", json={"status": "live"})
        # send the form to the audience
        r = self.client.post(f"/api/webinars/{w['id']}/send-form", json={})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["stats"]["forms_sent"], 1)
        self.assertEqual(r.json()["form"]["id"], form["id"])

        self.assertIn("webinar.form_sent", {e["type"] for e in self.client.get("/api/events?limit=80").json()})

    # ---- offline events: landing-page QR registration + checkin ----
    def test_offline_event_registration_and_checkin(self):
        self.assertGreaterEqual(len(self.client.get("/api/offline-events").json()), 1)

        # build form -> landing -> offline event chain
        form = self.client.post(
            "/api/forms",
            json={"name": "签到表单", "fields": [{"key": "name", "label": "姓名", "type": "text", "required": True}]},
        ).json()
        page = self.client.post(
            "/api/landing-pages", json={"title": "线下报名页", "headline": "扫码报名", "form_id": form["id"]}
        ).json()
        ev = self.client.post(
            "/api/offline-events", json={"title": "单测线下会", "location": "北京", "landing_page_id": page["id"]}
        ).json()

        # a visitor registers via the landing's form (扫码报名)
        self.client.post(f"/api/forms/{form['id']}/submit", json={"name": "到场嘉宾", "phone": "13700000123", "data": {"name": "到场嘉宾"}})

        detail = self.client.get(f"/api/offline-events/{ev['id']}").json()
        self.assertEqual(detail["public_url"], f"/l/{page['slug']}")
        self.assertGreaterEqual(detail["registrations"], 1)

        # on-site checkin
        r = self.client.post(f"/api/offline-events/{ev['id']}/checkin", json={})
        self.assertEqual(r.json()["stats"]["checkins"], 1)


    # ---- flows: canvas save, run (local fallback), abtest results ----
    def test_flow_create_save_run(self):
        self.assertGreaterEqual(len(self.client.get("/api/flows").json()), 1)

        flow = self.client.post("/api/flows", json={"name": "单测流程"}).json()
        fid = flow["id"]

        # save a small graph: trigger -> abtest(A/B) -> two actions -> end
        nodes = [
            {"id": "t", "type": "trigger", "position": {"x": 0, "y": 0}, "data": {"event": "message_received"}},
            {"id": "ab", "type": "abtest", "position": {"x": 0, "y": 1}, "data": {"variants": [{"key": "A", "weight": 50}, {"key": "B", "weight": 50}]}},
            {"id": "a1", "type": "action", "position": {"x": 0, "y": 2}, "data": {"action": "adjust_score", "points": 5}},
            {"id": "a2", "type": "action", "position": {"x": 1, "y": 2}, "data": {"action": "add_tag", "tag": "B组"}},
            {"id": "e", "type": "end", "position": {"x": 0, "y": 3}, "data": {}},
        ]
        edges = [
            {"id": "e1", "source": "t", "target": "ab", "sourceHandle": None, "label": None},
            {"id": "e2", "source": "ab", "target": "a1", "sourceHandle": "A", "label": "A"},
            {"id": "e3", "source": "ab", "target": "a2", "sourceHandle": "B", "label": "B"},
            {"id": "e4", "source": "a1", "target": "e", "sourceHandle": None, "label": None},
            {"id": "e5", "source": "a2", "target": "e", "sourceHandle": None, "label": None},
        ]
        saved = self.client.patch(f"/api/flows/{fid}", json={"nodes": nodes, "edges": edges, "status": "active"}).json()
        self.assertEqual(len(saved["nodes"]), 5)

        # run (Airflow unreachable in tests -> local executor, log populated)
        run = self.client.post(f"/api/flows/{fid}/run", json={}).json()
        self.assertEqual(run["executor"], "local")
        self.assertEqual(run["status"], "success")
        self.assertGreaterEqual(len(run["log"]), 3)  # trigger + abtest + action(+end)
        self.assertTrue(any(item["type"] == "abtest" for item in run["log"]))

        # run a few more for AB distribution, then results aggregate
        for _ in range(5):
            self.client.post(f"/api/flows/{fid}/run", json={})
        results = self.client.get(f"/api/flows/{fid}/abtest-results").json()
        self.assertGreaterEqual(sum(r["count"] for r in results), 6)

        self.assertGreaterEqual(len(self.client.get(f"/api/flows/{fid}/runs").json()), 6)


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
