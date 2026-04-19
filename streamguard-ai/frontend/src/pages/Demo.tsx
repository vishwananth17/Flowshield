import React, { useReducer, useEffect } from 'react';
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

// --- Types & Interfaces ---
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

// --- Reducer ---
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

// --- Scenarios Data ---
const ENTERPRISE_SCENARIOS: Scenario[] = [
  {
    id: 'SAFE_UPI',
    name: 'Standard UPI Payment',
    description: 'Typical INR 450 Grocery Transaction (Mumbai)',
    icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
    risk_score: 0.02,
    confidence: 0.99,
    latency: 34,
    verdict: 'ALLOW',
    forensics: [
      { label: 'Verified Device Fingerprint', weight: 15, type: 'decrease' },
      { label: 'Historical Merchant Affinity', weight: 40, type: 'decrease' },
      { label: 'Compliant INR Parameters', weight: 10, type: 'decrease' }
    ],
    payload: { amount: 450, currency: 'INR', city: 'Mumbai', channel: 'upi' }
  },
  {
    id: 'COLLECT_SCAM',
    name: 'High-Value Collect Request',
    description: 'Suspicious 15k INR Pull on Unverified Device',
    icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    risk_score: 0.82,
    confidence: 0.94,
    latency: 38,
    verdict: 'BLOCK',
    forensics: [
      { label: 'Unverified Pull Request', weight: 45, type: 'increase' },
      { label: 'Device Age < 24 Hours', weight: 30, type: 'increase' },
      { label: 'Velocity Limit Breach', weight: 20, type: 'increase' }
    ],
    payload: { amount: 15000, currency: 'INR', city: 'Delhi', channel: 'upi_collect' }
  },
  {
    id: 'GLOBAL_CARD',
    name: 'Trans-Atlantic Card Theft',
    description: 'EUR 1.8k Crypto Purchase from Indian IP',
    icon: <Lock className="w-5 h-5 text-rose-600" />,
    risk_score: 0.98,
    confidence: 0.98,
    latency: 42,
    verdict: 'BLOCK',
    forensics: [
      { label: 'Geographic IP/Card Mismatch', weight: 55, type: 'increase' },
      { label: 'High-Risk Merchant (Crypto)', weight: 25, type: 'increase' },
      { label: 'Anomalous Magnitude (EUR)', weight: 15, type: 'increase' }
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
    
    // Step 1: Normalization (t=200ms)
    await new Promise(r => setTimeout(r, 200));
    dispatch({ type: 'SET_STEP', step: 'Vectorizing Risk Signal...' });

    // Step 2: Inference (t=400ms)
    await new Promise(r => setTimeout(r, 200));
    dispatch({ type: 'SET_STEP', step: 'Running Neural Consensus...' });

    // Step 3: Resolution (t=600ms)
    await new Promise(r => setTimeout(r, 200));
    dispatch({ type: 'COMPLETE_SIMULATION' });
    toast.success('Forensic Verdict Rendered');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
      
      {/* HEADER HUD BAR */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
           <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <ShieldCheck className="text-white w-5 h-5 shadow-lg" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tighter uppercase italic">Flowshield</span>
                <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-l border-slate-200 pl-3">Oracle Zenith v1.3</span>
              </div>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                 <Activity className="w-3 h-3 text-emerald-500" />
                 0.38MS Baseline
              </div>
              <button 
                onClick={() => dispatch({ type: 'RESET' })}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
              >
                <RotateCcw className="w-4 h-4 text-slate-600" />
              </button>
           </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-8 h-[calc(100vh-80px)] max-h-[900px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          
          {/* 1. LEFT PANEL: TRIGGER PROTOCOL */}
          <aside className="lg:col-span-3 flex flex-col gap-6">
            <div className="space-y-1">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Forensic Lab</h2>
              <p className="text-xl font-bold text-slate-900 tracking-tight">Trigger Protocol</p>
            </div>

            <div className="space-y-4">
              {ENTERPRISE_SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  disabled={state.status === 'PROCESSING'}
                  onClick={() => handleRunSimulation(s)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 relative group overflow-hidden ${
                    state.activeScenario?.id === s.id 
                    ? 'bg-white border-indigo-600 shadow-md ring-1 ring-indigo-600/5' 
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm grayscale-[0.5] hover:grayscale-0'
                  }`}
                >
                   <div className="flex items-center gap-4 relative z-10">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors ${
                        state.activeScenario?.id === s.id ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'
                      }`}>
                         {s.icon}
                      </div>
                      <div>
                        <div className="font-bold text-[14px] text-slate-900 tracking-tight">{s.name}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{s.id.replace('_', ' ')} Context</div>
                      </div>
                   </div>
                   {state.activeScenario?.id === s.id && (
                     <motion.div 
                        layoutId="active-pill" 
                        className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" 
                     />
                   )}
                </button>
              ))}
            </div>

            <div className="mt-auto p-5 rounded-2xl bg-slate-900 text-white space-y-4">
               <div className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40">System Heartbeat</div>
               <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold">Node Accuracy</span>
                  <span className="text-[11px] font-black text-emerald-400">99.8%</span>
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold">Latency SLA</span>
                  <span className="text-[11px] font-black text-indigo-400">{'<'}50ms</span>
               </div>
            </div>
          </aside>

          {/* 2. CENTER PANEL: THE ZENITH CORE */}
          <section className="lg:col-span-5 flex flex-col items-center justify-center relative p-8 bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden">
             
             {/* Data Lines (Relative Percentage Anchors) */}
             <div className="absolute inset-0 pointer-events-none opacity-20 hidden lg:block">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                   <path d="M 0 50 L 100 50" stroke="#cbd5e1" strokeWidth="0.1" strokeDasharray="1 2" />
                </svg>
             </div>

             {/* Movement: Data Packet Left -> Center */}
             <AnimatePresence>
                {state.status === 'PROCESSING' && (
                  <motion.div 
                    initial={{ left: "-10%", opacity: 1 }}
                    animate={{ left: "50%", opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeIn" }}
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-indigo-600 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)] z-40"
                  />
                )}
             </AnimatePresence>

             {/* Movement: Data Packet Center -> Right */}
             <AnimatePresence>
                {state.status === 'RESOLVED' && (
                  <motion.div 
                    initial={{ left: "50%", opacity: 1 }}
                    animate={{ left: "110%", opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full shadow-2xl z-40 border-4 border-white ${
                      state.activeScenario?.verdict === 'BLOCK' ? 'bg-rose-600' : 'bg-emerald-600'
                    }`}
                  />
                )}
             </AnimatePresence>

             <div className="relative flex flex-col items-center gap-12">
                <div className="h-6">
                  <AnimatePresence mode="wait">
                    {state.status === 'PROCESSING' ? (
                      <motion.div
                        key={state.processingStep}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]"
                      >
                        {state.processingStep}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>

                {/* THE CORE (Concentric Circles) */}
                <div className="relative w-72 h-72 flex items-center justify-center">
                   <motion.div 
                      animate={state.status === 'PROCESSING' ? { rotate: 360, scale: [1, 1.02, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border border-slate-200 rounded-full" 
                   />
                   <div className="absolute inset-8 border border-slate-100 rounded-full" />
                   <div className="absolute inset-16 border border-slate-50 rounded-full" />
                   
                   <div className="relative flex flex-col items-center justify-center">
                      <div className={`w-32 h-32 rounded-full border-2 flex flex-col items-center justify-center transition-all duration-700 ${
                        state.status === 'PROCESSING' ? 'bg-indigo-50 border-indigo-200 shadow-[0_0_40px_rgba(79,70,229,0.1)]' : 'bg-slate-50 border-slate-200'
                      }`}>
                         {state.status === 'IDLE' && (
                           <>
                              <Zap className="w-8 h-8 text-slate-300 mb-2" />
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Standby</span>
                           </>
                         )}
                         {state.status === 'PROCESSING' && (
                           <div className="flex gap-1">
                              {[0,1,2].map(i => (
                                <motion.div 
                                  key={i} animate={{ height: [8, 24, 8] }} 
                                  transition={{ repeat: Infinity, duration: 0.8, delay: i*0.2 }}
                                  className="w-1.5 bg-indigo-600 rounded-full"
                                />
                              ))}
                           </div>
                         )}
                         {state.status === 'RESOLVED' && (
                           <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                              <CheckCircle2 className={`w-10 h-10 ${state.activeScenario?.verdict === 'BLOCK' ? 'text-rose-600' : 'text-emerald-600'}`} />
                           </motion.div>
                         )}
                      </div>
                      
                      {state.status === 'IDLE' && (
                        <div className="absolute top-[140%] whitespace-nowrap text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Awaiting Payload</div>
                      )}
                   </div>
                </div>
             </div>
          </section>

          {/* 3. RIGHT PANEL: AUDIT LEDGER & FORENSICS */}
          <aside className="lg:col-span-4 flex flex-col gap-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm p-8 overflow-y-auto custom-scrollbar">
            
            <div className="flex items-center justify-between">
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Forensic Verdict</h3>
               <Badge variant="outline" className="text-[10px] uppercase tracking-widest font-black py-1 px-3">Real-time Node</Badge>
            </div>

            {/* THE DECISION CARD */}
            <div className="h-44">
              <AnimatePresence mode="wait">
                {state.status === 'RESOLVED' && state.activeScenario ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`h-full rounded-3xl border-2 p-8 flex flex-col justify-center items-center gap-2 ${
                      state.activeScenario.verdict === 'BLOCK' 
                      ? 'border-rose-200 bg-rose-50' 
                      : 'border-emerald-200 bg-emerald-50'
                    }`}
                  >
                     <div className={`text-6xl font-black uppercase tracking-tighter ${
                       state.activeScenario.verdict === 'BLOCK' ? 'text-rose-600' : 'text-emerald-600'
                     }`}>
                        {state.activeScenario.verdict}
                     </div>
                     <div className="flex items-center gap-4 mt-2">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-300 pr-4">
                           Confidence: {(state.activeScenario.confidence * 100).toFixed(0)}%
                        </div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                           Latency: {state.activeScenario.latency}ms
                        </div>
                     </div>
                  </motion.div>
                ) : (
                  <div className="h-full border border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center opacity-30 grayscale saturate-0">
                     <Terminal className="w-8 h-8 text-slate-400 mb-4" />
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Audit Unpopulated</span>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* GLASS-BOX SHAP REPORT */}
            <div className="space-y-6 flex-grow">
               <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <BarChart3 className="w-4 h-4 text-slate-400" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SHAP Interpretability Stack</span>
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
                             variants={{
                               hidden: { x: 20, opacity: 0 },
                               visible: { x: 0, opacity: 1 }
                             }}
                             className="p-4 rounded-xl border border-slate-100 bg-slate-50/50"
                           >
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[12px] font-bold text-slate-700">{f.label}</span>
                                <span className={`text-[12px] font-black ${f.type === 'increase' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                   {f.type === 'increase' ? '+' : '-'}{f.weight}%
                                </span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${f.weight}%` }}
                                  transition={{ duration: 0.8, ease: "circOut" }}
                                  className={`h-full rounded-full ${f.type === 'increase' ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                />
                              </div>
                           </motion.div>
                         ))}
                      </motion.div>
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center opacity-10">
                         <Database className="w-12 h-12 text-slate-900 mb-4" />
                         <p className="text-[10px] font-bold uppercase tracking-widest">Awaiting Context</p>
                      </div>
                    )}
                  </AnimatePresence>
               </div>
            </div>

            <div className="text-[9px] text-slate-400 font-medium leading-relaxed border-t border-slate-100 pt-6">
              *All forensics on this node are SHAP-weighted based on the Flowshield Ensemble v4.2. Localized INR weights applied.
            </div>
          </aside>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-4 border-t border-slate-100 bg-white/50 backdrop-blur-sm pointer-events-none">
         <div className="max-w-7xl mx-auto flex justify-center gap-10 opacity-40">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
               <RotateCcw className="w-3 h-3" />
               Deterministic Engine
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
               <Lock className="w-3 h-3" />
               RSA-4096 Encrypted
            </div>
         </div>
      </footer>
    </div>
  );
}

// --- Sub-Components ---
function NeuralIconRow({ icon, label }: { icon: any; label: string }) {
   return (
      <div className="flex items-center gap-4 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] group cursor-default">
         <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:border-indigo-400 transition-colors shadow-sm">
            {icon}
         </div>
         <span className="group-hover:text-slate-900 transition-colors">{label}</span>
      </div>
   );
}

function Badge({ children, className, variant }: any) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${className}`}>
      {children}
    </span>
  );
}
