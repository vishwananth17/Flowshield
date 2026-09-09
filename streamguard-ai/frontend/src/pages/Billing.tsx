import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
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
    plan: 'builder',
    interval: 'monthly',
    status: 'active',
    amount_inr: 999,
    requests_used: 2480,
    requests_limit: 25000,
    usage_percent: 9.9,
    next_billing_date: '2026-09-22',
    subscription_id: 'sub_live_99812',
  });

  const [invoices, setInvoices] = useState<Invoice[]>([
    { id: 'inv_88910', date: '2026-08-22', amount: 999, status: 'PAID', method: 'UPI Collect' },
    { id: 'inv_88909', date: '2026-07-22', amount: 999, status: 'PAID', method: 'Razorpay' },
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

  const handleSubscribe = async (planId: 'builder' | 'growth' | 'enterprise') => {
    setIsSubscribing(true);
    try {
      await subscribeToPlan(planId, isAnnual ? 'annual' : 'monthly');
      const planName = planId.charAt(0).toUpperCase() + planId.slice(1);
      toast.success(`Plan upgraded to ${planName}! Capacity active.`);
      setData(prev => prev ? { 
        ...prev, 
        plan: planId, 
        amount_inr: planId === 'builder' ? 999 : planId === 'growth' ? 2999 : 7999,
        requests_limit: planId === 'builder' ? 25000 : planId === 'growth' ? 100000 : 1000000
      } : null);
    } catch (e: any) {
      toast.error('Subscription update failed');
    } finally {
      setIsSubscribing(false);
    }
  };

  const usagePercent = Math.min(100, Math.round(((data?.requests_used || 0) / (data?.requests_limit || 25000)) * 100));

  return (
    <div className="space-y-8 font-sans">
      
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
              <h2 className="type-h2 text-text-primary capitalize font-sans">
                {data?.plan || 'Builder'} Plan
              </h2>
              <Badge variant="allow" size="sm">Active</Badge>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-text-tertiary block">Next Billing Cycle</span>
            <span className="text-sm text-text-primary font-semibold">
              {data?.next_billing_date || '2026-09-22'}
            </span>
          </div>
        </div>

        {/* Quota Usage Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary">Monthly Evaluation Quota</span>
            <span className="text-text-primary font-bold">
              {(data?.requests_used || 0).toLocaleString()} / {(data?.requests_limit || 25000).toLocaleString()} ({usagePercent}%)
            </span>
          </div>
          <div className="w-full bg-surface-500 h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary-500 h-full transition-all duration-500"
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
          <div className="inline-flex items-center gap-2 bg-surface-200 border border-border-200 p-1 rounded-md">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                !isAnnual ? 'bg-primary-500 text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                isAnnual ? 'bg-primary-500 text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Annual (20% off)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          
          {/* Free Sandbox */}
          <Card variant="data" padding="md" className="flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <span className="type-label text-text-tertiary">Free Sandbox</span>
              <div className="text-3xl font-bold font-sans text-text-primary">₹0</div>
              <p className="text-xs text-text-secondary">1,000 evaluations / mo</p>
              <div className="border-t border-border-100 pt-3 space-y-2 text-xs text-text-tertiary">
                <div className="flex items-center gap-2 text-text-secondary"><Check className="w-3.5 h-3.5 text-primary-400" /> 3 dispute dossiers / mo</div>
                <div className="flex items-center gap-2 text-text-secondary"><Check className="w-3.5 h-3.5 text-primary-400" /> Core risk scoring engine</div>
                <div className="flex items-center gap-2 text-text-secondary"><Check className="w-3.5 h-3.5 text-primary-400" /> Sandbox API testing</div>
              </div>
            </div>
            <Button variant="secondary" size="sm" disabled={data?.plan === 'free'} className="w-full justify-center font-medium">
              {data?.plan === 'free' ? 'Current Plan' : 'Downgrade'}
            </Button>
          </Card>

          {/* Builder */}
          <Card variant="data" padding="md" className="flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <span className="type-label text-text-tertiary">Builder</span>
              <div className="text-3xl font-bold font-sans text-text-primary">
                {isAnnual ? '₹799' : '₹999'}<span className="text-xs text-text-tertiary font-normal">/mo</span>
              </div>
              <p className="text-xs text-text-secondary">25,000 evaluations / mo</p>
              <div className="border-t border-border-100 pt-3 space-y-2 text-xs text-text-secondary">
                <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary-400" /> 25 dispute dossiers / mo</div>
                <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary-400" /> Razorpay webhook sync</div>
                <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary-400" /> Fast-path challenge routing</div>
              </div>
            </div>
            <Button
              variant={data?.plan === 'builder' || data?.plan === 'basic' || data?.plan === 'starter' ? 'secondary' : 'primary'}
              size="sm"
              disabled={data?.plan === 'builder' || data?.plan === 'basic' || data?.plan === 'starter'}
              onClick={() => handleSubscribe('builder')}
              className="w-full justify-center font-medium"
            >
              {data?.plan === 'builder' || data?.plan === 'basic' || data?.plan === 'starter' ? 'Current Plan' : 'Select Builder'}
            </Button>
          </Card>

          {/* Growth (Most Popular) */}
          <div className="relative">
            <div className="text-center mb-1">
              <span className="type-label text-primary-400 text-[10px] bg-primary-500/10 border border-primary-500/20 px-2 py-0.5 rounded">
                Most popular
              </span>
            </div>
            <Card variant="data" padding="md" className="flex flex-col justify-between space-y-5 border-primary-500/40 shadow-glow-cyan h-[calc(100%-24px)]">
              <div className="space-y-3">
                <span className="type-label text-primary-400">Growth</span>
                <div className="text-3xl font-bold font-sans text-primary-400">
                  {isAnnual ? '₹2,399' : '₹2,999'}<span className="text-xs text-text-tertiary font-normal">/mo</span>
                </div>
                <p className="text-xs text-text-secondary">100,000 evaluations / mo</p>
                <div className="border-t border-border-100 pt-3 space-y-2 text-xs text-text-secondary">
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary-400" /> 100 dispute dossiers / mo</div>
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary-400" /> Shopify order matching</div>
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary-400" /> Courier validation & velocity</div>
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary-400" /> Continuous learning model</div>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                isLoading={isSubscribing}
                onClick={() => handleSubscribe('growth')}
                className="w-full justify-center font-medium"
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
                {isAnnual ? '₹6,399' : '₹7,999'}<span className="text-xs text-text-tertiary font-normal">/mo</span>
              </div>
              <p className="text-xs text-text-secondary">Unlimited evaluations</p>
              <div className="border-t border-border-100 pt-3 space-y-2 text-xs text-text-secondary">
                <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary-400" /> Unlimited dispute dossiers</div>
                <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary-400" /> Dedicated VPC deployment</div>
                <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary-400" /> Custom ML risk calibrator</div>
                <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary-400" /> 24/7 dedicated engineer</div>
              </div>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => handleSubscribe('enterprise')} 
              className="w-full justify-center font-medium"
            >
              Select Enterprise
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
