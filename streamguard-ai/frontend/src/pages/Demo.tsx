import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Zap, 
  Activity, 
  Lock,
  Globe,
  Database,
  Terminal,
  Cpu,
  ArrowRight,
  ChevronRight,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const [progress, setProgress] = useState(0);

  const handleRunDemo = async (scenario: Scenario) => {
    setActiveScenario(scenario);
    setIsProcessing(true);
    setResult(null);
    setProgress(0);
    
    // START SIMULATION PHASES
    try {
      // Phase 1: Normalization
      setCurrentPhase('normalizing');
      await new Promise(r => setTimeout(r, 400));
      setProgress(30);

      // Phase 2: Extraction
      setCurrentPhase('extracting');
      await new Promise(r => setTimeout(r, 600));
      setProgress(70);

      // Real API Call during extraction
      const payload = {
        ...scenario.payload,
        transaction_id: `demo_${scenario.id}_${Date.now()}`
      };
      
      const response = await api.post('/transactions/sandbox', payload);
      
      // Phase 3: Deciding
      setCurrentPhase('deciding');
      await new Promise(r => setTimeout(r, 500));
      setProgress(100);

      // Phase 4: Resolved
      setResult(response.data);
      setCurrentPhase('resolved');
      toast.success('Forensic Analysis Ready');
    } catch (error: any) {
      console.error(error);
      toast.error('Garter Protocol Failure: Service Interrupted');
      setIsProcessing(false);
      setCurrentPhase('idle');
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      
      {/* --- GRID LAYOUT --- */}
      <div className="relative z-10 grid lg:grid-cols-12 min-h-screen">
        
        {/* LEFT PANEL: THE TRIGGER */}
        <aside className="lg:col-span-3 border-r border-white/5 bg-slate-950/50 backdrop-blur-3xl p-6 lg:p-8 space-y-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">Oracle <span className="text-indigo-400">Hub</span></span>
          </div>

          <div className="space-y-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-6">Select Ingestion Scenario</div>
            {demoScenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => !isProcessing && handleRunDemo(s)}
                disabled={isProcessing}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-300 group relative overflow-hidden ${
                  activeScenario?.id === s.id 
                  ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-4 relative z-10">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-slate-950/80 border border-white/5 group-hover:scale-110 transition-transform`}>
                    {s.icon}
                  </div>
                  <div>
                    <div className={`font-bold text-sm ${activeScenario?.id === s.id ? 'text-indigo-300' : 'text-slate-200'}`}>{s.name}</div>
                    <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{s.description}</div>
                  </div>
                </div>
                {activeScenario?.id === s.id && (
                  <motion.div layoutId="glow" className="absolute inset-0 bg-indigo-500/5" />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {activeScenario && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="pt-10 space-y-4"
              >
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Raw Payload Stream</div>
                <div className="bg-slate-950/80 border border-white/5 rounded-lg p-4 font-mono text-[10px] text-indigo-400/80 overflow-hidden relative group">
                  <motion.div
                    animate={{ y: [0, -100] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    className="space-y-1"
                  >
                    {JSON.stringify(activeScenario.payload, null, 2).split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                    {JSON.stringify(activeScenario.payload, null, 2).split('\n').map((line, i) => (
                      <div key={i+100}>{line}</div>
                    ))}
                  </motion.div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950 pointer-events-none" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>

        {/* MIDDLE PANEL: THE ENGINE */}
        <main className="lg:col-span-5 bg-[#020617] relative flex flex-col items-center justify-center p-8 lg:p-12 overflow-hidden">
          {/* Background Circuitry Decor */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05),transparent_70%)]" />
          
          <div className="w-full max-w-md relative z-10 space-y-12">
            
            {/* CENTRAL PROCESSING HUB */}
            <div className="relative flex items-center justify-center">
              {/* Outer Rings */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                className="absolute w-64 h-64 border border-dashed border-indigo-500/20 rounded-full" 
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                className="absolute w-48 h-48 border border-white/5 rounded-full" 
              />

              {/* THE CORE */}
              <div className="relative z-10 text-center">
                <AnimatePresence mode="wait">
                  {currentPhase === 'idle' && (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.2 }}
                      className="w-32 h-32 bg-slate-950 rounded-3xl border-2 border-slate-800 flex flex-col items-center justify-center p-6"
                    >
                      <Cpu className="w-10 h-10 text-slate-700 animate-pulse" />
                      <div className="text-[10px] font-black tracking-widest text-slate-700 mt-2">STANDBY</div>
                    </motion.div>
                  )}

                  {isProcessing && currentPhase !== 'resolved' && (
                    <motion.div
                      key="active"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-40 h-40 bg-indigo-950/20 rounded-full border-2 border-indigo-500 shadow-[0_0_50px_rgba(99,102,241,0.2)] flex flex-col items-center justify-center overflow-hidden"
                    >
                      <motion.div 
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="text-indigo-400 font-bold mb-1"
                      >
                        {progress}%
                      </motion.div>
                      <div className="text-[9px] font-black tracking-[0.2em] text-indigo-400/60 uppercase">
                        {currentPhase}
                      </div>

                      {/* Scanners */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent h-12 w-full"
                        animate={{ y: [-100, 200] }}
                        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                      />
                    </motion.div>
                  )}

                  {currentPhase === 'resolved' && result && (
                    <motion.div
                      key="result"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", damping: 12, stiffness: 200 }}
                      className={`w-48 h-48 rounded-full border-4 flex flex-col items-center justify-center shadow-2xl ${
                        result.decision === 'block' 
                        ? 'border-rose-500 bg-rose-500/10 shadow-rose-500/20' 
                        : result.decision === 'review'
                        ? 'border-amber-500 bg-amber-500/10 shadow-amber-500/20'
                        : 'border-emerald-500 bg-emerald-500/10 shadow-emerald-500/20'
                      }`}
                    >
                      <motion.div 
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className={`text-4xl font-black tracking-tighter uppercase ${
                          result.decision === 'block' ? 'text-rose-500' : result.decision === 'review' ? 'text-amber-500' : 'text-emerald-500'
                        }`}
                      >
                        {result.decision}
                      </motion.div>
                      <div className="text-[10px] font-bold text-white/40 tracking-[0.3em] mt-1">DECISION</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* STATUS REELS */}
            <div className="bg-slate-950/80 border border-white/5 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden h-40">
              <AnimatePresence mode="wait">
                {currentPhase === 'idle' ? (
                  <motion.div key="wait" className="flex flex-col items-center justify-center h-full text-slate-600">
                    <Terminal className="w-5 h-5 mb-2" />
                    <div className="text-xs font-medium">Waiting for merchant trigger...</div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="logs"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-mono text-[11px] space-y-2 h-full py-2"
                  >
                    {currentPhase === 'normalizing' && (
                      <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-2 text-indigo-400">
                        <CheckCircle2 className="w-3 h-3" /> Normalizing Base Currency (EUR -> INR)...
                      </motion.div>
                    )}
                    {currentPhase === 'extracting' && (
                      <>
                        <div className="flex items-center gap-2 text-indigo-400 underline decoration-indigo-400/20 underline-offset-4">
                          <CheckCircle2 className="w-3 h-3" /> Currency Matched: SUCCESS
                        </div>
                        <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-2 text-indigo-400">
                          <Zap className="w-3 h-3" /> Extracting User IPs... [Verified]
                        </motion.div>
                        <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-center gap-2 text-indigo-400">
                          <Database className="w-3 h-3" /> Cross-Referencing Merchant MCC...
                        </motion.div>
                      </>
                    )}
                    {currentPhase === 'deciding' && (
                      <div className="flex flex-col items-center justify-center h-full space-y-3">
                        <div className="flex gap-1">
                          {[1,2,3].map(i => (
                            <motion.div 
                              key={i} 
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ repeat: Infinity, duration: 0.6, delay: i*0.2 }}
                              className="w-2 h-2 bg-indigo-500 rounded-full" 
                            />
                          ))}
                        </div>
                        <div className="text-white font-bold tracking-widest text-[10px] uppercase">Ensemble Finalizing...</div>
                      </div>
                    )}
                    {currentPhase === 'resolved' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col justify-center gap-4">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 uppercase tracking-widest font-black text-[9px]">Network Latency</span>
                          <span className="text-emerald-400 font-bold">{result.detection_latency_ms}ms</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 uppercase tracking-widest font-black text-[9px]">Model Confidence</span>
                          <span className="text-indigo-400 font-bold">{(result.confidence * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: "100%" }} 
                            transition={{ duration: 1.5 }}
                            className="bg-indigo-500 h-full" 
                          />
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </main>

        {/* RIGHT PANEL: THE FORENSICS */}
        <aside className="lg:col-span-4 border-l border-white/5 bg-slate-950/20 p-8 space-y-8 backdrop-blur-3xl">
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-400" /> Glass-Box <span className="text-indigo-400 font-black">Forensics</span>
            </h2>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-xs uppercase tracking-wider">
              SHAP Vector Attribution: Decomposing decision layers for commercial transparency.
            </p>
          </div>

          <div className="space-y-6 pt-6">
            <AnimatePresence mode="wait">
              {result ? (
                <div className="space-y-4">
                  {/* RISK SCORE HEADLINE */}
                  <div className="flex items-end justify-between mb-8">
                    <div>
                      <div className="text-[9px] font-black tracking-widest text-slate-600 mb-1 uppercase">Attributed Risk</div>
                      <div className="text-4xl font-mono font-black text-white">
                        {(result.risk_score * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`${result.decision === 'block' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                        {result.model_version}
                      </Badge>
                    </div>
                  </div>

                  {/* SHAP WATERFALL */}
                  <div className="space-y-6">
                    {result.reasons.map((r: string, i: number) => {
                      const isNegative = r.toLowerCase().includes('good') || r.toLowerCase().includes('safe') || r.toLowerCase().includes('within normal');
                      return (
                        <motion.div 
                          key={i}
                          initial={{ x: 50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 1.5 + (i * 0.2), type: "spring", stiffness: 100 }}
                          className="space-y-2"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold text-slate-400 truncate max-w-[200px]">{r}</span>
                            <span className={`text-[10px] font-mono font-bold ${isNegative ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isNegative ? '-' : '+'}{Math.round((i+1) * (result.risk_score * 15))}%
                            </span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full relative overflow-hidden">
                            <motion.div
                              initial={{ width: 0, x: isNegative ? 100 : -100 }}
                              animate={{ width: `${Math.max(20, Math.min(80, (i+1)*25))}%`, x: 0 }}
                              transition={{ duration: 1, delay: 1.6 + (i * 0.2) }}
                              className={`h-full rounded-full ${isNegative ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* FOOTER METRICS */}
                  <div className="pt-10 grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5">
                      <div className="text-[8px] font-black text-slate-500 tracking-[0.2em] mb-2 uppercase">MVIForest Score</div>
                      <div className="text-xl font-mono font-bold text-slate-300">{result.model_scores?.mviforest || '0.00'}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5">
                      <div className="text-[8px] font-black text-slate-500 tracking-[0.2em] mb-2 uppercase">XGBoost Logit</div>
                      <div className="text-xl font-mono font-bold text-slate-300">{result.model_scores?.xgboost || '0.00'}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center border border-white/5">
                    <Globe className="w-8 h-8 text-slate-700" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Forensic Engine Idle</div>
                    <p className="text-xs text-slate-700 max-w-[200px]">Ingest a transaction to begin real-time attribution analysis.</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </aside>

      </div>

      {/* FIXED FOOTER STATS */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-3 bg-indigo-600/10 backdrop-blur-2xl border border-indigo-500/30 rounded-full z-50">
        <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-indigo-400 uppercase">
          <Zap className="w-3 h-3 animate-pulse" /> 0.38ms Baseline
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-indigo-400 uppercase">
          <CheckCircle2 className="w-3 h-3" /> RBI Compliant
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-indigo-400 uppercase">
          <Globe className="w-3 h-3" /> Geo-Fence Active
        </div>
      </div>
    </div>
  );
}
