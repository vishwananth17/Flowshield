import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
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
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/services/api';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import EnterpriseModal from '@/components/EnterpriseModal';

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
      requests: '1,000',
      description: 'Starter',
      features: ['Basic fraud scoring', '7-day history', '1 API key', 'Dashboard access'],
      missing: ['ML Ensemble', 'Webhooks', 'Analytics', 'Alerts'],
      cta: 'Start Free — No Card Required',
      badge: null,
      color: 'gray'
    },
    {
      name: 'Builder',
      id: 'basic',
      price: isAnnual ? 799 : 999,
      requests: '25,000',
      description: 'Basic',
      features: ['Everything in Free', 'ML Ensemble (IF+XGB)', 'SHAP Explainability', '1 Webhook', 'Alerts page', '30-day history', 'Email Support'],
      missing: ['Advanced Analytics', 'Cross-network signals'],
      cta: 'Start Builder',
      badge: null,
      color: 'blue'
    },
    {
      name: 'Growth',
      id: 'standard',
      price: isAnnual ? 2399 : 2999,
      requests: '1,00,000',
      description: 'Standard',
      badge: 'MOST POPULAR',
      features: ['Everything in Basic', 'Full ML Ensemble', 'Cross-network signals', 'Full Analytics', '10 Keys / 5 Webhooks', 'Merchant Intelligence', 'Monthly Fraud Reports'],
      missing: ['Dedicated Model'],
      cta: 'Start Growth — Most Popular',
      color: 'emerald'
    },
    {
      name: 'Enterprise',
      id: 'premium',
      price: isAnnual ? 6399 : 7999,
      requests: 'Unlimited',
      description: 'Premium',
      badge: 'ENTERPRISE',
      features: ['Unlimited everything', 'Dedicated ML model', '99.9% uptime SLA', 'Dedicated Slack', 'Custom Integrations', 'Onboarding with Founder'],
      missing: [],
      cta: 'Contact Sales',
      color: 'purple'
    }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 selection:bg-blue-500/30 overflow-x-hidden">
      {/* Nav */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto backdrop-blur-md sticky top-0 border-b border-white/5">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Flowshield AI</span>
        </div>
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400">
          <a href="#features" className="hover:text-blue-400 transition-colors">Features</a>
          <a href="#pricing" className="hover:text-blue-400 transition-colors">Pricing</a>
          <Link to="/docs" className="hover:text-blue-400 transition-colors">Documentation</Link>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Log in</Link>
          <Button asChild className="bg-blue-600 hover:bg-blue-500 rounded-full h-10 px-6 font-bold shadow-lg shadow-blue-500/20">
            <Link to="/register">Register</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-20 pb-32 px-6 max-w-7xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <span className="text-blue-500 font-black tracking-widest text-[10px] uppercase mb-4 block">v2.0 Beta now live</span>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
            Secure your payments with <br />
            <span className="text-blue-500">Autonomous AI</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-slate-400 mb-12">
            Flowshield AI monitors every transaction in real-time, detecting complex fraud behavior 
            before it hits your balance. Built for high-volume marketplaces and fintech.
          </p>
          {!isJoined ? (
            <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
              <Input 
                type="email" 
                placeholder="Enter work email" 
                className="bg-white/5 border-white/10 h-14 rounded-2xl" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={handleWaitlistManual} className="bg-white text-black hover:bg-slate-200 h-14 px-8 rounded-2xl font-black">
                {isSubmitting ? '...' : 'Join Waitlist'}
              </Button>
            </div>
          ) : (
            <div className="text-emerald-400 font-bold bg-emerald-400/10 py-3 px-6 rounded-2xl inline-block">
              Welcome! You're on the list.
            </div>
          )}
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard title="Real-time ML" icon={<Zap className="text-blue-500" />} desc="Latency-optimized XGBoost models process checks in under 100ms." />
            <FeatureCard title="SHAP Insights" icon={<BarChart3 className="text-emerald-500" />} desc="Every decision comes with human-readable explanations of top fraud markers." />
            <FeatureCard title="Razorpay Ready" icon={<CreditCard className="text-indigo-500" />} desc="Native integration with Razorpay webhooks for instant INR subscriptions." />
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
            {requests} API REQUESTS
        </div>
      </div>

      <ul className="space-y-4 mb-10 flex-grow">
        {features.map((f: string) => (
            <li key={f} className="flex items-start text-xs text-slate-300">
                <CheckCircle2 className={`w-4 h-4 mr-2 flex-shrink-0 ${id === 'standard' ? 'text-emerald-400' : 'text-blue-500'}`} />
                <span>{f}</span>
            </li>
        ))}
        {missing.map((f: string) => (
            <li key={f} className="flex items-start text-xs text-slate-600 line-through">
                <X className="w-4 h-4 mr-2 flex-shrink-0" />
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
        <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
