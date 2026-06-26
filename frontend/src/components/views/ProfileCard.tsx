import { UserSearch } from 'lucide-react'
import { getCustomer, getCustomerOrders, getMember } from '../../api/client'
import type { MemberDetail, Order } from '../../api/types'
import Avatar from '../Avatar'
import Badge from '../Badge'
import { scoreColor } from '../../lib/format'
import CardShell from './CardShell'
import { useViewData } from './useViewData'

export default function ProfileCard({ customer_id }: { customer_id: number }) {
  const { data, loading, error } = useViewData(async () => {
    const [customer, orders] = await Promise.all([
      getCustomer(customer_id),
      getCustomerOrders(customer_id).catch((): Order[] => []),
    ])
    let member: MemberDetail | null = null
    try {
      member = await getMember(customer_id)
    } catch {
      member = null
    }
    return { customer, orders, member }
  }, [customer_id])

  const totalSpent = (data?.orders ?? []).reduce((s, o) => s + (o.amount || 0), 0)
  const recentMessages = (data?.customer.messages ?? []).slice(-3)

  return (
    <CardShell
      testId="view-profile"
      icon={<UserSearch size={15} />}
      title={data ? `${data.customer.name} · ${data.member ? '会员详情' : '客户画像'}` : '客户画像'}
      subtitle={data?.customer.oneid}
      openTo={`/customers/${customer_id}`}
      loading={loading}
      error={error}
    >
      {data && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Avatar name={data.customer.name} size="md" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-800">{data.customer.name}</span>
                <Badge tone="indigo">{data.customer.stage}</Badge>
                {data.member && <Badge tone="amber">{data.member.level}</Badge>}
              </div>
              <div className="text-[11px] text-slate-400">
                来源 {data.customer.source_channel || '-'} · {data.customer.phone || data.customer.email || '—'}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>营销评分</span>
              <span className="font-semibold text-slate-700">{data.customer.score}</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${scoreColor(data.customer.score)}`}
                style={{ width: `${Math.min(100, Math.max(0, data.customer.score))}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {data.customer.tags.length > 0 ? (
              data.customer.tags.map((t) => (
                <Badge key={t} tone="brand">
                  {t}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-slate-400">暂无标签</span>
            )}
          </div>

          <div className="flex gap-3">
            <div className="flex-1 rounded-lg bg-slate-50 px-3 py-2">
              <div className="text-base font-semibold text-slate-800">{data.orders.length}</div>
              <div className="text-[11px] text-slate-400">订单数</div>
            </div>
            <div className="flex-1 rounded-lg bg-slate-50 px-3 py-2">
              <div className="text-base font-semibold text-slate-800">¥{totalSpent}</div>
              <div className="text-[11px] text-slate-400">累计消费</div>
            </div>
            {data.member && (
              <div className="flex-1 rounded-lg bg-slate-50 px-3 py-2">
                <div className="text-base font-semibold text-slate-800">{data.member.points}</div>
                <div className="text-[11px] text-slate-400">会员积分</div>
              </div>
            )}
          </div>

          {data.member && (
            <div className="rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2" data-testid="profile-member">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-amber-700">会员 · {data.member.level}</span>
                <span className="text-slate-500">{data.member.points} 积分</span>
              </div>
              {data.member.next_level && (
                <div className="mt-1.5">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>距 {data.member.next_level}</span>
                    <span>还需 {data.member.points_to_next}</span>
                  </div>
                  <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-amber-100">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{
                        width: `${Math.round(
                          (data.member.points / (data.member.points + data.member.points_to_next || 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
              {data.member.transactions.length > 0 && (
                <div className="mt-2 space-y-0.5">
                  <div className="text-[11px] font-medium text-slate-400">积分流水</div>
                  {data.member.transactions.slice(0, 3).map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-[11px]">
                      <span className="truncate text-slate-500">{t.reason}</span>
                      <span className={t.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {t.delta >= 0 ? '+' : ''}
                        {t.delta}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {recentMessages.length > 0 && (
            <div>
              <div className="mb-1 text-[11px] font-medium text-slate-400">最近消息</div>
              <div className="space-y-1">
                {recentMessages.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 text-xs">
                    <Badge tone={m.direction === 'out' ? 'brand' : 'blue'}>
                      {m.direction === 'out' ? '发送' : '接收'}
                    </Badge>
                    <span className="truncate text-slate-600">{m.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </CardShell>
  )
}
