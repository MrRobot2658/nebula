import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Plus, TrendingUp, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCustomer, patchCustomerTags } from '../api/client'
import type { CustomerDetail as CustomerDetailType, Message, ScoreLog } from '../api/types'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Avatar from '../components/Avatar'
import { ErrorState, Loading } from '../components/States'
import { formatDateTime, scoreColor } from '../lib/format'

type TimelineItem =
  | { kind: 'message'; at: string; data: Message }
  | { kind: 'score'; at: string; data: ScoreLog }

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<CustomerDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [savingTags, setSavingTags] = useState(false)

  const load = () => {
    if (!id) return
    setLoading(true)
    getCustomer(Number(id))
      .then((d) => {
        setCustomer(d)
        setError(false)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const timeline = useMemo<TimelineItem[]>(() => {
    if (!customer) return []
    const items: TimelineItem[] = [
      ...(customer.messages ?? []).map(
        (m): TimelineItem => ({ kind: 'message', at: m.created_at, data: m })
      ),
      ...(customer.score_logs ?? []).map(
        (s): TimelineItem => ({ kind: 'score', at: s.created_at, data: s })
      ),
    ]
    return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  }, [customer])

  const updateTags = async (tags: string[]) => {
    if (!customer) return
    setSavingTags(true)
    try {
      const updated = await patchCustomerTags(customer.id, tags)
      setCustomer({ ...customer, tags: updated.tags })
    } finally {
      setSavingTags(false)
    }
  }

  const addTag = () => {
    const t = newTag.trim()
    if (!t || !customer || customer.tags.includes(t)) return
    updateTags([...customer.tags, t])
    setNewTag('')
  }

  const removeTag = (t: string) => {
    if (!customer) return
    updateTags(customer.tags.filter((x) => x !== t))
  }

  if (loading) return <Loading />
  if (error || !customer) return <ErrorState text="未找到该客户" />

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={16} /> 返回
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card testId="customer-profile">
            <div className="flex items-center gap-4">
              <Avatar name={customer.name} size="lg" />
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-slate-800 truncate">
                  {customer.name}
                </h2>
                <div className="text-xs text-slate-400">{customer.oneid}</div>
                <div className="mt-1">
                  <Badge tone="indigo">{customer.stage}</Badge>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">评分</span>
                <span className="font-semibold text-slate-700">{customer.score}</span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${scoreColor(customer.score)}`}
                  style={{ width: `${Math.min(100, Math.max(0, customer.score))}%` }}
                />
              </div>
            </div>

            <dl className="mt-5 space-y-3 text-sm">
              <Row label="手机" value={customer.phone || '-'} />
              <Row label="邮箱" value={customer.email || '-'} />
              <Row label="来源渠道" value={customer.source_channel || '-'} />
              <Row label="创建时间" value={formatDateTime(customer.created_at)} />
            </dl>
          </Card>

          <Card title="标签">
            <div className="flex flex-wrap gap-2">
              {customer.tags.length === 0 && (
                <span className="text-sm text-slate-400">暂无标签</span>
              )}
              {customer.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700"
                >
                  {t}
                  <button
                    onClick={() => removeTag(t)}
                    disabled={savingTags}
                    className="text-brand-400 hover:text-brand-700"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                placeholder="添加标签"
                className="form-input"
              />
              <Button variant="secondary" size="sm" onClick={addTag} disabled={savingTags}>
                <Plus size={14} />
              </Button>
            </div>
          </Card>
        </div>

        <Card title="客户时间线" className="lg:col-span-2" testId="customer-timeline">
          {timeline.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">暂无互动记录</div>
          ) : (
            <ol className="relative space-y-5 pl-6">
              <span className="absolute left-2 top-1 bottom-1 w-px bg-slate-100" />
              {timeline.map((item, idx) =>
                item.kind === 'message' ? (
                  <MessageItem key={`m-${item.data.id}-${idx}`} m={item.data} />
                ) : (
                  <ScoreItem key={`s-${item.data.id}-${idx}`} s={item.data} />
                )
              )}
            </ol>
          )}
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-slate-700 font-medium truncate max-w-[60%] text-right">{value}</dd>
    </div>
  )
}

function MessageItem({ m }: { m: Message }) {
  const isOut = m.direction === 'out'
  return (
    <li className="relative">
      <span
        className={`absolute -left-[18px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${
          isOut ? 'bg-brand-500' : 'bg-sky-500'
        }`}
      />
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Badge tone={isOut ? 'brand' : 'blue'}>{isOut ? '发送' : '接收'}</Badge>
        <span>{m.channel_key}</span>
        <span>·</span>
        <span>{formatDateTime(m.created_at)}</span>
      </div>
      <div
        className={`mt-1.5 inline-block rounded-xl px-3 py-2 text-sm ${
          isOut ? 'bg-brand-50 text-brand-900' : 'bg-slate-50 text-slate-700'
        }`}
      >
        {m.content}
      </div>
    </li>
  )
}

function ScoreItem({ s }: { s: ScoreLog }) {
  const positive = s.delta >= 0
  return (
    <li className="relative">
      <span className="absolute -left-[18px] top-1 h-3 w-3 rounded-full bg-amber-500 ring-4 ring-white" />
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Badge tone="amber">评分</Badge>
        <span>{formatDateTime(s.created_at)}</span>
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-sm text-slate-600">
        <TrendingUp size={14} className={positive ? 'text-emerald-500' : 'text-rose-500'} />
        <span className={positive ? 'text-emerald-600' : 'text-rose-600'}>
          {positive ? '+' : ''}
          {s.delta}
        </span>
        <span className="text-slate-400">·</span>
        <span>{s.reason}</span>
        <span className="text-slate-400">→ {s.total_after}</span>
      </div>
    </li>
  )
}
