import { useEffect, useRef, useState } from 'react'
import {
  ArrowUp,
  GitBranch,
  LayoutDashboard,
  LayoutGrid,
  Sparkles,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { aiSuggest } from '../api/client'
import {
  getSession,
  newId,
  saveSession,
  titleFromMessage,
  type ChatMessage,
} from '../lib/sessions'

interface QuickAction {
  title: string
  subtitle: string
  icon: LucideIcon
  to: string
}

const QUICK_ACTIONS: QuickAction[] = [
  { title: '概览看板', subtitle: '关键指标与趋势', icon: LayoutDashboard, to: '/dashboard' },
  { title: '客户画像', subtitle: '查看与管理客户', icon: Users, to: '/customers' },
  { title: '自动化编排', subtitle: '拖拽式流程画布', icon: GitBranch, to: '/flows' },
  { title: '全部功能', subtitle: '打开设置中心', icon: LayoutGrid, to: '/settings' },
]

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return '早上好'
  if (h < 18) return '下午好'
  return '晚上好'
}

function todayText(): string {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

export default function ChatHome() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const sessionParam = params.get('session')
  const newParam = params.get('new')

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const idRef = useRef<string>(newId())
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load a session or start fresh when the URL signal changes
  useEffect(() => {
    if (sessionParam) {
      if (sessionParam === idRef.current) return
      const s = getSession(sessionParam)
      idRef.current = sessionParam
      setMessages(s ? s.messages : [])
      return
    }
    idRef.current = newId()
    setMessages([])
  }, [sessionParam, newParam])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const persist = (msgs: ChatMessage[], title: string) => {
    saveSession({ id: idRef.current, title, updatedAt: Date.now(), messages: msgs })
  }

  const send = async () => {
    const content = input.trim()
    if (!content || sending) return
    const isFirst = messages.length === 0
    const title = isFirst
      ? titleFromMessage(content)
      : getSession(idRef.current)?.title ?? titleFromMessage(content)

    const userMsg: ChatMessage = { id: newId('m'), role: 'user', content }
    const afterUser = [...messages, userMsg]
    setMessages(afterUser)
    setInput('')
    persist(afterUser, title)
    if (isFirst) setParams({ session: idRef.current }, { replace: true })

    setSending(true)
    try {
      const res = await aiSuggest({ content })
      const aiMsg: ChatMessage = {
        id: newId('m'),
        role: 'assistant',
        content: res.suggestion || '（暂无建议）',
        intent: res.intent,
      }
      const afterAi = [...afterUser, aiMsg]
      setMessages(afterAi)
      persist(afterAi, title)
    } catch {
      const aiMsg: ChatMessage = {
        id: newId('m'),
        role: 'assistant',
        content: '抱歉，AI 暂时无法响应，请稍后再试。',
      }
      const afterAi = [...afterUser, aiMsg]
      setMessages(afterAi)
      persist(afterAi, title)
    } finally {
      setSending(false)
    }
  }

  const empty = messages.length === 0

  return (
    <div data-testid="chat-home" className="mx-auto flex h-full max-w-3xl flex-col">
      {/* Conversation / welcome */}
      <div className="flex-1 overflow-y-auto">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
              <Sparkles size={26} />
            </div>
            <h1 className="mt-5 text-2xl font-semibold text-slate-800">
              {greeting()}，运营管理员 👋
            </h1>
            <p className="mt-1 text-sm text-slate-400">{todayText()} · 今天想做点什么？</p>

            <div className="mt-8 grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.to}
                  data-testid="quick-action"
                  onClick={() => navigate(a.to)}
                  className="flex flex-col items-start gap-2 rounded-2xl border border-slate-200/70 bg-white p-4 text-left shadow-card transition hover:border-brand-200 hover:shadow-md"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                    <a.icon size={18} />
                  </span>
                  <span className="text-sm font-medium text-slate-700">{a.title}</span>
                  <span className="text-xs text-slate-400">{a.subtitle}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {messages.map((m) => (
              <ChatBubble key={m.id} message={m} />
            ))}
            {sending && (
              <div className="flex items-start gap-3">
                <AiAvatar />
                <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-400">
                  正在思考…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="pt-3 pb-1">
        <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
          <textarea
            data-testid="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            rows={1}
            placeholder="让我帮你做营销自动化、查客户、建流程…"
            className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
          <button
            data-testid="chat-send"
            onClick={send}
            disabled={sending || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowUp size={18} />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-slate-400">
          Nebula AI 助手 · 由 DeepSeek 提供能力支持
        </p>
      </div>
    </div>
  )
}

function AiAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-[11px] font-semibold text-white">
      AI
    </div>
  )
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  if (isUser) {
    return (
      <div data-testid="chat-message" data-role="user" className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-brand-600 px-4 py-2.5 text-sm text-white">
          {message.content}
        </div>
      </div>
    )
  }
  return (
    <div data-testid="chat-message" data-role="assistant" className="flex items-start gap-3">
      <AiAvatar />
      <div className="max-w-[80%]">
        {message.intent && (
          <span className="mb-1 inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-medium text-brand-700">
            {message.intent}
          </span>
        )}
        <div className="whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700">
          {message.content}
        </div>
      </div>
    </div>
  )
}
