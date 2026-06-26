import {
  Boxes,
  CalendarDays,
  Crown,
  FileText,
  GitBranch,
  Image,
  LayoutDashboard,
  LayoutTemplate,
  Megaphone,
  MessageSquare,
  Radio,
  Target,
  Users,
  Video,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'

interface ModuleItem {
  name: string
  description: string
  icon: LucideIcon
  to: string
}

interface ModuleGroup {
  title: string
  items: ModuleItem[]
}

const GROUPS: ModuleGroup[] = [
  {
    title: '概览',
    items: [
      { name: '仪表盘', description: '关键指标与消息趋势', icon: LayoutDashboard, to: '/dashboard' },
      { name: '事件流', description: '系统实时事件总线', icon: Boxes, to: '/events' },
    ],
  },
  {
    title: '客户与对话',
    items: [
      { name: '客户', description: '客户档案与画像', icon: Users, to: '/customers' },
      { name: '收件箱', description: '对话式 ChatUI 收件箱', icon: MessageSquare, to: '/inbox' },
      { name: '会员', description: '会员等级与积分', icon: Crown, to: '/members' },
    ],
  },
  {
    title: '渠道',
    items: [{ name: '渠道', description: '多渠道触达接入', icon: Radio, to: '/channels' }],
  },
  {
    title: '内容',
    items: [
      { name: '模板库', description: '复用消息模板', icon: FileText, to: '/templates' },
      { name: '营销活动', description: '批量触达活动', icon: Megaphone, to: '/campaigns' },
      { name: '表单', description: '线索收集表单', icon: FileText, to: '/forms' },
      { name: '落地页', description: '营销落地页', icon: LayoutTemplate, to: '/landing-pages' },
      { name: '海报', description: '裂变海报生成', icon: Image, to: '/posters' },
    ],
  },
  {
    title: '活动',
    items: [
      { name: '自动化', description: '拖拽式流程画布', icon: GitBranch, to: '/flows' },
      { name: '评分模型', description: '客户动态评分规则', icon: Target, to: '/scoring' },
      { name: '线上直播', description: '直播营销活动', icon: Video, to: '/webinars' },
      { name: '线下会议', description: '扫码报名与签到', icon: CalendarDays, to: '/offline-events' },
    ],
  },
]

export default function Settings() {
  const navigate = useNavigate()

  return (
    <div data-testid="settings-page">
      <PageHeader title="设置" description="所有功能模块都在这里，点击进入对应工作台" />

      <div className="space-y-8">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {group.title}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.items.map((item) => (
                <button
                  key={item.to}
                  data-testid="settings-item"
                  onClick={() => navigate(item.to)}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 text-left shadow-card transition hover:border-brand-200 hover:shadow-md"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                    <item.icon size={18} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-800">{item.name}</div>
                    <div className="mt-0.5 text-xs text-slate-400">{item.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
