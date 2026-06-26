"""Public, externally-accessible landing pages served at `/l/{slug}` (no /api prefix).

A real shareable URL: renders a standalone HTML marketing page, records a view
(emits `visit_recorded`), and — when a form is attached — renders a working lead
form that POSTs to `/api/forms/{id}/submit`.
"""
import html
import json

from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..events import emit_event
from ..models import Form, LandingPage

router = APIRouter(tags=["public"])

_INPUT_TYPES = {"text": "text", "tel": "tel", "phone": "tel", "email": "email", "number": "number"}


def _field_html(field: dict) -> str:
    key = html.escape(str(field.get("key", "")))
    label = html.escape(str(field.get("label", key)))
    ftype = field.get("type", "text")
    required = "required" if field.get("required") else ""
    star = '<span class="text-rose-500">*</span>' if field.get("required") else ""
    if ftype == "textarea":
        control = (
            f'<textarea name="{key}" rows="3" {required} '
            f'class="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"></textarea>'
        )
    else:
        input_type = _INPUT_TYPES.get(ftype, "text")
        control = (
            f'<input name="{key}" type="{input_type}" {required} '
            f'class="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200" />'
        )
    return (
        f'<div class="mb-4 text-left"><label class="mb-1.5 block text-sm font-medium text-slate-700">'
        f'{label} {star}</label>{control}</div>'
    )


def _render_page(page: LandingPage, form: Form | None) -> str:
    title = html.escape(page.title or "")
    headline = html.escape(page.headline or page.title or "")
    body = html.escape(page.body or "").replace("\n", "<br/>")

    form_section = ""
    if form is not None:
        fields_html = "".join(_field_html(f) for f in (form.fields or []))
        form_section = f"""
        <section id="form" class="mx-auto mt-10 w-full max-w-md">
          <div id="form-wrap" class="rounded-2xl bg-white p-7 text-left shadow-xl ring-1 ring-slate-100">
            <h3 class="mb-1 text-lg font-bold text-slate-900">{html.escape(form.name)}</h3>
            <p class="mb-5 text-sm text-slate-500">填写信息，我们会尽快与您联系</p>
            <form id="lead-form">{fields_html}
              <button type="submit" class="mt-2 w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-700">立即提交</button>
            </form>
          </div>
        </section>
        <script>
          const channel = {json.dumps(page.channel_key)};
          const formId = {json.dumps(form.id)};
          const f = document.getElementById('lead-form');
          f.addEventListener('submit', async (e) => {{
            e.preventDefault();
            const data = Object.fromEntries(new FormData(f).entries());
            const btn = f.querySelector('button[type=submit]');
            btn.disabled = true; btn.textContent = '提交中…';
            try {{
              const res = await fetch('/api/forms/' + formId + '/submit', {{
                method: 'POST', headers: {{ 'Content-Type': 'application/json' }},
                body: JSON.stringify({{ data, name: data.name, phone: data.phone, email: data.email, channel_key: channel }})
              }});
              if (!res.ok) throw new Error(res.status);
              document.getElementById('form-wrap').innerHTML =
                '<div class="py-8 text-center"><div class="text-4xl">✅</div><h3 class="mt-3 text-lg font-bold text-slate-900">提交成功</h3><p class="mt-1 text-sm text-slate-500">我们已收到您的信息，会尽快与您联系！</p></div>';
            }} catch (err) {{
              btn.disabled = false; btn.textContent = '立即提交';
              alert('提交失败，请稍后重试');
            }}
          }});
        </script>
        """

    cta = '<a href="#form" class="mt-8 inline-block rounded-xl bg-white px-7 py-3 font-semibold text-violet-700 shadow-lg transition hover:bg-violet-50">立即参与</a>' if form is not None else ""

    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>{title}</title>
<script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50">
  <main class="min-h-screen">
    <section class="bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-500 px-6 py-20 text-center text-white">
      <div class="mx-auto max-w-3xl">
        <h1 class="text-3xl font-black leading-tight md:text-5xl">{headline}</h1>
        <p class="mt-4 text-lg font-medium text-white/80">{title}</p>
        <p class="mx-auto mt-5 max-w-xl text-white/75">{body}</p>
        {cta}
      </div>
    </section>
    {form_section}
    <footer class="py-10 text-center text-xs text-slate-400">由 Nebula 星云 · Marketing Automation Agent 驱动</footer>
  </main>
</body>
</html>"""


@router.get("/l/{slug}", response_class=HTMLResponse, summary="公开落地页（对外可访问）")
def public_landing(slug: str, db: Session = Depends(get_db)):
    page = db.query(LandingPage).filter(LandingPage.slug == slug).first()
    if not page or page.status != "published":
        return HTMLResponse(
            "<!DOCTYPE html><html lang='zh-CN'><head><meta charset='UTF-8'><title>页面不存在</title>"
            "<script src='https://cdn.tailwindcss.com'></script></head>"
            "<body class='grid min-h-screen place-items-center bg-slate-50 text-center'>"
            "<div><div class='text-6xl'>🔍</div><h1 class='mt-4 text-xl font-bold text-slate-700'>落地页不存在或未发布</h1></div>"
            "</body></html>",
            status_code=404,
        )

    page.views += 1
    db.commit()
    emit_event(db, "visit_recorded", channel_key=page.channel_key, payload={"landing_page_id": page.id, "slug": page.slug})

    form = db.get(Form, page.form_id) if page.form_id else None
    return HTMLResponse(_render_page(page, form))
