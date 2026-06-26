import { useEffect, useState } from 'react'
import { MessageSquare, Plus, Settings, Sparkles } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import {
  loadSessions,
  SESSIONS_EVENT,
  type ChatSession,
} from '../lib/sessions'

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sessions, setSessions] = useState<ChatSession[]>([])

  const activeSession = new URLSearchParams(location.search).get('session')

  useEffect(() => {
    const reload = () => setSessions(loadSessions())
    reload()
    window.addEventListener(SESSIONS_EVENT, reload)
    return () => window.removeEventListener(SESSIONS_EVENT, reload)
  }, [location])

  const newChat = () => navigate(`/?new=${Date.now()}`)

  return (
    <aside className="hidden md:flex w-[260px] shrink-0 flex-col border-r border-slate-200 bg-white">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white font-bold shadow-sm">
          N
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-slate-800">Nebula 星云</div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Sparkles size={11} /> 营销自动化
          </div>
        </div>
      </div>

      {/* New chat */}
      <div className="p-3">
        <button
          data-testid="new-chat-button"
          onClick={newChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
        >
          <Plus size={16} /> 新会话
        </button>
      </div>

      {/* Sessions */}
      <div className="flex-1 overflow-y-auto px-3">
        <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          会话
        </div>
        {sessions.length === 0 ? (
          <div className="px-2 py-6 text-center text-xs text-slate-400">暂无会话</div>
        ) : (
          <div className="space-y-0.5">
            {sessions.map((s) => (
              <button
                key={s.id}
                data-testid="session-item"
                onClick={() => navigate(`/?session=${s.id}`)}
                className={clsx(
                  'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                  activeSession === s.id
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                <MessageSquare size={15} className="shrink-0 text-slate-400" />
                <span className="truncate">{s.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Settings pinned bottom */}
      <div className="border-t border-slate-100 p-3">
        <button
          data-testid="settings-nav"
          onClick={() => navigate('/settings')}
          className={clsx(
            'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
            location.pathname === '/settings'
              ? 'bg-brand-50 text-brand-700'
              : 'text-slate-600 hover:bg-slate-50'
          )}
        >
          <Settings size={16} /> 设置
        </button>
      </div>
    </aside>
  )
}
