import clsx from 'clsx'
import {
  Boxes,
  CalendarDays,
  Crown,
  FileText,
  GitBranch,
  Image,
  LayoutDashboard,
  LayoutTemplate,
  MessageSquare,
  Megaphone,
  Radio,
  Sparkles,
  Target,
  Users,
  Video,
  Workflow,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const groups: NavGroup[] = [
  {
    title: '概览',
    items: [{ to: '/', label: '仪表盘', icon: LayoutDashboard, end: true }],
  },
  {
    title: '客户',
    items: [
      { to: '/customers', label: '客户列表', icon: Users },
      { to: '/inbox', label: '对话收件箱', icon: MessageSquare },
    ],
  },
  {
    title: '渠道',
    items: [{ to: '/channels', label: '渠道接入', icon: Radio }],
  },
  {
    title: '内容',
    items: [
      { to: '/templates', label: '模板库', icon: FileText },
      { to: '/campaigns', label: '营销活动', icon: Megaphone },
    ],
  },
  {
    title: '自动化',
    items: [
      { to: '/automations', label: '自动化流程', icon: Workflow },
      { to: '/scoring', label: '评分模型', icon: Target },
    ],
  },
  {
    title: '增长',
    items: [
      { to: '/forms', label: '表单', icon: FileText },
      { to: '/landing-pages', label: '落地页', icon: LayoutTemplate },
      { to: '/posters', label: '海报', icon: Image },
      { to: '/members', label: '会员', icon: Crown },
    ],
  },
  {
    title: '活动',
    items: [
      { to: '/webinars', label: '线上直播', icon: Video },
      { to: '/offline-events', label: '线下会议', icon: CalendarDays },
      { to: '/flows', label: '自动化画布', icon: GitBranch },
    ],
  },
  {
    title: '系统',
    items: [{ to: '/events', label: '事件流', icon: Boxes }],
  },
]

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-100">
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
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {groups.map((group) => (
          <div key={group.title}>
            <div className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )
                  }
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
