import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  ChevronRight, 
  ArrowRight, 
  Menu, 
  X, 
  Terminal, 
  Sliders, 
  Activity, 
  ShieldCheck, 
  FileText, 
  Cpu, 
  Lock, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MotionDiv, MotionSection } from '@/components/ui/Motion';
import EnterpriseModal from '@/components/EnterpriseModal';
import { toast } from 'sonner';

// Simulated Real-time Transactions Feed for Hero Stream
interface StreamTx {
  id: string;
  amount: number;
  currency: string;
  merchant: string;
  score: number;
  decision: 'ALLOW' | 'REVIEW' | 'BLOCK';
  time: string;
}

const INITIAL_TRANSACTIONS: StreamTx[] = [
  { id: 'tx_998124', amount: 2450, currency: '₹', merchant: 'Blue Tokai Coffee', score: 0.04, decision: 'ALLOW', time: 'Just now' },
  { id: 'tx_998123', amount: 48900, currency: '₹', merchant: 'Croma Retail', score: 0.89, decision: 'BLOCK', time: '1s ago' },
  { id: 'tx_998122', amount: 1299, currency: '₹', merchant: 'Snitch Menswear', score: 0.12, decision: 'ALLOW', time: '2s ago' },
  { id: 'tx_998121', amount: 18500, currency: '₹', merchant: 'Nykaa Beauty', score: 0.58, decision: 'REVIEW', time: '4s ago' },
  { id: 'tx_998120', amount: 3400, currency: '₹', merchant: 'Boat Lifestyle', score: 0.08, decision: 'ALLOW', time: '6s ago' },
];

const NEW_POOL_TXS: StreamTx[] = [
  { id: 'tx_998129', amount: 15400, currency: '₹', merchant: 'Lenskart Vision', score: 0.05, decision: 'ALLOW', time: 'Just now' },
  { id: 'tx_998128', amount: 92000, currency: '₹', merchant: 'Apple Authorized', score: 0.94, decision: 'BLOCK', time: 'Just now' },
  { id: 'tx_998127', amount: 4200, currency: '₹', merchant: 'Urbanic Fashion', score: 0.62, decision: 'REVIEW', time: 'Just now' },
  { id: 'tx_998126', amount: 890, currency: '₹', merchant: 'Zepto Instant', score: 0.02, decision: 'ALLOW', time: 'Just now' },
  { id: 'tx_998125', amount: 27500, currency: '₹', merchant: 'Samsung Shop', score: 0.78, decision: 'BLOCK', time: 'Just now' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [isEnterpriseModalOpen, setIsEnterpriseModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Live Transaction Stream state
  const [txFeed, setTxFeed] = useState<StreamTx[]>(INITIAL_TRANSACTIONS);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Simulate live WebSocket stream arrival every 3.5s
  useEffect(() => {
    let poolIndex = 0;
    const interval = setInterval(() => {
      const nextTx = {
        ...NEW_POOL_TXS[poolIndex % NEW_POOL_TXS.length],
        id: `tx_${Math.floor(998000 + Math.random() * 2000)}`,
        time: 'Just now'
      };
      poolIndex++;
      setTxFeed((prev) => [nextTx, ...prev.slice(0, 4)]);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const featureTabs = [
    {
      id: 'disputes',
      title: 'Dispute Defense',
      headline: 'Autonomous Chargeback Representment',
      description: 'Automatically pull courier Proof-of-Delivery, order telemetry, and policy agreements to generate court-ready 4-page representment dossiers.',
      capabilities: [
        'Syncs directly with Razorpay, Cashfree, and PayU webhook events in real-time.',
        'Delhivery, BlueDart, and Shiprocket tracking extraction with signed receipt proof.',
        '94.2% historical dispute win rate across standard fraud reason codes.',
        'One-click automated dispute evidence upload to payment gateway endpoints.'
      ],
      terminalCode: `POST /v1/disputes/disp_9918skL90/represent
Content-Type: application/pdf
Authorization: Bearer sk_live_9f82a...

Evidence Docket Generated:
├── 1. Merchant Order & Invoice (Shopify #ORD-9918)
├── 2. Delhivery Air Waybill #DEL98871625 [DELIVERED]
├── 3. Signature Proof by 'Rahul S.' (12-07-2026)
└── 4. Terms of Service Acceptance Log

Status: AUTO_SUBMITTED_TO_GATEWAY (Win Probability: 95%)`
    },
    {
      id: 'fraud_api',
      title: 'Fraud Detection API',
      headline: 'Sub-45ms Real-Time Inference',
      description: 'Evaluate transaction risk at checkout before payments capture using an ensemble of Isolation Forest and XGBoost trained on Indian telemetry.',
      capabilities: [
        'Instant detection of residential VPNs, datacenter TOR nodes, and proxy cycling.',
        'Device fingerprint hashing across 14 million merchant browser profiles.',
        'Dynamic 3DS exemption recommendation engine to maximize checkout conversion.',
        'Zero impact on customer checkout UX with 43ms median response times.'
      ],
      terminalCode: `curl -X POST https://api.flowshield.ai/v1/radar/evaluate \\
  -H "Authorization: Bearer sk_live_9f82a..." \\
  -d '{
    "amount": 48900.00,
    "currency": "INR",
    "customer_ip": "103.241.12.89",
    "device_hash": "a8f9c1d2e3b4"
  }'

HTTP/2 200 OK
{
  "decision": "BLOCK",
  "risk_score": 0.89,
  "reasons": ["DATACENTER_PROXY", "VELOCITY_BURST"],
  "latency_ms": 38
}`
    },
    {
      id: 'rules',
      title: 'Rule Builder',
      headline: 'Precise Logical Control Engine',
      description: 'Enforce deterministic business policies alongside machine learning models with zero-code visual and JSON rule expressions.',
      capabilities: [
        'Block high-velocity card testing runs exceeding 3 attempts in 2 minutes.',
        'Force 3DS OTP step-up on high-ticket orders with mismatching BIN country.',
        'Fast-track verified repeat buyers to skip friction and reduce drop-offs.',
        'Simulate and backtest rule logic on your past 90 days of transactions.'
      ],
      terminalCode: `RULE: Block Datacenter Proxy Burst
IF:
  :risk_score: > 0.75 AND
  :is_vpn: == true AND
  :velocity_10m: > 5
THEN:
  ACTION: BLOCK
  REASON: "PROXY_VELOCITY_ATTACK"
  NOTIFY: SOC_SLACK_CHANNEL

Enforcement: 1,420 attacks intercepted this week.`
    },
    {
      id: 'intelligence',
      title: 'Intelligence Dashboard',
      headline: 'Security Operations Center Telemetry',
      description: 'Monitor live payment streams, analyze fraud patterns by geography and BIN, and triage manual dispute queues with audit logging.',
      capabilities: [
        'Real-time WebSocket telemetry stream with instant alert broadcast.',
        'Deep-dive audit logs with IP geolocation, ASN, and fingerprint data.',
        'Cohort dispute recovery tracking by gateway and product category.',
        'Role-based access control with granular API key permission scopes.'
      ],
      terminalCode: `SOC TELEMETRY STREAM ACTIVE
Ingestion: 1,240 events/sec | P99 Latency: 44ms
Active Gateways: Razorpay (99.98%), Cashfree (99.95%)

Live Risk Distribution:
  [■■■■■■■■■■■■■■■■■■■■] Safe (88.4%)
  [■■■                 ] Review (6.8%)
  [■■                  ] Blocked (4.8%)

Current System Status: ALL SYSTEMS OPERATIONAL`
    }
  ];

  return (
    <div className="min-h-screen bg-surface-100 text-text-primary selection:bg-cyan-500/20 selection:text-cyan-300 font-sans antialiased overflow-x-hidden">
      
      {/* =========================================================================
          1. NAVIGATION (56px Fixed)
          ========================================================================= */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 h-14 transition-all duration-normal ${
          scrolled
            ? 'bg-surface-100/85 border-b border-border-200 backdrop-blur-md shadow-sm'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Logo Wordmark (No generic icon / emoji) */}
          <Link to="/" className="flex items-center space-x-1 select-none">
            <span className="font-semibold text-base tracking-tight text-text-primary">Flowshield</span>
            <span className="text-cyan-500 font-bold text-base">/</span>
            <span className="font-semibold text-base tracking-tight text-text-primary">AI</span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-text-secondary">
            <a href="#features" className="hover:text-text-primary transition-colors">Product</a>
            <a href="#problem" className="hover:text-text-primary transition-colors">Solutions</a>
            <a href="#how-it-works" className="hover:text-text-primary transition-colors">Developers</a>
            <a href="#pricing" className="hover:text-text-primary transition-colors">Pricing</a>
          </nav>

          {/* Right Action CTAs */}
          <div className="hidden md:flex items-center space-x-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button variant="primary" size="sm" asChild>
              <Link to="/register">
                <span>Get started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-text-secondary hover:text-text-primary p-1.5 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border-200 bg-surface-200 px-4 py-4 space-y-3 animate-in fade-in duration-fast">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-text-secondary py-1.5">Product</a>
            <a href="#problem" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-text-secondary py-1.5">Solutions</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-text-secondary py-1.5">Developers</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-text-secondary py-1.5">Pricing</a>
            <div className="pt-2 flex flex-col space-y-2">
              <Button variant="secondary" size="sm" asChild className="w-full justify-center">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button variant="primary" size="sm" asChild className="w-full justify-center">
                <Link to="/register">Get started →</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          2. HERO SECTION (2-Column Left-Aligned, 55/45 Split)
          ========================================================================= */}
      <section className="relative pt-28 sm:pt-36 pb-20 sm:pb-28 overflow-hidden">
        
        {/* Subtle Radial Glow and 48px SVG Background Grid */}
        <div 
          className="absolute inset-0 pointer-events-none -z-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(148, 163, 184, 0.025) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(148, 163, 184, 0.025) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 10%, #000 60%, transparent 100%)'
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column (55% / 7 cols) */}
            <div className="lg:col-span-7 space-y-8 text-left">
              
              {/* Category Rule Badge */}
              <div className="flex items-center space-x-3">
                <span className="w-4 h-[2px] bg-cyan-500" />
                <span className="text-xs font-normal text-text-tertiary tracking-wide">
                  Real-time · AI-powered · Indian merchants
                </span>
              </div>

              {/* Strict Type Headline */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-[-0.04em] text-text-primary leading-[1.0] font-display">
                Stop Fraud.<br />
                Before It <span className="text-cyan-500">Costs</span> You.
              </h1>

              {/* Subheadline (Max 520px) */}
              <p className="max-w-[520px] text-base sm:text-lg text-text-secondary leading-[1.65] font-normal">
                Flowshield AI detects fraud and automates chargeback defense for merchants using Razorpay, Cashfree, and custom payment stacks. Real decisions in 43ms.
              </p>

              {/* Action CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button variant="primary" size="lg" asChild>
                  <Link to="/register">
                    <span>Start free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="lg" asChild>
                  <a href="#how-it-works" className="flex items-center gap-1.5">
                    <span>See how it works</span>
                    <span className="text-text-tertiary">↓</span>
                  </a>
                </Button>
              </div>

              {/* Trust Strip */}
              <div className="pt-6 border-t border-border-100 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-text-tertiary font-normal">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                  <span>No card required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                  <span>DPDP Act 2023 compliant</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Connect in 2 minutes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                  <span>94% detection accuracy</span>
                </div>
              </div>

            </div>

            {/* Right Column: Live Transaction Stream Panel (45% / 5 cols) */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="w-full max-w-[480px] bg-surface-300/80 border border-border-200 rounded-lg p-5 shadow-lg backdrop-blur-xl relative overflow-hidden">
                
                {/* Panel Header */}
                <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-border-200">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-allow opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-status-allow" />
                    </span>
                    <span className="type-label text-text-tertiary">Live Transactions</span>
                  </div>
                  <span className="font-mono text-xs text-text-tertiary font-medium">43ms avg</span>
                </div>

                {/* Animated Transaction Rows */}
                <div className="space-y-2.5 min-h-[380px]">
                  <AnimatePresence initial={false}>
                    {txFeed.map((tx) => {
                      const isBlock = tx.decision === 'BLOCK';
                      const isReview = tx.decision === 'REVIEW';
                      const riskPercent = Math.round(tx.score * 100);

                      return (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, y: -16, filter: 'blur(4px)' }}
                          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          exit={{ opacity: 0, y: 16, transition: { duration: 0.2 } }}
                          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                          className="bg-surface-200/90 border border-border-100 rounded-sm p-3 space-y-2 relative hover:border-border-300 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-text-tertiary">{tx.id}</span>
                                <span className="text-xs text-text-tertiary">·</span>
                                <span className="text-xs text-text-secondary truncate max-w-[140px]">{tx.merchant}</span>
                              </div>
                              <div className="font-sans font-semibold text-sm text-text-primary">
                                {tx.currency}{tx.amount.toLocaleString('en-IN')}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] text-text-tertiary">{tx.score.toFixed(2)}</span>
                              <Badge variant={isBlock ? 'block' : isReview ? 'review' : 'allow'} size="sm">
                                {tx.decision}
                              </Badge>
                            </div>
                          </div>

                          {/* Thin 3-Phase Risk Progress Bar */}
                          <div className="w-full bg-surface-500 h-1 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                isBlock ? 'bg-status-block' : isReview ? 'bg-status-review' : 'bg-status-allow'
                              }`}
                              style={{ width: `${riskPercent}%` }}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                <div className="pt-3 mt-3 border-t border-border-100 flex items-center justify-between text-[11px] font-mono text-text-tertiary">
                  <span>Ensemble: XGBoost + MVIForest</span>
                  <span className="text-cyan-400">● 100% Intercept Active</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          3. SOCIAL PROOF STRIP (Immediate After Fold)
          ========================================================================= */}
      <section className="border-t border-b border-border-200 bg-surface-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border-200 gap-6 md:gap-0">
            
            <div className="text-center md:px-6 py-2">
              <div className="text-3xl font-bold font-sans tracking-tight text-text-primary">94%</div>
              <div className="type-label text-text-tertiary mt-1">Detection Accuracy</div>
            </div>

            <div className="text-center md:px-6 py-2">
              <div className="text-3xl font-bold font-sans tracking-tight text-text-primary">43ms</div>
              <div className="type-label text-text-tertiary mt-1">Evaluation Latency</div>
            </div>

            <div className="text-center md:px-6 py-2">
              <div className="text-3xl font-bold font-sans tracking-tight text-text-primary">₹0</div>
              <div className="type-label text-text-tertiary mt-1">To Start Free</div>
            </div>

            <div className="text-center md:px-6 py-2">
              <div className="text-3xl font-bold font-sans tracking-tight text-text-primary">250k+</div>
              <div className="type-label text-text-tertiary mt-1">Transactions Analyzed</div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          4. PROBLEM SECTION (2-Column Data Visualization)
          ========================================================================= */}
      <section id="problem" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 mb-16">
          <span className="type-label text-cyan-500">The Problem</span>
          <h2 className="type-h1 text-text-primary">
            Why Indian merchants lose winnable chargebacks.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Framing */}
          <div className="lg:col-span-5 space-y-6">
            <p className="type-body-lg text-text-secondary">
              Indian merchants lose over <strong className="text-text-primary">₹12,000 per dispute</strong> they could have easily won — simply by not knowing what evidence banks require, or missing the strict 10-day representment deadline.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-status-block mt-2 flex-shrink-0" />
                <p className="text-sm text-text-tertiary">
                  Manual screenshot collection takes an average of 4.5 hours per incident.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-status-block mt-2 flex-shrink-0" />
                <p className="text-sm text-text-tertiary">
                  68% of merchant dispute responses are rejected due to improper PDF formatting.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-status-block mt-2 flex-shrink-0" />
                <p className="text-sm text-text-tertiary">
                  Card networks penalize merchants with dispute ratios above 0.9% with higher gateway fees.
                </p>
              </div>
            </div>
          </div>

          {/* Right Data Visualization: Failure Path Timeline */}
          <div className="lg:col-span-7 bg-surface-300 border border-border-200 rounded-lg p-6 sm:p-8">
            <div className="space-y-6 relative before:absolute before:left-[15px] before:top-3 before:bottom-3 before:w-[2px] before:bg-border-200">
              
              <div className="relative flex items-center gap-4 pl-8">
                <span className="absolute left-3 w-2 h-2 rounded-full bg-text-tertiary -translate-x-1/2" />
                <div className="flex-1 flex justify-between items-center text-sm">
                  <span className="font-semibold text-text-primary">Day 1: Dispute received via gateway webhook</span>
                  <span className="font-mono text-xs text-text-tertiary">10d left</span>
                </div>
              </div>

              <div className="relative flex items-center gap-4 pl-8">
                <span className="absolute left-3 w-2 h-2 rounded-full bg-text-tertiary -translate-x-1/2" />
                <div className="flex-1 flex justify-between items-center text-sm">
                  <span className="text-text-secondary">Day 3: Merchant unaware, buried in email inbox</span>
                  <span className="font-mono text-xs text-text-tertiary">7d left</span>
                </div>
              </div>

              <div className="relative flex items-center gap-4 pl-8">
                <span className="absolute left-3 w-2 h-2 rounded-full bg-status-review -translate-x-1/2" />
                <div className="flex-1 flex justify-between items-center text-sm">
                  <span className="text-status-review font-medium">Day 7: Critical evidence submission deadline approaching</span>
                  <span className="font-mono text-xs text-status-review">3d left</span>
                </div>
              </div>

              {/* Highlighted Deadline Missed Node */}
              <div className="relative flex items-center gap-4 pl-8 bg-status-block/[0.06] border border-status-block/20 rounded-sm p-3.5 -ml-3">
                <span className="absolute left-6 w-3 h-3 rounded-full bg-status-block -translate-x-1/2 animate-pulse" />
                <div className="flex-1 flex justify-between items-center text-sm pl-3">
                  <span className="font-bold text-status-block">Day 10: DEADLINE MISSED — Gateway auto-forfeits claim</span>
                  <span className="font-mono text-xs text-status-block font-bold">0d remaining</span>
                </div>
              </div>

              <div className="relative flex items-center gap-4 pl-8">
                <span className="absolute left-3 w-2 h-2 rounded-full bg-status-block -translate-x-1/2" />
                <div className="flex-1 flex justify-between items-center text-sm">
                  <span className="text-text-tertiary">Day 14: ₹12,000 deducted + ₹1,500 dispute penalty fee assessed</span>
                  <span className="font-mono text-xs text-status-block">Lost</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          5. PRODUCT FEATURES (Tabbed System)
          ========================================================================= */}
      <section id="features" className="py-24 border-t border-border-200 bg-surface-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="space-y-4 mb-16">
            <span className="type-label text-cyan-500">The Solution</span>
            <h2 className="type-h1 text-text-primary">
              Built for high-volume Indian commerce.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Tabs (280px / 4 cols) */}
            <div className="lg:col-span-4 space-y-1.5">
              {featureTabs.map((tab, idx) => {
                const isActive = activeTab === idx;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(idx)}
                    className={`w-full text-left p-4 rounded-sm transition-all duration-fast flex items-center justify-between ${
                      isActive
                        ? 'bg-surface-400 text-text-primary border-l-2 border-cyan-500 shadow-sm'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-300/60'
                    }`}
                  >
                    <span className="font-semibold text-sm">{tab.title}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'text-cyan-400 translate-x-0.5' : 'text-text-tertiary'}`} />
                  </button>
                );
              })}
            </div>

            {/* Right Active Tab Content Panel */}
            <div className="lg:col-span-8 bg-surface-300 border border-border-200 rounded-lg p-6 sm:p-8 min-h-[440px] flex flex-col justify-between">
              <AnimatePresence mode="wait">
                <motion.div
                  key={featureTabs[activeTab].id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="type-h2 text-text-primary mb-2">
                      {featureTabs[activeTab].headline}
                    </h3>
                    <p className="type-body text-text-secondary max-w-2xl">
                      {featureTabs[activeTab].description}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {featureTabs[activeTab].capabilities.map((cap, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                        <Check className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>

                  {/* Terminal Display Inset Card */}
                  <div className="bg-surface-100 border border-border-100 rounded-sm p-4 font-mono text-xs text-text-secondary overflow-x-auto">
                    <pre className="leading-relaxed"><code>{featureTabs[activeTab].terminalCode}</code></pre>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="pt-6 border-t border-border-100 flex items-center justify-between">
                <Link to="/docs" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors">
                  <span>Explore technical documentation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
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
          6. HOW IT WORKS (3-Step Horizontal Flow)
          ========================================================================= */}
      <section id="how-it-works" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 mb-16">
          <span className="type-label text-cyan-500">Implementation</span>
          <h2 className="type-h1 text-text-primary">
            From setup to automated defense in 2 minutes.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          
          {/* Step 1 */}
          <div className="bg-surface-300 border border-border-200 rounded-lg p-6 space-y-4 relative">
            <div className="text-4xl font-extrabold font-sans text-text-tertiary">01</div>
            <h3 className="type-h3 text-text-primary">Connect your gateway in 2 minutes</h3>
            <p className="type-sm text-text-secondary leading-relaxed">
              Paste your Razorpay or Cashfree API key. Disputes and transaction feeds sync automatically with zero manual configuration.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-surface-300 border border-border-200 rounded-lg p-6 space-y-4 relative">
            <div className="text-4xl font-extrabold font-sans text-text-tertiary">02</div>
            <h3 className="type-h3 text-text-primary">Evidence gathered automatically</h3>
            <p className="type-sm text-text-secondary leading-relaxed">
              Order items, Delhivery/BlueDart tracking receipts, and customer device telemetry are pulled instantly from your store logs.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-surface-300 border border-border-200 rounded-lg p-6 space-y-4 relative">
            <div className="text-4xl font-extrabold font-sans text-text-tertiary">03</div>
            <h3 className="type-h3 text-text-primary">Download and win the dispute</h3>
            <p className="type-sm text-text-secondary leading-relaxed">
              Court-grade PDF response formatted exactly how payment processors expect. Generated and submitted in under 5 seconds.
            </p>
          </div>

        </div>
      </section>

      {/* =========================================================================
          7. PRICING (4 Tiers with Elevated Growth Card & 20% Annual Toggle)
          ========================================================================= */}
      <section id="pricing" className="py-24 border-t border-border-200 bg-surface-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="type-label text-cyan-500">Transparent Capacity</span>
            <h2 className="type-h1 text-text-primary">
              Pay for what you evaluate. Scale seamlessly.
            </h2>
            <p className="type-sm text-text-secondary">
              Every plan includes real-time webhook ingestion, ML fraud scoring, and automated dispute defense dossiers.
            </p>

            {/* Annual Billing Switcher */}
            <div className="inline-flex items-center gap-3 bg-surface-300 border border-border-200 p-1 rounded-sm mt-4">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-3 py-1 text-xs font-semibold rounded-xs transition-colors ${
                  !isAnnual ? 'bg-cyan-500 text-surface-000' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-3 py-1 text-xs font-semibold rounded-xs transition-colors ${
                  isAnnual ? 'bg-cyan-500 text-surface-000' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Annual (save 20%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            
            {/* Tier 1: Free */}
            <Card variant="data" padding="md" className="flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="type-h3 text-text-primary">Free Sandbox</h3>
                  <p className="type-sm text-text-tertiary mt-1">For testing integrations</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold font-sans text-text-primary">₹0</span>
                  <span className="text-xs text-text-tertiary">/month</span>
                </div>
                <div className="border-t border-border-100 pt-4 space-y-2.5 text-xs text-text-secondary">
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> 1,000 evaluations / mo</div>
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> 3 dispute templates / mo</div>
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> Core fraud risk score</div>
                  <div className="flex items-center gap-2 text-text-tertiary"><span className="w-3.5 text-center">—</span> Automated Razorpay sync</div>
                  <div className="flex items-center gap-2 text-text-tertiary"><span className="w-3.5 text-center">—</span> Courier proof extraction</div>
                </div>
              </div>
              <Button variant="secondary" size="md" asChild className="w-full justify-center">
                <Link to="/register">Start free</Link>
              </Button>
            </Card>

            {/* Tier 2: Starter */}
            <Card variant="data" padding="md" className="flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="type-h3 text-text-primary">Starter</h3>
                  <p className="type-sm text-text-tertiary mt-1">For growing D2C brands</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold font-sans text-text-primary">
                    {isAnnual ? '₹399' : '₹499'}
                  </span>
                  <span className="text-xs text-text-tertiary">/month</span>
                </div>
                <div className="border-t border-border-100 pt-4 space-y-2.5 text-xs text-text-secondary">
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> 10,000 evaluations / mo</div>
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> 10 dispute dossiers / mo</div>
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> Automated Razorpay sync</div>
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> Real-time webhook triage</div>
                  <div className="flex items-center gap-2 text-text-tertiary"><span className="w-3.5 text-center">—</span> Courier tracking validation</div>
                </div>
              </div>
              <Button variant="secondary" size="md" asChild className="w-full justify-center">
                <Link to="/login">Start Starter</Link>
              </Button>
            </Card>

            {/* Tier 3: Growth (Most Popular Elevated) */}
            <div className="relative">
              <div className="text-center mb-2">
                <span className="type-label text-cyan-400 text-[10px] bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-sm">
                  Most popular
                </span>
              </div>
              <Card variant="data" padding="md" className="flex flex-col justify-between space-y-6 border-cyan-500/40 shadow-glow-cyan h-[calc(100%-28px)]">
                <div className="space-y-4">
                  <div>
                    <h3 className="type-h3 text-text-primary">Growth</h3>
                    <p className="type-sm text-text-tertiary mt-1">For scaling commerce teams</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold font-sans text-cyan-400">
                      {isAnnual ? '₹1,199' : '₹1,499'}
                    </span>
                    <span className="text-xs text-text-tertiary">/month</span>
                  </div>
                  <div className="border-t border-border-100 pt-4 space-y-2.5 text-xs text-text-secondary">
                    <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> 50,000 evaluations / mo</div>
                    <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> 50 dispute dossiers / mo</div>
                    <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> Shopify order telemetry</div>
                    <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> Courier tracking validation</div>
                    <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> Custom rule editor</div>
                  </div>
                </div>
                <Button variant="primary" size="md" asChild className="w-full justify-center">
                  <Link to="/login">Start Growth</Link>
                </Button>
              </Card>
            </div>

            {/* Tier 4: Enterprise */}
            <Card variant="data" padding="md" className="flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="type-h3 text-text-primary">Enterprise</h3>
                  <p className="type-sm text-text-tertiary mt-1">For fintechs & aggregators</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold font-sans text-text-primary">
                    {isAnnual ? '₹3,999' : '₹4,999'}
                  </span>
                  <span className="text-xs text-text-tertiary">/month</span>
                </div>
                <div className="border-t border-border-100 pt-4 space-y-2.5 text-xs text-text-secondary">
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> Unlimited evaluations</div>
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> Unlimited dispute dockets</div>
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> Dedicated VPC cluster</div>
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> Priority 99.98% SLA</div>
                  <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> Bank representment team</div>
                </div>
              </div>
              <Button variant="secondary" size="md" onClick={() => setIsEnterpriseModalOpen(true)} className="w-full justify-center">
                Contact sales
              </Button>
            </Card>

          </div>

        </div>
      </section>

      {/* =========================================================================
          8. FOOTER (3 Columns + Information Dense)
          ========================================================================= */}
      <footer className="border-t border-border-200 bg-surface-100 py-16 text-text-secondary text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* Col 1: Wordmark & Core Identity */}
          <div className="space-y-3">
            <div className="flex items-center space-x-1">
              <span className="font-semibold text-base tracking-tight text-text-primary">Flowshield</span>
              <span className="text-cyan-500 font-bold text-base">/</span>
              <span className="font-semibold text-base tracking-tight text-text-primary">AI</span>
            </div>
            <p className="text-text-tertiary leading-relaxed max-w-sm">
              Real-time payment fraud prevention, dynamic 3DS exemption, and automated dispute defense engineered for Indian fintechs and merchants.
            </p>
          </div>

          {/* Col 2: Platform Links */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <span className="type-label text-text-primary block">Platform</span>
              <ul className="space-y-1.5 text-text-tertiary">
                <li><a href="#features" className="hover:text-text-primary transition-colors">Dispute Defense</a></li>
                <li><a href="#features" className="hover:text-text-primary transition-colors">Fraud Detection API</a></li>
                <li><a href="#features" className="hover:text-text-primary transition-colors">Rule Builder</a></li>
                <li><a href="#pricing" className="hover:text-text-primary transition-colors">Capacity Pricing</a></li>
              </ul>
            </div>
            <div className="space-y-2.5">
              <span className="type-label text-text-primary block">Developers</span>
              <ul className="space-y-1.5 text-text-tertiary">
                <li><Link to="/docs" className="hover:text-text-primary transition-colors">API Reference</Link></li>
                <li><Link to="/docs" className="hover:text-text-primary transition-colors">Webhook Specs</Link></li>
                <li><Link to="/docs" className="hover:text-text-primary transition-colors">Python SDK</Link></li>
                <li><Link to="/docs" className="hover:text-text-primary transition-colors">Node.js Library</Link></li>
              </ul>
            </div>
          </div>

          {/* Col 3: Compliance & Contact */}
          <div className="space-y-3">
            <span className="type-label text-text-primary block">Compliance & Legal</span>
            <div className="space-y-1.5 text-text-tertiary">
              <div>DPDP Act 2023 Compliant</div>
              <div>PCI-DSS Level 1 Compliant Architecture</div>
              <div>RBI / NPCI Gateway Integration Standards</div>
            </div>
            <div className="pt-2 flex items-center space-x-4 text-text-tertiary">
              <Link to="/privacy" className="hover:text-text-primary transition-colors">Privacy</Link>
              <span>·</span>
              <Link to="/terms" className="hover:text-text-primary transition-colors">Terms</Link>
              <span>·</span>
              <Link to="/security" className="hover:text-text-primary transition-colors">Security</Link>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-12 border-t border-border-100 flex flex-col sm:flex-row items-center justify-between text-text-tertiary text-[11px] font-mono gap-4">
          <div>© {new Date().getFullYear()} Flowshield AI Inc. All rights reserved.</div>
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-status-allow" />
            <span>Systems Normal (ap-south-1)</span>
          </div>
        </div>
      </footer>

      <EnterpriseModal 
        isOpen={isEnterpriseModalOpen} 
        onClose={() => setIsEnterpriseModalOpen(false)} 
      />
    </div>
  );
}
