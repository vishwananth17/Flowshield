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
    sm: 'h-[22px] px-[8px] text-[11px] gap-[4px] rounded-[var(--radius-xs)]',
    md: 'h-[26px] px-[10px] text-[12px] gap-[5px] rounded-[var(--radius-xs)]',
    lg: 'h-[32px] px-[14px] text-[14px] gap-[6px] rounded-[var(--radius-sm)]',
  };

  const dotSizes = {
    sm: 'w-[5px] h-[5px]',
    md: 'w-[6px] h-[6px]',
    lg: 'w-[8px] h-[8px]',
  };

  const levelStyles: Record<RiskLevel, { bg: string; text: string; border: string; dot: string }> = {
    low: {
      bg: 'bg-[var(--risk-low-bg)]',
      text: 'text-[var(--risk-low-text)]',
      border: 'border-[var(--risk-low-border)]',
      dot: 'bg-[var(--risk-low-dot)]',
    },
    medium: {
      bg: 'bg-[var(--risk-medium-bg)]',
      text: 'text-[var(--risk-medium-text)]',
      border: 'border-[var(--risk-medium-border)]',
      dot: 'bg-[var(--risk-medium-dot)]',
    },
    high: {
      bg: 'bg-[var(--risk-high-bg)]',
      text: 'text-[var(--risk-high-text)]',
      border: 'border-[var(--risk-high-border)]',
      dot: 'bg-[var(--risk-high-dot)]',
    },
    critical: {
      bg: 'bg-[var(--risk-critical-bg)]',
      text: 'text-[var(--risk-critical-text)]',
      border: 'border-[var(--risk-critical-border)]',
      dot: 'bg-[var(--risk-critical-dot)]',
    },
  };

  const current = levelStyles[level] || levelStyles.low;

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium font-sans border select-none whitespace-nowrap leading-none',
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
