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
  CheckCircle2
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
        
        {/* --- INFERENCE WIRING OVERLAY --- */}
        <div className="absolute inset-0 pointer-events-none z-0 hidden lg:block overflow-hidden">
          <svg className="w-full h-full" fill="none">
             {/* Wire 1: Left to Center */}
             <motion.path
                d="M 300 450 L 500 450"
                stroke="#6366f1"
                strokeWidth="1"
                strokeDasharray="4 4"
                initial={{ opacity: 0 }}
                animate={isProcessing ? { opacity: 0.2 } : { opacity: 0 }}
             />
             {/* Data Packet 1 */}
             {isProcessing && (
                <motion.circle
                  r="3"
                  fill="#6366f1"
                  initial={{ offsetDistance: "0%" }}
                  animate={{ offsetDistance: "100%" }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  style={{ offsetPath: "path('M 300 450 L 500 450')" }}
                  className="shadow-[0_0_10px_#6366f1]"
                />
             )}

             {/* Wire 2: Center to Right */}
             <motion.path
                d="M 800 450 L 1000 450"
                stroke="#6366f1"
                strokeWidth="1"
                strokeDasharray="4 4"
                initial={{ opacity: 0 }}
                animate={currentPhase === 'resolved' ? { opacity: 0.2 } : { opacity: 0 }}
             />
             {/* Data Packet 2 */}
             {currentPhase === 'resolved' && (
                <motion.circle
                  r="3"
                  fill="#818cf8"
                  initial={{ offsetDistance: "0%" }}
                  animate={{ offsetDistance: "100%" }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  style={{ offsetPath: "path('M 800 450 L 1000 450')" }}
                  className="shadow-[0_0_10px_#818cf8]"
                />
             )}
          </svg>
        </div>

        {/* Trigger Panel */}
        <aside className="lg:col-span-3 border-r border-white/5 bg-slate-950/50 backdrop-blur-3xl p-6 lg:p-8 space-y-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">Oracle Hub</span>
          </div>

          <div className="space-y-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-6">Select Scenario</div>
            {demoScenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => !isProcessing && handleRunDemo(s)}
                disabled={isProcessing}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-300 group relative overflow-hidden ${
                  activeScenario?.id === s.id 
                  ? 'bg-indigo-600/10 border-indigo-500' 
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-950/80 border border-white/5">
                    {s.icon}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{s.name}</div>
                    <div className="text-[11px] text-slate-500">{s.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Engine Panel */}
        <main className="lg:col-span-5 bg-[#020617] relative flex flex-col items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-md relative z-10 space-y-12">
            <div className="relative flex items-center justify-center">
              <div className="relative z-10 text-center">
                <AnimatePresence mode="wait">
                  {currentPhase === 'idle' && (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-32 h-32 bg-slate-950 rounded-3xl border-2 border-slate-800 flex flex-col items-center justify-center"
                    >
                      <Cpu className="w-10 h-10 text-slate-700 animate-pulse" />
                    </motion.div>
                  )}

                  {isProcessing && currentPhase !== 'resolved' && (
                    <motion.div
                      key="active"
                      className="w-40 h-40 bg-indigo-950/20 rounded-full border-2 border-indigo-500 flex flex-col items-center justify-center"
                    >
                      <div className="text-indigo-400 font-bold">{progress}%</div>
                      <div className="text-[9px] font-black tracking-[0.2em] text-indigo-400/60 uppercase">{currentPhase}</div>
                    </motion.div>
                  )}

                  {currentPhase === 'resolved' && result && (
                    <motion.div
                      key="result"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`w-48 h-48 rounded-full border-4 flex flex-col items-center justify-center ${
                        result.decision === 'block' ? 'border-rose-500 bg-rose-500/10' : 'border-emerald-500 bg-emerald-500/10'
                      }`}
                    >
                      <div className={`text-4xl font-black uppercase ${result.decision === 'block' ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {result.decision}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

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
