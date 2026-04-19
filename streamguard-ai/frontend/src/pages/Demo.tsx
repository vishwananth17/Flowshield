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
      return { ...state, status: 'PROCESSING', activeScenario: action.scenario, processingStep: 'Processing payload...' };
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

const DASHBOARD_THEME_SCENARIOS: Scenario[] = [
  {
    id: 'SAFE_UPI',
    name: 'Safe UPI Payment',
    description: 'Typical INR 450 grocery transaction',
    icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
    risk_score: 0.02,
    confidence: 0.99,
    latency: 12,
    verdict: 'ALLOW',
    forensics: [
      { label: 'Device ID Match', weight: 15, type: 'decrease' },
      { label: 'Merchant Verified', weight: 40, type: 'decrease' },
      { label: 'Normal Velocity', weight: 10, type: 'decrease' }
    ],
    payload: { amount: 450, currency: 'INR', channel: 'upi' }
  },
  {
    id: 'COLLECT_SCAM',
    name: 'UPI Collect Scam',
    description: 'High-value pull on unverified device',
    icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    risk_score: 0.82,
    confidence: 0.94,
    latency: 17,
    verdict: 'BLOCK',
    forensics: [
      { label: 'Unverified Pull', weight: 45, type: 'increase' },
      { label: 'Suspicious Velocity', weight: 30, type: 'increase' },
      { label: 'Device Mismatch', weight: 20, type: 'increase' }
    ],
    payload: { amount: 15000, currency: 'INR', channel: 'upi_collect' }
  },
  {
    id: 'GLOBAL_CARD',
    name: 'Global Card Theft',
    description: 'EUR 1.8k purchase from US card',
    icon: <Lock className="w-5 h-5 text-rose-500" />,
    risk_score: 0.98,
    confidence: 0.98,
    latency: 22,
    verdict: 'BLOCK',
    forensics: [
      { label: 'IP/Country Mismatch', weight: 55, type: 'increase' },
      { label: 'High-Risk Merchant', weight: 25, type: 'increase' },
      { label: 'Anomalous Magnitude', weight: 15, type: 'increase' }
    ],
    payload: { amount: 1800, currency: 'EUR', channel: 'web' }
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
    dispatch({ type: 'SET_STEP', step: 'Vectorizing signals...' });

    await new Promise(r => setTimeout(r, 700));
    dispatch({ type: 'SET_STEP', step: 'AI Analysis...' });

    await new Promise(r => setTimeout(r, 500));
    dispatch({ type: 'COMPLETE_SIMULATION' });
    toast.success('Simulation Completed');
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-100 font-sans selection:bg-blue-500/30 overflow-hidden">
      
      {/* HEADER Mirroring Dashboard Header */}
      <header className="border-b border-gray-800 bg-[#161922] px-8 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
           <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <ShieldCheck className="text-white w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-white leading-none">Flowshield AI</span>
                <span className="text-[10px] text-gray-500 uppercase font-medium mt-1">Intelligence Hub</span>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="bg-[#1a1d26] border border-gray-800 px-3 py-1.5 rounded-full flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Live Engine Connected</span>
              </div>
              <button 
                onClick={() => dispatch({ type: 'RESET' })}
                className="p-2 hover:bg-gray-800 border border-gray-800 rounded-lg transition-colors"
                title="Reset Simulation"
              >
                <RotateCcw className="w-4 h-4 text-gray-400" />
              </button>
           </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 lg:p-8 h-[calc(100vh-72px)] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          
          {/* 1. LEFT PANEL (Symmetrical to Dashboard Sidebar style) */}
          <aside className="lg:col-span-3 flex flex-col gap-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white tracking-tight">Simulator</h2>
              <p className="text-xs text-gray-400">Select a scenario to analyze.</p>
            </div>

            <div className="space-y-3">
              {DASHBOARD_THEME_SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  disabled={state.status === 'PROCESSING'}
                  onClick={() => handleRunSimulation(s)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group relative ${
                    state.activeScenario?.id === s.id 
                    ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-900/20' 
                    : 'bg-[#161922] border-gray-800 hover:border-gray-700'
                  }`}
                >
                   <div className="flex items-center gap-4 relative z-10">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        state.activeScenario?.id === s.id ? 'bg-white/20' : 'bg-[#1a1d26] border border-gray-800'
                      }`}>
                         {s.icon}
                      </div>
                      <div>
                        <div className={`font-bold text-[13px] ${state.activeScenario?.id === s.id ? 'text-white' : 'text-slate-200'}`}>{s.name}</div>
                        <div className={`text-[10px] uppercase font-bold tracking-widest ${state.activeScenario?.id === s.id ? 'text-blue-100' : 'text-gray-500'}`}>
                          {s.id.replace('_', ' ')}
                        </div>
                      </div>
                   </div>
                </button>
              ))}
            </div>

            {/* Mirror Stats from Dashboard Cards */}
            <div className="mt-auto p-5 rounded-xl bg-[#161922] border border-gray-800 space-y-4">
               <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-400">Node Accuracy</span>
                  <span className="text-[11px] font-bold text-emerald-400 tracking-tighter">99.8%</span>
               </div>
               <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[99.8%]"></div>
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-400">System Latency</span>
                  <span className="text-[11px] font-bold text-blue-400">{'<'}20ms</span>
               </div>
            </div>
          </aside>

          {/* 2. CENTER PANEL (ZENITH CORE - Polished SaaS style) */}
          <section className="lg:col-span-5 relative flex flex-col items-center justify-center p-8 bg-[#161922] border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
             
             {/* DATA PACKET PATHWAY */}
             <div className="absolute inset-0 pointer-events-none opacity-10">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                   <path d="M 0 50 L 100 50" stroke="#3b82f6" strokeWidth="0.1" fill="none" />
                   <AnimatePresence>
                     {state.status === 'PROCESSING' && (
                        <motion.circle
                          r="0.5" fill="#3b82f6"
                          initial={{ offsetDistance: "0%" }} animate={{ offsetDistance: "50%" }}
                          transition={{ duration: 0.4, ease: "linear" }}
                          style={{ offsetPath: `path('M 0 50 L 100 50')` }}
                          className="shadow-[0_0_10px_#3b82f6]"
                        />
                     )}
                     {state.status === 'RESOLVED' && (
                        <motion.circle
                          r="0.8" 
                          fill={state.activeScenario?.verdict === 'BLOCK' ? '#ef4444' : '#10b981'}
                          initial={{ offsetDistance: "50%" }} animate={{ offsetDistance: "100%" }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          style={{ offsetPath: `path('M 0 50 L 100 50')` }}
                        />
                     )}
                   </AnimatePresence>
                </svg>
             </div>

             <div className="relative z-20 flex flex-col items-center gap-12">
                <div className="h-6">
                  <AnimatePresence mode="wait">
                    {state.status === 'PROCESSING' && (
                      <motion.div
                        key={state.processingStep}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.4em]"
                      >
                        {state.processingStep}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* THE CORE (Mirroring Analytic Circles in Dashboard) */}
                <div className="relative w-72 h-72 flex items-center justify-center">
                   <div className="absolute inset-0 border border-gray-800 rounded-full" />
                   <div className="absolute inset-10 border border-gray-800/50 rounded-full" />
                   <motion.div 
                     animate={state.status === 'PROCESSING' ? { rotate: 360 } : {}}
                     transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                     className="absolute inset-10 border-t border-blue-500 rounded-full"
                   />
                   
                   <div className="relative w-48 h-48 rounded-full bg-[#1a1d26] border border-gray-800 flex flex-col items-center justify-center shadow-inner">
                      {state.status === 'RESOLVED' ? (
                        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                           <CheckCircle2 className={`w-16 h-16 ${state.activeScenario?.verdict === 'BLOCK' ? 'text-rose-500' : 'text-emerald-500'}`} />
                        </motion.div>
                      ) : (
                        <div className="flex flex-col items-center">
                           <Activity className={`w-10 h-10 ${state.status === 'PROCESSING' ? 'text-blue-500 animate-pulse' : 'text-gray-700'}`} />
                           <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-3">
                              {state.status === 'PROCESSING' ? 'Analyzing' : 'Ready'}
                           </span>
                        </div>
                      )}
                   </div>
                </div>
             </div>
          </section>

          {/* 3. RIGHT PANEL (Mirroring Dashboard Detail style) */}
          <aside className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Mirror the "Total Transactions" Card style */}
            <div className="bg-[#161922] border border-gray-800 rounded-xl p-6 shadow-sm">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Analysis Result</h3>
                  <div className="flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                     <span className="text-[10px] text-gray-500 font-bold uppercase">Real-time Node</span>
                  </div>
               </div>

               <div className="h-40 flex flex-col items-center justify-center border border-dashed border-gray-800 rounded-xl bg-gray-900/20">
                 <AnimatePresence mode="wait">
                    {state.status === 'RESOLVED' && state.activeScenario ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                      >
                         <div className={`text-6xl font-bold uppercase tracking-tighter mb-2 ${
                           state.activeScenario.verdict === 'BLOCK' ? 'text-rose-500' : 'text-emerald-500'
                         }`}>
                            {state.activeScenario.verdict}
                         </div>
                         <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Decision Rendered</div>
                      </motion.div>
                    ) : (
                      <div className="flex flex-col items-center opacity-30">
                         <Terminal className="w-8 h-8 text-gray-600 mb-3" />
                         <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest text-center px-6">Awaiting system signal from processor node...</span>
                      </div>
                    )}
                 </AnimatePresence>
               </div>
            </div>

            {/* Forensic Waterfall Card */}
            <div className="flex-grow bg-[#161922] border border-gray-800 rounded-xl p-6 flex flex-col gap-6">
               <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
                  <BarChart3 className="text-blue-500 w-4 h-4" />
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Risk Breakdown</span>
               </div>

               <div className="space-y-4">
                  <AnimatePresence mode="wait">
                    {state.status === 'RESOLVED' && state.activeScenario ? (
                      <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="space-y-3">
                         {state.activeScenario.forensics.map((f, i) => (
                           <motion.div key={i} variants={{ hidden: { opacity: 0, y: 5 }, visible: { opacity: 1, y: 0 } }} className="bg-[#1a1d26] border border-gray-800 p-4 rounded-lg">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-medium text-gray-300">{f.label}</span>
                                <span className={`text-xs font-bold ${f.type === 'increase' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                   {f.type === 'increase' ? '+' : '-'}{f.weight}%
                                </span>
                              </div>
                              <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }} animate={{ width: `${f.weight}%` }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                  className={`h-full ${f.type === 'increase' ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                />
                              </div>
                           </motion.div>
                         ))}
                      </motion.div>
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center opacity-10">
                         <Database className="w-10 h-10 text-gray-400 mb-3" />
                         <p className="text-[10px] font-bold uppercase tracking-widest">No active audit</p>
                      </div>
                    )}
                  </AnimatePresence>
               </div>
            </div>
          </aside>
        </div>
      </main>

      {/* DASHBOARD STYLE STATS FOOTER */}
      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-3 bg-[#1a1d26] border border-gray-800 rounded-full z-50 shadow-2xl">
         <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <Zap className="w-3.5 h-3.5 text-blue-500" />
            0.38ms Baseline
         </div>
         <div className="w-px h-4 bg-gray-800" />
         <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            RBI Compliant
         </div>
         <div className="w-px h-4 bg-gray-800" />
         <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <Activity className="w-3.5 h-3.5 text-blue-500" />
            V4.2 Ensemble
         </div>
      </footer>
    </div>
  );
}
