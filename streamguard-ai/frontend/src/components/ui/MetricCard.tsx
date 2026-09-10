import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCountUp } from '@/hooks/useMotion';

export interface MetricCardProps {
  label: string;
  value: string | number;
  rawValue?: number;
  trend?: number; // percentage, e.g. 14.2 or -3.1
  isInverseTrend?: boolean; // true if lower is better (e.g. fraud events, chargeback rate)
  subtext?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  rawValue,
  trend,
  isInverseTrend = false,
  subtext,
  className,
}) => {
  const animatedNumber = typeof rawValue === 'number' ? useCountUp(rawValue) : null;

  // Determine trend color
  const isPositive = trend !== undefined && trend > 0;
  const isNeutral = trend === undefined || trend === 0;

  // If isInverseTrend is true, up is bad (red), down is good (green)
  const isGoodTrend = isInverseTrend ? !isPositive : isPositive;

  const trendColor = isNeutral
    ? 'text-[var(--text-tertiary)]'
    : isGoodTrend
    ? 'text-[var(--risk-low-text)]'
    : 'text-[var(--risk-high-text)]';

  return (
    <div
      className={cn(
        'p-5 bg-[var(--surface-page)] border border-[var(--border-default)] rounded-[var(--radius-lg)] hover:border-[var(--border-strong)] transition-colors flex flex-col justify-between space-y-3',
        className
      )}
    >
      <div className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider select-none">
        {label}
      </div>

      <div className="text-[clamp(24px,4vw,36px)] font-bold text-[var(--text-primary)] leading-tight tabular-numbers tracking-tight">
        {animatedNumber !== null ? animatedNumber.toLocaleString('en-IN') : value}
      </div>

      <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-tertiary)]">
        {trend !== undefined && (
          <span className={cn('inline-flex items-center gap-0.5 font-semibold font-mono', trendColor)}>
            {trend > 0 && <ArrowUpRight size={14} />}
            {trend < 0 && <ArrowDownRight size={14} />}
            {trend === 0 && <Minus size={14} />}
            <span>{Math.abs(trend)}%</span>
          </span>
        )}
        <span>{subtext || 'vs last period'}</span>
      </div>
    </div>
  );
};
