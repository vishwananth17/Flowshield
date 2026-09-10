import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[12px] font-medium text-[var(--text-secondary)] select-none"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            'h-[38px] w-full rounded-[var(--radius-md)] bg-[var(--surface-page)] px-3.5 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-colors duration-fast focus:outline-none',
            'border border-[var(--border-default)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-brand)]',
            error && 'border-[var(--status-error-border)] focus:border-[var(--status-error-text)] focus:ring-2 focus:ring-[var(--status-error-border)]',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--surface-subtle)]',
            className
          )}
          {...props}
        />
        {error && (
          <span className="text-[11px] font-medium text-[var(--status-error-text)]">
            {error}
          </span>
        )}
        {!error && helperText && (
          <span className="text-[11px] text-[var(--text-tertiary)]">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
