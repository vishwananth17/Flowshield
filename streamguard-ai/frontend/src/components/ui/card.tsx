import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  'rounded-[var(--radius-lg)] transition-colors duration-fast relative',
  {
    variants: {
      variant: {
        data: 'bg-[var(--surface-page)] border border-[var(--border-default)] shadow-xs hover:border-[var(--border-strong)]',
        subtle: 'bg-[var(--surface-secondary)] border border-[var(--border-subtle)]',
        inset: 'bg-[var(--surface-inset)] border border-[var(--border-default)]',
        alert: 'bg-[var(--status-error-bg)] border border-[var(--status-error-border)]',
        glass: 'bg-[var(--surface-page)] border border-[var(--border-default)] shadow-xs',
        default: 'bg-[var(--surface-page)] border border-[var(--border-default)] shadow-xs',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-5',
        lg: 'p-6',
        default: 'p-5',
      },
    },
    defaultVariants: {
      variant: 'data',
      padding: 'md',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, padding }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 pb-4 border-b border-[var(--border-subtle)]', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-[16px] font-semibold tracking-tight text-[var(--text-primary)]', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-[13px] text-[var(--text-secondary)] leading-relaxed', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('pt-4', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center pt-4 border-t border-[var(--border-subtle)]', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';
export { cardVariants };
