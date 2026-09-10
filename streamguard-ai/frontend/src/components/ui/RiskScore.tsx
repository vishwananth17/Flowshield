import React, { useEffect, useState } from 'react';
import { RiskBadge, type RiskLevel } from './RiskBadge';
import { usePrefersReducedMotion } from '@/hooks/useMotion';
import { cn } from '@/lib/utils';

export interface RiskScoreProps {
  score: number; // 0 - 100
  className?: string;
}

export const RiskScore: React.FC<RiskScoreProps> = ({ score, className }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Determine risk level based on score thresholds
  const level: RiskLevel =
    score >= 85 ? 'critical' :
    score >= 70 ? 'high' :
    score >= 35 ? 'medium' :
    'low';

  // Determine score bar fill color
  const getScoreColor = (val: number): string => {
    if (val >= 85) return 'var(--risk-critical-dot)';
    if (val >= 70) return 'var(--risk-high-dot)';
    if (val >= 35) return 'var(--risk-medium-dot)';
    return 'var(--risk-low-dot)';
  };

  const currentColor = getScoreColor(score);

  useEffect(() => {
    if (prefersReducedMotion) {
      setAnimatedScore(score);
      return;
    }

    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);

    return () => clearTimeout(timer);
  }, [score, prefersReducedMotion]);

  return (
    <div className={cn('w-full space-y-3', className)}>
      {/* Header with 56px bold score and RiskBadge */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-[56px] font-extrabold leading-none tracking-tight font-sans text-[var(--text-primary)] tabular-numbers">
            {animatedScore}
          </span>
          <span className="text-[13px] font-medium text-[var(--text-tertiary)]">
            / 100
          </span>
        </div>
        <RiskBadge level={level} size="lg" />
      </div>

      {/* Progress Bar with Indicator */}
      <div className="relative pt-1 pb-1">
        {/* Track */}
        <div className="h-[6px] w-full rounded-[3px] bg-[var(--surface-subtle)] border border-[var(--border-subtle)] overflow-hidden relative">
          {/* Fill */}
          <div
            className="h-full rounded-[3px]"
            style={{
              width: `${animatedScore}%`,
              backgroundColor: currentColor,
              transition: 'width 800ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </div>

        {/* Precise circle indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -ml-[6px] w-[12px] h-[12px] rounded-full bg-white border-2 shadow-xs pointer-events-none"
          style={{
            left: `${animatedScore}%`,
            borderColor: currentColor,
            transition: 'left 800ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>

      {/* Scale labels */}
      <div className="flex items-center justify-between text-[11px] font-medium text-[var(--text-tertiary)] select-none">
        <span>0 — Safe</span>
        <span>50 — Moderate</span>
        <span>100 — Critical</span>
      </div>
    </div>
  );
};
