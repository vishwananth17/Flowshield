import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
  X,
  Play,
  RotateCcw,
  Check,
  Sparkles,
  AlertTriangle,
  Ban,
  Package,
  FileText,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CodeBlock } from '../components/CodeBlock';
import { searchDocs, type DocEntry } from '../utils/docsSearch';
import { useReveal } from '../hooks/useReveal';
import { useActiveSection } from '../hooks/useActiveSection';

const SECTION_IDS = [
  'introduction',
  'interactive-simulator',
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
  const [ref, visible] = useReveal(0.08);
  return (
    <motion.section
      id={id}
      ref={ref as any}
      initial={{ opacity: 0, y: 24 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`scroll-mt-28 space-y-6 ${className}`}
    >
      {children}
    </motion.section>
  );
}

// =========================================================================
// INTERACTIVE ANIMATED ARCHITECTURE FLOW SIMULATOR
// =========================================================================
function ArchitectureFlowSimulator() {
  const [scenario, setScenario] = useState<'fraud' | 'legit' | 'suspicious'>('fraud');
  const [step, setStep] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState(false);

  const scenarios = {
    fraud: {
      title: 'Bot Card-Testing Attack',
      description: 'Rapid sequential attempts using automated headless browser & proxy IPs.',
      amount: '₹92,000',
      gateway: 'Razorpay Checkout',
      ip: '185.220.101.5 (Tor Exit Node)',
      device: 'Headless Chrome / Linux',
      velocity: '18 requests / 60s',
      riskScore: 0.94,
      decision: 'BLOCK',
      decisionColor: 'text-red-400',
      decisionBg: 'bg-red-500/10 border-red-500/30 text-red-400',
      actionNote: 'Zero merchant liability. Gateway payment capture blocked before bank settlement.',
      latency: '41ms'
    },
    legit: {
      title: 'Genuine Shopper (Domestic UPI)',
      description: 'Trusted recurring customer paying via phone on domestic mobile network.',
      amount: '₹890',
      gateway: 'UPI Collect / PhonePe',
      ip: '103.21.244.10 (Airtel Broadband, BLR)',
      device: 'iPhone 15 Pro / Safari',
      velocity: '1 request / 24h',
      riskScore: 0.03,
      decision: 'ALLOW',
      decisionColor: 'text-emerald-400',
      decisionBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      actionNote: 'Immediate seamless authorization. Frictionless zero-delay checkout for honest users.',
      latency: '38ms'
    },
    suspicious: {
      title: 'High-Value Anomaly',
      description: 'First-time customer ordering 5x historical average with foreign credit card.',
      amount: '₹28,500',
      gateway: 'Visa / Mastercard',
      ip: '45.12.89.20 (UK IP / Indian Card)',
      device: 'MacBook Pro / Chrome',
      velocity: '3 requests / 5m',
      riskScore: 0.62,
      decision: 'CHALLENGE — 3DS',
      decisionColor: 'text-amber-400',
      decisionBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      actionNote: 'Automated step-up dispatched: Routes to bank OTP SMS to protect chargeback rights.',
      latency: '44ms'
    }
  };

  const activeData = scenarios[scenario];

  const runSimulation = (targetScenario?: 'fraud' | 'legit' | 'suspicious') => {
    const nextScenario = targetScenario || scenario;
    if (targetScenario) setScenario(targetScenario);
    setIsSimulating(true);
    setStep(1);

    setTimeout(() => setStep(2), 600);
    setTimeout(() => setStep(3), 1300);
    setTimeout(() => {
      setStep(4);
      setIsSimulating(false);
    }, 2000);
  };

  useEffect(() => {
    runSimulation('fraud');
  }, []);

  return (
    <div className="bg-[#080C16] border border-border-200 rounded-2xl p-5 md:p-7 shadow-2xl overflow-hidden relative">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Simulator Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
              Live Animated Pipeline
            </span>
            <span className="text-xs text-text-tertiary">Real-time execution</span>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-text-primary mt-1">
            How Flowshield Evaluates Transactions in &lt; 43ms
          </h3>
        </div>

        {/* Scenario Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => runSimulation('fraud')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              scenario === 'fraud'
                ? 'bg-red-500/20 border-red-500/40 text-red-400 shadow-sm'
                : 'bg-surface-200 border-border-100 text-text-secondary hover:text-text-primary'
            }`}
          >
            Bot Attack
          </button>
          <button
            onClick={() => runSimulation('legit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              scenario === 'legit'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-sm'
                : 'bg-surface-200 border-border-100 text-text-secondary hover:text-text-primary'
            }`}
          >
            Normal Shopper
          </button>
          <button
            onClick={() => runSimulation('suspicious')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              scenario === 'suspicious'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-sm'
                : 'bg-surface-200 border-border-100 text-text-secondary hover:text-text-primary'
            }`}
          >
            Suspicious Anomaly
          </button>
          <button
            onClick={() => runSimulation()}
            disabled={isSimulating}
            className="p-1.5 rounded-lg bg-surface-200 hover:bg-surface-300 border border-border-100 text-text-secondary hover:text-text-primary transition-all"
            title="Re-run simulation"
          >
            <RotateCcw className={`w-4 h-4 ${isSimulating ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Pipeline 4-Stage Node Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 my-6 relative">
        
        {/* Stage 1: Ingestion */}
        <div className={`p-4 rounded-xl border transition-all duration-300 ${
          step >= 1 
            ? 'bg-surface-200/80 border-cyan-500/40 shadow-sm' 
            : 'bg-surface-100/40 border-border-100 opacity-60'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-cyan-400">STAGE 01</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-300 text-text-tertiary">0ms</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-text-primary">Payment Ingestion</h4>
          </div>
          <div className="space-y-1 text-[11px] text-text-secondary">
            <p className="truncate"><span className="text-text-tertiary">Source:</span> {activeData.gateway}</p>
            <p><span className="text-text-tertiary">Amount:</span> <span className="font-semibold text-text-primary">{activeData.amount}</span></p>
          </div>
        </div>

        {/* Stage 2: Telemetry Check */}
        <div className={`p-4 rounded-xl border transition-all duration-300 ${
          step >= 2 
            ? 'bg-surface-200/80 border-cyan-500/40 shadow-sm' 
            : 'bg-surface-100/40 border-border-100 opacity-60'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-cyan-400">STAGE 02</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-300 text-text-tertiary">+14ms</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-text-primary">Telemetry Extraction</h4>
          </div>
          <div className="space-y-1 text-[11px] text-text-secondary">
            <p className="truncate"><span className="text-text-tertiary">IP:</span> {activeData.ip}</p>
            <p><span className="text-text-tertiary">Velocity:</span> {activeData.velocity}</p>
          </div>
        </div>

        {/* Stage 3: ML Ensemble */}
        <div className={`p-4 rounded-xl border transition-all duration-300 ${
          step >= 3 
            ? 'bg-surface-200/80 border-cyan-500/40 shadow-sm' 
            : 'bg-surface-100/40 border-border-100 opacity-60'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-cyan-400">STAGE 03</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-300 text-text-tertiary">+18ms</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-text-primary">ML Ensemble Scan</h4>
          </div>
          <div className="space-y-1 text-[11px] text-text-secondary">
            <p><span className="text-text-tertiary">Models:</span> XGBoost + iForest</p>
            <p><span className="text-text-tertiary">Explainability:</span> SHAP Vectors</p>
          </div>
        </div>

        {/* Stage 4: Autonomous Decision */}
        <div className={`p-4 rounded-xl border transition-all duration-300 ${
          step >= 4 
            ? 'bg-surface-200/90 border-cyan-500/50 shadow-md' 
            : 'bg-surface-100/40 border-border-100 opacity-60'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-cyan-400">STAGE 04</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-semibold">{activeData.latency}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-text-primary">Instant Decision</h4>
          </div>
          <div>
            <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded border uppercase ${activeData.decisionBg}`}>
              {step >= 4 ? activeData.decision : 'EVALUATING...'}
            </span>
          </div>
        </div>

      </div>

      {/* Stage Result Live Banner */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${scenario}-${step}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="p-4 rounded-xl bg-surface-100 border border-border-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-tertiary">Scenario:</span>
              <span className="text-xs font-bold text-text-primary">{activeData.title}</span>
              <span className="text-[11px] text-text-tertiary">— {activeData.description}</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              {activeData.actionNote}
            </p>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <div className="text-right">
              <span className="text-[10px] text-text-tertiary uppercase block">Calculated Score</span>
              <span className={`text-base font-bold font-mono ${activeData.decisionColor}`}>
                {step >= 4 ? `${Math.round(activeData.riskScore * 100)} / 100` : '...'}
              </span>
            </div>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => runSimulation()}
              className="gap-1.5"
            >
              <Play className="w-3 h-3 text-cyan-400" />
              <span>Replay</span>
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// =========================================================================
// MAIN DOCS COMPONENT
// =========================================================================
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
        setShowSearch(true);
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
      category: 'Overview & Visual Flow',
      items: [
        { id: 'introduction', label: 'Introduction' },
        { id: 'interactive-simulator', label: 'Architecture & Pipeline' },
        { id: 'merchant-guide', label: 'Merchant Guide (Non-Technical)' },
        { id: 'quick-start', label: 'Quick Start (5 min)' },
      ]
    },
    {
      category: 'Authentication',
      items: [
        { id: 'authentication', label: 'API Keys & Auth' },
      ]
    },
    {
      category: 'Core API Specification',
      items: [
        { id: 'request-schema', label: 'Request Schema' },
        { id: 'response-schema', label: 'Response Schema & Score' },
      ]
    },
    {
      category: 'Framework Integrations',
      items: [
        { id: 'razorpay', label: 'Razorpay Integration' },
        { id: 'python', label: 'Python & Django' },
      ]
    },
    {
      category: 'Events & System Limits',
      items: [
        { id: 'webhooks', label: 'Webhooks & Events' },
        { id: 'error-codes', label: 'Error Codes' },
        { id: 'rate-limits', label: 'Rate Limits' },
        { id: 'changelog', label: 'Changelog' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#070B14] text-text-primary font-sans selection:bg-cyan-500/30">
      
      {/* HEADER NAVBAR */}
      <nav className="h-16 border-b border-border-200 bg-[#070B14]/90 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button 
            className="md:hidden text-text-secondary hover:text-white mr-2" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Docs Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="h-8 w-8 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center justify-center text-cyan-400">
              <Shield className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-white tracking-tight">Flowshield AI</span>
              <span className="text-xs text-text-tertiary">/</span>
              <span className="text-xs font-semibold text-cyan-400">Docs</span>
            </div>
          </Link>
        </div>
        
        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-8 relative hidden md:block" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <Input 
              id="docs-search"
              type="text" 
              placeholder="Search documentation... (⌘K)" 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearch(true);
              }}
              onFocus={() => setShowSearch(true)}
              className="w-full h-9 pl-9 pr-8 bg-surface-100 border-border-200 focus-visible:border-cyan-500 rounded-lg text-xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          <AnimatePresence>
            {showSearch && searchQuery.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute top-11 left-0 right-0 bg-[#0A0F1D] border border-border-200 rounded-xl overflow-hidden shadow-2xl z-50 max-h-96 overflow-y-auto"
              >
                {searchResults.length > 0 ? (
                  searchResults.map((res) => (
                    <div 
                      key={res.id} 
                      className="px-4 py-3 hover:bg-surface-200/80 cursor-pointer border-b border-border-100/60 last:border-0 transition-colors"
                      onClick={() => handleSearchResultClick(res.anchor)}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10">
                          {res.section}
                        </span>
                        <span className="font-medium text-xs text-text-primary">{res.title}</span>
                      </div>
                      <p className="text-xs text-text-tertiary truncate">{res.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-text-tertiary">No matching documentation found.</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right CTA Links */}
        <div className="flex items-center space-x-3 text-xs font-medium">
          <Link to="/" className="hidden sm:inline-block text-text-secondary hover:text-white transition-colors">
            Home
          </Link>
          <Link to="/dashboard" className="hidden sm:inline-block text-text-secondary hover:text-white transition-colors">
            Dashboard
          </Link>
          <Button variant="primary" size="sm" asChild>
            <Link to="/register" className="gap-1">
              <span>Get API Key</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </nav>

      {/* BODY LAYOUT */}
      <div className="flex max-w-[1500px] mx-auto min-h-[calc(100vh-64px)]">
        
        {/* LEFT SIDEBAR NAVIGATION */}
        <aside className={`fixed md:sticky top-16 left-0 h-[calc(100vh-64px)] w-64 bg-[#070B14] border-r border-border-200 py-8 px-4 overflow-y-auto z-40 transform transition-transform duration-200 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="space-y-6">
            {navItems.map((group) => (
              <div key={group.category} className="space-y-1.5">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary px-3">{group.category}</h4>
                <ul className="space-y-0.5 relative">
                  {group.items.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                      <li key={item.id} className="relative">
                        {isActive && (
                          <motion.div 
                            layoutId="sidebar-active-indicator"
                            className="absolute left-0 top-0 bottom-0 w-0.5 bg-cyan-400 rounded-r"
                            transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                          />
                        )}
                        <a 
                          href={`#${item.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setMobileMenuOpen(false);
                            document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`block px-3 py-1.5 text-xs rounded-md transition-colors ${
                            isActive 
                              ? 'text-cyan-400 font-semibold bg-cyan-500/10' 
                              : 'text-text-secondary hover:text-white hover:bg-surface-200/50'
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

        {/* MAIN ARTICLE CONTENT */}
        <main className="flex-1 max-w-4xl px-5 sm:px-10 py-10 lg:py-16 overflow-x-hidden">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            
            {/* SECTION 1: INTRODUCTION */}
            <AnimatedSection id="introduction">
              <div className="space-y-3">
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                  Flowshield AI Documentation
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
                  Real-Time Fraud Detection & Dispute Autopilot API
                </h1>
                <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
                  Sub-100ms autonomous fraud defense engine for modern commerce. Intercept card testing, velocity fraud, and automated chargebacks before gateway capture.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-surface-100 border border-border-200 p-3.5 rounded-xl text-center">
                  <p className="text-2xl font-bold text-white mb-0.5">&lt; 43ms</p>
                  <p className="text-text-tertiary text-[11px] font-medium uppercase">Average Latency</p>
                </div>
                <div className="bg-surface-100 border border-border-200 p-3.5 rounded-xl text-center">
                  <p className="text-2xl font-bold text-cyan-400 mb-0.5">3 Models</p>
                  <p className="text-text-tertiary text-[11px] font-medium uppercase">ML Ensemble</p>
                </div>
                <div className="bg-surface-100 border border-border-200 p-3.5 rounded-xl text-center">
                  <p className="text-2xl font-bold text-emerald-400 mb-0.5">99.9%</p>
                  <p className="text-text-tertiary text-[11px] font-medium uppercase">SLA Uptime</p>
                </div>
                <div className="bg-surface-100 border border-border-200 p-3.5 rounded-xl text-center">
                  <p className="text-2xl font-bold text-white mb-0.5">2 Mins</p>
                  <p className="text-text-tertiary text-[11px] font-medium uppercase">Webhook Setup</p>
                </div>
              </div>

              <div className="bg-surface-100 border border-border-200 p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-text-tertiary">Official Endpoints</h4>
                  <div className="text-xs space-y-1">
                    <div><span className="text-text-tertiary">Production:</span> <code className="text-cyan-400 ml-2 font-mono">https://api.flowshieldai.com/v1</code></div>
                    <div><span className="text-text-tertiary">Sandbox:</span> <code className="text-emerald-400 ml-5 font-mono">https://sandbox.flowshieldai.com/v1</code></div>
                  </div>
                </div>
                <div className="self-start sm:self-center px-2.5 py-1 bg-cyan-500/10 text-cyan-400 rounded-md text-xs font-semibold border border-cyan-500/20">
                  v1.0.0 Stable
                </div>
              </div>
            </AnimatedSection>

            <hr className="my-12 border-border-200" />

            {/* SECTION 2: INTERACTIVE PIPELINE SIMULATOR */}
            <AnimatedSection id="interactive-simulator">
              <ArchitectureFlowSimulator />
            </AnimatedSection>

            <hr className="my-12 border-border-200" />

            {/* SECTION 3: MERCHANT GUIDE (NON-TECHNICAL) */}
            <AnimatedSection id="merchant-guide">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="text-cyan-400 h-5 w-5" />
                  <h2 className="text-2xl font-bold text-white">Merchant Guide & General Overview</h2>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Not a developer? Flowshield AI operates out-of-the-box through direct payment gateway webhooks. Here is how our automated system shields your store without writing custom code.
                </p>
              </div>

              {/* 3 Step Merchant Flow Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface-100 border border-border-200 p-5 rounded-xl space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                    <Zap className="h-4 w-4" />
                  </div>
                  <h4 className="font-semibold text-sm text-white">1. Real-Time Interception</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    When an order is created, our engine scans card velocity and IP proxies. Known fraudsters are stopped before gateway capture charges apply.
                  </p>
                </div>

                <div className="bg-surface-100 border border-border-200 p-5 rounded-xl space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                    <Package className="h-4 w-4" />
                  </div>
                  <h4 className="font-semibold text-sm text-white">2. Courier Delivery Sync</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    We connect to Delhivery, Shiprocket, or BlueDart. When orders ship, GPS coordinates, recipient signatures, and tracking receipts are captured automatically.
                  </p>
                </div>

                <div className="bg-surface-100 border border-border-200 p-5 rounded-xl space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                    <FileText className="h-4 w-4" />
                  </div>
                  <h4 className="font-semibold text-sm text-white">3. Auto-Dispute Win</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    If a customer claims "Product Not Received", Flowshield compiles the tracking proof and customer IP history into a legal bank PDF dossier in under 10 seconds.
                  </p>
                </div>
              </div>

              {/* 3-Step Setup Checklist */}
              <div className="bg-surface-100 border border-border-200 p-5 rounded-xl space-y-3">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-text-tertiary">Getting Started Checklist</h4>
                
                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                    <div>
                      <span className="font-semibold text-white block">Connect your Payment Gateway</span>
                      <span className="text-text-secondary">Navigate to Dashboard → Integrations, choose Razorpay or Cashfree, and paste your webhook secret.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                    <div>
                      <span className="font-semibold text-white block">Connect Shipping Provider</span>
                      <span className="text-text-secondary">Link your Shiprocket or Delhivery token so delivery proofs and signatures are indexed automatically.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                    <div>
                      <span className="font-semibold text-white block">Calibrate Risk Thresholds</span>
                      <span className="text-text-secondary">Under Settings → Rules, define your auto-block limit (e.g. Block transactions scoring &gt; 72).</span>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <hr className="my-12 border-border-200" />

            {/* SECTION 4: QUICK START */}
            <AnimatedSection id="quick-start">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Quick Start (5 minutes)</h2>
                <p className="text-sm text-text-secondary">
                  Evaluate transactions from any backend framework using our simple REST endpoint.
                </p>
              </div>
              
              <div className="space-y-8">
                <div>
                  <div className="flex items-center space-x-2.5 mb-2">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center text-xs font-bold">1</span>
                    <h3 className="text-base font-semibold text-white">Get your API key</h3>
                  </div>
                  <p className="text-xs text-text-secondary pl-8">
                    Create an account at <Link to="/register" className="text-cyan-400 hover:underline">Flowshield AI</Link> and copy your API key from Dashboard → API Keys.
                  </p>
                </div>

                <div>
                  <div className="flex items-center space-x-2.5 mb-2">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center text-xs font-bold">2</span>
                    <h3 className="text-base font-semibold text-white">Dispatch an analysis payload</h3>
                  </div>
                  <div className="pl-8">
                    <CodeBlock 
                      tabs={[
                        {
                          label: 'cURL',
                          language: 'bash',
                          code: `curl -X POST https://api.flowshieldai.com/v1/transactions/analyze \\
  -H "X-API-Key: fs_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "transaction_id": "tx_998124",
    "amount": 4999.00,
    "currency": "INR",
    "merchant": {
      "id": "merch_001",
      "name": "Urbanic Fashion",
      "category": "5691"
    },
    "card": {
      "last_four": "4242",
      "type": "visa",
      "issuing_country": "IN"
    },
    "customer": {
      "id": "cust_blr_91",
      "ip": "103.21.244.10",
      "country": "IN",
      "city": "Bangalore"
    },
    "channel": "web"
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
        "transaction_id": "tx_998124",
        "amount": 4999.00,
        "currency": "INR",
        "merchant": {"name": "Urbanic Fashion"},
        "card": {"last_four": "4242", "type": "visa"},
        "customer": {"id": "cust_blr_91", "ip": "103.21.244.10"},
        "channel": "web"
    }
)
result = response.json()
print("Risk Score:", result["risk_score"])
print("Decision:", result["decision"])`
                        },
                        {
                          label: 'Node.js',
                          language: 'javascript',
                          code: `const axios = require('axios');

const { data } = await axios.post(
  'https://api.flowshieldai.com/v1/transactions/analyze',
  {
    transaction_id: 'tx_998124',
    amount: 4999.00,
    currency: 'INR',
    merchant: { name: 'Urbanic Fashion' },
    card: { last_four: '4242', type: 'visa' },
    customer: { id: 'cust_blr_91', ip: '103.21.244.10' },
    channel: 'web'
  },
  {
    headers: {
      'X-API-Key': process.env.FLOWSHIELD_API_KEY,
      'Content-Type': 'application/json'
    }
  }
);

console.log('Decision:', data.decision); // 'allow' | 'challenge' | 'block'`
                        }
                      ]}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2.5 mb-2">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center text-xs font-bold">3</span>
                    <h3 className="text-base font-semibold text-white">Inspect the explainable response</h3>
                  </div>
                  <div className="pl-8">
                    <CodeBlock 
                      language="json"
                      code={`{
  "transaction_id": "tx_998124",
  "risk_score": 0.08,
  "risk_label": "safe",
  "decision": "allow",
  "confidence": 0.96,
  "detection_latency_ms": 38,
  "reasons": [
    "Domestic IP matches card issuing territory",
    "Customer velocity normal (1 order / 48h)",
    "Device fingerprint verified across merchant network"
  ],
  "model_version": "ensemble_v2.4",
  "processed_at": "2026-09-09T18:40:00Z"
}`}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2.5 mb-2">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center text-xs font-bold">4</span>
                    <h3 className="text-base font-semibold text-white">Route the outcome</h3>
                  </div>
                  <div className="pl-8">
                    <CodeBlock 
                      language="javascript"
                      code={`if (data.decision === 'block') {
  // Decline before card capture
  return res.status(402).json({ error: 'Transaction rejected for security reasons' });
} else if (data.decision === 'challenge') {
  // Trigger step-up authentication (3DS or OTP)
  return res.json({ require_step_up: true, challenge_method: data.challenge_method });
} else {
  // 'allow' — capture payment normally
  await completeOrder(data.transaction_id);
}`}
                    />
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <hr className="my-12 border-border-200" />

            {/* SECTION 5: AUTHENTICATION */}
            <AnimatedSection id="authentication">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Authentication</h2>
                <p className="text-sm text-text-secondary">
                  Authenticate every API request using the <code className="text-cyan-400 font-mono">X-API-Key</code> header.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface-100 border border-cyan-500/30 p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
                    <Key className="w-4 h-4" />
                    <span>Production Keys</span>
                  </div>
                  <ul className="text-xs space-y-1 text-text-secondary">
                    <li><strong className="text-white">Prefix:</strong> <code className="font-mono text-cyan-400">fs_live_</code></li>
                    <li><strong className="text-white">Use:</strong> Live customer transactions & settlements</li>
                    <li><strong className="text-white">Constraint:</strong> Secure on backend only</li>
                  </ul>
                </div>

                <div className="bg-surface-100 border border-amber-500/30 p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                    <Terminal className="w-4 h-4" />
                    <span>Sandbox Keys</span>
                  </div>
                  <ul className="text-xs space-y-1 text-text-secondary">
                    <li><strong className="text-white">Prefix:</strong> <code className="font-mono text-amber-400">fs_test_</code></li>
                    <li><strong className="text-white">Use:</strong> Local development, CI/CD, staging tests</li>
                    <li><strong className="text-white">Behavior:</strong> Evaluates against synthetic risk profiles</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Security Best Practice:</strong> Never bundle your Flowshield API key in client-side React or mobile binaries. Route all evaluations through your Express, Django, or Next.js API routes.
                </span>
              </div>
            </AnimatedSection>

            <hr className="my-12 border-border-200" />

            {/* SECTION 6: REQUEST SCHEMA */}
            <AnimatedSection id="request-schema">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Request Schema</h2>
                <div className="bg-surface-100 border border-border-200 px-3 py-1.5 rounded-md inline-block font-mono text-xs">
                  <span className="text-emerald-400 font-bold">POST</span> /v1/transactions/analyze
                </div>
              </div>
              
              <div className="overflow-x-auto rounded-xl border border-border-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-100 border-b border-border-200 text-text-tertiary">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Field</th>
                      <th className="py-3 px-4 font-semibold">Type</th>
                      <th className="py-3 px-4 font-semibold">Required</th>
                      <th className="py-3 px-4 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-100 bg-[#080C16]">
                    <tr><td className="py-3 px-4 font-mono text-white">transaction_id</td><td className="py-3 px-4 text-cyan-400 font-mono">string</td><td className="py-3 px-4 text-text-tertiary">Optional</td><td className="py-3 px-4 text-text-secondary">Internal reference or gateway order ID</td></tr>
                    <tr><td className="py-3 px-4 font-mono text-white">amount</td><td className="py-3 px-4 text-cyan-400 font-mono">number</td><td className="py-3 px-4 text-emerald-400 font-semibold">Required</td><td className="py-3 px-4 text-text-secondary">Amount in decimal standard currency (e.g. 999.00)</td></tr>
                    <tr><td className="py-3 px-4 font-mono text-white">currency</td><td className="py-3 px-4 text-cyan-400 font-mono">string</td><td className="py-3 px-4 text-emerald-400 font-semibold">Required</td><td className="py-3 px-4 text-text-secondary">ISO 4217 code (INR, USD, EUR)</td></tr>
                    <tr><td className="py-3 px-4 font-mono text-white">merchant.name</td><td className="py-3 px-4 text-cyan-400 font-mono">string</td><td className="py-3 px-4 text-emerald-400 font-semibold">Required</td><td className="py-3 px-4 text-text-secondary">Store or merchant organization identifier</td></tr>
                    <tr><td className="py-3 px-4 font-mono text-white">customer.id</td><td className="py-3 px-4 text-cyan-400 font-mono">string</td><td className="py-3 px-4 text-emerald-400 font-semibold">Required</td><td className="py-3 px-4 text-text-secondary">Customer identifier for velocity calculation</td></tr>
                    <tr><td className="py-3 px-4 font-mono text-white">customer.ip</td><td className="py-3 px-4 text-cyan-400 font-mono">string</td><td className="py-3 px-4 text-text-tertiary">Optional</td><td className="py-3 px-4 text-text-secondary">Client IPv4 or IPv6 for proxy/VPN evaluation</td></tr>
                    <tr><td className="py-3 px-4 font-mono text-white">card.last_four</td><td className="py-3 px-4 text-cyan-400 font-mono">string</td><td className="py-3 px-4 text-text-tertiary">Optional</td><td className="py-3 px-4 text-text-secondary">Masked card last 4 digits for BIN fingerprinting</td></tr>
                  </tbody>
                </table>
              </div>
            </AnimatedSection>

            <hr className="my-12 border-border-200" />

            {/* SECTION 7: RESPONSE SCHEMA & SCORE */}
            <AnimatedSection id="response-schema">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Response Schema & Risk Tiers</h2>
                <p className="text-sm text-text-secondary">
                  Flowshield AI outputs a normalized score between 0.00 and 1.00 mapped to clear autonomous decisions.
                </p>
              </div>
              
              <div className="space-y-6">
                {/* Risk Continuum Bar */}
                <div className="space-y-2">
                  <div className="h-3 rounded-full overflow-hidden bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500" />
                  <div className="flex justify-between text-[11px] font-mono text-text-tertiary">
                    <span>0.00 (Safe)</span>
                    <span>0.35 (Challenge Limit)</span>
                    <span>0.72 (Fraud Threshold)</span>
                    <span>1.00 (High-Risk Bot)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-surface-100 border border-emerald-500/30 p-4 rounded-xl space-y-1">
                    <span className="text-xs font-bold text-emerald-400 uppercase">0.00 – 0.35 Safe</span>
                    <p className="text-xs text-text-primary font-semibold">Decision: allow</p>
                    <p className="text-[11px] text-text-secondary">Normal user pattern. Instant frictionless checkout.</p>
                  </div>
                  <div className="bg-surface-100 border border-amber-500/30 p-4 rounded-xl space-y-1">
                    <span className="text-xs font-bold text-amber-400 uppercase">0.36 – 0.72 Challenge</span>
                    <p className="text-xs text-text-primary font-semibold">Decision: challenge</p>
                    <p className="text-[11px] text-text-secondary">Elevated risk vectors. Route to 3D Secure or SMS OTP.</p>
                  </div>
                  <div className="bg-surface-100 border border-red-500/30 p-4 rounded-xl space-y-1">
                    <span className="text-xs font-bold text-red-400 uppercase">0.73 – 1.00 Fraud</span>
                    <p className="text-xs text-text-primary font-semibold">Decision: block</p>
                    <p className="text-[11px] text-text-secondary">Definitive attack signatures. Decline to eliminate liability.</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <hr className="my-12 border-border-200" />

            {/* SECTION 8: RAZORPAY INTEGRATION */}
            <AnimatedSection id="razorpay">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="text-cyan-400 h-5 w-5" />
                  <h2 className="text-2xl font-bold text-white">Integrate with Razorpay</h2>
                </div>
                <p className="text-sm text-text-secondary">
                  Evaluate transactions in your verification controller before capturing Razorpay payments.
                </p>
              </div>

              <CodeBlock 
                language="javascript"
                filename="razorpayMiddleware.js"
                code={`// Verify payment endpoint with Flowshield AI guard
app.post('/api/verify-razorpay', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, customer_id } = req.body;

  // 1. Evaluate fraud risk before order completion
  const fraudCheck = await axios.post(
    'https://api.flowshieldai.com/v1/transactions/analyze',
    {
      transaction_id: razorpay_order_id,
      amount: amount / 100, // paise to INR
      currency: 'INR',
      merchant: { name: 'My Store' },
      customer: { id: customer_id, ip: req.ip }
    },
    { headers: { 'X-API-Key': process.env.FLOWSHIELD_API_KEY } }
  );

  // 2. Reject if fraud detected
  if (fraudCheck.data.decision === 'block') {
    return res.status(403).json({ success: false, reason: 'Security validation failed' });
  }

  // 3. Verify HMAC signature & settle
  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
  hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
  if (hmac.digest('hex') === razorpay_signature) {
    await fulfillOrder(razorpay_order_id);
    return res.json({ success: true });
  }
});`}
              />
            </AnimatedSection>

            <hr className="my-12 border-border-200" />

            {/* SECTION 9: PYTHON / DJANGO */}
            <AnimatedSection id="python">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Python & Django Integration</h2>
                <p className="text-sm text-text-secondary">
                  Plug into Django views or FastAPI handlers using native requests.
                </p>
              </div>

              <CodeBlock 
                language="python"
                filename="flowshield_client.py"
                code={`import requests
import os

FLOWSHIELD_KEY = os.getenv("FLOWSHIELD_API_KEY")

def evaluate_checkout(order_id, amount, customer_id, client_ip):
    resp = requests.post(
        "https://api.flowshieldai.com/v1/transactions/analyze",
        headers={"X-API-Key": FLOWSHIELD_KEY},
        json={
            "transaction_id": str(order_id),
            "amount": float(amount),
            "currency": "INR",
            "merchant": {"name": "Merchant Store"},
            "customer": {"id": str(customer_id), "ip": client_ip}
        },
        timeout=1.5
    )
    data = resp.json()
    return data.get("decision") == "allow"`}
              />
            </AnimatedSection>

            <hr className="my-12 border-border-200" />

            {/* SECTION 10: WEBHOOKS */}
            <AnimatedSection id="webhooks">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Webhook className="text-cyan-400 h-5 w-5" />
                  <h2 className="text-2xl font-bold text-white">Webhooks & Event Specs</h2>
                </div>
                <p className="text-sm text-text-secondary">
                  Flowshield sends real-time webhook alerts when transactions are challenged or dispute dossiers are compiled.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg bg-surface-100 border border-border-200 text-xs">
                  <span className="font-mono font-bold text-cyan-400">transaction.blocked</span>
                  <p className="text-text-secondary mt-1">Fires when an anomaly exceeds critical threshold and transaction is halted.</p>
                </div>
                <div className="p-3.5 rounded-lg bg-surface-100 border border-border-200 text-xs">
                  <span className="font-mono font-bold text-amber-400">transaction.challenged</span>
                  <p className="text-text-secondary mt-1">Fires when 3DS step-up or customer SMS verification is requested.</p>
                </div>
                <div className="p-3.5 rounded-lg bg-surface-100 border border-border-200 text-xs">
                  <span className="font-mono font-bold text-emerald-400">evidence.compiled</span>
                  <p className="text-text-secondary mt-1">Fires when Delhivery delivery signature & bank dossier PDF are generated.</p>
                </div>
                <div className="p-3.5 rounded-lg bg-surface-100 border border-border-200 text-xs">
                  <span className="font-mono font-bold text-cyan-400">model.retrained</span>
                  <p className="text-text-secondary mt-1">Fires when false-positive feedback loops successfully retrain weights.</p>
                </div>
              </div>
            </AnimatedSection>

            <hr className="my-12 border-border-200" />

            {/* SECTION 11: RATE LIMITS */}
            <AnimatedSection id="rate-limits">
              <h2 className="text-2xl font-bold text-white mb-4">Plan Rate Limits</h2>
              <div className="overflow-x-auto rounded-xl border border-border-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-100 border-b border-border-200 text-text-tertiary">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Tier</th>
                      <th className="py-3 px-4 font-semibold">Monthly Quota</th>
                      <th className="py-3 px-4 font-semibold">Throughput Limit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-100 bg-[#080C16]">
                    <tr><td className="py-3 px-4 font-semibold text-text-primary">Free Sandbox</td><td className="py-3 px-4 text-text-secondary">1,000 reqs/mo</td><td className="py-3 px-4 text-text-secondary">5 req/sec</td></tr>
                    <tr><td className="py-3 px-4 font-semibold text-cyan-400">Builder (₹999/mo)</td><td className="py-3 px-4 text-text-secondary">25,000 reqs/mo</td><td className="py-3 px-4 text-text-secondary">25 req/sec</td></tr>
                    <tr><td className="py-3 px-4 font-semibold text-emerald-400">Growth (₹2,999/mo)</td><td className="py-3 px-4 text-text-secondary">100,000 reqs/mo</td><td className="py-3 px-4 text-text-secondary">100 req/sec</td></tr>
                    <tr><td className="py-3 px-4 font-semibold text-amber-400">Enterprise (₹7,999/mo)</td><td className="py-3 px-4 text-text-secondary">Unlimited</td><td className="py-3 px-4 text-text-secondary">Custom Dedicated VPC</td></tr>
                  </tbody>
                </table>
              </div>
            </AnimatedSection>

            <hr className="my-12 border-border-200" />

            {/* SECTION 12: CHANGELOG */}
            <AnimatedSection id="changelog">
              <h2 className="text-2xl font-bold text-white mb-4">Changelog</h2>
              <div className="border-l border-border-200 pl-4 space-y-6 text-xs">
                <div className="relative">
                  <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-4 ring-[#070B14]" />
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">v1.2.0</span>
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono text-[10px]">Current</span>
                  </div>
                  <p className="text-text-tertiary mt-0.5">September 2026</p>
                  <ul className="mt-2 space-y-1 text-text-secondary list-disc list-inside">
                    <li>Added interactive pipeline simulation and live architecture visualizer</li>
                    <li>Sovereign Indian gateway integration for Razorpay, Cashfree & UPI</li>
                    <li>Continuous false-positive feedback loops with live model updates</li>
                  </ul>
                </div>
              </div>
            </AnimatedSection>

          </motion.div>
        </main>

        {/* RIGHT SIDEBAR TABLE OF CONTENTS */}
        <aside className="hidden xl:block w-52 sticky top-20 h-[calc(100vh-5rem)] py-8 px-4 overflow-y-auto">
          <div className="space-y-3 border-l border-border-100 pl-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">On this page</h4>
            <ul className="space-y-1.5 text-xs text-text-secondary">
              {navItems.flatMap(group => group.items).map(item => (
                <li key={`toc-${item.id}`}>
                  <a 
                    href={`#${item.id}`} 
                    className={`block transition-colors hover:text-white ${activeSection === item.id ? 'text-cyan-400 font-semibold' : ''}`}
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
