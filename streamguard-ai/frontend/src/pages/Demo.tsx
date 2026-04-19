import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Activity, 
  Lock, 
  ChevronRight, 
  Globe, 
  Zap, 
  Database,
  Terminal
} from 'lucide-react';

const SCENARIOS = [
  {
    id: 'SAFE',
    title: 'Safe UPI Payment',
    description: 'Typical ₹450 grocery transaction from Mumbai',
    icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
    values: { verdict: 'ALLOW', score: '0.02' }
  },
  {
    id: 'SCAM',
    title: 'UPI Collect Scam',
    description: 'High-value pull request on a new device',
    icon: <Activity className="w-5 h-5 text-amber-500" />,
    values: { verdict: 'BLOCK', score: '72.4' }
  },
  {
    id: 'THEFT',
    title: 'Global Card Theft',
    description: '₹1.8L purchase from US card on Indian IP',
    icon: <Lock className="w-5 h-5 text-rose-500" />,
    values: { verdict: 'BLOCK', score: '87.0' }
  }
];

export default function Demo() {
  const [activeId, setActiveId] = useState('THEFT');
  const active = SCENARIOS.find(s => s.id === activeId)!;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 font-sans selection:bg-indigo-500/30 overflow-x-hidden p-6 lg:p-20">
      
      {/* TWO-COLUMN GRID */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* LEFT COLUMN: THE TRIGGER PROTOCOL */}
        <div className="space-y-12">
          
          <header className="space-y-4">
            <h1 className="text-5xl lg:text-6xl font-black tracking-tight leading-none text-slate-100">
              Try the <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 brightness-125">Glass-Box AI</span>
            </h1>
            <p className="text-slate-400 text-lg lg:text-xl font-medium leading-relaxed max-w-lg">
              Experience the precision of the MVIForest ensemble. Select a pattern below to see how our forensics engine decomposes fraud signals in real-time.
            </p>
          </header>

          {/* SCENARIO BUTTONS */}
          <div className="space-y-4">
            {SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => setActiveId(scenario.id)}
                className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 group flex items-center justify-between ${
                  activeId === scenario.id
                    ? 'bg-slate-900/80 border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.15)] shadow-indigo-500/10'
                    : 'bg-slate-950 border-slate-800/50 hover:bg-slate-900/50'
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-xl bg-slate-950 border border-slate-800/50 transition-colors ${activeId === scenario.id ? 'border-indigo-500/30' : ''}`}>
                    {scenario.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-slate-100 mb-1">{scenario.title}</h3>
                    <p className="text-[14px] text-slate-400 font-medium">{scenario.description}</p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-slate-700 transition-transform ${activeId === scenario.id ? 'translate-x-1 text-slate-400' : 'group-hover:translate-x-1 group-hover:text-slate-500'}`} />
              </button>
            ))}
          </div>

          {/* FOOTER BADGES */}
          <div className="flex flex-wrap items-center gap-8 pt-8 opacity-60">
            <div className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
              <Globe className="w-4 h-4 text-blue-400" />
              Global Markets Support
            </div>
            <div className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
              <Zap className="w-4 h-4 text-amber-400" />
              {'<'}50ms Latency
            </div>
            <div className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
              <Database className="w-4 h-4 text-emerald-500" />
              DPDP Compliant
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: THE ENGINE & FORENSICS */}
        <div className="space-y-8">
          
          {/* CODE PAYLOAD BOX */}
          <div className="bg-[#020617] rounded-3xl border border-slate-800/50 p-8 font-mono text-sm leading-relaxed overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Terminal className="w-24 h-24" />
            </div>
            <pre className="relative z-10">
              <code className="text-slate-300">
                <span className="text-blue-400 italic">await</span> <span className="text-slate-100">flowshield</span>.<span className="text-slate-100">analyze</span>(&#123;{'\n'}
                {'  '}<span className="text-indigo-300 font-medium">transaction_id</span>: <span className="text-emerald-300">"tx_high_value_foreign"</span>,{'\n'}
                {'  '}<span className="text-indigo-300 font-medium">amount</span>: <span className="text-slate-100">180000</span>,{'\n'}
                {'  '}<span className="text-indigo-300 font-medium">currency</span>: <span className="text-emerald-300">"INR"</span>,{'\n'}
                {'  '}<span className="text-indigo-300 font-medium">channel</span>: <span className="text-emerald-300">"web"</span>{'\n'}
                &#125;);
              </code>
            </pre>
          </div>

          {/* DECISION ENGINE */}
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-[32px] border border-slate-800/50 p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            
            <header className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-2 text-[12px] font-bold text-slate-500 uppercase tracking-widest">
                Decision Engine <ChevronRight className="w-4 h-4" />
              </div>
              <div className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">
                Risk Score
              </div>
            </header>

            {/* VERDICT ROW */}
            <div className="flex justify-between items-baseline mb-12">
              <div className={`text-6xl font-black uppercase tracking-tighter ${active.values.verdict === 'BLOCK' ? 'text-rose-500' : 'text-emerald-400'}`}>
                {active.values.verdict}
              </div>
              <div className="text-[100px] font-black text-white tracking-tighter leading-none flex items-baseline">
                {active.values.score}<span className="text-3xl text-slate-600 ml-1">%</span>
              </div>
            </div>

            {/* TELEMETRY ROW */}
            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="bg-slate-950/80 border border-slate-800/50 rounded-2xl p-6">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                  <Zap className="w-4 h-4 text-blue-400" /> Latency
                </div>
                <div className="text-3xl font-black text-slate-100 italic">35ms</div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800/50 rounded-2xl p-6">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                  <Activity className="w-4 h-4 text-indigo-400" /> Confusion
                </div>
                <div className="text-3xl font-black text-slate-100 italic">0.75</div>
              </div>
            </div>

            {/* SHAP FORENSICS LIST */}
            <div className="space-y-4">
              <h4 className="font-mono text-[11px] font-bold text-slate-500 tracking-widest uppercase">
                {'>_'} SHAP Forensics
              </h4>
              <div className="space-y-2">
                {[
                  'High-risk transaction detected (sandbox demo)',
                  'Amount ₹180,000 exceeds safe threshold',
                  'High-risk merchant category'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 py-4 px-6 rounded-xl bg-slate-900 border border-slate-800/30">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                    <span className="text-[14px] text-slate-300 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

// DEPLOYMENT_NONCE: 1776638416 - Final Technical Specification Alignment
