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
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform="translate(50, 50)">
          {/* 4-fold rotationally symmetric interlocking shield loops */}
          {[0, 90, 180, 270].map((angle) => (
            <path
              key={angle}
              transform={`rotate(${angle})`}
              d="M 0,-40 C -18,-40 -34,-26 -34,-8 C -34,10 -12,18 0,0 C 12,-18 20,-22 14,-32 C 10,-40 5,-40 0,-40"
              stroke="currentColor"
              strokeWidth="5.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {/* Core central vortex circle */}
          <circle cx="0" cy="0" r="7" fill="none" stroke="currentColor" strokeWidth="4" />
        </g>
      </svg>
    </div>
  );
};

export default Logo;
