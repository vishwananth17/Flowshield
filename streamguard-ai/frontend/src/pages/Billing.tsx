import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  CheckCircle2, 
  Calendar,
  CreditCard,
  X,
  ArrowUpCircle,
  ChevronRight,
  ShieldCheck,
  Star,
  Activity,
  Layers,
  Crown
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Heading1, Heading3, Label, Caption } from '@/components/ui/Typography';
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
    
    const upgradeTarget = searchParams.get('upgrade');
    if (upgradeTarget && !isSubscribing) {
      const planToUpgrade = upgradeTarget === 'basic' ? 'basic' : upgradeTarget === 'standard' ? 'standard' : null;
      if (planToUpgrade) {
        handleSubscribe(planToUpgrade, 'monthly');
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
      console.error("Failed to fetch billing data", e);
      if (e.response?.status !== 401) {
        toast.error("Billing sync failed. Retrying...");
      }
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
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[var(--border-default)] border-t-[var(--color-primary)] rounded-full animate-spin mx-auto mb-3" />
          <Caption className="font-mono font-bold">Synchronizing billing status...</Caption>
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
      variant: 'default' as const
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
      variant: 'default' as const
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
      variant: 'gold' as const
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
      variant: 'default' as const
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
      setTimeout(() => setIsSubscribing(null), 5000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 text-left font-body relative overflow-x-hidden pb-20">
      {isSubscribing && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xs flex items-center justify-center">
          <Card padding="none" className="p-8 max-w-sm w-full text-center space-y-4">
            <div className="w-10 h-10 border-2 border-[var(--border-default)] border-t-[var(--color-primary)] rounded-full animate-spin mx-auto" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Initializing Payment Node...</span>
          </Card>
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[var(--border-subtle)] pb-4"
      >
        <div>
          <Heading1>Plans & Billing</Heading1>
          <Caption className="mt-1 block">Scale your fraud and account security with unified controls across your global payment and ledger layers.</Caption>
        </div>
        <div className="flex items-center p-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] shadow-2xl">
          <button 
            onClick={() => setIsAnnual(false)}
            className={`px-5 py-2 rounded-[var(--radius-sm)] text-xs font-mono font-bold transition-all duration-300 ${!isAnnual ? 'bg-[var(--color-primary)] text-[var(--text-inverse)]' : 'text-[var(--text-secondary)] hover:text-slate-300'}`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setIsAnnual(true)}
            className={`px-5 py-2 rounded-[var(--radius-sm)] text-xs font-mono font-bold transition-all duration-300 flex items-center ${isAnnual ? 'bg-[var(--color-primary)] text-[var(--text-inverse)]' : 'text-[var(--text-secondary)] hover:text-slate-300'}`}
          >
            Annual
            <span className="ml-2 text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-black">SAVE 20%</span>
          </button>
        </div>
      </motion.div>

      {/* Usage Analytics */}
      <motion.section 
        variants={containerVars}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <motion.div variants={itemVars} className="lg:col-span-2">
          <Card variant="default" padding="none" className="h-full relative overflow-hidden group p-6">
            <div className="border-b border-[var(--border-default)] bg-[var(--bg-inset)] py-3 px-6 -mx-6 -mt-6 mb-6 flex items-center justify-between">
              <Heading3 className="flex items-center text-sm font-bold">
                <Activity className="mr-2 h-4 w-4 text-[var(--text-gold)]" /> API CONSUMPTION HUB
              </Heading3>
              <Badge variant="outline">
                {currentPlan.toUpperCase()} PLAN
              </Badge>
            </div>

            <div className="space-y-8 pt-2">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-1">
                  <span className="text-5xl font-black tracking-tighter leading-none text-white font-display">
                    {data?.requests_used.toLocaleString()}
                  </span>
                  <Caption className="block text-slate-500 text-sm">
                    out of {data?.requests_limit === -1 ? '∞' : data?.requests_limit.toLocaleString()} monthly requests
                  </Caption>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-extrabold text-[var(--text-gold)] font-mono">
                    {data?.usage_percent}%
                  </div>
                  <Label className="text-[10px] text-[var(--text-muted)] font-bold">Node Capacity</Label>
                </div>
              </div>

              <div className="h-3 w-full bg-[var(--bg-inset)] rounded-full border border-[var(--border-default)] p-0.5 relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, data?.usage_percent || 0)}%` }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full bg-gradient-gold shadow-[var(--shadow-gold)]"
                />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 pt-6 border-t border-[var(--border-subtle)]">
                <UsageStat label="Billing Cycle Ends" value={data?.next_billing_date ? new Date(data.next_billing_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '∞'} />
                <UsageStat label="Current Rate" value={data?.amount_inr ? `₹${data.amount_inr.toLocaleString('en-IN')}` : '₹0'} />
                <UsageStat label="Network Status" value={data?.status === 'active' ? 'Protected' : 'Pending'} status={data?.status === 'active'} />
                <div className="flex items-center justify-end">
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchData()}
                  >
                    Refresh Plan
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVars}>
          <Card variant="gold" padding="none" className="h-full flex flex-col justify-between p-6">
            <div className="space-y-6">
              <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-primary-muted)] border border-[var(--color-primary-border)] flex items-center justify-center text-[var(--text-gold)] flex-shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <Heading3 className="mb-2 text-white">Razorpay Integrated</Heading3>
                <Caption className="leading-relaxed">
                  Secure INR processing with UPI, Cards, and Netbanking support. Direct Indian subscription management.
                </Caption>
              </div>
            </div>
            
            <div className="pt-6 border-t border-[var(--border-subtle)] space-y-3">
              <div className="flex flex-wrap gap-4 items-center">
                <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-4 brightness-0 invert opacity-40 hover:opacity-100 transition-opacity" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-3.5 brightness-0 invert opacity-40 hover:opacity-100 transition-opacity" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-4 brightness-0 invert opacity-40 hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[9px] font-mono tracking-widest text-[var(--text-muted)] uppercase">Verified Payment Partner</p>
            </div>
          </Card>
        </motion.div>
      </motion.section>

      {/* Plan Selector */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="space-y-6"
      >
        <div className="flex items-center space-x-2 pb-2 border-b border-[var(--border-subtle)]">
          <Star className="w-5 h-5 text-[var(--text-gold)] fill-[var(--text-gold)]/20" />
          <Heading3>Infrastructure Tiers</Heading3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {plans.map((p, idx) => {
            const isCurrent = p.id === currentPlan;
            const isEnterprise = p.id === 'premium';
            
            return (
              <motion.div 
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }} 
                className="h-full"
              >
                <Card 
                  variant={p.variant}
                  padding="none"
                  className="flex flex-col h-full relative p-5"
                >
                  {p.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-[var(--color-primary)] text-[var(--text-inverse)]">
                      Most Popular
                    </div>
                  )}

                  <div className="mb-6">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">{p.name}</h4>
                    <div className="flex items-baseline space-x-1">
                      {p.id !== 'free' && <span className="text-2xl font-black">₹</span>}
                      <span className="text-5xl font-black tracking-tighter text-white font-display">{p.id === 'free' ? '0' : p.price.toLocaleString()}</span>
                      {p.id !== 'free' && <span className="text-slate-500 text-sm font-bold ml-1">/mo</span>}
                    </div>
                    <p className="text-[10px] font-mono bg-[var(--bg-inset)] border border-[var(--border-default)] px-3 py-1 rounded-full w-fit text-[var(--text-secondary)] mt-3">
                      {p.requests} Requests
                    </p>
                  </div>

                  <ul className="space-y-3 mb-6 flex-grow">
                    {p.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-[11px] font-medium text-[var(--text-secondary)] leading-relaxed">
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-[var(--color-success)]" />
                        <span>{f}</span>
                      </li>
                    ))}
                    {p.missing.map(f => (
                      <li key={f} className="flex items-start gap-2 text-[11px] font-medium text-[var(--text-muted)] line-through leading-relaxed opacity-50">
                        <X className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-[var(--color-danger)]/40" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div>
                    {isCurrent ? (
                      <Button disabled className="w-full bg-[var(--bg-inset)] border border-[var(--border-default)] text-[var(--text-muted)]">
                        CURRENT TIER
                      </Button>
                    ) : isEnterprise ? (
                      <Button variant="gold" className="w-full" onClick={() => setIsEnterpriseModalOpen(true)}>
                        <Crown className="w-4 h-4 mr-2" /> CONTACT SALES
                      </Button>
                    ) : (
                      <Button 
                        disabled={!!isSubscribing}
                        className="w-full"
                        variant={p.popular ? 'gold' : 'primary'}
                        onClick={() => handleSubscribe(p.id, isAnnual ? 'annual' : 'monthly')}
                      >
                        {isSubscribing === p.id ? 'INITIALIZING...' : 'UPGRADE NOW'}
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Invoice Ledger Table */}
      <AnimatePresence>
        {invoices.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pt-4"
          >
            <div className="flex items-center space-x-2 pb-2 border-b border-[var(--border-subtle)]">
              <CreditCard className="w-5 h-5 text-[var(--text-gold)]" />
              <Heading3>Billing Timeline</Heading3>
            </div>
            
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[var(--bg-inset)] border-b border-[var(--border-default)]">
                    <th className="py-4 px-6 font-mono text-[10px] uppercase text-[var(--text-muted)] font-bold">Transaction Date</th>
                    <th className="py-4 px-6 font-mono text-[10px] uppercase text-[var(--text-muted)] font-bold">Amount</th>
                    <th className="py-4 px-6 font-mono text-[10px] uppercase text-[var(--text-muted)] font-bold">Protocol</th>
                    <th className="py-4 px-6 font-mono text-[10px] uppercase text-[var(--text-muted)] font-bold">Status</th>
                    <th className="py-4 px-6 font-mono text-[10px] uppercase text-[var(--text-muted)] font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {invoices.map((inv) => (
                    <tr 
                      key={inv.id}
                      className="hover:bg-[var(--bg-highlight)] transition-colors"
                    >
                      <td className="py-4 px-6 font-medium text-[var(--text-secondary)]">{inv.date}</td>
                      <td className="py-4 px-6 font-mono font-bold text-white text-base">₹{inv.amount.toLocaleString('en-IN')}</td>
                      <td className="py-4 px-6 text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-widest">{inv.method || 'payment_node'}</td>
                      <td className="py-4 px-6">
                        <Badge variant={inv.status === 'captured' ? 'success' : 'danger'} dot>
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button className="text-[var(--text-gold)] hover:text-white font-mono text-[10px] uppercase tracking-widest inline-flex items-center group">
                          Download <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <div className="pt-12 border-t border-[var(--border-subtle)] text-center space-y-4">
        <p className="text-[var(--text-muted)] text-[10px] font-mono tracking-widest uppercase">
          Scale beyond limits? <span className="text-[var(--text-gold)] hover:text-white cursor-pointer transition-colors ml-2 font-bold" onClick={() => setIsEnterpriseModalOpen(true)}>Initialize Enterprise Protocol</span>
        </p>
        {currentPlan !== 'free' && (
          <button 
            onClick={() => setIsCancelModalOpen(true)}
            className="text-red-500 hover:text-red-400 text-[10px] font-mono tracking-widest uppercase transition-all"
          >
            Terminate Active Subscription
          </button>
        )}
      </div>

      {/* Cancellation Modal */}
      <AnimatePresence>
        {isCancelModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xs">
            <Card padding="none" className="max-w-md w-full p-6 space-y-6 border border-[var(--border-default)]">
              <div>
                <Heading3 className="text-white">Confirm Termination?</Heading3>
                <Caption className="mt-2 block">
                  You are about to terminate your active protection. Downgrade to Free plan will occur on {data?.next_billing_date}. Intelligence nodes will be deactivated.
                </Caption>
              </div>
              <div className="flex flex-col space-y-3">
                <Button onClick={() => setIsCancelModalOpen(false)} variant="gold" size="lg" fullWidth>
                  Restore Security
                </Button>
                <Button onClick={handleCancelSub} variant="ghost" size="md" className="text-red-500 hover:text-red-400" fullWidth>
                  Proceed with termination
                </Button>
              </div>
            </Card>
          </div>
        )}
      </AnimatePresence>

      <EnterpriseModal isOpen={isEnterpriseModalOpen} onClose={() => setIsEnterpriseModalOpen(false)} />
    </div>
  );
}

function UsageStat({ label, value, status }: any) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block font-bold">{label}</span>
      <div className="flex items-center">
        {status !== undefined && (
          <span className={`w-2 h-2 rounded-full mr-2 ${status ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
        )}
        <span className="text-sm font-bold text-white font-mono">{value}</span>
      </div>
    </div>
  );
}
