import { useState, useEffect } from 'react';
import { 
  Zap, 
  BarChart3, 
  ArrowRight,
  Globe,
  X,
  CreditCard,
  Building2,
  ShieldCheck,
  MessageSquare,
  Play,
  Pause,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Display, Heading1, Heading2, Heading3, Label, Body, Caption, Mono } from '@/components/ui/Typography';
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
  const [scrollY, setScrollY] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      variant: 'default' as const
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
      variant: 'default' as const
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
      variant: 'gold' as const
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
      variant: 'default' as const
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] overflow-x-hidden font-body relative">
      
      {/* Subtle animated grid background pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03] z-0 transition-transform duration-100 ease-out"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v20H0V0zm20 20h20v20H20V20z' fill='%23D4AF37' fill-opacity='0.15' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          transform: `translateY(${scrollY * 0.15}px)`
        }}
      />

      {/* Top Header */}
      <nav className="sticky top-0 z-50 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <Logo size={32} iconSize={18} showText={true} />
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-xs font-semibold uppercase tracking-[var(--tracking-widest)] text-[var(--text-secondary)] hover:text-[var(--text-gold)] transition-colors">Features</a>
            <a href="#pricing" className="text-xs font-semibold uppercase tracking-[var(--tracking-widest)] text-[var(--text-secondary)] hover:text-[var(--text-gold)] transition-colors">Pricing</a>
            <Link to="/developers" className="text-xs font-semibold uppercase tracking-[var(--tracking-widest)] text-[var(--text-secondary)] hover:text-[var(--text-gold)] transition-colors">Developers</Link>
            <Link to="/docs" className="text-xs font-semibold uppercase tracking-[var(--tracking-widest)] text-[var(--text-secondary)] hover:text-[var(--text-gold)] transition-colors">Documentation</Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-xs font-semibold uppercase tracking-[var(--tracking-widest)] text-[var(--text-secondary)] hover:text-white transition-colors">
              Log in
            </Link>
            <Button asChild size="sm" variant="primary" className="rounded-[var(--radius-sm)]">
              <Link to="/register">Get access</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 md:pt-24 pb-20 md:pb-28 px-6 border-b border-[var(--border-subtle)] bg-[var(--gradient-hero)]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Left Headlines */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center">
              <Label className="text-[var(--text-gold)] tracking-[var(--tracking-widest)] flex items-center gap-1.5 bg-[var(--color-primary-muted)] border border-[var(--color-primary-border)] px-3 py-1 rounded-full">
                <Sparkles size={12} className="animate-pulse" /> ◆ Real-time Protection
              </Label>
            </div>

            <div className="space-y-2">
              <Display className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05]">
                Stop Fraud.
              </Display>
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05] bg-gradient-gold -webkit-background-clip-text -webkit-text-fill-color-transparent bg-clip-text text-transparent">
                Win Every Dispute.
              </h1>
            </div>

            <Body className="max-w-lg text-[var(--text-secondary)]">
              The only fraud detection and chargeback defense platform built specifically for Indian merchants. Connect in 2 minutes. No card required.
            </Body>

            {/* CTAs */}
            <div className="pt-4 flex flex-col gap-6">
              {!isJoined ? (
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                  <Input 
                    type="email" 
                    placeholder="Enter work email" 
                    className="flex-1"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button 
                    onClick={handleWaitlistManual} 
                    variant="gold" 
                    size="lg"
                  >
                    {isSubmitting ? 'Processing...' : 'Request access →'}
                  </Button>
                </div>
              ) : (
                <div className="text-[var(--text-gold)] font-bold bg-[var(--color-primary-muted)] border border-[var(--color-primary-border)] py-3 px-6 rounded-[var(--radius-md)] text-xs uppercase tracking-[var(--tracking-widest)]">
                  Request received. An onboarding specialist will contact you shortly.
                </div>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                <Button 
                  onClick={() => document.getElementById('product-tour')?.scrollIntoView({ behavior: 'smooth' })}
                  variant="gold" 
                  size="xl"
                >
                  Start Free — No Card Required
                </Button>
                <Button asChild variant="ghost" size="xl">
                  <a href="#product-tour">See How It Works →</a>
                </Button>
              </div>
            </div>

            {/* Trust Strip */}
            <div className="pt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-[var(--text-muted)] text-[10px] font-mono uppercase tracking-[var(--tracking-wider)] border-t border-[var(--border-subtle)] mt-8">
              <span className="flex items-center gap-1">✓ DPDP Act 2023 Compliant</span>
              <span className="flex items-center gap-1">✓ Razorpay Certified Partner</span>
              <span className="flex items-center gap-1">✓ 94% Detection Accuracy</span>
              <span className="flex items-center gap-1">✓ &lt;100ms Response Time</span>
            </div>
          </div>

          {/* Right Hero Graphic Card with Blurred Background Stack */}
          <div className="lg:col-span-5 relative flex justify-center items-center py-12">
            {/* Background Blur Deck Card 1 */}
            <div 
              className="absolute w-72 h-48 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] opacity-30 shadow-[var(--shadow-navy)] pointer-events-none transition-transform duration-300"
              style={{
                transform: `rotate(-12deg) translate(-30px, -20px) translateZ(-50px) scale(0.9)`,
                filter: 'blur(2px)'
              }}
            />
            {/* Background Blur Deck Card 2 */}
            <div 
              className="absolute w-72 h-48 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] opacity-20 shadow-[var(--shadow-navy)] pointer-events-none transition-transform duration-300"
              style={{
                transform: `rotate(12deg) translate(30px, 20px) translateZ(-60px) scale(0.85)`,
                filter: 'blur(4px)'
              }}
            />

            {/* Active Foreground Card */}
            <Card 
              variant="gold"
              className="w-full max-w-sm relative z-10 shadow-[var(--shadow-gold)] hover:scale-[1.02] transform transition-transform duration-300"
            >
              <div className="space-y-6 text-left">
                <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
                  <Label className="text-[var(--text-gold)]">System Telemetry</Label>
                  <Badge variant="success" dot pulse>Active</Badge>
                </div>

                <div className="space-y-3">
                  <div className="bg-[var(--bg-inset)] border border-[var(--border-default)] p-3 rounded-[var(--radius-md)] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Checkout Telemetry</span>
                      <div className="text-xs font-bold text-white mt-0.5">UPI Collect • ₹45,000</div>
                    </div>
                    <Badge variant="success">PASS</Badge>
                  </div>

                  <div className="bg-[var(--bg-inset)] border border-[var(--border-default)] p-3 rounded-[var(--radius-md)] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Risk Evaluation</span>
                      <div className="text-xs font-bold text-white mt-0.5">XGBoost Classifiers</div>
                    </div>
                    <Badge variant="gold">0.030% FBR</Badge>
                  </div>

                  <div className="bg-[var(--bg-inset)] border border-[var(--border-default)] p-3 rounded-[var(--radius-md)] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Evidence Submission</span>
                      <div className="text-xs font-bold text-white mt-0.5">Evidence Compilation</div>
                    </div>
                    <Badge variant="info">WON 94.2%</Badge>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <Caption>Evaluation pipeline running on merchant gateway telemetry.</Caption>
                </div>
              </div>
            </Card>
          </div>

        </div>
      </section>

      {/* --- SYSTEM PIPELINE SECTION --- */}
      <section className="py-20 md:py-28 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <Label className="text-[var(--text-gold)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-1.5 rounded-full">
            Transaction Evaluation
          </Label>
          <Heading1 className="text-3xl md:text-5xl">
            Real-Time Risk Pipeline
          </Heading1>
          <Body className="max-w-xl mx-auto">
            Flowshield parses raw incoming payloads, engineers velocity features, and evaluates risk levels.
          </Body>
        </div>

        <div className="grid md:grid-cols-12 gap-8 items-center">
          
          {/* Left: Input Nodes */}
          <div className="md:col-span-3 space-y-4 text-left">
            <Label className="mb-2 block">Checkout Fields</Label>
            <NeuralNode icon={<CreditCard className="w-4 h-4 text-[var(--text-gold)]" />} label="Card Payload" sub="Amount, BIN, MCC" />
            <NeuralNode icon={<Globe className="w-4 h-4 text-[var(--text-gold)]" />} label="Geographic Coordinates" sub="IP, Location Distance" />
            <NeuralNode icon={<Zap className="w-4 h-4 text-[var(--text-gold)]" />} label="Velocity Features" sub="Transaction Frequency" />
          </div>

          {/* Center: Core */}
          <div className="md:col-span-6 flex justify-center py-6">
            <Card variant="gold" className="w-full max-w-md text-center space-y-6">
              <Label className="border-b border-[var(--border-default)] pb-3 block">
                Core Risk Models
              </Label>
              <div className="space-y-3 font-mono text-xs">
                <div className="bg-[var(--bg-inset)] border border-[var(--border-default)] px-4 py-3 rounded-[var(--radius-md)] text-[var(--text-secondary)]">
                  LAYER 1 — ANOMALY CLASSIFICATION
                </div>
                <div className="bg-[var(--bg-inset)] border border-[var(--border-default)] px-4 py-3 rounded-[var(--radius-md)] text-[var(--text-secondary)]">
                  LAYER 2 — ENSEMBLE PREDICTIONS
                </div>
                <div className="bg-[var(--color-primary)] text-[var(--text-inverse)] font-extrabold px-4 py-3 rounded-[var(--radius-md)] shadow-[var(--shadow-gold)]">
                  LAYER 3 — RISK RULES PIPELINE
                </div>
              </div>
              <Caption className="block">
                100% Target Recall • 0.030% False Block Rate
              </Caption>
            </Card>
          </div>

          {/* Right: Output Nodes */}
          <div className="md:col-span-3 space-y-4 text-left">
            <Label className="mb-2 block">System Integrations</Label>
            <NeuralNode icon={<Building2 className="w-4 h-4 text-[var(--text-gold)]" />} label="Gateway Ledger" sub="Settlement Updates" />
            <NeuralNode icon={<ShieldCheck className="w-4 h-4 text-[var(--text-gold)]" />} label="Risk Dashboard" sub="Triage Alerts" />
            <NeuralNode icon={<BarChart3 className="w-4 h-4 text-[var(--text-gold)]" />} label="Dispute Evidence" sub="Automated Submissions" />
          </div>

        </div>
      </section>

      {/* --- PLATFORM DEMO: 60 SEC WALKTHROUGH --- */}
      <section id="product-tour" className="py-20 md:py-28 px-6 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="max-w-6xl mx-auto text-center mb-12 space-y-4">
          <Label className="text-[var(--text-gold)] border border-[var(--border-default)] bg-[var(--bg-base)] px-4 py-1.5 rounded-full">
            Demo Simulation
          </Label>
          <Heading2 className="text-3xl md:text-5xl">
            60-Second Walkthrough
          </Heading2>
          <Body className="max-w-xl mx-auto">
            Watch the evaluation pipeline gather order details, submit shipping logs, and update dispute statuses automatically.
          </Body>
        </div>

        <InteractiveWalkthrough />
      </section>

      {/* Video Section */}
      <ProductVideoSection />

      {/* Features Grid */}
      <section id="features" className="py-20 md:py-28 px-6 max-w-7xl mx-auto border-t border-[var(--border-subtle)]">
        <div className="text-center mb-16 space-y-4">
          <Heading2 className="text-3xl md:text-5xl">Built for Enterprise Merchant Pipelines</Heading2>
          <Body className="max-w-xl mx-auto">Automated evidence compilation and transaction risk control.</Body>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
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
      <section id="pricing" className="py-20 md:py-28 px-6 max-w-7xl mx-auto border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="text-center mb-16 space-y-6">
          <Heading2 className="text-3xl md:text-5xl">Choose Your Plan</Heading2>
          <div className="flex items-center justify-center space-x-4">
            <span className={`text-xs font-mono font-bold ${!isAnnual ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>Monthly</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-12 h-6 bg-[var(--bg-inset)] border border-[var(--border-default)] rounded-full relative transition-all"
            >
              <motion.div 
                animate={{ x: isAnnual ? 24 : 0 }}
                className="absolute top-1 left-1 w-4 h-4 bg-[var(--color-primary)] rounded-full"
              />
            </button>
            <span className={`text-xs font-mono font-bold flex items-center ${isAnnual ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
              Annual <span className="ml-2 text-[10px] bg-[var(--color-primary)] text-[var(--text-inverse)] px-2 py-0.5 rounded font-black uppercase">Save 20%</span>
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
      <footer className="border-t border-[var(--border-subtle)] pt-16 pb-12 px-6 bg-[var(--bg-base)] text-left">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Logo size={28} iconSize={16} showText={true} />
            </div>
            <Caption className="block leading-relaxed max-w-xs">
              Transaction risk scoring and automated chargeback resolution logs.
            </Caption>
          </div>
          
          <div>
            <h4 className="text-[var(--text-primary)] text-xs font-bold uppercase tracking-[var(--tracking-widest)] mb-4">Platform</h4>
            <ul className="space-y-3 text-xs font-medium text-[var(--text-secondary)]">
              <li><a href="#features" className="hover:text-[var(--text-gold)] transition-colors">Risk Scoring</a></li>
              <li><a href="#pricing" className="hover:text-[var(--text-gold)] transition-colors">Pricing</a></li>
              <li><Link to="/register" className="hover:text-[var(--text-gold)] transition-colors">Get Access</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[var(--text-primary)] text-xs font-bold uppercase tracking-[var(--tracking-widest)] mb-4">Developers</h4>
            <ul className="space-y-3 text-xs font-medium text-[var(--text-secondary)]">
              <li><Link to="/developers" className="hover:text-[var(--text-gold)] transition-colors">Integration Keys</Link></li>
              <li><Link to="/docs" className="hover:text-[var(--text-gold)] transition-colors">API Docs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[var(--text-primary)] text-xs font-bold uppercase tracking-[var(--tracking-widest)] mb-4">Legal</h4>
            <ul className="space-y-3 text-xs font-medium text-[var(--text-secondary)]">
              <li><Link to="/privacy" className="hover:text-[var(--text-gold)] transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-[var(--text-gold)] transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-[var(--border-subtle)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-muted)] font-mono tracking-wider">
            © 2026 FLOWSHIELD \ ALL RIGHTS RESERVED
          </p>
          <div className="flex items-center space-x-5 text-[var(--text-muted)]">
            <Globe className="w-4 h-4 hover:text-[var(--text-gold)] cursor-pointer transition-colors" />
            <MessageSquare className="w-4 h-4 hover:text-[var(--text-gold)] cursor-pointer transition-colors" />
          </div>
        </div>
      </footer>
    </div>
  );
}

function PricingCard({ name, id, price, requests, features, missing, cta, badge, isAnnual, onEnterprise, onSelect, variant }: any) {
  const isEnterprise = id === 'premium';
  const isFree = id === 'free';

  return (
    <Card 
      variant={variant}
      className={`relative flex flex-col h-full ${variant === 'gold' ? 'border-[var(--border-gold)]' : ''}`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-[var(--color-primary)] text-[var(--text-inverse)]">
          {badge}
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="text-sm font-bold uppercase tracking-tight text-white mb-2">{name}</h3>
        <div className="flex items-baseline space-x-1 mb-1">
          <span className="text-3xl font-extrabold tracking-tight">₹{price.toLocaleString()}</span>
          {!isFree && <span className="text-[var(--text-muted)] text-xs">/mo</span>}
        </div>
        {!isFree && isAnnual && (
          <div className="text-[10px] text-[var(--text-muted)] font-mono mb-3">Billed annually</div>
        )}
        <div className="text-xs font-mono bg-[var(--bg-inset)] border border-[var(--border-default)] px-3 py-1 rounded-full w-fit text-[var(--text-secondary)]">
          {requests}
        </div>
      </div>

      <ul className="space-y-3 mb-8 flex-grow">
        {features.map((f: string) => (
          <li key={f} className="flex items-start text-xs text-[var(--text-secondary)]">
            <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0 text-[var(--text-gold)] animate-pulse" size={14} />
            <span>{f}</span>
          </li>
        ))}
        {missing.map((f: string) => (
          <li key={f} className="flex items-start text-xs text-[var(--text-muted)] line-through">
            <X className="w-4 h-4 mr-2 flex-shrink-0 text-red-500/50" size={14} />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <Button 
        onClick={isEnterprise ? onEnterprise : onSelect}
        variant={variant === 'gold' ? 'gold' : 'primary'}
        size="lg"
        fullWidth
      >
        {cta}
      </Button>
    </Card>
  );
}

function CheckCircle2({ className, size }: { className?: string, size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function FeatureCard({ title, icon, desc }: any) {
  return (
    <Card variant="default" className="hover:border-[var(--border-gold)] transition-colors duration-300">
      <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-primary-muted)] border border-[var(--color-primary-border)] flex items-center justify-center mb-5 text-[var(--text-gold)]">
        {icon}
      </div>
      <Heading3 className="mb-2">{title}</Heading3>
      <Body className="text-xs text-[var(--text-secondary)]">{desc}</Body>
    </Card>
  );
}

function NeuralNode({ icon, label, sub }: any) {
  return (
    <Card variant="default" padding="sm" className="flex items-center gap-3.5 hover:border-[var(--border-gold)] transition-colors duration-300">
      <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--bg-inset)] border border-[var(--border-default)] flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-xs font-bold text-white">{label}</div>
        <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{sub}</div>
      </div>
    </Card>
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
    <Card variant="glass" padding="none" className="max-w-4xl mx-auto overflow-hidden text-left relative">
      <div className="p-6 md:p-8 border-b border-[var(--border-default)] relative">
        {!isPlaying && currentTime === 0 && (
          <div 
            onClick={handlePlayPause}
            className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center cursor-pointer z-20 hover:bg-black/70 transition-colors"
          >
            <div className="w-16 h-16 rounded-full bg-[var(--gradient-primary)] text-[var(--text-inverse)] flex items-center justify-center font-bold shadow-[var(--shadow-gold)] hover:scale-105 transition-transform duration-300">
              <Play className="h-6 w-6 fill-current ml-0.5" />
            </div>
            <Label className="text-white mt-4 tracking-[var(--tracking-widest)]">
              Play Interactive Walkthrough
            </Label>
          </div>
        )}

        <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4 mb-6">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
            <span className="text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider">
              Live Pipeline Stream
            </span>
          </div>
          <span className="text-xs font-mono text-[var(--text-muted)]">
            00:{currentTime.toString().padStart(2, '0')} / 00:60
          </span>
        </div>

        <div className="space-y-4 max-w-xl mx-auto bg-[var(--bg-inset)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-6">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-tight">
              {currentStep.title}
            </h4>
            <Caption className="mt-1 block">{currentStep.subtitle}</Caption>
          </div>

          <div className="space-y-2 border-t border-[var(--border-default)] pt-3">
            {currentStep.details.map((detail, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs font-mono">
                <span className="text-[var(--text-muted)]">{detail.label}:</span>
                <span className="font-medium text-white bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-2 py-0.5 rounded">
                  {detail.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-[var(--text-secondary)] font-mono">
            <span className="text-[var(--text-muted)] mr-2">[00:{currentTime.toString().padStart(2, '0')}]</span>
            {currentStep.phaseMessage}
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-[var(--bg-inset)] px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Button 
            onClick={handlePlayPause}
            variant="gold"
            size="sm"
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5 fill-current mr-1.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current mr-1.5" />
                <span>{currentTime >= 60 ? 'Replay' : 'Play'}</span>
              </>
            )}
          </Button>
          
          <button 
            type="button"
            onClick={handleReset}
            className="flex items-center space-x-1.5 border border-[var(--border-default)] bg-transparent text-[var(--text-muted)] hover:text-white px-3 py-2 rounded-[var(--radius-sm)] text-xs transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>

        <div className="flex-1 max-w-xs w-full flex items-center space-x-3">
          <div className="flex-1 bg-[var(--bg-elevated)] h-2 rounded-full overflow-hidden border border-[var(--border-subtle)]">
            <div 
              className="bg-[var(--color-primary)] h-full transition-all duration-300 ease-linear"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="text-xs font-mono text-[var(--text-muted)]">
            {Math.round(progressPercentage)}%
          </span>
        </div>
      </div>
    </Card>
  );
}
