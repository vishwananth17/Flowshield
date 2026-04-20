import React from 'react';
import { Shield, Lock, Eye, Globe, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-blue-500/30">
      <nav className="border-b border-slate-800/50 bg-[#020617]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
             <Shield className="w-5 h-5 text-blue-500" />
             <span className="font-bold tracking-tight">Flowshield AI</span>
          </div>
          <a href="/" className="text-xs font-bold text-slate-400 hover:text-white uppercase transition-colors tracking-widest">Back to Protocol</a>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-20 lg:py-32">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6 }}
        >
          <div className="flex items-center space-x-4 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
              <p className="text-slate-500 font-mono text-xs uppercase tracking-widest mt-1">Last Updated: April 20, 2026</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none space-y-12">
            <section>
              <h2 className="text-xl font-bold flex items-center text-blue-400">
                <Globe className="w-5 h-5 mr-3" />
                1. Information Protocol
              </h2>
              <p className="text-slate-400 leading-relaxed">
                Flowshield AI ("we," "us," or "the Protocol") operates as a secure proxy layer for financial intelligence. 
                We process transaction metadata, including transaction amounts, merchant IDs, and customer IP signals, 
                solely for the purpose of identifying and preventing fraudulent activity.
              </p>
            </section>

            <section className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl">
              <h2 className="text-xl font-bold text-white mb-4">2. Data Sphericity</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Institutional data is cryptographically isolated. We do not store full Credit Card PANs or personally identifiable 
                government IDs. Our inference core operates on vectorized representations of transaction behavior.
              </p>
              <ul className="space-y-3">
                {['End-to-end encryption in transit', 'Vectorized PII masking', 'SOC 2 Type II compliant infrastructure'].map(item => (
                   <li key={item} className="flex items-center text-xs text-slate-500">
                     <ChevronRight className="w-3 h-3 mr-2 text-blue-500" />
                     {item}
                   </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold flex items-center text-blue-400">
                <Lock className="w-5 h-5 mr-3" />
                3. Third-Party Intelligence
              </h2>
              <p className="text-slate-400 leading-relaxed">
                We utilize third-party inference providers (Stripe, Razorpay, and AWS) solely for infrastructure 
                hosting and billing. We never sell organizational data to marketing brokers or data harvesters.
              </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">4. Deterministic Rights</h2>
                <p className="text-slate-400 leading-relaxed">
                    You maintain full sovereign rights over your organizational data. At any time, you may request 
                    the permanent deletion of your inference logs via the dashboard or by contacting 
                    <span className="text-blue-400 ml-1">security@flowshield.ai</span>.
                </p>
            </section>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-slate-800 py-12 text-center text-slate-500 text-xs mt-20 font-mono tracking-widest">
         FLOWSHIELD AI PROTOCOL \ CORE SECURITY POLICY \ 2026
      </footer>
    </div>
  );
}
