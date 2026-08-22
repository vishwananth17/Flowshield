import { useState, useEffect, useRef } from 'react';
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
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    fetchData();
    
    // Safety guard: only trigger if we aren't already initiating
    const upgradeTarget = searchParams.get('upgrade');
    if (upgradeTarget && !isSubscribing) {
        const planToUpgrade = upgradeTarget === 'basic' ? 'basic' : upgradeTarget === 'standard' ? 'standard' : null;
        if (planToUpgrade) {
            handleSubscribe(planToUpgrade, 'monthly');
            // CLEAN UP URL to prevent re-trigger on refresh
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
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
    } catch (e: any) {
      console.warn("Failed to fetch billing data silently", e);
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

  const currentPlan = data?.plan || 'free';
  const [isSubscribing, setIsSubscribing] = useState<string | null>(null);

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
      requests: '3 Disputes',
      description: 'Starter',
      icon: Activity,
      features: ['3 dispute templates / mo', 'Manual evidence uploads', 'Core tracking'],
      missing: ['Automated Razorpay gathering', 'Shopify order matching', 'ML fraud risk matching'],
      cta: 'Current Plan',
      color: 'blue'
    },
    {
      name: 'Starter',
      id: 'basic',
      price: 499,
      requests: '10 Disputes',
      description: 'Basic',
      icon: Zap,
      features: ['10 disputes / mo', 'Automated Razorpay gathering', 'Template builders'],
      missing: ['Shopify order matching', 'ML fraud risk matching'],
      cta: 'Upgrade Plan',
      color: 'indigo'
    },
    {
      name: 'Growth',
      id: 'standard',
      price: 1499,
      requests: '50 Disputes',
      description: 'Standard',
      popular: true,
      icon: Layers,
      features: ['50 disputes / mo', 'Shopify order matching', 'Courier tracking validation'],
      missing: ['ML fraud risk matching'],
      cta: 'Get Growth',
      color: 'sky'
    },
    {
      name: 'Enterprise',
      id: 'premium',
      price: 4999,
      requests: 'Unlimited',
      description: 'Premium',
      icon: Crown,
      features: ['Unlimited disputes', 'ML fraud risk matching', 'Priority bank representation'],
      missing: [],
      cta: 'Contact Sales',
      color: 'purple'
    }
  ];


  const handleSubscribe = async (planId: string, interval: 'monthly' | 'annual') => {
    if (isSubscribing) return;
    setIsSubscribing(planId);
    try {
      await subscribeToPlan(planId as any, interval);
    } catch (err) {
      console.error(err);
    } finally {
      // We don't necessarily set to null here if the redirect happens, 
      // but if the modal blocks it, we should reset.
      setTimeout(() => setIsSubscribing(null), 5000);
    }
  };

  return (
    <div className="space-y-6 font-sans text-xs pb-16">
      {isSubscribing && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-[#0D131F] border border-slate-800 p-6 rounded flex flex-col items-center space-y-3 shadow-2xl">
            <div className="h-8 w-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin"></div>
            <p className="text-xs font-mono text-slate-300">Initializing Razorpay Checkout Node...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Subscription & Infrastructure Capacity</h1>
            <span className="text-[10px] font-mono uppercase bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
              INR Direct Settlement
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage your evaluation quota, dispute compilation allocations, and Razorpay billing cycle.
          </p>
        </div>

        <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded font-mono text-xs self-start sm:self-auto">
          <button 
            onClick={() => setIsAnnual(false)}
            className={`px-3 py-1 rounded transition-colors ${!isAnnual ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setIsAnnual(true)}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${isAnnual ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
          >
            <span>Annual</span>
            <span className="text-[9px] bg-emerald-950 border border-emerald-800/80 text-emerald-400 px-1 py-0.2 rounded font-bold">20% OFF</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: USAGE HUB */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[#0D131F] border border-slate-800 rounded p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-mono uppercase font-bold text-white tracking-wider">Evaluation & API Ingestion Quota</span>
            </div>
            <span className="text-[10px] font-mono uppercase bg-slate-900 border border-slate-800 text-blue-400 px-2 py-0.5 rounded font-bold">
              {currentPlan.toUpperCase()} TIER ACTIVE
            </span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-1">
            <div>
              <div className="text-3xl font-mono font-bold text-white tracking-tight">
                {data?.requests_used.toLocaleString()}
                <span className="text-sm font-normal text-slate-500 font-mono ml-2">
                  / {data?.requests_limit === -1 ? 'Unlimited' : data?.requests_limit.toLocaleString()} evaluations
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Ingested via live webhook stream & REST SDK</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-mono font-bold text-emerald-400">{data?.usage_percent}%</div>
              <div className="text-[10px] font-mono text-slate-500 uppercase">Quota Utilized</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-950 border border-slate-800 h-2 rounded overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded transition-all duration-500"
              style={{ width: `${Math.min(100, data?.usage_percent || 0)}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/60 font-mono text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Next Renewal</span>
              <span className="font-semibold text-white">
                {data?.next_billing_date ? new Date(data.next_billing_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Continuous'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Current Base</span>
              <span className="font-semibold text-white">₹{data?.amount_inr ? data.amount_inr.toLocaleString('en-IN') : '0'}/mo</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Telemetry SLA</span>
              <span className="font-semibold text-emerald-400">99.95% Uptime</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Dispute Dockets</span>
              <span className="font-semibold text-white">
                {currentPlan === 'free' ? '3 Included' : currentPlan === 'basic' ? '10 Included' : currentPlan === 'standard' ? '50 Included' : 'Unlimited'}
              </span>
            </div>
          </div>
        </div>

        {/* Gateway Security Box */}
        <div className="bg-[#0D131F] border border-slate-800 rounded p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-mono uppercase font-bold text-white tracking-wider">Payment Node</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated recurring billing managed through Razorpay Subscriptions. Full GST tax invoice generation provided with every charge.
            </p>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-800 font-mono text-[11px]">
            <div className="flex justify-between text-slate-400">
              <span>Accepted Protocols:</span>
              <span className="text-slate-200">UPI • Cards • NetBanking</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Currency Settlement:</span>
              <span className="text-slate-200 font-bold">INR (₹)</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Security Standard:</span>
              <span className="text-emerald-400 font-semibold">PCI-DSS Level 1</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: PLAN SELECTOR */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-mono uppercase font-bold text-white tracking-wider flex items-center gap-2">
            <span>Available Capacity Tiers</span>
          </h2>
          <span className="text-[11px] font-mono text-slate-500">Cancel or switch tiers anytime</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {plans.map((p) => {
            const isCurrent = p.id === currentPlan;
            const isEnterprise = p.id === 'premium';
            
            return (
              <div 
                key={p.id}
                className={`bg-[#0D131F] border rounded p-4 flex flex-col justify-between transition-colors ${
                  isCurrent ? 'border-blue-500/80 bg-blue-950/10' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-mono uppercase font-bold text-white">{p.name}</span>
                    {isCurrent && (
                      <span className="text-[10px] font-mono uppercase bg-blue-950 border border-blue-800 text-blue-400 px-2 py-0.5 rounded font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-2xl font-bold text-white">
                      ₹{p.id === 'free' ? '0' : p.price.toLocaleString('en-IN')}
                    </span>
                    {p.id !== 'free' && <span className="text-xs text-slate-500">/month</span>}
                  </div>
                  <div className="text-[11px] font-mono text-blue-400 mt-1 mb-4">
                    {p.requests} Evaluations
                  </div>

                  <ul className="space-y-2 border-t border-slate-800/80 pt-3 text-xs text-slate-300">
                    {p.features.map(f => (
                      <li key={f} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-800/60">
                  {isCurrent ? (
                    <button disabled className="w-full bg-slate-900 border border-slate-800 text-slate-500 font-mono text-xs py-2 rounded cursor-not-allowed">
                      Current Plan
                    </button>
                  ) : isEnterprise ? (
                    <button 
                      onClick={() => setIsEnterpriseModalOpen(true)}
                      className="w-full bg-purple-900 hover:bg-purple-800 border border-purple-700 text-white font-mono text-xs py-2 rounded transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>Contact Enterprise</span>
                    </button>
                  ) : (
                    <button 
                      disabled={!!isSubscribing}
                      onClick={() => handleSubscribe(p.id, isAnnual ? 'annual' : 'monthly')}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs py-2 rounded font-semibold transition-colors"
                    >
                      {isSubscribing === p.id ? 'Connecting Node...' : 'Select Tier →'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: INVOICE TIMELINE */}
      {invoices.length > 0 && (
        <div className="space-y-3 pt-4">
          <h2 className="text-xs font-mono uppercase font-bold text-white tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-400" />
            <span>Billing History & GST Invoices</span>
          </h2>
          <div className="bg-[#0D131F] border border-slate-800 rounded overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-slate-400 uppercase font-mono bg-slate-950/80 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Invoice Date</th>
                  <th className="py-2.5 px-3">Amount (INR)</th>
                  <th className="py-2.5 px-3">Payment Protocol</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-900/40 font-mono">
                    <td className="py-2.5 px-3 text-slate-300">{inv.date}</td>
                    <td className="py-2.5 px-3 font-bold text-white">₹{inv.amount.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-slate-400 uppercase text-[11px]">{inv.method || 'razorpay'}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                        inv.status === 'captured' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80' : 'bg-red-950/60 text-red-400 border-red-800/80'
                      }`}>
                        {inv.status === 'captured' ? 'PAID' : inv.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button className="text-blue-400 hover:text-blue-300 text-xs font-mono">
                        Download PDF →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {currentPlan !== 'free' && (
        <div className="pt-6 border-t border-slate-800/80 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-mono">Looking for dedicated VPC deployment or custom SLA?</span>
          <button 
            onClick={() => setIsCancelModalOpen(true)}
            className="text-red-400 hover:text-red-300 font-mono text-[11px] transition-colors"
          >
            Cancel Subscription
          </button>
        </div>
      )}

      {/* CANCEL MODAL */}
      <AnimatePresence>
        {isCancelModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm font-mono text-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0D131F] border border-slate-800 rounded p-6 max-w-sm w-full shadow-2xl space-y-4"
            >
              <h3 className="text-sm font-bold text-white">Cancel Subscription?</h3>
              <p className="text-slate-400 leading-relaxed font-sans">
                Your plan will remain active until <span className="text-white font-mono">{data?.next_billing_date}</span>, after which your account will revert to Free Sandbox limits.
              </p>
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => setIsCancelModalOpen(false)} 
                  className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white py-2 rounded text-xs transition-colors"
                >
                  Keep Subscription
                </button>
                <button 
                  onClick={handleCancelSub} 
                  className="flex-1 bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 py-2 rounded text-xs transition-colors"
                >
                  Confirm Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <EnterpriseModal isOpen={isEnterpriseModalOpen} onClose={() => setIsEnterpriseModalOpen(false)} />
    </div>
  );
}
