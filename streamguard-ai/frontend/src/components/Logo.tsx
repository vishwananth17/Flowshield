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
  iconSize = 18,
  theme = 'auto',
  showText = false
}) => {
  const isDark = theme === 'dark';
  const isLight = theme === 'light';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Stark Geometric Solid Block */}
      <div 
        className={`flex items-center justify-center font-bold text-sm tracking-tighter transition-all duration-200 ${
          isLight 
            ? 'bg-black text-white' 
            : isDark 
              ? 'bg-white text-black' 
              : 'bg-black text-white dark:bg-white dark:text-black'
        }`}
        style={{ width: size, height: size, borderRadius: '4px' }}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="square"
          strokeLinejoin="miter"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" />
        </svg>
      </div>

      {showText && (
        <span className="font-extrabold tracking-tight text-lg uppercase">
          Flowshield<span className="font-light text-zinc-400">.AI</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
