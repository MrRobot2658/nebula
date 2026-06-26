import { useEffect, useState } from 'react'
import {
  Activity,
  MessageSquare,
  Megaphone,
  Radio,
  Star,
  Users,
  Workflow,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getDashboardStats } from '../api/client'
import type { DashboardStats } from '../api/types'
import Card from '../components/Card'
import StatCard from '../components/StatCard'
import PageHeader from '../components/PageHeader'
import { EmptyState, ErrorState, Loading } from '../components/States'
import Badge from '../components/Badge'
import { formatDateTime } from '../lib/format'

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    getDashboardStats()
      .then((d) => active && setStats(d))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  if (loading) return <Loading />
  if (error || !stats) return <ErrorState />

  const trend = stats.messages_trend ?? []
  const events = stats.recent_events ?? []

  return (
    <div>
      <PageHeader title="仪表盘" description="实时掌握营销自动化运行概况" />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="客户总数"
          value={stats.customers}
          icon={Users}
          tone="brand"
          testId="stat-customers"
        />
        <StatCard
          label="今日消息"
          value={stats.messages_today}
          icon={MessageSquare}
          tone="blue"
        />
        <StatCard
          label="进行中活动"
          value={stats.running_campaigns}
          icon={Megaphone}
          tone="amber"
        />
        <StatCard
          label="平均评分"
          value={stats.avg_score.toFixed(1)}
          icon={Star}
          tone="indigo"
          testId="stat-avg-score"
        />
        <StatCard
          label="启用渠道"
          value={stats.channels_enabled}
          icon={Radio}
          tone="green"
        />
        <StatCard
          label="启用自动化"
          value={stats.automations_enabled}
          icon={Workflow}
          tone="rose"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card title="消息趋势（近期）" className="xl:col-span-2">
          {trend.length === 0 ? (
            <EmptyState text="暂无趋势数据" />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    fill="url(#msgGrad)"
                    name="消息数"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card title="最近事件">
          {events.length === 0 ? (
            <EmptyState text="暂无事件" />
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto -mr-2 pr-2">
              {events.map((e) => (
                <div key={e.id} className="flex items-start gap-3">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <Activity size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge tone="brand">{e.type}</Badge>
                      {e.channel_key && (
                        <span className="text-xs text-slate-400">{e.channel_key}</span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {formatDateTime(e.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
