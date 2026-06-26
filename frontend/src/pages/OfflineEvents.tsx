import { useEffect, useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Plus,
  QrCode,
  UserCheck,
  Users,
} from 'lucide-react'
import {
  checkinOfflineEvent,
  createOfflineEvent,
  getLandingPages,
  getOfflineEvent,
  getOfflineEvents,
  getPosters,
} from '../api/client'
import type {
  LandingPage,
  OfflineEvent,
  OfflineEventDetail,
  Poster,
} from '../api/types'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import { EmptyState, Loading } from '../components/States'
import { formatDateTime } from '../lib/format'

type Tone = 'slate' | 'green'

function statusInfo(status: string): { tone: Tone; label: string } {
  switch (status) {
    case 'ongoing':
    case 'live':
      return { tone: 'green', label: '进行中' }
    case 'ended':
      return { tone: 'slate', label: '已结束' }
    default:
      return { tone: 'slate', label: '待开始' }
  }
}

function statNum(stats: Record<string, unknown>, key: string): number {
  const v = stats?.[key]
  return typeof v === 'number' ? v : 0
}

function qrUrl(data: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
    data
  )}`
}

export default function OfflineEvents() {
  const [events, setEvents] = useState<OfflineEvent[]>([])
  const [landings, setLandings] = useState<LandingPage[]>([])
  const [posters, setPosters] = useState<Poster[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: '',
    location: '',
    scheduled_at: '',
    landing_page_id: '',
    poster_id: '',
  })

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<OfflineEventDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [checking, setChecking] = useState(false)

  const load = () => {
    setLoading(true)
    getOfflineEvents()
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    getLandingPages()
      .then(setLandings)
      .catch(() => setLandings([]))
    getPosters()
      .then(setPosters)
      .catch(() => setPosters([]))
  }, [])

  const openCreate = () => {
    setForm({ title: '', location: '', scheduled_at: '', landing_page_id: '', poster_id: '' })
    setOpen(true)
  }

  const submit = async () => {
    if (!form.title.trim()) return
    setSubmitting(true)
    try {
      await createOfflineEvent({
        title: form.title.trim(),
        location: form.location || undefined,
        scheduled_at: form.scheduled_at || undefined,
        landing_page_id:
          form.landing_page_id === '' ? undefined : Number(form.landing_page_id),
        poster_id: form.poster_id === '' ? undefined : Number(form.poster_id),
      })
      setOpen(false)
      load()
    } finally {
      setSubmitting(false)
    }
  }

  const openDetail = (id: number) => {
    setDetailOpen(true)
    setLoadingDetail(true)
    getOfflineEvent(id)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoadingDetail(false))
  }

  const handleCheckin = async () => {
    if (!detail) return
    setChecking(true)
    try {
      const updated = await checkinOfflineEvent(detail.id)
      setDetail((cur) => (cur ? { ...cur, stats: updated.stats } : cur))
      setEvents((prev) =>
        prev.map((e) => (e.id === updated.id ? { ...e, stats: updated.stats } : e))
      )
    } finally {
      setChecking(false)
    }
  }

  const absoluteUrl = (publicUrl?: string | null) =>
    publicUrl ? `${window.location.origin}${publicUrl}` : ''

  return (
    <div>
      <PageHeader
        title="线下会议"
        description="组织线下活动，扫码报名并现场签到"
        action={
          <Button data-testid="new-offline-button" onClick={openCreate}>
            <Plus size={16} /> 新建线下会议
          </Button>
        }
      />

      {loading ? (
        <Loading />
      ) : events.length === 0 ? (
        <EmptyState text="暂无线下会议" />
      ) : (
        <div
          data-testid="offline-grid"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {events.map((e) => {
            const s = statusInfo(e.status)
            return (
              <div
                key={e.id}
                data-testid="offline-card"
                onClick={() => openDetail(e.id)}
                className="flex h-full cursor-pointer flex-col rounded-2xl bg-white border border-slate-200/70 shadow-card p-5 transition hover:border-brand-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                      <CalendarDays size={16} />
                    </div>
                    <div className="font-medium text-slate-800">{e.title}</div>
                  </div>
                  <Badge tone={s.tone}>{s.label}</Badge>
                </div>

                <div className="mt-3 space-y-1 text-sm text-slate-500">
                  <div className="inline-flex items-center gap-1">
                    <MapPin size={13} className="text-slate-400" />
                    {e.location || '地点待定'}
                  </div>
                  <div>时间：{e.scheduled_at ? formatDateTime(e.scheduled_at) : '待定'}</div>
                </div>

                <div className="mt-auto pt-4 flex items-center gap-4 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Users size={12} /> 报名 {statNum(e.stats, 'registrations')}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <UserCheck size={12} /> 签到 {statNum(e.stats, 'checkins')}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail modal */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="线下会议详情">
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
                  {detail.location || '地点待定'} ·{' '}
                  {detail.scheduled_at ? formatDateTime(detail.scheduled_at) : '待定'}
                </div>
              </div>
              <Badge tone={statusInfo(detail.status).tone}>
                {statusInfo(detail.status).label}
              </Badge>
            </div>

            <div className="flex items-center gap-4 rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <span className="inline-flex items-center gap-1 text-slate-600">
                <Users size={15} className="text-slate-400" /> 报名人数
                <span
                  data-testid="offline-registrations"
                  className="font-semibold text-slate-800"
                >
                  {detail.registrations}
                </span>
              </span>
              <span className="inline-flex items-center gap-1 text-slate-600">
                <UserCheck size={15} className="text-slate-400" /> 已签到
                <span data-testid="offline-checkins" className="font-semibold text-slate-800">
                  {statNum(detail.stats, 'checkins')}
                </span>
              </span>
            </div>

            {/* 扫码报名 */}
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <QrCode size={14} /> 扫码报名
              </div>
              {detail.public_url ? (
                <div className="flex items-center gap-4">
                  <img
                    data-testid="offline-qr"
                    src={qrUrl(absoluteUrl(detail.public_url))}
                    alt="报名二维码"
                    className="h-32 w-32 rounded-xl border border-slate-100 bg-white p-1.5"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-700">
                      {detail.landing?.title || '报名落地页'}
                    </div>
                    <div className="mt-1 break-all font-mono text-xs text-slate-500">
                      {absoluteUrl(detail.public_url)}
                    </div>
                    <a
                      href={detail.public_url}
                      target="_blank"
                      rel="noopener"
                      data-testid="offline-public-link"
                      className="mt-2 inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      <ExternalLink size={12} /> 打开公开页
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-400">未关联报名落地页</div>
              )}
            </div>

            {/* 关联海报 */}
            {detail.poster ? (
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="mb-2 text-xs font-medium text-slate-400">关联海报</div>
                <div className="text-sm font-medium text-slate-700">{detail.poster.name}</div>
                <div className="text-xs text-slate-500">{detail.poster.title}</div>
              </div>
            ) : null}

            <div className="flex justify-end">
              <Button data-testid="checkin-button" onClick={handleCheckin} disabled={checking}>
                <CheckCircle2 size={15} /> {checking ? '签到中…' : '现场签到'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="新建线下会议"
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
            <span className="form-label">会议标题 *</span>
            <input
              className="form-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="如 城市合伙人见面会"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="form-label">地点</span>
              <input
                className="form-input"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="如 上海·徐汇"
              />
            </div>
            <div>
              <span className="form-label">时间</span>
              <input
                type="datetime-local"
                className="form-input"
                value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
              />
            </div>
          </div>
          <div>
            <span className="form-label">报名落地页</span>
            <select
              className="form-input"
              value={form.landing_page_id}
              onChange={(e) => setForm({ ...form, landing_page_id: e.target.value })}
            >
              <option value="">不关联落地页</option>
              {landings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="form-label">关联海报</span>
            <select
              className="form-input"
              value={form.poster_id}
              onChange={(e) => setForm({ ...form, poster_id: e.target.value })}
            >
              <option value="">不关联海报</option>
              {posters.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
