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
          'bg-[#635BFF] text-white hover:bg-[#4F46E5] active:bg-[#4338CA] hover:-translate-y-[0.5px] active:translate-y-0 shadow-sm font-medium',
        secondary:
          'bg-white border border-border-200 text-text-primary hover:bg-surface-300 hover:border-border-300 active:bg-surface-400 shadow-sm font-medium',
        ghost:
          'bg-transparent border-0 text-text-secondary hover:text-text-primary hover:bg-surface-300 font-medium',
        destructive:
          'bg-red-50 border border-red-200 text-status-block hover:bg-red-100 active:bg-red-200 font-medium',
        outline:
          'bg-white border border-border-200 text-text-primary hover:bg-surface-300 hover:border-border-300 shadow-sm font-medium',
        default:
          'bg-[#635BFF] text-white hover:bg-[#4F46E5] active:bg-[#4338CA] hover:-translate-y-[0.5px] active:translate-y-0 shadow-sm font-medium',
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
