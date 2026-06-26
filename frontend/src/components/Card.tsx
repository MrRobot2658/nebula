import clsx from 'clsx'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  title?: ReactNode
  action?: ReactNode
  padded?: boolean
  testId?: string
}

export default function Card({
  children,
  className,
  title,
  action,
  padded = true,
  testId,
}: CardProps) {
  return (
    <div
      data-testid={testId}
      className={clsx(
        'rounded-2xl bg-white border border-slate-200/70 shadow-card',
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          {title && (
            <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
          )}
          {action}
        </div>
      )}
      <div className={clsx(padded && 'p-5')}>{children}</div>
    </div>
  )
}
