import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Settings, 
  CheckCircle2, 
  BarChart3, 
  Calendar,
  CreditCard,
  X,
  ArrowUpCircle,
  Clock,
  ChevronRight,
  ShieldCheck,
  Star,
  Activity,
  Layers,
  Crown
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/services/api';
import { toast } from 'sonner';
import { subscribeToPlan } from '@/services/payment';
import EnterpriseModal from '@/components/EnterpriseModal';

interface FeatureGroup {
  [key: string]: boolean | number;
}

interface SubscriptionData {
  plan: string;
  interval: string;
  status: string;
  amount_inr: number;
  requests_used: number;
  requests_limit: number;
  usage_percent: number;
  next_billing_date: string | null;
  subscription_id: string | null;
  features: FeatureGroup;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: string;
  method: string;
}

const containerVars = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVars = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

export default function Billing() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAnnual, setIsAnnual] = useState(false);
  const [isEnterpriseModalOpen, setIsEnterpriseModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchData();
    
    const upgradeTarget = searchParams.get('upgrade');
    if (upgradeTarget === 'basic') {
        subscribeToPlan('basic', 'monthly');
    } else if (upgradeTarget === 'standard') {
        subscribeToPlan('standard', 'monthly');
    }
  }, [searchParams]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subRes, invRes] = await Promise.all([
        api.get('/billing/subscription'),
        api.get('/billing/invoices')
      ]);
      setData(subRes.data);
      setInvoices(invRes.data);
      setIsAnnual(subRes.data.interval === 'annual');
    } catch (e) {
      console.error("Failed to fetch billing data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSub = async () => {
    try {
      await api.post('/billing/cancel');
      toast.success("Subscription cancelled successfully.");
      setIsCancelModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Cancellation failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-blue-500 animate-pulse" />
            </div>
        </div>
      </div>
    );
  }

  const plans = [
    {
      name: 'Free',
      id: 'free',
      price: 0,
      requests: '1,000',
      description: 'Starter',
      icon: Activity,
      features: ['Basic fraud scoring', '7-day history', '1 API key', 'Dashboard access'],
      missing: ['ML Ensemble', 'Webhooks', 'Analytics', 'Alerts'],
      cta: 'Current Plan',
      color: 'blue'
    },
    {
      name: 'Builder',
      id: 'basic',
      price: isAnnual ? 799 : 999,
      requests: '25,000',
      description: 'Basic',
      icon: Zap,
      features: ['Everything in Free', 'ML Ensemble (IF+XGB)', 'SHAP Explainability', '1 Webhook', 'Alerts page'],
      missing: ['Advanced Analytics', 'Cross-network signals'],
      cta: 'Upgrade Plan',
      color: 'indigo'
    },
    {
      name: 'Growth',
      id: 'standard',
      price: isAnnual ? 2399 : 2999,
      requests: '1,00,000',
      description: 'Standard',
      popular: true,
      icon: Layers,
      features: ['Everything in Basic', 'Neural Net Ensemble', 'Full Analytics', '10 Keys / 5 Webhooks', 'Fraud Reports'],
      missing: ['Dedicated Model'],
      cta: 'Get Growth',
      color: 'sky'
    },
    {
      name: 'Enterprise',
      id: 'premium',
      price: isAnnual ? 6399 : 7999,
      requests: 'Unlimited',
      description: 'Premium',
      icon: Crown,
      features: ['Unlimited everything', 'Dedicated ML model', '99.9% uptime SLA', 'Dedicated Slack', 'Custom Integrations'],
      missing: [],
      cta: 'Contact Sales',
      color: 'purple'
    }
  ];

  const currentPlan = data?.plan || 'free';

  return (
    <div className="max-w-7xl mx-auto space-y-12 p-4 md:p-8 text-white relative">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-indigo-600/5 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight font-display mb-2">Plans <span className="text-blue-500">&</span> Billing</h1>
          <p className="text-slate-400 font-medium max-w-xl">Scale your fraud protection with our specialized Indian SaaS tiers. Unified control for your commerce growth.</p>
        </div>
        <div className="flex items-center p-1.5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
            <button 
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${!isAnnual ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:text-slate-300'}`}
            >
                Monthly
            </button>
            <button 
              onClick={() => setIsAnnual(true)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center ${isAnnual ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:text-slate-300'}`}
            >
                Annual
                <span className="ml-2 text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md font-black">SAVE 20%</span>
            </button>
        </div>
      </motion.div>

      {/* SECTION 1: USAGE HUB */}
      <motion.section 
        variants={containerVars}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <motion.div variants={itemVars} className="lg:col-span-2">
            <Card className="h-full bg-white/5 border-white/10 backdrop-blur-2xl overflow-hidden relative group">
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <CardHeader className="border-b border-white/5 bg-white/[0.02] py-6 px-8 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 flex items-center">
                        <Activity className="mr-3 h-4 w-4 text-blue-500" /> API CONSUMPTION HUB
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Plan Level</span>
                         <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 bg-white/5`}>
                            {currentPlan} plan
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
                        <div className="space-y-2">
                            <span className="text-6xl font-black font-display tracking-tighter leading-none">
                                {data?.requests_used.toLocaleString()}
                            </span>
                            <span className="text-slate-500 text-xl font-medium block">
                                out of {data?.requests_limit === -1 ? '∞' : data?.requests_limit.toLocaleString()} monthly requests
                            </span>
                        </div>
                        <div className="text-right pb-1">
                            <div className="text-4xl font-black text-blue-500 font-display tabular-nums">
                                {data?.usage_percent}%
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Node Capacity</div>
                        </div>
                    </div>

                    <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 p-0.5 relative">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, data?.usage_percent || 0)}%` }}
                            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                            className={`h-full rounded-full bg-gradient-to-r from-blue-600 via-sky-400 to-emerald-400 shadow-[0_0_20px_rgba(59,130,246,0.4)] relative`}
                        >
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite]" />
                        </motion.div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-12 pt-10 border-t border-white/5">
                        <UsageStat label="Billing Cycle Ends" value={data?.next_billing_date ? new Date(data.next_billing_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '∞'} icon={Calendar} />
                        <UsageStat label="Current Rate" value={`₹${data?.amount_inr.toLocaleString()}`} icon={ArrowUpCircle} />
                        <UsageStat label="Network Status" value={data?.status === 'active' ? 'Protected' : 'Pending'} icon={ShieldCheck} status={data?.status === 'active'} />
                        <div className="flex items-center justify-end">
                            <Button className="rounded-xl px-6 bg-white text-black hover:bg-slate-200 font-black text-[10px] uppercase tracking-widest h-10" onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}>
                                Refresh Plan
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>

        <motion.div variants={itemVars}>
            <Card className="h-full bg-gradient-to-br from-blue-600 to-indigo-800 border-none p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full translate-x-10 -translate-y-10" />
                <div className="relative z-10 space-y-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                        <CreditCard className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black tracking-tight mb-2">Razorpay Integrated</h3>
                        <p className="text-blue-100 text-sm font-medium leading-relaxed opacity-80">
                            Secure INR processing with UPI, Cards, and Netbanking support. Direct Indian subscription management.
                        </p>
                    </div>
                </div>
                
                <div className="mt-8 pt-8 border-t border-white/10 space-y-4 relative z-10">
                    <div className="flex flex-wrap gap-4 select-none">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-5 brightness-0 invert opacity-50 hover:opacity-100 transition-opacity" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-5 brightness-0 invert opacity-50 hover:opacity-100 transition-opacity" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-5 brightness-0 invert opacity-50 hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Verified Payment Partner</p>
                </div>
            </Card>
        </motion.div>
      </motion.section>

      {/* SECTION 2: PLAN SELECTOR */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-12"
      >
          <div className="flex items-center space-x-3 mb-10">
              <Star className="w-6 h-6 text-blue-500 fill-blue-500/20" />
              <h2 className="text-3xl font-black tracking-tighter">Infrastructure Tiers</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((p, idx) => {
               const isCurrent = p.id === currentPlan;
               const isEnterprise = p.id === 'premium';
               
               return (
                <motion.div 
                    key={p.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }} 
                    viewport={{ once: true }}
                    className="h-full"
                >
                    <Card className={`group relative flex flex-col h-full bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden transition-all duration-500 hover:border-blue-500/50 hover:bg-white/[0.08] hover:-translate-y-2 ${p.popular ? 'border-blue-500/40 shadow-2xl shadow-blue-500/10' : ''}`}>
                        {p.popular && (
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 to-sky-400"></div>
                        )}
                        <CardHeader className="p-8 pb-4">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform duration-500`}>
                                    <p.icon size={22} />
                                </div>
                                {p.popular && (
                                    <span className="bg-blue-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-blue-600/30">Most Popular</span>
                                )}
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-2">{p.name}</h3>
                            <div className="flex items-baseline space-x-1">
                                {p.id !== 'free' && <span className="text-2xl font-black tracking-tight">₹</span>}
                                <span className="text-5xl font-black font-display tracking-tighter tabular-nums">{p.id === 'free' ? '0' : p.price.toLocaleString()}</span>
                                {p.id !== 'free' && <span className="text-slate-500 text-sm font-bold ml-1">/mo</span>}
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-4 bg-white/5 py-1.5 px-3 rounded-lg border border-white/5 w-fit">{p.requests} REQUESTS</p>
                        </CardHeader>
                        <CardContent className="p-8 pt-6 flex-grow">
                            <ul className="space-y-4 mb-8">
                                {p.features.map(f => (
                                    <li key={f} className="flex items-start text-[11px] font-medium text-slate-300 leading-relaxed">
                                        <CheckCircle2 className={`w-4 h-4 mr-3 flex-shrink-0 ${p.id === 'standard' ? 'text-blue-400' : 'text-slate-600'}`} />
                                        <span>{f}</span>
                                    </li>
                                ))}
                                {p.missing.map(f => (
                                    <li key={f} className="flex items-start text-[11px] font-medium text-slate-600 line-through leading-relaxed opacity-50">
                                        <X className="w-4 h-4 mr-3 flex-shrink-0" />
                                        <span>{f}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <div className="p-8 pt-0 mt-auto">
                            {isCurrent ? (
                                <Button disabled className="w-full bg-white/5 border border-white/10 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl h-14">
                                    CURRENT TIER
                                </Button>
                            ) : isEnterprise ? (
                                <Button className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl h-14 shadow-lg shadow-purple-600/20" onClick={() => setIsEnterpriseModalOpen(true)}>
                                    <Crown className="w-4 h-4 mr-2" /> CONTACT SALES
                                </Button>
                            ) : (
                                <Button 
                                  className={`w-full font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl h-14 transition-all duration-500 ${p.popular ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-500/20' : 'bg-transparent border border-white/10 text-white hover:bg-white/10'}`}
                                  onClick={() => subscribeToPlan(p.id as any, isAnnual ? 'annual' : 'monthly')}
                                >
                                    UPGRADE NOW
                                </Button>
                            )}
                        </div>
                    </Card>
                </motion.div>
               );
            })}
          </div>
      </motion.section>

      {/* SECTION 3: INVOICE TIMELINE */}
      <AnimatePresence>
        {invoices.length > 0 && (
            <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-8"
            >
                <h2 className="text-xl font-black tracking-tight mb-8 uppercase tracking-[0.2em] text-slate-500 flex items-center">
                    <CreditCard className="w-5 h-5 mr-3" /> Billing Timeline
                </h2>
                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-3xl shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-white/[0.02] border-b border-white/5">
                                    <th className="py-6 px-10 font-black uppercase tracking-[0.2em] text-[10px] text-slate-500">Transaction Date</th>
                                    <th className="py-6 px-10 font-black uppercase tracking-[0.2em] text-[10px] text-slate-500">Amount</th>
                                    <th className="py-6 px-10 font-black uppercase tracking-[0.2em] text-[10px] text-slate-500">Protocol</th>
                                    <th className="py-6 px-10 font-black uppercase tracking-[0.2em] text-[10px] text-slate-500">Status</th>
                                    <th className="py-6 px-10 font-black uppercase tracking-[0.2em] text-[10px] text-slate-500 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {invoices.map((inv) => (
                                    <motion.tr 
                                        key={inv.id}
                                        whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                                        className="transition-colors"
                                    >
                                        <td className="py-6 px-10 font-medium text-slate-300">{inv.date}</td>
                                        <td className="py-6 px-10 font-black text-lg">₹{inv.amount.toLocaleString()}</td>
                                        <td className="py-6 px-10 text-slate-500 font-black text-[10px] uppercase tracking-widest">{inv.method || 'payment_node'}</td>
                                        <td className="py-6 px-10">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                inv.status === 'captured' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                            }`}>
                                                {inv.status === 'captured' ? 'Captured' : inv.status}
                                            </span>
                                        </td>
                                        <td className="py-6 px-10 text-right">
                                            <button className="text-blue-500 hover:text-blue-400 font-black text-[10px] uppercase tracking-widest flex items-center justify-end ml-auto group">
                                                Download <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.section>
        )}
      </AnimatePresence>

      <div className="pt-20 border-t border-white/5 text-center">
          <p className="text-slate-600 text-[11px] font-black uppercase tracking-[0.3em]">
            Scale beyond limits? <span className="text-blue-500 cursor-pointer hover:text-blue-400 hover:underline transition-colors ml-2" onClick={() => setIsEnterpriseModalOpen(true)}>Initialize Enterprise Protocol</span>
          </p>
          {currentPlan !== 'free' && (
              <button 
                onClick={() => setIsCancelModalOpen(true)}
                className="mt-8 text-red-900 hover:text-red-600 text-[9px] font-black uppercase tracking-[0.4em] transition-all"
              >
                  Terminate Active Subscription
              </button>
          )}
      </div>

      {/* CANCEL MODAL */}
      <AnimatePresence>
          {isCancelModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-[#0A0E1A] border border-white/10 rounded-[2.5rem] p-12 max-w-md w-full shadow-2xl relative overflow-hidden"
                  >
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-600 to-transparent" />
                      <h3 className="text-3xl font-black tracking-tighter mb-4">Confirm Termination?</h3>
                      <p className="text-slate-400 mb-10 leading-relaxed font-medium">
                          You are about to terminate your active protection. Downgrade to <span className="text-white font-bold font-display">Free</span> will occur on {data?.next_billing_date}. Intelligence nodes will be deactivated.
                      </p>
                      <div className="flex flex-col space-y-4">
                          <Button onClick={() => setIsCancelModalOpen(false)} className="bg-blue-600 hover:bg-blue-500 font-black py-7 rounded-2xl shadow-xl shadow-blue-500/20 text-xs uppercase tracking-widest">
                              Restore Security
                          </Button>
                          <Button onClick={handleCancelSub} variant="link" className="text-red-600 font-black text-[10px] uppercase tracking-widest hover:text-red-400">
                              Proceed with termination
                          </Button>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      <EnterpriseModal isOpen={isEnterpriseModalOpen} onClose={() => setIsEnterpriseModalOpen(false)} />
    </div>
  );
}

function UsageStat({ label, value, icon: Icon, status }: any) {
  return (
    <div className="space-y-1">
        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black flex items-center">
            <Icon className="w-3 h-3 mr-2 opacity-50" /> {label}
        </p>
        <div className="flex items-center">
            {status !== undefined && (
                <div className={`w-2 h-2 rounded-full mr-2 ${status ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-pulse'}`}></div>
            )}
            <p className="text-lg font-black tracking-tight">{value}</p>
        </div>
    </div>
  );
}
