import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  iconSize?: number;
  theme?: 'dark' | 'light' | 'auto';
  withContainer?: boolean;
}

/**
 * Official Flowshield AI Company Emblem
 * Authentic interlocking triquetra-shield geometric mark
 */
export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 32, 
  iconSize,
  theme = 'auto',
  withContainer = false
}) => {
  const actualIconSize = iconSize || (withContainer ? Math.round(size * 0.85) : size);
  
  const isLight = theme === 'light';
  const logoSrc = isLight ? '/flowshield-symbol-dark.png' : '/flowshield-symbol.png';

  if (!withContainer) {
    return (
      <img
        src={logoSrc}
        alt="Flowshield AI"
        width={size}
        height={size}
        className={`object-contain select-none transition-all duration-300 filter drop-shadow-[0_0_10px_rgba(34,211,238,0.35)] shrink-0 ${className}`}
        style={{ width: size, height: size }}
        loading="eager"
      />
    );
  }

  // Theme styling for container if explicitly requested
  const containerStyle = 
    theme === 'dark' 
      ? 'bg-[#080D15] border-slate-700/80 shadow-md' 
      : theme === 'light' 
        ? 'bg-white border-slate-200 shadow-sm' 
        : 'bg-[#080D15] dark:bg-[#080D15] border-slate-700/80 dark:border-slate-700/80 shadow-md';

  return (
    <div 
      className={`rounded-xl border flex items-center justify-center transition-all duration-300 relative overflow-hidden group shrink-0 ${containerStyle} ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <img
        src={logoSrc}
        alt="Flowshield AI Logo"
        width={actualIconSize}
        height={actualIconSize}
        className="object-contain select-none transform transition-transform duration-300 group-hover:scale-105 filter drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]"
        style={{ width: actualIconSize, height: actualIconSize }}
        loading="eager"
      />
    </div>
  );
};

export default Logo;
