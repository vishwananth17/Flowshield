import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[13px] font-medium text-text-secondary select-none"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            'h-10 w-full rounded bg-surface-200 px-3.5 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-fast focus:outline-none',
            'border border-border-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15',
            error && 'border-status-block/60 focus:border-status-block focus:ring-status-block/15',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        />
        {error && (
          <span className="text-xs text-status-block animate-in fade-in duration-fast">
            {error}
          </span>
        )}
        {!error && helperText && (
          <span className="text-xs text-text-tertiary">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
