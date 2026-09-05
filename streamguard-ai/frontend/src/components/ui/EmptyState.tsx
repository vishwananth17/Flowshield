import React from 'react';
import { Button } from './button';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto space-y-4">
      {icon ? (
        <div className="w-12 h-12 rounded-lg bg-surface-300 border border-border-200 flex items-center justify-center text-text-tertiary">
          {icon}
        </div>
      ) : (
        <svg
          className="w-12 h-12 text-text-tertiary/60"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      )}

      <div className="space-y-1.5">
        <h4 className="text-base font-semibold text-text-primary tracking-tight">
          {title}
        </h4>
        <p className="text-xs text-text-tertiary leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
