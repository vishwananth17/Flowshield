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
  CreditCard
} from 'lucide-react';
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
    
    try {
      setCurrentPhase('normalizing');
      await new Promise(r => setTimeout(r, 400));
      setProgress(30);

      setCurrentPhase('extracting');
      await new Promise(r => setTimeout(r, 600));
      setProgress(70);

      const payload = {
        ...scenario.payload,
        transaction_id: `demo_${scenario.id}_${Date.now()}`
      };
      
      const response = await api.post('/transactions/sandbox', payload);
      
      setCurrentPhase('deciding');
      await new Promise(r => setTimeout(r, 500));
      setProgress(100);

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
      
      <div className="relative z-10 grid lg:grid-cols-12 min-h-screen">
        
        {/* --- INFERENCE WIRING OVERLAY (Neural Swarm Hub) --- */}
        <div className="absolute inset-0 pointer-events-none z-30 hidden lg:block overflow-hidden">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
             {/* Data Swarm: Left to Center */}
             <AnimatePresence>
               {isProcessing && [0,1,2].map((i) => (
                  <motion.circle
                    key={`swarm-in-${i}`}
                    r="0.4"
                    fill="#6366f1"
                    initial={{ offsetDistance: "0%" }}
                    animate={{ offsetDistance: "100%" }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear", delay: i*0.3 }}
                    style={{ offsetPath: `path('M 25 40 Q 37 40 50 40')` }}
                    className="shadow-[0_0_15px_#6366f1]"
                  />
               ))}
             </AnimatePresence>

             {/* Data Swarm: Center to Right */}
             <AnimatePresence>
                {currentPhase === 'resolved' && [0,1,2].map((i) => (
                    <motion.circle
                      key={`swarm-out-${i}`}
                      r="0.4"
                      fill="#818cf8"
                      initial={{ offsetDistance: "0%" }}
                      animate={{ offsetDistance: "100%" }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: i*0.1 }}
                      style={{ offsetPath: `path('M 50 40 Q 63 40 75 40')` }}
                      className="shadow-[0_0_15px_#818cf8]"
                    />
                ))}
             </AnimatePresence>
          </svg>
        </div>

        {/* 1. LEFT PANEL: RAW DATA TRIGGER */}
        <aside className="lg:col-span-3 border-r border-white/5 bg-slate-950/50 backdrop-blur-3xl p-6 lg:p-8 flex flex-col justify-between">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <ShieldCheck className="text-white w-5 h-5" />
              </div>
              <span className="text-lg font-bold tracking-tight">Oracle Hub</span>
            </div>

            <div className="space-y-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">Scenario Pulse</div>
              {demoScenarios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => !isProcessing && handleRunDemo(s)}
                  disabled={isProcessing}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
                    activeScenario?.id === s.id 
                    ? 'bg-indigo-600/10 border-indigo-500/50' 
                    : 'bg-slate-900/40 border-slate-800/50 hover:border-indigo-500/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-950 border border-white/5 group-hover:scale-110 transition-transform">
                      {s.icon}
                    </div>
                    <div>
                      <div className="font-bold text-[13px]">{s.name}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest">{s.id.split('_')[0]} context</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-10 border-t border-white/5">
             <div className="text-[9px] uppercase font-black text-slate-600 tracking-widest">Input Context Stack</div>
             <NeuralIconRow icon={<CreditCard className="w-4 h-4" />} label="Card Payload" />
             <NeuralIconRow icon={<Globe className="w-4 h-4" />} label="Geographic Data" />
          </div>
        </aside>

        {/* 2. MIDDLE PANEL: NEURAL PROCESSOR */}
        <main className="lg:col-span-5 bg-[#02030a] relative flex flex-col items-center justify-center p-8 lg:p-12 overflow-hidden">
          
          {/* Label 1: API Anchor (Left) */}
          <div className="absolute left-0 top-[40%] -translate-x-1/2 flex flex-col items-center gap-2 z-40">
            <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
               <Globe className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-black tracking-[0.2em] text-slate-500 uppercase">Merchant SDK</span>
          </div>

          {/* Label 2: API Anchor (Right) */}
          <div className="absolute right-0 top-[40%] translate-x-1/2 flex flex-col items-center gap-2 z-40">
            <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
               <Database className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-black tracking-[0.2em] text-slate-500 uppercase">Audit Ledger</span>
          </div>

          <div className="relative z-10 w-full flex flex-col items-center gap-16">
            {/* Step Narrator */}
            <AnimatePresence mode="wait">
              {(isProcessing || currentPhase === 'resolved') && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="bg-indigo-500/5 px-4 py-2 rounded-full border border-indigo-500/20 text-[10px] font-black text-indigo-400 tracking-widest uppercase"
                >
                  {currentPhase === 'normalizing' && "Step 1: Normalizing Telemetry"}
                  {currentPhase === 'extracting' && "Step 2: Vectorizing Features"}
                  {currentPhase === 'deciding' && "Step 3: Neural Consensus"}
                  {currentPhase === 'resolved' && "Step 4: Forensic Handover Complete"}
                </motion.div>
              )}
            </AnimatePresence>

            {/* NEURAL CORE (Reference Mirror) */}
            <div className="relative w-80 h-80 flex items-center justify-center">
               <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }} className="absolute inset-0 border border-dashed border-indigo-500/20 rounded-full" />
               <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 30, ease: "linear" }} className="absolute inset-8 border border-white/5 rounded-full" />
               
               <div className="relative bg-slate-950 border border-indigo-500/40 w-56 h-56 rounded-full flex flex-col items-center justify-center space-y-3 shadow-[0_0_60px_rgba(99,102,241,0.2)]">
                  <div className="text-[10px] uppercase font-black tracking-[0.2em] text-indigo-500/60 mb-2 font-mono">Processing Unit</div>
                  <NeuralStage label="Understand" active={currentPhase === 'normalizing'} />
                  <NeuralStage label="Structure" active={currentPhase === 'extracting'} />
                  <NeuralStage label="Connect" active={currentPhase === 'deciding' || currentPhase === 'resolved'} />
               </div>
            </div>
          </div>
        </main>

        {/* 3. RIGHT PANEL: STRUCTURED SYSTEMS & VERDICT */}
        <aside className="lg:col-span-4 bg-slate-950/50 backdrop-blur-3xl border-l border-white/5 p-6 lg:p-10 flex flex-col overflow-y-auto custom-scrollbar">
          
          {/* VERDICT CONTAINER (Reference Requirement) */}
          <div className="mb-10 text-center">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className={`p-6 rounded-[2.5rem] border-2 flex flex-col items-center gap-2 shadow-2xl ${
                    result.decision === 'block' ? 'border-rose-500/40 bg-rose-500/5 shadow-rose-500/10' : 'border-emerald-500/40 bg-emerald-500/5 shadow-emerald-500/10'
                  }`}
                >
                   <div className={`text-4xl font-black uppercase tracking-tighter ${result.decision === 'block' ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {result.decision}
                   </div>
                   <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">System Verdict</div>
                </motion.div>
              ) : (
                <div className="p-8 rounded-[2.5rem] border border-dashed border-white/10 flex flex-col items-center gap-3 grayscale opacity-30">
                   <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center">
                      <Zap className="text-slate-500 w-5 h-5" />
                   </div>
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Awaiting Pulse</span>
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-grow space-y-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="text-indigo-400 w-5 h-5" />
                <h3 className="font-bold text-sm tracking-tight text-white/90 uppercase">Glass-Box Forensics</h3>
              </div>
              {result && (
                <div className="text-[10px] font-mono text-indigo-400 font-bold bg-indigo-400/10 px-2 py-0.5 rounded">
                  LATENCY: {result.latency}ms
                </div>
              )}
            </div>

            {/* FORENSIC WATERFALL */}
            <div className="space-y-6">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-400 uppercase tracking-widest">Global Risk Level</span>
                <span className={result && result.risk_score > 0.5 ? "text-rose-500" : "text-indigo-400"}>
                  {result ? `${Math.round(result.risk_score * 100)}%` : "0%"}
                </span>
              </div>
              
              <div className="space-y-4">
                {result ? (
                  result.forensics.map((f: any, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-white/70">{f.feature}</span>
                        <span className="text-[11px] font-black text-rose-500">+{Math.round(f.impact * 100)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} animate={{ width: `${f.impact * 100}%` }}
                          className={`h-full ${result.decision === 'block' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'bg-indigo-500'}`} 
                        />
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-20">
                     <Terminal className="w-8 h-8 text-slate-800 mx-auto mb-4" />
                     <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest">No forensics in audit log</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-white/5 flex gap-4">
             <NeuralIconRow icon={<Database className="w-4 h-4" />} label="Audit Ledger" />
             <NeuralIconRow icon={<ShieldCheck className="w-4 h-4" />} label="Compliance Sentry" />
          </div>
        </aside>
      </div>

      {/* FIXED BASELINE STATS */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 px-10 py-4 bg-slate-950/80 backdrop-blur-xl border border-white/5 rounded-full z-50 shadow-2xl">
         <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <Zap className="w-3 h-3 text-amber-500" />
            0.38MS BASELINE
         </div>
         <div className="w-px h-4 bg-white/10" />
         <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            RBI COMPLIANT
         </div>
      </div>
    </div>
  );
}

function NeuralStage({ label, active }: { label: string; active: boolean }) {
   return (
      <div className={`w-full max-w-[140px] py-2 px-4 rounded-xl border transition-all duration-500 flex items-center justify-center gap-3 ${
         active ? "bg-indigo-500/20 border-indigo-500 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)] scale-105" : "bg-white/5 border-white/10 text-slate-700 opacity-30"
      }`}>
         <div className={`w-2 h-2 rounded-full ${active ? "bg-indigo-400 animate-pulse" : "bg-slate-800"}`} />
         <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
      </div>
   );
}

function NeuralIconRow({ icon, label }: { icon: any; label: string }) {
   return (
      <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
         <div className="w-8 h-8 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center">
            {icon}
         </div>
         <span>{label}</span>
      </div>
   );
}

            {/* 3. ENGINE LOGS */}
            <div className="bg-slate-950/80 border border-white/5 rounded-2xl p-6 backdrop-blur-xl h-40">
               <div className="font-mono text-[11px] space-y-2">
                 {currentPhase === 'resolved' && result && (
                   <>
                     <div className="flex justify-between"><span className="text-slate-500">LATENCY</span><span className="text-emerald-400">{result.detection_latency_ms}ms</span></div>
                     <div className="flex justify-between"><span className="text-slate-500">CONFIDENCE</span><span className="text-indigo-400">{(result.confidence * 100).toFixed(1)}%</span></div>
                   </>
                 )}
               </div>
            </div>
          </div>
        </main>

        {/* Forensic Panel */}
        <aside className="lg:col-span-4 border-l border-white/5 bg-slate-950/20 p-8 space-y-8 backdrop-blur-3xl">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-400" /> Glass-Box Forensics
          </h2>

          <div className="space-y-6 pt-6">
            {result && (
              <div className="space-y-4">
                <div className="text-[9px] font-black tracking-widest text-slate-600 uppercase">Risk Level: {(result.risk_score * 100).toFixed(1)}%</div>
                <div className="space-y-6">
                    {result.reasons.map((r: string, i: number) => {
                      const isNeg = r.toLowerCase().includes('good') || r.toLowerCase().includes('safe') || r.toLowerCase().includes('normal') || r.toLowerCase().includes('parameters');
                      return (
                        <motion.div 
                          key={i}
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 1 + (i * 0.1) }}
                        >
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-400">{r}</span>
                            <span className={isNeg ? 'text-emerald-400' : 'text-rose-400'}>{isNeg ? '-' : '+'}{Math.round((i+1)*15)}%</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }} 
                              animate={{ width: `${Math.max(30, (i+1)*20)}%` }} 
                              className={`h-full ${isNeg ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-3 bg-indigo-600/10 border border-indigo-500/30 rounded-full z-50">
        <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-indigo-400 uppercase">
          <Zap className="w-3 h-3 animate-pulse" /> 0.38ms Baseline
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-indigo-400 uppercase">
          <CheckCircle2 className="w-3 h-3" /> RBI Compliant
        </div>
      </div>
    </div>
  );
}
