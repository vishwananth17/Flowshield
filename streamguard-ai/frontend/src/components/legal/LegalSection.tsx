import React, { ReactNode } from 'react';

interface LegalSectionProps {
  id: string;
  number: string;
  title: string;
  children: ReactNode;
}

export default function LegalSection({ id, number, title, children }: LegalSectionProps) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <h2 className="text-xl font-semibold text-white tracking-tight flex items-baseline gap-2">
        <span className="text-[var(--text-gold)] font-mono text-base font-bold shrink-0">{number}</span>
        <span>{title}</span>
      </h2>
      <div className="text-[var(--text-secondary)] text-[15px] leading-[1.8] space-y-4 font-normal">
        {children}
      </div>
      <div className="border-divider border-b border-[var(--border-subtle)] pt-8" />
    </section>
  );
}
