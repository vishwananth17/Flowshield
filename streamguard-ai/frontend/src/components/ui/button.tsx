import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-fast select-none cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--brand-500)] focus-visible:outline-offset-2 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--brand-500)] text-white border-0 hover:bg-[var(--brand-600)] active:bg-[var(--brand-700)] shadow-none',
        secondary:
          'bg-[var(--surface-page)] border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] hover:border-[var(--border-strong)] active:bg-[var(--surface-subtle)]',
        ghost:
          'bg-transparent border-0 text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] active:bg-[var(--surface-inset)]',
        danger:
          'bg-[var(--status-error-bg)] border border-[var(--status-error-border)] text-[var(--status-error-text)] hover:opacity-90 active:opacity-100',
        link:
          'bg-transparent border-0 text-[var(--text-link)] hover:underline p-0 h-auto font-normal active:scale-100',
      },
      size: {
        xs: 'h-[28px] px-[10px] text-[12px] rounded-[var(--radius-sm)] gap-1.5',
        sm: 'h-[34px] px-[14px] text-[13px] rounded-[var(--radius-sm)] gap-1.5',
        md: 'h-[38px] px-[16px] text-[14px] rounded-[var(--radius-md)] gap-2',
        lg: 'h-[44px] px-[20px] text-[15px] rounded-[var(--radius-md)] gap-2',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, asChild = false, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          buttonVariants({ variant, size }),
          isLoading && 'pointer-events-none cursor-wait relative',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="inline-block w-[14px] h-[14px] border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0 mr-1.5" />
            <span>{children}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
export { buttonVariants };
