import React from 'react';
import { Shield, Scale, Zap, AlertTriangle, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Terms() {
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
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
              <p className="text-slate-500 font-mono text-xs uppercase tracking-widest mt-1">Version 1.3.2-Institutional</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none space-y-12">
            <section>
              <h2 className="text-xl font-bold flex items-center text-blue-400">
                <Zap className="w-5 h-5 mr-3" />
                1. Acceptance of Protocol
              </h2>
              <p className="text-slate-400 leading-relaxed">
                By accessing the Flowshield AI API or Dashboard, you agree to be bound by these deterministic Terms of Service. 
                Our platform is provided to institutional entities for the sole purpose of fraud prevention and financial 
                security research.
              </p>
            </section>

            <section className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl">
              <h2 className="text-xl font-bold text-white mb-4">2. Usage Sovereignty</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Users are granted a non-exclusive, revocable license to integrate Flowshield's SDKs. Abuse of the API, 
                including reverse-engineering the ML ensemble or attempting to brute-force auth tokens, will result in 
                immediate organizational termination.
              </p>
              <ul className="space-y-3">
                {['No extraction of underlying ML weights', 'Strict observance of rate limits', 'Valid business identification required'].map(item => (
                   <li key={item} className="flex items-center text-xs text-slate-500">
                     <AlertTriangle className="w-3 h-3 mr-2 text-amber-500" />
                     {item}
                   </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold flex items-center text-blue-400">
                <Shield className="w-5 h-5 mr-3" />
                3. SLA & Performance Guarantee
              </h2>
              <p className="text-slate-400 leading-relaxed">
                Enterprise-tier users are entitled to a 99.9% system availability SLA. While Flowshield AI provides 
                high-fidelity risk scoring, the final captured decision resides with the Merchant. Flowshield is not 
                liable for financial losses resulting from fraudulent captures or false positives.
              </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">4. Deterministic Termination</h2>
                <p className="text-slate-400 leading-relaxed">
                    Either party may terminate this agreement at any time. Upon termination, all API access 
                    will be revoked, and organizational data will be purged in accordance with our Privacy Protocol.
                </p>
            </section>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-slate-800 py-12 text-center text-slate-500 text-xs mt-20 font-mono tracking-widest">
         FLOWSHIELD AI PROTOCOL \ TERMS OF ENGAGEMENT \ 2026
      </footer>
    </div>
  );
}
