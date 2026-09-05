import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Check, CreditCard, Calendar, Download, Clock, Zap, Shield, ArrowRight } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import { subscribeToPlan } from '@/services/payment';
import EnterpriseModal from '@/components/EnterpriseModal';

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
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: string;
  method: string;
}

export default function Billing() {
  const [data, setData] = useState<SubscriptionData | null>({
    plan: 'starter',
    interval: 'monthly',
    status: 'active',
    amount_inr: 499,
    requests_used: 2480,
    requests_limit: 10000,
    usage_percent: 24.8,
    next_billing_date: '2026-09-22',
    subscription_id: 'sub_live_99812',
  });

  const [invoices, setInvoices] = useState<Invoice[]>([
    { id: 'inv_88910', date: '2026-08-22', amount: 499, status: 'PAID', method: 'UPI Collect' },
    { id: 'inv_88909', date: '2026-07-22', amount: 499, status: 'PAID', method: 'Razorpay' },
  ]);

  const [isAnnual, setIsAnnual] = useState(false);
  const [isEnterpriseModalOpen, setIsEnterpriseModalOpen] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const [subRes, invRes] = await Promise.all([
          api.get('/billing/subscription'),
          api.get('/billing/invoices'),
        ]);
        if (subRes.data) setData(subRes.data);
        if (invRes.data) setInvoices(invRes.data);
      } catch (e) {
        // fallback
      }
    };
    fetchBilling();
  }, []);

  const handleSubscribe = async (planId: string) => {
    setIsSubscribing(true);
    try {
      await subscribeToPlan(planId as any, isAnnual ? 'annual' : 'monthly', () => {
        toast.success(`Plan upgraded to ${planId.toUpperCase()}! Capacity active.`);
        setData(prev => prev ? { ...prev, plan: planId, amount_inr: planId === 'standard' ? 1499 : 499 } : null);
      });
    } catch (e: any) {
      toast.error('Subscription update failed');
    } finally {
      setIsSubscribing(false);
    }
  };

  const usagePercent = Math.min(100, Math.round(((data?.requests_used || 0) / (data?.requests_limit || 10000)) * 100));

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-h1 text-text-primary">Capacity & Billing</h1>
          <p className="type-sm text-text-secondary mt-0.5">
            Manage your evaluation quota, billing cycle, and payment gateways.
          </p>
        </div>
      </div>

      {/* Current Plan Overview Card */}
      <Card variant="data" padding="md" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-100 pb-4">
          <div>
            <span className="type-label text-text-tertiary block">Active Subscription</span>
            <div className="flex items-center gap-3 mt-1">
              <h2 className="type-h2 text-text-primary uppercase font-mono">
                {data?.plan || 'Starter'} Plan
              </h2>
              <Badge variant="allow" size="sm">Active</Badge>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-text-tertiary block">Next Billing Cycle</span>
            <span className="font-mono text-sm text-text-primary font-semibold">
              {data?.next_billing_date || '2026-09-22'}
            </span>
          </div>
        </div>

        {/* Quota Usage Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-text-secondary">Monthly Evaluation Quota</span>
            <span className="text-text-primary font-bold">
              {(data?.requests_used || 0).toLocaleString()} / {(data?.requests_limit || 10000).toLocaleString()} ({usagePercent}%)
            </span>
          </div>
          <div className="w-full bg-surface-500 h-2 rounded-full overflow-hidden">
            <div
              className="bg-cyan-500 h-full transition-all duration-500"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Pricing Tier Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="type-h3 text-text-primary">Available Plans</h3>
            <p className="type-sm text-text-tertiary">Select a capacity tier matching your checkout volume</p>
          </div>

          {/* Toggle */}
          <div className="inline-flex items-center gap-2 bg-surface-200 border border-border-200 p-1 rounded">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-3 py-1 text-xs font-semibold rounded-xs transition-colors ${
                !isAnnual ? 'bg-cyan-500 text-surface-000' : 'text-text-secondary'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-3 py-1 text-xs font-semibold rounded-xs transition-colors ${
                isAnnual ? 'bg-cyan-500 text-surface-000' : 'text-text-secondary'
              }`}
            >
              Annual (20% off)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          
          {/* Free */}
          <Card variant="data" padding="md" className="flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <span className="type-label text-text-tertiary">Free Sandbox</span>
              <div className="text-3xl font-bold font-sans text-text-primary">₹0</div>
              <p className="text-xs text-text-secondary">1,000 evaluations / mo</p>
              <div className="border-t border-border-100 pt-3 space-y-2 text-xs text-text-tertiary">
                <div className="flex items-center gap-2 text-text-secondary"><Check className="w-3.5 h-3.5 text-cyan-400" /> 3 disputes / mo</div>
                <div className="flex items-center gap-2 text-text-secondary"><Check className="w-3.5 h-3.5 text-cyan-400" /> Core risk score</div>
              </div>
            </div>
            <Button variant="secondary" size="sm" disabled={data?.plan === 'free'} className="w-full justify-center">
              {data?.plan === 'free' ? 'Current Plan' : 'Downgrade'}
            </Button>
          </Card>

          {/* Starter */}
          <Card variant="data" padding="md" className="flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <span className="type-label text-text-tertiary">Starter</span>
              <div className="text-3xl font-bold font-sans text-text-primary">
                {isAnnual ? '₹399' : '₹499'}<span className="text-xs text-text-tertiary font-normal">/mo</span>
              </div>
              <p className="text-xs text-text-secondary">10,000 evaluations / mo</p>
              <div className="border-t border-border-100 pt-3 space-y-2 text-xs text-text-secondary">
                <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> 10 dispute dossiers / mo</div>
                <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> Razorpay webhook sync</div>
              </div>
            </div>
            <Button
              variant={data?.plan === 'starter' || data?.plan === 'basic' ? 'secondary' : 'primary'}
              size="sm"
              disabled={data?.plan === 'starter' || data?.plan === 'basic'}
              onClick={() => handleSubscribe('basic')}
              className="w-full justify-center"
            >
              {data?.plan === 'starter' || data?.plan === 'basic' ? 'Current Plan' : 'Select Starter'}
            </Button>
          </Card>

          {/* Growth (Most Popular) */}
          <div className="relative">
            <div className="text-center mb-1">
              <span className="type-label text-cyan-400 text-[10px] bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-sm">
                Most popular
              </span>
            </div>
            <Card variant="data" padding="md" className="flex flex-col justify-between space-y-5 border-cyan-500/40 shadow-glow-cyan h-[calc(100%-24px)]">
              <div className="space-y-3">
                <span className="type-label text-cyan-400">Growth</span>
                <div className="text-3xl font-bold font-sans text-cyan-400">
                  {isAnnual ? '₹1,199' : '₹1,499'}<span className="text-xs text-text-tertiary font-normal">/mo</span>
                </div>
                <p className="text-xs text-text-secondary">50,000 evaluations / mo</p>
                <div className="border-t border-border-100 pt-3 space-y-2 text-xs text-text-secondary">
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> 50 dispute dossiers / mo</div>
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> Shopify order matching</div>
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> Courier validation</div>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                isLoading={isSubscribing}
                onClick={() => handleSubscribe('standard')}
                className="w-full justify-center"
              >
                {data?.plan === 'growth' || data?.plan === 'standard' ? 'Current Plan' : 'Upgrade to Growth'}
              </Button>
            </Card>
          </div>

          {/* Enterprise */}
          <Card variant="data" padding="md" className="flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <span className="type-label text-text-tertiary">Enterprise</span>
              <div className="text-3xl font-bold font-sans text-text-primary">
                {isAnnual ? '₹3,999' : '₹4,999'}<span className="text-xs text-text-tertiary font-normal">/mo</span>
              </div>
              <p className="text-xs text-text-secondary">Unlimited evaluations</p>
              <div className="border-t border-border-100 pt-3 space-y-2 text-xs text-text-secondary">
                <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> Unlimited disputes</div>
                <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> Dedicated VPC</div>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setIsEnterpriseModalOpen(true)} className="w-full justify-center">
              Contact sales
            </Button>
          </Card>

        </div>
      </div>

      {/* Invoices Table */}
      <Card variant="data" padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-border-100 flex items-center justify-between">
          <h3 className="type-label text-text-primary">Invoice History</h3>
          <span className="text-xs font-mono text-text-tertiary">GST Receipts</span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment Channel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-mono text-xs text-text-secondary">{inv.id}</TableCell>
                <TableCell className="text-xs text-text-tertiary">{inv.date}</TableCell>
                <TableCell className="font-semibold text-text-primary text-xs">₹{inv.amount}</TableCell>
                <TableCell className="text-xs text-text-secondary">{inv.method}</TableCell>
                <TableCell>
                  <Badge variant="allow" size="sm">{inv.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="xs" onClick={() => toast.success(`Downloaded ${inv.id}.pdf`)}>
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <EnterpriseModal 
        isOpen={isEnterpriseModalOpen} 
        onClose={() => setIsEnterpriseModalOpen(false)} 
      />

    </div>
  );
}
