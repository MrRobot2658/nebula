import { useState } from 'react'
import { GitBranch, Play } from 'lucide-react'
import { getFlows, runFlow } from '../../api/client'
import type { FlowRun } from '../../api/types'
import Badge from '../Badge'
import CardShell from './CardShell'
import { useViewData } from './useViewData'

function flowStatus(status: string): { tone: 'green' | 'slate'; label: string } {
  return status === 'active'
    ? { tone: 'green', label: '已部署' }
    : { tone: 'slate', label: '草稿' }
}

export default function FlowsCard() {
  const { data, loading, error } = useViewData(() => getFlows(), [])
  const [runs, setRuns] = useState<Record<number, FlowRun>>({})
  const [busy, setBusy] = useState<number | null>(null)

  const run = async (id: number) => {
    setBusy(id)
    try {
      const result = await runFlow(id)
      setRuns((r) => ({ ...r, [id]: result }))
    } catch {
      /* ignore */
    } finally {
      setBusy(null)
    }
  }

  return (
    <CardShell
      testId="view-flows"
      icon={<GitBranch size={15} />}
      title="营销画布 · 自动化流程"
      subtitle="部署后随触发事件自动执行"
      openTo="/flows"
      loading={loading}
      error={error}
    >
      <div className="space-y-2">
        {(data ?? []).length === 0 && <div className="text-slate-400">暂无流程</div>}
        {(data ?? []).map((f) => {
          const s = flowStatus(f.status)
          const r = runs[f.id]
          return (
            <div key={f.id} className="rounded-lg border border-slate-100 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[13px] font-medium text-slate-700">{f.name}</span>
                <div className="flex items-center gap-2">
                  <Badge tone={s.tone}>{s.label}</Badge>
                  <button
                    onClick={() => run(f.id)}
                    disabled={busy === f.id}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-50"
                  >
                    <Play size={11} /> {busy === f.id ? '运行中…' : '运行'}
                  </button>
                </div>
              </div>
              {r && (
                <div className="mt-2 rounded-md bg-slate-50 p-2">
                  <div className="mb-1 flex items-center gap-2 text-[11px] text-slate-500">
                    执行器
                    <Badge tone={r.executor === 'airflow' ? 'indigo' : 'slate'}>
                      {r.executor === 'airflow' ? 'Airflow' : '本地'}
                    </Badge>
                  </div>
                  <div className="space-y-0.5">
                    {r.log.slice(0, 5).map((item, i) => (
                      <div key={i} className="text-[11px] text-slate-500">
                        <span className="font-mono text-slate-400">{item.type}</span> · {item.detail}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </CardShell>
  )
}
