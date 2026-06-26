import { useEffect, useState } from 'react'
import { CheckCircle2, Plus, Radio, Send, Square, Users, Video } from 'lucide-react'
import {
  createWebinar,
  getForms,
  getWebinar,
  getWebinars,
  patchWebinar,
  sendWebinarForm,
} from '../api/client'
import type { Form, Webinar, WebinarDetail } from '../api/types'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import FormRenderer from '../components/FormRenderer'
import { EmptyState, Loading } from '../components/States'
import { formatDateTime } from '../lib/format'

type Tone = 'slate' | 'red' | 'green'

function statusInfo(status: string): { tone: Tone; label: string } {
  switch (status) {
    case 'live':
      return { tone: 'red', label: '直播中' }
    case 'ended':
      return { tone: 'slate', label: '已结束' }
    default:
      return { tone: 'slate', label: '待开始' }
  }
}

function formsSent(stats: Record<string, unknown>): number {
  const v = stats?.forms_sent
  return typeof v === 'number' ? v : 0
}

export default function Webinars() {
  const [webinars, setWebinars] = useState<Webinar[]>([])
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ title: '', host: '', scheduled_at: '', form_id: '' })

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<WebinarDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [patching, setPatching] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const load = () => {
    setLoading(true)
    getWebinars()
      .then(setWebinars)
      .catch(() => setWebinars([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    getForms()
      .then(setForms)
      .catch(() => setForms([]))
  }, [])

  const openCreate = () => {
    setForm({ title: '', host: '', scheduled_at: '', form_id: '' })
    setOpen(true)
  }

  const submit = async () => {
    if (!form.title.trim()) return
    setSubmitting(true)
    try {
      await createWebinar({
        title: form.title.trim(),
        host: form.host || undefined,
        scheduled_at: form.scheduled_at || undefined,
        form_id: form.form_id === '' ? undefined : Number(form.form_id),
      })
      setOpen(false)
      load()
    } finally {
      setSubmitting(false)
    }
  }

  const openDetail = (id: number) => {
    setDetailOpen(true)
    setSent(false)
    setLoadingDetail(true)
    getWebinar(id)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoadingDetail(false))
  }

  const changeStatus = async (status: string) => {
    if (!detail) return
    setPatching(true)
    try {
      const updated = await patchWebinar(detail.id, { status })
      setDetail((cur) => (cur ? { ...cur, status: updated.status, stats: updated.stats } : cur))
      setWebinars((prev) => prev.map((w) => (w.id === updated.id ? updated : w)))
    } finally {
      setPatching(false)
    }
  }

  const handleSendForm = async () => {
    if (!detail) return
    setSending(true)
    try {
      const updated = await sendWebinarForm(detail.id)
      setDetail(updated)
      setSent(true)
      setWebinars((prev) =>
        prev.map((w) => (w.id === updated.id ? { ...w, stats: updated.stats } : w))
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="线上直播"
        description="编排直播营销活动，直播中向观众推送报名表单"
        action={
          <Button data-testid="new-webinar-button" onClick={openCreate}>
            <Plus size={16} /> 新建直播
          </Button>
        }
      />

      {loading ? (
        <Loading />
      ) : webinars.length === 0 ? (
        <EmptyState text="暂无直播" />
      ) : (
        <div
          data-testid="webinar-grid"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {webinars.map((w) => {
            const s = statusInfo(w.status)
            return (
              <div
                key={w.id}
                data-testid="webinar-card"
                onClick={() => openDetail(w.id)}
                className="flex h-full cursor-pointer flex-col rounded-2xl bg-white border border-slate-200/70 shadow-card p-5 transition hover:border-brand-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                      <Video size={16} />
                    </div>
                    <div className="font-medium text-slate-800">{w.title}</div>
                  </div>
                  <Badge tone={s.tone}>{s.label}</Badge>
                </div>

                <div className="mt-3 space-y-1 text-sm text-slate-500">
                  <div>主讲：{w.host || '-'}</div>
                  <div>时间：{w.scheduled_at ? formatDateTime(w.scheduled_at) : '待定'}</div>
                </div>

                <div className="mt-auto pt-4 flex items-center justify-between text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Send size={12} /> 已发送表单 {formsSent(w.stats)}
                  </span>
                  <span>{formatDateTime(w.created_at)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail modal */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="直播详情">
        {loadingDetail ? (
          <Loading />
        ) : !detail ? (
          <EmptyState text="加载失败" />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-base font-semibold text-slate-800">{detail.title}</div>
                <div className="text-xs text-slate-400">
                  主讲 {detail.host || '-'} ·{' '}
                  {detail.scheduled_at ? formatDateTime(detail.scheduled_at) : '待定'}
                </div>
              </div>
              <Badge tone={statusInfo(detail.status).tone}>
                {statusInfo(detail.status).label}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => changeStatus('live')}
                disabled={patching || detail.status === 'live'}
              >
                <Radio size={14} /> 开始直播
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => changeStatus('ended')}
                disabled={patching || detail.status === 'ended'}
              >
                <Square size={14} /> 结束直播
              </Button>
            </div>

            <div className="flex items-center gap-4 rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <span className="inline-flex items-center gap-1 text-slate-600">
                <Users size={15} className="text-slate-400" /> 报名人数
                <span className="font-semibold text-slate-800">{detail.registrations}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-slate-600">
                <Send size={15} className="text-slate-400" /> 已发送表单
                <span
                  data-testid="webinar-forms-sent"
                  className="font-semibold text-slate-800"
                >
                  {formsSent(detail.stats)}
                </span>
              </span>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">报名表单</span>
                <Button
                  size="sm"
                  data-testid="send-form-button"
                  onClick={handleSendForm}
                  disabled={sending || !detail.form}
                >
                  {sent ? (
                    <>
                      <CheckCircle2 size={14} /> 已发送
                    </>
                  ) : (
                    <>
                      <Send size={14} /> {sending ? '发送中…' : '发送表单'}
                    </>
                  )}
                </Button>
              </div>
              {detail.form ? (
                <div className="rounded-2xl border border-slate-200 p-4">
                  <FormRenderer
                    form={detail.form}
                    testId="webinar-form-preview"
                    submitTestId="webinar-form-submit"
                  />
                </div>
              ) : (
                <div className="text-sm text-slate-400">未关联报名表单</div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Create modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="新建直播"
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
            <span className="form-label">直播标题 *</span>
            <input
              className="form-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="如 新品发布直播"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="form-label">主讲人</span>
              <input
                className="form-input"
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
                placeholder="可选"
              />
            </div>
            <div>
              <span className="form-label">开播时间</span>
              <input
                type="datetime-local"
                className="form-input"
                value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
              />
            </div>
          </div>
          <div>
            <span className="form-label">报名表单</span>
            <select
              className="form-input"
              value={form.form_id}
              onChange={(e) => setForm({ ...form, form_id: e.target.value })}
            >
              <option value="">不关联表单</option>
              {forms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
