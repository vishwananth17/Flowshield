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
            'h-10 w-full rounded bg-white px-3.5 text-sm text-[#1A1F36] placeholder:text-[#697386] transition-all duration-fast focus:outline-none shadow-sm',
            'border border-[#E3E8EE] focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/20',
            error && 'border-status-block/60 focus:border-status-block focus:ring-status-block/15',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-300',
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
