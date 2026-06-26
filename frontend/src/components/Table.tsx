import clsx from 'clsx'
import type { ReactNode } from 'react'

interface TableProps {
  headers: ReactNode[]
  children: ReactNode
  className?: string
  testId?: string
}

export function Table({ headers, children, className, testId }: TableProps) {
  return (
    <div className={clsx('overflow-x-auto', className)}>
      <table data-testid={testId} className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-400 border-b border-slate-100">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">{children}</tbody>
      </table>
    </div>
  )
}

export function EmptyRow({ colSpan, text }: { colSpan: number; text?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-slate-400">
        {text ?? '暂无数据'}
      </td>
    </tr>
  )
}
