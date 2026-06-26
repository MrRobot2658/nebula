import { useState } from 'react'
import { Radio, Zap } from 'lucide-react'
import { getChannels, simulateChannelEvent } from '../../api/client'
import Badge from '../Badge'
import CardShell from './CardShell'
import { useViewData } from './useViewData'

export default function ChannelsCard() {
  const { data, loading, error } = useViewData(() => getChannels(), [])
  const [fired, setFired] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState<string | null>(null)

  const simulate = async (key: string) => {
    setBusy(key)
    try {
      await simulateChannelEvent(key, {
        event_key: 'message_received',
        content: '你好，我想了解一下你们的产品',
      })
      setFired((f) => ({ ...f, [key]: true }))
      window.setTimeout(() => setFired((f) => ({ ...f, [key]: false })), 2500)
    } catch {
      /* ignore */
    } finally {
      setBusy(null)
    }
  }

  return (
    <CardShell
      testId="view-channels"
      icon={<Radio size={15} />}
      title="渠道"
      subtitle="多渠道触达"
      openTo="/channels"
      loading={loading}
      error={error}
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {(data ?? []).map((ch) => (
          <div key={ch.id} className="rounded-lg border border-slate-100 p-2.5">
            <div className="flex items-center justify-between">
              <span className="truncate text-[13px] font-medium text-slate-700">{ch.name}</span>
              <Badge tone={ch.enabled ? 'green' : 'slate'}>
                {ch.enabled ? '已启用' : '未启用'}
              </Badge>
            </div>
            <div className="mt-0.5 text-[11px] text-slate-400">{ch.key}</div>
            <button
              onClick={() => simulate(ch.key)}
              disabled={busy === ch.key}
              className="mt-2 inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-50"
            >
              <Zap size={11} /> {fired[ch.key] ? '已触发' : '模拟事件'}
            </button>
          </div>
        ))}
      </div>
    </CardShell>
  )
}
