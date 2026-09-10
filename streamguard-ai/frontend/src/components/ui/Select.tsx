import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col space-y-1.5 text-left">
        {label && (
          <label htmlFor={selectId} className="text-[12px] font-medium text-[var(--text-secondary)] select-none">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'h-[38px] w-full appearance-none rounded-[var(--radius-md)] bg-[var(--surface-page)] px-3.5 pr-8 text-[14px] text-[var(--text-primary)] transition-colors duration-fast focus:outline-none',
              'border border-[var(--border-default)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-brand)]',
              error && 'border-[var(--status-error-border)]',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--surface-subtle)]',
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
          />
        </div>
        {error && (
          <span className="text-[11px] font-medium text-[var(--status-error-text)]">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
