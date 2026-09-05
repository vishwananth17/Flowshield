import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-sans font-semibold transition-all duration-fast select-none disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-100',
  {
    variants: {
      variant: {
        primary:
          'bg-cyan-500 text-surface-000 hover:bg-cyan-400 active:bg-cyan-600 hover:-translate-y-[1px] active:translate-y-0 shadow-sm',
        secondary:
          'bg-transparent border border-border-300 text-text-primary hover:bg-white/[0.04] hover:border-border-400 active:bg-white/[0.08]',
        ghost:
          'bg-transparent border-0 text-text-secondary hover:text-text-primary active:text-text-primary',
        destructive:
          'bg-status-block/15 border border-status-block/30 text-status-block hover:bg-status-block/25 active:bg-status-block/35',
        outline:
          'bg-transparent border border-border-300 text-text-primary hover:bg-white/[0.04] hover:border-border-400 active:bg-white/[0.08]',
        default:
          'bg-cyan-500 text-surface-000 hover:bg-cyan-400 active:bg-cyan-600 hover:-translate-y-[1px] active:translate-y-0 shadow-sm',
      },
      size: {
        xs: 'h-8 px-3 text-xs rounded-sm gap-1.5',
        sm: 'h-9 px-3.5 text-xs rounded gap-1.5',
        md: 'h-10 px-4.5 text-sm rounded gap-2',
        lg: 'h-12 px-6 text-base rounded-md gap-2.5',
        icon: 'h-9 w-9 p-0 rounded flex items-center justify-center',
        default: 'h-10 px-4.5 text-sm rounded gap-2',
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
  ({ className, variant, size, isLoading, asChild, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          buttonVariants({ variant, size }),
          isLoading && 'opacity-70 pointer-events-none cursor-wait',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
