import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  ChevronRight, 
  Globe, 
  Zap, 
  Lock,
  Activity
} from 'lucide-react';

const SCENARIOS = [
  {
    id: 'SAFE_UPI',
    name: 'Safe UPI Payment',
    description: 'Typical ₹450 grocery transaction from Mumbai',
    icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
    values: { amount: 180000, verdict: 'ALLOW', score: '0.02' },
    forensics: [
      'High-risk transaction detected (sandbox demo)',
      'Spending pattern matches historical baseline',
      'Merchant reputation score: 98/100'
    ]
  },
  {
    id: 'COLLECT_SCAM',
    name: 'UPI Collect Scam',
    description: 'High-value pull request on a new device',
    icon: <Activity className="w-5 h-5 text-amber-500" />,
    values: { amount: 15000, verdict: 'BLOCK', score: '72.4' },
    forensics: [
      'Unverified pull request source detected',
      'New device tenure (< 2h since first seen)',
      'Account velocity spike detected (3x normal)'
    ]
  },
  {
    id: 'GLOBAL_THEFT',
    name: 'Global Card Theft',
    description: '₹1.8L purchase from US card on Indian IP',
    icon: <Lock className="w-5 h-5 text-rose-500" />,
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
    <div className="min-h-screen bg-[#020610] text-[#f8fafc] font-sans selection:bg-blue-500/30 overflow-hidden relative py-24">
      {/* Visual Ambiance */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none" />

      <main className="max-w-6xl mx-auto px-8 relative z-10">
        
        {/* HEADER */}
        <div className="text-center mb-24">
          <h1 className="text-[52px] font-bold tracking-tight mb-6">
            Try the <span className="text-indigo-400">Glass-Box AI</span>
          </h1>
          <p className="text-[#64748b] text-xl max-w-2xl mx-auto font-medium">
            Experience the precision of the MVIForest ensemble. Select a pattern below to see how our forensics engine decomposes fraud signals in real-time.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-16">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-5 space-y-4">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveId(s.id)}
                className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 group ${
                  activeId === s.id 
                  ? 'bg-[#0f172a] border-indigo-500/40 shadow-2xl' 
                  : 'bg-[#0a0f1e]/40 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-black/40 border border-white/5`}>
                      {s.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-none mb-2">{s.name}</h3>
                      <p className="text-[13px] text-[#475569]">{s.description}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-[#334155] group-hover:text-slate-400 transition-transform ${activeId === s.id ? 'translate-x-1 text-indigo-400' : ''}`} />
                </div>
              </button>
            ))}

            <div className="pt-16 flex items-center gap-10 opacity-60">
               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#475569]">
                  <Globe className="w-3.5 h-3.5 text-blue-500" />
                  Global Markets Support
               </div>
               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#475569]">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  {'<'}50ms Latency
               </div>
               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#475569]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  DPDP Compliant
               </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* CODE BOX */}
            <div className="bg-[#050814] rounded-3xl border border-white/5 p-8 font-mono text-[14px] leading-relaxed shadow-3xl">
               <div className="space-y-1">
                  <div>
                    <span className="text-[#f43f5e]">await</span> <span className="text-[#f8fafc]">flowshield.analyze(&#123;</span>
                  </div>
                  <div className="pl-6">
                    <span className="text-amber-300">transaction_id</span>: <span className="text-[#10b981]">"tx_high_value_foreign"</span>,
                  </div>
                  <div className="pl-6">
                    <span className="text-amber-300">amount</span>: <span className="text-amber-400">{active.values.amount}</span>,
                  </div>
                  <div className="pl-6">
                    <span className="text-amber-300">currency</span>: <span className="text-[#10b981]">"INR"</span>,
                  </div>
                  <div className="pl-6">
                    <span className="text-amber-300">channel</span>: <span className="text-[#10b981]">"web"</span>
                  </div>
                  <div>
                    <span className="text-[#f8fafc]">&#125;);</span>
                  </div>
               </div>
            </div>

            {/* DECISION CARD */}
            <div className="bg-[#050814] rounded-3xl border border-white/5 p-10 shadow-3xl pt-12">
               <div className="flex justify-between items-baseline mb-16">
                  <div>
                    <div className="text-[11px] font-bold text-[#475569] uppercase tracking-widest mb-3 flex items-center gap-2">
                       Decision Engine <ChevronRight className="w-3 h-3 text-indigo-500" />
                    </div>
                    <div className={`text-8xl font-black uppercase tracking-tighter ${active.values.verdict === 'BLOCK' ? 'text-[#ef4444]' : 'text-emerald-400'}`}>
                       {active.values.verdict}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-bold text-[#475569] uppercase tracking-widest mb-2 font-black">Risk Score</div>
                    <div className="text-7xl font-black text-white">{active.score}<span className="text-[24px] text-[#334155] ml-1">%</span></div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-6 mb-12">
                  <div className="bg-[#020610] border border-white/5 rounded-2xl p-5">
                     <div className="text-[10px] font-bold text-[#475569] uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-indigo-500" /> Latency
                     </div>
                     <div className="text-2xl font-bold text-slate-100 italic">35ms</div>
                  </div>
                  <div className="bg-[#020610] border border-white/5 rounded-2xl p-5">
                     <div className="text-[10px] font-bold text-[#475569] uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-indigo-500" /> Confusion
                     </div>
                     <div className="text-2xl font-bold text-slate-100 italic">0.75</div>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="text-[12px] font-bold text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-2">
                     <ChevronRight className="w-4 h-4" />
                     SHAP Forensics
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={activeId}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="space-y-3"
                    >
                      {active.forensics.map((f, i) => (
                        <div key={i} className="flex items-center gap-4 py-4 px-6 rounded-2xl bg-[#020610]/80 border border-white/5">
                           <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                           <span className="text-[14px] text-[#64748b] font-medium">{f}</span>
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
