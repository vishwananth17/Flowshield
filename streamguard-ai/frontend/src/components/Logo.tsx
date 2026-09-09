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
  size = 36, 
  iconSize,
  theme = 'auto',
  withContainer = true
}) => {
  const actualIconSize = iconSize || Math.round(size * 0.72);
  
  // Theme styling for container
  const containerStyle = 
    theme === 'dark' 
      ? 'bg-[#080D15] border-slate-800 shadow-inner' 
      : theme === 'light' 
        ? 'bg-white border-slate-200 shadow-sm' 
        : 'bg-[#080D15] dark:bg-[#080D15] border-slate-800/90 dark:border-slate-800 shadow-inner';

  const isLight = theme === 'light';
  const logoSrc = isLight ? '/flowshield-symbol-dark.png' : '/flowshield-symbol.png';

  if (!withContainer) {
    return (
      <img
        src={logoSrc}
        alt="Flowshield AI"
        width={size}
        height={size}
        className={`object-contain select-none transition-all duration-300 ${className}`}
        style={{ width: size, height: size }}
        loading="eager"
      />
    );
  }

  return (
    <div 
      className={`rounded-xl border flex items-center justify-center transition-all duration-300 relative overflow-hidden group ${containerStyle} ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Subtle brand glow on hover */}
      <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <img
        src={logoSrc}
        alt="Flowshield AI Logo"
        width={actualIconSize}
        height={actualIconSize}
        className="object-contain select-none transform transition-transform duration-300 group-hover:scale-105"
        style={{ width: actualIconSize, height: actualIconSize }}
        loading="eager"
      />
    </div>
  );
};

export default Logo;
