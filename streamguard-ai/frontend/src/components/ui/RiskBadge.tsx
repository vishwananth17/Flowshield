import React from 'react';
import { cn } from '@/lib/utils';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  level: RiskLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  size = 'md',
  className,
  ...props
}) => {
  const sizeStyles = {
    sm: 'h-[20px] px-[7px] text-[10px] gap-[4px] rounded-[4px]',
    md: 'h-[24px] px-[9px] text-[11px] gap-[5px] rounded-[4px]',
    lg: 'h-[28px] px-[12px] text-[13px] gap-[6px] rounded-[6px]',
  };

  const dotSizes = {
    sm: 'w-[5px] h-[5px]',
    md: 'w-[6px] h-[6px]',
    lg: 'w-[7px] h-[7px]',
  };

  // Subtle, institutional Stripe Radar colors (low-contrast background, refined 1px border)
  const levelStyles: Record<RiskLevel, { bg: string; text: string; border: string; dot: string }> = {
    low: {
      bg: 'bg-emerald-500/[0.08] dark:bg-emerald-950/30',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-500/25 dark:border-emerald-500/30',
      dot: 'bg-emerald-500',
    },
    medium: {
      bg: 'bg-amber-500/[0.08] dark:bg-amber-950/30',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-500/25 dark:border-amber-500/30',
      dot: 'bg-amber-500',
    },
    high: {
      bg: 'bg-orange-500/[0.08] dark:bg-orange-950/30',
      text: 'text-orange-800 dark:text-orange-300',
      border: 'border-orange-500/25 dark:border-orange-500/30',
      dot: 'bg-orange-500',
    },
    critical: {
      bg: 'bg-rose-500/[0.08] dark:bg-rose-950/30',
      text: 'text-rose-800 dark:text-rose-300',
      border: 'border-rose-500/25 dark:border-rose-500/30',
      dot: 'bg-rose-500',
    },
  };

  const current = levelStyles[level] || levelStyles.low;

  return (
    <span
      className={cn(
        'inline-flex items-center font-sans font-medium border select-none whitespace-nowrap leading-none transition-colors',
        sizeStyles[size],
        current.bg,
        current.text,
        current.border,
        className
      )}
      {...props}
    >
      <span
        className={cn('rounded-full flex-shrink-0', dotSizes[size], current.dot)}
        aria-hidden="true"
      />
      <span className="uppercase tracking-wider font-semibold">
        {level}
      </span>
      {score !== undefined && (
        <span className="font-mono tabular-numbers font-medium opacity-90 pl-0.5">
          {score}
        </span>
      )}
    </span>
  );
};

export default RiskBadge;
