import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Zap, 
  Activity, 
  Lock, 
  Globe, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  BarChart3, 
  Terminal,
  Cpu,
  ArrowRight,
  Database,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import { toast } from 'sonner';

// --- Types & Data ---
type SimulationStatus = 'IDLE' | 'PROCESSING' | 'RESOLVED';

interface ForensicReason {
  label: string;
  weight: number;
  type: 'increase' | 'decrease';
}

const SCENARIOS = [
  {
    id: 'SAFE_UPI',
    name: 'Standard UPI Payment',
    details: 'INR 450 Grocery Transaction (Mumbai)',
    icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
    verdict: 'ALLOW',
    risk: 0.02,
    latency: '12ms',
    forensics: [
      { label: 'Device ID Verified', weight: 15, type: 'decrease' },
      { label: 'Historical Merchant Match', weight: 40, type: 'decrease' },
      { label: 'Baseline Velocity', weight: 10, type: 'decrease' }
    ]
  },
  {
    id: 'COLLECT_SCAM',
    name: 'Suspicious Collect Request',
    details: 'High-Value UPI Pull (Unknown Device)',
    icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    verdict: 'BLOCK',
    risk: 0.82,
    latency: '17ms',
    forensics: [
      { label: 'Unverified Request Source', weight: 45, type: 'increase' },
      { label: 'New Device Tenure (< 24h)', weight: 35, type: 'increase' },
      { label: 'Atypical Magnitude shift', weight: 15, type: 'increase' }
    ]
  },
  {
    id: 'TRANS_ATLANTIC',
    name: 'Global Card Theft',
    details: 'EUR 1.8k Transaction (US Card/IN IP)',
    icon: <Lock className="w-5 h-5 text-rose-500" />,
    verdict: 'BLOCK',
    risk: 0.98,
    latency: '22ms',
    forensics: [
      { label: 'Geographic IP Discrepancy', weight: 55, type: 'increase' },
      { label: 'High-Risk MCC (Crypto)', weight: 25, type: 'increase' },
      { label: 'Velocity Limit Breach', weight: 10, type: 'increase' }
    ]
  }
];

export default function Demo() {
  const [status, setStatus] = useState<SimulationStatus>('IDLE');
  const [activeScenario, setActiveScenario] = useState<typeof SCENARIOS[0] | null>(null);
  const [processingStep, setProcessingStep] = useState('');

  const runSimulation = async (scenario: typeof SCENARIOS[0]) => {
    setActiveScenario(scenario);
    setStatus('PROCESSING');
    
    // Simulation sequence
    setProcessingStep('Initializing normalization...');
    await new Promise(r => setTimeout(r, 600));
    setProcessingStep('Vectorizing payloads...');
    await new Promise(r => setTimeout(r, 700));
    setProcessingStep('Neural consensus...');
    await new Promise(r => setTimeout(r, 500));
    
    setStatus('RESOLVED');
    toast.success('Forensic Verdict Rendered');
  };

  const handleReset = () => {
    setStatus('IDLE');
    setActiveScenario(null);
    setProcessingStep('');
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* HEADER HUD */}
      <nav className="border-b border-white/5 bg-slate-950/50 backdrop-blur-3xl sticky top-0 z-50 px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
           <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                <ShieldCheck className="text-white w-5 h-5 transition-transform group-hover:scale-110" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tighter uppercase italic leading-none">Flowshield</span>
                <span className="text-[9px] font-bold text-indigo-400 tracking-[0.3em] uppercase">Zenith Module v4.0</span>
              </div>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                 <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                 0.38MS Baseline
              </div>
              <button 
                onClick={handleReset}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10"
              >
                <RefreshCw className="w-4 h-4 text-slate-500" />
              </button>
           </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-8 h-[calc(100vh-80px)] max-h-[900px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
          
          {/* 1. LEFT: SCENARIOS */}
          <aside className="lg:col-span-3 flex flex-col gap-6 relative z-10">
            <div className="space-y-1">
              <h2 className="text-[10px] font-black text-indigo-400/60 uppercase tracking-[0.4em]">Forensic Lab</h2>
              <p className="text-xl font-bold text-white tracking-tight">Trigger Protocol</p>
            </div>

            <div className="space-y-4">
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  disabled={status === 'PROCESSING'}
                  onClick={() => runSimulation(s)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-500 group relative overflow-hidden ${
                    activeScenario?.id === s.id 
                    ? 'bg-indigo-600/10 border-indigo-500/50 shadow-[inset_0_0_30px_rgba(99,102,241,0.1)]' 
                    : 'bg-slate-900/40 border-white/5 hover:border-indigo-500/30'
                  }`}
                >
                   <div className="flex items-center gap-4 relative z-10">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-black/60 border border-white/5 group-hover:border-indigo-500/40 transition-colors`}>
                         {s.icon}
                      </div>
                      <div>
                        <div className="font-bold text-[14px] text-slate-100">{s.name}</div>
                        <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest leading-none mt-1">{s.id.split('_')[0]} Pulse</div>
                      </div>
                   </div>
                </button>
              ))}
            </div>

            <div className="mt-auto p-6 rounded-2xl bg-indigo-950/20 border border-indigo-500/10 space-y-4">
               <div className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-400">Node Performance</div>
               <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">Accuracy</span>
                  <span className="text-[11px] font-black text-emerald-400">99.8%</span>
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">SLA</span>
                  <span className="text-[11px] font-black text-indigo-400">{'<'}50ms</span>
               </div>
            </div>
          </aside>

          {/* 2. CENTER: THE ENGINE CORE */}
          <section className="lg:col-span-5 relative flex flex-col items-center justify-center p-8 bg-slate-900/20 border border-white/5 rounded-[3rem] shadow-2xl overflow-hidden group">
             
             {/* PERMANENT WIRING PATHS */}
             <div className="absolute inset-0 pointer-events-none z-10 opacity-40">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                   {/* Main Data Veins */}
                   <path d="M 0 50 L 100 50" stroke="rgba(99,102,241,0.1)" strokeWidth="0.1" fill="none" />
                   
                   {/* Infrastructure Brackets */}
                   <g transform="translate(15, 60)">
                      <rect x="-10" y="-4" width="20" height="8" rx="2" fill="#020617" stroke="rgba(99,102,241,0.2)" strokeWidth="0.2" />
                      <text textAnchor="middle" y="1" fill="#4f46e5" style={{ fontSize: '1.5px' }} className="font-black uppercase tracking-widest">Merchant SDK</text>
                   </g>

                   <g transform="translate(85, 60)">
                      <rect x="-10" y="-4" width="20" height="8" rx="2" fill="#020617" stroke="rgba(99,102,241,0.2)" strokeWidth="0.2" />
                      <text textAnchor="middle" y="1" fill="#4f46e5" style={{ fontSize: '1.5px' }} className="font-black uppercase tracking-widest">Audit Ledger</text>
                   </g>

                   {/* Data Packet Pulses */}
                   <AnimatePresence>
                     {status === 'PROCESSING' && (
                        <motion.circle
                          r="0.5" fill="#818cf8"
                          initial={{ offsetDistance: "0%" }} animate={{ offsetDistance: "50%" }}
                          transition={{ duration: 0.5, ease: "easeIn" }}
                          style={{ offsetPath: `path('M 0 50 L 100 50')` }}
                          className="shadow-[0_0_20px_#818cf8]"
                        />
                     )}
                     {status === 'RESOLVED' && (
                        <motion.circle
                          r="0.8" 
                          fill={activeScenario?.verdict === 'BLOCK' ? '#f43f5e' : '#10b981'}
                          initial={{ offsetDistance: "55%" }} animate={{ offsetDistance: "100%" }}
                          transition={{ duration: 0.6, ease: "circOut" }}
                          style={{ offsetPath: `path('M 0 50 L 100 50')` }}
                        />
                     )}
                   </AnimatePresence>
                </svg>
             </div>

             <div className="relative z-20 flex flex-col items-center gap-14">
                <div className="h-6">
                  <AnimatePresence mode="wait">
                    {status === 'PROCESSING' && (
                      <motion.div
                        key={processingStep}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.6em]"
                      >
                        {processingStep}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* THE CORE CIRCLE */}
                <div className="relative w-80 h-80 flex items-center justify-center">
                   <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }} className="absolute inset-0 border border-dashed border-white/5 rounded-full" />
                   <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 40, ease: "linear" }} className="absolute inset-16 border border-indigo-500/5 rounded-full" />
                   
                   <div className="relative bg-[#020617] border border-indigo-500/20 w-56 h-56 rounded-full flex flex-col items-center justify-center space-y-4 shadow-[0_0_100px_rgba(79,70,229,0.1),inset_0_0_40px_rgba(99,102,241,0.05)] overflow-hidden">
                      <div className="absolute top-10 text-[9px] font-black text-indigo-400/40 uppercase tracking-[0.5em]">Neural Center</div>
                      
                      {status === 'RESOLVED' ? (
                         <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-4">
                            <CheckCircle2 className={`w-16 h-16 ${activeScenario?.verdict === 'BLOCK' ? 'text-rose-500' : 'text-emerald-500'} drop-shadow-[0_0_20px_currentColor]`} />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Analysis Ready</span>
                         </motion.div>
                      ) : (
                         <div className="flex flex-col items-center gap-6">
                            <div className="flex gap-2">
                               {[0,1,2].map(i => (
                                 <motion.div 
                                    key={i} animate={status === 'PROCESSING' ? { height: [10, 30, 10] } : {}}
                                    transition={{ repeat: Infinity, duration: 0.8, delay: i*0.2 }}
                                    className={`w-1 rounded-full ${status === 'PROCESSING' ? 'bg-indigo-500' : 'bg-slate-800'}`} 
                                    style={{ height: 10 }}
                                 />
                               ))}
                            </div>
                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.5em]">Standby</span>
                         </div>
                      )}
                   </div>
                </div>
             </div>
          </section>

          {/* 3. RIGHT: FORENSICS */}
          <aside className="lg:col-span-4 flex flex-col gap-6 bg-slate-900/10 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 overflow-y-auto custom-scrollbar">
            
            <div className="flex items-center justify-between">
               <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Audit Ledger</h3>
               <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
                  Live Sync
               </div>
            </div>

            {/* THE BIG VERDICT */}
            <div className="h-44">
              <AnimatePresence mode="wait">
                {status === 'RESOLVED' && activeScenario ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className={`h-full rounded-[2rem] border-2 flex flex-col justify-center items-center gap-3 shadow-2xl ${
                      activeScenario.verdict === 'BLOCK' ? 'border-rose-500/40 bg-rose-500/5' : 'border-emerald-500/40 bg-emerald-500/5'
                    }`}
                  >
                     <div className={`text-6xl font-black uppercase tracking-tighter ${activeScenario.verdict === 'BLOCK' ? 'text-rose-500' : 'text-emerald-400'}`}>
                        {activeScenario.verdict}
                     </div>
                     <div className="flex gap-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CONF: {(activeScenario.risk * 100).toFixed(0)}%</span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-l border-white/10 pl-4">{activeScenario.latency}</span>
                     </div>
                  </motion.div>
                ) : (
                  <div className="h-full border border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center opacity-10">
                     <Terminal className="w-8 h-8 mb-4 text-white" />
                     <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Handover Pending</span>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* WATERFALL FORENSICS */}
            <div className="space-y-6 flex-grow">
               <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <BarChart3 className="text-indigo-400 w-4 h-4" />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Forensic Signal Trace</span>
               </div>

               <div className="space-y-4">
                  <AnimatePresence mode="wait">
                    {status === 'RESOLVED' && activeScenario ? (
                      <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="space-y-3">
                         {activeScenario.forensics.map((f, i) => (
                           <motion.div key={i} variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group">
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold text-slate-300">{f.label}</span>
                                <span className={`text-[11px] font-black ${f.type === 'increase' ? 'text-rose-500' : 'text-emerald-400'}`}>
                                   {f.type === 'increase' ? '+' : '-'}{f.weight}%
                                </span>
                              </div>
                              <div className="h-1 w-full bg-black/60 rounded-full overflow-hidden border border-white/5">
                                <motion.div 
                                  initial={{ width: 0 }} animate={{ width: `${f.weight}%` }}
                                  transition={{ duration: 1, ease: "circOut" }}
                                  className={`h-full rounded-full ${f.type === 'increase' ? 'bg-rose-600 shadow-[0_0_10px_#e11d48]' : 'bg-emerald-600 shadow-[0_0_10px_#059669]'}`} 
                                />
                              </div>
                           </motion.div>
                         ))}
                      </motion.div>
                    ) : (
                      <div className="py-20 flex flex-col items-center justify-center opacity-10">
                         <Database className="w-10 h-10 text-white mb-4" />
                         <p className="text-[10px] font-bold uppercase tracking-[0.4em]">Audit Vault Standby</p>
                      </div>
                    )}
                  </AnimatePresence>
               </div>
            </div>

            <p className="text-[9px] text-slate-500 font-medium leading-relaxed pt-6 border-t border-white/5 italic">
              *Forensic weights derived from Flowshield Ensemble v4.0. RBI compliance node synchronized.
            </p>
          </aside>
        </div>
      </main>

      {/* TACTICAL FOOTER */}
      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-10 px-12 py-4 bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-full z-50 shadow-2xl">
         <div className="flex items-center gap-3 text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] animate-pulse">
            <Zap className="w-4 h-4 text-amber-500" />
            0.38MS Baseline
         </div>
         <div className="w-px h-6 bg-white/10" />
         <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            RBI Compliant
         </div>
         <div className="w-px h-6 bg-white/10" />
         <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
            <Lock className="w-3 h-3" />
            AES-256
         </div>
      </footer>
    </div>
  );
}
