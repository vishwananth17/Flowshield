import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  iconSize?: number;
  theme?: 'dark' | 'light' | 'auto';
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 40, 
  iconSize = 24,
  theme = 'auto' 
}) => {
  // Determine background and border styles based on the active theme
  const bgClass = 
    theme === 'dark' 
      ? 'bg-black text-white border-slate-900' 
      : theme === 'light' 
        ? 'bg-white text-slate-900 border-slate-200' 
        : 'bg-white dark:bg-black text-slate-900 dark:text-white border-slate-200 dark:border-slate-900';

  return (
    <div 
      className={`rounded-xl border flex items-center justify-center shadow-inner transition-all duration-300 ${bgClass} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Left Shield Plate */}
        <path
          d="M185 38 L60 85 V195 C60 285 185 355 185 355 V38 Z"
          fill="currentColor"
        />
        {/* Right Shield Plate */}
        <path
          d="M215 38 L340 85 V195 C340 285 215 355 215 355 V38 Z"
          fill="currentColor"
          opacity="0.75"
        />
        {/* Interlocking Secure Center Ring / Lock */}
        <circle
          cx="200"
          cy="190"
          r="65"
          className="fill-white dark:fill-black transition-colors duration-300"
          stroke="currentColor"
          strokeWidth="24"
        />
        {/* Inner Lock Core / Shield Emblem */}
        <path
          d="M200 162 L228 178 V207 C228 223 200 234 200 234 C200 234 172 223 172 207 V178 L200 162 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
};

export default Logo;
