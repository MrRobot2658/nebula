import { useEffect, useState } from 'react'
import { Plus, Workflow } from 'lucide-react'
import {
  createAutomation,
  getAutomationRuns,
  getAutomations,
  patchAutomation,
} from '../api/client'
import type { Automation, AutomationRun } from '../api/types'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge, { statusTone } from '../components/Badge'
import Modal from '../components/Modal'
import { EmptyState, Loading } from '../components/States'
import { EmptyRow, Table } from '../components/Table'
import { formatDateTime } from '../lib/format'

const TRIGGERS = ['message_in', 'customer_created', 'score_changed', 'stage_changed', 'tag_added']
const ACTIONS = ['send_message', 'add_tag', 'update_stage', 'notify', 'add_to_campaign']

export default function Automations() {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [runs, setRuns] = useState<AutomationRun[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    trigger_event: TRIGGERS[0],
    action: ACTIONS[0],
  })

  const load = () => {
    setLoading(true)
    Promise.all([getAutomations(), getAutomationRuns(20)])
      .then(([a, r]) => {
        setAutomations(a)
        setRuns(r)
      })
      .catch(() => {
        setAutomations([])
        setRuns([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const toggle = async (a: Automation) => {
    setPending(a.id)
    try {
      const updated = await patchAutomation(a.id, !a.enabled)
      setAutomations((prev) => prev.map((x) => (x.id === a.id ? updated : x)))
    } finally {
      setPending(null)
    }
  }

  const submit = async () => {
    if (!form.name.trim()) return
    setSubmitting(true)
    try {
      await createAutomation({
        name: form.name.trim(),
        trigger_event: form.trigger_event,
        conditions: {},
        actions: [{ type: form.action }],
      })
      setOpen(false)
      setForm({ name: '', trigger_event: TRIGGERS[0], action: ACTIONS[0] })
      load()
    } finally {
      setSubmitting(false)
    }
  }

  const actionSummary = (a: Automation) => {
    if (!a.actions || a.actions.length === 0) return '-'
    return a.actions
      .map((act) => (typeof act.type === 'string' ? act.type : JSON.stringify(act)))
      .join(', ')
  }

  return (
    <div>
      <PageHeader
        title="自动化流程"
        description="基于触发事件自动执行动作，构建增长引擎"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> 新建流程
          </Button>
        }
      />

      {loading ? (
        <Loading />
      ) : (
        <div className="space-y-6">
          {automations.length === 0 ? (
            <Card>
              <EmptyState text="暂无自动化流程" />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {automations.map((a) => (
                <Card key={a.id} testId="automation-card">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          a.enabled
                            ? 'bg-brand-100 text-brand-600'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <Workflow size={18} />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{a.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          触发：<Badge tone="blue">{a.trigger_event}</Badge>
                        </div>
                      </div>
                    </div>
                    <button
                      data-testid="automation-toggle"
                      data-enabled={a.enabled}
                      onClick={() => toggle(a)}
                      disabled={pending === a.id}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        a.enabled ? 'bg-brand-600' : 'bg-slate-200'
                      } disabled:opacity-50`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                          a.enabled ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="mt-3 text-sm text-slate-500">
                    动作：<span className="text-slate-700">{actionSummary(a)}</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    创建于 {formatDateTime(a.created_at)}
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Card title="最近执行" padded={false}>
            <Table headers={['流程', '客户', '状态', '时间']}>
              {runs.length === 0 ? (
                <EmptyRow colSpan={4} text="暂无执行记录" />
              ) : (
                runs.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {r.automation_name}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {r.customer_id != null ? `#${r.customer_id}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {formatDateTime(r.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </Table>
          </Card>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="新建自动化流程"
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
            <span className="form-label">流程名称 *</span>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="如 新客欢迎自动回复"
            />
          </div>
          <div>
            <span className="form-label">触发事件</span>
            <select
              className="form-input"
              value={form.trigger_event}
              onChange={(e) => setForm({ ...form, trigger_event: e.target.value })}
            >
              {TRIGGERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="form-label">执行动作</span>
            <select
              className="form-input"
              value={form.action}
              onChange={(e) => setForm({ ...form, action: e.target.value })}
            >
              {ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
