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
  Search,
  Bell,
  LayoutGrid
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
    <div className="min-h-screen bg-[#020617] text-slate-50 font-sans selection:bg-indigo-500/30 overflow-x-hidden relative">
      
      {/* PRODUCTION APP SHELL (FROM SCREENSHOT) */}
      <nav className="h-14 border-b border-white/5 bg-[#020617] flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-slate-500 hover:text-white transition-colors cursor-pointer" />
           </div>
           <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
                 <ShieldCheck className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight">Flowshield AI</span>
           </div>
        </div>

        <div className="flex-grow max-w-xl mx-8">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input 
                disabled 
                type="text" 
                placeholder="Search transactions, alerts..." 
                className="w-full bg-[#0a0f1a] border border-white/5 rounded-md py-1.5 pl-10 pr-4 text-[12px] font-medium text-slate-500 focus:outline-none" 
              />
           </div>
        </div>

        <div className="flex items-center gap-5">
           <div className="bg-[#1e40af] border border-blue-400/20 px-3 py-1 rounded-md flex items-center gap-2 shadow-lg shadow-blue-900/40 cursor-default">
              <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_12px_#10B981]" />
              <span className="text-[11px] font-bold text-white tracking-widest leading-none" style={{ textTransform: 'none' }}>Verify it's you</span>
           </div>
           <div className="flex items-center gap-5 text-slate-500">
              <Bell className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
              <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-[10px] cursor-pointer">V</div>
           </div>
        </div>
      </nav>

      {/* ATMOSPHERIC BACKGROUND BLOOMS */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-blue-500/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-48 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <main className="max-w-7xl mx-auto px-8 py-20 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* LEFT COLUMN: THE TRIGGER PROTOCOL */}
        <div className="space-y-12">
          <header className="space-y-4">
            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-none text-slate-100">
              Try the <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 brightness-125 drop-shadow-[0_0_20px_rgba(129,140,248,0.3)]">Glass-Box AI</span>
            </h1>
            <p className="text-slate-400 text-lg lg:text-xl font-bold opacity-80 leading-relaxed max-w-lg">
              Experience the precision of the MVIForest ensemble. Select a pattern below to see how our forensics engine decomposes fraud signals in real-time.
            </p>
          </header>

          {/* SCENARIO BUTTONS */}
          <div className="space-y-4">
            {SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => setActiveId(scenario.id)}
                className={`w-full text-left p-7 rounded-[22px] border-2 transition-all duration-300 group flex items-center justify-between ${
                  activeId === scenario.id
                    ? 'bg-slate-900 border-indigo-500/50 shadow-2xl shadow-indigo-500/10'
                    : 'bg-transparent border-white/5 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-xl bg-black border border-white/5 transition-colors ${activeId === scenario.id ? 'border-indigo-500/30' : ''}`}>
                    {scenario.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-slate-100 mb-1 leading-none">{scenario.title}</h3>
                    <p className="text-[14px] text-slate-500 font-medium tracking-tight">{scenario.description}</p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-slate-700 transition-transform ${activeId === scenario.id ? 'translate-x-1 text-slate-400' : 'group-hover:translate-x-1 group-hover:text-slate-500'}`} />
              </button>
            ))}
          </div>

          {/* FOOTER BADGES */}
          <div className="flex flex-wrap items-center gap-10 opacity-50">
            <div className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
              <Globe className="w-4 h-4 text-blue-500" />
              Global Markets Support
            </div>
            <div className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
              <Zap className="w-4 h-4 text-amber-400" />
              {'<'}50ms Latency
            </div>
            <div className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
              <Database className="w-4 h-4 text-emerald-500" />
              DPDP Compliant
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: THE ENGINE & FORENSICS */}
        <div className="space-y-8">
          
          {/* CODE PAYLOAD BOX (PROMPT TOKENS) */}
          <div className="bg-[#020617] rounded-[32px] border border-slate-800/50 p-8 font-mono text-[15px] shadow-2xl">
            <pre className="leading-relaxed">
              <code className="text-slate-300">
                <span className="text-blue-400 italic">await</span> <span className="text-slate-100">flowshield</span>.<span className="text-slate-100 font-semibold">analyze</span>(&#123;{'\n'}
                {'  '}<span className="text-indigo-300 font-medium">transaction_id</span>: <span className="text-emerald-300">"tx_high_value_foreign"</span>,{'\n'}
                {'  '}<span className="text-indigo-300 font-medium">amount</span>: <span className="text-slate-100">180000</span>,{'\n'}
                {'  '}<span className="text-indigo-300 font-medium">currency</span>: <span className="text-emerald-300">"INR"</span>,{'\n'}
                {'  '}<span className="text-indigo-300 font-medium">channel</span>: <span className="text-emerald-300">"web"</span>{'\n'}
                &#125;);
              </code>
            </pre>
          </div>

          {/* DECISION ENGINE (SCREENSHOT HIERARCHY) */}
          <div className="bg-[#0f172a]/95 backdrop-blur-3xl rounded-[36px] border border-white/10 p-10 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.6)]">
            
            <header className="flex justify-between items-start mb-14">
              <div className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                Decision Engine <ChevronRight className="w-4 h-4 text-slate-700 font-black" />
              </div>
              <div className="text-right">
                <div className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 opacity-80">Risk Score</div>
                <div className="text-[100px] font-black text-white tracking-tighter leading-none flex items-baseline justify-end">
                  {active.values.score}<span className="text-[32px] text-slate-600 ml-1 font-bold mb-1">%</span>
                </div>
              </div>
            </header>

            {/* VERDICT ROW */}
            <div className={`text-6xl font-black uppercase tracking-tighter leading-none mb-14 ${active.values.verdict === 'BLOCK' ? 'text-rose-500' : 'text-emerald-400'}`}>
              {active.values.verdict}
            </div>

            {/* TELEMETRY ROW */}
            <div className="grid grid-cols-2 gap-5 mb-10">
              <div className="bg-slate-950 border border-slate-800/50 rounded-2xl p-6 shadow-inner">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
                  <Zap className="w-4 h-4 text-blue-500" /> Latency
                </div>
                <div className="text-[36px] font-black text-white italic tracking-tighter">35ms</div>
              </div>
              <div className="bg-slate-950 border border-slate-800/50 rounded-2xl p-6 shadow-inner">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
                  <Activity className="w-4 h-4 text-indigo-400" /> Confusion
                </div>
                <div className="text-[36px] font-black text-white italic tracking-tighter">0.75</div>
              </div>
            </div>

            {/* SHAP FORENSICS LIST (PIXEL FINISH) */}
            <div className="space-y-6">
              <div className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 opacity-80 font-mono">
                <span className="text-emerald-500 font-extrabold tracking-widest">{'>_'}</span>
                SHAP Forensics
              </div>
              <div className="space-y-3.5">
                {[
                  'High-risk transaction detected (sandbox demo)',
                  'Amount ₹180,000 exceeds safe threshold',
                  'High-risk merchant category'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 py-4 px-7 rounded-[22px] bg-slate-900 border border-white/5 hover:border-white/10 transition-all cursor-default">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.9)]" />
                    <span className="text-[14.5px] text-slate-300 font-[800] leading-relaxed tracking-tight">{item}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}

// DEPLOYMENT_NONCE: 1776638750 - Absolute Signature Logic Sync
