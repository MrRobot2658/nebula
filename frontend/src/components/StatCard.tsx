import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  tone?: 'brand' | 'green' | 'amber' | 'blue' | 'indigo' | 'rose'
  hint?: string
  testId?: string
}

const tones: Record<string, string> = {
  brand: 'bg-brand-100 text-brand-600',
  green: 'bg-emerald-100 text-emerald-600',
  amber: 'bg-amber-100 text-amber-600',
  blue: 'bg-sky-100 text-sky-600',
  indigo: 'bg-indigo-100 text-indigo-600',
  rose: 'bg-rose-100 text-rose-600',
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'brand',
  hint,
  testId,
}: StatCardProps) {
  return (
    <div
      data-testid={testId}
      className="rounded-2xl bg-white border border-slate-200/70 shadow-card p-5"
    >
      <div className="flex items-start justify-between">
        <div
          className={clsx(
            'flex h-11 w-11 items-center justify-center rounded-xl',
            tones[tone]
          )}
        >
          <Icon size={20} />
        </div>
      </div>
      <div className="mt-4">
        <div className="text-2xl font-semibold text-slate-800">{value}</div>
        <div className="mt-1 text-sm text-slate-500">{label}</div>
        {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
      </div>
    </div>
  )
}
