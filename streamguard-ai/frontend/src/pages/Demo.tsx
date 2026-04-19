import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Terminal, 
  Activity, 
  AlertTriangle, 
  ChevronRight,
  Globe,
  Zap,
  ShieldQuestion
} from 'lucide-react';
import { toast } from 'sonner';

// --- Simulation Data ---
const SCENARIOS = [
  {
    id: 'SAFE_UPI',
    name: 'Safe UPI Payment',
    description: 'Typical ₹450 grocery transaction from Mumbai',
    icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
    amount: '450',
    currency: 'INR',
    verdict: 'ALLOW',
    score: '0.02',
    latency: '12ms',
    confusion: '0.99',
    forensics: [
      'Device fingerprint verified (sandbox)',
      'Spending pattern matches historical baseline',
      'Merchant category reputation: Trusted'
    ]
  },
  {
    id: 'COLLECT_SCAM',
    name: 'UPI Collect Scam',
    description: 'High-value pull request on a new device',
    icon: <Activity className="w-5 h-5 text-amber-500" />,
    amount: '15,000',
    currency: 'INR',
    verdict: 'BLOCK',
    score: '72.4',
    latency: '24ms',
    confusion: '0.88',
    forensics: [
      'Unverified pull request source detected',
      'New device tenure (< 2h since first seen)',
      'Account velocity spike (3x normal volume)'
    ]
  },
  {
    id: 'GLOBAL_THEFT',
    name: 'Global Card Theft',
    description: '₹1.8L purchase from US card on Indian IP',
    icon: <Lock className="w-5 h-5 text-rose-500" />,
    amount: '180,000',
    currency: 'INR',
    verdict: 'BLOCK',
    score: '87.0',
    latency: '35ms',
    confusion: '0.75',
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
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <main className="max-w-6xl mx-auto px-6 py-20 relative z-10">
        
        {/* HEADER SECTION */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            Try the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500">Glass-Box AI</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Experience the precision of the MVIForest ensemble. Select a pattern below to see how our forensics engine decomposes fraud signals in real-time.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          
          {/* LEFT: SCENARIO SELECTION */}
          <div className="space-y-4">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveId(s.id)}
                className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 group ${
                  activeId === s.id 
                  ? 'bg-slate-900 border-indigo-500/50 shadow-xl' 
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-black/40 border border-white/5`}>
                      {s.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{s.name}</h3>
                      <p className="text-sm text-slate-500">{s.description}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-slate-700 group-hover:text-slate-400 transition-colors ${activeId === s.id ? 'translate-x-1 text-indigo-400' : ''}`} />
                </div>
              </button>
            ))}

            {/* TRUST BADGES FOOTER */}
            <div className="pt-10 flex items-center gap-6 opacity-40">
               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                  <Globe className="w-3.5 h-3.5" />
                  Global Markets Support
               </div>
               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  {'<'}50ms Latency
               </div>
               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  DPDP Compliant
               </div>
            </div>
          </div>

          {/* RIGHT: ENGINE VERDICT (GLASS BOX) */}
          <div className="space-y-6">
            
            {/* CODE SNIPPET BLOCK */}
            <div className="bg-[#0f172a] rounded-2xl border border-slate-800/50 p-6 font-mono text-[13px] relative overflow-hidden shadow-2xl">
               <div className="flex gap-1.5 mb-6">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
               </div>
               <div className="space-y-1">
                  <div className="text-indigo-400">await <span className="text-slate-200">flowshield.analyze(&#123;</span></div>
                  <div className="pl-6">
                    <span className="text-amber-400">transaction_id</span>: <span className="text-emerald-400">"tx_high_value_foreign"</span>,
                  </div>
                  <div className="pl-6">
                    <span className="text-amber-400">amount</span>: <span className="text-amber-500">{active.amount}</span>,
                  </div>
                  <div className="pl-6">
                    <span className="text-amber-400">currency</span>: <span className="text-emerald-400">"{active.currency}"</span>,
                  </div>
                  <div className="pl-6">
                    <span className="text-amber-400">channel</span>: <span className="text-emerald-400">"web"</span>
                  </div>
                  <div className="text-slate-200">&#125;);</div>
               </div>
            </div>

            {/* DECISION ENGINE CARD */}
            <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-8 shadow-2xl">
               <div className="flex justify-between items-start mb-10">
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                       Decision Engine <ChevronRight className="w-3 h-3" />
                    </div>
                    <div className={`text-5xl font-black uppercase tracking-tighter ${active.verdict === 'BLOCK' ? 'text-rose-500' : 'text-emerald-400'}`}>
                       {active.verdict}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Risk Score</div>
                    <div className="text-4xl font-black text-white">{active.score}<span className="text-xl text-slate-600">%</span></div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="bg-slate-900/50 border border-white/5 rounded-xl p-4">
                     <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-indigo-400" /> Latency
                     </div>
                     <div className="text-lg font-bold text-slate-200">{active.latency}</div>
                  </div>
                  <div className="bg-slate-900/50 border border-white/5 rounded-xl p-4">
                     <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <Activity className="w-3 h-3 text-indigo-400" /> Confusion
                     </div>
                     <div className="text-lg font-bold text-slate-200">{active.confusion}</div>
                  </div>
               </div>

               {/* SHAP FORENSICS */}
               <div className="space-y-4">
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                     <div className="w-4 h-[1px] bg-indigo-500/30" />
                     SHAP Forensics
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={activeId}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      {active.forensics.map((f, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/30 border border-white/5">
                           <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/60 shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
                           <span className="text-xs text-slate-300 font-medium">{f}</span>
                        </div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
               </div>
            </div>

          </div>

        </div>
      </main>

      {/* FOOTER NAV (OPTIONAL) */}
      <footer className="absolute bottom-8 left-8">
         <div className="flex items-center gap-2 opacity-20">
            <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded">
               <Terminal className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white">Consolidated Terminal</span>
         </div>
      </footer>
    </div>
  );
}
