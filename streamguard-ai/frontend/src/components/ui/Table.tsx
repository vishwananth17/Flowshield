import React from 'react'

interface Column<T> {
  key: keyof T | string
  header: string
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (row: T) => React.ReactNode
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyState?: React.ReactNode
  onRowClick?: (row: T) => void
  keyExtractor: (row: T) => string
}

export function Table<T>({
  columns, data, loading = false,
  emptyState, onRowClick, keyExtractor
}: TableProps<T>) {

  if (loading) {
    return (
      <div className="
        rounded-[var(--radius-lg)] overflow-hidden
        border border-[var(--border-default)]
      ">
        {/* Loading skeleton */}
        <div className="bg-[var(--bg-surface)]">
          <div className="
            flex px-6 py-3 gap-6
            border-b border-[var(--border-default)]
            bg-[var(--bg-inset)]
          ">
            {columns.map((_, i) => (
              <div key={i}
                className="h-4 bg-[var(--bg-elevated)] rounded animate-pulse"
                style={{ width: `${Math.random() * 60 + 60}px` }}
              />
            ))}
          </div>
          {[1,2,3,4,5].map(i => (
            <div key={i} className="
              flex px-6 py-4 gap-6
              border-b border-[var(--border-subtle)]
              last:border-0
            ">
              {columns.map((_, j) => (
                <div key={j}
                  className="h-4 bg-[var(--bg-elevated)] rounded animate-pulse"
                  style={{ width: `${Math.random() * 80 + 40}px` }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data.length && emptyState) {
    return (
      <div className="
        rounded-[var(--radius-lg)] overflow-hidden
        border border-[var(--border-default)]
        bg-[var(--bg-surface)]
      ">
        <div className="flex flex-col items-center justify-center py-20">
          {emptyState}
        </div>
      </div>
    )
  }

  return (
    <div className="
      rounded-[var(--radius-lg)] overflow-hidden
      border border-[var(--border-default)]
      shadow-[var(--shadow-sm)]
    ">
      <table className="w-full">
        <thead>
          <tr className="
            bg-[var(--bg-inset)]
            border-b border-[var(--border-default)]
          ">
            {columns.map(col => (
              <th
                key={String(col.key)}
                className={`
                  px-6 py-3
                  text-xs font-semibold uppercase
                  tracking-[var(--tracking-widest)]
                  text-[var(--text-muted)]
                  ${col.align === 'right' ? 'text-right' :
                    col.align === 'center' ? 'text-center' : 'text-left'}
                `}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              className={`
                border-b border-[var(--border-subtle)]
                last:border-0
                transition-colors duration-[var(--transition-fast)]
                ${rowIndex % 2 === 0
                  ? 'bg-[var(--bg-surface)]'
                  : 'bg-[var(--bg-inset)]'
                }
                ${onRowClick ? `
                  cursor-pointer
                  hover:bg-[var(--bg-highlight)]
                  hover:border-[var(--border-default)]
                ` : ''}
              `}
            >
              {columns.map(col => (
                <td
                  key={String(col.key)}
                  className={`
                    px-6 py-4
                    text-sm text-[var(--text-primary)]
                    font-[var(--font-body)]
                    ${col.align === 'right' ? 'text-right' :
                      col.align === 'center' ? 'text-center' : 'text-left'}
                  `}
                >
                  {col.render
                    ? col.render(row)
                    : String((row as any)[col.key] ?? '—')
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Table
