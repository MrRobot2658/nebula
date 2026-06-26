import { useEffect, useState } from 'react'
import { Crown, Plus, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { createMember, getCustomers, getMembers } from '../api/client'
import type { Customer, Member } from '../api/types'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Avatar from '../components/Avatar'
import Modal from '../components/Modal'
import { EmptyRow, Table } from '../components/Table'
import { Loading } from '../components/States'
import { formatDateTime } from '../lib/format'

type Tone = 'slate' | 'brand' | 'amber' | 'blue'

function levelTone(level: string): Tone {
  if (level.includes('钻')) return 'brand'
  if (level.includes('金')) return 'amber'
  if (level.includes('银')) return 'blue'
  return 'slate'
}

export default function Members() {
  const navigate = useNavigate()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [pickCustomer, setPickCustomer] = useState<number | ''>('')
  const [submitting, setSubmitting] = useState(false)

  const load = (q?: string) => {
    setLoading(true)
    getMembers(q || undefined)
      .then(setMembers)
      .catch(() => setMembers([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => load(search), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

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
      load(search)
    } finally {
      setSubmitting(false)
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

      <Card padded={false}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 w-full max-w-sm">
            <Search size={15} className="text-slate-400" />
            <input
              data-testid="member-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索会员姓名"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

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
                  onClick={() => navigate(`/members/${m.customer_id}`)}
                  className="cursor-pointer hover:bg-slate-50"
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
