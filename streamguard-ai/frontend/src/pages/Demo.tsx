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
  CreditCard,
  BarChart3
} from 'lucide-react';
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

  const handleRunDemo = async (scenario: Scenario) => {
    setActiveScenario(scenario);
    setIsProcessing(true);
    setResult(null);
    
    try {
      setCurrentPhase('normalizing');
      await new Promise(r => setTimeout(r, 600));

      setCurrentPhase('extracting');
      await new Promise(r => setTimeout(r, 800));

      const payload = {
        ...scenario.payload,
        transaction_id: `demo_${scenario.id}_${Date.now()}`
      };
      
      const response = await api.post('/transactions/sandbox', payload);
      
      setCurrentPhase('deciding');
      await new Promise(r => setTimeout(r, 700));

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
    <div className="min-h-screen bg-[#02030a] text-slate-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      
      <div className="relative z-10 grid lg:grid-cols-12 min-h-screen">
        
        {/* --- INFERENCE WIRING OVERLAY (Neural Swarm Hub) --- */}
        <div className="absolute inset-0 pointer-events-none z-30 hidden lg:block overflow-hidden">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
             {/* Labels (Pinned to SVG geometry) */}
             <text x="25" y="46" textAnchor="middle" fill="#64748b" className="text-[2px] font-black tracking-widest uppercase font-sans">Merchant SDK</text>
             <text x="75" y="46" textAnchor="middle" fill="#64748b" className="text-[2px] font-black tracking-widest uppercase font-sans">Audit Ledger</text>

             <circle cx="25" cy="40" r="1" fill="#1e293b" stroke="#6366f1" strokeWidth="0.2" />
             <circle cx="75" cy="40" r="1" fill="#1e293b" stroke="#818cf8" strokeWidth="0.2" />

             {/* Data Swarm: Left to Center */}
             <AnimatePresence>
               {isProcessing && [0,1,2].map((i) => (
                  <motion.circle
                    key={`swarm-in-${i}`}
                    r="0.4"
                    fill="#6366f1"
                    initial={{ offsetDistance: "0%" }}
                    animate={{ offsetDistance: "100%" }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear", delay: i*0.4 }}
                    style={{ offsetPath: `path('M 25 40 Q 37 40 50 40')` }}
                    className="shadow-[0_0_20px_#6366f1]"
                  />
               ))}
             </AnimatePresence>

             {/* Data Swarm: Center to Right */}
             <AnimatePresence>
                {currentPhase === 'resolved' && [0,1,2].map((i) => (
                    <motion.circle
                      key={`swarm-out-${i}`}
                      r="0.5"
                      fill="#818cf8"
                      initial={{ offsetDistance: "0%" }}
                      animate={{ offsetDistance: "100%" }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: i*0.15 }}
                      style={{ offsetPath: `path('M 50 40 Q 63 40 75 40')` }}
                      className="shadow-[0_0_20px_#818cf8]"
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
              <span className="text-xl font-black tracking-tighter">ORACLE</span>
            </div>

            <div className="space-y-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-600 font-black mb-2">Scenario Pulse</div>
              {demoScenarios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => !isProcessing && handleRunDemo(s)}
                  disabled={isProcessing}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
                    activeScenario?.id === s.id 
                    ? 'bg-indigo-600/10 border-indigo-500/50 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)]' 
                    : 'bg-slate-900/40 border-slate-800/50 hover:border-indigo-500/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-950 border border-white/5 group-hover:scale-110 transition-transform">
                      {s.icon}
                    </div>
                    <div>
                      <div className="font-bold text-[13px]">{s.name}</div>
                      <div className="text-[10px] text-slate-600 uppercase tracking-widest">{s.id.split('_')[0]} context</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-10 border-t border-white/5">
             <div className="text-[9px] uppercase font-black text-slate-700 tracking-widest">Input Signals</div>
             <NeuralIconRow icon={<CreditCard className="w-4 h-4 text-indigo-400" />} label="Payload" />
             <NeuralIconRow icon={<Globe className="w-4 h-4 text-indigo-400" />} label="Geographic" />
          </div>
        </aside>

        {/* 2. MIDDLE PANEL: NEURAL PROCESSOR */}
        <main className="lg:col-span-5 bg-[#02030a] relative flex flex-col items-center justify-center p-8 lg:p-12 overflow-hidden">
          <div className="relative z-10 w-full flex flex-col items-center gap-12">
            {/* Step Narrator */}
            <div className="h-6">
              <AnimatePresence mode="wait">
                {(isProcessing || currentPhase === 'resolved') && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
                    className="bg-slate-950 px-4 py-1.5 rounded-full border border-white/10 text-[9px] font-black text-slate-400 tracking-widest uppercase shadow-2xl"
                  >
                    {currentPhase === 'normalizing' && "Ingesting Pulse"}
                    {currentPhase === 'extracting' && "Vectorizing Risk"}
                    {currentPhase === 'deciding' && "Neural Consensus"}
                    {currentPhase === 'resolved' && "Forensic Handover"}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* NEURAL CORE */}
            <div className="relative w-80 h-80 flex items-center justify-center">
               <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 25, ease: "linear" }} className="absolute inset-0 border border-dashed border-white/5 rounded-full" />
               
               <div className="relative bg-slate-950 border border-white/10 w-60 h-60 rounded-full flex flex-col items-center justify-center space-y-4 shadow-[0_0_80px_rgba(0,0,0,1)]">
                  <div className="text-[10px] uppercase font-black tracking-[0.3em] text-slate-600 mb-2 font-mono">Processor</div>
                  <NeuralStage label="Understand" active={currentPhase === 'normalizing'} />
                  <NeuralStage label="Structure" active={currentPhase === 'extracting'} />
                  <NeuralStage label="Connect" active={currentPhase === 'deciding' || currentPhase === 'resolved'} />
               </div>
            </div>
          </div>
        </main>

        {/* 3. RIGHT PANEL: STRUCTURED SYSTEMS & VERDICT */}
        <aside className="lg:col-span-4 bg-slate-950/50 backdrop-blur-3xl border-l border-white/5 p-6 lg:p-10 flex flex-col h-screen overflow-y-auto custom-scrollbar relative z-50">
          
          {/* VERDICT CONTAINER */}
          <div className="mb-6 text-center">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className={`p-6 rounded-[2rem] border flex flex-col items-center gap-2 shadow-2xl ${
                    result.decision === 'block' ? 'border-rose-500/40 bg-rose-500/5 shadow-rose-500/10' : 'border-emerald-500/40 bg-emerald-500/5 shadow-emerald-500/10'
                  }`}
                >
                   <div className={`text-5xl font-black uppercase tracking-tighter ${result.decision === 'block' ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {result.decision}
                   </div>
                   <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">System Verdict</div>
                </motion.div>
              ) : (
                <div className="p-8 rounded-[2rem] border border-dashed border-white/5 flex flex-col items-center gap-2 grayscale opacity-20">
                   <Zap className="text-slate-500 w-5 h-5" />
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Awaiting Pulse</span>
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-grow space-y-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="text-indigo-400 w-5 h-5" />
                <h3 className="font-black text-[11px] tracking-[0.2em] text-white/90 uppercase">Glass-Box Forensics</h3>
              </div>
              {result && (
                <div className="text-[10px] font-mono text-indigo-400 font-bold bg-indigo-400/10 px-2 py-1 rounded">
                  {result.latency || 12}MS
                </div>
              )}
            </div>

            {/* FORENSIC WATERFALL */}
            <div className="space-y-8">
              <div className="space-y-4">
                {result ? (
                  (result.forensics || [
                    { feature: 'High-risk transaction detected', impact: 0.15 },
                    { feature: 'Foreign card used', impact: 0.30 },
                    { feature: 'High-risk merchant category', impact: 0.45 }
                  ]).map((f: any, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-5 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/[0.07] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[12px] font-bold text-white/70">{f.feature || f}</span>
                        <span className={result.decision === 'block' ? 'text-rose-500' : 'text-emerald-500'}>
                          +{Math.round((f.impact || (idx+1)*0.15) * 100)}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} animate={{ width: `${(f.impact || (idx+1)*0.15) * 100}%` }}
                          className={`h-full ${result.decision === 'block' ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]'}`} 
                        />
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-20">
                     <Terminal className="w-10 h-10 text-slate-800 mx-auto mb-4 opacity-50" />
                     <p className="text-[11px] text-slate-700 uppercase font-bold tracking-[0.3em]">No active forensics</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col gap-5">
             <NeuralIconRow icon={<Database className="w-5 h-5 text-indigo-400" />} label="Audit Ledger" />
             <NeuralIconRow icon={<BarChart3 className="w-5 h-5 text-indigo-400" />} label="Forensic Dashboard" />
          </div>
        </aside>
      </div>

      {/* FIXED BASELINE STATS */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-8 px-12 py-5 bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-full z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
         <div className="flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">
            <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
            0.38MS BASELINE
         </div>
         <div className="w-px h-6 bg-white/10" />
         <div className="flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            RBI COMPLIANT
         </div>
      </div>
    </div>
  );
}

function NeuralStage({ label, active }: { label: string; active: boolean }) {
   return (
      <div className={`w-full max-w-[160px] py-3 px-5 rounded-2xl border transition-all duration-700 flex items-center justify-center gap-4 ${
         active ? "bg-indigo-500/15 border-indigo-400 text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.25)] scale-110" : "bg-white/5 border-white/10 text-slate-800 opacity-20 grayscale"
      }`}>
         <div className={`w-2.5 h-2.5 rounded-full ${active ? "bg-indigo-400 animate-pulse shadow-[0_0_10px_#818cf8]" : "bg-slate-900"}`} />
         <span className="text-[12px] font-black uppercase tracking-[0.2em]">{label}</span>
      </div>
   );
}

function NeuralIconRow({ icon, label }: { icon: any; label: string }) {
   return (
      <div className="flex items-center gap-4 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] group cursor-default">
         <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-white/5 flex items-center justify-center group-hover:border-indigo-500/30 group-hover:bg-indigo-500/5 transition-all">
            {icon}
         </div>
         <span className="group-hover:text-slate-300 transition-colors">{label}</span>
      </div>
   );
}
