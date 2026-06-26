import { LayoutDashboard } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { getDashboardStats } from '../../api/client'
import CardShell from './CardShell'
import { useViewData } from './useViewData'

const STAT_DEFS: { key: keyof StatShape; label: string }[] = [
  { key: 'customers', label: '客户总数' },
  { key: 'messages_today', label: '今日消息' },
  { key: 'running_campaigns', label: '进行中活动' },
  { key: 'avg_score', label: '平均评分' },
  { key: 'channels_enabled', label: '启用渠道' },
  { key: 'automations_enabled', label: '启用自动化' },
]

interface StatShape {
  customers: number
  messages_today: number
  running_campaigns: number
  avg_score: number
  channels_enabled: number
  automations_enabled: number
}

export default function DashboardCard() {
  const { data, loading, error } = useViewData(() => getDashboardStats(), [])
  const trend = data?.messages_trend ?? []

  return (
    <CardShell
      testId="view-dashboard"
      icon={<LayoutDashboard size={15} />}
      title="概览看板"
      subtitle="关键指标与消息趋势"
      openTo="/dashboard"
      loading={loading}
      error={error}
    >
      {data && (
        <div>
          <div className="grid grid-cols-3 gap-2">
            {STAT_DEFS.map((s) => (
              <div key={s.key} className="rounded-lg bg-slate-50 px-3 py-2">
                <div className="text-base font-semibold text-slate-800">
                  {s.key === 'avg_score'
                    ? Number(data[s.key]).toFixed(1)
                    : String(data[s.key])}
                </div>
                <div className="text-[11px] text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
          {trend.length > 0 && (
            <div className="mt-3 h-24 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="viewMsgGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    fill="url(#viewMsgGrad)"
                    name="消息"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </CardShell>
  )
}
