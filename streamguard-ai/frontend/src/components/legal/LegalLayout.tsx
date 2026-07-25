import React, { ReactNode, useEffect, useState } from 'react';
import { Shield, ArrowLeft, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Heading1, Heading3, Label, Caption } from '@/components/ui/Typography';
import Logo from '@/components/Logo';

interface Section {
  id: string;
  title: string;
}

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  effectiveDate: string;
  sections: Section[];
  children: ReactNode;
}

export default function LegalLayout({
  title,
  subtitle,
  lastUpdated,
  effectiveDate,
  sections,
  children,
}: LegalLayoutProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (sections.length === 0) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries.filter((e) => e.isIntersecting);
        if (intersecting.length > 0) {
          const sorted = intersecting.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          setActiveId(sorted[0].target.id);
        }
      },
      {
        rootMargin: '-80px 0px -50% 0px',
        threshold: [0, 0.1, 0.2],
      }
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => {
      sections.forEach((s) => {
        const el = document.getElementById(s.id);
        if (el) observer.unobserve(el);
      });
    };
  }, [sections]);

  const handleScroll = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      setActiveId(id);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const legalLinks = [
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'Terms of Service', path: '/terms' },
    { name: 'Data Processing Agreement', path: '/dpa' },
    { name: 'Service Level Agreement', path: '/sla' },
    { name: 'Cookie Policy', path: '/cookies' },
    { name: 'Security Policy', path: '/security' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-secondary)] font-body relative text-left">
      {/* Dynamic Print Styles Injection */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body {
              background: white !important;
              color: black !important;
            }
            .no-print {
              display: none !important;
            }
            .print-container {
              padding: 0 !important;
              margin: 0 !important;
              background: white !important;
            }
            .print-content {
              background: transparent !important;
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              max-width: 100% !important;
              color: black !important;
            }
            .print-title {
              color: black !important;
              font-size: 28px !important;
            }
            .print-subtitle {
              color: #4b5563 !important;
            }
            .print-badge {
              border: 1px solid #000 !important;
              color: black !important;
              background: transparent !important;
            }
            h1, h2, h3, h4, h5, h6 {
              color: black !important;
              page-break-after: avoid;
            }
            p, span, li, td, th {
              color: #1f2937 !important;
            }
            a {
              color: black !important;
              text-decoration: underline !important;
            }
            .border-divider {
              border-color: #d1d5db !important;
            }
          }
        `
      }} />

      {/* Top Navbar */}
      <nav className="no-print h-[60px] border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link to="/" className="flex items-center space-x-2">
              <Logo size={28} iconSize={16} showText={true} />
            </Link>
            <span className="text-[var(--border-default)] font-mono">/</span>
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">Legal</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-xs font-bold text-[var(--text-muted)] hover:text-white uppercase transition-colors tracking-widest flex items-center space-x-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
            <Button
              onClick={handlePrint}
              variant="gold"
              size="sm"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              <span>Print Document</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="print-container max-w-7xl mx-auto px-4 md:px-8 pt-[100px] pb-24">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Table of Contents Sidebar */}
          <aside className="no-print lg:w-[240px] shrink-0 lg:sticky lg:top-[100px] h-fit self-start">
            <Label className="mb-4 block">Table of Contents</Label>
            <ul className="space-y-2.5 border-l border-[var(--border-default)]">
              {sections.map((s) => {
                const isActive = activeId === s.id;
                return (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      onClick={(e) => handleScroll(e, s.id)}
                      className={`block pl-4 -ml-[1px] text-xs leading-relaxed transition-all ${
                        isActive
                          ? 'border-l border-[var(--color-primary)] text-[var(--text-gold)] font-semibold'
                          : 'border-l border-transparent text-[var(--text-muted)] hover:text-white'
                      }`}
                    >
                      {s.title}
                    </a>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* Policy Document Content Area */}
          <main className="print-content flex-1 max-w-[760px] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-xl)] p-6 md:p-10 shadow-[var(--shadow-md)]">
            {/* Hero Header */}
            <div className="mb-8">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="print-badge px-2.5 py-0.5 rounded-full text-[10px] uppercase font-mono tracking-wider bg-[var(--color-primary-muted)] text-[var(--text-gold)] border border-[var(--color-primary-border)]">
                  Last Updated: {lastUpdated}
                </span>
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  Effective: {effectiveDate}
                </span>
              </div>
              <Heading1 className="print-title text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
                {title}
              </Heading1>
              <p className="print-subtitle text-[var(--text-secondary)] text-base leading-relaxed">
                {subtitle}
              </p>
              <div className="border-divider border-b border-[var(--border-subtle)] mt-8" />
            </div>

            {/* Document Content Sections */}
            <div className="space-y-10">
              {children}
            </div>

            {/* Document Footer */}
            <div className="border-divider border-t border-[var(--border-subtle)] mt-16 pt-10">
              <div className="bg-[var(--bg-inset)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-6 mb-8 text-center no-print">
                <p className="text-sm font-semibold text-white mb-2">Questions about this policy?</p>
                <p className="text-xs text-[var(--text-secondary)] mb-4">Our legal team is here to assist with any queries under the DPDP Act 2023 or standard practices.</p>
                <a
                  href="mailto:legal@flowshieldai.com"
                  className="inline-block text-xs font-mono bg-[var(--color-primary-muted)] hover:bg-[var(--bg-highlight)] text-[var(--text-gold)] border border-[var(--color-primary-border)] px-4 py-2 rounded-xl transition-all"
                >
                  Contact legal@flowshieldai.com
                </a>
              </div>
              
              <div className="no-print">
                <Label className="mb-4 block">Other Legal Documents</Label>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
                  {legalLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.path}
                      className="text-[var(--text-gold)] hover:underline hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

          </main>

        </div>
      </div>
    </div>
  );
}
