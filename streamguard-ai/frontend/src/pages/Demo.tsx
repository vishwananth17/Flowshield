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
      return { ...state, status: 'PROCESSING', activeScenario: action.scenario, processingStep: 'Initializing logic...' };
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

const FLOWSHIELD_DNA_SCENARIOS: Scenario[] = [
  {
    id: 'SAFE_UPI',
    name: 'Safe UPI Payment',
    description: 'Typical INR 450 grocery transaction',
    icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
    risk_score: 0.02,
    confidence: 0.99,
    latency: 12,
    verdict: 'ALLOW',
    forensics: [
      { label: 'Device Hash Match', weight: 15, type: 'decrease' },
      { label: 'Verified Merchant', weight: 40, type: 'decrease' },
      { label: 'Baseline Velocity', weight: 10, type: 'decrease' }
    ],
    payload: { amount: 450, currency: 'INR', channel: 'upi' }
  },
  {
    id: 'COLLECT_SCAM',
    name: 'UPI Collect Scam',
    description: 'High-value pull on unverified device',
    icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    risk_score: 0.82,
    confidence: 0.94,
    latency: 17,
    verdict: 'BLOCK',
    forensics: [
      { label: 'Unverified Request', weight: 45, type: 'increase' },
      { label: 'Device Tenure < 24h', weight: 30, type: 'increase' },
      { label: 'Volume Spike', weight: 20, type: 'increase' }
    ],
    payload: { amount: 15000, currency: 'INR', channel: 'upi_collect' }
  },
  {
    id: 'GLOBAL_CARD',
    name: 'Global Card Theft',
    description: 'EUR 1.8k purchase from US card',
    icon: <Lock className="w-4 h-4 text-rose-500" />,
    risk_score: 0.98,
    confidence: 0.98,
    latency: 22,
    verdict: 'BLOCK',
    forensics: [
      { label: 'Geo-Distance Breach', weight: 55, type: 'increase' },
      { label: 'High-Risk MCC', weight: 25, type: 'increase' },
      { label: 'Magnitude Shift', weight: 15, type: 'increase' }
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
    dispatch({ type: 'SET_STEP', step: 'Extracting features...' });

    await new Promise(r => setTimeout(r, 700));
    dispatch({ type: 'SET_STEP', step: 'Running ensemble...' });

    await new Promise(r => setTimeout(r, 500));
    dispatch({ type: 'COMPLETE_SIMULATION' });
    toast.success('Forensic Result Ready');
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-slate-200 font-sans selection:bg-blue-600/30 overflow-hidden">
      
      {/* HUD HEADER - DNA MIRRORED */}
      <nav className="border-b border-[#1F2937] bg-[#030712] px-8 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
           <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-[#2563eb] rounded flex items-center justify-center">
                <ShieldCheck className="text-white w-5 h-5 shadow-lg" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-white leading-none">Flowshield AI</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Intelligence Hub</span>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="bg-[#111827] border border-[#1F2937] px-3 py-1.5 rounded-full flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Engine Connected</span>
              </div>
              <button 
                onClick={() => dispatch({ type: 'RESET' })} 
                className="p-2 hover:bg-[#1F2937] border border-[#1F2937] rounded-lg transition-colors group"
                title="Reset simulation"
              >
                <RotateCcw className="w-4 h-4 text-gray-500 group-hover:text-white" />
              </button>
           </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 lg:p-8 h-[calc(100vh-72px)] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
          
          {/* 1. LEFT PANEL: TRIGGER */}
          <aside className="lg:col-span-3 flex flex-col gap-6 relative z-40">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white tracking-tight">Scenario Pulse</h2>
              <p className="text-xs text-gray-500 font-medium tracking-tight">Trigger a telemetry stream for analysis.</p>
            </div>

            <div className="space-y-3">
              {FLOWSHIELD_DNA_SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  disabled={state.status === 'PROCESSING'}
                  onClick={() => handleRunSimulation(s)}
                  className={`w-full text-left p-4 rounded-lg border transition-all duration-200 group relative ${
                    state.activeScenario?.id === s.id 
                    ? 'bg-[#2563eb] border-[#2563eb] shadow-xl shadow-blue-900/20' 
                    : 'bg-[#111827] border-[#1F2937] hover:border-gray-700'
                  }`}
                >
                   <div className="flex items-center gap-4 relative z-10">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        state.activeScenario?.id === s.id ? 'bg-white/20' : 'bg-[#0A0E1A] border border-[#1F2937]'
                      }`}>
                         {s.icon}
                      </div>
                      <div>
                        <div className={`font-bold text-[13px] ${state.activeScenario?.id === s.id ? 'text-white' : 'text-slate-200'}`}>{s.name}</div>
                        <div className={`text-[10px] uppercase font-bold tracking-widest leading-none mt-1 ${state.activeScenario?.id === s.id ? 'text-blue-100' : 'text-gray-600'}`}>
                          {s.id.replace('_', ' ')}
                        </div>
                      </div>
                   </div>
                </button>
              ))}
            </div>

            <div className="mt-auto p-5 rounded-lg bg-[#111827] border border-[#1F2937] space-y-4">
               <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Ensemble Accuracy</span>
                  <span className="text-[11px] font-black text-emerald-400">99.8%</span>
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Latency</span>
                  <span className="text-[11px] font-black text-[#2563eb]">{'<'}20ms</span>
               </div>
            </div>
          </aside>

          {/* 2. MIDDLE PANEL: PROCESSOR (DNA CORE) */}
          <section className="lg:col-span-5 relative flex flex-col items-center justify-center p-8 bg-[#111827] border border-[#1F2937] rounded-lg shadow-2xl overflow-hidden">
             
             {/* DNA PATHWAYS (Fixed Scale Labels) */}
             <div className="absolute inset-0 pointer-events-none z-10 opaciy-30">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                   {/* Pathway Lines */}
                   <path d="M 0 50 L 100 50" stroke="#1F2937" strokeWidth="0.15" fill="none" strokeDasharray="1 3" />
                   
                   {/* Infrastructure Labels (Match Dashboard Pills) */}
                   <g transform="translate(15, 58)">
                      <rect x="-8" y="-3" width="16" height="6" rx="3" fill="#0A0E1A" stroke="#1F2937" strokeWidth="0.1" />
                      <text textAnchor="middle" y="1" fill="#4B5563" style={{ fontSize: '1.2px' }} className="font-bold tracking-widest uppercase font-sans">Merchant SDK</text>
                   </g>

                   <g transform="translate(85, 58)">
                      <rect x="-8" y="-3" width="16" height="6" rx="3" fill="#0A0E1A" stroke="#1F2937" strokeWidth="0.1" />
                      <text textAnchor="middle" y="1" fill="#4B5563" style={{ fontSize: '1.2px' }} className="font-bold tracking-widest uppercase font-sans">Audit Ledger</text>
                   </g>

                   {/* Pulse Movement */}
                   <AnimatePresence>
                     {state.status === 'PROCESSING' && (
                        <motion.circle
                          r="0.5" fill="#2563eb"
                          initial={{ offsetDistance: "0%" }} animate={{ offsetDistance: "50%" }}
                          transition={{ duration: 0.4, ease: "linear" }}
                          style={{ offsetPath: `path('M 0 50 L 100 50')` }}
                          className="shadow-[0_0_15px_#2563eb]"
                        />
                     )}
                     {state.status === 'RESOLVED' && (
                        <motion.circle
                          r="0.8" 
                          fill={state.activeScenario?.verdict === 'BLOCK' ? '#ef4444' : '#10b981'}
                          initial={{ offsetDistance: "55%" }} animate={{ offsetDistance: "100%" }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          style={{ offsetPath: `path('M 0 50 L 100 50')` }}
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
                        className="text-[10px] font-bold text-[#2563eb] uppercase tracking-[0.4em] bg-[#0A0E1A] px-4 py-1.5 rounded-full border border-[#1F2937] shadow-xl"
                      >
                        {state.processingStep}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* THE CORE BLOCK */}
                <div className="relative w-80 h-80 flex items-center justify-center">
                   <div className="absolute inset-0 border border-[#1F2937] rounded-full" />
                   <div className="absolute inset-16 border border-[#1F2937]/50 rounded-full" />
                   
                   <div className="relative bg-[#0A0E1A] border border-[#1F2937] w-52 h-52 rounded-full flex flex-col items-center justify-center space-y-4 shadow-inner">
                      {state.status === 'RESOLVED' ? (
                        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                           <CheckCircle2 className={`w-16 h-16 ${state.activeScenario?.verdict === 'BLOCK' ? 'text-rose-500' : 'text-emerald-500'}`} />
                        </motion.div>
                      ) : (
                        <div className="flex flex-col items-center">
                           <Activity className={`w-10 h-10 ${state.status === 'PROCESSING' ? 'text-[#2563eb] animate-pulse' : 'text-gray-800'}`} />
                           <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest mt-4">Node Engine</span>
                        </div>
                      )}
                   </div>
                </div>
             </div>
          </section>

          {/* 3. RIGHT PANEL: AUDIT */}
          <aside className="lg:col-span-4 flex flex-col gap-6">
            
            <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-6 shadow-xl">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest font-mono">Analysis Result</h3>
                  <div className="bg-[#2563eb]/10 px-2 py-0.5 rounded text-[9px] font-black text-[#2563eb] uppercase">Confidence High</div>
               </div>

               <div className="h-44 flex flex-col items-center justify-center bg-[#0A0E1A] border border-[#1F2937] rounded-lg relative overflow-hidden group">
                 <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#2563eb 0.5px, transparent 0.5px)', backgroundSize: '12px 12px' }}></div>
                 <AnimatePresence mode="wait">
                    {state.status === 'RESOLVED' && state.activeScenario ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="text-center relative z-10"
                      >
                         <div className={`text-6xl font-black uppercase tracking-tighter mb-2 ${
                           state.activeScenario.verdict === 'BLOCK' ? 'text-rose-500' : 'text-emerald-400'
                         }`}>
                            {state.activeScenario.verdict}
                         </div>
                         <div className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.4em]">Handover Ready</div>
                      </motion.div>
                    ) : (
                      <div className="flex flex-col items-center opacity-20 relative z-10">
                         <Terminal className="w-8 h-8 text-gray-500 mb-4" />
                         <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] max-w-[180px] text-center leading-relaxed">System awaiting node resolution signal...</span>
                      </div>
                    )}
                 </AnimatePresence>
               </div>
            </div>

            <div className="flex-grow bg-[#111827] border border-[#1F2937] rounded-lg p-6 flex flex-col gap-6 shadow-xl">
               <div className="flex items-center gap-3 border-b border-[#1F2937] pb-4">
                  <BarChart3 className="text-[#2563eb] w-4 h-4" />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Forensic Breakdown</span>
               </div>

               <div className="space-y-3">
                  <AnimatePresence mode="wait">
                    {state.status === 'RESOLVED' && state.activeScenario ? (
                      <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="space-y-3">
                         {state.activeScenario.forensics.map((f, i) => (
                           <motion.div key={i} variants={{ hidden: { opacity: 0, x: 10 }, visible: { opacity: 1, x: 0 } }} className="bg-[#0A0E1A] border border-[#1F2937] p-4 rounded-lg group hover:border-[#2563eb]/30 transition-colors">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-gray-400 group-hover:text-slate-200 transition-colors">{f.label}</span>
                                <span className={`text-[11px] font-black ${f.type === 'increase' ? 'text-rose-500' : 'text-emerald-400'}`}>
                                   {f.type === 'increase' ? '+' : '-'}{f.weight}%
                                </span>
                              </div>
                              <div className="h-1 w-full bg-[#1F2937] rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }} animate={{ width: `${f.weight}%` }}
                                  transition={{ duration: 1.2, ease: "easeOut" }}
                                  className={`h-full ${f.type === 'increase' ? 'bg-rose-500' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'}`} 
                                />
                              </div>
                           </motion.div>
                         ))}
                      </motion.div>
                    ) : (
                      <div className="py-20 flex flex-col items-center justify-center opacity-10">
                         <Activity className="w-10 h-10 text-white mb-4" />
                         <p className="text-[10px] font-bold uppercase tracking-[0.4em]">Audit Ledger Standard</p>
                      </div>
                    )}
                  </AnimatePresence>
               </div>
            </div>
          </aside>
        </div>
      </main>

      {/* DASHBOARD STATUS BAR */}
      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-10 px-12 py-4 bg-[#030712] border border-[#1F2937] rounded-full z-50 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
         <div className="flex items-center gap-3 text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">
            <Zap className="w-4 h-4 text-[#2563eb]" />
            0.38ms Baseline
         </div>
         <div className="w-px h-6 bg-[#1F2937]" />
         <div className="flex items-center gap-3 text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            RBI Compliant
         </div>
         <div className="w-px h-6 bg-[#1F2937]" />
         <div className="flex items-center gap-3 text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">
            <Activity className="w-4 h-4 text-[#2563eb]" />
            V4.2 Ensemble
         </div>
      </footer>
    </div>
  );
}
