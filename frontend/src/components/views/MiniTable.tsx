import type { ReactNode } from 'react'

interface MiniTableProps {
  headers: ReactNode[]
  rows: ReactNode[][]
  testId?: string
  empty?: string
}

export default function MiniTable({ headers, rows, testId, empty = '暂无数据' }: MiniTableProps) {
  return (
    <div data-testid={testId} className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-left text-[11px] font-medium uppercase tracking-wide text-slate-400">
            {headers.map((h, i) => (
              <th key={i} className="px-2 py-1.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-2 py-4 text-center text-slate-400">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j} className="px-2 py-1.5 align-middle text-slate-600">
                    {c}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
