import { AlertCircle, Inbox, Loader2 } from 'lucide-react'

export function Loading({ text = '加载中…' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400">
      <Loader2 className="animate-spin" size={24} />
      <span className="text-sm">{text}</span>
    </div>
  )
}

export function ErrorState({ text = '加载失败，请稍后重试' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-rose-400">
      <AlertCircle size={24} />
      <span className="text-sm">{text}</span>
    </div>
  )
}

export function EmptyState({ text = '暂无数据' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400">
      <Inbox size={24} />
      <span className="text-sm">{text}</span>
    </div>
  )
}
