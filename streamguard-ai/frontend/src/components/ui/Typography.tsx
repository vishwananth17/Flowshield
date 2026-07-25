import React from 'react';

export const Display = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h1 className={`
    font-[var(--font-display)] font-bold
    text-5xl leading-[1.1] tracking-[-0.03em]
    text-[var(--text-primary)]
    ${className}
  `}>{children}</h1>
)

export const Heading1 = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h1 className={`
    font-[var(--font-display)] font-bold
    text-4xl leading-tight tracking-[-0.025em]
    text-[var(--text-primary)]
    ${className}
  `}>{children}</h1>
)

export const Heading2 = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`
    font-[var(--font-display)] font-semibold
    text-3xl leading-tight tracking-[-0.02em]
    text-[var(--text-primary)]
    ${className}
  `}>{children}</h2>
)

export const Heading3 = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`
    font-[var(--font-display)] font-semibold
    text-xl leading-snug tracking-[-0.015em]
    text-[var(--text-primary)]
    ${className}
  `}>{children}</h3>
)

export const Label = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span className={`
    font-[var(--font-body)] font-semibold
    text-xs uppercase tracking-[0.12em]
    text-[var(--text-muted)]
    ${className}
  `}>{children}</span>
)

export const Body = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <p className={`
    font-[var(--font-body)] font-normal
    text-base leading-relaxed
    text-[var(--text-secondary)]
    ${className}
  `}>{children}</p>
)

export const Caption = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span className={`
    font-[var(--font-body)] font-normal
    text-xs leading-normal
    text-[var(--text-muted)]
    ${className}
  `}>{children}</span>
)

export const Mono = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <code className={`
    font-[var(--font-mono)] text-sm
    text-[var(--text-gold)]
    bg-[var(--color-primary-muted)]
    border border-[var(--color-primary-border)]
    rounded px-1.5 py-0.5
    ${className}
  `}>{children}</code>
)
