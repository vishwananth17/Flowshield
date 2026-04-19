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
  FileText,
  TrendingUp,
  Layout
} from 'lucide-react';
import { toast } from 'sonner';

// --- Production DNA Specs (Dashboard Mirror) ---
const DNA = {
  bg_canvas: '#1a1c24',
  bg_sidebar: '#1a1c24',
  bg_card: '#242731',
  bg_inner: '#1a1c24',
  border: '#33394b',
  active_blue: '#2563eb',
  red_accent: '#ef4444',
  green_accent: '#10b981',
  text_dim: '#94a3b8'
};

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
      return { ...state, status: 'PROCESSING', activeScenario: action.scenario, processingStep: 'Initializing engine...' };
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

const PRODUCTION_SCENARIOS: Scenario[] = [
  {
    id: 'SAFE_UPI',
    name: 'Safe UPI Payment',
    description: 'Typical INR 450 grocery transaction',
    icon: <ShieldCheck className="w-4 h-4" />,
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
    icon: <AlertTriangle className="w-4 h-4" />,
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
    icon: <Lock className="w-4 h-4" />,
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
    dispatch({ type: 'SET_STEP', step: 'Forensic consensus...' });

    await new Promise(r => setTimeout(r, 500));
    dispatch({ type: 'COMPLETE_SIMULATION' });
    toast.success('Simulation Completed');
  };

  return (
    <div className="flex h-screen bg-[#1a1c24] text-slate-100 font-sans selection:bg-blue-600/30 overflow-hidden tracking-tight">
      
      {/* 1. SIDEBAR (DNA MIRROR) */}
      <aside className="w-64 bg-[#1a1c24] border-r border-[#33394b] flex flex-col hidden lg:flex">
        <div className="p-6 border-b border-[#33394b] flex items-center gap-3">
          <div className="w-8 h-8 opacity-90">
             <ShieldCheck className="text-[#2563eb] w-8 h-8" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white leading-none">Flowshield AI</span>
        </div>

        <div className="flex-grow p-4 space-y-8 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
             <Navlink icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
             <Navlink icon={<ArrowRightLeft className="w-4 h-4" />} label="Transactions" />
             <Navlink icon={<AlertTriangle className="w-4 h-4" />} label="Alerts" />
             <Navlink icon={<Layout className="w-4 h-4" />} label="Simulation" active />
             <Navlink icon={<BarChart3 className="w-4 h-4" />} label="Analytics" />
          </div>

          <div className="space-y-4 pt-10">
             <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest px-3">Simulator Engine</div>
             <div className="space-y-1">
                {PRODUCTION_SCENARIOS.map((s) => (
                  <button
                    key={s.id}
                    disabled={state.status === 'PROCESSING'}
                    onClick={() => handleRunSimulation(s)}
                    className={`w-full text-left p-3 rounded-md flex items-center gap-3 transition-colors ${
                      state.activeScenario?.id === s.id 
                      ? 'bg-[#242731] border border-[#33394b] text-[#2563eb]' 
                      : 'text-gray-400 hover:text-white hover:bg-[#242731]/50'
                    }`}
                  >
                     <div className={`w-8 h-8 rounded flex items-center justify-center ${
                       state.activeScenario?.id === s.id ? 'bg-[#2563eb] text-white' : 'bg-[#242731]/50'
                     }`}>
                        <span className="w-4 h-4">{s.icon}</span>
                     </div>
                     <span className="text-[13px] font-medium tracking-tight">{s.name}</span>
                  </button>
                ))}
             </div>
          </div>
        </div>

        <div className="p-6 border-t border-[#33394b]">
           <Navlink icon={<Settings className="w-4 h-4" />} label="Settings" />
           <Navlink icon={<FileText className="w-4 h-4" />} label="Documentation" />
        </div>
      </aside>

      {/* 2. MAIN HUB Area */}
      <div className="flex-grow flex flex-col min-w-0 bg-[#0f1117]">
        
        {/* HEADER */}
        <header className="h-16 border-b border-[#33394b] bg-[#1a1c24] flex items-center justify-between px-8 shrink-0">
           <div className="flex items-center flex-grow max-w-xl">
              <div className="relative w-full">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                 <input disabled type="text" placeholder="Search transactions, alerts..." className="w-full bg-[#242731] border border-[#33394b] rounded-md py-2 pl-10 pr-4 text-sm text-gray-400 focus:outline-none" />
              </div>
           </div>

           <div className="flex items-center gap-6 ml-6">
              <div className="bg-[#242731] border border-[#33394b] px-3 py-1.5 rounded-full flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></div>
                 <span className="text-[10px] font-bold text-[#10b981] uppercase tracking-widest leading-none">System Active</span>
              </div>
              <div className="flex items-center gap-4 text-gray-400">
                 <button><Bell className="w-5 h-5 hover:text-white transition-colors" /></button>
                 <div className="w-8 h-8 rounded-full bg-[#2563eb] flex items-center justify-center text-white font-bold text-[10px]">VB</div>
              </div>
           </div>
        </header>

        {/* WORKSPACE */}
        <div className="p-8 lg:p-10 flex-grow overflow-hidden flex flex-col gap-8">
           
           <div className="flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Intelligence Hub</h1>
                <p className="text-sm text-slate-400 mt-1">Simulate adversarial scenarios to test forensic detection logic.</p>
              </div>
              <button 
                onClick={() => dispatch({ type: 'RESET' })}
                className="flex items-center gap-2 px-4 py-2 bg-[#242731] border border-[#33394b] rounded-md text-xs font-bold text-gray-400 hover:text-white transition-all shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Engine
              </button>
           </div>

           <div className="grid lg:grid-cols-12 gap-8 flex-grow">
              
              {/* CORE HUB */}
              <section className="lg:col-span-7 flex flex-col bg-[#242731] border border-[#33394b] rounded-xl shadow-sm relative overflow-hidden">
                 <div className="p-4 border-b border-[#33394b] flex items-center justify-between bg-[#1a1c24]/30">
                    <div className="flex items-center gap-2">
                       <Cpu className="w-4 h-4 text-[#2563eb]" />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neural Processing Node</span>
                    </div>
                 </div>

                 <div className="flex-grow flex items-center justify-center p-12 relative">
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

                       <div className="relative w-64 h-64 flex items-center justify-center">
                          <div className="absolute inset-0 border border-[#33394b]/30 rounded-full" />
                          <div className="absolute inset-12 border border-[#33394b]/10 rounded-full" />
                          
                          <div className="relative bg-[#1a1c24] border border-[#33394b] w-40 h-40 rounded-full flex flex-col items-center justify-center shadow-inner">
                             <AnimatePresence mode="wait">
                                {state.status === 'RESOLVED' ? (
                                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                                     <CheckCircle2 style={{ color: state.activeScenario?.verdict === 'BLOCK' ? '#ef4444' : '#10b981' }} className="w-16 h-16" />
                                  </motion.div>
                                ) : (
                                  <div className="flex flex-col items-center opacity-20">
                                     <Activity className={`w-8 h-8 ${state.status === 'PROCESSING' ? 'text-[#2563eb] animate-pulse' : 'text-slate-800'}`} />
                                     <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest mt-4">Standby</span>
                                  </div>
                                )}
                             </AnimatePresence>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="p-4 border-t border-[#33394b] flex justify-between bg-[#1a1c24]/40">
                    <div className="px-3 py-1.5 rounded-md border border-[#33394b] text-[10px] font-black text-slate-500 uppercase tracking-widest bg-[#242731]">Merchant SDK</div>
                    <div className="px-3 py-1.5 rounded-md border border-[#33394b] text-[10px] font-black text-slate-500 uppercase tracking-widest bg-[#242731]">Audit Ledger</div>
                 </div>
              </section>

              {/* FORENSICS */}
              <aside className="lg:col-span-5 flex flex-col gap-6">
                 {/* VERDICT CARD */}
                 <div className="bg-[#242731] border border-[#33394b] rounded-xl p-8 flex flex-col items-center justify-center min-h-[220px] shadow-sm relative overflow-hidden transition-all hover:border-[#404b61]">
                    <AnimatePresence mode="wait">
                       {state.status === 'RESOLVED' && state.activeScenario ? (
                          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="text-center w-full">
                             <div 
                               className={`text-6xl font-black uppercase tracking-tighter mb-4 py-8 border rounded-xl bg-black/10 ${
                                 state.activeScenario.verdict === 'BLOCK' ? 'text-[#ef4444] border-[#ef4444]/20' : 'text-[#10b981] border-[#10b981]/20'
                               }`}
                             >
                                {state.activeScenario.verdict}
                             </div>
                             <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">Forensic Logic Handover</div>
                          </motion.div>
                       ) : (
                          <div className="flex flex-col items-center opacity-10">
                             <TrendingUp className="w-10 h-10 text-slate-400 mb-4" />
                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Awaiting Analysis</span>
                          </div>
                       )}
                    </AnimatePresence>
                 </div>

                 {/* RISK TRACE */}
                 <div className="bg-[#242731] border border-[#33394b] rounded-xl p-6 flex flex-col gap-6 flex-grow shadow-sm">
                    <div className="flex items-center gap-3 border-b border-[#33394b]/50 pb-4">
                       <BarChart3 className="text-[#2563eb] w-4 h-4" />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Analysis Stack</span>
                    </div>

                    <div className="space-y-3">
                       <AnimatePresence mode="wait">
                          {state.status === 'RESOLVED' && state.activeScenario ? (
                             <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="space-y-3">
                                {state.activeScenario.forensics.map((f, i) => (
                                   <div key={i} className="bg-[#1a1c24] border border-[#33394b]/50 p-4 rounded-lg group hover:border-[#33394b] transition-all">
                                      <div className="flex justify-between items-center mb-2">
                                         <span className="text-xs font-bold text-slate-400">{f.label}</span>
                                         <span className="text-[11px] font-black" style={{ color: f.type === 'increase' ? '#ef4444' : '#10b981' }}>
                                            {f.type === 'increase' ? '+' : '-'}{f.weight}%
                                         </span>
                                      </div>
                                      <div className="h-1 w-full bg-[#242731] rounded-full overflow-hidden">
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
                                <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Audit Ledger Idle</span>
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

// --- Dashboard Mirror Components ---
function Navlink({ icon, label, active = false }: { icon: any; label: string; active?: boolean }) {
   return (
      <div className={`flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all ${
         active ? 'bg-[#2563eb] text-white shadow-xl shadow-blue-500/20 font-semibold' : 'text-gray-400 hover:text-white hover:bg-[#242731]'
      }`}>
         <div className="w-4 h-4 flex items-center justify-center">{icon}</div>
         <span className="text-[14px] tracking-tight">{label}</span>
      </div>
   );
}
