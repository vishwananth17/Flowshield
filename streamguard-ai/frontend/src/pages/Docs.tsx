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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CodeBlock } from '../components/CodeBlock';
import { searchDocs, DocEntry } from '../utils/docsSearch';
import { useReveal } from '../hooks/useReveal';
import { useActiveSection } from '../hooks/useActiveSection';

const SECTION_IDS = [
  'introduction',
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
    <div className="min-h-screen bg-[#0A0E1A] text-[#F9FAFB] font-sans selection:bg-blue-500/30 font-[Space_Grotesk]">
      
      {/* HEADER */}
      <nav className="h-16 border-b border-[#1F2937] bg-[#0A0E1A]/90 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button className="md:hidden text-white mr-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="text-white h-5 w-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">Flowshield AI Docs</span>
        </div>
        
        <div className="flex-1 max-w-md mx-8 relative hidden md:block" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
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
              className="w-full h-10 pl-10 pr-4 bg-[#111827] border-[#1F2937] focus-visible:border-[#3B82F6] rounded-xl text-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-white"
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
                className="absolute top-12 left-0 right-0 bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] z-50 max-h-96 overflow-y-auto"
              >
                {searchResults.length > 0 ? (
                  searchResults.map((res) => (
                    <div 
                      key={res.id} 
                      className="px-4 py-3 hover:bg-[#1F2937] cursor-pointer border-b border-[#1F2937]/50 last:border-0"
                      onClick={() => handleSearchResultClick(res.anchor)}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-[#3B82F6] px-2 py-0.5 rounded bg-[#3B82F6]/10">
                          {res.section}
                        </span>
                        <span className="font-semibold text-sm">{res.title}</span>
                      </div>
                      <p className="text-xs text-[#9CA3AF] truncate">{res.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-[#9CA3AF]">No results found.</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center space-x-6 text-sm font-medium">
          <a href="/dashboard" className="hidden sm:block text-[#9CA3AF] hover:text-white transition-colors">Dashboard</a>
          <Button className="bg-[#3B82F6] hover:bg-blue-500 text-white font-semibold h-9 px-4 rounded-lg">
            Get API Key
          </Button>
        </div>
      </nav>

      <div className="flex max-w-[1500px] mx-auto min-h-[calc(100vh-64px)]">
        
        {/* LEFT SIDEBAR */}
        <aside className={`fixed md:sticky top-16 left-0 h-[calc(100vh-64px)] w-64 bg-[#0D1220] border-r border-[#1F2937] py-8 px-4 overflow-y-auto z-40 transform transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="space-y-8">
            {navItems.map((group) => (
              <div key={group.category} className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF] px-3">{group.category}</h4>
                <ul className="space-y-0.5 relative">
                  {group.items.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                      <li key={item.id} className="relative">
                        {isActive && (
                          <motion.div 
                            layoutId="sidebar-active"
                            className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#3B82F6] rounded-r"
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
                          className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                            isActive 
                              ? 'text-[#3B82F6] font-semibold bg-[#3B82F6]/5' 
                              : 'text-[#9CA3AF] hover:text-white hover:bg-[#1F2937]/50'
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
        <main className="flex-1 max-w-4xl px-6 md:px-12 py-12 lg:py-20 overflow-x-hidden">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            
            {/* SECTION: INTRODUCTION */}
            <AnimatedSection id="introduction">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Flowshield AI — Real-Time Fraud Detection API</h1>
              <p className="text-[#9CA3AF] text-xl mb-8">Core Infrastructure Reference Manual</p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-[#9CA3AF] leading-relaxed">
                    Flowshield AI provides an autonomous, sub-100ms fraud intelligence layer. 
                    We sit between your transaction sources and your processing layer to stop fraud before authorization,
                    saving you dispute fees and lost revenue.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-xl text-center">
                    <p className="text-3xl font-bold text-[#F9FAFB] mb-1">{'< 100ms'}</p>
                    <p className="text-[#9CA3AF] text-xs uppercase tracking-wider">Latency</p>
                  </div>
                  <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-xl text-center">
                    <p className="text-3xl font-bold text-[#F9FAFB] mb-1">3</p>
                    <p className="text-[#9CA3AF] text-xs uppercase tracking-wider">Models</p>
                  </div>
                  <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-xl text-center">
                    <p className="text-3xl font-bold text-[#F9FAFB] mb-1">99.9%</p>
                    <p className="text-[#9CA3AF] text-xs uppercase tracking-wider">SLA</p>
                  </div>
                  <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-xl text-center">
                    <p className="text-3xl font-bold text-[#F9FAFB] mb-1">5 mins</p>
                    <p className="text-[#9CA3AF] text-xs uppercase tracking-wider">Setup</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#111827] border border-[#1F2937] p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white mb-1">Base URLs</h4>
                  <div className="text-sm">
                    <span className="text-[#9CA3AF]">Production:</span> <code className="text-[#3B82F6] ml-2">https://api.flowshieldai.com/v1</code><br/>
                    <span className="text-[#9CA3AF]">Sandbox:</span> <code className="text-[#10B981] ml-7">https://sandbox.flowshieldai.com/v1</code>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 p-2 bg-[#3B82F6]/10 text-[#3B82F6] rounded-lg text-xs font-bold tracking-widest border border-[#3B82F6]/20">
                  V1.0.0 — STABLE
                </div>
              </div>
            </AnimatedSection>

            <hr className="my-16 border-[#1F2937]" />

            {/* SECTION: QUICK START */}
            <AnimatedSection id="quick-start">
              <h2 className="text-3xl font-bold mb-6">Quick Start (5 minutes)</h2>
              
              <div className="space-y-12">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ type: 'spring' }} viewport={{ once: true }} className="w-8 h-8 rounded-full bg-[#3B82F6] flex items-center justify-center font-bold">1</motion.div>
                    <h3 className="text-xl font-bold">Get your API key</h3>
                  </div>
                  <p className="text-[#9CA3AF] pl-11">
                    Sign up at <a href="#" className="text-[#3B82F6] hover:underline">app.flowshieldai.com</a> and copy your API key from the Dashboard → API Keys section.
                  </p>
                </div>

                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }} viewport={{ once: true }} className="w-8 h-8 rounded-full bg-[#3B82F6] flex items-center justify-center font-bold">2</motion.div>
                    <h3 className="text-xl font-bold">Make your first request</h3>
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
                        },
                        {
                          label: 'Node.js',
                          language: 'javascript',
                          code: `const axios = require('axios');

const response = await axios.post(
  'https://api.flowshieldai.com/v1/transactions/analyze',
  {
    transaction_id: 'tx_001',
    amount: 4999.00,
    currency: 'INR',
    merchant: {
      id: 'merch_swiggy_001',
      name: 'Swiggy',
      category: '5812'
    },
    card: {
      last_four: '4242',
      type: 'visa',
      issuing_country: 'IN'
    },
    customer: {
      id: 'cust_abc123',
      ip: '103.21.244.10',
      country: 'IN'
    },
    channel: 'mobile'
  },
  {
    headers: {
      'X-API-Key': 'fs_live_your_key_here',
      'Content-Type': 'application/json'
    }
  }
);

console.log('Risk Score:', response.data.risk_score);
console.log('Decision:', response.data.decision);`
                        }
                      ]}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} viewport={{ once: true }} className="w-8 h-8 rounded-full bg-[#3B82F6] flex items-center justify-center font-bold">3</motion.div>
                    <h3 className="text-xl font-bold">Understand the response</h3>
                  </div>
                  <div className="pl-11">
                    <CodeBlock 
                      language="json"
                      code={`{
  "transaction_id": "tx_fs_9f2a1c3d",
  "risk_score": 0.12,
  "risk_label": "safe",
  "decision": "allow",
  "confidence": 0.94,
  "detection_latency_ms": 43,
  "reasons": [
    "Transaction amount within customer normal range",
    "IP location matches card issuing country",
    "Known low-risk merchant category"
  ],
  "model_version": "ensemble_v2.1",
  "processed_at": "2026-04-17T10:30:00Z"
}`}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }} viewport={{ once: true }} className="w-8 h-8 rounded-full bg-[#3B82F6] flex items-center justify-center font-bold">4</motion.div>
                    <h3 className="text-xl font-bold">Handle the decision</h3>
                  </div>
                  <div className="pl-11">
                    <CodeBlock 
                      language="javascript"
                      code={`if (result.decision === 'block') {
  // Decline the transaction
  return res.status(402).json({
    error: 'Transaction declined for security reasons'
  });
} else if (result.decision === 'review') {
  // Flag for manual review, allow but monitor
  await flagForReview(result.transaction_id);
} else {
  // decision === 'allow' — proceed normally
  await processPayment(transactionData);
}`}
                    />
                  </div>
                </div>

                <div className="bg-[#10B981]/10 border border-[#10B981]/30 p-6 rounded-2xl flex items-start space-x-4">
                  <CheckCircle2 className="text-[#10B981] h-6 w-6 mt-1 flex-shrink-0" />
                  <p className="text-[#10B981] leading-relaxed">
                    <strong>That's it. You're now protected.</strong><br/>
                    Flowshield AI analyzes every transaction in under 100ms and returns a clear allow / review / block decision.
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <hr className="my-16 border-[#1F2937]" />

            {/* SECTION: AUTHENTICATION */}
            <AnimatedSection id="authentication">
              <h2 className="text-3xl font-bold mb-6">Authentication</h2>
              <p className="text-[#9CA3AF] mb-8">Authenticate your requests by passing your API key in the request header.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-[#3B82F6]/10 border border-[#3B82F6]/30 p-6 rounded-xl">
                  <h4 className="font-bold text-[#3B82F6] mb-2 flex items-center"><Key className="w-4 h-4 mr-2"/> Live Keys</h4>
                  <ul className="text-sm space-y-2 text-[#9CA3AF]">
                    <li><strong>Prefix:</strong> <code className="text-white">fs_live_</code></li>
                    <li><strong>Use for:</strong> Production transactions</li>
                    <li><strong>Warning:</strong> Never expose in frontend code</li>
                  </ul>
                </div>
                <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 p-6 rounded-xl">
                  <h4 className="font-bold text-[#F59E0B] mb-2 flex items-center"><Terminal className="w-4 h-4 mr-2"/> Test Keys</h4>
                  <ul className="text-sm space-y-2 text-[#9CA3AF]">
                    <li><strong>Prefix:</strong> <code className="text-white">fs_test_</code></li>
                    <li><strong>Use for:</strong> Development and testing</li>
                    <li><strong>Note:</strong> Returns mock risk scores</li>
                  </ul>
                </div>
              </div>

              <h4 className="font-semibold text-lg mb-3">How to authenticate</h4>
              <p className="text-[#9CA3AF] mb-4">Add this header to every request:</p>
              <CodeBlock 
                language="bash"
                code={`X-API-Key: fs_live_xxxxxxxxxxxxxxxxxxxx`}
              />

              <div className="mt-8 bg-[#EF4444]/10 border border-[#EF4444]/30 p-6 rounded-2xl flex items-start space-x-4">
                <AlertCircle className="text-[#EF4444] h-6 w-6 mt-1 flex-shrink-0" />
                <p className="text-[#EF4444] leading-relaxed">
                  <strong>⚠️ Security Warning</strong><br/>
                  Never expose your API key in frontend JavaScript. Always call Flowshield AI from your backend server. Treat your API key like a password.
                </p>
              </div>

              <h4 className="font-semibold text-lg mt-8 mb-3">Key Rotation Guide</h4>
              <p className="text-[#9CA3AF]">To rotate keys without downtime: Create a new key in the dashboard → update your environment variables → deploy your backend → revoke the old key.</p>
            </AnimatedSection>

            <hr className="my-16 border-[#1F2937]" />

            {/* SECTION: REQUEST SCHEMA */}
            <AnimatedSection id="request-schema">
              <h2 className="text-3xl font-bold mb-6">Request Schema</h2>
              <div className="bg-[#111827] border border-[#1F2937] px-4 py-2 rounded-lg inline-block mb-6 font-mono text-sm">
                <span className="text-[#10B981] font-bold">POST</span> /v1/transactions/analyze
              </div>
              
              <div className="overflow-x-auto rounded-xl border border-[#1F2937]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#161B22] border-b border-[#1F2937] text-[#9CA3AF]">
                    <tr>
                      <th className="p-4 font-semibold">Field</th>
                      <th className="p-4 font-semibold">Type</th>
                      <th className="p-4 font-semibold">Required</th>
                      <th className="p-4 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F2937] bg-[#0D1117]">
                    <tr><td className="p-4 font-mono text-white">transaction_id</td><td className="p-4 text-[#3B82F6]">string</td><td className="p-4 text-[#9CA3AF]">No</td><td className="p-4 text-[#9CA3AF]">Your internal ID</td></tr>
                    <tr><td className="p-4 font-mono text-white">amount</td><td className="p-4 text-[#3B82F6]">number</td><td className="p-4 text-[#10B981] font-medium">Yes</td><td className="p-4 text-[#9CA3AF]">Amount in currency units</td></tr>
                    <tr><td className="p-4 font-mono text-white">currency</td><td className="p-4 text-[#3B82F6]">string</td><td className="p-4 text-[#10B981] font-medium">Yes</td><td className="p-4 text-[#9CA3AF]">ISO 4217 code</td></tr>
                    <tr><td className="p-4 font-mono text-white">merchant.id</td><td className="p-4 text-[#3B82F6]">string</td><td className="p-4 text-[#9CA3AF]">No</td><td className="p-4 text-[#9CA3AF]">Your merchant ID</td></tr>
                    <tr><td className="p-4 font-mono text-white">merchant.name</td><td className="p-4 text-[#3B82F6]">string</td><td className="p-4 text-[#10B981] font-medium">Yes</td><td className="p-4 text-[#9CA3AF]">Merchant display name</td></tr>
                    <tr><td className="p-4 font-mono text-white">merchant.category</td><td className="p-4 text-[#3B82F6]">string</td><td className="p-4 text-[#9CA3AF]">No</td><td className="p-4 text-[#9CA3AF]">MCC code</td></tr>
                    <tr><td className="p-4 font-mono text-white">customer.id</td><td className="p-4 text-[#3B82F6]">string</td><td className="p-4 text-[#10B981] font-medium">Yes</td><td className="p-4 text-[#9CA3AF]">Your customer ID</td></tr>
                    <tr><td className="p-4 font-mono text-white">customer.ip</td><td className="p-4 text-[#3B82F6]">string</td><td className="p-4 text-[#9CA3AF]">No</td><td className="p-4 text-[#9CA3AF]">Customer IP address</td></tr>
                  </tbody>
                </table>
              </div>
            </AnimatedSection>

            <hr className="my-16 border-[#1F2937]" />

            {/* SECTION: RESPONSE SCHEMA */}
            <AnimatedSection id="response-schema">
              <h2 className="text-3xl font-bold mb-6">Response Schema & Risk Guide</h2>
              
              <div className="mb-12">
                <h4 className="font-semibold text-lg mb-6">The Risk Continuum</h4>
                <div className="relative h-4 mt-8 rounded-full overflow-hidden bg-gradient-to-r from-[#10B981] via-[#F59E0B] to-[#EF4444]">
                  <motion.div initial={{ scaleX: 0, originX: 0 }} whileInView={{ scaleX: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="absolute inset-0 bg-gradient-to-r from-[#10B981] via-[#F59E0B] to-[#EF4444]" />
                </div>
                <div className="flex justify-between text-xs font-mono text-[#9CA3AF] mt-2 px-1">
                  <span>0.0</span><span>0.3</span><span>0.7</span><span>1.0</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="bg-[#111827] border-l-4 border-[#10B981] p-4 rounded-r-xl">
                    <h5 className="font-bold text-white mb-1 tracking-wide">0.0 - 0.30 &nbsp;<span className="text-[#10B981]">SAFE</span></h5>
                    <p className="text-xs text-[#9CA3AF] mb-3 uppercase font-mono">Decision: allow</p>
                    <p className="text-sm text-[#E6EDF3]">Transaction follows normal patterns. Process as usual.</p>
                  </div>
                  <div className="bg-[#111827] border-l-4 border-[#F59E0B] p-4 rounded-r-xl">
                    <h5 className="font-bold text-white mb-1 tracking-wide">0.30 - 0.70 &nbsp;<span className="text-[#F59E0B]">REVIEW</span></h5>
                    <p className="text-xs text-[#9CA3AF] mb-3 uppercase font-mono">Decision: review</p>
                    <p className="text-sm text-[#E6EDF3]">Unusual but not definitively fraud. Consider manual review.</p>
                  </div>
                  <div className="bg-[#111827] border-l-4 border-[#EF4444] p-4 rounded-r-xl">
                    <h5 className="font-bold text-white mb-1 tracking-wide">0.70 - 1.0 &nbsp;<span className="text-[#EF4444]">FRAUD</span></h5>
                    <p className="text-xs text-[#9CA3AF] mb-3 uppercase font-mono">Decision: block</p>
                    <p className="text-sm text-[#E6EDF3]">High confidence fraud signals detected. Block immediately.</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <hr className="my-16 border-[#1F2937]" />

            {/* SECTION: RAZORPAY */}
            <AnimatedSection id="razorpay">
              <h2 className="text-3xl font-bold mb-6">Integrate with Razorpay</h2>
              <p className="text-[#9CA3AF] mb-6">Check transactions for fraud risk before finalizing the payment capture with Razorpay.</p>
              
              <h4 className="font-bold mb-2">Step 1: Install dependencies</h4>
              <CodeBlock language="bash" code="npm install axios razorpay" />

              <h4 className="font-bold mt-8 mb-2">Step 2: Create Flowshield middleware</h4>
              <CodeBlock language="javascript" code={`// flowshield.js — Call this before processing any payment
const axios = require('axios');

async function checkFraud(transactionData) {
  const response = await axios.post(
    'https://api.flowshieldai.com/v1/transactions/analyze',
    {
      transaction_id: transactionData.razorpay_order_id,
      amount: transactionData.amount / 100, // Razorpay uses paise
      currency: 'INR',
      merchant: { name: process.env.BUSINESS_NAME },
      customer: {
        id: transactionData.customer_id,
        ip: transactionData.customer_ip
      },
      channel: 'web',
      metadata: {
        razorpay_order_id: transactionData.razorpay_order_id
      }
    },
    { headers: { 'X-API-Key': process.env.FLOWSHIELD_API_KEY } }
  );
  return response.data;
}

module.exports = { checkFraud };`} />

              <h4 className="font-bold mt-8 mb-2">Step 3: Add to verification route</h4>
              <CodeBlock language="javascript" code={`// In your Express payment verification endpoint
app.post('/verify-payment', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id,
          razorpay_signature, customer_ip } = req.body;

  // 1. Check fraud BEFORE verifying payment
  const fraudCheck = await checkFraud({
    razorpay_order_id,
    amount: order.amount,
    customer_id: req.user.id,
    customer_ip
  });

  if (fraudCheck.decision === 'block') {
    return res.status(402).json({
      success: false,
      error: 'Transaction blocked for security reasons'
    });
  }

  // 2. Verify Razorpay signature
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
  hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
  const generated_signature = hmac.digest('hex');

  if (generated_signature === razorpay_signature) {
    // Payment is legitimate — complete order
    await completeOrder(razorpay_order_id);
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false });
  }
});`} />
            </AnimatedSection>

            <hr className="my-16 border-[#1F2937]" />

            {/* SECTION: PYTHON/DJANGO */}
            <AnimatedSection id="python">
              <h2 className="text-3xl font-bold mb-6">Integrate with Python / Django</h2>
              <CodeBlock language="python" code={`# flowshield_middleware.py
import requests
import os

FLOWSHIELD_API_KEY = os.environ.get('FLOWSHIELD_API_KEY')
FLOWSHIELD_BASE_URL = 'https://api.flowshieldai.com/v1'

def analyze_transaction(amount, currency, customer_id, customer_ip, merchant_name, transaction_id=None):
    response = requests.post(
        f'{FLOWSHIELD_BASE_URL}/transactions/analyze',
        headers={'X-API-Key': FLOWSHIELD_API_KEY},
        json={
            'transaction_id': transaction_id,
            'amount': float(amount),
            'currency': currency,
            'merchant': {'name': merchant_name},
            'customer': {
                'id': str(customer_id),
                'ip': customer_ip
            },
            'channel': 'web'
        },
        timeout=5  # Never wait more than 5 seconds
    )
    response.raise_for_status()
    return response.json()

# In your Django view:
def process_payment(request):
    result = analyze_transaction(
        amount=request.POST.get('amount'),
        currency='INR',
        customer_id=request.user.id,
        customer_ip=request.META.get('REMOTE_ADDR'),
        merchant_name='Your Business Name'
    )

    if result['decision'] == 'block':
        return JsonResponse({'error': 'Transaction declined'}, status=402)

    # Proceed with payment processing...`} />
            </AnimatedSection>

            <hr className="my-16 border-[#1F2937]" />

            {/* SECTION: WEBHOOKS */}
            <AnimatedSection id="webhooks">
              <h2 className="text-3xl font-bold mb-6">Webhooks</h2>
              <p className="text-[#9CA3AF] mb-6">Receive real-time notifications about fraud activity directly to your server.</p>
              
              <CodeBlock language="javascript" code={`const crypto = require('crypto');

app.post('/webhook/flowshield', express.raw({type: '*/*'}), (req, res) => {
  const signature = req.headers['x-flowshield-signature'];
  const payload = req.body.toString();

  // Verify signature
  const expected = crypto
    .createHmac('sha256', process.env.FLOWSHIELD_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  if (\`sha256=\${expected}\` !== signature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(payload);

  switch (event.type) {
    case 'fraud.detected':
      console.log('Fraud detected:', event.data.transaction_id);
      await blockCustomer(event.data.customer_id);
      break;
    case 'transaction.flagged':
      console.log('Review needed:', event.data.transaction_id);
      await notifyReviewTeam(event.data);
      break;
  }

  res.json({ received: true });
});`} />
            </AnimatedSection>

            <hr className="my-16 border-[#1F2937]" />

            {/* SECTION: ERROR CODES */}
            <AnimatedSection id="error-codes">
              <h2 className="text-3xl font-bold mb-6">Error Codes</h2>
              
              <div className="overflow-x-auto rounded-xl border border-[#1F2937] mb-8">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#161B22] border-b border-[#1F2937] text-[#9CA3AF]">
                    <tr>
                      <th className="p-4 font-semibold">Error Code</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F2937] bg-[#0D1117]">
                    <tr><td className="p-4 font-mono text-white">INVALID_API_KEY</td><td className="p-4 text-[#EF4444]">401</td><td className="p-4 text-[#9CA3AF]">Key not found or revoked</td></tr>
                    <tr><td className="p-4 font-mono text-white">RATE_LIMIT_EXCEEDED</td><td className="p-4 text-[#F59E0B]">429</td><td className="p-4 text-[#9CA3AF]">Monthly limit reached</td></tr>
                    <tr><td className="p-4 font-mono text-white">INVALID_REQUEST</td><td className="p-4 text-[#F59E0B]">400</td><td className="p-4 text-[#9CA3AF]">Missing required fields</td></tr>
                    <tr><td className="p-4 font-mono text-white">VALIDATION_ERROR</td><td className="p-4 text-[#F59E0B]">422</td><td className="p-4 text-[#9CA3AF]">Field type mismatch</td></tr>
                    <tr><td className="p-4 font-mono text-white">INTERNAL_ERROR</td><td className="p-4 text-[#EF4444]">500</td><td className="p-4 text-[#9CA3AF]">Unexpected server error</td></tr>
                  </tbody>
                </table>
              </div>

              <CodeBlock language="json" code={`{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Monthly request limit reached (1,000/1,000 used).",
    "upgrade_url": "https://app.flowshieldai.com/billing",
    "reset_date": "2026-05-01T00:00:00Z"
  }
}`} />
            </AnimatedSection>

            <hr className="my-16 border-[#1F2937]" />

            {/* SECTION: RATE LIMITS */}
            <AnimatedSection id="rate-limits">
              <h2 className="text-3xl font-bold mb-6">Rate Limits</h2>
              
              <div className="overflow-x-auto rounded-xl border border-[#1F2937] mb-8">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#161B22] border-b border-[#1F2937] text-[#9CA3AF]">
                    <tr>
                      <th className="p-4 font-semibold">Plan</th>
                      <th className="p-4 font-semibold">Requests/month</th>
                      <th className="p-4 font-semibold">Requests/second</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F2937] bg-[#0D1117]">
                    <tr><td className="p-4 font-bold text-white">Free</td><td className="p-4 text-[#9CA3AF]">1,000</td><td className="p-4 text-[#9CA3AF]">1 req/sec</td></tr>
                    <tr><td className="p-4 font-bold text-[#3B82F6]">Basic</td><td className="p-4 text-[#9CA3AF]">25,000</td><td className="p-4 text-[#9CA3AF]">10 req/sec</td></tr>
                    <tr><td className="p-4 font-bold text-[#10B981]">Growth</td><td className="p-4 text-[#9CA3AF]">100,000</td><td className="p-4 text-[#9CA3AF]">100 req/sec</td></tr>
                    <tr><td className="p-4 font-bold text-[#F59E0B]">Enterprise</td><td className="p-4 text-[#9CA3AF]">Unlimited</td><td className="p-4 text-[#9CA3AF]">Custom</td></tr>
                  </tbody>
                </table>
              </div>
            </AnimatedSection>

            <hr className="my-16 border-[#1F2937]" />

            {/* SECTION: CHANGELOG */}
            <AnimatedSection id="changelog">
              <h2 className="text-3xl font-bold mb-6">Changelog</h2>
              <div className="relative border-l border-[#1F2937] ml-3 mt-8 pb-8">
                <div className="mb-10 ml-6 relative">
                  <span className="absolute -left-8 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#3B82F6] ring-4 ring-[#0A0E1A]"></span>
                  <h3 className="flex items-center mb-1 text-lg font-semibold text-white">v1.0.0 <span className="bg-[#3B82F6]/10 text-[#3B82F6] text-xs font-semibold mr-2 px-2.5 py-0.5 rounded ml-3">Latest</span></h3>
                  <time className="block mb-4 text-sm font-normal leading-none text-[#9CA3AF]">April 2026</time>
                  <ul className="text-[#9CA3AF] text-sm space-y-2 list-disc list-inside">
                    <li>Real-time fraud detection API</li>
                    <li>IsolationForest + XGBoost ensemble</li>
                    <li>SHAP explainability</li>
                    <li>Razorpay integration guide</li>
                    <li>Webhook delivery system</li>
                  </ul>
                </div>
              </div>
            </AnimatedSection>
          </motion.div>
        </main>

        {/* RIGHT SIDEBAR (ON PAGE NAV) */}
        <aside className="hidden xl:block w-56 fixed top-24 right-8 h-[calc(100vh-6rem)] overflow-y-auto overflow-x-hidden">
          <div className="space-y-4 border-l border-[#1F2937] pl-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF] mb-4">On this page</h4>
            <ul className="space-y-2 text-sm text-[#9CA3AF]">
              {navItems.flatMap(group => group.items).map(item => (
                <li key={`toc-${item.id}`}>
                  <a 
                    href={`#${item.id}`} 
                    className={`hover:text-white transition-colors block ${activeSection === item.id ? 'text-[#3B82F6] font-medium' : ''}`}
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
