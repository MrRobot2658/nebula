import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { createCampaign, getCampaigns } from '../api/client'
import type { Campaign } from '../api/types'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge, { statusTone } from '../components/Badge'
import Modal from '../components/Modal'
import { EmptyRow, Table } from '../components/Table'
import { Loading } from '../components/States'
import { formatDateTime } from '../lib/format'

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', channel_key: '' })

  const load = () => {
    setLoading(true)
    getCampaigns()
      .then(setCampaigns)
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const submit = async () => {
    if (!form.name.trim()) return
    setSubmitting(true)
    try {
      await createCampaign({
        name: form.name.trim(),
        channel_key: form.channel_key || undefined,
      })
      setOpen(false)
      setForm({ name: '', channel_key: '' })
      load()
    } finally {
      setSubmitting(false)
    }
  }

  const statByKey = (stats: Record<string, unknown>, key: string) => {
    const v = stats?.[key]
    return typeof v === 'number' || typeof v === 'string' ? String(v) : '0'
  }

  return (
    <div>
      <PageHeader
        title="营销活动"
        description="编排批量触达活动并追踪执行状态"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> 新建活动
          </Button>
        }
      />

      <Card padded={false}>
        {loading ? (
          <Loading />
        ) : (
          <Table testId="campaign-table" headers={['活动名称', '状态', '渠道', '触达', '创建时间']}>
            {campaigns.length === 0 ? (
              <EmptyRow colSpan={5} text="暂无活动" />
            ) : (
              campaigns.map((c) => (
                <tr key={c.id} data-testid="campaign-row" className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{c.name}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(c.status)} className="campaign-status">
                      {c.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {c.channel_key ? <Badge tone="blue">{c.channel_key}</Badge> : '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {statByKey(c.stats, 'sent')} 条
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {formatDateTime(c.created_at)}
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
        title="新建活动"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={submit} disabled={submitting || !form.name.trim()}>
              {submitting ? '创建中…' : '创建'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <span className="form-label">活动名称 *</span>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="如 618 大促唤醒"
            />
          </div>
          <div>
            <span className="form-label">渠道 Key</span>
            <input
              className="form-input"
              value={form.channel_key}
              onChange={(e) => setForm({ ...form, channel_key: e.target.value })}
              placeholder="可选，如 sms / email"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
