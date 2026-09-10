import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { LiveIndicator } from '@/components/ui/LiveIndicator';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Check,
  ArrowRight,
  Menu,
  X,
  Copy,
  CheckCheck,
  ChevronRight,
  Sun,
  Moon,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface StreamTx {
  id: string;
  amount: number;
  currency: string;
  customer: string;
  riskScore: number;
  status: 'APPROVED' | 'REVIEW' | 'BLOCKED';
  time: string;
  method: string;
  tag?: string;
}

const INITIAL_TXS: StreamTx[] = [
  { id: 'TXN-10483', amount: 98500, currency: '₹', customer: 'CUS-8124', riskScore: 92, status: 'BLOCKED', time: 'Just now', method: 'UPI Collect', tag: '1930 Freeze' },
  { id: 'TXN-10482', amount: 14200, currency: '₹', customer: 'CUS-5510', riskScore: 78, status: 'REVIEW', time: '2s ago', method: 'COD Order', tag: 'High RTO' },
  { id: 'TXN-10481', amount: 4500, currency: '₹', customer: 'CUS-9912', riskScore: 14, status: 'APPROVED', time: '5s ago', method: 'PhonePe PG' },
  { id: 'TXN-10480', amount: 32000, currency: '₹', customer: 'CUS-2041', riskScore: 84, status: 'REVIEW', time: '8s ago', method: 'Razorpay Card' },
  { id: 'TXN-10479', amount: 2100, currency: '₹', customer: 'CUS-7718', riskScore: 8, status: 'APPROVED', time: '12s ago', method: 'GPay UPI' },
];

const NEW_POOL_TXS: StreamTx[] = [
  { id: 'TXN-10488', amount: 84000, currency: '₹', customer: 'CUS-9102', riskScore: 89, status: 'BLOCKED', time: 'Just now', method: 'Burner VPA', tag: 'Micro-probe' },
  { id: 'TXN-10487', amount: 12500, currency: '₹', customer: 'CUS-3411', riskScore: 68, status: 'REVIEW', time: 'Just now', method: 'COD Express', tag: 'RTO Pincode' },
  { id: 'TXN-10486', amount: 3200, currency: '₹', customer: 'CUS-1094', riskScore: 12, status: 'APPROVED', time: 'Just now', method: 'Cashfree PG' },
  { id: 'TXN-10485', amount: 56000, currency: '₹', customer: 'CUS-6029', riskScore: 94, status: 'BLOCKED', time: 'Just now', method: 'UPI Intent', tag: 'Mule Account' },
  { id: 'TXN-10484', amount: 1890, currency: '₹', customer: 'CUS-4820', riskScore: 6, status: 'APPROVED', time: 'Just now', method: 'Paytm UPI' },
];

export default function Landing() {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAnnual, setIsAnnual] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [activeLang, setActiveLang] = useState<'curl' | 'node' | 'python' | 'go'>('curl');
  const [hasCopiedCode, setHasCopiedCode] = useState(false);
  const [txFeed, setTxFeed] = useState<StreamTx[]>(INITIAL_TXS);

  // Nav scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Live transaction feed simulation (adds new row every 4s)
  useEffect(() => {
    let poolIndex = 0;
    const interval = setInterval(() => {
      const nextTx = {
        ...NEW_POOL_TXS[poolIndex % NEW_POOL_TXS.length],
        id: `TXN-${Math.floor(10480 + Math.random() * 900)}`,
        time: 'Just now',
      };
      poolIndex++;
      setTxFeed((prev) => [nextTx, ...prev.slice(0, 4)]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const featureTabs = [
    {
      id: 'upi_defense',
      title: 'UPI & 1930 Freeze Defense',
      headline: 'Stop police bank account freezes and burner VPA cycling',
      description: 'MHA 1930 cybercrime portals freeze entire merchant settlement accounts if a victim reports a scam transaction. FlowShield inspects UPI flow types, VPA reputation, and device fingerprints to isolate tainted funds before capture.',
      points: [
        'Deterministic detection of burner VPAs (@ybl, @okhdfcbank) cycling through rapid micro-probing.',
        'Blocks reverse UPI collect requests deceptively masquerading as incoming payouts.',
        'Saves merchants weeks of legal liaison with cyber police by stopping lien vectors pre-settlement.',
      ],
      code: `// UPI Webhook received from Razorpay / Cashfree / PhonePe
const evaluation = await flowshield.evaluateUpi({
  vpa: "scammer.quickloot98@ybl",
  amount: 45000,
  upiFlow: "COLLECT",
  customerPhone: "9876543210",
  deviceFingerprint: "dev_991823"
});

// Result returned in 38ms:
// { decision: "BLOCK", score: 94, reason: "1930_POLICE_FREEZE_VECTOR_BURNER_VPA" }`,
    },
    {
      id: 'rto_defense',
      title: 'COD & RTO Shield',
      headline: 'Predict delivery refusal before spending ₹250 on courier fees',
      description: 'Fake Cash-on-Delivery orders cost Indian D2C brands thousands in forward and return courier penalties. FlowShield calculates RTO risk using delivery address anomalies, pincode refusal rates, and phone history.',
      points: [
        'Real-time RTO risk score (0–100) and recommendation: ALLOW_COD, REQUIRE_PREPAID_UPI, or BLOCK.',
        'Cuts courier return burn by up to 42% on high-risk logistics pin codes.',
        'Deep sync with Shiprocket, Delhivery, and BlueDart air waybill events.',
      ],
      code: `// Evaluate D2C Cash on Delivery Order
const rtoCheck = await flowshield.evaluateOrder({
  amount: 2499,
  isCod: true,
  pincode: "110006",
  address: "Room 402, Near Old Bridge, Delhi",
  phone: "9123456780"
});

// Result:
// { rtoRiskScore: 82, recommendation: "REQUIRE_PREPAID_UPI", reason: "HIGH_RTO_PINCODE_UNVERIFIED_ADDRESS" }`,
    },
    {
      id: 'scoring',
      title: 'Gateway Telemetry',
      headline: '43ms ML inference before payment capture',
      description: 'Evaluate incoming payments across Razorpay, Cashfree, and PhonePe against 120+ risk signals including device canvas hashing, proxy telemetry, BIN consistency, and behavioral velocity.',
      points: [
        'Deterministic rules executed concurrently with gradient boosted decision trees.',
        'Sub-50ms roundtrip latency prevents checkout drop-off.',
        'Dynamic 3DS step-up engine: frictionless for safe buyers, challenge for risky.',
      ],
      code: `// Evaluate checkout payload
const evaluation = await flowshield.evaluate({
  amount: 98500,
  currency: 'INR',
  customerId: 'cus_8124',
  deviceFingerprint: 'a8f9c1d2e3b4',
  ip: '41.58.100.5'
});

// Result returned in 41ms:
// { decision: "BLOCK", score: 92, signals: ["TOR_EXIT", "VELOCITY_SPIKE"] }`,
    },
    {
      id: 'chargebacks',
      title: 'Dispute Representment',
      headline: 'Automated 4-page representment dossiers',
      description: 'Stop losing winnable disputes to paperwork. FlowShield automatically aggregates courier delivery proofs, customer IP logs, and order receipts into bank-formatted PDF packages.',
      points: [
        'Direct sync with Delhivery, BlueDart, and Shiprocket for signed POD extraction.',
        'Pre-formatted to Visa and Mastercard compelling evidence specifications.',
        '94% win rate on commercial merchandise non-receipt claims.',
      ],
      code: `POST /v1/disputes/disp_99182/represent
Content-Type: application/pdf
Authorization: Bearer sk_live_9f82a...

Evidence Package Compiled:
├── 1. Merchant Invoice #ORD-9918
├── 2. Delhivery Air Waybill #DEL98871625 [SIGNED]
├── 3. Device & Geolocation Audit Trail
└── 4. Terms of Service Acceptance Log

Result: SUBMITTED_TO_GATEWAY (Win Probability: 95%)`,
    },
    {
      id: 'rules',
      title: 'Smart Rules Engine',
      headline: 'Combine custom heuristics with machine learning',
      description: 'Write transparent business policies in plain logic or JSON. Block carding bursts, limit foreign cards on high-ticket SKUs, or VIP-whitelist repeat customers.',
      points: [
        'Simulate new rules against past 90 days of transactions before deploying.',
        'Sub-millisecond rule evaluation overhead.',
        'Zero code deployments with instant global propagation.',
      ],
      code: `RULE: Block_Datacenter_Proxy_Burst
WHEN:
  transaction.amount > 25000 AND
  ip.is_datacenter == true AND
  velocity.card_attempts_10m >= 3
THEN:
  action: BLOCK
  reason: "PROXY_CARDING_BURST"
  notify: "#fraud-ops-alerts"`,
    },
    {
      id: 'api',
      title: 'API & Webhooks',
      headline: 'Built for developers who respect clean architecture',
      description: 'Drop-in REST API with typed SDKs for TypeScript, Python, and Go. Real-time webhooks with SHA-256 HMAC signature verification and automatic retries.',
      points: [
        'Idempotent requests with X-Idempotency-Key support.',
        'Granular API keys with read/write permission scopes.',
        'Zero third-party vendor dependencies in core evaluation path.',
      ],
      code: `import { FlowShield } from '@flowshield/node';

const client = new FlowShield({ apiKey: process.env.FLOWSHIELD_KEY });

// Webhook signature verification
const event = client.webhooks.constructEvent(
  req.body,
  req.headers['x-flowshield-signature'],
  process.env.WEBHOOK_SECRET
);

if (event.type === 'transaction.blocked') {
  console.log('Blocked fraud attempt:', event.data.id);
}`,
    },
  ];

  const codeSnippets: Record<'curl' | 'node' | 'python' | 'go', string> = {
    curl: `curl -X POST https://api.flowshield.ai/v1/transactions/analyze \\
  -H "Authorization: Bearer sk_live_9f82a..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 98500,
    "currency": "INR",
    "customer_id": "cus_8124",
    "payment_method": "card",
    "ip_address": "41.58.100.5"
  }'

# Response (41ms latency):
{
  "risk_score": 92,
  "decision": "BLOCK",
  "signals": ["ANONYMOUS_PROXY", "VELOCITY_SPIKE"],
  "latency_ms": 41
}`,
    node: `import { FlowShield } from '@flowshield/sdk';

const flowshield = new FlowShield({ apiKey: process.env.FLOWSHIELD_KEY });

const result = await flowshield.transactions.analyze({
  amount: 98500,
  currency: 'INR',
  customerId: 'cus_8124',
  paymentMethod: 'card',
  ipAddress: '41.58.100.5'
});

console.log(result.decision); // "BLOCK"
console.log(result.riskScore); // 92`,
    python: `from flowshield import FlowShield

client = FlowShield(api_key="sk_live_9f82a...")

response = client.transactions.analyze(
    amount=98500,
    currency="INR",
    customer_id="cus_8124",
    payment_method="card",
    ip_address="41.58.100.5"
)

if response.decision == "BLOCK":
    print(f"Transaction blocked: Score {response.risk_score}")`,
    go: `package main

import (
    "context"
    "fmt"
    "github.com/flowshield/flowshield-go"
)

func main() {
    client := flowshield.NewClient("sk_live_9f82a...")
    res, _ := client.Transactions.Analyze(context.Background(), &flowshield.AnalyzeParams{
        Amount:   98500,
        Currency: "INR",
        CustomerID: "cus_8124",
    })
    fmt.Printf("Decision: %s (Score: %d)\\n", res.Decision, res.RiskScore)
}`,
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeLang]);
    setHasCopiedCode(true);
    toast.success('Snippet copied to clipboard');
    setTimeout(() => setHasCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--surface-canvas)] text-[var(--text-primary)] font-sans antialiased selection:bg-[var(--brand-100)] selection:text-[var(--brand-600)] overflow-x-hidden">
      
      {/* =========================================================================
          6.1 — FIXED NAVIGATION (52px STRICT)
          ========================================================================= */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 h-[52px] transition-all duration-normal ${
          scrolled
            ? 'bg-[var(--surface-page)]/85 border-b border-[var(--border-default)] backdrop-blur-md shadow-xs'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Left: Logo + Wordmark */}
          <Link to="/" className="flex items-center gap-2.5 select-none">
            <Logo size={28} withContainer={false} />
            <span className="font-semibold text-[15px] tracking-tight text-[var(--text-primary)]">
              FlowShield
            </span>
          </Link>

          {/* Center: Clean Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-[13px] font-medium text-[var(--text-secondary)]">
            <a href="#features" className="hover:text-[var(--text-primary)] transition-colors">Product</a>
            <Link to="/audit" className="hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5">
              <span>Free Risk Audit</span>
              <span className="px-1.5 py-0.2 rounded-[var(--radius-xs)] text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">FREE</span>
            </Link>
            <Link to="/simulator" className="hover:text-[var(--text-primary)] transition-colors">Simulator</Link>
            <Link to="/docs" className="hover:text-[var(--text-primary)] transition-colors">Docs</Link>
            <a href="#pricing" className="hover:text-[var(--text-primary)] transition-colors">Pricing</a>
          </nav>

          {/* Right: Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="xs"
              onClick={toggleTheme}
              className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button variant="primary" size="sm" asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1.5 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[var(--border-default)] bg-[var(--surface-page)] px-4 py-4 space-y-3">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-[13px] font-medium text-[var(--text-secondary)] py-1">Product</a>
            <a href="#problem" onClick={() => setMobileMenuOpen(false)} className="block text-[13px] font-medium text-[var(--text-secondary)] py-1">Solutions</a>
            <Link to="/simulator" onClick={() => setMobileMenuOpen(false)} className="block text-[13px] font-semibold text-[var(--brand-600)] py-1">Simulator (Live)</Link>
            <Link to="/docs" onClick={() => setMobileMenuOpen(false)} className="block text-[13px] font-medium text-[var(--text-secondary)] py-1">Docs</Link>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-[13px] font-medium text-[var(--text-secondary)] py-1">Pricing</a>
            <div className="pt-2 flex flex-col gap-2">
              <Button variant="secondary" size="sm" asChild className="w-full justify-center">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button variant="primary" size="sm" asChild className="w-full justify-center">
                <Link to="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          6.2 — HERO SECTION (Left-Aligned, Max 56px Headline, 55/45 Split)
          ========================================================================= */}
      <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-24 border-b border-[var(--border-default)] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column (58% / 7 cols) */}
            <div className="lg:col-span-7 space-y-6 text-left">
              
              {/* Category Rule Tagline: 2px solid brand-500 left border */}
              <div className="inline-flex items-center gap-2.5 border-l-2 border-[var(--brand-500)] pl-3 text-[12px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                <span>REAL-TIME TRANSACTION INTELLIGENCE</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-mono text-emerald-400 font-bold">UPI & CARD DEFENSE</span>
              </div>

              {/* Strict Max 56px Headline */}
              <h1 className="text-[34px] sm:text-[44px] lg:text-[52px] font-bold tracking-tight text-[var(--text-primary)] leading-[1.12]">
                Stop UPI Scams, 1930 Account Freezes &{' '}
                <span className="text-[var(--brand-500)]">D2C RTO Losses</span>.
              </h1>

              {/* Subheading: max 20px, text-secondary, max-w-xl */}
              <p className="max-w-xl text-[16px] sm:text-[18px] text-[var(--text-secondary)] leading-relaxed font-normal">
                FlowShield evaluates every payment in under 50ms across Razorpay, Cashfree, PhonePe, and Cards. Autonomous ML intelligence protecting merchant bank accounts from cybercrime liens and eliminating courier cash burn.
              </p>

              {/* Action CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button variant="primary" size="lg" asChild>
                  <Link to="/simulator" className="gap-2 font-medium">
                    <span>Try Threat Simulator</span>
                    <ArrowRight size={15} />
                  </Link>
                </Button>
                <Button variant="secondary" size="lg" asChild>
                  <Link to="/audit" className="gap-2 font-medium">
                    <span>Run Free Risk Audit</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">10K BENCHMARK</span>
                  </Link>
                </Button>
                <Button variant="ghost" size="lg" asChild>
                  <a href="#how-it-works" className="gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                    <span>Architecture</span>
                    <span className="text-[var(--text-tertiary)]">↓</span>
                  </a>
                </Button>
              </div>

              {/* Trust Line: 3 Checkmarks */}
              <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-[var(--text-secondary)]">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-400" />
                  <span>Native UPI Telemetry (GPay, PhonePe, Paytm)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-400" />
                  <span>Cybercrime 1930 Police Freeze Defense</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-400" />
                  <span>D2C COD Return-to-Origin (RTO) Shield</span>
                </div>
              </div>

            </div>

            {/* Right Column (42% / 5 cols): Dark Frame Live Feed Preview */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="w-full max-w-[460px] bg-[#0A0E17] border border-slate-800 rounded-[var(--radius-xl)] p-5 shadow-2xl relative overflow-hidden text-slate-200">
                
                {/* Frame Header */}
                <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <LiveIndicator />
                    <span className="text-[12px] font-semibold text-slate-200 tracking-tight">
                      Real-time Feed
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">
                    43ms median latency
                  </span>
                </div>

                {/* Animated Rows */}
                <div className="space-y-2">
                  {txFeed.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 rounded-[var(--radius-md)] bg-[#101520] border border-slate-800/70 space-y-2 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[12px]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-slate-300">
                            {tx.id}
                          </span>
                          <span className="text-slate-600">·</span>
                          <span className="font-mono text-slate-400 text-[11px]">
                            {tx.customer}
                          </span>
                        </div>
                        <div className="font-bold text-[13px] text-white tabular-numbers font-mono">
                          {tx.currency}{tx.amount.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <RiskBadge
                            level={
                              tx.riskScore >= 85 ? 'critical' :
                              tx.riskScore >= 70 ? 'high' :
                              tx.riskScore >= 35 ? 'medium' :
                              'low'
                            }
                            score={tx.riskScore}
                            size="sm"
                          />
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700/60">
                            {tx.method}
                          </span>
                          {tx.tag && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              {tx.tag}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 shrink-0">
                          {tx.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Frame Footer */}
                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Ensemble: XGBoost + MVIForest</span>
                  <span className="text-emerald-400 font-medium">● 100% Intercept Active</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          6.3 — STATS STRIP (4 Centered Stats with 1px Dividers)
          ========================================================================= */}
      <section className="border-b border-[var(--border-default)] bg-[var(--surface-page)] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[var(--border-default)]">
            
            <div className="text-center py-3 md:py-0 md:px-6">
              <div className="text-[32px] sm:text-[36px] font-bold font-sans tracking-tight text-[var(--text-primary)] tabular-numbers">
                94%
              </div>
              <div className="text-[12px] text-[var(--text-secondary)] mt-1 font-medium">
                Fraud caught before capture
              </div>
            </div>

            <div className="text-center py-3 md:py-0 md:px-6">
              <div className="text-[32px] sm:text-[36px] font-bold font-sans tracking-tight text-[var(--text-primary)] tabular-numbers">
                43ms
              </div>
              <div className="text-[12px] text-[var(--text-secondary)] mt-1 font-medium">
                Average evaluation latency
              </div>
            </div>

            <div className="text-center py-3 md:py-0 md:px-6">
              <div className="text-[32px] sm:text-[36px] font-bold font-sans tracking-tight text-[var(--text-primary)] tabular-numbers">
                ₹0
              </div>
              <div className="text-[12px] text-[var(--text-secondary)] mt-1 font-medium">
                Setup fee, pay as you scale
              </div>
            </div>

            <div className="text-center py-3 md:py-0 md:px-6">
              <div className="text-[32px] sm:text-[36px] font-bold font-sans tracking-tight text-[var(--text-primary)] tabular-numbers">
                250K+
              </div>
              <div className="text-[12px] text-[var(--text-secondary)] mt-1 font-medium">
                Transactions evaluated daily
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          6.4 — PROBLEM STATEMENT SECTION (01 / 02 / 03 Pain Points)
          ========================================================================= */}
      <section id="problem" className="py-20 sm:py-28 border-b border-[var(--border-default)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="space-y-3">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--brand-600)]">
              THE PROBLEM
            </div>
            <h2 className="text-[28px] sm:text-[36px] font-bold tracking-tight text-[var(--text-primary)]">
              Chargebacks are eating your margins
            </h2>
            <p className="text-[15px] text-[var(--text-secondary)] max-w-2xl">
              High-growth merchants lose critical capital to fraudulent chargebacks, bank penalties, and tedious evidence compilation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 01 */}
            <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--surface-page)] border border-[var(--border-default)] space-y-4">
              <div className="text-[28px] font-mono font-bold text-[var(--text-tertiary)]">01</div>
              <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">
                1.8% average revenue lost
              </h3>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                Direct fraud losses and false chargebacks drain top-line margins before accounting for shipping or packaging costs.
              </p>
            </div>

            {/* Card 02 */}
            <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--surface-page)] border border-[var(--border-default)] space-y-4">
              <div className="text-[28px] font-mono font-bold text-[var(--text-tertiary)]">02</div>
              <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">
                ₹1,500 fee per dispute from banks
              </h3>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                Even when you win the dispute, issuing banks charge non-refundable administrative fees that accumulate rapidly.
              </p>
            </div>

            {/* Card 03 */}
            <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--surface-page)] border border-[var(--border-default)] space-y-4">
              <div className="text-[28px] font-mono font-bold text-[var(--text-tertiary)]">03</div>
              <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">
                2–4 weeks to resolve each claim
              </h3>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                Manual proof gathering from couriers and databases leads to missed submission deadlines and automated forfeiture.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          6.5 — HOW IT WORKS SECTION (01 ── 02 ── 03 Horizontal Flow)
          ========================================================================= */}
      <section id="how-it-works" className="py-20 sm:py-28 border-b border-[var(--border-default)] bg-[var(--surface-page)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="space-y-3">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--brand-600)]">
              HOW IT WORKS
            </div>
            <h2 className="text-[28px] sm:text-[36px] font-bold tracking-tight text-[var(--text-primary)]">
              Three steps. Under 5 minutes.
            </h2>
            <p className="text-[15px] text-[var(--text-secondary)] max-w-2xl">
              Zero code or complex server provisioning required to begin intercepting threat vectors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            
            {/* Connecting line on desktop */}
            <div className="hidden md:block absolute top-7 left-[15%] right-[15%] h-[1px] bg-[var(--border-default)] z-0" />

            {/* Step 1 */}
            <div className="relative z-10 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[var(--surface-secondary)] border border-[var(--border-default)] flex items-center justify-center font-mono font-bold text-[16px] text-[var(--brand-600)]">
                01
              </div>
              <h3 className="text-[16px] font-semibold text-[var(--text-primary)]">
                Connect your gateway
              </h3>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                One-click sync with Stripe, Razorpay, and Cashfree webhooks. No gateway code changes necessary.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[var(--surface-secondary)] border border-[var(--border-default)] flex items-center justify-center font-mono font-bold text-[16px] text-[var(--brand-600)]">
                02
              </div>
              <h3 className="text-[16px] font-semibold text-[var(--text-primary)]">
                ML evaluates in real time
              </h3>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                In 43ms, our dual-model ensemble evaluates 120+ signals against network-wide fraud telemetry.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[var(--surface-secondary)] border border-[var(--border-default)] flex items-center justify-center font-mono font-bold text-[16px] text-[var(--brand-600)]">
                03
              </div>
              <h3 className="text-[16px] font-semibold text-[var(--text-primary)]">
                Automate actions
              </h3>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                Automatically approve genuine shoppers, challenge suspicious checkouts with 3DS, and block malicious cards.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          6.6 — PRODUCT FEATURES (4 Vertical Tabs + Interactive Preview)
          ========================================================================= */}
      <section id="features" className="py-20 sm:py-28 border-b border-[var(--border-default)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="space-y-3">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--brand-600)]">
              CAPABILITIES
            </div>
            <h2 className="text-[28px] sm:text-[36px] font-bold tracking-tight text-[var(--text-primary)]">
              Built for high-volume merchants
            </h2>
            <p className="text-[15px] text-[var(--text-secondary)] max-w-2xl">
              Deep protection against card testing bots, friendly fraud, and payment processor disputes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Vertical Tabs (4 cols) */}
            <div className="lg:col-span-4 space-y-2">
              {featureTabs.map((tab, idx) => {
                const isActive = activeTab === idx;
                return (
                  <div
                    key={tab.id}
                    onClick={() => setActiveTab(idx)}
                    className={`p-4 rounded-[var(--radius-md)] border cursor-pointer transition-all select-none ${
                      isActive
                        ? 'bg-[var(--surface-page)] border-[var(--border-default)] border-l-4 border-l-[var(--brand-500)] shadow-xs'
                        : 'bg-transparent border-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[14px] font-semibold ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                        {tab.title}
                      </span>
                      <ChevronRight size={16} className={`transition-transform ${isActive ? 'text-[var(--brand-500)] translate-x-0.5' : 'text-[var(--text-tertiary)]'}`} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Interactive Preview Panel (8 cols) */}
            <div className="lg:col-span-8 p-6 sm:p-8 rounded-[var(--radius-lg)] bg-[var(--surface-page)] border border-[var(--border-default)] space-y-6">
              <div>
                <h3 className="text-[20px] font-bold text-[var(--text-primary)] tracking-tight">
                  {featureTabs[activeTab].headline}
                </h3>
                <p className="text-[14px] text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                  {featureTabs[activeTab].description}
                </p>
              </div>

              <div className="space-y-2.5">
                {featureTabs[activeTab].points.map((pt, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-[13px] text-[var(--text-secondary)]">
                    <Check size={15} className="text-[var(--brand-500)] mt-0.5 flex-shrink-0" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>

              {/* Code Snippet Box */}
              <div className="p-4 rounded-[var(--radius-sm)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] font-mono text-[12px] text-[var(--text-primary)] overflow-x-auto">
                <pre className="leading-relaxed"><code>{featureTabs[activeTab].code}</code></pre>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[var(--border-subtle)]">
                <Link to="/docs" className="text-[12px] font-semibold text-[var(--brand-600)] hover:underline flex items-center gap-1">
                  <span>Explore technical documentation</span>
                  <ArrowRight size={13} />
                </Link>
                <Button variant="primary" size="sm" asChild>
                  <Link to="/register">Start free</Link>
                </Button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          6.7 — API / DEVELOPER SECTION (POST analyze + 43ms Latency Bar)
          ========================================================================= */}
      <section className="py-20 sm:py-28 border-b border-[var(--border-default)] bg-[var(--surface-page)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="space-y-3">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--brand-600)]">
              DEVELOPER-FIRST
            </div>
            <h2 className="text-[28px] sm:text-[36px] font-bold tracking-tight text-[var(--text-primary)]">
              Integrate with one POST request
            </h2>
            <p className="text-[15px] text-[var(--text-secondary)] max-w-2xl">
              Send your transaction payload at checkout. Receive a deterministic risk score, recommended decision, and forensic signals in under 45ms.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Specs (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Latency Metric Card */}
              <div className="p-5 rounded-[var(--radius-md)] bg-[var(--surface-secondary)] border border-[var(--border-default)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Inference Latency
                  </span>
                  <span className="font-mono text-[13px] font-bold text-[var(--risk-low-text)]">
                    41ms actual
                  </span>
                </div>

                {/* Latency Bar */}
                <div className="w-full bg-[var(--surface-subtle)] h-2 rounded-[var(--radius-pill)] overflow-hidden">
                  <div className="bg-[var(--risk-low-dot)] h-full rounded-[var(--radius-pill)]" style={{ width: '41%' }} />
                </div>

                <div className="flex justify-between text-[11px] font-mono text-[var(--text-tertiary)]">
                  <span>0ms</span>
                  <span>Target &lt; 50ms</span>
                  <span>100ms max</span>
                </div>
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-1 bg-[var(--surface-secondary)] border border-[var(--border-default)] p-1 rounded-[var(--radius-sm)]">
                {(['curl', 'node', 'python', 'go'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveLang(lang)}
                    className={`flex-1 py-1.5 text-[12px] font-mono font-medium rounded-[var(--radius-xs)] uppercase transition-colors ${
                      activeLang === lang
                        ? 'bg-[var(--surface-page)] text-[var(--text-primary)] font-bold shadow-xs'
                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              <div className="space-y-2 text-[13px] text-[var(--text-secondary)]">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-[var(--brand-500)]" />
                  <span>Standard TLS 1.3 / AES-256 payload encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-[var(--brand-500)]" />
                  <span>Webhook event signatures with replay attack protection</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-[var(--brand-500)]" />
                  <span>Comprehensive API reference with interactive playground</span>
                </div>
              </div>

              <Button variant="secondary" size="md" asChild>
                <Link to="/docs" className="gap-2">
                  <span>Read full API documentation</span>
                  <ExternalLink size={14} />
                </Link>
              </Button>

            </div>

            {/* Right Dark Code Editor (7 cols) */}
            <div className="lg:col-span-7 rounded-[var(--radius-lg)] bg-[#090D14] border border-slate-800 p-5 font-mono text-[12px] text-slate-200 space-y-4 shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  <span className="text-[11px] text-slate-400 ml-2 font-mono">
                    POST /v1/transactions/analyze
                  </span>
                </div>

                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                  title="Copy snippet"
                >
                  {hasCopiedCode ? <CheckCheck size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{hasCopiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="overflow-x-auto max-h-[380px]">
                <pre className="leading-relaxed"><code>{codeSnippets[activeLang]}</code></pre>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          6.8 — PRICING SECTION (4 Tiers, Growth Elevated, Annual Toggle)
          ========================================================================= */}
      <section id="pricing" className="py-20 sm:py-28 border-b border-[var(--border-default)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--brand-600)]">
              PRICING
            </div>
            <h2 className="text-[28px] sm:text-[36px] font-bold tracking-tight text-[var(--text-primary)]">
              Simple, transparent pricing
            </h2>
            <p className="text-[15px] text-[var(--text-secondary)]">
              Start free. Scale smoothly as your order volume expands.
            </p>

            {/* Annual / Monthly Switcher */}
            <div className="inline-flex items-center gap-1 p-1 bg-[var(--surface-secondary)] border border-[var(--border-default)] rounded-[var(--radius-sm)] mt-2">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-3 py-1 text-[12px] font-semibold rounded-[var(--radius-xs)] transition-colors ${
                  !isAnnual ? 'bg-[var(--brand-500)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-3 py-1 text-[12px] font-semibold rounded-[var(--radius-xs)] transition-colors ${
                  isAnnual ? 'bg-[var(--brand-500)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Annual (Save 20%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            
            {/* Tier 1: Developer */}
            <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--surface-page)] border border-[var(--border-default)] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-[16px] font-semibold text-[var(--text-primary)]">Developer</h3>
                  <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">For testing & initial launch</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[32px] font-bold text-[var(--text-primary)] tabular-numbers">₹0</span>
                    <span className="text-[12px] text-[var(--text-tertiary)] font-mono">forever</span>
                  </div>
                  <div className="text-[11px] text-[var(--text-tertiary)] font-mono">
                    Free up to 1,000 txns/mo
                  </div>
                </div>
                <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2.5 text-[12px] text-[var(--text-secondary)]">
                  <div className="flex items-center gap-2"><Check size={14} className="text-[var(--brand-500)]" /> Up to 1,000 txns/mo</div>
                  <div className="flex items-center gap-2"><Check size={14} className="text-[var(--brand-500)]" /> Core ML risk scoring</div>
                  <div className="flex items-center gap-2"><Check size={14} className="text-[var(--brand-500)]" /> 3 dispute dossiers/mo</div>
                  <div className="flex items-center gap-2 text-[var(--text-tertiary)]"><span className="w-3 text-center">—</span> Custom rules engine</div>
                </div>
              </div>
              <Button variant="secondary" size="sm" asChild className="w-full justify-center">
                <Link to="/register">Start Free</Link>
              </Button>
            </div>

            {/* Tier 2: Growth (Elevated 1.5px brand border, MOST POPULAR) */}
            <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--surface-page)] border-[1.5px] border-[var(--brand-500)] flex flex-col justify-between space-y-6 relative shadow-sm">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[var(--brand-500)] text-white text-[10px] font-bold uppercase tracking-wider">
                MOST POPULAR
              </div>
              <div className="space-y-4 pt-1">
                <div>
                  <h3 className="text-[16px] font-semibold text-[var(--text-primary)]">Growth</h3>
                  <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">For growing D2C brands</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[32px] font-bold text-[var(--text-primary)] tabular-numbers">
                      {isAnnual ? '₹47,988' : '₹4,999'}
                    </span>
                    <span className="text-[12px] text-[var(--text-tertiary)] font-mono">
                      {isAnnual ? '/year' : '/month'}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--brand-500)] font-medium font-mono">
                    {isAnnual ? '₹3,999/month · save ₹12,000/yr' : 'Billed monthly'}
                  </div>
                </div>
                <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2.5 text-[12px] text-[var(--text-secondary)]">
                  <div className="flex items-center gap-2"><Check size={14} className="text-[var(--brand-500)]" /> Up to 50,000 txns/mo</div>
                  <div className="flex items-center gap-2"><Check size={14} className="text-[var(--brand-500)]" /> 50 dispute dossiers/mo</div>
                  <div className="flex items-center gap-2"><Check size={14} className="text-[var(--brand-500)]" /> Delhivery & BlueDart tracking sync</div>
                  <div className="flex items-center gap-2"><Check size={14} className="text-[var(--brand-500)]" /> Custom rule builder</div>
                </div>
              </div>
              <Button variant="primary" size="sm" asChild className="w-full justify-center">
                <Link to="/register">Start Growth</Link>
              </Button>
            </div>

            {/* Tier 3: Scale */}
            <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--surface-page)] border border-[var(--border-default)] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-[16px] font-semibold text-[var(--text-primary)]">Scale</h3>
                  <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">For established volume merchants</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[32px] font-bold text-[var(--text-primary)] tabular-numbers">
                      {isAnnual ? '₹1,43,988' : '₹14,999'}
                    </span>
                    <span className="text-[12px] text-[var(--text-tertiary)] font-mono">
                      {isAnnual ? '/year' : '/month'}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--brand-500)] font-medium font-mono">
                    {isAnnual ? '₹11,999/month · save ₹36,000/yr' : 'Billed monthly'}
                  </div>
                </div>
                <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2.5 text-[12px] text-[var(--text-secondary)]">
                  <div className="flex items-center gap-2"><Check size={14} className="text-[var(--brand-500)]" /> Up to 250,000 txns/mo</div>
                  <div className="flex items-center gap-2"><Check size={14} className="text-[var(--brand-500)]" /> Unlimited dispute dossiers</div>
                  <div className="flex items-center gap-2"><Check size={14} className="text-[var(--brand-500)]" /> Priority webhook delivery</div>
                  <div className="flex items-center gap-2"><Check size={14} className="text-[var(--brand-500)]" /> Team role-based access</div>
                </div>
              </div>
              <Button variant="secondary" size="sm" asChild className="w-full justify-center">
                <Link to="/register">Start Scale</Link>
              </Button>
            </div>

            {/* Tier 4: Enterprise */}
            <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--surface-page)] border border-[var(--border-default)] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-[16px] font-semibold text-[var(--text-primary)]">Enterprise</h3>
                  <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">For payment aggregators & fintechs</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[32px] font-bold text-[var(--text-primary)]">Custom</span>
                  </div>
                  <div className="text-[11px] text-[var(--text-tertiary)] font-mono">
                    Volume pricing & dedicated SLA
                  </div>
                </div>
                <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2.5 text-[12px] text-[var(--text-secondary)]">
                  <div className="flex items-center gap-2"><Check size={14} className="text-[var(--brand-500)]" /> Unlimited transactions</div>
                  <div className="flex items-center gap-2"><Check size={14} className="text-[var(--brand-500)]" /> 99.99% uptime SLA</div>
                  <div className="flex items-center gap-2"><Check size={14} className="text-[var(--brand-500)]" /> Dedicated VPC deployment</div>
                  <div className="flex items-center gap-2"><Check size={14} className="text-[var(--brand-500)]" /> 24/7 fraud ops phone hotline</div>
                </div>
              </div>
              <Button variant="secondary" size="sm" asChild className="w-full justify-center">
                <a href="mailto:support@flowshield.ai">Contact Sales</a>
              </Button>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          6.9 — DENSE FOOTER (3 Columns + Information Dense + System Status)
          ========================================================================= */}
      <footer className="bg-[var(--surface-page)] border-t border-[var(--border-default)] py-12 text-[12px] text-[var(--text-secondary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            
            {/* Col 1: Wordmark & Purpose */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Logo size={24} withContainer={false} />
                <span className="font-semibold text-[15px] text-[var(--text-primary)]">
                  FlowShield
                </span>
              </div>
              <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed max-w-xs">
                Real-time fraud prevention, automated chargeback defense, and dynamic 3DS intelligence engineered for high-volume merchants.
              </p>
            </div>

            {/* Col 2: Navigation Links */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                  Product
                </div>
                <ul className="space-y-1.5 text-[var(--text-secondary)]">
                  <li><a href="#features" className="hover:text-[var(--text-primary)] transition-colors">Risk Scoring</a></li>
                  <li><a href="#features" className="hover:text-[var(--text-primary)] transition-colors">Dispute Defense</a></li>
                  <li><a href="#features" className="hover:text-[var(--text-primary)] transition-colors">Rules Engine</a></li>
                  <li><Link to="/simulator" className="hover:text-[var(--text-primary)] transition-colors">Attack Simulator</Link></li>
                </ul>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                  Developers
                </div>
                <ul className="space-y-1.5 text-[var(--text-secondary)]">
                  <li><Link to="/docs" className="hover:text-[var(--text-primary)] transition-colors">API Reference</Link></li>
                  <li><Link to="/docs" className="hover:text-[var(--text-primary)] transition-colors">Webhooks</Link></li>
                  <li><Link to="/docs" className="hover:text-[var(--text-primary)] transition-colors">SDK Libraries</Link></li>
                  <li><Link to="/developers" className="hover:text-[var(--text-primary)] transition-colors">Dev Portal</Link></li>
                </ul>
              </div>
            </div>

            {/* Col 3: Compliance & Legal */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                Compliance & Legal
              </div>
              <ul className="space-y-1.5 text-[var(--text-secondary)]">
                <li><Link to="/privacy" className="hover:text-[var(--text-primary)] transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-[var(--text-primary)] transition-colors">Terms of Service</Link></li>
                <li><Link to="/security" className="hover:text-[var(--text-primary)] transition-colors">Security Policy</Link></li>
                <li><Link to="/dpa" className="hover:text-[var(--text-primary)] transition-colors">Data Processing Agreement</Link></li>
              </ul>
            </div>

          </div>

          <div className="pt-8 mt-8 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[var(--text-tertiary)] gap-4">
            <div>
              © {new Date().getFullYear()} FlowShield AI Inc. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
