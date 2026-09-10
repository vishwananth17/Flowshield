import React from 'react';
import { cn } from '@/lib/utils';

export interface LiveIndicatorProps {
  label?: string;
  className?: string;
}

export const LiveIndicator: React.FC<LiveIndicatorProps> = ({
  label = 'LIVE',
  className,
}) => {
  return (
    <div className={cn('inline-flex items-center gap-1.5 select-none', className)}>
      <span
        className="w-[6px] h-[6px] rounded-full bg-[#22C55E] animate-[pulseDot_2s_ease-in-out_infinite] flex-shrink-0"
        aria-hidden="true"
      />
      <span className="text-[11px] font-semibold text-[#22C55E] tracking-[0.08em] uppercase leading-none font-sans">
        {label}
      </span>
    </div>
  );
};
