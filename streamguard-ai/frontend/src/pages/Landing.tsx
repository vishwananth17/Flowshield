import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  BarChart3, 
  Lock, 
  CheckCircle2,
  ArrowRight,
  Globe,
  X,
  CreditCard,
  Building2,
  ShieldCheck,
  MessageSquare,
  Code,
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
      toast.success("Welcome to the front of the line!");
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
      features: ['3 dispute templates / mo', 'Manual evidence uploads', 'Core tracking'],
      missing: ['Automated Razorpay gathering', 'Shopify order matching', 'ML fraud risk matching'],
      cta: 'Start Free',
      badge: null
    },
    {
      name: 'Starter',
      id: 'basic',
      price: 499,
      requests: '10 Disputes / mo',
      description: 'Basic',
      features: ['10 disputes / mo', 'Automated Razorpay gathering', 'Template builders'],
      missing: ['Shopify order matching', 'ML fraud risk matching'],
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
      missing: ['ML fraud risk matching'],
      cta: 'Start Growth',
    },
    {
      name: 'Enterprise',
      id: 'premium',
      price: 4999,
      requests: 'Unlimited',
      description: 'Premium',
      badge: 'ENTERPRISE',
      features: ['Unlimited disputes', 'ML fraud risk matching', 'Priority bank representation'],
      missing: [],
      cta: 'Contact Sales',
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black overflow-x-hidden font-body">
      
      {/* Editorial Top Navigation Header */}
      <nav className="sticky top-0 z-50 bg-white text-black border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <Logo size={32} iconSize={18} theme="light" showText={true} />
          </Link>
          
          <div className="hidden md:flex items-center space-x-8 text-sm font-semibold tracking-tight text-zinc-700">
            <a href="#features" className="hover:text-black transition-colors">Features</a>
            <a href="#pricing" className="hover:text-black transition-colors">Pricing</a>
            <Link to="/developers" className="hover:text-black transition-colors">Developers</Link>
            <Link to="/docs" className="hover:text-black transition-colors">Documentation</Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-sm font-semibold text-zinc-700 hover:text-black transition-colors">
              Log in
            </Link>
            <Button asChild size="sm" className="bg-black text-white hover:bg-zinc-800 rounded-md font-bold px-5 h-9">
              <Link to="/register">Get access</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Editorial Hero Section — Inspired by TIFIN.ai */}
      <section className="bg-white text-black pt-16 md:pt-24 pb-20 md:pb-28 px-6 border-b border-zinc-200">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Headlines */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center gap-2 border border-zinc-300 bg-zinc-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-zinc-700">
              <span className="w-2 h-2 rounded-full bg-black"></span>
              Autonomous Fraud Defense
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-black">
              Real-time fraud defense's agentic era has arrived.
            </h1>

            <p className="text-lg md:text-xl text-zinc-600 max-w-xl font-normal leading-relaxed">
              One platform. Shared context. Coordinated ML agents. Flowshield AI defends payment transactions and resolves chargeback disputes automatically.
            </p>

            {/* CTAs */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              {!isJoined ? (
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                  <Input 
                    type="email" 
                    placeholder="Enter work email" 
                    className="bg-zinc-50 border-zinc-300 h-12 rounded-md text-black placeholder:text-zinc-400 font-medium focus-visible:ring-black" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button onClick={handleWaitlistManual} className="bg-black text-white hover:bg-zinc-800 h-12 px-6 rounded-md font-bold whitespace-nowrap">
                    {isSubmitting ? 'Processing...' : 'Request access →'}
                  </Button>
                </div>
              ) : (
                <div className="text-black font-bold bg-zinc-100 border border-zinc-300 py-3 px-6 rounded-md text-sm">
                  Welcome to the front of the line! We will contact you shortly.
                </div>
              )}

              <div className="flex items-center gap-3 w-full pt-2">
                <Button 
                  onClick={() => document.getElementById('product-tour')?.scrollIntoView({ behavior: 'smooth' })}
                  variant="outline" 
                  className="border-zinc-300 hover:bg-zinc-100 text-black h-11 px-5 rounded-md font-bold flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-black text-black" />
                  Watch 60s Demo
                </Button>
                <Button asChild variant="ghost" className="text-zinc-600 hover:text-black h-11 px-4 font-bold">
                  <Link to="/register" className="flex items-center gap-1">
                    Direct Console Sign-up <ArrowRight className="w-4 h-4" />
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
            className="lg:col-span-5 bg-[#F4F4F6] border border-zinc-300 rounded-xl p-8 relative overflow-hidden shadow-sm"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-300 pb-4">
                <div className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-500">Live Agent Hub</div>
                <div className="flex items-center gap-2 text-xs font-bold text-black bg-white px-3 py-1 rounded border border-zinc-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Engine Active
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-white border border-zinc-200 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-zinc-500 uppercase">Checkout Telemetry</div>
                    <div className="text-sm font-extrabold text-black mt-0.5">UPI Collect • ₹45,000</div>
                  </div>
                  <span className="text-xs font-mono font-bold bg-zinc-100 text-black px-2.5 py-1 rounded border border-zinc-300">PASS</span>
                </div>

                <div className="bg-white border border-zinc-200 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-zinc-500 uppercase">Fraud Detection</div>
                    <div className="text-sm font-extrabold text-black mt-0.5">Model B • Haversine Anomaly</div>
                  </div>
                  <span className="text-xs font-mono font-bold bg-black text-white px-2.5 py-1 rounded">0.030% FBR</span>
                </div>

                <div className="bg-white border border-zinc-200 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-zinc-500 uppercase">Chargeback Resolution</div>
                    <div className="text-sm font-extrabold text-black mt-0.5">Auto-compiled PDF Docket</div>
                  </div>
                  <span className="text-xs font-mono font-bold bg-zinc-100 text-black px-2.5 py-1 rounded border border-zinc-300">WON 94.2%</span>
                </div>
              </div>

              <div className="pt-2 text-center text-xs font-semibold text-zinc-500 border-t border-zinc-300">
                Coordinated ML models analyzing merchant traffic in real time.
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* --- SYSTEM ARCHITECTURE SECTION --- */}
      <section className="py-20 md:py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-500 bg-zinc-900 border border-zinc-800 px-4 py-1.5 rounded-full">
            SYSTEM ARCHITECTURE
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-6">
            The Forensic Engine in Motion
          </h2>
          <p className="text-zinc-400 text-base max-w-2xl mx-auto mt-4">
            Structured pipeline normalization, vector feature extraction, and deterministic hard rules running in under 100ms.
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-8 items-center">
          
          {/* Left: Input Nodes */}
          <div className="md:col-span-3 space-y-4">
            <div className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2">Unstructured Inputs</div>
            <NeuralNode icon={<CreditCard className="w-4 h-4 text-white" />} label="Card Payload" sub="Amount, BIN, MCC" />
            <NeuralNode icon={<Globe className="w-4 h-4 text-white" />} label="Geographic Signals" sub="IP, Haversine Distance" />
            <NeuralNode icon={<Zap className="w-4 h-4 text-white" />} label="Velocity Signals" sub="TX Frequency & Batching" />
          </div>

          {/* Center: Engine Core */}
          <div className="md:col-span-6 flex justify-center py-6">
            <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl p-8 text-center space-y-6">
              <div className="text-xs font-mono uppercase font-bold tracking-widest text-zinc-400 border-b border-zinc-800 pb-3">
                Flowshield Core Ensemble
              </div>
              <div className="space-y-3">
                <div className="bg-zinc-900 border border-zinc-700 px-4 py-3 rounded-md text-xs font-bold tracking-wide">
                  LAYER 1 — MVIFOREST ANOMALY DETECTOR
                </div>
                <div className="bg-zinc-900 border border-zinc-700 px-4 py-3 rounded-md text-xs font-bold tracking-wide">
                  LAYER 2 — DUAL XGBOOST MODELS A & B
                </div>
                <div className="bg-white text-black font-bold px-4 py-3 rounded-md text-xs tracking-wide">
                  LAYER 3 — HARD OVERRIDE RULES
                </div>
              </div>
              <div className="text-[11px] font-mono text-zinc-500">
                100% Target Fraud Recall • 0.030% False Block Rate
              </div>
            </div>
          </div>

          {/* Right: Output Nodes */}
          <div className="md:col-span-3 space-y-4">
            <div className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2">Structured Outputs</div>
            <NeuralNode icon={<Building2 className="w-4 h-4 text-white" />} label="ERP & Gateway" sub="Settlement Ledger" />
            <NeuralNode icon={<ShieldCheck className="w-4 h-4 text-white" />} label="Risk Dashboard" sub="Forensic Analysis" />
            <NeuralNode icon={<BarChart3 className="w-4 h-4 text-white" />} label="PDF Dossier" sub="Auto Chargeback Defense" />
          </div>

        </div>
      </section>

      {/* --- PLATFORM DEMO: 60 SEC WALKTHROUGH --- */}
      <section id="product-tour" className="py-20 md:py-28 px-6 border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 bg-zinc-900 border border-zinc-800 px-4 py-1.5 rounded-full">
            INTERACTIVE DEMO
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-6">
            60-Second Product Tour
          </h2>
          <p className="text-zinc-400 text-sm max-w-2xl mx-auto mt-3">
            Watch the autonomous fraud engine analyze checkouts, flag signals, query shipping logs, and generate court-grade dispute packages.
          </p>
        </div>

        <InteractiveWalkthrough />
      </section>

      {/* Video Component */}
      <ProductVideoSection />

      {/* Features Grid */}
      <section id="features" className="py-20 md:py-28 px-6 max-w-7xl mx-auto border-t border-zinc-900">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Built for High-Volume Commerce</h2>
          <p className="text-zinc-400 text-base max-w-xl mx-auto mt-4">Automated evidence compilation and enterprise fraud defenses.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            title="Automated Evidence Gathering" 
            icon={<Zap className="w-5 h-5 text-white" />} 
            desc="Connect Razorpay, Cashfree, or WooCommerce to pull courier tracking numbers, delivery signatures, and order invoices in real time." 
          />
          <FeatureCard 
            title="Urgency Countdown Alerts" 
            icon={<BarChart3 className="w-5 h-5 text-white" />} 
            desc="Never miss a payment gateway deadline. Receive notifications 7, 3, and 1 day before the dispute response window closes." 
          />
          <FeatureCard 
            title="Court-Grade PDF Package" 
            icon={<CreditCard className="w-5 h-5 text-white" />} 
            desc="Generate PDF response packages formatted directly according to Visa, Mastercard, and NPCI chargeback guidelines." 
          />
        </div>
      </section>

      {/* Pricing Matrix */}
      <section id="pricing" className="py-20 md:py-28 px-6 max-w-7xl mx-auto border-t border-zinc-900 bg-zinc-950">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">Transparent Pricing</h2>
          <div className="flex items-center justify-center space-x-4">
            <span className={`text-sm font-bold ${!isAnnual ? 'text-white' : 'text-zinc-500'}`}>Monthly</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-12 h-6 bg-zinc-800 border border-zinc-700 rounded-full relative transition-all"
            >
              <motion.div 
                animate={{ x: isAnnual ? 24 : 0 }}
                className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
              />
            </button>
            <span className={`text-sm font-bold flex items-center ${isAnnual ? 'text-white' : 'text-zinc-500'}`}>
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

      {/* Stark Footer */}
      <footer className="border-t border-zinc-900 pt-16 pb-12 px-6 bg-black">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Logo size={28} iconSize={16} theme="dark" showText={true} />
            </div>
            <p className="text-zinc-500 text-xs leading-relaxed max-w-xs">
              Unified fraud detection and automated chargeback defense SaaS for merchants and fintechs.
            </p>
          </div>
          
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">Platform</h4>
            <ul className="space-y-3 text-xs font-medium text-zinc-400">
              <li><a href="#features" className="hover:text-white transition-colors">Forensic Engine</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing Tiers</a></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Get Access</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">Developers</h4>
            <ul className="space-y-3 text-xs font-medium text-zinc-400">
              <li><Link to="/developers" className="hover:text-white transition-colors">Developer Portal</Link></li>
              <li><Link to="/docs" className="hover:text-white transition-colors">API Documentation</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">Legal</h4>
            <ul className="space-y-3 text-xs font-medium text-zinc-400">
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/security" className="hover:text-white transition-colors">Security Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600 font-mono tracking-wider">
            © 2026 FLOWSHIELD AI \ ALL RIGHTS RESERVED
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
    <div className={`p-8 rounded-xl border flex flex-col h-full relative transition-all ${
      isSelected 
        ? 'bg-zinc-950 border-white shadow-sm' 
        : 'bg-zinc-950 border-zinc-800'
    }`}>
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest bg-white text-black border border-zinc-300">
          {badge}
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="text-lg font-bold uppercase tracking-tight text-white mb-2">{name}</h3>
        <div className="flex items-baseline space-x-1 mb-1">
          <span className="text-3xl font-extrabold tracking-tight">₹{price.toLocaleString()}</span>
          {!isFree && <span className="text-zinc-500 text-xs">/mo</span>}
        </div>
        {!isFree && isAnnual && (
          <div className="text-[11px] text-zinc-400 font-medium mb-3">Billed annually</div>
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
        className={`w-full py-5 rounded-md font-bold text-xs uppercase transition-all ${
          isSelected 
            ? 'bg-white text-black hover:bg-zinc-200' 
            : 'bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-700'
        }`}
      >
        {cta}
      </Button>
    </div>
  );
}

function FeatureCard({ title, icon, desc }: any) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-xl hover:border-zinc-700 transition-colors">
      <div className="w-10 h-10 rounded-md bg-zinc-900 border border-zinc-700 flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-zinc-400 text-xs leading-relaxed">{desc}</p>
    </div>
  );
}

function NeuralNode({ icon, label, sub }: any) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex items-center gap-3.5 hover:border-zinc-600 transition-colors">
      <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center flex-shrink-0">
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
    title: "1. Real-time Checkout Evaluation",
    duration: 15,
    subtitle: "Coordinated ML Engine processing telemetry.",
    details: [
      { label: "IP Address", value: "103.241.12.89 (Bangalore, IN)", status: "safe" },
      { label: "Payment Channel", value: "UPI Collect Request", status: "review" },
      { label: "Velocity Check", value: "3 checkouts under 2 mins", status: "danger" }
    ],
    statusMessage: "Evaluating transaction signatures...",
    phaseMessage: "Engine flagged high velocity: Risk score 0.82 (Flagged for Review)"
  },
  {
    title: "2. Chargeback Dispute Created",
    duration: 15,
    subtitle: "Customer files dispute claiming: 'Product Not Received'.",
    details: [
      { label: "Gateway Ref", value: "disp_9918skL90", status: "neutral" },
      { label: "Reason Code", value: "Product not received", status: "danger" },
      { label: "Deadline", value: "7 days remaining", status: "warning" }
    ],
    statusMessage: "Intercepting Razorpay webhook...",
    phaseMessage: "Webhook validated. Initializing automated evidence docket #disp_9918."
  },
  {
    title: "3. Autonomous Evidence Gathering",
    duration: 15,
    subtitle: "Flowshield queries connected store and courier logs.",
    details: [
      { label: "Shopify Matching", value: "Order #ORD-9918 matches customer email", status: "safe" },
      { label: "Delhivery Express", value: "Shipment DEL98871625: DELIVERED", status: "safe" },
      { label: "Delivery Proof", value: "Signed by 'Rahul S.' on 12-07-2026", status: "safe" }
    ],
    statusMessage: "Matching order against tracking numbers...",
    phaseMessage: "Evidence Score computed: 95/100 (Strong delivery proof found)."
  },
  {
    title: "4. Court-Grade PDF Compiled & Won",
    duration: 15,
    subtitle: "Compiling branded PDF docket and auto-submitting to gateway.",
    details: [
      { label: "Docket Pages", value: "Cover, Ledger, Courier Logs, Return Policy", status: "safe" },
      { label: "Submission", value: "Auto-uploaded to Razorpay API", status: "safe" },
      { label: "Final Status", value: "DISPUTE WON (Funds Returned)", status: "safe" }
    ],
    statusMessage: "Compiling PDF dossier...",
    phaseMessage: "Chargeback successfully defended and reversed! Win rate updated to 94.2%."
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
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden max-w-4xl mx-auto text-left shadow-sm">
      <div className="p-6 md:p-8 border-b border-zinc-800 relative">
        {!isPlaying && currentTime === 0 && (
          <div 
            onClick={handlePlayPause}
            className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center cursor-pointer z-20 hover:bg-black/60 transition-colors"
          >
            <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center font-bold shadow-md hover:scale-105 transition-transform">
              <Play className="h-6 w-6 fill-current ml-0.5" />
            </div>
            <span className="text-xs font-bold text-white mt-4 uppercase tracking-widest">
              Play Interactive Demo
            </span>
          </div>
        )}

        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Live Simulation Feed
            </span>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            00:{currentTime.toString().padStart(2, '0')} / 00:60
          </span>
        </div>

        <div className="space-y-4 max-w-xl mx-auto bg-zinc-900 border border-zinc-800 rounded-lg p-6">
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
            className="flex items-center space-x-1.5 border border-zinc-800 bg-transparent text-zinc-400 hover:text-white px-3 py-2 rounded text-xs transition-colors"
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
