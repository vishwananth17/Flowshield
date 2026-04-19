import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Search, 
  Bell, 
  User, 
  ChevronRight, 
  Globe, 
  Zap, 
  Command,
  LayoutGrid,
  ShieldAlert,
  Lock,
  Activity,
  Terminal
} from 'lucide-react';

const SCENARIOS = [
  {
    id: 'SAFE_UPI',
    name: 'Safe UPI Payment',
    description: 'Typical ₹450 grocery transaction from Mumbai',
    icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
    values: { amount: 180000, verdict: 'ALLOW', score: '0.02', status: 'SAFE' },
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
    icon: <Activity className="w-5 h-5 text-amber-500" />,
    values: { amount: 15000, verdict: 'BLOCK', score: '72.4', status: 'FRAUD' },
    forensics: [
      'Unverified pull request source detected',
      'Device tenure < 2h since first seen',
      'High velocity spike detected for this account'
    ]
  },
  {
    id: 'GLOBAL_THEFT',
    name: 'Global Card Theft',
    description: '₹1.8L purchase from US card on Indian IP',
    icon: <Lock className="w-5 h-5 text-rose-500" />,
    values: { amount: 180000, verdict: 'BLOCK', score: '87.0', status: 'CRITICAL' },
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
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none" />

      {/* 1. EXACT HEADER (MIRROR) */}
      <nav className="h-14 border-b border-white/5 bg-[#050810]/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-8">
           <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
                 <ShieldCheck className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight">Flowshield AI</span>
           </div>
           
           <div className="flex items-center gap-6 text-[#64748b]">
              <LayoutGrid className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
           </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
              <input 
                disabled 
                type="text" 
                placeholder="Search transactions, alerts..." 
                className="bg-[#0f172a] border border-white/5 rounded-md py-1.5 pl-10 pr-4 text-xs w-64 focus:outline-none" 
              />
           </div>

           <div className="flex items-center gap-4">
              <div className="bg-[#0f172a] border border-blue-500/30 px-3 py-1 rounded-full flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                 <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Verify it's you</span>
              </div>
              <div className="flex items-center gap-3">
                 <Bell className="w-4 h-4 text-[#475569] hover:text-white cursor-pointer" />
                 <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold">V</div>
              </div>
           </div>
        </div>
      </nav>

      {/* SCREENSHOT MAIN CONTENT */}
      <main className="max-w-6xl mx-auto px-6 py-20 relative z-10">
        
        <div className="text-center mb-16">
          <h1 className="text-[52px] font-bold tracking-tight mb-4">
            Try the <span className="text-indigo-400">Glass-Box AI</span>
          </h1>
          <p className="text-[#64748b] text-lg max-w-xl mx-auto font-medium">
            Experience the precision of the MVIForest ensemble. Select a pattern below to see how our forensics engine decomposes fraud signals in real-time.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          
          {/* LEFT: SCENARIOS */}
          <div className="space-y-4">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveId(s.id)}
                className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 group ${
                  activeId === s.id 
                  ? 'bg-[#0f172a] border-indigo-500/40 shadow-2xl' 
                  : 'bg-[#0f172a]/30 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className={`p-3 rounded-xl bg-black/40 border border-white/5`}>
                      {s.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{s.name}</h3>
                      <p className="text-[13px] text-[#475569]">{s.description}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-[#334155] group-hover:text-slate-400 transition-transform ${activeId === s.id ? 'translate-x-1 text-indigo-400' : ''}`} />
                </div>
              </button>
            ))}

            {/* SCREENSHOT FOOTER */}
            <div className="pt-10 flex items-center gap-8 opacity-60">
               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#64748b]">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  Global Markets Support
               </div>
               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#64748b]">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  {'<'}50ms Latency
               </div>
               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#64748b]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  DPDP Compliant
               </div>
            </div>
          </div>

          {/* RIGHT: ENGINE (MATCHED SYNTAX) */}
          <div className="space-y-6">
            
            {/* CODE SNIPPET (EXACT COLORS) */}
            <div className="bg-[#020617] rounded-3xl border border-white/5 p-8 font-mono text-[14px] leading-relaxed shadow-3xl">
               <div className="space-y-1">
                  <div>
                    <span className="text-[#f43f5e]">await</span> <span className="text-[#f8fafc]">flowshield.analyze(&#123;</span>
                  </div>
                  <div className="pl-6">
                    <span className="text-amber-300">transaction_id</span>: <span className="text-[#10b981]">"tx_high_value_foreign"</span>,
                  </div>
                  <div className="pl-6">
                    <span className="text-amber-300">amount</span>: <span className="text-amber-500">{active.values.amount}</span>,
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

            {/* ENGINE CARD (EXACT REPLIC) */}
            <div className="bg-[#0f172a] rounded-3xl border border-white/5 p-8 shadow-2xl relative overflow-hidden">
               <div className="flex justify-between items-start mb-12">
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-[#475569] uppercase tracking-widest flex items-center gap-2">
                       Decision Engine <ChevronRight className="w-3 h-3" />
                    </div>
                    <div className={`text-6xl font-black uppercase tracking-tighter ${active.values.verdict === 'BLOCK' ? 'text-[#ef4444]' : 'text-emerald-400'}`}>
                       {active.values.verdict}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-[#475569] uppercase tracking-widest mb-1">Risk Score</div>
                    <div className="text-[44px] font-black">{active.values.score}<span className="text-[20px] text-[#334155] ml-0.5">%</span></div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="bg-[#020617] border border-white/5 rounded-2xl p-4 flex flex-col gap-1">
                     <div className="text-[9px] font-bold text-[#475569] uppercase tracking-widest flex items-center gap-2">
                        <Zap className="w-3 h-3 text-indigo-400" /> Latency
                     </div>
                     <div className="text-xl font-bold text-slate-200">35ms</div>
                  </div>
                  <div className="bg-[#020617] border border-white/5 rounded-2xl p-4 flex flex-col gap-1">
                     <div className="text-[9px] font-bold text-[#475569] uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-3 h-3 text-indigo-400" /> Confusion
                     </div>
                     <div className="text-xl font-bold text-slate-200">0.75</div>
                  </div>
               </div>

               {/* FORENSICS (BULLETS) */}
               <div className="space-y-5">
                  <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                     <ChevronRight className="w-4 h-4" />
                     SHAP Forensics
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={activeId}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      {active.forensics.map((f, i) => (
                        <div key={i} className="flex items-center gap-4 py-3.5 px-5 rounded-2xl bg-[#020617]/50 border border-white/5">
                           <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                           <span className="text-[13px] text-slate-400 font-medium">{f}</span>
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
