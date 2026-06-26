import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { getEvents } from '../api/client'
import type { Event } from '../api/types'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import { EmptyRow, Table } from '../components/Table'
import { Loading } from '../components/States'
import { formatDateTime } from '../lib/format'

export default function Events() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    getEvents(100)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  return (
    <div>
      <PageHeader
        title="事件流"
        description="系统实时事件总线，便于追踪自动化与评分链路"
        action={
          <Button variant="secondary" onClick={load}>
            <RefreshCw size={15} /> 刷新
          </Button>
        }
      />

      <Card padded={false}>
        {loading ? (
          <Loading />
        ) : (
          <Table testId="event-table" headers={['类型', '客户', '渠道', 'Payload', '时间']}>
            {events.length === 0 ? (
              <EmptyRow colSpan={5} text="暂无事件" />
            ) : (
              events.map((e) => (
                <tr key={e.id} data-testid="event-row" className="hover:bg-slate-50 align-top">
                  <td className="px-4 py-3">
                    <Badge tone="brand">{e.type}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {e.customer_id != null ? `#${e.customer_id}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {e.channel_key ? <Badge tone="blue">{e.channel_key}</Badge> : '-'}
                  </td>
                  <td className="px-4 py-3 max-w-md">
                    <code className="block truncate rounded bg-slate-50 px-2 py-1 text-xs text-slate-500">
                      {JSON.stringify(e.payload)}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                    {formatDateTime(e.created_at)}
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
