import type { ReactNode } from 'react'
import { ArrowUpRight, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'

interface CardShellProps {
  testId?: string
  icon?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  /** route for the "打开完整工作台" link */
  openTo?: string
  openLabel?: string
  actions?: ReactNode
  loading?: boolean
  error?: string | null
  children?: ReactNode
}

export default function CardShell({
  testId,
  icon,
  title,
  subtitle,
  openTo,
  openLabel = '打开完整工作台',
  actions,
  loading,
  error,
  children,
}: CardShellProps) {
  return (
    <div
      data-testid={testId}
      className="mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-3 py-2">
        {icon && <span className="text-brand-600">{icon}</span>}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-slate-800">{title}</div>
          {subtitle && <div className="truncate text-[11px] text-slate-400">{subtitle}</div>}
        </div>
        {actions}
        {openTo && (
          <Link
            to={openTo}
            className="inline-flex shrink-0 items-center gap-0.5 rounded-md px-2 py-1 text-[11px] font-medium text-brand-600 hover:bg-brand-50"
          >
            {openLabel}
            <ArrowUpRight size={12} />
          </Link>
        )}
      </div>
      <div className="px-3 py-2.5 text-sm">
        {loading ? (
          <div className="flex items-center gap-2 py-3 text-slate-400">
            <Loader2 size={15} className="animate-spin" /> 加载中…
          </div>
        ) : error ? (
          <div className="py-2 text-[13px] text-rose-600">{error}</div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
