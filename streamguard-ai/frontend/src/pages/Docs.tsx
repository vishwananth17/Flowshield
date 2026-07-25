import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Terminal, 
  Key, 
  Zap, 
  Code, 
  AlertCircle, 
  Webhook, 
  Globe, 
  Cpu, 
  Layers,
  Search,
  BookOpen,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  FileCode,
  CreditCard,
  CheckCircle2,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Heading1, Heading2, Heading3, Label, Caption, Mono } from '@/components/ui/Typography';
import { CodeBlock } from '../components/CodeBlock';
import { searchDocs, type DocEntry } from '../utils/docsSearch';
import { useReveal } from '../hooks/useReveal';
import { useActiveSection } from '../hooks/useActiveSection';

const SECTION_IDS = [
  'introduction',
  'merchant-guide',
  'quick-start',
  'authentication',
  'request-schema',
  'response-schema',
  'razorpay',
  'python',
  'webhooks',
  'error-codes',
  'rate-limits',
  'changelog'
];

interface AnimatedSectionProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

function AnimatedSection({ id, children, className = '' }: AnimatedSectionProps) {
  const [ref, visible] = useReveal(0.1);
  return (
    <motion.section
      id={id}
      ref={ref as any}
      initial={{ opacity: 0, y: 30 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`scroll-mt-32 space-y-8 ${className}`}
    >
      {children}
    </motion.section>
  );
}

export default function Docs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DocEntry[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const activeSection = useActiveSection(SECTION_IDS, 150);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchResults(searchDocs(searchQuery));
    }, 200);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('docs-search')?.focus();
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchResultClick = (anchor: string) => {
    setShowSearch(false);
    setSearchQuery('');
    setMobileMenuOpen(false);
    const element = document.querySelector(anchor);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navItems = [
    {
      category: 'Getting Started',
      items: [
        { id: 'introduction', label: 'Introduction' },
        { id: 'merchant-guide', label: 'Merchant Guide (Non-Technical)' },
        { id: 'quick-start', label: 'Quick Start (5 minutes)' },
      ]
    },
    {
      category: 'Authentication',
      items: [
        { id: 'authentication', label: 'API Keys & Auth' },
      ]
    },
    {
      category: 'Core API',
      items: [
        { id: 'request-schema', label: 'Request Schema' },
        { id: 'response-schema', label: 'Response Schema' },
      ]
    },
    {
      category: 'Integrations',
      items: [
        { id: 'razorpay', label: 'Razorpay' },
        { id: 'python', label: 'Python / Django' },
      ]
    },
    {
      category: 'Events & Reference',
      items: [
        { id: 'webhooks', label: 'Webhooks' },
        { id: 'error-codes', label: 'Error Codes' },
        { id: 'rate-limits', label: 'Rate Limits' },
        { id: 'changelog', label: 'Changelog' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-body select-text">
      
      {/* HEADER */}
      <nav className="h-16 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button className="md:hidden text-white mr-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="h-8 w-8 bg-[var(--color-primary-muted)] border border-[var(--color-primary-border)] rounded-[var(--radius-sm)] flex items-center justify-center">
            <Shield className="text-[var(--text-gold)] h-5 w-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">Flowshield AI Docs</span>
        </div>
        
        <div className="flex-1 max-w-md mx-8 relative hidden md:block" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            <Input 
              id="docs-search"
              type="text" 
              placeholder="Search docs... (⌘K)" 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearch(true);
              }}
              onFocus={() => setShowSearch(true)}
              className="w-full pl-10 h-10"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <AnimatePresence>
            {showSearch && searchQuery.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute top-12 left-0 right-0 bg-[var(--bg-overlay)] border border-[var(--border-default)] rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-xl)] z-50 max-h-96 overflow-y-auto"
              >
                {searchResults.length > 0 ? (
                  searchResults.map((res) => (
                    <div 
                      key={res.id} 
                      className="px-4 py-3 hover:bg-[var(--bg-highlight)] cursor-pointer border-b border-[var(--border-subtle)] last:border-0"
                      onClick={() => handleSearchResultClick(res.anchor)}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-gold)] px-2 py-0.5 rounded bg-[var(--color-primary-muted)] border border-[var(--color-primary-border)]">
                          {res.section}
                        </span>
                        <span className="font-semibold text-sm text-white">{res.title}</span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] truncate">{res.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-[var(--text-muted)]">No results found.</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center space-x-6 text-sm font-medium">
          <a href="/dashboard" className="hidden sm:block text-[var(--text-secondary)] hover:text-white transition-colors">Dashboard</a>
          <Button variant="gold" size="sm">
            Get API Key
          </Button>
        </div>
      </nav>

      <div className="flex max-w-[1500px] mx-auto min-h-[calc(100vh-64px)] relative">
        
        {/* LEFT SIDEBAR */}
        <aside className={`fixed md:sticky top-16 left-0 h-[calc(100vh-64px)] w-64 bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] py-8 px-4 overflow-y-auto z-40 transform transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="space-y-8 text-left">
            {navItems.map((group) => (
              <div key={group.category} className="space-y-2">
                <Label className="px-3 text-[10px] font-mono tracking-widest text-[var(--text-muted)] block">{group.category}</Label>
                <ul className="space-y-0.5 relative">
                  {group.items.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                      <li key={item.id} className="relative">
                        {isActive && (
                          <motion.div 
                            layoutId="sidebar-active"
                            className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--color-primary)] rounded-r"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                        <a 
                          href={`#${item.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setMobileMenuOpen(false);
                            document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`block px-3 py-2 text-sm rounded-[var(--radius-sm)] transition-colors ${
                            isActive 
                              ? 'text-[var(--text-gold)] font-semibold bg-[var(--color-primary-muted)] border-l-2 border-[var(--color-primary)]' 
                              : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)]'
                          }`}
                        >
                          {item.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 max-w-4xl px-6 md:px-12 py-12 lg:py-20 overflow-x-hidden text-left">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            
            {/* SECTION: INTRODUCTION */}
            <AnimatedSection id="introduction">
              <Heading1>Flowshield AI — Real-Time Fraud Detection API</Heading1>
              <Caption className="text-xl">Core Infrastructure Reference Manual</Caption>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    Flowshield AI provides an autonomous, sub-100ms fraud intelligence layer. 
                    We sit between your transaction sources and your processing layer to stop fraud before authorization,
                    saving you dispute fees and lost revenue.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[var(--bg-inset)] border border-[var(--border-default)] p-4 rounded-[var(--radius-lg)] text-center">
                    <p className="text-3xl font-bold text-white mb-1">{'< 100ms'}</p>
                    <Label className="text-[10px] text-[var(--text-muted)] font-bold">Latency</Label>
                  </div>
                  <div className="bg-[var(--bg-inset)] border border-[var(--border-default)] p-4 rounded-[var(--radius-lg)] text-center">
                    <p className="text-3xl font-bold text-white mb-1">3</p>
                    <Label className="text-[10px] text-[var(--text-muted)] font-bold">Models</Label>
                  </div>
                  <div className="bg-[var(--bg-inset)] border border-[var(--border-default)] p-4 rounded-[var(--radius-lg)] text-center">
                    <p className="text-3xl font-bold text-white mb-1">99.9%</p>
                    <Label className="text-[10px] text-[var(--text-muted)] font-bold">SLA</Label>
                  </div>
                  <div className="bg-[var(--bg-inset)] border border-[var(--border-default)] p-4 rounded-[var(--radius-lg)] text-center">
                    <p className="text-3xl font-bold text-white mb-1">5 mins</p>
                    <Label className="text-[10px] text-[var(--text-muted)] font-bold">Setup</Label>
                  </div>
                </div>
              </div>

              <Card variant="default" className="flex flex-col sm:flex-row items-center justify-between p-6">
                <div>
                  <h4 className="font-semibold text-white mb-1">Base URLs</h4>
                  <div className="text-sm font-mono text-[var(--text-secondary)]">
                    <div>Production: <span className="text-[var(--text-gold)]">https://api.flowshieldai.com/v1</span></div>
                    <div>Sandbox: <span className="text-emerald-500">https://sandbox.flowshieldai.com/v1</span></div>
                  </div>
                </div>
                <Badge variant="gold">
                  V1.0.0 — STABLE
                </Badge>
              </Card>
            </AnimatedSection>

            <hr className="my-16 border-[var(--border-subtle)]" />

            {/* SECTION: MERCHANT GUIDE (NON-TECHNICAL) */}
            <AnimatedSection id="merchant-guide">
              <Heading2 className="flex items-center gap-2">
                <BookOpen className="text-[var(--text-gold)] h-8 w-8" /> 
                Merchant Guide & General Overview
              </Heading2>
              <p className="text-[var(--text-secondary)] text-base leading-relaxed mb-6">
                Not a developer? No problem! This section explains how Flowshield AI protects your business, matches customer orders, and resolves disputes automatically without writing code.
              </p>

              {/* Simplified Visual Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card variant="default">
                  <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-primary-muted)] flex items-center justify-center text-[var(--text-gold)] mb-4 border border-[var(--color-primary-border)]">
                    <Zap className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-white mb-2">1. Real-time Protection</h4>
                  <Caption className="leading-relaxed block">
                    Our AI monitors payment checkouts. If a known scammer or card-tester attempts a checkout, Flowshield blocks it before they can cause damage.
                  </Caption>
                </Card>

                <Card variant="default">
                  <div className="w-10 h-10 rounded-[var(--radius-md)] bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4 border border-purple-500/20">
                    <Shield className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-white mb-2">2. Auto-Evidence Gathering</h4>
                  <Caption className="leading-relaxed block">
                    When a customer files a chargeback, Flowshield automatically matches their order against shipping records, tracking numbers, and delivery signatures.
                  </Caption>
                </Card>

                <Card variant="default">
                  <div className="w-10 h-10 rounded-[var(--radius-md)] bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 border border-emerald-500/20">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-white mb-2">3. One-Click Response</h4>
                  <Caption className="leading-relaxed block">
                    Flowshield compiles all gathered evidence into a PDF document containing the tracking receipt and customer chats. Click "Submit" to win back your money.
                  </Caption>
                </Card>
              </div>

              {/* Interactive Showcase Panel / Video Walkthrough Placeholder */}
              <div className="bg-gradient-navy border border-[var(--border-default)] rounded-[var(--radius-xl)] p-6 md:p-8 mb-8 relative overflow-hidden">
                <div className="max-w-xl space-y-4">
                  <Badge variant="gold">
                    Brief Platform Walkthrough
                  </Badge>
                  <Heading3 className="text-white">Watch Flowshield in Action</Heading3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    See how a real dispute is intercepted, evidence is pulled from Delhivery Express logs, and a defense package is automatically generated under 10 seconds.
                  </p>
                </div>

                {/* Styled Video Preview Placeholder */}
                <div className="mt-8 border border-[var(--border-default)] rounded-2xl overflow-hidden aspect-video bg-[#05060F] flex flex-col items-center justify-center relative group cursor-pointer">
                  <div className="w-16 h-16 rounded-full bg-[var(--color-primary-muted)] border border-[var(--color-primary-border)] flex items-center justify-center group-hover:bg-[var(--color-primary)] group-hover:text-black text-[var(--text-gold)] transition-all duration-300 shadow-xl group-hover:scale-105 z-10">
                    <ArrowRight className="h-6 w-6 fill-current ml-0.5" />
                  </div>
                  <span className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors mt-4 z-10 tracking-widest uppercase">
                    Launch Interactive Walkthrough Demo (1 Min Video)
                  </span>
                </div>
              </div>
            </AnimatedSection>

            <hr className="my-16 border-[var(--border-subtle)]" />

            {/* SECTION: QUICK START */}
            <AnimatedSection id="quick-start">
              <Heading2>Quick Start (5 minutes)</Heading2>
              
              <div className="space-y-12">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-[var(--text-inverse)] flex items-center justify-center font-bold">1</span>
                    <Heading3>Get your API key</Heading3>
                  </div>
                  <p className="text-[var(--text-secondary)] pl-11">
                    Sign up at <a href="#" className="text-[var(--text-gold)] hover:underline">app.flowshieldai.com</a> and copy your API key from the Dashboard → API Keys section.
                  </p>
                </div>

                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-[var(--text-inverse)] flex items-center justify-center font-bold">2</span>
                    <Heading3>Make your first request</Heading3>
                  </div>
                  <div className="pl-11">
                    <CodeBlock 
                      tabs={[
                        {
                          label: 'cURL',
                          language: 'bash',
                          code: `curl -X POST https://api.flowshieldai.com/v1/transactions/analyze \\
  -H "X-API-Key: fs_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "transaction_id": "tx_001",
    "amount": 4999.00,
    "currency": "INR",
    "merchant": {
      "id": "merch_swiggy_001",
      "name": "Swiggy",
      "category": "5812"
    },
    "card": {
      "last_four": "4242",
      "type": "visa",
      "issuing_country": "IN"
    },
    "customer": {
      "id": "cust_abc123",
      "ip": "103.21.244.10",
      "country": "IN",
      "city": "Bangalore"
    },
    "channel": "mobile"
  }'`
                        },
                        {
                          label: 'Python',
                          language: 'python',
                          code: `import requests
 
response = requests.post(
    "https://api.flowshieldai.com/v1/transactions/analyze",
    headers={
        "X-API-Key": "fs_live_your_key_here",
        "Content-Type": "application/json"
    },
    json={
        "transaction_id": "tx_001",
        "amount": 4999.00,
        "currency": "INR",
        "merchant": {
            "id": "merch_swiggy_001",
            "name": "Swiggy",
            "category": "5812"
        },
        "card": {
            "last_four": "4242",
            "type": "visa",
            "issuing_country": "IN"
        },
        "customer": {
            "id": "cust_abc123",
            "ip": "103.21.244.10",
            "country": "IN"
        },
        "channel": "mobile"
    }
)
result = response.json()
print(f"Risk Score: {result['risk_score']}")
print(f"Decision: {result['decision']}")`
                        }
                      ]}
                    />
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <hr className="my-16 border-[var(--border-subtle)]" />

            {/* SECTION: AUTHENTICATION */}
            <AnimatedSection id="authentication">
              <Heading2>Authentication</Heading2>
              <p className="text-[var(--text-secondary)] mb-8">Authenticate your requests by passing your API key in the request header.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card variant="default">
                  <h4 className="font-bold text-[var(--text-gold)] mb-2 flex items-center"><Key className="w-4 h-4 mr-2"/> Live Keys</h4>
                  <ul className="text-xs space-y-2 text-[var(--text-secondary)] font-mono">
                    <li>Prefix: <code className="text-white">fs_live_</code></li>
                    <li>Use for: Production transactions</li>
                  </ul>
                </Card>
                <Card variant="default">
                  <h4 className="font-bold text-[var(--text-gold)] mb-2 flex items-center"><Terminal className="w-4 h-4 mr-2"/> Test Keys</h4>
                  <ul className="text-xs space-y-2 text-[var(--text-secondary)] font-mono">
                    <li>Prefix: <code className="text-white">fs_test_</code></li>
                    <li>Use for: Sandbox dry runs</li>
                  </ul>
                </Card>
              </div>
            </AnimatedSection>
            
          </motion.div>
        </main>
        
        {/* RIGHT SIDEBAR (ON PAGE NAV) */}
        <aside className="hidden xl:block w-56 fixed top-24 right-8 h-[calc(100vh-6rem)] overflow-y-auto overflow-x-hidden text-left">
          <div className="space-y-4 border-l border-[var(--border-default)] pl-4">
            <Label className="text-[10px] tracking-widest text-[var(--text-muted)] mb-4 block">On this page</Label>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              {navItems.flatMap(group => group.items).map(item => (
                <li key={`toc-${item.id}`}>
                  <a 
                    href={`#${item.id}`} 
                    className={`hover:text-[var(--text-gold)] transition-colors block ${activeSection === item.id ? 'text-[var(--text-gold)] font-medium' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
