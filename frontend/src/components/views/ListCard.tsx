import type { ReactNode } from 'react'
import {
  Boxes,
  CalendarDays,
  FileText,
  Image,
  LayoutTemplate,
  Megaphone,
  Target,
  Video,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  getCampaigns,
  getEvents,
  getForms,
  getLandingPages,
  getOfflineEvents,
  getPosters,
  getScoreRules,
  getTemplates,
  getWebinars,
} from '../../api/client'
import Badge, { statusTone } from '../Badge'
import { formatDateTime } from '../../lib/format'
import CardShell from './CardShell'
import MiniTable from './MiniTable'
import { useViewData } from './useViewData'

export type GenericViewType =
  | 'scoring'
  | 'events'
  | 'templates'
  | 'campaigns'
  | 'forms'
  | 'landing'
  | 'posters'
  | 'webinars'
  | 'offline'

interface ListConfig {
  title: string
  route: string
  icon: LucideIcon
  headers: string[]
  load: () => Promise<ReactNode[][]>
}

const CONFIG: Record<GenericViewType, ListConfig> = {
  scoring: {
    title: '评分规则',
    route: '/scoring',
    icon: Target,
    headers: ['规则', '事件', '分值'],
    load: async () =>
      (await getScoreRules()).map((r) => [r.name, r.event_type, r.points]),
  },
  events: {
    title: '事件流',
    route: '/events',
    icon: Boxes,
    headers: ['类型', '渠道', '时间'],
    load: async () =>
      (await getEvents(20)).map((e) => [
        <Badge tone="brand">{e.type}</Badge>,
        e.channel_key || '-',
        formatDateTime(e.created_at),
      ]),
  },
  templates: {
    title: '模板库',
    route: '/templates',
    icon: FileText,
    headers: ['名称', '分类'],
    load: async () => (await getTemplates()).map((t) => [t.name, t.category]),
  },
  campaigns: {
    title: '营销活动',
    route: '/campaigns',
    icon: Megaphone,
    headers: ['名称', '状态'],
    load: async () =>
      (await getCampaigns()).map((c) => [c.name, <Badge tone={statusTone(c.status)}>{c.status}</Badge>]),
  },
  forms: {
    title: '表单',
    route: '/forms',
    icon: FileText,
    headers: ['名称', '字段数'],
    load: async () => (await getForms()).map((f) => [f.name, f.fields.length]),
  },
  landing: {
    title: '落地页',
    route: '/landing-pages',
    icon: LayoutTemplate,
    headers: ['标题', '状态', '浏览'],
    load: async () =>
      (await getLandingPages()).map((p) => [
        p.title,
        <Badge tone={statusTone(p.status)}>{p.status}</Badge>,
        p.views,
      ]),
  },
  posters: {
    title: '海报',
    route: '/posters',
    icon: Image,
    headers: ['名称', '模板'],
    load: async () => (await getPosters()).map((p) => [p.name, p.template]),
  },
  webinars: {
    title: '线上直播',
    route: '/webinars',
    icon: Video,
    headers: ['标题', '状态'],
    load: async () =>
      (await getWebinars()).map((w) => [w.title, <Badge tone={statusTone(w.status)}>{w.status}</Badge>]),
  },
  offline: {
    title: '线下会议',
    route: '/offline-events',
    icon: CalendarDays,
    headers: ['标题', '地点'],
    load: async () => (await getOfflineEvents()).map((e) => [e.title, e.location || '-']),
  },
}

export default function ListCard({ type }: { type: GenericViewType }) {
  const cfg = CONFIG[type]
  const { data, loading, error } = useViewData(() => cfg.load(), [type])
  const Icon = cfg.icon

  return (
    <CardShell
      testId={`view-${type}`}
      icon={<Icon size={15} />}
      title={cfg.title}
      subtitle={data ? `共 ${data.length} 项` : undefined}
      openTo={cfg.route}
      loading={loading}
      error={error}
    >
      <MiniTable testId="view-list" headers={cfg.headers} rows={data ?? []} empty="暂无数据" />
    </CardShell>
  )
}
