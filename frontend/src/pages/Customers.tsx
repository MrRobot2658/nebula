import { useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { createCustomer, getCustomers } from '../api/client'
import type { Customer } from '../api/types'
import Card from '../components/Card'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Avatar from '../components/Avatar'
import Modal from '../components/Modal'
import { EmptyRow, Table } from '../components/Table'
import { Loading } from '../components/States'
import { formatDateTime, scoreColor } from '../lib/format'

export default function Customers() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', source_channel: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = (q?: string) => {
    setLoading(true)
    getCustomers({ search: q || undefined, limit: 100 })
      .then(setCustomers)
      .catch(() => setCustomers([]))
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

  const submit = async () => {
    if (!form.name.trim()) return
    setSubmitting(true)
    try {
      await createCustomer({
        name: form.name.trim(),
        phone: form.phone || undefined,
        email: form.email || undefined,
        source_channel: form.source_channel || undefined,
      })
      setModalOpen(false)
      setForm({ name: '', phone: '', email: '', source_channel: '' })
      load(search)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="客户管理"
        description="统一管理跨渠道的客户档案与画像"
        action={
          <Button data-testid="new-customer-button" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> 新建客户
          </Button>
        }
      />

      <Card padded={false}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 w-full max-w-sm">
            <Search size={15} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索姓名 / 手机 / 邮箱…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : (
          <Table
            testId="customer-table"
            headers={['客户', '来源渠道', '标签', '评分', '阶段', '更新时间']}
          >
            {customers.length === 0 ? (
              <EmptyRow colSpan={6} text="暂无客户" />
            ) : (
              customers.map((c) => (
                <tr
                  key={c.id}
                  data-testid="customer-row"
                  onClick={() => navigate(`/customers/${c.id}`)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} size="sm" />
                      <div className="min-w-0">
                        <div className="font-medium text-slate-700 truncate">{c.name}</div>
                        <div className="text-xs text-slate-400 truncate">
                          {c.phone || c.email || c.oneid}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {c.source_channel ? <Badge tone="blue">{c.source_channel}</Badge> : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {c.tags.length === 0 ? (
                        <span className="text-slate-300">-</span>
                      ) : (
                        c.tags.slice(0, 3).map((t) => (
                          <Badge key={t} tone="brand">
                            {t}
                          </Badge>
                        ))
                      )}
                      {c.tags.length > 3 && (
                        <span className="text-xs text-slate-400">+{c.tags.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${scoreColor(c.score)}`}
                          style={{ width: `${Math.min(100, Math.max(0, c.score))}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-600 w-7">{c.score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="indigo">{c.stage}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {formatDateTime(c.updated_at)}
                  </td>
                </tr>
              ))
            )}
          </Table>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="新建客户"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button onClick={submit} disabled={submitting || !form.name.trim()}>
              {submitting ? '保存中…' : '保存'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="姓名 *">
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="请输入客户姓名"
            />
          </Field>
          <Field label="手机">
            <input
              className="form-input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="可选"
            />
          </Field>
          <Field label="邮箱">
            <input
              className="form-input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="可选"
            />
          </Field>
          <Field label="来源渠道">
            <input
              className="form-input"
              value={form.source_channel}
              onChange={(e) => setForm({ ...form, source_channel: e.target.value })}
              placeholder="如 wechat / web"
            />
          </Field>
        </div>
      </Modal>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  )
}
