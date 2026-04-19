import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Zap, 
  Search, 
  Code, 
  ArrowRight, 
  Activity, 
  Lock,
  Globe,
  Database,
  Terminal,
  Cpu,
  Fingerprint
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api, { API_BASE_URL } from '@/services/api';
import { toast } from 'sonner';

export default function Demo() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  const scenarios = [
    {
      id: 'legit_upi',
      name: 'Safe UPI Payment',
      description: 'Typical ₹450 grocery transaction from Mumbai',
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
      description: 'High-value pull request on a new device',
      icon: <Activity className="w-5 h-5 text-orange-400" />,
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
      id: 'high_value_foreign',
      name: 'Global Card Theft',
      description: '₹1.8L purchase from US card on Indian IP',
      icon: <Lock className="w-5 h-5 text-red-400" />,
      payload: {
        amount: 180000,
        currency: 'INR',
        merchant: { id: 'm_crypto', name: 'CryptoExchange', category: '6051', country: 'IN' },
        card: { last_four: '4242', type: 'credit', issuing_country: 'US' },
        customer: { id: 'c_attacker', country: 'IN', ip: '203.0.113.5', city: 'Bangalore' },
        channel: 'web'
      }
    }
  ];

  const handleRunDemo = async (scenario: typeof scenarios[0]) => {
    setLoading(true);
    setActiveScenario(scenario.id);
    try {
      const response = await api.post('/transactions/sandbox', scenario.payload);
      setResult(response.data);
      toast.success('Simulation Complete');
    } catch (error) {
      toast.error('Simulation failed. Service might be starting up.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-indigo-500/30">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      
      {/* Navbar Minimal */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto border-b border-white/5">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.location.href = '/'}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Flowshield <span className="text-indigo-400">AI</span></span>
        </div>
        <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => window.location.href = '/docs'}>
          Read Docs
        </Button>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          
          {/* Left Column: Context */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 mb-4 px-3 py-1 text-sm">
                Interactive Sandbox
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6 tracking-tight">
                Try the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-300% animate-gradient">Glass-Box</span> AI
              </h1>
              <p className="text-xl text-slate-400 leading-relaxed max-w-xl">
                Experience the precision of the MVIForest ensemble. Select a pattern below to see how our forensics engine decomposes fraud signals in real-time.
              </p>
            </motion.div>

            <div className="grid gap-4">
              {scenarios.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                >
                  <Card 
                    className={`bg-slate-900/40 border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group ${activeScenario === s.id ? 'border-indigo-500 ring-1 ring-indigo-500/50' : ''}`}
                    onClick={() => handleRunDemo(s)}
                  >
                    <CardHeader className="p-5 flex flex-row items-center gap-4">
                      <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        {s.icon}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg text-white group-hover:text-indigo-400 transition-colors">{s.name}</CardTitle>
                        <CardDescription className="text-slate-400">{s.description}</CardDescription>
                      </div>
                      <ArrowRight className={`w-5 h-5 text-slate-600 transition-transform ${activeScenario === s.id ? 'translate-x-1 text-indigo-400' : 'group-hover:translate-x-1'}`} />
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center gap-6 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                <Globe className="w-4 h-4" /> Global Markets Support
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                <Zap className="w-4 h-4 text-amber-400" /> &lt;50ms Latency
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                <Database className="w-4 h-4 text-emerald-400" /> DPDP Compliant
              </div>
            </div>
          </div>

          {/* Right Column: Code & Result */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 blur-3xl opacity-50"></div>
            
            <div className="relative space-y-6">
              {/* API Request MockUP */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="px-4 py-3 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500/20"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500/20"></div>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-widest text-slate-500 border-slate-800">
                    POST /api/v1/analyze
                  </Badge>
                </div>
                <div className="p-6 font-mono text-xs text-indigo-300 leading-relaxed overflow-x-auto">
                  <span className="text-white">await</span> flowshield.analyze(&#123;<br />
                  &nbsp;&nbsp;transaction_id: <span className="text-emerald-400">"tx_{activeScenario || '001'}"</span>,<br />
                  &nbsp;&nbsp;amount: <span className="text-amber-400">{activeScenario ? scenarios.find(x => x.id === activeScenario)?.payload.amount : 450}</span>,<br />
                  &nbsp;&nbsp;currency: <span className="text-emerald-400">"INR"</span>,<br />
                  &nbsp;&nbsp;channel: <span className="text-emerald-400">"{activeScenario ? scenarios.find(x => x.id === activeScenario)?.payload.channel : 'upi'}"</span><br />
                  &#125;);
                </div>
              </div>

              {/* API Result MockUP */}
              <AnimatePresence mode="wait">
                {result ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <div className="text-sm text-slate-500 mb-1 font-medium tracking-wide flex items-center gap-1.5">
                          Decision Engine <ArrowRight className="w-3 h-3" />
                        </div>
                        <div className={`text-3xl font-black uppercase tracking-tighter ${result.decision === 'block' ? 'text-rose-500' : result.decision === 'review' ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {result.decision}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-500 mb-1 font-medium tracking-wide">Risk Score</div>
                        <div className="text-4xl font-mono font-bold text-white">
                          {(result.risk_score * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                          <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1 flex items-center gap-2">
                            <Zap className="w-3 h-3 text-indigo-400" /> Latency
                          </div>
                          <div className="text-xl font-bold text-white">{result.detection_latency_ms}ms</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                          <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1 flex items-center gap-2">
                            <Activity className="w-3 h-3 text-purple-400" /> Confusion
                          </div>
                          <div className="text-xl font-bold text-white">{result.confidence.toFixed(2)}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-4 flex items-center gap-2">
                          <Terminal className="w-3 h-3 text-emerald-400" /> SHAP Forensics
                        </div>
                        <div className="space-y-3">
                          {result.reasons.map((r: string, i: number) => (
                            <motion.div 
                              key={i}
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 * i }}
                              className="flex items-start gap-3 p-3 bg-white/5 border border-white/5 rounded-lg group hover:bg-white/10 transition-colors"
                            >
                              <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 group-hover:scale-150 transition-transform"></div>
                              <span className="text-sm text-slate-300 font-medium leading-tight">{r}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="aspect-square flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-3xl p-12 text-center">
                    <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-slate-800">
                      <Cpu className="text-slate-700 w-10 h-10 animate-pulse" />
                    </div>
                    <p className="text-lg font-medium">Select a simulation scenario to see the AI in action</p>
                    <p className="text-sm max-w-xs mt-2">Our sandbox generates a complete forensic analysis using our proprietary 3-layer ensemble.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
      
      {/* Background Decor */}
      <div className="fixed bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-indigo-500/5 to-transparent pointer-events-none"></div>
    </div>
  );
}
