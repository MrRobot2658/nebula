import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Play, Plus, Rocket, Save, Trash2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useUpdateNodeInternals,
} from 'reactflow'
import type { Connection, Edge, Node } from 'reactflow'
import 'reactflow/dist/style.css'
import {
  getAbResults,
  getFlow,
  getFlowRuns,
  runFlow,
  saveFlow,
} from '../api/client'
import type {
  AbResult,
  FlowEdge,
  FlowNode,
  FlowNodeType,
  FlowRun,
} from '../api/types'
import { NODE_META, NODE_ORDER, nodeTypes } from '../components/FlowNodes'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge, { statusTone } from '../components/Badge'
import { Loading } from '../components/States'
import { formatDateTime } from '../lib/format'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function defaultData(type: FlowNodeType): Record<string, any> {
  switch (type) {
    case 'trigger':
      return { label: '触发器', event: 'message_received' }
    case 'condition':
      return { label: '条件', field: 'score', op: '>', value: '10' }
    case 'action':
      return { label: '动作', action: 'send_template', template: '', tag: '', points: 0 }
    case 'wait':
      return { label: '等待', seconds: 60 }
    case 'abtest':
      return {
        label: 'AB测试',
        variants: [
          { key: 'A', weight: 50 },
          { key: 'B', weight: 50 },
        ],
      }
    case 'branch':
      return { label: '分支' }
    case 'end':
      return { label: '结束' }
  }
}

let nodeSeq = 1

function FlowEditor() {
  const { id } = useParams<{ id: string }>()
  const flowId = Number(id)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()
  const updateNodeInternals = useUpdateNodeInternals()

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [flowName, setFlowName] = useState('')
  const [status, setStatus] = useState('draft')
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [running, setRunning] = useState(false)
  const [run, setRun] = useState<FlowRun | null>(null)
  const [runs, setRuns] = useState<FlowRun[]>([])
  const [ab, setAb] = useState<AbResult[]>([])

  const refreshRuns = useCallback(() => {
    getFlowRuns(flowId)
      .then(setRuns)
      .catch(() => setRuns([]))
    getAbResults(flowId)
      .then(setAb)
      .catch(() => setAb([]))
  }, [flowId])

  useEffect(() => {
    if (!Number.isFinite(flowId)) return
    setLoading(true)
    getFlow(flowId)
      .then((flow) => {
        setFlowName(flow.name)
        setStatus(flow.status)
        setNodes(
          (flow.nodes ?? []).map((n) => ({
            id: n.id,
            type: n.type,
            position: n.position,
            data: n.data,
          }))
        )
        setEdges(
          (flow.edges ?? []).map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle ?? undefined,
            label: e.label,
          }))
        )
      })
      .catch(() => undefined)
      .finally(() => setLoading(false))
    refreshRuns()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowId])

  const onConnect = useCallback(
    (params: Connection) => {
      const src = nodes.find((n) => n.id === params.source)
      let label: string | undefined
      if (params.sourceHandle === 'true') label = '是'
      else if (params.sourceHandle === 'false') label = '否'
      else if (src?.type === 'abtest' && params.sourceHandle) label = params.sourceHandle
      const edge: Edge = {
        ...params,
        id: `e-${params.source}-${params.sourceHandle ?? ''}-${params.target}-${Date.now()}`,
        label,
      } as Edge
      setEdges((eds) => addEdge(edge, eds))
    },
    [nodes, setEdges]
  )

  const addNode = useCallback(
    (type: FlowNodeType, position?: { x: number; y: number }) => {
      const pos = position ?? { x: 220 + (nodeSeq % 5) * 40, y: 80 + (nodeSeq % 7) * 50 }
      const newNode: Node = {
        id: `${type}-${Date.now()}-${nodeSeq++}`,
        type,
        position: pos,
        data: defaultData(type),
      }
      setNodes((nds) => nds.concat(newNode))
      setSelectedId(newNode.id)
    },
    [setNodes]
  )

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const type = event.dataTransfer.getData('application/reactflow') as FlowNodeType
      if (!type) return
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      addNode(type, position)
    },
    [screenToFlowPosition, addNode]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData = (patch: Record<string, any>) => {
    if (!selectedId) return
    setNodes((nds) =>
      nds.map((n) => (n.id === selectedId ? { ...n, data: { ...n.data, ...patch } } : n))
    )
  }

  const deleteSelected = () => {
    if (!selectedId) return
    setNodes((nds) => nds.filter((n) => n.id !== selectedId))
    setEdges((eds) => eds.filter((e) => e.source !== selectedId && e.target !== selectedId))
    setSelectedId(null)
  }

  const buildNodes = (): FlowNode[] =>
    nodes.map((n) => ({
      id: n.id,
      type: n.type as FlowNodeType,
      position: n.position,
      data: n.data,
    }))

  const buildEdges = (): FlowEdge[] =>
    edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle ?? null,
      label: typeof e.label === 'string' ? e.label : undefined,
    }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveFlow(flowId, { name: flowName, nodes: buildNodes(), edges: buildEdges() })
    } finally {
      setSaving(false)
    }
  }

  const handleDeploy = async () => {
    const next = status === 'active' ? 'draft' : 'active'
    setDeploying(true)
    try {
      const updated = await saveFlow(flowId, {
        status: next,
        nodes: buildNodes(),
        edges: buildEdges(),
      })
      setStatus(updated.status)
    } finally {
      setDeploying(false)
    }
  }

  const handleRun = async () => {
    setRunning(true)
    try {
      const result = await runFlow(flowId)
      setRun(result)
      refreshRuns()
    } finally {
      setRunning(false)
    }
  }

  if (loading) {
    return (
      <div>
        <Link
          to="/flows"
          className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={16} /> 返回流程列表
        </Link>
        <Loading />
      </div>
    )
  }

  const deployed = status === 'active'

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/flows"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft size={16} /> 返回
          </Link>
          <input
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          <Badge tone={deployed ? 'green' : 'slate'}>
            <span data-testid="flow-status-badge">{deployed ? '已部署' : '草稿'}</span>
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={deployed ? 'secondary' : 'primary'}
            data-testid="deploy-flow-button"
            onClick={handleDeploy}
            disabled={deploying}
          >
            <Rocket size={15} /> {deploying ? '处理中…' : deployed ? '取消部署' : '部署'}
          </Button>
          <Button variant="secondary" data-testid="save-flow-button" onClick={handleSave} disabled={saving}>
            <Save size={15} /> {saving ? '保存中…' : '保存'}
          </Button>
          <Button data-testid="run-flow-button" onClick={handleRun} disabled={running}>
            <Play size={15} /> {running ? '运行中…' : '运行'}
          </Button>
        </div>
      </div>
      <p className="mb-4 text-xs text-slate-400">
        已部署的流程会在其触发节点的事件发生时自动执行（无需手动点运行）。
      </p>

      <div className="flex flex-col gap-4 xl:flex-row">
        {/* Palette */}
        <div
          data-testid="node-palette"
          className="shrink-0 rounded-2xl bg-white border border-slate-200/70 shadow-card p-3 xl:w-44"
        >
          <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            组件
          </div>
          <div className="grid grid-cols-2 gap-2 xl:grid-cols-1">
            {NODE_ORDER.map((t) => {
              const meta = NODE_META[t]
              const Icon = meta.icon
              return (
                <button
                  key={t}
                  type="button"
                  data-testid={`palette-${t}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow', t)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onClick={() => addNode(t)}
                  className={`flex items-center gap-2 rounded-lg border ${meta.ring} bg-white px-2.5 py-2 text-left text-sm text-slate-600 hover:bg-slate-50`}
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-md ${meta.badge}`}>
                    <Icon size={13} />
                  </span>
                  {meta.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={wrapperRef}
          className="h-[70vh] flex-1 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card"
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            onPaneClick={() => setSelectedId(null)}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap pannable zoomable />
          </ReactFlow>
        </div>

        {/* Config panel */}
        <div className="shrink-0 xl:w-72">
          <Card title="节点配置">
            {!selectedNode ? (
              <div className="py-8 text-center text-sm text-slate-400">
                选择一个节点进行配置
              </div>
            ) : (
              <NodeConfig
                node={selectedNode}
                updateData={updateData}
                onDelete={deleteSelected}
                onVariantsChange={() => updateNodeInternals(selectedNode.id)}
              />
            )}
          </Card>
        </div>
      </div>

      {/* Run log / AB results / recent runs */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card
          title="执行日志"
          action={
            run ? (
              <Badge tone={run.executor === 'airflow' ? 'indigo' : 'slate'}>
                {run.executor === 'airflow' ? 'Airflow' : '本地'}
              </Badge>
            ) : null
          }
        >
          <div data-testid="flow-run-log" className="space-y-2 max-h-72 overflow-y-auto">
            {!run ? (
              <div className="text-sm text-slate-400">点击「运行」查看执行日志</div>
            ) : run.log.length === 0 ? (
              <div className="text-sm text-slate-400">无日志</div>
            ) : (
              run.log.map((item, i) => (
                <div
                  key={i}
                  data-testid="run-log-item"
                  className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Badge tone="brand">{item.type}</Badge>
                    <span className="font-mono text-slate-400">{item.node_id}</span>
                  </div>
                  <div className="mt-1 text-slate-600">{item.detail}</div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card title="AB测试结果">
          <div data-testid="ab-results" className="space-y-3">
            {ab.length === 0 ? (
              <div className="text-sm text-slate-400">暂无 AB 测试数据</div>
            ) : (
              (() => {
                const max = Math.max(1, ...ab.map((r) => r.count))
                return ab.map((r) => (
                  <div key={r.variant}>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>分组 {r.variant}</span>
                      <span className="font-semibold text-slate-700">{r.count}</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${(r.count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              })()
            )}
          </div>
        </Card>

        <Card title="最近运行">
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {runs.length === 0 ? (
              <div className="text-sm text-slate-400">暂无运行记录</div>
            ) : (
              runs.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
                >
                  <div>
                    <div className="text-slate-600">运行 #{r.id}</div>
                    <div className="text-xs text-slate-400">{formatDateTime(r.created_at)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={r.executor === 'airflow' ? 'indigo' : 'slate'}>
                      {r.executor === 'airflow' ? 'Airflow' : '本地'}
                    </Badge>
                    <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

interface NodeConfigProps {
  node: Node
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateData: (patch: Record<string, any>) => void
  onDelete: () => void
  onVariantsChange: () => void
}

interface Variant {
  key: string
  weight: number
}

function NodeConfig({ node, updateData, onDelete, onVariantsChange }: NodeConfigProps) {
  const type = node.type as FlowNodeType
  const data = node.data as Record<string, unknown>

  const variants = (data.variants as Variant[] | undefined) ?? []

  const setVariants = (next: Variant[]) => {
    updateData({ variants: next })
    onVariantsChange()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Badge tone="brand">{NODE_META[type]?.label ?? type}</Badge>
        <button onClick={onDelete} className="text-slate-400 hover:text-rose-500" title="删除节点">
          <Trash2 size={15} />
        </button>
      </div>

      <div>
        <span className="form-label">节点名称</span>
        <input
          className="form-input"
          value={(data.label as string) ?? ''}
          onChange={(e) => updateData({ label: e.target.value })}
        />
      </div>

      {type === 'trigger' && (
        <div>
          <span className="form-label">触发事件</span>
          <select
            className="form-input"
            value={(data.event as string) ?? 'message_received'}
            onChange={(e) => updateData({ event: e.target.value })}
          >
            <option value="message_received">收到消息</option>
            <option value="form_submitted">表单提交</option>
            <option value="order_placed">完成下单</option>
          </select>
        </div>
      )}

      {type === 'condition' && (
        <>
          <div>
            <span className="form-label">字段</span>
            <select
              className="form-input"
              value={(data.field as string) ?? 'score'}
              onChange={(e) => updateData({ field: e.target.value })}
            >
              <option value="score">评分 score</option>
              <option value="tag">标签 tag</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="form-label">运算符</span>
              <select
                className="form-input"
                value={(data.op as string) ?? '>'}
                onChange={(e) => updateData({ op: e.target.value })}
              >
                <option value=">">{'>'}</option>
                <option value=">=">{'>='}</option>
                <option value="==">{'=='}</option>
                <option value="contains">contains</option>
              </select>
            </div>
            <div>
              <span className="form-label">值</span>
              <input
                className="form-input"
                value={(data.value as string) ?? ''}
                onChange={(e) => updateData({ value: e.target.value })}
              />
            </div>
          </div>
        </>
      )}

      {type === 'action' && (
        <>
          <div>
            <span className="form-label">动作</span>
            <select
              className="form-input"
              value={(data.action as string) ?? 'send_template'}
              onChange={(e) => updateData({ action: e.target.value })}
            >
              <option value="send_template">发送模板</option>
              <option value="add_tag">添加标签</option>
              <option value="adjust_score">调整评分</option>
            </select>
          </div>
          {data.action === 'add_tag' ? (
            <div>
              <span className="form-label">标签</span>
              <input
                className="form-input"
                value={(data.tag as string) ?? ''}
                onChange={(e) => updateData({ tag: e.target.value })}
              />
            </div>
          ) : data.action === 'adjust_score' ? (
            <div>
              <span className="form-label">分值</span>
              <input
                type="number"
                className="form-input"
                value={(data.points as number) ?? 0}
                onChange={(e) => updateData({ points: Number(e.target.value) })}
              />
            </div>
          ) : (
            <div>
              <span className="form-label">模板</span>
              <input
                className="form-input"
                value={(data.template as string) ?? ''}
                onChange={(e) => updateData({ template: e.target.value })}
                placeholder="模板名称"
              />
            </div>
          )}
        </>
      )}

      {type === 'wait' && (
        <div>
          <span className="form-label">等待时长（秒）</span>
          <input
            type="number"
            className="form-input"
            value={(data.seconds as number) ?? 0}
            onChange={(e) => updateData({ seconds: Number(e.target.value) })}
          />
        </div>
      )}

      {type === 'abtest' && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="form-label mb-0">分组</span>
            <button
              className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700"
              onClick={() => {
                const nextKey = String.fromCharCode(65 + variants.length)
                setVariants([...variants, { key: nextKey, weight: 0 }])
              }}
            >
              <Plus size={12} /> 添加分组
            </button>
          </div>
          <div className="space-y-2">
            {variants.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className="form-input w-16"
                  value={v.key}
                  onChange={(e) => {
                    const next = variants.map((x, idx) =>
                      idx === i ? { ...x, key: e.target.value } : x
                    )
                    setVariants(next)
                  }}
                />
                <input
                  type="number"
                  className="form-input flex-1"
                  value={v.weight}
                  onChange={(e) => {
                    const next = variants.map((x, idx) =>
                      idx === i ? { ...x, weight: Number(e.target.value) } : x
                    )
                    setVariants(next)
                  }}
                  placeholder="权重"
                />
                <button
                  onClick={() => setVariants(variants.filter((_, idx) => idx !== i))}
                  className="text-slate-400 hover:text-rose-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {(type === 'branch' || type === 'end') && (
        <div className="text-xs text-slate-400">该节点无需额外配置</div>
      )}
    </div>
  )
}

export default function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <FlowEditor />
    </ReactFlowProvider>
  )
}
