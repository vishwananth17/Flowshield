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
  Activity,
  Search,
  Bell,
  User,
  LayoutDashboard,
  ArrowRightLeft,
  Settings,
  HelpCircle,
  FileText
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

const DASHBOARD_DNA_SCENARIOS: Scenario[] = [
  {
    id: 'SAFE_UPI',
    name: 'Safe UPI Payment',
    description: 'Typical INR 450 grocery transaction',
    icon: <ShieldCheck className="w-5 h-5 text-[#10b981]" />,
    risk_score: 0.02,
    confidence: 0.99,
    latency: 12,
    verdict: 'ALLOW',
    forensics: [
      { label: 'Device ID Match', weight: 15, type: 'decrease' },
      { label: 'Verified Merchant', weight: 40, type: 'decrease' },
      { label: 'Baseline Velocity', weight: 10, type: 'decrease' }
    ],
    payload: { amount: 450, currency: 'INR', channel: 'upi' }
  },
  {
    id: 'COLLECT_SCAM',
    name: 'UPI Collect Scam',
    description: 'High-value pull on unverified device',
    icon: <AlertTriangle className="w-5 h-5 text-[#ef4444]" />,
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
    icon: <Lock className="w-5 h-5 text-[#ef4444]" />,
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
    dispatch({ type: 'SET_STEP', step: 'Vectorizing signals...' });

    await new Promise(r => setTimeout(r, 700));
    dispatch({ type: 'SET_STEP', step: 'AI Analysis...' });

    await new Promise(r => setTimeout(r, 500));
    dispatch({ type: 'COMPLETE_SIMULATION' });
    toast.success('Simulation Completed');
  };

  const getVerdictPrimaryColor = (verdict: 'BLOCK' | 'ALLOW') => verdict === 'BLOCK' ? '#ef4444' : '#10b981';

  return (
    <div className="flex h-screen bg-[#0A0E1A] text-slate-200 font-sans selection:bg-blue-600/30 overflow-hidden">
      
      {/* 1. DASHBOARD SIDEBAR */}
      <aside className="w-64 bg-[#030712] border-r border-[#1F2937] flex flex-col hidden lg:flex">
        <div className="p-6 border-b border-[#1F2937] flex items-center gap-3">
          <div className="w-8 h-8 bg-[#2563eb] rounded flex items-center justify-center">
            <ShieldCheck className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white leading-none">Flowshield AI</span>
        </div>

        <div className="flex-grow p-4 space-y-8 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
             <SidebarLink icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
             <SidebarLink icon={<ArrowRightLeft className="w-4 h-4" />} label="Transactions" />
             <SidebarLink icon={<AlertTriangle className="w-4 h-4" />} label="Alerts" />
             <SidebarLink icon={<Activity className="w-4 h-4" />} label="Simulation" active />
          </div>

          <div className="space-y-4 pt-10">
             <div className="text-[10px] uppercase font-bold text-gray-600 tracking-widest px-3">Simulator Engine</div>
             <div className="space-y-2">
                {DASHBOARD_DNA_SCENARIOS.map((s) => (
                  <button
                    key={s.id}
                    disabled={state.status === 'PROCESSING'}
                    onClick={() => handleRunSimulation(s)}
                    className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all ${
                      state.activeScenario?.id === s.id 
                      ? 'bg-[#2563eb]/10 text-[#2563eb] border border-[#2563eb]/30' 
                      : 'text-gray-500 hover:text-white hover:bg-[#111827]'
                    }`}
                  >
                     <div className={`w-8 h-8 rounded flex items-center justify-center ${
                        state.activeScenario?.id === s.id ? 'bg-[#2563eb] text-white' : 'bg-[#111827]'
                     }`}>
                        <span className="w-4 h-4">{s.icon}</span>
                     </div>
                     <span className="text-[12px] font-bold tracking-tight">{s.name}</span>
                  </button>
                ))}
             </div>
          </div>
        </div>

        <div className="p-6 border-t border-[#1F2937]">
           <SidebarLink icon={<Settings className="w-4 h-4" />} label="Settings" />
           <SidebarLink icon={<FileText className="w-4 h-4" />} label="Documentation" />
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-grow flex flex-col min-w-0 bg-[#0A0E1A]">
        
        {/* DASHBOARD TOP HEADER */}
        <header className="h-16 border-b border-[#1F2937] bg-[#030712] flex items-center justify-between px-8 shrink-0">
           <div className="flex items-center flex-grow max-w-xl">
              <div className="relative w-full">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                 <input disabled type="text" placeholder="Search transactions, alerts..." className="w-full bg-[#111827] border border-[#1F2937] rounded-lg py-2 pl-10 pr-4 text-sm text-gray-400 focus:outline-none" />
              </div>
           </div>

           <div className="flex items-center gap-6 ml-6">
              <div className="bg-[#111827] border border-[#1F2937] px-3 py-1.5 rounded-full flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></div>
                 <span className="text-[10px] font-bold text-[#10b981] uppercase tracking-widest leading-none">Engine Live</span>
              </div>
              <div className="flex items-center gap-4 text-gray-400">
                 <button><Bell className="w-5 h-5 hover:text-white transition-colors" /></button>
                 <div className="w-8 h-8 rounded-full bg-[#2563eb] flex items-center justify-center text-white font-bold text-xs">V</div>
              </div>
           </div>
        </header>

        {/* CONTENT */}
        <div className="p-6 lg:p-10 flex-grow overflow-hidden flex flex-col gap-8">
           
           <div className="flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Intelligence Hub</h1>
                <p className="text-sm text-gray-500 mt-1">Simulate adversarial attacks to test forensic recall.</p>
              </div>
              <button 
                onClick={() => dispatch({ type: 'RESET' })}
                className="flex items-center gap-2 px-4 py-2 bg-[#111827] border border-[#1F2937] rounded-lg text-xs font-bold text-gray-400 hover:text-white transition-all shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Machine
              </button>
           </div>

           <div className="grid lg:grid-cols-12 gap-8 flex-grow">
              
              {/* THE ENGINE CARD */}
              <section className="lg:col-span-7 flex flex-col bg-[#111827] border border-[#1F2937] rounded-xl shadow-2xl relative overflow-hidden">
                 <div className="p-6 border-b border-[#1F2937] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <Cpu className="w-4 h-4 text-[#2563eb]" />
                       <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Neural Processor Node</span>
                    </div>
                 </div>

                 <div className="flex-grow flex items-center justify-center p-12 relative overflow-hidden">
                    <div className="relative z-20 flex flex-col items-center gap-14">
                       <div className="h-6">
                         <AnimatePresence mode="wait">
                           {state.status === 'PROCESSING' && (
                             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[11px] font-black text-[#2563eb] uppercase tracking-[0.5em]">
                               {state.processingStep}
                             </motion.div>
                           )}
                         </AnimatePresence>
                       </div>

                       <div className="relative w-72 h-72 flex items-center justify-center">
                          <div className="absolute inset-0 border border-gray-800 rounded-full" />
                          <div className="relative bg-[#0A0E1A] border border-[#1F2937] w-48 h-48 rounded-full flex flex-col items-center justify-center shadow-inner">
                             <AnimatePresence mode="wait">
                                {state.status === 'RESOLVED' ? (
                                  <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                                     <CheckCircle2 style={{ color: getVerdictPrimaryColor(state.activeScenario?.verdict || 'ALLOW') }} className="w-16 h-16" />
                                  </motion.div>
                                ) : (
                                  <div className="flex flex-col items-center">
                                     <Activity className={`w-10 h-10 ${state.status === 'PROCESSING' ? 'text-[#2563eb] animate-pulse' : 'text-gray-800'}`} />
                                     <span className="text-[9px] font-bold text-gray-700 uppercase tracking-widest mt-4">Standby</span>
                                  </div>
                                )}
                             </AnimatePresence>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="p-6 border-t border-[#1F2937] flex justify-between bg-[#0A0E1A]/40 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                       <div className="bg-[#111827] border border-[#1F2937] px-2 py-1 rounded-md text-[9px] font-black text-gray-500 uppercase">Merchant SDK</div>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="bg-[#111827] border border-[#1F2937] px-2 py-1 rounded-md text-[9px] font-black text-gray-500 uppercase">Audit Ledger</div>
                    </div>
                 </div>
              </section>

              {/* AUDIT & VERDICT PANEL */}
              <aside className="lg:col-span-5 flex flex-col gap-6">
                 {/* VERDICT CARD */}
                 <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-xl min-h-[200px]">
                    <AnimatePresence mode="wait">
                       {state.status === 'RESOLVED' && state.activeScenario ? (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                             <div className="text-6xl font-black uppercase tracking-tighter" style={{ color: getVerdictPrimaryColor(state.activeScenario.verdict) }}>
                                {state.activeScenario.verdict}
                             </div>
                             <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] mt-3">Forensic Verdict</div>
                          </motion.div>
                       ) : (
                          <div className="flex flex-col items-center opacity-10">
                             <TrendingUp className="w-10 h-10 text-gray-500 mb-4" />
                             <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Handover Pending</span>
                          </div>
                       )}
                    </AnimatePresence>
                 </div>

                 {/* RISK BREAKDOWN */}
                 <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 flex flex-col gap-6 flex-grow shadow-lg">
                    <div className="flex items-center gap-3 border-b border-[#1F2937] pb-4">
                       <BarChart3 className="text-[#2563eb] w-4 h-4" />
                       <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Risk Breakdown</span>
                    </div>

                    <div className="space-y-3">
                       <AnimatePresence mode="wait">
                          {state.status === 'RESOLVED' && state.activeScenario ? (
                             <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="space-y-3">
                                {state.activeScenario.forensics.map((f, i) => (
                                   <div key={i} className="bg-[#0A0E1A] border border-[#1F2937] p-4 rounded-lg">
                                      <div className="flex justify-between items-center mb-2">
                                         <span className="text-xs font-bold text-gray-500">{f.label}</span>
                                         <span className="text-[11px] font-black" style={{ color: f.type === 'increase' ? '#ef4444' : '#10b981' }}>
                                            {f.type === 'increase' ? '+' : '-'}{f.weight}%
                                         </span>
                                      </div>
                                      <div className="h-1 w-full bg-[#1F2937] rounded-full overflow-hidden">
                                         <motion.div 
                                            initial={{ width: 0 }} animate={{ width: `${f.weight}%` }}
                                            transition={{ duration: 1.2, ease: "easeOut" }}
                                            style={{ backgroundColor: f.type === 'increase' ? '#ef4444' : '#10b981' }}
                                            className="h-full" 
                                         />
                                      </div>
                                   </div>
                                ))}
                             </motion.div>
                          ) : (
                             <div className="py-20 flex flex-col items-center justify-center opacity-10">
                                <Database className="w-12 h-12 text-white mb-4" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Audit Idle</span>
                             </div>
                          )}
                       </AnimatePresence>
                    </div>
                 </div>
              </aside>
           </div>
        </div>
      </div>
    </div>
  );
}

// --- Dashboard Component Mirroring ---
function SidebarLink({ icon, label, active = false }: { icon: any; label: string; active?: boolean }) {
   return (
      <div className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${
         active ? 'bg-[#2563eb] text-white shadow-lg shadow-blue-900/20' : 'text-gray-500 hover:text-white hover:bg-[#111827]'
      }`}>
         <div className="w-4 h-4 flex items-center justify-center">{icon}</div>
         <span className="text-sm font-medium tracking-tight">{label}</span>
      </div>
   );
}

function TrendingUp(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
  )
}
