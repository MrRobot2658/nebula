import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { createScoreRule, getScoreRules } from '../api/client'
import type { ScoreRule } from '../api/types'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import { EmptyRow, Table } from '../components/Table'
import { Loading } from '../components/States'
import { formatDateTime } from '../lib/format'

const EVENT_TYPES = ['message_in', 'message_out', 'page_view', 'form_submit', 'click', 'purchase']
const DIMENSIONS = ['engagement', 'intent', 'fit', 'loyalty']

export default function Scoring() {
  const [rules, setRules] = useState<ScoreRule[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    event_type: EVENT_TYPES[0],
    dimension: DIMENSIONS[0],
    points: 10,
  })

  const load = () => {
    setLoading(true)
    getScoreRules()
      .then(setRules)
      .catch(() => setRules([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const submit = async () => {
    if (!form.name.trim()) return
    setSubmitting(true)
    try {
      await createScoreRule({
        name: form.name.trim(),
        event_type: form.event_type,
        dimension: form.dimension,
        points: Number(form.points),
      })
      setOpen(false)
      setForm({ name: '', event_type: EVENT_TYPES[0], dimension: DIMENSIONS[0], points: 10 })
      load()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="评分模型"
        description="基于事件为客户动态打分，驱动分层运营"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> 新建规则
          </Button>
        }
      />

      <Card padded={false}>
        {loading ? (
          <Loading />
        ) : (
          <Table testId="score-rule-table" headers={['规则名称', '触发事件', '维度', '分值', '创建时间']}>
            {rules.length === 0 ? (
              <EmptyRow colSpan={5} text="暂无评分规则" />
            ) : (
              rules.map((r) => (
                <tr key={r.id} data-testid="score-rule-row" className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{r.name}</td>
                  <td className="px-4 py-3">
                    <Badge tone="blue">{r.event_type}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="indigo">{r.dimension}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-semibold ${
                        r.points >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {r.points >= 0 ? '+' : ''}
                      {r.points}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {formatDateTime(r.created_at)}
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
        title="新建评分规则"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={submit} disabled={submitting || !form.name.trim()}>
              {submitting ? '保存中…' : '保存'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <span className="form-label">规则名称 *</span>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="如 主动咨询加分"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="form-label">触发事件</span>
              <select
                className="form-input"
                value={form.event_type}
                onChange={(e) => setForm({ ...form, event_type: e.target.value })}
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="form-label">维度</span>
              <select
                className="form-input"
                value={form.dimension}
                onChange={(e) => setForm({ ...form, dimension: e.target.value })}
              >
                {DIMENSIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <span className="form-label">分值</span>
            <input
              type="number"
              className="form-input"
              value={form.points}
              onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
