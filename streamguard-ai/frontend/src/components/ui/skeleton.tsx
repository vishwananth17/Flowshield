import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded bg-surface-500/70 relative overflow-hidden',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.5s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/[0.04] after:to-transparent',
        className
      )}
      {...props}
    />
  );
};

export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => {
  return (
    <tr className="border-b border-border-100 animate-pulse">
      {Array.from({ length: columns }).map((_, idx) => (
        <td key={idx} className="px-4 py-4">
          <Skeleton
            className="h-4"
            style={{ width: `${Math.floor(55 + (idx * 17) % 40)}%` }}
          />
        </td>
      ))}
    </tr>
  );
};
