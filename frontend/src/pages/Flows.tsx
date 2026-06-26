import { useEffect, useState } from 'react'
import { GitBranch, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { createFlow, getFlows } from '../api/client'
import type { Flow } from '../api/types'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import { EmptyRow, Table } from '../components/Table'
import { Loading } from '../components/States'
import { formatDateTime } from '../lib/format'

export function flowStatusInfo(status: string): { tone: 'green' | 'slate'; label: string } {
  return status === 'active'
    ? { tone: 'green', label: '已部署' }
    : { tone: 'slate', label: '草稿' }
}

export default function Flows() {
  const navigate = useNavigate()
  const [flows, setFlows] = useState<Flow[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const load = () => {
    setLoading(true)
    getFlows()
      .then(setFlows)
      .catch(() => setFlows([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const createNew = async () => {
    setCreating(true)
    try {
      const flow = await createFlow({
        name: `自动化流程 ${new Date().toLocaleString('zh-CN')}`,
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 80, y: 160 },
            data: { label: '触发器', event: 'message_received' },
          },
        ],
        edges: [],
      })
      navigate(`/flows/${flow.id}`)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="自动化画布"
        description="以拖拽方式编排多步自动化流程"
        action={
          <Button data-testid="new-flow-button" onClick={createNew} disabled={creating}>
            <Plus size={16} /> {creating ? '创建中…' : '新建流程'}
          </Button>
        }
      />

      <Card padded={false}>
        {loading ? (
          <Loading />
        ) : (
          <Table testId="flow-list" headers={['流程名称', '状态', '节点数', '更新时间']}>
            {flows.length === 0 ? (
              <EmptyRow colSpan={4} text="暂无流程" />
            ) : (
              flows.map((f) => (
                <tr
                  key={f.id}
                  data-testid="flow-row"
                  onClick={() => navigate(`/flows/${f.id}`)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                        <GitBranch size={15} />
                      </div>
                      <span className="font-medium text-slate-700">{f.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={flowStatusInfo(f.status).tone}>
                      {flowStatusInfo(f.status).label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{f.nodes?.length ?? 0}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {formatDateTime(f.updated_at)}
                  </td>
                </tr>
              ))
            )}
          </Table>
        )}
      </Card>
    </div>
  )
}
