import types
import unittest

from app.llm import analyze_message
from app.tasks import _render


class LlmFallbackTest(unittest.TestCase):
    """No API key is set in tests, so analyze_message must use the heuristic fallback."""

    def test_returns_dict_shape(self):
        result = analyze_message("你好")
        self.assertIn("intent", result)
        self.assertIn("suggestion", result)
        self.assertEqual(result["source"], "fallback")

    def test_keyword_routing(self):
        self.assertEqual(analyze_message("我要退款")["intent"], "售后")
        self.assertEqual(analyze_message("这个多少钱")["intent"], "价格询问")
        self.assertEqual(analyze_message("我要投诉")["intent"], "投诉")

    def test_default_intent(self):
        self.assertEqual(analyze_message("随便聊聊")["intent"], "产品咨询")


class RenderTemplateTest(unittest.TestCase):
    def test_variable_injection(self):
        customer = types.SimpleNamespace(name="李四", phone="138", email="", score=60)
        out = _render("您好 {{customer.name}}，评分 {{customer.score}}", customer)
        self.assertEqual(out, "您好 李四，评分 60")

    def test_unknown_var_left_intact(self):
        customer = types.SimpleNamespace(name="李四", phone="", email="", score=0)
        out = _render("{{campaign.discount}}", customer)
        self.assertEqual(out, "{{campaign.discount}}")


if __name__ == "__main__":
    unittest.main()
