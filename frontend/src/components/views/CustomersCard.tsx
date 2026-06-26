import { Users } from 'lucide-react'
import { getCustomers } from '../../api/client'
import Avatar from '../Avatar'
import Badge from '../Badge'
import { scoreColor } from '../../lib/format'
import { useChatAction } from '../../context/ChatActionContext'
import CardShell from './CardShell'
import MiniTable from './MiniTable'
import { useViewData } from './useViewData'

export default function CustomersCard({ query }: { query?: string }) {
  const { ask } = useChatAction()
  const { data, loading, error } = useViewData(
    () => getCustomers({ search: query || undefined, limit: 8 }),
    [query]
  )

  const rows = (data ?? []).map((c) => [
    <div className="flex items-center gap-2">
      <Avatar name={c.name} size="sm" />
      <span className="font-medium text-slate-700">{c.name}</span>
    </div>,
    <div className="flex flex-wrap gap-1">
      {c.tags.slice(0, 2).map((t) => (
        <Badge key={t} tone="brand">
          {t}
        </Badge>
      ))}
      {c.tags.length === 0 && <span className="text-slate-300">-</span>}
    </div>,
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${scoreColor(c.score)}`}
          style={{ width: `${Math.min(100, Math.max(0, c.score))}%` }}
        />
      </div>
      <span className="text-xs text-slate-600">{c.score}</span>
    </div>,
    <Badge tone="indigo">{c.stage}</Badge>,
    <button
      onClick={() => ask(`查看客户 ${c.id} 的画像`)}
      className="rounded-md border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-brand-600 hover:bg-brand-50"
    >
      查看画像
    </button>,
  ])

  return (
    <CardShell
      testId="view-customers"
      icon={<Users size={15} />}
      title="客户"
      subtitle={query ? `搜索：${query}` : '最近客户'}
      openTo="/customers"
      loading={loading}
      error={error}
    >
      <MiniTable
        headers={['客户', '标签', '评分', '阶段', '']}
        rows={rows}
        empty="未找到客户"
      />
    </CardShell>
  )
}
