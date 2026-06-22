import React, { ReactNode, useEffect, useState } from 'react';
import { Shield, ArrowLeft, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';

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
        // Find entries that are intersecting
        const intersecting = entries.filter((e) => e.isIntersecting);
        if (intersecting.length > 0) {
          // If multiple are intersecting, choose the one closest to the top of the viewport
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
      const offset = 80; // offset for the sticky header
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
    <div className="min-h-screen bg-[#0A0E1A] text-[#9CA3AF] font-sans relative">
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
      <nav className="no-print h-[60px] border-b border-[#1F2937] bg-[#0A0E1A]/80 backdrop-blur-md fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-blue-600 p-1 rounded-md">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-white tracking-tight">Flowshield AI</span>
            </Link>
            <span className="text-[#1F2937] font-mono">/</span>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Legal</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-xs font-bold text-slate-400 hover:text-white uppercase transition-colors tracking-widest flex items-center space-x-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/10 flex items-center space-x-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="print-container max-w-7xl mx-auto px-4 md:px-8 pt-[100px] pb-24">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Table of Contents Sidebar */}
          <aside className="no-print lg:w-[240px] shrink-0 lg:sticky lg:top-[100px] h-fit self-start">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4 font-mono">Table of Contents</h4>
            <ul className="space-y-2.5 border-l border-[#1F2937]">
              {sections.map((s) => {
                const isActive = activeId === s.id;
                return (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      onClick={(e) => handleScroll(e, s.id)}
                      className={`block pl-4 -ml-[1px] text-xs leading-relaxed transition-all ${
                        isActive
                          ? 'border-l border-blue-500 text-blue-500 font-semibold'
                          : 'border-l border-transparent text-slate-400 hover:text-white'
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
          <main className="print-content flex-1 max-w-[760px] bg-[#111827] border border-[#1F2937] rounded-3xl p-6 md:p-10 shadow-xl shadow-black/20">
            {/* Hero Header */}
            <div className="mb-8">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="print-badge px-2.5 py-0.5 rounded-full text-[10px] uppercase font-mono tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Last Updated: {lastUpdated}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  Effective: {effectiveDate}
                </span>
              </div>
              <h1 className="print-title text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
                {title}
              </h1>
              <p className="print-subtitle text-slate-400 text-base leading-relaxed">
                {subtitle}
              </p>
              <div className="border-divider border-b border-[#1F2937] mt-8" />
            </div>

            {/* Document Content Sections */}
            <div className="space-y-10">
              {children}
            </div>

            {/* Document Footer */}
            <div className="border-divider border-t border-[#1F2937] mt-16 pt-10">
              <div className="bg-[#0A0E1A]/40 border border-[#1F2937]/50 rounded-2xl p-6 mb-8 text-center no-print">
                <p className="text-sm font-semibold text-white mb-2">Questions about this policy?</p>
                <p className="text-xs text-slate-400 mb-4">Our legal team is here to assist with any queries under the DPDP Act 2023 or standard practices.</p>
                <a
                  href="mailto:legal@flowshieldai.com"
                  className="inline-block text-xs font-mono bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-xl transition-all"
                >
                  Contact legal@flowshieldai.com
                </a>
              </div>
              
              <div className="no-print">
                <h5 className="text-white text-xs font-bold uppercase tracking-wider mb-4 font-mono">Other Legal Documents</h5>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
                  {legalLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.path}
                      className="text-blue-500 hover:underline hover:text-blue-400 transition-colors"
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
