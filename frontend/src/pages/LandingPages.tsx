import { useEffect, useState } from 'react'
import { Eye, Plus } from 'lucide-react'
import {
  createLandingPage,
  getForm,
  getLandingPage,
  getLandingPages,
  viewLandingPage,
} from '../api/client'
import type { Form as FormType, LandingPage } from '../api/types'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Badge, { statusTone } from '../components/Badge'
import Modal from '../components/Modal'
import FormRenderer from '../components/FormRenderer'
import { EmptyState, Loading } from '../components/States'
import { formatDateTime } from '../lib/format'

export default function LandingPages() {
  const [pages, setPages] = useState<LandingPage[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<LandingPage | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewPage, setPreviewPage] = useState<LandingPage | null>(null)
  const [previewForm, setPreviewForm] = useState<FormType | null>(null)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [recording, setRecording] = useState(false)
  const [form, setForm] = useState({ title: '', headline: '', body: '', slug: '' })

  const load = () => {
    setLoading(true)
    getLandingPages()
      .then(setPages)
      .catch(() => setPages([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openDetail = (id: number) => {
    setDetailOpen(true)
    getLandingPage(id)
      .then(setSelected)
      .catch(() => undefined)
  }

  const openPreview = (page: LandingPage) => {
    setPreviewPage(page)
    setPreviewForm(null)
    setPreviewOpen(true)
    if (page.form_id != null) {
      getForm(page.form_id)
        .then(setPreviewForm)
        .catch(() => setPreviewForm(null))
    }
  }

  const submit = async () => {
    if (!form.title.trim()) return
    setSubmitting(true)
    try {
      await createLandingPage({
        title: form.title.trim(),
        headline: form.headline || undefined,
        body: form.body || undefined,
        slug: form.slug || undefined,
      })
      setOpen(false)
      setForm({ title: '', headline: '', body: '', slug: '' })
      load()
    } finally {
      setSubmitting(false)
    }
  }

  const recordView = async (page: LandingPage) => {
    setRecording(true)
    try {
      const updated = await viewLandingPage(page.id)
      setPages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      setSelected((cur) => (cur && cur.id === updated.id ? updated : cur))
    } finally {
      setRecording(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="落地页"
        description="搭建营销落地页并追踪曝光转化"
        action={
          <Button data-testid="new-landing-button" onClick={() => setOpen(true)}>
            <Plus size={16} /> 新建落地页
          </Button>
        }
      />

      {loading ? (
        <Loading />
      ) : pages.length === 0 ? (
        <EmptyState text="暂无落地页" />
      ) : (
        <div
          data-testid="landing-table"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {pages.map((p) => (
            <div
              key={p.id}
              data-testid="landing-row"
              onClick={() => openDetail(p.id)}
              className="flex h-full cursor-pointer flex-col rounded-2xl bg-white border border-slate-200/70 shadow-card p-5 transition hover:border-brand-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium text-slate-800">{p.title}</div>
                <Badge tone={statusTone(p.status)}>{p.status}</Badge>
              </div>
              <div className="mt-1 text-xs text-slate-400">/{p.slug}</div>

              <div className="mt-4 flex items-center gap-1.5 text-sm text-slate-500">
                <Eye size={15} className="text-slate-400" />
                浏览量
                <span data-testid="landing-views" className="font-semibold text-slate-700">
                  {p.views}
                </span>
              </div>

              <div className="mt-auto pt-4 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400">{formatDateTime(p.created_at)}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    data-testid="preview-landing-button"
                    onClick={(e) => {
                      e.stopPropagation()
                      openPreview(p)
                    }}
                  >
                    <Eye size={14} /> 预览
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    data-testid="card-record-view"
                    onClick={(e) => {
                      e.stopPropagation()
                      recordView(p)
                    }}
                    disabled={recording}
                  >
                    <Eye size={14} /> 记录访问
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="落地页详情">
        {!selected ? (
          <Loading />
        ) : (
          <div>
            <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-indigo-50 border border-brand-100 p-6">
              <h2 className="text-xl font-bold text-slate-800">
                {selected.headline || selected.title}
              </h2>
              <p className="mt-3 text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                {selected.body || '暂无正文内容'}
              </p>
              <button className="mt-5 inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm">
                立即咨询
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2">
              <div className="text-sm text-slate-500">
                浏览量：
                <span
                  data-testid="landing-detail-views"
                  className="font-semibold text-slate-800"
                >
                  {selected.views}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  data-testid="preview-landing-button"
                  onClick={() => openPreview(selected)}
                >
                  <Eye size={14} /> 预览
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  data-testid="record-view-button"
                  onClick={() => recordView(selected)}
                  disabled={recording}
                >
                  <Eye size={14} /> 记录访问
                </Button>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-400">
              创建于 {formatDateTime(selected.created_at)}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="预览模式">
        {!previewPage ? (
          <Loading />
        ) : (
          <div data-testid="landing-preview">
            <div className="rounded-2xl bg-gradient-to-br from-brand-50 via-white to-indigo-50 border border-brand-100 px-6 py-10 text-center">
              <h1 className="text-2xl font-bold text-slate-900">
                {previewPage.headline || previewPage.title}
              </h1>
              {previewPage.headline && previewPage.title !== previewPage.headline ? (
                <div className="mt-1 text-sm font-medium text-brand-600">
                  {previewPage.title}
                </div>
              ) : null}
              <p className="mx-auto mt-4 max-w-md text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                {previewPage.body || '暂无正文内容'}
              </p>
              <button className="mt-6 inline-flex items-center rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700">
                立即领取
              </button>
            </div>

            {previewPage.form_id != null ? (
              <div className="mt-5 rounded-2xl border border-slate-200 p-5">
                <div className="mb-3 text-sm font-semibold text-slate-700">填写信息，立即咨询</div>
                {previewForm ? (
                  <FormRenderer
                    form={previewForm}
                    testId="landing-preview-form"
                    submitTestId="landing-preview-submit"
                  />
                ) : (
                  <Loading text="加载表单中…" />
                )}
              </div>
            ) : null}
          </div>
        )}
      </Modal>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="新建落地页"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={submit} disabled={submitting || !form.title.trim()}>
              {submitting ? '保存中…' : '保存'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <span className="form-label">标题 *</span>
            <input
              className="form-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="如 新品首发活动"
            />
          </div>
          <div>
            <span className="form-label">主标题 Headline</span>
            <input
              className="form-input"
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              placeholder="可选"
            />
          </div>
          <div>
            <span className="form-label">Slug</span>
            <input
              className="form-input"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="可选，如 spring-sale"
            />
          </div>
          <div>
            <span className="form-label">正文</span>
            <textarea
              className="form-input min-h-[100px]"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="落地页正文内容…"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
