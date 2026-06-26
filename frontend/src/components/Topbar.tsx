import { Bell, Search } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const titles: { match: (p: string) => boolean; title: string }[] = [
  { match: (p) => p === '/', title: '仪表盘' },
  { match: (p) => p.startsWith('/customers'), title: '客户管理' },
  { match: (p) => p.startsWith('/inbox'), title: '对话收件箱' },
  { match: (p) => p.startsWith('/channels'), title: '渠道接入' },
  { match: (p) => p.startsWith('/templates'), title: '模板库' },
  { match: (p) => p.startsWith('/campaigns'), title: '营销活动' },
  { match: (p) => p.startsWith('/automations'), title: '自动化流程' },
  { match: (p) => p.startsWith('/scoring'), title: '评分模型' },
  { match: (p) => p.startsWith('/events'), title: '事件流' },
  { match: (p) => p.startsWith('/forms'), title: '表单' },
  { match: (p) => p.startsWith('/landing-pages'), title: '落地页' },
  { match: (p) => p.startsWith('/posters'), title: '海报' },
  { match: (p) => p.startsWith('/members'), title: '会员' },
]

export default function Topbar() {
  const { pathname } = useLocation()
  const title = titles.find((t) => t.match(pathname))?.title ?? 'Nebula 星云'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-6 backdrop-blur">
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-400">
          <Search size={15} />
          <span>搜索…</span>
        </div>
        <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500" />
        </button>
        <div className="flex items-center gap-2 pl-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-semibold text-white">
            A
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="text-sm font-medium text-slate-700">管理员</div>
            <div className="text-[11px] text-slate-400">运营团队</div>
          </div>
        </div>
      </div>
    </header>
  )
}
