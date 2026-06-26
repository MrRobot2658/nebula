import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Radio } from 'lucide-react'
import { getChannels, patchChannel } from '../api/client'
import type { Channel } from '../api/types'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import { EmptyState, Loading } from '../components/States'
import { formatDateTime } from '../lib/format'

export default function Channels() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<number | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    getChannels()
      .then(setChannels)
      .catch(() => setChannels([]))
      .finally(() => setLoading(false))
  }, [])

  const toggle = async (ch: Channel, e: React.MouseEvent) => {
    e.stopPropagation()
    setPending(ch.id)
    try {
      const updated = await patchChannel(ch.id, { enabled: !ch.enabled })
      setChannels((prev) => prev.map((c) => (c.id === ch.id ? updated : c)))
    } finally {
      setPending(null)
    }
  }

  return (
    <div>
      <PageHeader title="渠道接入" description="管理多渠道触达能力，启用后即可收发消息" />

      {loading ? (
        <Loading />
      ) : channels.length === 0 ? (
        <EmptyState text="暂无渠道" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((ch) => (
            <div
              key={ch.id}
              data-testid="channel-card"
              onClick={() => navigate(`/channels/${ch.key}`)}
              className="cursor-pointer rounded-2xl bg-white border border-slate-200/70 shadow-card p-5 transition hover:shadow-md hover:border-brand-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      ch.enabled ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Radio size={20} />
                  </div>
                  <div>
                    <div className="font-medium text-slate-800">{ch.name}</div>
                    <div className="text-xs text-slate-400">{ch.key}</div>
                  </div>
                </div>
                <button
                  data-testid="channel-toggle"
                  data-enabled={ch.enabled}
                  onClick={(e) => toggle(ch, e)}
                  disabled={pending === ch.id}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    ch.enabled ? 'bg-brand-600' : 'bg-slate-200'
                  } disabled:opacity-50`}
                  aria-label="toggle channel"
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                      ch.enabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <Badge tone="slate">{ch.category}</Badge>
                <Badge tone={ch.enabled ? 'green' : 'slate'}>
                  {ch.enabled ? '已启用' : '未启用'}
                </Badge>
              </div>
              <div className="mt-3 text-xs text-slate-400">
                接入于 {formatDateTime(ch.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
