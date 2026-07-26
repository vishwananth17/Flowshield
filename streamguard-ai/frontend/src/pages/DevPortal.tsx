import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, 
  Code2, 
  Cpu, 
  Globe, 
  Search, 
  ArrowRight, 
  Zap, 
  Shield, 
  Copy, 
  Check,
  ChevronRight,
  BookOpen,
  FileCode,
  Webhook
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-blue-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-slate-800/50 bg-[#020617]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold tracking-tight text-lg">Developer Oracle</span>
            <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400 font-mono text-[10px]">v1.3.2-LST</Badge>
          </div>
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400">
            <a href="/docs" className="hover:text-white transition-colors">Documentation</a>
            <a href="#" className="hover:text-white transition-colors">API Reference</a>
            <a href="#" className="hover:text-white transition-colors">Changelog</a>
            <Button size="sm" variant="outline" className="border-slate-700 bg-slate-900/50 hover:bg-slate-800">
              <Terminal className="w-4 h-4 mr-2" />
              OSS Repo
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6 font-mono text-xs text-blue-400">
              <Zap className="w-3 h-3 fill-current" />
              <span>Built for High-Throughput Fintech</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              The Oracle is <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent italic">Open Access</span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-xl mb-10">
              Integrate Flowshield's surgical fraud forensics into your core banking application in minutes. Sub-100ms inference, HMAC-secured webhooks, and deterministic SDKs.
            </p>
            <div className="flex items-center space-x-4">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-14 px-8">
                Generate API Key
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="ghost" className="text-slate-300 hover:bg-slate-900 h-14 px-8 border border-slate-800">
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
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setActiveLang('node')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeLang === 'node' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-white'}`}
                  >
                    Node.js
                  </button>
                  <button 
                    onClick={() => setActiveLang('python')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeLang === 'python' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-white'}`}
                  >
                    Python
                  </button>
                </div>
                <button 
                  onClick={() => copyCode(SDK_DATA[activeLang].code)}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-6 p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm group">
                  <span className="text-slate-500">$</span>
                  <span className="text-blue-400">{SDK_DATA[activeLang].install}</span>
                </div>
                <pre className="font-mono text-sm leading-relaxed overflow-x-auto h-[320px]">
                  <code className="text-slate-300">
                    {SDK_DATA[activeLang].code}
                  </code>
                </pre>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
          {[
            { icon: <Terminal className="w-6 h-6" />, title: 'Deterministic SDKs', desc: 'Surgical accuracy with type-safe clients for Node, Python, and Go.' },
            { icon: <Globe className="w-6 h-6" />, title: 'Global Ingress', desc: 'Inertia-free processing across 14+ international regions.' },
            { icon: <Webhook className="w-6 h-6" />, title: 'Forensic Hooks', desc: 'Signed event streaming for real-time ledger updates.' }
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/30 transition-all group"
            >
              <div className="h-12 w-12 rounded-xl bg-blue-600/10 flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="border-t border-slate-800 pt-12 text-center">
            <p className="text-slate-500 text-sm mb-6 uppercase tracking-widest font-bold">Protocol Resources</p>
            <div className="flex flex-wrap justify-center gap-6">
                {['REST API Reference', 'HMAC Security Guide', 'Error Taxonomy', 'Webhooks Catalog', 'SLA Policy'].map(link => (
                    <a key={link} href="#" className="text-slate-400 hover:text-blue-400 transition-colors flex items-center text-sm">
                        {link}
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </a>
                ))}
            </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-slate-500 text-sm">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <Shield className="w-4 h-4" />
                <span className="font-bold text-slate-400 uppercase tracking-tighter">Flowshield AI</span>
                <span>© 2026 Developer Portal</span>
            </div>
            <div className="flex items-center space-x-8">
                <a href="#" className="hover:text-white transition-colors">Twitter (X)</a>
                <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
                <a href="#" className="hover:text-white transition-colors">Discord</a>
                <a href="#" className="hover:text-white transition-colors">Slack Community</a>
            </div>
        </div>
      </footer>
    </div>
  );
}
