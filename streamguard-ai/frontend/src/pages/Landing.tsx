import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  BarChart3, 
  ChevronRight, 
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
      requests: '3 Disputes',
      description: 'Starter',
      features: ['3 dispute templates / mo', 'Manual evidence uploads', 'Core tracking'],
      missing: ['Automated Razorpay gathering', 'Shopify order matching', 'ML fraud risk matching'],
      cta: 'Start Free — No Card Required',
      badge: null,
      color: 'gray'
    },
    {
      name: 'Starter',
      id: 'basic',
      price: 499,
      requests: '10 Disputes',
      description: 'Basic',
      features: ['10 disputes / mo', 'Automated Razorpay gathering', 'Template builders'],
      missing: ['Shopify order matching', 'ML fraud risk matching'],
      cta: 'Start Starter',
      badge: null,
      color: 'blue'
    },
    {
      name: 'Growth',
      id: 'standard',
      price: 1499,
      requests: '50 Disputes',
      description: 'Standard',
      badge: 'MOST POPULAR',
      features: ['50 disputes / mo', 'Shopify order matching', 'Courier tracking validation'],
      missing: ['ML fraud risk matching'],
      cta: 'Start Growth — Most Popular',
      color: 'emerald'
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
      color: 'purple'
    }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 selection:bg-blue-500/30 overflow-x-hidden">
      {/* Nav */}
      <nav className="relative z-50 flex items-center justify-between px-4 md:px-6 py-6 max-w-7xl mx-auto backdrop-blur-md sticky top-0 border-b border-white/5 bg-black/50">
        <div className="flex items-center space-x-3">
          <Logo size={36} iconSize={20} theme="dark" />
          <span className="text-lg md:text-xl font-bold tracking-tight">Flowshield AI</span>
        </div>
        <div className="hidden lg:flex items-center space-x-8 text-sm font-medium text-slate-400">
          <a href="#features" className="hover:text-blue-400 transition-colors">Features</a>
          <a href="#pricing" className="hover:text-blue-400 transition-colors">Pricing</a>
          <Link to="/developers" className="hover:text-blue-400 transition-colors">Developers</Link>
          <Link to="/docs" className="hover:text-blue-400 transition-colors">Documentation</Link>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
          <Link to="/login" className="text-xs md:text-sm font-medium text-slate-400 hover:text-white transition-colors">Log in</Link>
          <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-500 rounded-full font-bold shadow-lg shadow-blue-500/20 px-4 md:px-6">
            <Link to="/register">Register</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-12 md:pt-20 pb-20 md:pb-32 px-4 md:px-6 max-w-7xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <span className="text-blue-500 font-black tracking-widest text-[10px] uppercase mb-4 block">Recover lost revenue today</span>
          <h1 className="text-4xl md:text-8xl font-black tracking-tighter mb-6 md:mb-8 leading-[1.0] md:leading-[0.9]">
            Automated Dispute & <br />
            <span className="text-blue-500">Chargeback Defense</span>
          </h1>
          <p className="max-w-2xl mx-auto text-base md:text-lg text-slate-400 mb-8 md:mb-12">
            Flowshield AI connects to Razorpay, Cashfree, and Shopify to compile proof of delivery,
            generate PDF response packages, and auto-submit disputes to win chargebacks.
          </p>
          {!isJoined ? (
            <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
              <Input 
                type="email" 
                placeholder="Enter work email" 
                className="bg-white/5 border-white/10 h-12 md:h-14 rounded-2xl" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={handleWaitlistManual} className="bg-white text-black hover:bg-slate-200 h-12 md:h-14 px-8 rounded-2xl font-black whitespace-nowrap">
                {isSubmitting ? '...' : 'Join Waitlist'}
              </Button>
            </div>
          ) : (
            <div className="text-emerald-400 font-bold bg-emerald-400/10 py-3 px-6 rounded-2xl inline-block">
              Welcome! You're on the list.
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Button asChild variant="outline" className="border-white/10 hover:bg-white/5 text-slate-400 hover:text-white h-12 px-8 rounded-xl font-bold bg-slate-900/50 backdrop-blur-sm">
              <Link to="/register" className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-400" />
                Get Started Now
              </Link>
            </Button>
            <Button asChild variant="ghost" className="text-slate-500 hover:text-white h-12 px-8 rounded-xl font-bold">
              <Link to="/developers" className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                Developer Oracle
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* --- HOW IT WORKS: THE NEURAL TRAFFIC HUB --- */}
      <section className="py-16 md:py-32 px-6 max-w-6xl mx-auto relative overflow-hidden">
        <div className="text-center mb-8 md:mb-20">
          <span className="text-indigo-400 font-bold tracking-widest text-[9px] uppercase bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20">System Architecture</span>
          <h2 className="text-3xl md:text-5xl font-black mt-6 tracking-tight">The Forensic Engine in Motion</h2>
        </div>

        <div className="grid md:grid-cols-12 gap-8 items-center relative">
          
          {/* DATA SWARM SVG LAYER */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="none">
              <defs>
                <linearGradient id="swarm-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
                  <stop offset="50%" stopColor="#6366f1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Paths from Left to Center */}
              <motion.path d="M 150 100 Q 250 100 350 200" stroke="url(#swarm-grad)" strokeWidth="0.5" fill="none" />
              <motion.path d="M 150 200 Q 250 200 350 200" stroke="url(#swarm-grad)" strokeWidth="0.5" fill="none" />
              <motion.path d="M 150 300 Q 250 300 350 200" stroke="url(#swarm-grad)" strokeWidth="0.5" fill="none" />

              {/* Paths from Center to Right */}
              <motion.path d="M 450 200 Q 550 100 650 100" stroke="url(#swarm-grad)" strokeWidth="0.5" fill="none" />
              <motion.path d="M 450 200 Q 550 200 650 200" stroke="url(#swarm-grad)" strokeWidth="0.5" fill="none" />
              <motion.path d="M 450 200 Q 550 300 650 300" stroke="url(#swarm-grad)" strokeWidth="0.5" fill="none" />

              {/* Data Swarms */}
              {[0, 1, 2, 4].map((i) => (
                <motion.circle
                  key={`swarm-${i}`}
                  r="2"
                  fill="#6366f1"
                  initial={{ offsetDistance: "0%" }}
                  animate={{ offsetDistance: "100%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: i*0.5 }}
                  style={{ offsetPath: `path('M 150 ${100 + (i%3)*100} Q 250 ${100 + (i%3)*100} 350 200')` }}
                  className="shadow-[0_0_10px_#6366f1]"
                />
              ))}

              {[3, 5, 6].map((i) => (
                <motion.circle
                  key={`swarm-out-${i}`}
                  r="2"
                  fill="#818cf8"
                  initial={{ offsetDistance: "0%" }}
                  animate={{ offsetDistance: "100%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: i*0.5 }}
                  style={{ offsetPath: `path('M 450 200 Q 550 ${100 + (i%3)*100} 650 ${100 + (i%3)*100}')` }}
                  className="shadow-[0_0_10px_#818cf8]"
                />
              ))}
            </svg>
          </div>

          {/* LEFT: RAW DATA INPUTS */}
          <div className="md:col-span-3 space-y-6 relative z-10">
            <div className="text-sm md:text-[10px] font-black tracking-widest text-slate-500 uppercase mb-4 text-center">Unstructured Data</div>
            <NeuralNode icon={<CreditCard className="w-5 h-5 text-indigo-400" />} label="Card Payload" sub="Amount, BIN, Currency" />
            <NeuralNode icon={<Globe className="w-5 h-5 text-indigo-400" />} label="Geographic Data" sub="IP, VPN, Proxy Signals" />
            <NeuralNode icon={<Zap className="w-5 h-5 text-indigo-400" />} label="Velocity Signals" sub="TX Frequency & Batching" />
          </div>

          {/* MIDDLE: PROCESSING ENGINE */}
          <div className="md:col-span-6 flex justify-center py-12 relative z-10">
            <div className="relative w-80 h-80 flex items-center justify-center">
              {/* Spinning Rings */}
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }} className="absolute inset-0 border border-dashed border-indigo-500/20 rounded-full" />
              <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 30, ease: "linear" }} className="absolute inset-6 border border-white/5 rounded-full" />
              
              {/* Center Core */}
              <div className="relative bg-slate-950 border border-indigo-500/40 w-52 h-52 rounded-full flex flex-col items-center justify-center space-y-4 shadow-[0_0_50px_rgba(99,102,241,0.2)] text-center p-6">
                <div className="text-[10px] uppercase font-black tracking-widest text-indigo-400">Zenith Engine</div>
                <div className="space-y-2 w-full">
                  <div className="bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-xl text-[10px] font-bold">NORMALIZE</div>
                  <div className="bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-xl text-[10px] font-bold">VECTORIZE</div>
                  <div className="bg-indigo-500/20 border border-indigo-500/40 px-4 py-2 rounded-xl text-[10px] font-bold shadow-[0_0_15px_rgba(99,102,241,0.1)]">DECIDE</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: STRUCTURED SYSTEMS */}
          <div className="md:col-span-3 space-y-6 relative z-10">
            <div className="text-sm md:text-[10px] font-black tracking-widest text-slate-500 uppercase mb-4 text-center">Structured Systems</div>
            <NeuralNode icon={<Building2 className="w-5 h-5" />} label="ERP / Finance" sub="Settlement Ledger" color="text-indigo-400" />
            <NeuralNode icon={<ShieldCheck className="w-5 h-5" />} label="Risk Dashboard" sub="Forensic Visualization" color="text-emerald-400" />
            <NeuralNode icon={<BarChart3 className="w-5 h-5" />} label="Audit Ledger" sub="Immutible Compliance" color="text-blue-400" />
          </div>

        </div>
      </section>

      {/* --- PLATFORM DEMO: 60 SEC WALKTHROUGH --- */}
      <section className="py-16 md:py-24 px-6 max-w-6xl mx-auto text-center border-t border-white/5 relative">
        <div className="mb-12">
          <span className="text-blue-500 font-bold tracking-widest text-[9px] uppercase bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20">Product Tour</span>
          <h2 className="text-3xl md:text-5xl font-black mt-6 tracking-tight">60-Second Walkthrough</h2>
          <p className="max-w-2xl mx-auto text-sm text-slate-400 mt-4 leading-relaxed">
            Experience Flowshield in action. Click play below to watch the autonomous fraud intelligence engine analyze a checkout, detect anomaly signals, query shipping logs, and defend a chargeback dispute.
          </p>
        </div>

        <InteractiveWalkthrough />
      </section>

      {/* Features */}
      <section id="features" className="py-12 md:py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard title="Automated Evidence Compilation" icon={<Zap className="text-blue-500" />} desc="Connect Shopify, Razorpay, or custom APIs to pull order confirmations, Delhivery courier receipts, and delivery confirmations in real-time." />
            <FeatureCard title="Urgency Countdown Reminders" icon={<BarChart3 className="text-emerald-500" />} desc="Never miss a gateway deadline. Automatically receive email alerts 7, 3, and 1 day before the dispute review cycle expires." />
            <FeatureCard title="ReportLab PDF Defense Packages" icon={<CreditCard className="text-indigo-500" />} desc="Download professional, branded, court-grade PDF defense portfolios compiled according to card association guidelines." />
        </div>
      </section>

      {/* Pricing Toggle */}
      <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-6">Choose Your Plan</h2>
          <div className="flex items-center justify-center space-x-4">
            <span className={`text-sm font-bold ${!isAnnual ? 'text-white' : 'text-slate-500'}`}>Monthly</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-12 h-6 bg-blue-600 rounded-full relative transition-all"
            >
              <motion.div 
                animate={{ x: isAnnual ? 24 : 0 }}
                className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
              />
            </button>
            <span className={`text-sm font-bold flex items-center ${isAnnual ? 'text-white' : 'text-slate-500'}`}>
              Annual <span className="ml-2 text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded uppercase font-black">Save 20%</span>
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
      <footer className="border-t border-white/5 pt-20 pb-12 px-6 bg-[#01040a]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <Logo size={32} iconSize={18} theme="dark" />
              <span className="font-bold tracking-tight">Flowshield AI</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed max-w-[200px]">
              Autonomous fraud intelligence for high-volume commerce and fintech platforms.
            </p>
          </div>
          
          <div>
            <h4 className="text-white text-xs font-black uppercase tracking-widest mb-6">Protocol</h4>
            <ul className="space-y-4 text-xs font-medium text-slate-500">
              <li><a href="#features" className="hover:text-blue-400 transition-colors">Forensic Engine</a></li>
              <li><a href="#pricing" className="hover:text-blue-400 transition-colors">Pricing Tiers</a></li>
              <li><Link to="/register" className="hover:text-blue-400 transition-colors">Institutional Access</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-xs font-black uppercase tracking-widest mb-6">Developers</h4>
            <ul className="space-y-4 text-xs font-medium text-slate-500">
              <li><Link to="/developers" className="hover:text-blue-400 transition-colors">Developer Oracle</Link></li>
              <li><Link to="/docs" className="hover:text-blue-400 transition-colors">API Reference</Link></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">System Status</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-xs font-black uppercase tracking-widest mb-6">Legal</h4>
            <ul className="space-y-4 text-xs font-medium text-slate-500">
              <li><Link to="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
              <li><Link to="/dpa" className="hover:text-blue-400 transition-colors">Data Processing Agreement</Link></li>
              <li><Link to="/sla" className="hover:text-blue-400 transition-colors">Service Level Agreement</Link></li>
              <li><Link to="/cookies" className="hover:text-blue-400 transition-colors">Cookie Policy</Link></li>
              <li><Link to="/security" className="hover:text-blue-400 transition-colors">Security Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:row items-center justify-between gap-4">
          <p className="text-[10px] text-slate-600 font-mono tracking-widest uppercase">
            © 2026 FLOWSHIELD AI \ DEPLOYED ON RENDER \ ALL RIGHTS RESERVED
          </p>
          <div className="flex items-center space-x-6 text-slate-600">
            <Globe className="w-4 h-4 hover:text-white transition-colors cursor-pointer" />
            <MessageSquare className="w-4 h-4 hover:text-white transition-colors cursor-pointer" />
            <ArrowRight className="w-4 h-4 hover:text-white transition-colors cursor-pointer" />
          </div>
        </div>
      </footer>
    </div>
  );
}

function PricingCard({ name, id, price, requests, features, missing, cta, badge, color, isAnnual, onEnterprise, onSelect }: any) {
  const isSelected = id === 'standard';
  const isEnterprise = id === 'premium';
  const isFree = id === 'free';

  const getBtnStyle = () => {
    if (id === 'free') return 'bg-transparent border border-white/10 hover:bg-white/5';
    if (id === 'basic') return 'bg-blue-600 hover:bg-blue-500 text-white';
    if (id === 'standard') return 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105';
    if (id === 'premium') return 'bg-purple-600 hover:bg-purple-500 text-white';
    return '';
  };

  const getBgStyle = () => {
    if (id === 'standard') return 'bg-[#1E3A5F] border-[#3B82F6] border-2';
    if (id === 'premium') return 'bg-[#1A1040] border-[#8B5CF6]';
    return 'bg-[#111827] border-[#1F2937]';
  };

  return (
    <div className={`p-8 rounded-[2rem] border transition-all duration-300 flex flex-col h-full relative ${getBgStyle()}`}>
      {badge && (
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-black tracking-widest ${
            id === 'standard' ? 'bg-emerald-500 text-white' : 'bg-purple-600 text-white'
        }`}>
            {badge}
        </div>
      )}
      <div className="mb-8">
        <h3 className="text-xl font-black mb-4 uppercase tracking-tighter">{name}</h3>
        <div className="flex items-baseline space-x-1 mb-2">
            <span className="text-4xl font-black tracking-tighter">₹{price.toLocaleString()}</span>
            {!isFree && <span className="text-slate-500 text-sm italic">/mo</span>}
        </div>
        {!isFree && isAnnual && (
            <div className="text-[10px] text-emerald-400 font-bold mb-4">Billed annually at ₹{(price * 12).toLocaleString()}</div>
        )}
        <div className="text-[11px] font-black bg-white/5 px-3 py-1.5 rounded-lg w-fit text-slate-400 border border-white/5">
            {requests}
        </div>
      </div>

      <ul className="space-y-4 mb-10 flex-grow">
        {features.map((f: string) => (
            <li key={f} className="flex items-start text-base md:text-xs text-slate-300">
                <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0 text-emerald-400" />
                <span>{f}</span>
            </li>
        ))}
        {missing.map((f: string) => (
            <li key={f} className="flex items-start text-base md:text-xs text-slate-600 line-through">
                <X className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{f}</span>
            </li>
        ))}
      </ul>

      <Button 
        onClick={isEnterprise ? onEnterprise : onSelect}
        className={`w-full py-6 rounded-2xl font-black text-sm uppercase transition-all ${getBtnStyle()}`}
      >
        {cta}
      </Button>
    </div>
  );
}

function FeatureCard({ title, icon, desc }: any) {
  return (
    <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] hover:bg-white/10 transition-colors">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
            {icon}
        </div>
        <h3 className="text-lg font-bold mb-3">{title}</h3>
        <p className="text-slate-400 text-base md:text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function NeuralNode({ icon, label, sub, color }: any) {
  return (
    <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl flex items-center gap-4 hover:border-indigo-500/30 transition-all group">
      <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <div className={`text-base md:text-xs font-bold ${color || 'text-white'}`}>{label}</div>
        <div className="text-sm md:text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{sub}</div>
      </div>
    </div>
  );
}

const WALKTHROUGH_STEPS = [
  {
    title: "1. Real-time Checkout Evaluation",
    duration: 15,
    subtitle: "Zenith ML Engine processing customer telemetry.",
    details: [
      { label: "IP Address", value: "103.241.12.89 (Bangalore, IN)", status: "safe" },
      { label: "Payment Channel", value: "UPI Collect Request", status: "review" },
      { label: "Velocity Check", value: "3 checkouts under 2 mins", status: "danger" }
    ],
    statusMessage: "Evaluating transaction signatures...",
    phaseMessage: "Zenith Engine flagged high velocity: Risk score 0.82 (Flagged for Review)"
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
    statusMessage: "Compiling ReportLab PDF dossier...",
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
    <div className="bg-[#111827]/80 border border-[#1F2937] rounded-3xl overflow-hidden max-w-4xl mx-auto shadow-2xl relative text-left">
      <div className="aspect-video bg-[#0A0E1A] p-6 flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none opacity-40 z-10" />
        
        {!isPlaying && currentTime === 0 && (
          <div 
            onClick={handlePlayPause}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center cursor-pointer z-20 group-hover:bg-black/50 transition-all"
          >
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
              <Play className="h-8 w-8 fill-current ml-1" />
            </div>
            <span className="text-sm font-bold text-slate-300 mt-4 uppercase tracking-widest">
              Watch 60-Second Video Demo
            </span>
          </div>
        )}

        <div className="flex items-center justify-between border-b border-[#1F2937]/50 pb-4 z-10">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              Live Simulation Feed
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            00:{currentTime.toString().padStart(2, '0')} / 00:60
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center py-6 px-4 md:px-12 z-10 relative">
          <motion.div 
            key={activeStepIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-xl mx-auto bg-[#111827]/90 border border-[#1F2937] rounded-2xl p-6 shadow-xl relative"
          >
            <div className="mb-4">
              <h4 className="text-base font-bold text-white uppercase tracking-tight flex items-center gap-2">
                {currentStep.title}
              </h4>
              <p className="text-xs text-slate-400 mt-1">{currentStep.subtitle}</p>
            </div>

            <div className="space-y-2 border-t border-[#1F2937] pt-4">
              {currentStep.details.map((detail, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-mono">{detail.label}:</span>
                  <span className={`font-semibold px-2 py-0.5 rounded text-[11px] font-mono ${
                    detail.status === 'safe' ? 'text-emerald-400 bg-emerald-500/10' :
                    detail.status === 'danger' ? 'text-red-400 bg-red-500/10' :
                    detail.status === 'warning' ? 'text-amber-400 bg-amber-500/10' :
                    detail.status === 'review' ? 'text-indigo-400 bg-indigo-500/10' :
                    'text-slate-300 bg-white/5'
                  }`}>
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center space-x-2 text-[10px] text-blue-400 font-mono tracking-widest uppercase animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>{currentStep.statusMessage}</span>
            </div>
          </motion.div>
        </div>

        <div className="h-14 border-t border-[#1F2937]/50 pt-3 flex items-center justify-center text-center z-10">
          <p className="text-xs md:text-sm text-slate-300 font-medium">
            <span className="text-blue-400 mr-2 font-mono">[00:{currentTime.toString().padStart(2, '0')}]</span>
            {currentStep.phaseMessage}
          </p>
        </div>

      </div>

      <div className="bg-[#111827] px-6 py-4 border-t border-[#1F2937] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button 
            type="button"
            onClick={handlePlayPause}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all"
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{currentTime >= 60 ? 'Replay' : 'Play Tour'}</span>
              </>
            )}
          </button>
          
          <button 
            type="button"
            onClick={handleReset}
            className="flex items-center space-x-1.5 border border-[#1F2937] bg-transparent text-slate-400 hover:text-white px-3 py-2 rounded-xl text-xs transition-colors"
            title="Reset"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>

        <div className="flex items-center space-x-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden md:flex">
          {WALKTHROUGH_STEPS.map((step, idx) => (
            <span 
              key={idx}
              className={`transition-colors duration-300 ${
                activeStepIndex === idx ? 'text-blue-400 font-black' : 'text-slate-600'
              }`}
            >
              Step {idx + 1}
            </span>
          ))}
        </div>

        <div className="flex-1 max-w-xs w-full flex items-center space-x-3">
          <div className="flex-1 bg-slate-950 h-2 rounded-full overflow-hidden border border-[#1F2937]">
            <div 
              className="bg-blue-500 h-full transition-all duration-300 ease-linear shadow-[0_0_10px_#3b82f6]"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="text-xs font-mono text-slate-500">
            {Math.round(progressPercentage)}%
          </span>
        </div>

      </div>
    </div>
  );
}
