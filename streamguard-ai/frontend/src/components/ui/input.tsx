import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full flex flex-col">
        {label && (
          <label className="text-sm font-medium text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-3 py-2 text-sm text-white placeholder:text-[var(--text-muted)] focus:border-[var(--color-primary)] focus:outline-none transition-all duration-300 ease-out font-body",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
