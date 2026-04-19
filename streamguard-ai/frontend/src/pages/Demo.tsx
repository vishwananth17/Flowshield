import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Search, 
  Bell, 
  ChevronRight, 
  Globe, 
  Zap, 
  LayoutGrid,
  Activity,
  Lock
} from 'lucide-react';

const SCENARIOS = [
  {
    id: 'SAFE_UPI',
    name: 'Safe UPI Payment',
    description: 'Typical ₹450 grocery transaction from Mumbai',
    icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
    values: { amount: 180000, verdict: 'ALLOW', score: '0.02' },
    forensics: [
      'Device ID verified and historical match',
      'Transaction amount within user baseline',
      'Merchant reputation score: 98/100'
    ]
  },
  {
    id: 'COLLECT_SCAM',
    name: 'UPI Collect Scam',
    description: 'High-value pull request on a new device',
    icon: <Activity className="w-4 h-4 text-amber-500" />,
    values: { amount: 15000, verdict: 'BLOCK', score: '72.4' },
    forensics: [
      'Unverified pull request source detected',
      'New device tenure (< 2h since first seen)',
      'High velocity spike detected for this account'
    ]
  },
  {
    id: 'GLOBAL_THEFT',
    name: 'Global Card Theft',
    description: '₹1.8L purchase from US card on Indian IP',
    icon: <Lock className="w-4 h-4 text-rose-500" />,
    values: { amount: 180000, verdict: 'BLOCK', score: '87.0' },
    forensics: [
      'High-risk transaction detected (sandbox demo)',
      'Amount ₹180,000 exceeds safe threshold',
      'High-risk merchant category'
    ]
  }
];

export default function Demo() {
  const [activeId, setActiveId] = useState('GLOBAL_THEFT');
  const active = SCENARIOS.find(s => s.id === activeId)!;

  return (
    <div className="min-h-screen bg-[#050810] text-[#f8fafc] font-sans selection:bg-blue-500/30 overflow-hidden relative">
      
      {/* HEADER */}
      <nav className="h-14 border-b border-white/5 bg-[#050810] flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-slate-500 cursor-pointer hover:text-white transition-colors" />
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
                className="w-full bg-[#080c14] border border-white/5 rounded-md py-1.5 pl-10 pr-4 text-xs font-medium text-slate-500 focus:outline-none" 
              />
           </div>
        </div>

        <div className="flex items-center gap-5">
           <div className="bg-[#1D4ED8] border border-blue-400/20 px-3 py-1 rounded-md flex items-center gap-2 shadow-lg shadow-blue-900/30 cursor-default">
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_8px_#10B981]" />
              <span className="text-[11px] font-bold text-white uppercase tracking-widest leading-none">Verify it's you</span>
           </div>
           <div className="flex items-center gap-5 text-slate-400">
              <Bell className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
              <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-[10px] cursor-pointer">V</div>
           </div>
        </div>
      </nav>

      {/* BACKGROUND GLOW */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <main className="max-w-7xl mx-auto px-8 py-20 relative z-10">
        
        {/* HERO TITLE */}
        <div className="text-center mb-16">
          <h1 className="text-[54px] font-bold tracking-tighter mb-4 leading-tight">
            Try the <span className="text-[#818cf8]">Glass-Box AI</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto font-medium">
            Experience the precision of the MVIForest ensemble. Select a pattern below to see how our forensics engine decomposes fraud signals in real-time.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          
          {/* SELECTION COLUMN */}
          <div className="space-y-4">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveId(s.id)}
                className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 group ${
                  activeId === s.id 
                  ? 'bg-[#0f172a] border-blue-500/40 shadow-2xl' 
                  : 'bg-transparent border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="p-2.5 rounded-xl bg-slate-900/40 border border-white/5">
                      {s.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1 leading-none">{s.name}</h3>
                      <p className="text-[13px] text-slate-500">{s.description}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-slate-700 transition-transform ${activeId === s.id ? 'translate-x-1 text-slate-400' : ''}`} />
                </div>
              </button>
            ))}

            {/* TRUST BADGES */}
            <div className="pt-10 flex items-center gap-8">
               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  <Globe className="w-3.5 h-3.5 text-blue-500" />
                  Global Markets Support
               </div>
               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  {'<'}50ms Latency
               </div>
               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  DPDP Compliant
               </div>
            </div>
          </div>

          {/* ENGINE AREA */}
          <div className="space-y-8">
            
            {/* TERMINAL SINK */}
            <div className="bg-[#020610] rounded-3xl border border-white/5 p-8 font-mono text-[14.5px]">
               <div className="space-y-1.5 leading-relaxed">
                  <div className="mb-2">
                    <span className="text-[#f43f5e] font-bold">await</span> <span className="text-white italic">flowshield</span>.<span className="text-white">analyze(&#123;</span>
                  </div>
                  <div className="pl-6">
                    <span className="text-amber-300">transaction_id</span>: <span className="text-emerald-400 font-medium">"tx_high_value_foreign"</span>,
                  </div>
                  <div className="pl-6">
                    <span className="text-amber-300">amount</span>: <span className="text-amber-300">180000</span>,
                  </div>
                  <div className="pl-6">
                    <span className="text-amber-300">currency</span>: <span className="text-emerald-400 font-medium">"INR"</span>,
                  </div>
                  <div className="pl-6">
                    <span className="text-amber-300">channel</span>: <span className="text-emerald-400 font-medium">"web"</span>
                  </div>
                  <div className="mt-2 text-white">
                    &#125;);
                  </div>
               </div>
            </div>

            {/* DECISION NODE */}
            <div className="bg-[#0f172a]/95 backdrop-blur-3xl rounded-[32px] border border-white/5 p-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]">
               <div className="flex justify-between items-start mb-12">
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                       Decision Engine <ChevronRight className="w-3 h-3 text-slate-700" />
                    </div>
                    <div className={`text-[42px] font-black uppercase tracking-tight leading-none ${active.values.verdict === 'BLOCK' ? 'text-[#ef4444]' : 'text-emerald-400'}`}>
                       {active.values.verdict}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 opacity-80">Risk Score</div>
                    <div className="text-[72px] font-black text-white tracking-tighter leading-none">
                      {active.values.score}<span className="text-3xl text-slate-600 ml-1">%</span>
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="bg-[#020610] border border-white/5 rounded-2xl p-5 shadow-inner">
                     <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-blue-500" /> Latency
                     </div>
                     <div className="text-3xl font-black text-white italic tracking-tighter">35ms</div>
                  </div>
                  <div className="bg-[#020610] border border-white/5 rounded-2xl p-5 shadow-inner">
                     <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-[#818cf8]" /> Confusion
                     </div>
                     <div className="text-3xl font-black text-white italic tracking-tighter">0.75</div>
                  </div>
               </div>

               {/* FORENSICS ENGINE */}
               <div className="space-y-6">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2 opacity-80">
                     <span className="text-emerald-500 font-black">{'>_'}</span>
                     SHAP Forensics
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div key={activeId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 px-1">
                      {active.forensics.map((f, i) => (
                        <div key={i} className="flex items-center gap-4 py-4 px-6 rounded-2xl bg-[#080c14] border border-white/5 hover:border-white/10 transition-colors">
                           <div className="w-1.5 h-1.5 rounded-full bg-[#818cf8] shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                           <span className="text-[14px] text-slate-400 font-medium leading-relaxed">{f}</span>
                        </div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
               </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
