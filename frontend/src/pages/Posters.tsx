import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { createPoster, getPosterTemplates, getPosters } from '../api/client'
import type { Poster } from '../api/types'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { EmptyState, Loading } from '../components/States'

const TEMPLATE_GRADIENTS: Record<string, string> = {
  aurora: 'from-violet-500 via-purple-500 to-indigo-600',
  sunset: 'from-orange-400 via-rose-400 to-pink-500',
  ocean: 'from-sky-400 via-cyan-500 to-teal-500',
  ink: 'from-slate-800 via-slate-900 to-black',
}

const TEMPLATE_LABELS: Record<string, string> = {
  aurora: '极光',
  sunset: '日落',
  ocean: '海洋',
  ink: '水墨',
}

function gradientFor(template: string): string {
  return TEMPLATE_GRADIENTS[template] ?? TEMPLATE_GRADIENTS.aurora
}

function resolveQrData(poster: { qr_target?: string | null; name: string }): string {
  const target = poster.qr_target?.trim()
  if (!target) return poster.name
  if (/^https?:\/\//i.test(target)) return target
  // 裸 slug → 拼接为真实公开落地页地址
  return `${window.location.origin}/l/${target}`
}

function qrUrl(target: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
    target
  )}`
}

export default function Posters() {
  const [posters, setPosters] = useState<Poster[]>([])
  const [templates, setTemplates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    template: 'aurora',
    title: '',
    subtitle: '',
    cta: '',
    qr_target: '',
  })

  const load = () => {
    setLoading(true)
    Promise.all([getPosters(), getPosterTemplates()])
      .then(([p, t]) => {
        setPosters(p)
        setTemplates(t.length > 0 ? t : ['aurora', 'sunset', 'ocean', 'ink'])
      })
      .catch(() => {
        setPosters([])
        setTemplates(['aurora', 'sunset', 'ocean', 'ink'])
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const submit = async () => {
    if (!form.name.trim() || !form.title.trim()) return
    setSubmitting(true)
    try {
      await createPoster({
        name: form.name.trim(),
        template: form.template,
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        cta: form.cta || undefined,
        qr_target: form.qr_target || undefined,
      })
      setOpen(false)
      setForm({ name: '', template: 'aurora', title: '', subtitle: '', cta: '', qr_target: '' })
      load()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="海报"
        description="一键生成带二维码的营销裂变海报"
        action={
          <Button data-testid="new-poster-button" onClick={() => setOpen(true)}>
            <Plus size={16} /> 新建海报
          </Button>
        }
      />

      {loading ? (
        <Loading />
      ) : posters.length === 0 ? (
        <EmptyState text="暂无海报" />
      ) : (
        <div
          data-testid="poster-grid"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {posters.map((p) => (
            <div
              key={p.id}
              data-testid="poster-card"
              className="overflow-hidden rounded-2xl border border-slate-200/70 shadow-card"
            >
              <div
                className={`relative bg-gradient-to-br ${gradientFor(
                  p.template
                )} p-5 text-white min-h-[260px] flex flex-col`}
              >
                <span className="inline-flex w-fit items-center rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium backdrop-blur">
                  {TEMPLATE_LABELS[p.template] ?? p.template}
                </span>
                <div className="mt-4 flex-1">
                  <h3 className="text-lg font-bold leading-snug">{p.title}</h3>
                  <p className="mt-2 text-sm text-white/85">{p.subtitle}</p>
                </div>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    {p.cta && (
                      <span className="inline-flex items-center rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-800">
                        {p.cta}
                      </span>
                    )}
                  </div>
                  <img
                    src={qrUrl(resolveQrData(p))}
                    alt="qr"
                    className="h-16 w-16 rounded-lg bg-white p-1"
                    loading="lazy"
                  />
                </div>
              </div>
              <div className="bg-white px-4 py-3">
                <div className="text-sm font-medium text-slate-700">{p.name}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="新建海报"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button
              onClick={submit}
              disabled={submitting || !form.name.trim() || !form.title.trim()}
            >
              {submitting ? '保存中…' : '保存'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="form-label">海报名称 *</span>
              <input
                className="form-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="如 双十一裂变海报"
              />
            </div>
            <div>
              <span className="form-label">模板</span>
              <select
                className="form-input"
                value={form.template}
                onChange={(e) => setForm({ ...form, template: e.target.value })}
              >
                {templates.map((t) => (
                  <option key={t} value={t}>
                    {TEMPLATE_LABELS[t] ?? t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <span className="form-label">标题 *</span>
            <input
              className="form-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="主标题文案"
            />
          </div>
          <div>
            <span className="form-label">副标题</span>
            <input
              className="form-input"
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              placeholder="副标题文案"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="form-label">CTA 按钮</span>
              <input
                className="form-input"
                value={form.cta}
                onChange={(e) => setForm({ ...form, cta: e.target.value })}
                placeholder="如 立即领取"
              />
            </div>
            <div>
              <span className="form-label">二维码目标</span>
              <input
                className="form-input"
                value={form.qr_target}
                onChange={(e) => setForm({ ...form, qr_target: e.target.value })}
                placeholder="链接或文本"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
