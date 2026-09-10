import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, checked, onChange, ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <label htmlFor={inputId} className="inline-flex items-center gap-2 cursor-pointer select-none">
        <div className="relative flex items-center justify-center">
          <input
            id={inputId}
            type="checkbox"
            ref={ref}
            checked={checked}
            onChange={onChange}
            className="sr-only peer"
            {...props}
          />
          <div
            className={cn(
              'w-[16px] h-[16px] rounded-[var(--radius-xs)] border transition-colors duration-instant',
              'border-[var(--border-strong)] bg-[var(--surface-page)] peer-checked:bg-[var(--brand-500)] peer-checked:border-[var(--brand-500)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--border-focus)]',
              className
            )}
          />
          <Check
            size={11}
            strokeWidth={3}
            className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-instant pointer-events-none"
          />
        </div>
        {label && (
          <span className="text-[13px] font-normal text-[var(--text-secondary)]">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
