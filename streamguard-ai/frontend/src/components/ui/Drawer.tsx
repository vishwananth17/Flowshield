import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  width?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className,
  width = 'w-full sm:w-[480px]',
}) => {
  // Prevent body scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-200 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in Panel */}
      <div
        className={cn(
          'relative z-10 h-full bg-[var(--surface-elevated)] border-l border-[var(--border-default)] shadow-xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-slow ease-out-expo',
          width,
          className
        )}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between flex-shrink-0 bg-[var(--surface-page)]">
          <div className="min-w-0 flex-1">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors ml-2"
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {children}
        </div>

        {/* Optional Sticky Footer */}
        {footer && (
          <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--surface-secondary)] flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
