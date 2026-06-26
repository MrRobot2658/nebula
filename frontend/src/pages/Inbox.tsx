import { useEffect, useRef, useState } from 'react'
import { RefreshCw, Search, Send, Sparkles, Zap } from 'lucide-react'
import {
  aiSuggest,
  getCustomers,
  getMessages,
  inboundMessage,
  sendMessage,
} from '../api/client'
import type { AiSuggestResponse, Customer, Message } from '../api/types'
import Avatar from '../components/Avatar'
import Badge from '../components/Badge'
import Button from '../components/Button'
import { EmptyState, Loading } from '../components/States'
import { formatTime, scoreColor } from '../lib/format'

const DEMO_INBOUND = [
  '你好，我想了解一下你们的产品方案',
  '价格怎么样？有没有优惠活动？',
  '可以预约一个演示吗？',
  '我考虑一下，谢谢',
]

export default function Inbox() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [search, setSearch] = useState('')
  const [loadingList, setLoadingList] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [simulating, setSimulating] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestResponse | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const selected = customers.find((c) => c.id === selectedId) ?? null
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null
  const lastInbound =
    lastMessage && lastMessage.direction === 'in' ? lastMessage : null

  useEffect(() => {
    getCustomers({ limit: 100 })
      .then((list) => {
        setCustomers(list)
        if (list.length > 0) setSelectedId(list[0].id)
      })
      .catch(() => setCustomers([]))
      .finally(() => setLoadingList(false))
  }, [])

  const loadMessages = (cid: number, showLoading = true) => {
    if (showLoading) setLoadingMsgs(true)
    getMessages(cid)
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setLoadingMsgs(false))
  }

  useEffect(() => {
    if (selectedId == null) return
    loadMessages(selectedId)
  }, [selectedId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchSuggestion = (content: string, customerId?: number) => {
    setAiLoading(true)
    aiSuggest({ customer_id: customerId, content })
      .then((res) => setAiSuggestion(res))
      .catch(() => setAiSuggestion(null))
      .finally(() => setAiLoading(false))
  }

  // Auto-suggest when the latest message is inbound
  useEffect(() => {
    if (lastInbound) {
      fetchSuggestion(lastInbound.content, lastInbound.customer_id)
    } else {
      setAiSuggestion(null)
      setAiLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastInbound?.id, selectedId])

  const refreshSelectedCustomer = async () => {
    if (selectedId == null) return
    try {
      const list = await getCustomers({ limit: 100 })
      setCustomers(list)
    } catch {
      /* ignore */
    }
  }

  const handleSend = async () => {
    if (!draft.trim() || selectedId == null) return
    setSending(true)
    try {
      await sendMessage({ customer_id: selectedId, content: draft.trim() })
      setDraft('')
      loadMessages(selectedId, false)
    } finally {
      setSending(false)
    }
  }

  const handleSimulate = async () => {
    if (!selected) return
    setSimulating(true)
    try {
      const content = DEMO_INBOUND[Math.floor(Math.random() * DEMO_INBOUND.length)]
      await inboundMessage({
        customer_id: selected.id,
        customer_name: selected.name,
        channel_key: selected.source_channel || 'web',
        content,
      })
      loadMessages(selected.id, false)
      await refreshSelectedCustomer()
    } finally {
      setSimulating(false)
    }
  }

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="h-[calc(100vh-7rem)] grid grid-cols-12 gap-4">
      {/* Left: customer list */}
      <div className="col-span-12 md:col-span-3 flex flex-col rounded-2xl bg-white border border-slate-200/70 shadow-card overflow-hidden">
        <div className="p-3 border-b border-slate-100">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
            <Search size={15} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索客户"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <Loading />
          ) : filtered.length === 0 ? (
            <EmptyState text="暂无客户" />
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                data-testid="customer-row"
                onClick={() => setSelectedId(c.id)}
                className={`flex w-full items-center gap-3 px-3 py-3 text-left border-b border-slate-50 transition ${
                  c.id === selectedId ? 'bg-brand-50' : 'hover:bg-slate-50'
                }`}
              >
                <Avatar name={c.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700 truncate">{c.name}</span>
                    <span className="text-xs text-slate-400">{c.score}</span>
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    {c.source_channel || '未知来源'} · {c.stage}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Middle: conversation */}
      <div className="col-span-12 md:col-span-6 flex flex-col rounded-2xl bg-white border border-slate-200/70 shadow-card overflow-hidden">
        {selected ? (
          <>
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Avatar name={selected.name} size="sm" />
                <div>
                  <div className="font-medium text-slate-700">{selected.name}</div>
                  <div className="text-xs text-slate-400">
                    {selected.source_channel || 'web'}
                  </div>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                data-testid="sim-inbound"
                onClick={handleSimulate}
                disabled={simulating}
              >
                <Zap size={14} /> {simulating ? '模拟中…' : '模拟客户来消息'}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50/60 p-4 space-y-3">
              {loadingMsgs ? (
                <Loading />
              ) : messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  暂无对话，发送或模拟一条消息开始
                </div>
              ) : (
                messages.map((m) => <Bubble key={m.id} m={m} />)
              )}
              <div ref={bottomRef} />
            </div>

            {lastInbound && (aiLoading || aiSuggestion) && (
              <div className="border-t border-slate-100 px-3 pt-3">
                <div
                  data-testid="ai-suggestion"
                  className="rounded-2xl border border-brand-100 bg-brand-50/70 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
                      <Sparkles size={14} /> AI 建议 · DeepSeek
                    </div>
                    <button
                      onClick={() =>
                        fetchSuggestion(lastInbound.content, lastInbound.customer_id)
                      }
                      disabled={aiLoading}
                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-brand-600 hover:bg-brand-100 disabled:opacity-50"
                    >
                      <RefreshCw size={12} className={aiLoading ? 'animate-spin' : ''} />
                      刷新
                    </button>
                  </div>

                  {aiLoading ? (
                    <div className="mt-2 text-xs text-brand-500">AI 正在生成建议…</div>
                  ) : aiSuggestion ? (
                    <>
                      <div className="mt-2 flex items-center gap-2">
                        {aiSuggestion.intent && (
                          <Badge tone="brand">{aiSuggestion.intent}</Badge>
                        )}
                        <span className="text-[11px] text-slate-400">
                          {aiSuggestion.source === 'deepseek'
                            ? 'DeepSeek'
                            : aiSuggestion.source === 'fallback'
                            ? '本地启发式'
                            : aiSuggestion.source}
                        </span>
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700">
                        {aiSuggestion.suggestion}
                      </p>
                      <div className="mt-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setDraft(aiSuggestion.suggestion)}
                        >
                          <Sparkles size={13} /> 采用建议
                        </Button>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            )}

            <div className="border-t border-slate-100 p-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  rows={2}
                  placeholder="输入消息，Enter 发送…"
                  className="flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
                <Button onClick={handleSend} disabled={sending || !draft.trim()}>
                  <Send size={16} /> 发送
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            请选择一位客户
          </div>
        )}
      </div>

      {/* Right: customer context */}
      <div className="col-span-12 md:col-span-3 flex flex-col rounded-2xl bg-white border border-slate-200/70 shadow-card overflow-hidden">
        {selected ? (
          <div className="p-5 overflow-y-auto">
            <div className="flex flex-col items-center text-center">
              <Avatar name={selected.name} size="lg" />
              <div className="mt-3 font-semibold text-slate-800">{selected.name}</div>
              <div className="text-xs text-slate-400">{selected.oneid}</div>
              <div className="mt-2">
                <Badge tone="indigo">{selected.stage}</Badge>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">评分</span>
                <span className="font-semibold text-slate-700">{selected.score}</span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${scoreColor(selected.score)}`}
                  style={{ width: `${Math.min(100, Math.max(0, selected.score))}%` }}
                />
              </div>
            </div>

            <div className="mt-5">
              <div className="text-xs font-medium text-slate-400 mb-2">标签</div>
              <div className="flex flex-wrap gap-1.5">
                {selected.tags.length === 0 ? (
                  <span className="text-sm text-slate-400">暂无</span>
                ) : (
                  selected.tags.map((t) => (
                    <Badge key={t} tone="brand">
                      {t}
                    </Badge>
                  ))
                )}
              </div>
            </div>

            <dl className="mt-5 space-y-2.5 text-sm">
              <CtxRow label="来源" value={selected.source_channel || '-'} />
              <CtxRow label="手机" value={selected.phone || '-'} />
              <CtxRow label="邮箱" value={selected.email || '-'} />
            </dl>

            <div className="mt-5 rounded-xl bg-brand-50 p-3 text-xs text-brand-700 flex gap-2">
              <Sparkles size={14} className="mt-0.5 shrink-0" />
              <span>模拟客户来消息将触发评分与自动化流程，可在事件流中查看效果。</span>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            -
          </div>
        )}
      </div>
    </div>
  )
}

function Bubble({ m }: { m: Message }) {
  const isOut = m.direction === 'out'
  return (
    <div
      data-testid="message-bubble"
      className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}
    >
      <div className="max-w-[75%]">
        <div
          className={`rounded-2xl px-3.5 py-2 text-sm ${
            isOut
              ? 'bg-brand-600 text-white rounded-br-sm'
              : 'bg-white text-slate-700 border border-slate-200 rounded-bl-sm'
          }`}
        >
          {m.content}
        </div>
        <div
          className={`mt-1 text-[11px] text-slate-400 ${isOut ? 'text-right' : 'text-left'}`}
        >
          {m.channel_key} · {formatTime(m.created_at)}
        </div>
      </div>
    </div>
  )
}

function CtxRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-slate-700 font-medium truncate max-w-[60%] text-right">{value}</dd>
    </div>
  )
}
