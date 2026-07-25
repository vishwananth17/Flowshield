import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Terminal, 
  Code2, 
  Globe, 
  ArrowRight, 
  Zap, 
  Shield, 
  Copy, 
  Check,
  ChevronRight,
  Webhook
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Heading1, Heading2, Heading3, Label, Caption } from '@/components/ui/Typography';
import Logo from '@/components/Logo';

const SDK_DATA = {
  node: {
    label: 'Node.js',
    icon: <Code2 className="w-4 h-4" />,
    install: 'npm install @flowshield/sdk',
    code: `const Flowshield = require('@flowshield/sdk');
 
const client = new Flowshield('fs_live_...');
 
async function processPayment(order) {
  const result = await client.analyze({
    amount: order.amount,
    currency: 'INR',
    customer: { id: order.userId },
    merchant: { name: 'Institutional Store' }
  });
 
  if (result.decision === 'block') {
    throw new Error('Security violation detected');
  }
  
  return await gateway.process(order);
}`
  },
  python: {
    label: 'Python',
    icon: <Terminal className="w-4 h-4" />,
    install: 'pip install flowshield-sdk',
    code: `from flowshield import FlowshieldClient
 
client = FlowshieldClient(api_key="fs_live_...")
 
def handle_checkout(order):
    result = client.analyze({
        "amount": 4999.00,
        "currency": "INR",
        "customer": {"id": "user_123"},
        "merchant": {"name": "Swiggy"}
    })
    
    if result["decision"] == "block":
        return {"error": "Fraud risk detected", "code": 403}
        
    return process_payment(order)`
  }
};

export default function DevPortal() {
  const [activeLang, setActiveLang] = useState<'node' | 'python'>('node');
  const [copied, setCopied] = useState(false);

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-body select-text relative">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Logo size={28} iconSize={16} showText={true} />
            <Badge variant="gold">V1.3.2-LST</Badge>
          </div>
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <a href="/docs" className="text-[var(--text-secondary)] hover:text-white transition-colors">Documentation</a>
            <a href="#" className="text-[var(--text-secondary)] hover:text-white transition-colors">API Reference</a>
            <a href="#" className="text-[var(--text-secondary)] hover:text-white transition-colors">Changelog</a>
            <Button size="sm" variant="ghost">
              <Terminal className="w-4 h-4 mr-2" />
              OSS Repo
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 lg:py-20 text-left">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center">
              <Label className="text-[var(--text-gold)] tracking-[var(--tracking-widest)] bg-[var(--color-primary-muted)] border border-[var(--color-primary-border)] px-3 py-1 rounded-full">
                <Zap className="w-3 h-3 fill-current mr-1 text-[var(--text-gold)] inline" /> Built for High-Throughput Fintech
              </Label>
            </div>
            <Heading1>
              The Oracle is <br />
              <span className="bg-gradient-gold bg-clip-text text-transparent italic">Open Access</span>
            </Heading1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-xl">
              Integrate Flowshield's surgical fraud forensics into your core banking application in minutes. Sub-100ms inference, HMAC-secured webhooks, and deterministic SDKs.
            </p>
            <div className="flex items-center space-x-4">
              <Button variant="gold" size="xl">
                Generate API Key
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="ghost" size="xl">
                View GitHub
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-10"></div>
            <Card variant="glass" padding="none" className="relative overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-inset)]">
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setActiveLang('node')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${activeLang === 'node' ? 'bg-[var(--color-primary)] text-[var(--text-inverse)] font-bold' : 'text-[var(--text-secondary)] hover:text-white'}`}
                  >
                    Node.js
                  </button>
                  <button 
                    onClick={() => setActiveLang('python')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${activeLang === 'python' ? 'bg-[var(--color-primary)] text-[var(--text-inverse)] font-bold' : 'text-[var(--text-secondary)] hover:text-white'}`}
                  >
                    Python
                  </button>
                </div>
                <button 
                  onClick={() => copyCode(SDK_DATA[activeLang].code)}
                  className="text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-6 p-4 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-default)] font-mono text-sm">
                  <span className="text-[var(--text-muted)]">$</span>
                  <span className="text-[var(--text-gold)]">{SDK_DATA[activeLang].install}</span>
                </div>
                <pre className="font-mono text-sm leading-relaxed overflow-x-auto h-[320px]">
                  <code className="text-slate-300">
                    {SDK_DATA[activeLang].code}
                  </code>
                </pre>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
          {[
            { icon: <Terminal className="w-6 h-6" />, title: 'Deterministic SDKs', desc: 'Surgical accuracy with type-safe clients for Node, Python, and Go.' },
            { icon: <Globe className="w-6 h-6" />, title: 'Global Ingress', desc: 'Inertia-free processing across 14+ international regions.' },
            { icon: <Webhook className="w-6 h-6" />, title: 'Forensic Hooks', desc: 'Signed event streaming for real-time ledger updates.' }
          ].map((item, i) => (
            <Card
              key={i}
              variant="default"
              className="hover:border-[var(--border-gold)] transition-all group"
            >
              <div className="h-12 w-12 rounded-xl bg-[var(--color-primary-muted)] border border-[var(--color-primary-border)] flex items-center justify-center mb-6 text-[var(--text-gold)] group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <Heading3 className="mb-3">{item.title}</Heading3>
              <Caption className="leading-relaxed block">{item.desc}</Caption>
            </Card>
          ))}
        </div>

        {/* Quick Links */}
        <div className="border-t border-[var(--border-subtle)] pt-12 text-center">
          <Label className="mb-6 block">Protocol Resources</Label>
          <div className="flex flex-wrap justify-center gap-6">
            {['REST API Reference', 'HMAC Security Guide', 'Error Taxonomy', 'Webhooks Catalog', 'SLA Policy'].map(link => (
              <a key={link} href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-gold)] transition-colors flex items-center text-sm font-semibold">
                {link}
                <ChevronRight className="w-4 h-4 ml-1" />
              </a>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] py-12 bg-[var(--bg-inset)]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-[var(--text-muted)] text-sm">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Shield className="w-4 h-4" />
            <span className="font-bold text-[var(--text-secondary)] uppercase tracking-tighter">Flowshield AI</span>
            <span>© 2026 Developer Portal</span>
          </div>
          <div className="flex items-center space-x-8 font-semibold">
            <a href="#" className="hover:text-white transition-colors">Twitter (X)</a>
            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-white transition-colors">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
