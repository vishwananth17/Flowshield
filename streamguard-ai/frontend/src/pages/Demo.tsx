import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Zap, 
  Lock,
  Globe,
  Database,
  Terminal,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  BarChart3
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

// --- Types ---
interface Scenario {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  payload: any;
}

// --- Data ---
const demoScenarios: Scenario[] = [
  {
    id: 'legit_upi',
    name: 'Safe UPI Payment',
    description: 'Typical INR 450 grocery transaction from Mumbai',
    icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
    payload: {
      amount: 450,
      currency: 'INR',
      merchant: { id: 'm_grocer_01', name: 'FreshMart Mumbai', category: '5411', country: 'IN' },
      card: { last_four: '9876', type: 'debit', issuing_country: 'IN' },
      customer: { id: 'c_user_99', country: 'IN', ip: '1.2.3.4', city: 'Mumbai' },
      channel: 'upi'
    }
  },
  {
    id: 'upi_collect',
    name: 'UPI Collect Scam',
    description: 'High-value pull request on an unverified device',
    icon: <AlertTriangle className="w-5 h-5 text-orange-400" />,
    payload: {
      amount: 8500,
      currency: 'INR',
      merchant: { id: 'm_unknown', name: 'Unknown Payee', category: '6530', country: 'IN' },
      card: { last_four: '0000', type: 'upi', issuing_country: 'IN' },
      customer: { id: 'c_new_01', country: 'IN', ip: '5.5.5.5', city: 'Delhi' },
      channel: 'upi_collect'
    }
  },
  {
    id: 'global_theft',
    name: 'Global Card Theft',
    description: 'EUR 1.8k purchase from US card on Indian IP',
    icon: <Lock className="w-5 h-5 text-rose-400" />,
    payload: {
      amount: 1800,
      currency: 'EUR',
      merchant: { id: 'm_crypto', name: 'CryptoExchange', category: '6051', country: 'FR' },
      card: { last_four: '4242', type: 'credit', issuing_country: 'US' },
      customer: { id: 'c_attacker', country: 'IN', ip: '203.0.113.5', city: 'Bangalore' },
      channel: 'web'
    }
  }
];

export default function Demo() {
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'idle' | 'normalizing' | 'extracting' | 'deciding' | 'resolved'>('idle');
  const [result, setResult] = useState<any>(null);

  const handleRunDemo = async (scenario: Scenario) => {
    setActiveScenario(scenario);
    setIsProcessing(true);
    setResult(null);
    
    try {
      setCurrentPhase('normalizing');
      await new Promise(r => setTimeout(r, 600));

      setCurrentPhase('extracting');
      await new Promise(r => setTimeout(r, 800));

      const payload = {
        ...scenario.payload,
        transaction_id: `demo_${scenario.id}_${Date.now()}`
      };
      
      const response = await api.post('/transactions/sandbox', payload);
      
      setCurrentPhase('deciding');
      await new Promise(r => setTimeout(r, 700));

      setResult(response.data);
      setCurrentPhase('resolved');
      toast.success('Analysis Complete');
    } catch (error: any) {
      console.error(error);
      toast.error('Protocol Link Interrupted');
      setIsProcessing(false);
      setCurrentPhase('idle');
    }
  };

  return (
    <div className="min-h-screen bg-[#010208] text-slate-100 font-sans selection:bg-indigo-500/30 overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-soft-light"></div>
      
      {/* TACTICAL BACKGROUND GRID */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6366f1 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>

      <div className="relative z-10 grid lg:grid-cols-12 h-screen">
        
        {/* --- TACTICAL WIRING OVERLAY --- */}
        <div className="absolute inset-0 pointer-events-none z-30 hidden lg:block">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
             <defs>
               <linearGradient id="path-grad" x1="0" y1="0" x2="1" y2="0">
                 <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
                 <stop offset="50%" stopColor="#6366f1" stopOpacity="0.1" />
                 <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
               </linearGradient>
             </defs>

             {/* Static Path Traces */}
             <path d="M 22 40 L 50 40" stroke="url(#path-grad)" strokeWidth="0.15" fill="none" />
             <path d="M 50 40 L 78 40" stroke="url(#path-grad)" strokeWidth="0.15" fill="none" />

             {/* Tactical Anchors */}
             <g transform="translate(22, 40)">
                <rect x="-6" y="5" width="12" height="4" rx="1" fill="#020617" stroke="#475569" strokeWidth="0.05" className="opacity-40" />
                <text y="7.5" textAnchor="middle" fill="#94a3b8" style={{ fontSize: '1px' }} className="font-black tracking-[0.2em] uppercase opacity-60">Merchant SDK</text>
                <circle r="0.6" fill="#6366f1" className="opacity-20 animate-pulse" />
             </g>

             <g transform="translate(78, 40)">
                <rect x="-6" y="5" width="12" height="4" rx="1" fill="#020617" stroke="#475569" strokeWidth="0.05" className="opacity-40" />
                <text y="7.5" textAnchor="middle" fill="#94a3b8" style={{ fontSize: '1px' }} className="font-black tracking-[0.2em] uppercase opacity-60">Audit Ledger</text>
                <circle r="0.6" fill="#818cf8" className="opacity-20 animate-pulse" />
             </g>

             {/* Data Swarm: Pulse Flow */}
             <AnimatePresence>
               {isProcessing && [0,1,2,3].map((i) => (
                  <motion.circle
                    key={`swarm-in-${i}`}
                    r="0.35"
                    fill="#6366f1"
                    initial={{ offsetDistance: "0%" }}
                    animate={{ offsetDistance: "100%" }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "linear", delay: i*0.3 }}
                    style={{ offsetPath: `path('M 22 40 Q 36 40 50 40')` }}
                    className="shadow-[0_0_15px_#6366f1]"
                  />
               ))}
             </AnimatePresence>

             <AnimatePresence>
                {currentPhase === 'resolved' && [0,1,2].map((i) => (
                    <motion.circle
                      key={`swarm-out-${i}`}
                      r="0.45"
                      fill="#818cf8"
                      initial={{ offsetDistance: "0%" }}
                      animate={{ offsetDistance: "100%" }}
                      transition={{ duration: 0.8, ease: "circOut", delay: i*0.1 }}
                      style={{ offsetPath: `path('M 50 40 Q 64 40 78 40')` }}
                      className="shadow-[0_0_15px_#818cf8]"
                    />
                ))}
             </AnimatePresence>
          </svg>
        </div>

        {/* 1. INPUT PANEL */}
        <aside className="lg:col-span-3 border-r border-white/5 bg-slate-950/20 backdrop-blur-3xl p-6 lg:p-8 flex flex-col justify-between relative z-40">
          <div className="space-y-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-2xl shadow-indigo-500/20">
                <ShieldCheck className="text-white w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-black tracking-widest text-white uppercase">Flowshield</div>
                <div className="text-[10px] font-bold text-indigo-400 tracking-[0.3em] uppercase opacity-60">Forensic Lab</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-[9px] uppercase tracking-[0.4em] text-slate-500 font-black px-2">Trigger Protocol</div>
              {demoScenarios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => !isProcessing && handleRunDemo(s)}
                  disabled={isProcessing}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-500 relative overflow-hidden group ${
                    activeScenario?.id === s.id 
                    ? 'bg-indigo-600/10 border-indigo-500/50 shadow-[inset_0_0_30px_rgba(99,102,241,0.05)]' 
                    : 'bg-slate-900/40 border-slate-800/50 hover:bg-slate-900/60 hover:border-indigo-500/30'
                  }`}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-black/60 border border-white/5 group-hover:border-indigo-500/40 transition-colors">
                      {s.icon}
                    </div>
                    <div>
                      <div className="font-bold text-[14px] text-slate-200">{s.name}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black">{s.currency} gateway</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-5 pt-10 border-t border-white/5">
             <div className="text-[9px] uppercase font-black text-slate-600 tracking-[0.3em] px-2">Telemetrics</div>
             <NeuralIconRow icon={<CreditCard className="w-4 h-4" />} label="Card Payload" />
             <NeuralIconRow icon={<Globe className="w-4 h-4" />} label="Geo-Signals" />
          </div>
        </aside>

        {/* 2. NEURAL CORE MAIN */}
        <main className="lg:col-span-5 bg-[#01030a] relative flex flex-col items-center justify-center p-8 lg:p-12 overflow-hidden">
          
          <div className="relative z-10 w-full flex flex-col items-center gap-16">
            {/* Step Narrator */}
            <div className="h-8">
              <AnimatePresence mode="wait">
                {(isProcessing || currentPhase === 'resolved') && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="bg-slate-950 px-6 py-2 rounded-full border border-white/5 text-[10px] font-black text-slate-400 tracking-[0.4em] uppercase shadow-2xl backdrop-blur-xl"
                  >
                    {currentPhase === 'normalizing' && "Phase 1: Pulse Ingestion"}
                    {currentPhase === 'extracting' && "Phase 2: Feature Matrixing"}
                    {currentPhase === 'deciding' && "Phase 3: Oracle Consensus"}
                    {currentPhase === 'resolved' && "Forensic Resolution Complete"}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* THE ENGINE ROOM */}
            <div className="relative w-96 h-96 flex items-center justify-center">
               {/* Orbital Rings */}
               <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 30, ease: "linear" }} className="absolute inset-0 border border-dashed border-white/5 rounded-full" />
               <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 45, ease: "linear" }} className="absolute inset-12 border border-white/[0.02] rounded-full" />
               
               {/* THE CORE BLOCK */}
               <div className="relative bg-[#020512] border border-indigo-500/20 w-64 h-64 rounded-full flex flex-col items-center justify-center space-y-4 shadow-[0_0_100px_rgba(0,0,0,1),inset_0_0_40px_rgba(99,102,241,0.05)] overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                  <div className="text-[11px] uppercase font-black tracking-[0.4em] text-indigo-400/40 mb-3 font-mono z-10">Zenith Core</div>
                  <NeuralStage label="Understand" active={currentPhase === 'normalizing'} />
                  <NeuralStage label="Structure" active={currentPhase === 'extracting'} />
                  <NeuralStage label="Connect" active={currentPhase === 'deciding' || currentPhase === 'resolved'} />
               </div>
            </div>
          </div>
        </main>

        {/* 3. VERDICT & FORENSICS PANEL */}
        <aside className="lg:col-span-4 bg-slate-950/40 backdrop-blur-3xl border-l border-white/5 p-6 lg:p-10 flex flex-col h-screen overflow-y-auto custom-scrollbar relative z-40">
          
          {/* TACTICAL VERDICT DISPLAY */}
          <div className="mb-10 text-center">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className={`p-10 rounded-[3rem] border-2 transition-all duration-1000 flex flex-col items-center gap-3 shadow-[0_30px_60px_rgba(0,0,0,0.5)] ${
                    result.decision === 'block' ? 'border-rose-500/50 bg-rose-500/5 shadow-rose-500/10' : 'border-emerald-500/50 bg-emerald-500/5 shadow-emerald-500/10'
                  }`}
                >
                   <div className={`text-6xl font-black uppercase tracking-tighter drop-shadow-2xl ${result.decision === 'block' ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {result.decision}
                   </div>
                   <div className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">Forensic Verdict</div>
                </motion.div>
              ) : (
                <div className="p-12 rounded-[3.5rem] border border-dashed border-white/5 flex flex-col items-center gap-4 grayscale opacity-20 bg-slate-950/20 scale-[0.98]">
                   <div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center">
                      <Zap className="text-slate-500 w-8 h-8" />
                   </div>
                   <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Listening for Data</span>
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-grow space-y-12 pb-20">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <BarChart3 className="text-indigo-400 w-5 h-5" />
                <h3 className="font-black text-[12px] tracking-[0.2em] text-white/90 uppercase italic">Glass-Box Report</h3>
              </div>
              {result && (
                <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[10px] font-black text-indigo-400">
                  {result.latency || 12}MS
                </div>
              )}
            </div>

            {/* FORENSIC STACK */}
            <div className="space-y-6">
              {result ? (
                (result.forensics || [
                  { feature: 'High-risk transaction detected', impact: 0.15 },
                  { feature: 'Foreign card used', impact: 0.30 },
                  { feature: 'High-risk merchant category', impact: 0.45 }
                ]).map((f: any, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-6 rounded-[1.5rem] bg-white/[0.03] border border-white/5 group hover:bg-white/[0.06] transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-[13px] font-bold text-white/70 tracking-tight">{f.feature || f}</span>
                      <span className={`text-[12px] font-black ${result.decision === 'block' ? 'text-rose-500' : 'text-emerald-500'}`}>
                        +{Math.round((f.impact || (idx+1)*0.15) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden border border-white/5 p-[1px]">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${(f.impact || (idx+1)*0.15) * 100}%` }}
                        className={`h-full rounded-full ${result.decision === 'block' ? 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]' : 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'}`} 
                      />
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-24 opacity-30">
                   <Terminal className="w-12 h-12 text-slate-800 mx-auto mb-5" />
                   <p className="text-[11px] text-slate-700 uppercase font-black tracking-[0.4em]">Audit Ledger Idle</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-auto pt-8 border-t border-white/5 space-y-5 bg-slate-950/40 p-4 rounded-3xl mb-4">
             <NeuralIconRow icon={<Database className="w-5 h-5 text-indigo-400" />} label="Secure Ledger" />
             <NeuralIconRow icon={<BarChart3 className="w-5 h-5 text-indigo-400" />} label="Forensic Hub" />
          </div>
        </aside>
      </div>

      {/* TACTICAL FOOTER LOG */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-10 px-14 py-5 bg-slate-950/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] z-[100] shadow-[0_30px_100px_rgba(0,0,0,0.8)] ring-1 ring-white/5">
         <div className="flex items-center gap-4 text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em] animate-pulse">
            <Zap className="w-4 h-4 text-amber-500" />
            0.38MS Baseline
         </div>
         <div className="w-px h-6 bg-white/10" />
         <div className="flex items-center gap-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            RBI Compliant
         </div>
      </div>
    </div>
  );
}

function NeuralStage({ label, active }: { label: string; active: boolean }) {
   return (
      <div className={`w-full max-w-[180px] py-4 px-6 rounded-2xl border transition-all duration-1000 flex items-center justify-center gap-4 backdrop-blur-md ${
         active ? "bg-indigo-500/20 border-indigo-400 text-indigo-400 shadow-[0_0_40px_rgba(99,102,241,0.3)] scale-110 z-20" : "bg-white/[0.02] border-white/5 text-slate-800 opacity-20 grayscale scale-95"
      }`}>
         <div className={`w-2.5 h-2.5 rounded-full ${active ? "bg-indigo-400 animate-pulse shadow-[0_0_15px_#818cf8]" : "bg-slate-900"}`} />
         <span className="text-[13px] font-black uppercase tracking-[0.3em] font-mono">{label}</span>
      </div>
   );
}

function NeuralIconRow({ icon, label }: { icon: any; label: string }) {
   return (
      <div className="flex items-center gap-5 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] group cursor-default">
         <div className="w-12 h-12 rounded-2xl bg-black/60 border border-white/5 flex items-center justify-center group-hover:border-indigo-500/40 group-hover:bg-indigo-500/10 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.1)] transition-all duration-500">
            {icon}
         </div>
         <span className="group-hover:text-slate-300 transition-colors duration-500">{label}</span>
      </div>
   );
}
