import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUp, Sparkles } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { assistantChat } from '../api/client'
import type { AssistantChatMessage } from '../api/types'
import {
  getSession,
  newId,
  saveSession,
  titleFromMessage,
  type ChatMessage,
} from '../lib/sessions'
import { ChatActionCtx } from '../context/ChatActionContext'
import ViewCard from '../components/views/ViewCard'

const QUICK_PROMPTS = ['看板', '客户', '自动化流程', '会员', '渠道']

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
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const sessionParam = params.get('session')
  const newParam = params.get('new')

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const idRef = useRef<string>(newId())
  const bottomRef = useRef<HTMLDivElement>(null)
  const sendRef = useRef<(text: string) => void>(() => {})

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
  }, [messages, sending])

  const persist = (msgs: ChatMessage[], title: string) => {
    saveSession({ id: idRef.current, title, updatedAt: Date.now(), messages: msgs })
  }

  const send = async (text: string) => {
    const content = text.trim()
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
      const history: AssistantChatMessage[] = afterUser.map((m) => ({
        role: m.role,
        content: m.content,
      }))
      const res = await assistantChat(history)
      const aiMsg: ChatMessage = {
        id: newId('m'),
        role: 'assistant',
        content: res.reply || '好的。',
        intent: res.intent,
        views: res.views,
      }
      const afterAi = [...afterUser, aiMsg]
      setMessages(afterAi)
      persist(afterAi, title)
      // Assistant may request a page jump (e.g. 查看王五的详情 -> 会员详情页)
      if (res.navigate?.path) navigate(res.navigate.path)
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

  sendRef.current = send
  const actionValue = useMemo(() => ({ ask: (t: string) => sendRef.current(t) }), [])

  const empty = messages.length === 0

  return (
    <ChatActionCtx.Provider value={actionValue}>
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
              <p className="mt-1 text-sm text-slate-400">{todayText()} · 我能在对话里帮你完成营销运营</p>

              <div className="mt-7 flex flex-wrap justify-center gap-2">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    data-testid="quick-action"
                    onClick={() => send(p)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5 py-4">
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
                  send(input)
                }
              }}
              rows={1}
              placeholder="让我帮你做营销自动化、查客户、建流程…"
              className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
            <button
              data-testid="chat-send"
              onClick={() => send(input)}
              disabled={sending || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowUp size={18} />
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-400">
            Nebula AI 助手 · 在对话中直接调用全部营销能力
          </p>
        </div>
      </div>
    </ChatActionCtx.Provider>
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
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-brand-600 px-4 py-2.5 text-sm text-white">
          {message.content}
        </div>
      </div>
    )
  }
  return (
    <div data-testid="chat-message" data-role="assistant" className="flex flex-col items-start gap-1">
      <div className="flex items-start gap-3">
        <AiAvatar />
        <div className="max-w-[85%]">
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
      {message.views && message.views.length > 0 && (
        <div className="w-full space-y-2 pl-11">
          {message.views.map((v, i) => (
            <ViewCard key={i} view={v} />
          ))}
        </div>
      )}
    </div>
  )
}
