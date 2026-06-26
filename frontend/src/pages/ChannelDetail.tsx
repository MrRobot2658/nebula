import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Radio, Zap } from 'lucide-react'
import {
  getChannel,
  patchChannel,
  simulateChannelEvent,
} from '../api/client'
import type { ChannelConfigField, ChannelDetail as ChannelDetailType } from '../api/types'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Button from '../components/Button'
import { EmptyState, ErrorState, Loading } from '../components/States'
import { formatDateTime } from '../lib/format'

type ConfigValue = string | boolean

export default function ChannelDetail() {
  const { key = '' } = useParams()
  const navigate = useNavigate()

  const [detail, setDetail] = useState<ChannelDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [form, setForm] = useState<Record<string, ConfigValue>>({})
  const [savingConfig, setSavingConfig] = useState(false)
  const [savedAt, setSavedAt] = useState(false)
  const [togglePending, setTogglePending] = useState(false)
  const [simulating, setSimulating] = useState<string | null>(null)

  const load = useMemo(
    () => async () => {
      setLoading(true)
      setError(false)
      try {
        const data = await getChannel(key)
        setDetail(data)
        // hydrate the config form from schema + current channel config
        const cfg = (data.channel.config ?? {}) as Record<string, unknown>
        const next: Record<string, ConfigValue> = {}
        for (const field of data.config_schema) {
          const raw = cfg[field.key]
          if (field.type === 'checkbox') {
            next[field.key] = Boolean(raw)
          } else {
            next[field.key] = raw == null ? '' : String(raw)
          }
        }
        setForm(next)
      } catch {
        setError(true)
        setDetail(null)
      } finally {
        setLoading(false)
      }
    },
    [key]
  )

  useEffect(() => {
    void load()
  }, [load])

  const onToggle = async () => {
    if (!detail) return
    setTogglePending(true)
    try {
      const updated = await patchChannel(detail.channel.id, {
        enabled: !detail.channel.enabled,
      })
      setDetail({ ...detail, channel: updated })
    } finally {
      setTogglePending(false)
    }
  }

  const onField = (field: ChannelConfigField, value: ConfigValue) => {
    setForm((prev) => ({ ...prev, [field.key]: value }))
    setSavedAt(false)
  }

  const onSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!detail) return
    setSavingConfig(true)
    setSavedAt(false)
    try {
      const updated = await patchChannel(detail.channel.id, {
        config: form as Record<string, unknown>,
      })
      setDetail({ ...detail, channel: updated })
      setSavedAt(true)
    } finally {
      setSavingConfig(false)
    }
  }

  const onSimulate = async (eventKey: string) => {
    setSimulating(eventKey)
    try {
      await simulateChannelEvent(key, {
        event_key: eventKey,
        content: `模拟 ${eventKey} 事件`,
      })
      await load()
    } finally {
      setSimulating(null)
    }
  }

  if (loading) return <Loading />
  if (error) return <ErrorState />
  if (!detail) return <EmptyState text="渠道不存在" />

  const { channel, capabilities, events, config_schema, recent_events, stats } = detail

  return (
    <div data-testid="channel-detail">
      <button
        onClick={() => navigate('/channels')}
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={15} /> 返回渠道列表
      </button>

      <PageHeader
        title={channel.name}
        description={`渠道标识：${channel.key}`}
        action={
          <div className="flex items-center gap-3">
            <Badge tone={channel.enabled ? 'green' : 'slate'}>
              {channel.enabled ? '已启用' : '未启用'}
            </Badge>
            <button
              data-testid="channel-enable-toggle"
              data-enabled={channel.enabled}
              onClick={onToggle}
              disabled={togglePending}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                channel.enabled ? 'bg-brand-600' : 'bg-slate-200'
              } disabled:opacity-50`}
              aria-label="toggle channel"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  channel.enabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left: capabilities + config */}
        <div className="space-y-5 lg:col-span-2">
          <Card title="渠道能力" testId="channel-capabilities">
            {capabilities.length === 0 ? (
              <EmptyState text="暂无能力说明" />
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {capabilities.map((cap, i) => (
                  <li
                    key={i}
                    data-testid="capability-item"
                    className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-600"
                  >
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-500" />
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="渠道配置">
            {config_schema.length === 0 ? (
              <EmptyState text="该渠道无需额外配置" />
            ) : (
              <form data-testid="config-form" onSubmit={onSaveConfig} className="space-y-4">
                {config_schema.map((field) => (
                  <div key={field.key}>
                    {field.type === 'checkbox' ? (
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={Boolean(form[field.key])}
                          onChange={(e) => onField(field, e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-200"
                        />
                        {field.label}
                        {field.required && <span className="text-rose-500">*</span>}
                      </label>
                    ) : (
                      <>
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                          {field.label}
                          {field.required && <span className="text-rose-500"> *</span>}
                        </label>
                        {field.type === 'textarea' ? (
                          <textarea
                            value={String(form[field.key] ?? '')}
                            placeholder={field.placeholder ?? ''}
                            onChange={(e) => onField(field, e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
                          />
                        ) : (
                          <input
                            type={
                              field.type === 'password'
                                ? 'password'
                                : field.type === 'number'
                                ? 'number'
                                : field.type === 'url'
                                ? 'url'
                                : 'text'
                            }
                            value={String(form[field.key] ?? '')}
                            placeholder={field.placeholder ?? ''}
                            onChange={(e) => onField(field, e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
                          />
                        )}
                      </>
                    )}
                  </div>
                ))}
                <div className="flex items-center gap-3">
                  <Button type="submit" data-testid="save-config-button" disabled={savingConfig}>
                    {savingConfig ? '保存中…' : '保存配置'}
                  </Button>
                  {savedAt && (
                    <span className="text-xs text-emerald-600">已保存</span>
                  )}
                </div>
              </form>
            )}
          </Card>
        </div>

        {/* Right: stats + simulator + events */}
        <div className="space-y-5">
          <Card title="消息统计">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 px-3 py-4 text-center">
                <div className="text-2xl font-semibold text-slate-800">
                  {stats.messages_in}
                </div>
                <div className="mt-1 text-xs text-slate-400">入站消息</div>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-4 text-center">
                <div className="text-2xl font-semibold text-slate-800">
                  {stats.messages_out}
                </div>
                <div className="mt-1 text-xs text-slate-400">出站消息</div>
              </div>
            </div>
          </Card>

          <Card title="事件模拟器">
            {events.length === 0 ? (
              <EmptyState text="暂无可模拟事件" />
            ) : (
              <div className="flex flex-wrap gap-2">
                {events.map((ev) => (
                  <Button
                    key={ev.key}
                    data-testid="simulate-event-button"
                    data-event={ev.key}
                    variant="secondary"
                    size="sm"
                    disabled={simulating === ev.key}
                    onClick={() => onSimulate(ev.key)}
                  >
                    <Zap size={13} />
                    {simulating === ev.key ? '触发中…' : ev.label}
                  </Button>
                ))}
              </div>
            )}
          </Card>

          <Card title="最近事件">
            <div data-testid="channel-events">
              {recent_events.length === 0 ? (
                <EmptyState text="暂无事件，点击上方按钮模拟" />
              ) : (
                <ul className="space-y-2">
                  {recent_events.map((ev) => (
                    <li
                      key={ev.id}
                      data-testid="channel-event-item"
                      className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <Radio size={13} className="text-brand-500" />
                        <span className="text-sm font-medium text-slate-700">{ev.type}</span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {formatDateTime(ev.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
