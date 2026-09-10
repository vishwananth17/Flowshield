import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, ShieldCheck, Globe, Wifi, Smartphone, Clock, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RiskLevel } from './RiskBadge';

export interface SignalCardProps {
  severity: RiskLevel;
  signalName: string;
  description: string;
  impact: number; // positive raises risk (+24), negative lowers (-10)
  icon?: LucideIcon;
  className?: string;
}

export const SignalCard: React.FC<SignalCardProps> = ({
  severity,
  signalName,
  description,
  impact,
  icon: Icon = AlertTriangle,
  className,
}) => {
  const borderColors: Record<RiskLevel, string> = {
    low: 'border-l-[var(--risk-low-dot)]',
    medium: 'border-l-[var(--risk-medium-dot)]',
    high: 'border-l-[var(--risk-high-dot)]',
    critical: 'border-l-[var(--risk-critical-dot)]',
  };

  const iconColors: Record<RiskLevel, string> = {
    low: 'text-[var(--risk-low-dot)]',
    medium: 'text-[var(--risk-medium-dot)]',
    high: 'text-[var(--risk-high-dot)]',
    critical: 'text-[var(--risk-critical-dot)]',
  };

  const isPositiveImpact = impact > 0;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 bg-[var(--surface-page)] border border-[var(--border-default)] border-l-2 rounded-[var(--radius-md)] transition-colors',
        borderColors[severity],
        className
      )}
    >
      <div className={cn('p-1 rounded flex-shrink-0 mt-0.5', iconColors[severity])}>
        <Icon size={16} />
      </div>

      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
          {signalName}
        </div>
        <div className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
          {description}
        </div>
      </div>

      <div
        className={cn(
          'text-[12px] font-mono font-bold whitespace-nowrap pl-2 flex-shrink-0',
          isPositiveImpact ? 'text-[var(--risk-high-dot)]' : 'text-[var(--risk-low-dot)]'
        )}
      >
        {isPositiveImpact ? `+${impact}` : impact}
      </div>
    </div>
  );
};
