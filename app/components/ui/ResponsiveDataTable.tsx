import type { ReactNode } from "react"

export type ResponsiveDataTableColumn<T> = {
  key: string
  header: ReactNode
  render: (row: T, index: number) => ReactNode
  align?: "left" | "right" | "center"
  className?: string
  headerClassName?: string
}

type ResponsiveDataTableProps<T> = {
  rows: T[]
  columns: Array<ResponsiveDataTableColumn<T>>
  getRowKey: (row: T, index: number) => string
  minWidth?: number
  className?: string
  tableClassName?: string
  rowClassName?: (row: T, index: number) => string
  emptyState?: ReactNode
}

const alignClass = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const

export default function ResponsiveDataTable<T>({
  rows,
  columns,
  getRowKey,
  minWidth = 560,
  className = "",
  tableClassName = "",
  rowClassName,
  emptyState,
}: ResponsiveDataTableProps<T>) {
  if (!rows.length && emptyState) return <>{emptyState}</>

  return (
    <div className={`mobile-safe-table ${className}`}>
      <table className={`w-full text-left text-sm ${tableClassName}`} style={{ minWidth }}>
        <thead className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
          <tr className="border-b border-[var(--border-card)]">
            {columns.map((column) => {
              const align = alignClass[column.align || "left"]
              return (
                <th key={column.key} className={`py-3 pr-4 ${align} ${column.headerClassName || ""}`}>
                  {column.header}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-card)]">
          {rows.map((row, index) => (
            <tr key={getRowKey(row, index)} className={rowClassName?.(row, index)}>
              {columns.map((column) => {
                const align = alignClass[column.align || "left"]
                return (
                  <td key={column.key} className={`py-3 pr-4 ${align} ${column.className || ""}`}>
                    {column.render(row, index)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
