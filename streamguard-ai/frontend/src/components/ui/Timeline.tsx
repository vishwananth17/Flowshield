import React from 'react';
import { cn } from '@/lib/utils';

export type TimelineEventType = 'normal' | 'risk' | 'critical';

export interface TimelineEvent {
  id: string | number;
  time: string;
  title: string;
  detail?: string;
  type?: TimelineEventType;
}

export interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ events, className }) => {
  return (
    <ol className={cn('relative space-y-4 pl-1', className)}>
      {events.map((event, i) => {
        const type = event.type || 'normal';
        const isLast = i === events.length - 1;

        return (
          <li key={event.id} className="relative flex items-start gap-3">
            {/* Connector Column */}
            <div className="relative flex flex-col items-center flex-shrink-0 mt-1">
              {/* Dot */}
              <div
                className={cn(
                  'w-[8px] h-[8px] rounded-full flex-shrink-0 z-10 transition-colors',
                  type === 'normal' &&
                    'bg-[var(--surface-page)] border-2 border-[var(--border-strong)]',
                  type === 'risk' &&
                    'bg-[var(--risk-high-dot)] border-0',
                  type === 'critical' &&
                    'bg-[var(--risk-critical-dot)] border-0 ring-3 ring-[var(--risk-critical-bg)]'
                )}
              />

              {/* Vertical Connecting Line */}
              {!isLast && (
                <div
                  className="w-[1px] bg-[var(--border-default)] absolute top-[10px] bottom-[-16px] left-[3.5px] -z-0"
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Content Column */}
            <div className="space-y-0.5 min-w-0 flex-1 pb-1">
              <div className="text-[11px] font-mono text-[var(--text-tertiary)]">
                {event.time}
              </div>
              <div className="text-[13px] font-medium text-[var(--text-primary)]">
                {event.title}
              </div>
              {event.detail && (
                <div className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                  {event.detail}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};
