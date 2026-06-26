import clsx from 'clsx'
import type { ReactNode } from 'react'

type Tone = 'slate' | 'brand' | 'green' | 'amber' | 'red' | 'blue' | 'indigo'

const tones: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-600',
  brand: 'bg-brand-100 text-brand-700',
  green: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-rose-100 text-rose-700',
  blue: 'bg-sky-100 text-sky-700',
  indigo: 'bg-indigo-100 text-indigo-700',
}

interface BadgeProps {
  children: ReactNode
  tone?: Tone
  className?: string
}

export default function Badge({ children, tone = 'slate', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

const statusTones: Record<string, Tone> = {
  running: 'green',
  active: 'green',
  enabled: 'green',
  sent: 'green',
  success: 'green',
  delivered: 'green',
  done: 'green',
  draft: 'slate',
  paused: 'amber',
  pending: 'amber',
  queued: 'amber',
  failed: 'red',
  error: 'red',
}

export function statusTone(status: string): Tone {
  return statusTones[status?.toLowerCase?.()] ?? 'blue'
}
