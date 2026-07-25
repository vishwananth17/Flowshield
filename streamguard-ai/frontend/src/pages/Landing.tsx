import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  BarChart3, 
  CheckCircle2,
  ArrowRight,
  Globe,
  X,
  CreditCard,
  Building2,
  ShieldCheck,
  MessageSquare,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/services/api';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import ProductVideoSection from '@/components/ProductVideoSection';
import EnterpriseModal from '@/components/EnterpriseModal';
import Logo from '@/components/Logo';

export default function Landing() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [isEnterpriseModalOpen, setIsEnterpriseModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleWaitlistManual = async () => {
    if (!email) {
      toast.error("Please enter an email first!");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/waitlist', { email });
      setIsJoined(true);
      toast.success("Welcome to the waitlist!");
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || "Failed to join waitlist.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const plans = [
    {
      name: 'Free',
      id: 'free',
      price: 0,
      requests: '3 Disputes / mo',
      description: 'Starter',
      features: ['3 dispute submissions / mo', 'Manual document uploads', 'Basic tracking'],
      missing: ['Automated gateway gathering', 'Order matching validation', 'Real-time risk scoring'],
      cta: 'Start Free',
      badge: null
    },
    {
      name: 'Starter',
      id: 'basic',
      price: 499,
      requests: '10 Disputes / mo',
      description: 'Basic',
      features: ['10 disputes / mo', 'Automated Razorpay gathering', 'Evidence templates'],
      missing: ['Order matching validation', 'Real-time risk scoring'],
      cta: 'Start Starter',
      badge: null
    },
    {
      name: 'Growth',
      id: 'standard',
      price: 1499,
      requests: '50 Disputes / mo',
      description: 'Standard',
      badge: 'MOST POPULAR',
      features: ['50 disputes / mo', 'Shopify order matching', 'Courier tracking validation'],
      missing: ['Real-time risk scoring'],
      cta: 'Start Growth',
    },
    {
      name: 'Enterprise',
      id: 'premium',
      price: 4999,
      requests: 'Unlimited',
      description: 'Premium',
      badge: 'ENTERPRISE',
      features: ['Unlimited disputes', 'Real-time risk scoring', 'Priority bank representation'],
      missing: [],
      cta: 'Contact Sales',
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#10B981] selection:text-black overflow-x-hidden font-body">
      
      {/* Top Header */}
      <nav className="sticky top-0 z-50 bg-[#0A110F] text-white border-b border-[var(--border-primary)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <Logo size={32} iconSize={18} theme="light" showText={true} />
          </Link>
          
          <div className="hidden md:flex items-center space-x-8 text-xs font-semibold tracking-wider uppercase text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link to="/developers" className="hover:text-white transition-colors">Developers</Link>
            <Link to="/docs" className="hover:text-white transition-colors">Documentation</Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors">
              Log in
            </Link>
            <Button asChild size="sm" className="bg-white text-black hover:bg-zinc-200 rounded font-bold px-5 h-9">
              <Link to="/register">Get access</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-[#0A110F] text-white pt-16 md:pt-24 pb-20 md:pb-28 px-6 border-b border-[var(--border-primary)]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Headlines */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center gap-2 border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-1 rounded text-xs font-mono uppercase tracking-wider text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
              Active Fraud Prevention
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-white">
              Real-time transaction risk evaluation.
            </h1>

            <p className="text-sm md:text-base text-zinc-400 max-w-xl font-normal leading-relaxed">
              Flowshield monitors merchant checkouts, extracts telemetry signals, and automatically submits evidence dockets to resolve disputes.
            </p>

            {/* CTAs */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              {!isJoined ? (
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                  <Input 
                    type="email" 
                    placeholder="Enter work email" 
                    className="bg-black border-[var(--border-primary)] h-12 rounded text-white placeholder:text-zinc-600 font-medium focus-visible:ring-white" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button onClick={handleWaitlistManual} className="bg-white text-black hover:bg-zinc-200 h-12 px-6 rounded font-bold whitespace-nowrap">
                    {isSubmitting ? 'Processing...' : 'Request access →'}
                  </Button>
                </div>
              ) : (
                <div className="text-white font-bold bg-[#101B18] border border-[var(--border-primary)] py-3 px-6 rounded text-xs uppercase tracking-wider">
                  Request received. An onboarding specialist will contact you shortly.
                </div>
              )}

              <div className="flex items-center gap-3 w-full pt-2">
                <Button 
                  onClick={() => document.getElementById('product-tour')?.scrollIntoView({ behavior: 'smooth' })}
                  variant="outline" 
                  className="border-[var(--border-primary)] hover:bg-zinc-900 text-white h-11 px-5 rounded font-bold flex items-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-white text-white" />
                  Watch 60s Demo
                </Button>
                <Button asChild variant="ghost" className="text-zinc-400 hover:text-white h-11 px-4 font-bold">
                  <Link to="/register" className="flex items-center gap-1">
                    Console Sign-up <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Right Hero Graphic Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-5 bg-zinc-950 border border-zinc-900 rounded-lg p-8 relative overflow-hidden shadow-sm"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                <div className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-500">System Telemetry</div>
                <div className="flex items-center gap-2 text-xs font-bold text-white bg-zinc-900 px-3 py-1 rounded border border-zinc-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Monitoring
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-black border border-zinc-900 p-4 rounded flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono text-zinc-500 uppercase">Checkout Telemetry</div>
                    <div className="text-sm font-extrabold text-white mt-0.5">UPI Collect • ₹45,000</div>
                  </div>
                  <span className="text-xs font-mono font-bold bg-zinc-900 text-white px-2.5 py-1 rounded border border-zinc-800">PASS</span>
                </div>

                <div className="bg-black border border-zinc-900 p-4 rounded flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono text-zinc-500 uppercase">Risk Evaluation</div>
                    <div className="text-sm font-extrabold text-white mt-0.5">XGBoost Classifiers</div>
                  </div>
                  <span className="text-xs font-mono font-bold bg-zinc-900 text-[#10B981] px-2.5 py-1 rounded border border-zinc-800">0.030% FBR</span>
                </div>

                <div className="bg-black border border-zinc-900 p-4 rounded flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono text-zinc-500 uppercase">Evidence Submission</div>
                    <div className="text-sm font-extrabold text-white mt-0.5">Automated Evidence Compilation</div>
                  </div>
                  <span className="text-xs font-mono font-bold bg-zinc-900 text-white px-2.5 py-1 rounded border border-zinc-800">WON 94.2%</span>
                </div>
              </div>

              <div className="pt-2 text-center text-xs font-mono text-zinc-500 border-t border-zinc-900">
                Evaluation pipeline running on merchant gateway telemetry.
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* --- SYSTEM PIPELINE SECTION --- */}
      <section className="py-20 md:py-28 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 bg-zinc-900 border border-zinc-800 px-4 py-1.5 rounded">
            TRANSACTION EVALUATION
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-6">
            Transaction Risk Evaluation
          </h2>
          <p className="text-zinc-400 text-sm max-w-xl mx-auto mt-4">
            Flowshield parses raw incoming payloads, engineers velocity features, and evaluates risk levels.
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-8 items-center">
          
          {/* Left: Input Nodes */}
          <div className="md:col-span-3 space-y-4">
            <div className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2">Checkout Fields</div>
            <NeuralNode icon={<CreditCard className="w-4 h-4 text-white" />} label="Card Payload" sub="Amount, BIN, MCC" />
            <NeuralNode icon={<Globe className="w-4 h-4 text-white" />} label="Geographic Coordinates" sub="IP, Location Distance" />
            <NeuralNode icon={<Zap className="w-4 h-4 text-white" />} label="Velocity Features" sub="Transaction Frequency" />
          </div>

          {/* Center: Core */}
          <div className="md:col-span-6 flex justify-center py-6">
            <div className="w-full max-w-md bg-zinc-950 border border-zinc-900 rounded p-8 text-center space-y-6">
              <div className="text-xs font-mono uppercase font-bold tracking-widest text-zinc-400 border-b border-zinc-900 pb-3">
                Core Risk Models
              </div>
              <div className="space-y-3 font-mono text-xs">
                <div className="bg-zinc-900 border border-zinc-800 px-4 py-3 rounded text-zinc-300">
                  LAYER 1 — ANOMALY CLASSIFICATION
                </div>
                <div className="bg-zinc-900 border border-zinc-800 px-4 py-3 rounded text-zinc-300">
                  LAYER 2 — ENSEMBLE PREDICTIONS
                </div>
                <div className="bg-white text-black font-extrabold px-4 py-3 rounded">
                  LAYER 3 — RISK RULES PIPELINE
                </div>
              </div>
              <div className="text-[11px] font-mono text-zinc-500">
                100% Target Recall • 0.030% False Block Rate
              </div>
            </div>
          </div>

          {/* Right: Output Nodes */}
          <div className="md:col-span-3 space-y-4">
            <div className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2">System Integrations</div>
            <NeuralNode icon={<Building2 className="w-4 h-4 text-white" />} label="Gateway Ledger" sub="Settlement Updates" />
            <NeuralNode icon={<ShieldCheck className="w-4 h-4 text-white" />} label="Risk Dashboard" sub="Triage Alerts" />
            <NeuralNode icon={<BarChart3 className="w-4 h-4 text-white" />} label="Dispute Evidence" sub="Automated Submissions" />
          </div>

        </div>
      </section>

      {/* --- PLATFORM DEMO: 60 SEC WALKTHROUGH --- */}
      <section id="product-tour" className="py-20 md:py-28 px-6 border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 bg-zinc-900 border border-zinc-800 px-4 py-1.5 rounded">
            DEMO SIMULATION
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-6">
            60-Second Walkthrough
          </h2>
          <p className="text-zinc-400 text-sm max-w-xl mx-auto mt-3">
            Watch the evaluation pipeline gather order details, submit shipping logs, and update dispute statuses automatically.
          </p>
        </div>

        <InteractiveWalkthrough />
      </section>

      {/* Video Section */}
      <ProductVideoSection />

      {/* Features Grid */}
      <section id="features" className="py-20 md:py-28 px-6 max-w-7xl mx-auto border-t border-zinc-900">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Built for Enterprise Merchant Pipelines</h2>
          <p className="text-zinc-400 text-sm max-w-xl mx-auto mt-4">Automated evidence compilation and transaction risk control.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            title="Automated Evidence Compilation" 
            icon={<Zap className="w-5 h-5 text-white" />} 
            desc="Connect WooCommerce, Razorpay, or Cashfree to automatically fetch order invoices, courier delivery status, and tracking logs." 
          />
          <FeatureCard 
            title="Gateway Deadline Notifications" 
            icon={<BarChart3 className="w-5 h-5 text-white" />} 
            desc="Keep track of payment gateway dispute windows. Receive alerts 7, 3, and 1 day before the evidence response window closes." 
          />
          <FeatureCard 
            title="Structured PDF Exports" 
            icon={<CreditCard className="w-5 h-5 text-white" />} 
            desc="Generate PDF dispute response documents formatted directly according to NPCI, Visa, and Mastercard rules." 
          />
        </div>
      </section>

      {/* Pricing Matrix */}
      <section id="pricing" className="py-20 md:py-28 px-6 max-w-7xl mx-auto border-t border-zinc-900 bg-zinc-950">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">Choose Your Plan</h2>
          <div className="flex items-center justify-center space-x-4">
            <span className={`text-xs font-mono font-bold ${!isAnnual ? 'text-white' : 'text-zinc-500'}`}>Monthly</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-12 h-6 bg-zinc-900 border border-zinc-800 rounded-full relative transition-all"
            >
              <motion.div 
                animate={{ x: isAnnual ? 24 : 0 }}
                className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
              />
            </button>
            <span className={`text-xs font-mono font-bold flex items-center ${isAnnual ? 'text-white' : 'text-zinc-500'}`}>
              Annual <span className="ml-2 text-[10px] bg-white text-black px-2 py-0.5 rounded font-black uppercase">Save 20%</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p) => (
            <PricingCard 
              key={p.name} 
              {...p} 
              isAnnual={isAnnual} 
              onEnterprise={() => setIsEnterpriseModalOpen(true)}
              onSelect={() => navigate(`/register?plan=${p.id}`)}
            />
          ))}
        </div>
      </section>

      <EnterpriseModal isOpen={isEnterpriseModalOpen} onClose={() => setIsEnterpriseModalOpen(false)} />

      {/* Footer */}
      <footer className="border-t border-zinc-900 pt-16 pb-12 px-6 bg-black">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Logo size={28} iconSize={16} theme="dark" showText={true} />
            </div>
            <p className="text-zinc-500 text-xs leading-relaxed max-w-xs">
              Transaction risk scoring and automated chargeback resolution logs.
            </p>
          </div>
          
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">Platform</h4>
            <ul className="space-y-3 text-xs font-medium text-zinc-400">
              <li><a href="#features" className="hover:text-white transition-colors">Risk Scoring</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Get Access</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">Developers</h4>
            <ul className="space-y-3 text-xs font-medium text-zinc-400">
              <li><Link to="/developers" className="hover:text-white transition-colors">Integration Keys</Link></li>
              <li><Link to="/docs" className="hover:text-white transition-colors">API Docs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">Legal</h4>
            <ul className="space-y-3 text-xs font-medium text-zinc-400">
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600 font-mono tracking-wider">
            © 2026 FLOWSHIELD \ ALL RIGHTS RESERVED
          </p>
          <div className="flex items-center space-x-5 text-zinc-500">
            <Globe className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
            <MessageSquare className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
          </div>
        </div>
      </footer>
    </div>
  );
}

function PricingCard({ name, id, price, requests, features, missing, cta, badge, isAnnual, onEnterprise, onSelect }: any) {
  const isSelected = id === 'standard';
  const isEnterprise = id === 'premium';
  const isFree = id === 'free';

  return (
    <div className={`p-8 rounded border flex flex-col h-full relative transition-all ${
      isSelected 
        ? 'bg-zinc-950 border-white shadow-sm' 
        : 'bg-zinc-950 border-zinc-900'
    }`}>
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-white text-black border border-zinc-300">
          {badge}
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="text-sm font-bold uppercase tracking-tight text-white mb-2">{name}</h3>
        <div className="flex items-baseline space-x-1 mb-1">
          <span className="text-3xl font-extrabold tracking-tight">₹{price.toLocaleString()}</span>
          {!isFree && <span className="text-zinc-500 text-xs">/mo</span>}
        </div>
        {!isFree && isAnnual && (
          <div className="text-[10px] text-zinc-400 font-mono mb-3">Billed annually</div>
        )}
        <div className="text-xs font-mono bg-zinc-900 border border-zinc-800 px-3 py-1 rounded w-fit text-zinc-300">
          {requests}
        </div>
      </div>

      <ul className="space-y-3 mb-8 flex-grow">
        {features.map((f: string) => (
          <li key={f} className="flex items-start text-xs text-zinc-300">
            <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0 text-white" />
            <span>{f}</span>
          </li>
        ))}
        {missing.map((f: string) => (
          <li key={f} className="flex items-start text-xs text-zinc-600 line-through">
            <X className="w-4 h-4 mr-2 flex-shrink-0 text-zinc-700" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <Button 
        onClick={isEnterprise ? onEnterprise : onSelect}
        className={`w-full py-5 rounded font-bold text-xs uppercase transition-all ${
          isSelected 
            ? 'bg-white text-black hover:bg-zinc-200' 
            : 'bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-800'
        }`}
      >
        {cta}
      </Button>
    </div>
  );
}

function FeatureCard({ title, icon, desc }: any) {
  return (
    <div className="bg-zinc-950 border border-zinc-900 p-8 rounded hover:border-zinc-800 transition-colors">
      <div className="w-10 h-10 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-base font-bold text-white mb-2">{title}</h3>
      <p className="text-zinc-400 text-xs leading-relaxed">{desc}</p>
    </div>
  );
}

function NeuralNode({ icon, label, sub }: any) {
  return (
    <div className="bg-zinc-950 border border-zinc-900 p-4 rounded flex items-center gap-3.5 hover:border-zinc-800 transition-colors">
      <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-xs font-bold text-white">{label}</div>
        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{sub}</div>
      </div>
    </div>
  );
}

const WALKTHROUGH_STEPS = [
  {
    title: "1. Transaction Analysis",
    duration: 15,
    subtitle: "Evaluating customer checkout signatures.",
    details: [
      { label: "IP Address", value: "103.241.12.89 (Bangalore, IN)", status: "safe" },
      { label: "Payment Channel", value: "UPI Collect Request", status: "review" },
      { label: "Velocity Check", value: "3 checkouts under 2 mins", status: "danger" }
    ],
    statusMessage: "Evaluating signatures...",
    phaseMessage: "System flagged velocity: Risk score 0.82 (Flagged for Review)"
  },
  {
    title: "2. Dispute Received",
    duration: 15,
    subtitle: "Customer files claim: 'Product Not Received'.",
    details: [
      { label: "Gateway Ref", value: "disp_9918skL90", status: "neutral" },
      { label: "Reason Code", value: "Product not received", status: "danger" },
      { label: "Deadline", value: "7 days remaining", status: "warning" }
    ],
    statusMessage: "Validating webhook...",
    phaseMessage: "Webhook validated. Initializing dispute log #disp_9918."
  },
  {
    title: "3. Evidence Compilation",
    duration: 15,
    subtitle: "Flowshield queries store courier and tracking logs.",
    details: [
      { label: "Shopify Check", value: "Order #ORD-9918 matches customer email", status: "safe" },
      { label: "Delhivery Status", value: "Shipment DEL98871625: DELIVERED", status: "safe" },
      { label: "Delivery Proof", value: "Signed by 'Rahul S.' on 12-07-2026", status: "safe" }
    ],
    statusMessage: "Matching tracking references...",
    phaseMessage: "Evidence compilation complete. 95/100 (Strong delivery proof found)."
  },
  {
    title: "4. Submission & Resolution",
    duration: 15,
    subtitle: "Uploading compiled PDF evidence document to gateway.",
    details: [
      { label: "Evidence PDF", value: "Cover, Courier Tracking, Order Details", status: "safe" },
      { label: "Submission", value: "Auto-uploaded to Razorpay API", status: "safe" },
      { label: "Final Status", value: "DISPUTE WON (Funds Returned)", status: "safe" }
    ],
    statusMessage: "Uploading PDF evidence...",
    phaseMessage: "Chargeback successfully won and reversed! Win rate updated to 94.2%."
  }
];

function InteractiveWalkthrough() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentTime((prevTime) => {
          if (prevTime >= 59) {
            setIsPlaying(false);
            return 60;
          }
          const nextTime = prevTime + 1;
          const stepIndex = Math.min(Math.floor(nextTime / 15), 3);
          setActiveStepIndex(stepIndex);
          return nextTime;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const handlePlayPause = () => {
    if (currentTime >= 60) {
      setCurrentTime(0);
      setActiveStepIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setActiveStepIndex(0);
  };

  const progressPercentage = (currentTime / 60) * 100;
  const currentStep = WALKTHROUGH_STEPS[activeStepIndex];

  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded overflow-hidden max-w-4xl mx-auto text-left shadow-sm">
      <div className="p-6 md:p-8 border-b border-zinc-900 relative">
        {!isPlaying && currentTime === 0 && (
          <div 
            onClick={handlePlayPause}
            className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center cursor-pointer z-20 hover:bg-black/60 transition-colors"
          >
            <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center font-bold shadow-md hover:scale-105 transition-transform">
              <Play className="h-6 w-6 fill-current ml-0.5" />
            </div>
            <span className="text-xs font-bold text-white mt-4 uppercase tracking-widest">
              Play Interactive Walkthrough
            </span>
          </div>
        )}

        <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-6">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Live Pipeline Stream
            </span>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            00:{currentTime.toString().padStart(2, '0')} / 00:60
          </span>
        </div>

        <div className="space-y-4 max-w-xl mx-auto bg-zinc-900 border border-zinc-800 rounded p-6">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-tight">
              {currentStep.title}
            </h4>
            <p className="text-xs text-zinc-400 mt-1">{currentStep.subtitle}</p>
          </div>

          <div className="space-y-2 border-t border-zinc-800 pt-3">
            {currentStep.details.map((detail, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs font-mono">
                <span className="text-zinc-500">{detail.label}:</span>
                <span className="font-medium text-white bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded">
                  {detail.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-zinc-300 font-mono">
            <span className="text-zinc-500 mr-2">[00:{currentTime.toString().padStart(2, '0')}]</span>
            {currentStep.phaseMessage}
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-black px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button 
            type="button"
            onClick={handlePlayPause}
            className="flex items-center space-x-2 bg-white text-black hover:bg-zinc-200 font-bold px-4 py-2 rounded text-xs uppercase tracking-wider transition-colors"
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{currentTime >= 60 ? 'Replay' : 'Play'}</span>
              </>
            )}
          </button>
          
          <button 
            type="button"
            onClick={handleReset}
            className="flex items-center space-x-1.5 border border-zinc-900 bg-transparent text-zinc-400 hover:text-white px-3 py-2 rounded text-xs transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>

        <div className="flex-1 max-w-xs w-full flex items-center space-x-3">
          <div className="flex-1 bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
            <div 
              className="bg-white h-full transition-all duration-300 ease-linear"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {Math.round(progressPercentage)}%
          </span>
        </div>
      </div>
    </div>
  );
}
