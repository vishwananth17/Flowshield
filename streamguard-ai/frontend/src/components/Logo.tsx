import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  iconSize?: number;
  theme?: 'dark' | 'light' | 'auto';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 32, 
  iconSize = 16,
  showText = false
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Premium Fintech Geometric Block */}
      <div 
        className="flex items-center justify-center bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[#10B981] rounded-md transition-colors"
        style={{ width: size, height: size }}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" fillOpacity="0.15" />
        </svg>
      </div>

      {showText && (
        <span className="font-extrabold tracking-tight text-base text-white">
          Flowshield
        </span>
      )}
    </div>
  );
};

export default Logo;
