import { useEffect, useState } from 'react'
import { Crown, Plus } from 'lucide-react'
import {
  adjustMemberPoints,
  createMember,
  getCustomers,
  getMember,
  getMembers,
} from '../api/client'
import type { Customer, Member, MemberDetail } from '../api/types'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Avatar from '../components/Avatar'
import Modal from '../components/Modal'
import { EmptyRow, Table } from '../components/Table'
import { EmptyState, Loading } from '../components/States'
import { formatDateTime } from '../lib/format'

type Tone = 'slate' | 'brand' | 'amber' | 'blue'

function levelTone(level: string): Tone {
  if (level.includes('钻')) return 'brand'
  if (level.includes('金')) return 'amber'
  if (level.includes('银')) return 'blue'
  return 'slate'
}

function progressPct(member: { points: number }, toNext: number): number {
  const total = member.points + toNext
  if (total <= 0) return 100
  return Math.min(100, Math.round((member.points / total) * 100))
}

export default function Members() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<MemberDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [open, setOpen] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [pickCustomer, setPickCustomer] = useState<number | ''>('')
  const [submitting, setSubmitting] = useState(false)
  const [delta, setDelta] = useState(100)
  const [reason, setReason] = useState('活动奖励')
  const [adjusting, setAdjusting] = useState(false)

  const load = () => {
    setLoading(true)
    getMembers()
      .then(setMembers)
      .catch(() => setMembers([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openDetail = (customerId: number) => {
    setLoadingDetail(true)
    getMember(customerId)
      .then(setSelected)
      .catch(() => setSelected(null))
      .finally(() => setLoadingDetail(false))
  }

  const openCreate = () => {
    setOpen(true)
    getCustomers({ limit: 100 })
      .then(setCustomers)
      .catch(() => setCustomers([]))
  }

  const submit = async () => {
    if (pickCustomer === '') return
    setSubmitting(true)
    try {
      await createMember(Number(pickCustomer))
      setOpen(false)
      setPickCustomer('')
      load()
    } finally {
      setSubmitting(false)
    }
  }

  const adjust = async () => {
    if (!selected || !delta) return
    setAdjusting(true)
    try {
      await adjustMemberPoints(selected.customer_id, { delta: Number(delta), reason })
      openDetail(selected.customer_id)
      load()
    } finally {
      setAdjusting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="会员"
        description="经营会员等级与积分体系，提升复购"
        action={
          <Button data-testid="new-member-button" onClick={openCreate}>
            <Plus size={16} /> 开通会员
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card padded={false} className="lg:col-span-2">
          {loading ? (
            <Loading />
          ) : (
            <Table testId="member-table" headers={['会员', '等级', '积分', '进度', '加入时间']}>
              {members.length === 0 ? (
                <EmptyRow colSpan={5} text="暂无会员" />
              ) : (
                members.map((m) => (
                  <tr
                    key={m.id}
                    data-testid="member-row"
                    onClick={() => openDetail(m.customer_id)}
                    className={`cursor-pointer hover:bg-slate-50 ${
                      selected?.customer_id === m.customer_id ? 'bg-brand-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.customer_name || `#${m.customer_id}`} size="sm" />
                        <span className="font-medium text-slate-700">
                          {m.customer_name || `客户 #${m.customer_id}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={levelTone(m.level)}>
                        <Crown size={11} className="mr-1" />
                        {m.level}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{m.points}</td>
                    <td className="px-4 py-3">
                      <div className="h-1.5 w-24 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand-500"
                          style={{ width: `${Math.min(100, (m.points % 1000) / 10)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {formatDateTime(m.joined_at)}
                    </td>
                  </tr>
                ))
              )}
            </Table>
          )}
        </Card>

        <Card title="会员详情">
          {loadingDetail ? (
            <Loading />
          ) : !selected ? (
            <EmptyState text="选择一位会员查看详情" />
          ) : (
            <div>
              <div className="flex items-center gap-3">
                <Avatar name={selected.customer_name || `#${selected.customer_id}`} size="lg" />
                <div>
                  <div className="font-semibold text-slate-800">
                    {selected.customer_name || `客户 #${selected.customer_id}`}
                  </div>
                  <div className="mt-1">
                    <Badge tone={levelTone(selected.level)}>
                      <Crown size={11} className="mr-1" />
                      {selected.level}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">当前积分</span>
                  <span className="font-semibold text-slate-800">{selected.points}</span>
                </div>
                {selected.next_level ? (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>距 {selected.next_level}</span>
                      <span>还需 {selected.points_to_next}</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${progressPct(selected, selected.points_to_next)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-amber-600">已达最高等级</div>
                )}
              </div>

              <div className="mt-4 rounded-xl border border-slate-100 p-3">
                <div className="text-xs font-medium text-slate-400 mb-2">调整积分</div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="form-input w-24"
                    value={delta}
                    onChange={(e) => setDelta(Number(e.target.value))}
                  />
                  <input
                    className="form-input flex-1"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="原因"
                  />
                  <Button size="sm" onClick={adjust} disabled={adjusting}>
                    应用
                  </Button>
                </div>
              </div>

              <div className="mt-4 text-xs font-medium text-slate-400">
                积分流水（{selected.transactions.length}）
              </div>
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                {selected.transactions.length === 0 ? (
                  <div className="text-sm text-slate-400">暂无流水</div>
                ) : (
                  selected.transactions.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
                    >
                      <div>
                        <div className="text-slate-600">{t.reason}</div>
                        <div className="text-xs text-slate-400">
                          {formatDateTime(t.created_at)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-semibold ${
                            t.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {t.delta >= 0 ? '+' : ''}
                          {t.delta}
                        </div>
                        <div className="text-xs text-slate-400">余 {t.balance_after}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="开通会员"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={submit} disabled={submitting || pickCustomer === ''}>
              {submitting ? '开通中…' : '开通'}
            </Button>
          </>
        }
      >
        <div>
          <span className="form-label">选择客户 *</span>
          <select
            className="form-input"
            value={pickCustomer}
            onChange={(e) => setPickCustomer(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">请选择客户…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}（#{c.id}）
              </option>
            ))}
          </select>
        </div>
      </Modal>
    </div>
  )
}
