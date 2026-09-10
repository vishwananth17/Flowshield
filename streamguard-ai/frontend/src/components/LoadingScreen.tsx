import React from 'react';

interface LoadingScreenProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  submessage?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  fullScreen = true,
  size = 'md',
  message = 'Loading telemetry...',
  submessage = 'Connecting to fraud evaluation stream',
}) => {
  const spinnerSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';

  const containerClass = fullScreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--surface-page)]'
    : 'relative w-full flex flex-col items-center justify-center py-12 px-4 bg-[var(--surface-page)]';

  return (
    <div className={containerClass} role="status" aria-label="Loading FlowShield">
      <div className="flex flex-col items-center text-center max-w-sm px-4">
        {/* Clean CSS Border Spinner */}
        <div
          className={`${spinnerSize} border-2 border-[var(--border-default)] border-t-[var(--brand-500)] rounded-full animate-spin`}
          style={{ animationDuration: '600ms' }}
        />

        {/* Message */}
        <h3 className="text-[14px] font-semibold text-[var(--text-primary)] tracking-tight mt-4">
          {message}
        </h3>

        {/* Submessage */}
        {submessage && (
          <p className="text-[12px] text-[var(--text-tertiary)] mt-1 font-mono">
            {submessage}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;
