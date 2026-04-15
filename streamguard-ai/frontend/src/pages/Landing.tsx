import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Zap, 
  BarChart3, 
  ChevronRight, 
  Lock, 
  Globe, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/services/api';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function Landing() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      await api.post('/waitlist', { email });
      setIsJoined(true);
      toast.success("Welcome to the front of the line!", {
        description: "We'll notify you as soon as early access opens up."
      });
    } catch (error) {
      toast.error("Failed to join waitlist. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 selection:bg-blue-500/30 overflow-x-hidden">
      {/* Abstract Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-emerald-600/5 blur-[100px] rounded-full" />
      </div>

      {/* Nav */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto border-b border-slate-800/50 backdrop-blur-md sticky top-0">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/20">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Flowshield AI</span>
        </div>
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400">
          <a href="#features" className="hover:text-blue-400 transition-colors">Features</a>
          <a href="#pricing" className="hover:text-blue-400 transition-colors">Pricing</a>
          <a href="#docs" className="hover:text-blue-400 transition-colors">Documentation</a>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Log in</Link>
          <Button asChild className="bg-blue-600 hover:bg-blue-500 border-none shadow-lg shadow-blue-500/20">
            <Link to="/register">Get Started <ChevronRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-6 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-blue-400 text-xs font-semibold mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span>v2.0 Beta now live</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            Secure your payments with <br className="hidden md:block" />
            <span className="text-blue-500">Autonomous AI</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg text-slate-400 mb-10 leading-relaxed">
            Flowshield AI monitors every transaction in real-time, detecting complex fraud behavior 
            before it hits your balance. Built for high-volume marketplaces and fintech.
          </p>

          {!isJoined ? (
            <form onSubmit={handleWaitlist} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3 mb-12">
              <Input 
                type="email" 
                placeholder="Enter your work email" 
                className="bg-slate-900/50 border-slate-700 focus:border-blue-500 h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-white text-slate-950 hover:bg-slate-200 h-12 px-8 font-bold text-base"
              >
                {isSubmitting ? "Joining..." : "Join Waitlist"}
              </Button>
            </form>
          ) : (
            <motion.div 
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="max-w-md mx-auto bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl mb-12 flex items-center justify-center space-x-3 text-emerald-400"
            >
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">You're on the list! Watch your inbox.</span>
            </motion.div>
          )}

          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-40 grayscale filter invert">
            {/* Logos Placeholder */}
            {['Stripe', 'Visa', 'Mastercard', 'Square'].map(brand => (
              <span key={brand} className="text-xl font-bold tracking-tighter">{brand}</span>
            ))}
          </div>
        </motion.div>

        {/* Hero Image / UI Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-24 relative"
        >
          <div className="absolute inset-0 bg-blue-500/20 blur-[100px] -z-10" />
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-2 shadow-2xl overflow-hidden shadow-blue-500/10">
            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
               <div className="h-8 border-b border-slate-800 flex items-center px-4 space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
               </div>
               <img 
                 src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2000" 
                 alt="Dashboard Preview" 
                 className="w-full h-auto opacity-80"
               />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto border-t border-slate-800/50">
        <div className="text-center mb-20">
          <h2 className="text-3xl font-bold mb-4">Industrial-Grade Protection</h2>
          <p className="text-slate-400">Everything you need to stop fraud at the source.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <FeatureCard 
             icon={<Zap className="h-6 w-6 text-blue-500" />}
             title="Instant Analysis"
             description="Sub-50ms latency for every transaction check. Your checkout flow stays lightning fast."
           />
           <FeatureCard 
             icon={<BarChart3 className="h-6 w-6 text-indigo-500" />}
             title="Ensemble Learning"
             description="Harnessing Isolation Forests and custom heuristics to catch patterns static rules miss."
           />
           <FeatureCard 
             icon={<Lock className="h-6 w-6 text-emerald-500" />}
             title="Secure by Design"
             description="PCI-compliant architecture. We never store full card details, keeping your liability low."
           />
        </div>
      </section>

      {/* CTA section */}
      <section className="py-24 px-6 mb-24 max-w-5xl mx-auto text-center relative">
        <div className="absolute inset-0 bg-indigo-600/5 blur-[80px] -z-10 rounded-full" />
        <div className="bg-[#111827] border border-slate-800 p-12 rounded-3xl">
          <h2 className="text-4xl font-bold mb-6">Ready to shield your flow?</h2>
          <p className="text-slate-400 mb-10 max-w-xl mx-auto">
            Join the elite teams using Flowshield to maintain zero-loss operations. 
            Access is currently limited to selected partners.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button size="lg" className="bg-white text-slate-950 hover:bg-slate-200 px-10">Start for Free</Button>
            <Button size="lg" variant="outline" className="border-slate-700 hover:bg-slate-800 px-10">Talk to Sales</Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-900/50 px-6 max-w-7xl mx-auto text-center">
        <div className="flex items-center justify-center space-x-2 mb-8">
          <Shield className="h-5 w-5 text-blue-500" />
          <span className="font-bold">Flowshield AI</span>
        </div>
        <p className="text-slate-500 text-sm mb-8">© {new Date().getFullYear()} Flowshield AI. All rights reserved.</p>
        <div className="flex justify-center space-x-6 text-sm text-slate-400">
           <a href="#" className="hover:text-white transition-colors">Privacy</a>
           <a href="#" className="hover:text-white transition-colors">Terms</a>
           <a href="#" className="hover:text-white transition-colors">Twitter</a>
           <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all group">
      <div className="bg-slate-950 p-3 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
