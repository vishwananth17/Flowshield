import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center font-sans font-semibold tracking-wider uppercase rounded-sm border transition-colors select-none',
  {
    variants: {
      variant: {
        allow: 'bg-[#CBF4C9] text-[#0E6245] border border-[#A3E7A0] font-bold',
        safe: 'bg-[#CBF4C9] text-[#0E6245] border border-[#A3E7A0] font-bold',
        review: 'bg-[#FFECD1] text-[#8A6100] border border-[#F9D08B] font-bold',
        block: 'bg-[#FFD8D8] text-[#A8071A] border border-[#F4A4A4] font-bold',
        fraud: 'bg-[#FFD8D8] text-[#A8071A] border border-[#F4A4A4] font-bold',
        info: 'bg-[#EEF2FF] text-[#635BFF] border border-[#C7D2FE] font-bold',
        neutral: 'bg-[#F1F5F9] text-[#4F566B] border border-[#E2E8F0] font-medium',
        secondary: 'bg-[#F1F5F9] text-[#4F566B] border border-[#E2E8F0] font-medium',
        new: 'bg-[#EEF2FF] text-[#635BFF] border border-[#C7D2FE] font-bold',
        live: 'bg-[#EEF2FF] text-[#635BFF] border border-[#C7D2FE] font-bold',
        default: 'bg-[#F1F5F9] text-[#4F566B] border border-[#E2E8F0] font-medium',
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
