import React, { useState, useEffect, useReducer } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Zap, 
  ChevronRight, 
  Activity, 
  Database, 
  Lock, 
  Globe, 
  Smartphone, 
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileSearch,
  ArrowRight
} from 'lucide-react';

// --- TYPES & INTERFACES ---
type SimulationState = 'IDLE' | 'PROCESSING' | 'RESOLVED';
type ActiveScenario = 'SAFE_UPI' | 'COLLECT_SCAM' | 'GLOBAL_CARD';

interface ForensicFactor {
  label: string;
  weight: number;
  type: 'RISK' | 'SAFETY';
}

interface ScenarioData {
  id: ActiveScenario;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  riskScore: number;
  verdict: 'ALLOW' | 'BLOCK';
  latency: string;
  confidence: number;
  factors: ForensicFactor[];
}

// --- CONSTANTS ---
const SCENARIOS: ScenarioData[] = [
  {
    id: 'SAFE_UPI',
    title: 'Verified Merchant TX',
    subtitle: 'Standard recurring subscription',
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    riskScore: 4,
    verdict: 'ALLOW',
    latency: '34ms',
    confidence: 0.99,
    factors: [
      { label: 'Trusted Merchant ID', weight: -40, type: 'SAFETY' },
      { label: 'Verified IP History', weight: -20, type: 'SAFETY' },
      { label: 'Consistent Velocity', weight: -15, type: 'SAFETY' }
    ]
  },
  {
    id: 'COLLECT_SCAM',
    title: 'UPI Collect Scam',
    subtitle: 'Suspicious high-value request',
    icon: <Smartphone className="w-5 h-5 text-rose-500" />,
    riskScore: 92,
    verdict: 'BLOCK',
    latency: '42ms',
    confidence: 0.96,
    factors: [
      { label: 'Unsolicited Push Request', weight: 45, type: 'RISK' },
      { label: 'Recent Domain Registration', weight: 25, type: 'RISK' },
      { label: 'New Device Fingerprint', weight: 15, type: 'RISK' }
    ]
  },
  {
    id: 'GLOBAL_CARD',
    title: 'Global Card Theft',
    subtitle: 'US Card + Indian IP Mismatch',
    icon: <Globe className="w-5 h-5 text-rose-600" />,
    riskScore: 87,
    verdict: 'BLOCK',
    latency: '38ms',
    confidence: 0.98,
    factors: [
      { label: 'Cross-Border IP Mismatch', weight: 50, type: 'RISK' },
      { label: 'Amount > Safe Threshold', weight: 20, type: 'RISK' },
      { label: 'High-Risk Merchant Cat', weight: 12, type: 'RISK' }
    ]
  }
];

// --- COMPONENTS ---

const ForensicBar = ({ factor, index }: { factor: ForensicFactor; index: number }) => {
  const isRisk = factor.type === 'RISK';
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.2 + (index * 0.15), duration: 0.4 }}
      className="group"
    >
      <div className="flex justify-between items-end mb-1.5">
        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{factor.label}</span>
        <span className={`text-[11px] font-black ${isRisk ? 'text-rose-600' : 'text-emerald-600'}`}>
          {isRisk ? '+' : ''}{factor.weight}%
        </span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${Math.abs(factor.weight)}%` }}
          transition={{ delay: 1.3 + (index * 0.15), duration: 0.8, ease: "circOut" }}
          className={`h-full rounded-full ${isRisk ? 'bg-rose-500' : 'bg-emerald-500'}`}
        />
      </div>
    </motion.div>
  );
};

export default function Demo() {
  const [state, setState] = useState<SimulationState>('IDLE');
  const [activeId, setActiveId] = useState<ActiveScenario | null>(null);
  const [processingText, setProcessingText] = useState('');

  const activeScenario = SCENARIOS.find(s => s.id === activeId);

  const runSimulation = (id: ActiveScenario) => {
    if (state === 'PROCESSING') return;
    setActiveId(id);
    setState('PROCESSING');

    // Processing Sequence
    const steps = ["Normalizing Currency...", "Extracting Vectors...", "Running MVIForest...", "Generating Proof..."];
    let i = 0;
    const interval = setInterval(() => {
      setProcessingText(steps[i]);
      i++;
      if (i >= steps.length) clearInterval(interval);
    }, 150);

    setTimeout(() => {
      setState('RESOLVED');
    }, 1000);
  };

  const reset = () => {
    setState('IDLE');
    setActiveId(null);
    setProcessingText('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 overflow-hidden pt-6">
      {/* HEADER NAV - INSTITUTIONAL LOCK */}
      <nav className="max-w-7xl mx-auto px-6 flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Shield className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-slate-900 leading-none">FLOWSHIELD</h1>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Forensic Lab V1.3</span>
          </div>
        </div>
        
        <button 
          onClick={reset}
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all group flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4 text-slate-400 group-hover:rotate-[-90deg] transition-transform" />
          <span className="text-xs font-bold text-slate-600">Reset Engine</span>
        </button>
      </nav>

      {/* THE ZENITH ALIGNMENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] max-h-[850px] p-6 max-w-7xl mx-auto relative">
        
        {/* PANEL 1: TRIGGER PROTOCOL (LEFT) */}
        <div className="col-span-3 space-y-4">
          <div className="px-1 mb-6">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Trigger Protocol</h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">Select a live transaction pattern to initialize target telemetry.</p>
          </div>

          <div className="space-y-3">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                disabled={state === 'PROCESSING'}
                onClick={() => runSimulation(s.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 group relative overflow-hidden ${
                  activeId === s.id 
                    ? 'border-indigo-500 bg-white shadow-xl shadow-indigo-100/50 ring-1 ring-indigo-100' 
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:translate-y-[-2px] shadow-sm'
                } ${state === 'PROCESSING' && activeId !== s.id ? 'opacity-40 grayscale' : ''}`}
              >
                <div className="flex items-center gap-3 relative z-10">
                  <div className={`p-2.5 rounded-xl transition-colors ${activeId === s.id ? 'bg-indigo-50' : 'bg-slate-50 group-hover:bg-slate-100'}`}>
                    {s.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 leading-tight">{s.title}</h3>
                    <p className="text-[11px] text-slate-400 font-medium">{s.subtitle}</p>
                  </div>
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </button>
            ))}
          </div>

          {/* STATUS BADGE */}
          <div className="mt-8 p-4 rounded-2xl bg-slate-100/50 border border-slate-200/50">
            <div className="flex items-center gap-2 mb-2">
              <Activity className={`w-3 h-3 ${state === 'PROCESSING' ? 'text-indigo-500 animate-pulse' : 'text-slate-400'}`} />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Status</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">Inference Core</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                state === 'IDLE' ? 'bg-slate-200 text-slate-600' : 'bg-indigo-100 text-indigo-600'
              }`}>{state}</span>
            </div>
          </div>
        </div>

        {/* PANEL 2: THE ZENITH CORE (CENTER) */}
        <div className="col-span-5 flex flex-col items-center justify-center relative">
          
          {/* DATA PACKET LAYER (Framer Motion) */}
          <AnimatePresence>
            {state === 'PROCESSING' && (
              <motion.div 
                initial={{ x: -200, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 200, opacity: 0 }}
                transition={{ duration: 0.4, ease: "anticipate" }}
                className="absolute z-50 pointer-events-none"
              >
                <div className="w-3 h-3 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)] ring-4 ring-indigo-100" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* CORE VISUALIZER */}
          <div className="relative w-full aspect-square max-w-[400px] flex items-center justify-center">
            {/* Concentric Rings */}
            <motion.div 
              animate={state === 'PROCESSING' ? { scale: [1, 1.05, 1], rotate: 360 } : {}}
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-slate-200 border-dashed"
            />
            <div className="absolute inset-10 rounded-full border border-slate-100" />
            <div className="absolute inset-20 rounded-full border border-slate-200/50" />
            
            {/* Main Center Core */}
            <div className="relative w-56 h-56 bg-white rounded-full border-4 border-slate-50 shadow-2xl flex flex-col items-center justify-center p-8 text-center ring-1 ring-slate-200">
               <motion.div 
                animate={state === 'PROCESSING' ? { opacity: [1, 0.4, 1] } : {}}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="mb-4"
               >
                 {state === 'IDLE' && <Database className="w-10 h-10 text-slate-200" />}
                 {state === 'PROCESSING' && <Zap className="w-10 h-10 text-indigo-600" />}
                 {state === 'RESOLVED' && (
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-0 ${
                      activeScenario?.verdict === 'ALLOW' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {activeScenario?.verdict === 'ALLOW' ? <CheckCircle2 className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
                    </div>
                 )}
               </motion.div>

               <div className="h-8">
                 <AnimatePresence mode="wait">
                    <motion.div 
                      key={state === 'PROCESSING' ? processingText : state}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-xs font-black text-slate-800 uppercase tracking-widest"
                    >
                      {state === 'IDLE' && "Awaiting Payload"}
                      {state === 'PROCESSING' && processingText}
                      {state === 'RESOLVED' && "Analysis Complete"}
                    </motion.div>
                 </AnimatePresence>
               </div>
            </div>

            {/* Connecting Lines (Institutional Aesthetic) */}
            <div className="absolute left-0 w-12 h-[1px] bg-slate-200 hidden lg:block" />
            <div className="absolute right-0 w-12 h-[1px] bg-slate-200 hidden lg:block" />
          </div>
        </div>

        {/* PANEL 3: AUDIT LEDGER (RIGHT) */}
        <div className="col-span-4 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* LEDGER HEADER */}
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Forensic Verdict</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-Time Decision Log</p>
            </div>
            <FileSearch className="w-5 h-5 text-slate-300" />
          </div>

          <div className="p-8 flex-grow space-y-10">
            {/* VERDICT CARD */}
            <div className="min-h-[140px] flex items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl relative overflow-hidden">
               <AnimatePresence>
                 {state === 'RESOLVED' && activeScenario ? (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4, ease: "backOut" }}
                      className="text-center w-full px-6"
                      aria-live="polite"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <div className="text-left">
                          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Risk Score</span>
                          <span className={`text-4xl font-black ${activeScenario.verdict === 'ALLOW' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {activeScenario.riskScore}.0
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Latency</span>
                          <span className="text-xl font-bold text-slate-800 italic">{activeScenario.latency}</span>
                        </div>
                      </div>

                      <div className={`py-4 rounded-2xl font-black text-6xl tracking-tighter shadow-sm ${
                        activeScenario.verdict === 'ALLOW' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                      }`}>
                        {activeScenario.verdict}
                      </div>

                      <div className="mt-6 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>Confidence: {(activeScenario.confidence * 100).toFixed(0)}%</span>
                        <span>Deterministic AI</span>
                      </div>
                    </motion.div>
                 ) : (
                    <div className="text-slate-300 font-bold uppercase tracking-widest text-xs">
                      No Active Inference
                    </div>
                 )}
               </AnimatePresence>
            </div>

            {/* SHAP EXPLAINABILITY WATERFALL */}
            <div className="space-y-6">
               <div className="flex items-center gap-2 mb-4">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Glass-Box SHAP Attribution</span>
               </div>
               
               <div className="space-y-5">
                 {state === 'RESOLVED' && activeScenario ? (
                    activeScenario.factors.map((f, idx) => (
                      <ForensicBar key={f.label} factor={f} index={idx} />
                    ))
                 ) : (
                    [1, 2, 3].map((i) => (
                      <div key={i} className="opacity-20">
                         <div className="flex justify-between mb-1.5">
                            <div className="h-2 w-24 bg-slate-200 rounded" />
                            <div className="h-2 w-8 bg-slate-200 rounded" />
                         </div>
                         <div className="h-1.5 w-full bg-slate-100 rounded" />
                      </div>
                    ))
                 )}
               </div>
            </div>
          </div>

          {/* FOOTER METADATA */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
              <Lock className="w-3 h-3" /> GDPR & DPDP Compliant Forensic Engine
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
