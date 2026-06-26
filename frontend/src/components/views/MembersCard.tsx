import { Crown } from 'lucide-react'
import { getMembers } from '../../api/client'
import Avatar from '../Avatar'
import Badge from '../Badge'
import CardShell from './CardShell'
import MiniTable from './MiniTable'
import { useViewData } from './useViewData'

function levelTone(level: string): 'slate' | 'brand' | 'amber' | 'blue' {
  if (level.includes('钻')) return 'brand'
  if (level.includes('金')) return 'amber'
  if (level.includes('银')) return 'blue'
  return 'slate'
}

export default function MembersCard() {
  const { data, loading, error } = useViewData(() => getMembers(), [])

  const rows = (data ?? []).slice(0, 10).map((m) => [
    <div className="flex items-center gap-2">
      <Avatar name={m.customer_name || `#${m.customer_id}`} size="sm" />
      <span className="font-medium text-slate-700">
        {m.customer_name || `客户 #${m.customer_id}`}
      </span>
    </div>,
    <Badge tone={levelTone(m.level)}>{m.level}</Badge>,
    <span className="font-medium text-slate-700">{m.points}</span>,
  ])

  return (
    <CardShell
      testId="view-members"
      icon={<Crown size={15} />}
      title="会员"
      subtitle="等级与积分"
      openTo="/members"
      loading={loading}
      error={error}
    >
      <MiniTable headers={['会员', '等级', '积分']} rows={rows} empty="暂无会员" />
    </CardShell>
  )
}
