import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import {
  Clock,
  FlagTriangleRight,
  GitBranch,
  GitFork,
  PlayCircle,
  Split,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { FlowNodeType } from '../api/types'

interface NodeMeta {
  label: string
  icon: LucideIcon
  /** tailwind classes for the node card accent */
  ring: string
  badge: string
}

export const NODE_META: Record<FlowNodeType, NodeMeta> = {
  trigger: {
    label: '触发器',
    icon: PlayCircle,
    ring: 'border-emerald-300',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  condition: {
    label: '条件',
    icon: GitBranch,
    ring: 'border-amber-300',
    badge: 'bg-amber-100 text-amber-700',
  },
  action: {
    label: '动作',
    icon: Zap,
    ring: 'border-brand-300',
    badge: 'bg-brand-100 text-brand-700',
  },
  wait: {
    label: '等待',
    icon: Clock,
    ring: 'border-sky-300',
    badge: 'bg-sky-100 text-sky-700',
  },
  abtest: {
    label: 'AB测试',
    icon: Split,
    ring: 'border-indigo-300',
    badge: 'bg-indigo-100 text-indigo-700',
  },
  branch: {
    label: '分支',
    icon: GitFork,
    ring: 'border-rose-300',
    badge: 'bg-rose-100 text-rose-700',
  },
  end: {
    label: '结束',
    icon: FlagTriangleRight,
    ring: 'border-slate-300',
    badge: 'bg-slate-200 text-slate-700',
  },
}

export const NODE_ORDER: FlowNodeType[] = [
  'trigger',
  'condition',
  'action',
  'wait',
  'abtest',
  'branch',
  'end',
]

interface Variant {
  key: string
  weight?: number
}

function summary(type: FlowNodeType, data: Record<string, unknown>): string {
  switch (type) {
    case 'trigger':
      return String(data.event ?? '事件')
    case 'condition':
      return `${data.field ?? ''} ${data.op ?? ''} ${data.value ?? ''}`.trim()
    case 'action':
      return String(data.action ?? '动作')
    case 'wait':
      return `${data.seconds ?? 0} 秒`
    case 'abtest':
      return `${(data.variants as Variant[] | undefined)?.length ?? 0} 个分组`
    default:
      return ''
  }
}

function CustomNode({ type, data, selected }: NodeProps) {
  const t = (type as FlowNodeType) ?? 'action'
  const meta = NODE_META[t] ?? NODE_META.action
  const Icon = meta.icon
  const label = (data?.label as string) || meta.label
  const variants = (data?.variants as Variant[] | undefined) ?? []

  return (
    <div
      className={`min-w-[150px] rounded-xl border-2 bg-white px-3 py-2 shadow-sm ${
        meta.ring
      } ${selected ? 'ring-2 ring-brand-300' : ''}`}
    >
      {/* target handle (top) — every node except trigger */}
      {t !== 'trigger' && <Handle type="target" position={Position.Top} />}

      <div className="flex items-center gap-2">
        <span className={`flex h-6 w-6 items-center justify-center rounded-md ${meta.badge}`}>
          <Icon size={13} />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-700">{label}</div>
          <div className="truncate text-[11px] text-slate-400">{summary(t, data ?? {})}</div>
        </div>
      </div>

      {/* source handles (bottom) */}
      {t === 'condition' ? (
        <>
          <span className="pointer-events-none absolute -bottom-4 left-3 text-[10px] text-emerald-600">
            是
          </span>
          <span className="pointer-events-none absolute -bottom-4 right-3 text-[10px] text-rose-600">
            否
          </span>
          <Handle
            id="true"
            type="source"
            position={Position.Bottom}
            style={{ left: '25%' }}
          />
          <Handle
            id="false"
            type="source"
            position={Position.Bottom}
            style={{ left: '75%' }}
          />
        </>
      ) : t === 'abtest' ? (
        variants.length > 0 ? (
          variants.map((v, i) => (
            <Handle
              key={v.key}
              id={v.key}
              type="source"
              position={Position.Bottom}
              style={{ left: `${((i + 1) / (variants.length + 1)) * 100}%` }}
            />
          ))
        ) : (
          <Handle id="A" type="source" position={Position.Bottom} />
        )
      ) : t === 'end' ? null : (
        <Handle type="source" position={Position.Bottom} />
      )}
    </div>
  )
}

export const nodeTypes = {
  trigger: CustomNode,
  condition: CustomNode,
  action: CustomNode,
  wait: CustomNode,
  abtest: CustomNode,
  branch: CustomNode,
  end: CustomNode,
}
