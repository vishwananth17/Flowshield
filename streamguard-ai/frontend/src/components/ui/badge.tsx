import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center font-sans font-semibold tracking-wider uppercase rounded-sm border transition-colors select-none',
  {
    variants: {
      variant: {
        allow: 'bg-status-allow/10 text-status-allow border-status-allow/20',
        safe: 'bg-status-allow/10 text-status-allow border-status-allow/20',
        review: 'bg-status-review/10 text-status-review border-status-review/20',
        block: 'bg-status-block/10 text-status-block border-status-block/20',
        fraud: 'bg-status-block/10 text-status-block border-status-block/20',
        info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        neutral: 'bg-text-tertiary/10 text-text-secondary border-border-200',
        secondary: 'bg-text-tertiary/10 text-text-secondary border-border-200',
        new: 'bg-cyan-500/[0.08] text-cyan-300 border-cyan-300/15',
        live: 'bg-cyan-500/[0.08] text-cyan-300 border-cyan-300/15',
        default: 'bg-text-tertiary/10 text-text-secondary border-border-200',
      },
      size: {
        sm: 'h-5 px-2 text-[11px] gap-1.5',
        md: 'h-6 px-2.5 text-xs gap-1.5',
        default: 'h-5 px-2 text-[11px] gap-1.5',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'sm',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  pulsingDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant,
  size,
  pulsingDot,
  children,
  ...props
}) => {
  const isLive = variant === 'live' || pulsingDot;

  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {isLive && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-allow opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-status-allow" />
        </span>
      )}
      {children}
    </span>
  );
};
export { badgeVariants };
