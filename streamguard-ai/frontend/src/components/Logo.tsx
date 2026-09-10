import React, { useState } from 'react';
import symbolLight from '@/assets/flowshield-symbol.png';
import symbolDark from '@/assets/flowshield-symbol-dark.png';

interface LogoProps {
  className?: string;
  size?: number;
  iconSize?: number;
  theme?: 'dark' | 'light' | 'auto';
  withContainer?: boolean;
}

/**
 * Official FlowShield Company Emblem
 * Interlocking triquetra-shield geometric mark
 */
export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 32, 
  iconSize,
  theme = 'auto',
  withContainer = false
}) => {
  const actualIconSize = iconSize || (withContainer ? Math.round(size * 0.8) : size);
  
  const isLight = theme === 'light';
  const primarySrc = isLight ? symbolDark : symbolLight;
  const publicFallback = isLight ? '/flowshield-symbol-dark.png' : '/flowshield-symbol.png';
  
  const [currentSrc, setCurrentSrc] = useState(primarySrc);

  const handleImgError = () => {
    if (currentSrc !== publicFallback) {
      setCurrentSrc(publicFallback);
    } else if (currentSrc !== '/favicon.svg') {
      setCurrentSrc('/favicon.svg');
    }
  };

  if (!withContainer) {
    return (
      <img
        src={currentSrc}
        alt="FlowShield"
        width={size}
        height={size}
        onError={handleImgError}
        className={`object-contain select-none shrink-0 ${className}`}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
        loading="eager"
      />
    );
  }

  return (
    <div 
      className={`rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-secondary)] flex items-center justify-center shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={currentSrc}
        alt="FlowShield"
        width={actualIconSize}
        height={actualIconSize}
        onError={handleImgError}
        className="object-contain select-none"
        style={{ width: actualIconSize, height: actualIconSize }}
        loading="eager"
      />
    </div>
  );
};

export default Logo;
