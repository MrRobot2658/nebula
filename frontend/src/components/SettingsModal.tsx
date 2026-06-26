import { useEffect, useState } from 'react'
import {
  Boxes,
  Brain,
  Building2,
  Gauge,
  Plug,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import {
  createMemory,
  deleteMemory,
  getMcpServers,
  getMemories,
  getRoles,
  getSkills,
  getTenants,
  getTokenUsage,
  patchMcpServer,
  patchSkill,
} from '../api/client'
import type { Memory } from '../api/types'
import Badge from './Badge'
import MiniTable from './views/MiniTable'
import { useViewData } from './views/useViewData'

type Tab = 'skills' | 'mcp' | 'memory' | 'tenants' | 'roles' | 'token'

const TABS: { key: Tab; label: string; icon: LucideIcon }[] = [
  { key: 'skills', label: 'Skills', icon: Boxes },
  { key: 'mcp', label: 'MCP', icon: Plug },
  { key: 'memory', label: '记忆', icon: Brain },
  { key: 'tenants', label: '租户管理', icon: Building2 },
  { key: 'roles', label: '权限', icon: ShieldCheck },
  { key: 'token', label: 'Token 消耗', icon: Gauge },
]

function Toggle({
  on,
  onClick,
  testId,
}: {
  on: boolean
  onClick: () => void
  testId?: string
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      data-enabled={on}
      onClick={onClick}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
        on ? 'bg-brand-600' : 'bg-slate-300'
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
          on ? 'left-[18px]' : 'left-0.5'
        }`}
      />
    </button>
  )
}

function Loading() {
  return <div className="py-8 text-center text-[13px] text-slate-400">加载中…</div>
}

export default function SettingsModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [tab, setTab] = useState<Tab>('skills')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div
        data-testid="settings-modal"
        className="relative flex h-[600px] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left tabs */}
        <div className="flex w-48 shrink-0 flex-col border-r border-slate-100 bg-slate-50/70 p-3">
          <div className="px-2 pb-2 text-sm font-bold text-slate-800">设置</div>
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              data-testid={`settings-tab-${t.key}`}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors ${
                tab === t.key
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* Right content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-semibold text-slate-800">
              {TABS.find((t) => t.key === tab)?.label}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {tab === 'skills' && <SkillsTab />}
            {tab === 'mcp' && <McpTab />}
            {tab === 'memory' && <MemoryTab />}
            {tab === 'tenants' && <TenantsTab />}
            {tab === 'roles' && <RolesTab />}
            {tab === 'token' && <TokenTab />}
          </div>
        </div>
      </div>
    </div>
  )
}

function SkillsTab() {
  const { data, loading, setData } = useViewData(() => getSkills(), [])

  const toggle = async (id: number, enabled: boolean) => {
    try {
      const updated = await patchSkill(id, { enabled })
      setData((prev) => (prev ? prev.map((s) => (s.id === id ? updated : s)) : prev))
    } catch {
      /* ignore */
    }
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-2">
      <p className="text-[12px] text-slate-500">功能模块均以内置 Skill 形式提供，可按需启用或停用。</p>
      {(data ?? []).map((s) => (
        <div
          key={s.id}
          data-testid="skill-row"
          className="flex items-start gap-3 rounded-xl border border-slate-100 px-3 py-2.5"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-slate-800">{s.name}</span>
              <Badge tone="brand">{s.category}</Badge>
              {s.builtin && <Badge tone="slate">内置</Badge>}
            </div>
            <div className="mt-0.5 truncate text-[12px] text-slate-500" title={s.description}>
              {s.description}
            </div>
            {s.route && (
              <Link
                to={s.route}
                className="mt-0.5 inline-block text-[11px] font-medium text-brand-600 hover:underline"
              >
                打开工作台 →
              </Link>
            )}
          </div>
          <Toggle
            testId="skill-toggle"
            on={s.enabled}
            onClick={() => toggle(s.id, !s.enabled)}
          />
        </div>
      ))}
    </div>
  )
}

function McpTab() {
  const { data, loading, setData } = useViewData(() => getMcpServers(), [])

  const toggle = async (id: number, enabled: boolean) => {
    try {
      const updated = await patchMcpServer(id, { enabled })
      setData((prev) => (prev ? prev.map((m) => (m.id === id ? updated : m)) : prev))
    } catch {
      /* ignore */
    }
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-2">
      <p className="text-[12px] text-slate-500">通过 MCP 协议接入的外部工具服务。</p>
      {(data ?? []).map((m) => (
        <div
          key={m.id}
          data-testid="mcp-row"
          className="flex items-start gap-3 rounded-xl border border-slate-100 px-3 py-2.5"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-slate-800">{m.name}</span>
              <Badge tone={m.status === 'connected' ? 'green' : 'slate'}>
                {m.status === 'connected' ? '已连接' : '未连接'}
              </Badge>
            </div>
            <div className="mt-0.5 truncate font-mono text-[11px] text-slate-500" title={m.url}>
              {m.url}
            </div>
            <div className="mt-0.5 text-[12px] text-slate-400">
              {m.description} · 工具数 {m.tools}
            </div>
          </div>
          <Toggle on={m.enabled} onClick={() => toggle(m.id, !m.enabled)} />
        </div>
      ))}
    </div>
  )
}

function MemoryTab() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    getMemories()
      .then(setMemories)
      .catch(() => setMemories([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const add = async () => {
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    try {
      await createMemory({ title: title.trim(), content: content.trim() })
      setTitle('')
      setContent('')
      load()
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: number) => {
    try {
      await deleteMemory(id)
      setMemories((prev) => prev.filter((m) => m.id !== id))
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-[12px] text-slate-500">长期记忆会作为系统上下文注入每次对话（偏好、口径、默认设置等）。</p>

      <div className="space-y-2 rounded-xl border border-slate-100 p-3">
        <input
          className="form-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="记忆标题，如 默认口径"
        />
        <textarea
          className="form-input min-h-[64px]"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="记忆内容，如 GMV 只计算已支付订单"
        />
        <button
          type="button"
          data-testid="add-memory-button"
          onClick={add}
          disabled={saving || !title.trim() || !content.trim()}
          className="rounded-lg bg-brand-600 px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? '保存中…' : '新增记忆'}
        </button>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className="space-y-2">
          {memories.length === 0 && (
            <div className="py-4 text-center text-[13px] text-slate-400">暂无记忆</div>
          )}
          {memories.map((m) => (
            <div
              key={m.id}
              data-testid="memory-row"
              className="flex items-start gap-3 rounded-xl border border-slate-100 px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-slate-800">{m.title}</span>
                  <Badge tone="indigo">{m.scope}</Badge>
                </div>
                <div className="mt-0.5 text-[12px] text-slate-500">{m.content}</div>
              </div>
              <button
                type="button"
                onClick={() => remove(m.id)}
                className="text-slate-400 hover:text-rose-500"
                title="删除"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TenantsTab() {
  const { data, loading } = useViewData(() => getTenants(), [])
  if (loading) return <Loading />

  return (
    <div className="space-y-2">
      {(data ?? []).map((t) => (
        <div
          key={t.id}
          data-testid="tenant-row"
          className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5"
        >
          <div>
            <div className="text-[13px] font-semibold text-slate-800">{t.name}</div>
            <div className="text-[11px] text-slate-400">{t.seats} 席位</div>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="brand">{t.plan}</Badge>
            <Badge tone={t.status === 'active' ? 'green' : 'slate'}>
              {t.status === 'active' ? '正常' : t.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}

function RolesTab() {
  const { data, loading } = useViewData(() => getRoles(), [])
  if (loading) return <Loading />

  return (
    <div className="space-y-2">
      {(data ?? []).map((r) => (
        <div
          key={r.key}
          data-testid="role-row"
          className="rounded-xl border border-slate-100 px-3 py-2.5"
        >
          <div className="text-[13px] font-semibold text-slate-800">{r.name}</div>
          <div className="mt-0.5 text-[12px] text-slate-500">{r.description}</div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {r.permissions.map((p) => (
              <Badge key={p} tone="slate">
                {p}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function TokenTab() {
  const { data, loading } = useViewData(() => getTokenUsage(), [])
  if (loading) return <Loading />
  if (!data) return null

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold tabular-nums text-slate-800">
            {data.total_calls.toLocaleString()}
          </div>
          <div className="mt-1 text-[12px] text-slate-500">总调用</div>
        </div>
        <div className="rounded-xl border border-slate-200 p-4 text-center">
          <div
            data-testid="token-total"
            className="text-2xl font-bold tabular-nums text-slate-800"
          >
            {data.total_tokens.toLocaleString()}
          </div>
          <div className="mt-1 text-[12px] text-slate-500">总 Token</div>
        </div>
      </div>

      {data.by_day.length > 0 && (
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.by_day} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11 }}
              />
              <Bar dataKey="tokens" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Token" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div>
        <div className="mb-1 text-[12px] font-medium text-slate-500">按模型</div>
        <MiniTable
          headers={['模型', '调用', 'Token']}
          rows={data.by_model.map((m) => [m.model, m.calls, m.tokens.toLocaleString()])}
          empty="暂无数据"
        />
      </div>
    </div>
  )
}
