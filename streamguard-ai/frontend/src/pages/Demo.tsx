import React, { useReducer } from 'react';
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
  BarChart3,
  RotateCcw,
  Activity
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

// --- Types ---
type SimulationStatus = 'IDLE' | 'PROCESSING' | 'RESOLVED';

interface ForensicFactor {
  label: string;
  weight: number;
  type: 'increase' | 'decrease';
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  risk_score: number;
  confidence: number;
  latency: number;
  verdict: 'BLOCK' | 'ALLOW';
  forensics: ForensicFactor[];
  payload: any;
}

interface State {
  status: SimulationStatus;
  activeScenario: Scenario | null;
  processingStep: string;
}

type Action = 
  | { type: 'START_SIMULATION'; scenario: Scenario }
  | { type: 'SET_STEP'; step: string }
  | { type: 'COMPLETE_SIMULATION' }
  | { type: 'RESET' };

function simulationReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START_SIMULATION':
      return { ...state, status: 'PROCESSING', activeScenario: action.scenario, processingStep: 'Normalizing Payload...' };
    case 'SET_STEP':
      return { ...state, processingStep: action.step };
    case 'COMPLETE_SIMULATION':
      return { ...state, status: 'RESOLVED' };
    case 'RESET':
      return { status: 'IDLE', activeScenario: null, processingStep: '' };
    default:
      return state;
  }
}

const FLOWSHIELD_THEME_SCENARIOS: Scenario[] = [
  {
    id: 'SAFE_UPI',
    name: 'Safe UPI Payment',
    description: 'Typical INR 450 grocery transaction from Mumbai',
    icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
    risk_score: 0.02,
    confidence: 0.99,
    latency: 12,
    verdict: 'ALLOW',
    forensics: [
      { label: 'Device ID Match', weight: 15, type: 'decrease' },
      { label: 'Merchant Affinity', weight: 40, type: 'decrease' },
      { label: 'Compliant Parameters', weight: 10, type: 'decrease' }
    ],
    payload: { amount: 450, currency: 'INR', city: 'Mumbai', channel: 'upi' }
  },
  {
    id: 'COLLECT_SCAM',
    name: 'UPI Collect Scam',
    description: 'High-value pull request on an unverified device',
    icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    risk_score: 0.82,
    confidence: 0.94,
    latency: 17,
    verdict: 'BLOCK',
    forensics: [
      { label: 'Unverified Pull', weight: 45, type: 'increase' },
      { label: 'Device Age < 24h', weight: 30, type: 'increase' },
      { label: 'Velocity Breach', weight: 20, type: 'increase' }
    ],
    payload: { amount: 15000, currency: 'INR', city: 'Delhi', channel: 'upi_collect' }
  },
  {
    id: 'GLOBAL_CARD',
    name: 'Global Card Theft',
    description: 'EUR 1.8k purchase from US card on Indian IP',
    icon: <Lock className="w-5 h-5 text-rose-500" />,
    risk_score: 0.98,
    confidence: 0.98,
    latency: 22,
    verdict: 'BLOCK',
    forensics: [
      { label: 'IP / Card Mismatch', weight: 55, type: 'increase' },
      { label: 'High-Risk Merchant', weight: 25, type: 'increase' },
      { label: 'Magnitude Anomaly', weight: 15, type: 'increase' }
    ],
    payload: { amount: 1800, currency: 'EUR', city: 'Bangalore', channel: 'web' }
  }
];

export default function Demo() {
  const [state, dispatch] = useReducer(simulationReducer, {
    status: 'IDLE',
    activeScenario: null,
    processingStep: ''
  });

  const handleRunSimulation = async (scenario: Scenario) => {
    dispatch({ type: 'START_SIMULATION', scenario });
    
    await new Promise(r => setTimeout(r, 600));
    dispatch({ type: 'SET_STEP', step: 'Vectorizing Signal...' });

    await new Promise(r => setTimeout(r, 700));
    dispatch({ type: 'SET_STEP', step: 'Neural Consensus...' });

    await new Promise(r => setTimeout(r, 500));
    dispatch({ type: 'COMPLETE_SIMULATION' });
    toast.success('Forensic Report Ready');
  };

  return (
    <div className="min-h-screen bg-[#02030a] text-slate-100 font-sans selection:bg-indigo-500/30 overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      
      {/* HUD NAV */}
      <nav className="border-b border-white/5 bg-slate-950/50 backdrop-blur-3xl sticky top-0 z-50 px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
           <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                <ShieldCheck className="text-white w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tighter uppercase italic leading-none">Flowshield</span>
                <span className="text-[9px] font-bold text-indigo-400 tracking-[0.3em] uppercase">Zenith Console v1.3</span>
              </div>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                 <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                 0.38MS Baseline
              </div>
              <button onClick={() => dispatch({ type: 'RESET' })} className="p-2 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10">
                <RotateCcw className="w-4 h-4 text-slate-400" />
              </button>
           </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-8 h-[calc(100vh-80px)] max-h-[900px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
          
          {/* 1. LEFT PANEL */}
          <aside className="lg:col-span-3 flex flex-col gap-6 relative z-40">
            <div className="space-y-1">
              <h2 className="text-[10px] font-black text-indigo-400/60 uppercase tracking-[0.4em]">Forensic Lab</h2>
              <p className="text-xl font-bold text-white tracking-tight">Scenario Pulse</p>
            </div>

            <div className="space-y-4">
              {FLOWSHIELD_THEME_SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  disabled={state.status === 'PROCESSING'}
                  onClick={() => handleRunSimulation(s)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-500 group relative overflow-hidden ${
                    state.activeScenario?.id === s.id 
                    ? 'bg-indigo-600/10 border-indigo-500/50 shadow-[inset_0_0_30px_rgba(99,102,241,0.1)]' 
                    : 'bg-slate-900/40 border-white/5 hover:border-indigo-500/30'
                  }`}
                >
                   <div className="flex items-center gap-4 relative z-10">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-black/60 border border-white/5 group-hover:border-indigo-500/40 transition-colors`}>
                         {s.icon}
                      </div>
                      <div>
                        <div className="font-bold text-[13px] text-slate-200">{s.name}</div>
                        <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{s.id.split('_')[0]} Pulse</div>
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
                  <span className="text-[11px] font-black text-indigo-400">{'<'}20ms</span>
               </div>
            </div>
          </aside>

          {/* 2. CENTER PANEL (ZENITH CORE) */}
          <section className="lg:col-span-5 relative flex flex-col items-center justify-center p-8 bg-[#010208]/40 border border-white/5 rounded-[3rem] shadow-2xl overflow-hidden group">
             
             {/* DATA WIRING */}
             <div className="absolute inset-0 pointer-events-none z-10">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                   {/* Static Wire Traces */}
                   <path d="M 0 50 L 100 50" stroke="rgba(99,102,241,0.05)" strokeWidth="0.15" fill="none" />
                   
                   {/* Data Packet Flow */}
                   <AnimatePresence>
                     {state.status === 'PROCESSING' && (
                        <motion.circle
                          r="0.5" fill="#6366f1"
                          initial={{ offsetDistance: "0%" }} animate={{ offsetDistance: "50%" }}
                          transition={{ duration: 0.4, ease: "easeIn" }}
                          style={{ offsetPath: `path('M 0 50 L 100 50')` }}
                          className="shadow-[0_0_20px_#6366f1]"
                        />
                     )}
                     {state.status === 'RESOLVED' && (
                        <motion.circle
                          r="0.8" 
                          fill={state.activeScenario?.verdict === 'BLOCK' ? '#f43f5e' : '#10b981'}
                          initial={{ offsetDistance: "50%" }} animate={{ offsetDistance: "100%" }}
                          transition={{ duration: 0.5, ease: "circOut" }}
                          style={{ offsetPath: `path('M 0 50 L 100 50')` }}
                          className={`shadow-[0_0_30px_currentColor]`}
                        />
                     )}
                   </AnimatePresence>
                </svg>
             </div>

             <div className="relative z-20 flex flex-col items-center gap-14">
                <div className="h-6">
                  <AnimatePresence mode="wait">
                    {state.status === 'PROCESSING' && (
                      <motion.div
                        key={state.processingStep}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] shadow-[0_0_20px_rgba(129,140,248,0.2)]"
                      >
                        {state.processingStep}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative w-80 h-80 flex items-center justify-center">
                   <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 40, ease: "linear" }} className="absolute inset-0 border border-dashed border-white/5 rounded-full" />
                   <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 60, ease: "linear" }} className="absolute inset-12 border border-indigo-500/5 rounded-full" />
                   
                   <div className="relative bg-[#020512] border border-indigo-500/20 w-60 h-60 rounded-full flex flex-col items-center justify-center space-y-4 shadow-[0_0_100px_rgba(0,0,0,1),inset_0_0_40px_rgba(99,102,241,0.05)]">
                      <div className="text-[10px] uppercase font-black tracking-[0.4em] text-indigo-400/40 mb-2 font-mono">Neural Core</div>
                      <NeuralStage label="Understand" active={state.status === 'PROCESSING' && state.processingStep.includes('Normalizing')} />
                      <NeuralStage label="Structure" active={state.status === 'PROCESSING' && state.processingStep.includes('Vectorizing')} />
                      <NeuralStage label="Connect" active={state.status === 'PROCESSING' && state.processingStep.includes('Neural')} />
                      
                      {state.status === 'RESOLVED' && (
                         <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-full">
                            <CheckCircle2 className={`w-20 h-20 ${state.activeScenario?.verdict === 'BLOCK' ? 'text-rose-500' : 'text-emerald-500'} drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]`} />
                         </motion.div>
                      )}
                   </div>
                </div>
             </div>
          </section>

          {/* 3. RIGHT PANEL */}
          <aside className="lg:col-span-4 flex flex-col gap-6 bg-slate-950/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 overflow-y-auto custom-scrollbar relative z-40">
            
            <div className="flex items-center justify-between">
               <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Audit Ledger</h3>
               <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 opacity-50 uppercase tracking-widest">
                  <Database className="w-3 h-3" />
                  Live Sync
               </div>
            </div>

            {/* VERDICT CARD */}
            <div className="h-48">
              <AnimatePresence mode="wait">
                {state.status === 'RESOLVED' && state.activeScenario ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className={`h-full rounded-[2rem] border-2 flex flex-col justify-center items-center gap-3 shadow-[0_30px_60px_rgba(0,0,0,0.4)] ${
                      state.activeScenario.verdict === 'BLOCK' ? 'border-rose-500/40 bg-rose-500/5' : 'border-emerald-500/40 bg-emerald-500/5'
                    }`}
                  >
                     <div className={`text-6xl font-black uppercase tracking-tighter ${state.activeScenario.verdict === 'BLOCK' ? 'text-rose-500' : 'text-emerald-400'}`}>
                        {state.activeScenario.verdict}
                     </div>
                     <div className="flex items-center gap-6 px-6 py-2 bg-black/40 rounded-full border border-white/5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-white/10 pr-4">Conf: {(state.activeScenario.confidence * 100).toFixed(0)}%</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{state.activeScenario.latency}ms</span>
                     </div>
                  </motion.div>
                ) : (
                  <div className="h-full border border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center opacity-20">
                     <Terminal className="w-8 h-8 text-slate-400 mb-4" />
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Awaiting Forensic Handover</span>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* SHAP WATERFALL */}
            <div className="space-y-6 flex-grow">
               <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <BarChart3 className="text-indigo-400 w-4 h-4" />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Glass-Box Forensic Stack</span>
               </div>

               <div className="space-y-4">
                  <AnimatePresence>
                    {state.status === 'RESOLVED' && state.activeScenario ? (
                      <motion.div 
                         initial="hidden" animate="visible" 
                         variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
                         className="space-y-4"
                      >
                         {state.activeScenario.forensics.map((f, i) => (
                           <motion.div
                             key={i}
                             variants={{ hidden: { x: 20, opacity: 0 }, visible: { x: 0, opacity: 1 } }}
                             className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 group hover:bg-white/[0.06] transition-all"
                           >
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-[12px] font-bold text-slate-300 tracking-tight">{f.label}</span>
                                <span className={`text-[12px] font-black ${f.type === 'increase' ? 'text-rose-500' : 'text-emerald-400'}`}>
                                   {f.type === 'increase' ? '+' : '-'}{f.weight}%
                                </span>
                              </div>
                              <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden border border-white/5">
                                <motion.div 
                                  initial={{ width: 0 }} animate={{ width: `${f.weight}%` }}
                                  transition={{ duration: 1, ease: "circOut" }}
                                  className={`h-full rounded-full ${f.type === 'increase' ? 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'}`} 
                                />
                              </div>
                           </motion.div>
                         ))}
                      </motion.div>
                    ) : (
                      <div className="py-20 flex flex-col items-center justify-center opacity-10">
                         <Database className="w-10 h-10 text-white mb-4" />
                         <p className="text-[10px] font-bold uppercase tracking-[0.4em]">Audit Ledger Idle</p>
                      </div>
                    )}
                  </AnimatePresence>
               </div>
            </div>
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

// --- Components ---
function NeuralStage({ label, active }: { label: string; active: boolean }) {
   return (
      <div className={`w-full max-w-[160px] py-3 px-5 rounded-2xl border transition-all duration-700 flex items-center justify-center gap-4 ${
         active ? "bg-indigo-500/20 border-indigo-500 text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.2)] scale-110" : "bg-white/[0.02] border-white/5 text-slate-800 opacity-20 grayscale"
      }`}>
         <div className={`w-2 h-2 rounded-full ${active ? "bg-indigo-400 animate-pulse shadow-[0_0_10px_#818cf8]" : "bg-slate-900"}`} />
         <span className="text-[12px] font-black uppercase tracking-[0.3em] font-mono">{label}</span>
      </div>
   );
}
