import React from 'react';
import { ArrowUpDown, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  newRowIds?: Set<string | number>;
  rowKey: (row: T) => string | number;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  error = null,
  onRetry,
  onRowClick,
  emptyTitle = 'No transactions found',
  emptyDescription = 'Connect Razorpay or send a sandbox event to start seeing risk intelligence here.',
  emptyActionLabel = 'Send test transaction',
  onEmptyAction,
  newRowIds,
  rowKey,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn('w-full border border-[var(--border-default)] rounded-[var(--radius-lg)] bg-[var(--surface-page)] overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Header */}
          <thead className="bg-[var(--surface-secondary)] border-b border-[var(--border-default)] sticky top-0 z-10">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={cn(
                    'px-4 py-2.5 text-[12px] font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)] select-none',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  )}
                >
                  <div className={cn('inline-flex items-center gap-1.5', col.align === 'right' && 'justify-end w-full')}>
                    <span>{col.label}</span>
                    {col.sortable && <ArrowUpDown size={12} className="opacity-60" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {isLoading ? (
              // Shimmer Skeleton Loading Rows
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="h-[48px]">
                  {columns.map((col, cIdx) => (
                    <td key={`sk-cell-${cIdx}`} className="px-4 py-3">
                      <div className="h-4 rounded bg-[var(--surface-subtle)] animate-shimmer" style={{ width: col.width || '65%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              // User-Friendly Error State
              <tr>
                <td colSpan={columns.length} className="py-12 px-6 text-center">
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--status-error-bg)] border border-[var(--status-error-border)] flex items-center justify-center mx-auto text-[var(--status-error-text)]">
                      <AlertCircle size={20} />
                    </div>
                    <div className="text-[14px] font-semibold text-[var(--text-primary)]">
                      Couldn't load transactions
                    </div>
                    <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                      {error || 'This might be a temporary connection issue. Check your network or gateway telemetry.'}
                    </p>
                    {onRetry && (
                      <Button variant="secondary" size="sm" onClick={onRetry} className="gap-1.5 mt-2">
                        <RefreshCw size={13} />
                        <span>Try again</span>
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              // Actionable Context-Rich Empty State
              <tr>
                <td colSpan={columns.length} className="py-14 px-6 text-center">
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="text-[15px] font-semibold text-[var(--text-primary)]">
                      {emptyTitle}
                    </div>
                    <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                      {emptyDescription}
                    </p>
                    {onEmptyAction && (
                      <Button variant="primary" size="sm" onClick={onEmptyAction} className="mt-2">
                        {emptyActionLabel}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              // Data Rows
              data.map((row, idx) => {
                const id = rowKey(row);
                const isNew = newRowIds?.has(id);

                return (
                  <tr
                    key={id}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={cn(
                      'text-[14px] text-[var(--text-primary)] transition-colors duration-fast',
                      onRowClick && 'cursor-pointer hover:bg-[var(--surface-secondary)]',
                      isNew && 'animate-[newRowFlash_1.2s_ease-out]'
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'px-4 py-3 align-middle',
                          col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                        )}
                      >
                        {col.render ? col.render(row, idx) : (row as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
