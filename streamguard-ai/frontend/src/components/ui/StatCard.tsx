import React from 'react';
import { Card } from './card';
import { useCountUp } from '@/hooks/useAnimation';
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  label: string;
  value: number | string;
  rawValue?: number;
  prefix?: string;
  suffix?: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  subtext?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  rawValue,
  prefix = '',
  suffix = '',
  trend,
  trendDirection = 'neutral',
  subtext,
  className,
}) => {
  const animatedNumber = typeof rawValue === 'number' ? useCountUp(rawValue) : null;

  return (
    <Card variant="data" padding="md" className={cn('flex flex-col justify-between space-y-3', className)}>
      <div className="flex items-center justify-between">
        <span className="type-label text-text-tertiary">
          {label}
        </span>
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-mono font-semibold px-1.5 py-0.5 rounded-sm border',
              trendDirection === 'up' && 'text-[#0E6245] bg-[#CBF4C9] border-[#A3E7A0]',
              trendDirection === 'down' && 'text-[#A8071A] bg-[#FFD8D8] border-[#F4A4A4]',
              trendDirection === 'neutral' && 'text-[#4F566B] bg-[#F1F5F9] border-[#E2E8F0]'
            )}
          >
            {trendDirection === 'up' && <ArrowUpRight className="w-3 h-3" />}
            {trendDirection === 'down' && <ArrowDownRight className="w-3 h-3" />}
            {trendDirection === 'neutral' && <ArrowRight className="w-3 h-3" />}
            {trend}
          </span>
        )}
      </div>

      <div>
        <div className="text-3xl lg:text-4xl font-bold font-sans tracking-tight text-text-primary">
          {prefix}
          {animatedNumber !== null ? animatedNumber.toLocaleString('en-IN') : value}
          {suffix}
        </div>
        {subtext && (
          <p className="text-xs text-text-tertiary mt-1.5 font-normal">
            {subtext}
          </p>
        )}
      </div>
    </Card>
  );
};
