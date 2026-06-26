import { useLocation } from 'react-router-dom'
import { getSession } from '../lib/sessions'

const SEGMENT_TITLES: Record<string, string> = {
  dashboard: '概览看板',
  settings: '设置',
  customers: '客户',
  inbox: '收件箱',
  channels: '渠道',
  templates: '模板库',
  campaigns: '营销活动',
  scoring: '评分模型',
  events: '事件流',
  forms: '表单',
  'landing-pages': '落地页',
  posters: '海报',
  members: '会员',
  webinars: '线上直播',
  'offline-events': '线下会议',
  flows: '自动化',
}

function useTitle(): string {
  const location = useLocation()
  const { pathname, search } = location
  if (pathname === '/') {
    const sessionId = new URLSearchParams(search).get('session')
    if (sessionId) {
      const s = getSession(sessionId)
      if (s) return s.title
    }
    return '新对话'
  }
  const seg = pathname.split('/').filter(Boolean)[0]
  return SEGMENT_TITLES[seg] ?? 'Nebula 星云'
}

export default function Topbar() {
  const title = useTitle()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-6 backdrop-blur">
      <h2 className="truncate text-base font-semibold text-slate-800">{title}</h2>
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-semibold text-white">
          运
        </div>
        <div className="hidden sm:block leading-tight">
          <div className="text-sm font-medium text-slate-700">运营管理员</div>
          <div className="text-[11px] text-slate-400">Nebula 控制台</div>
        </div>
      </div>
    </header>
  )
}
