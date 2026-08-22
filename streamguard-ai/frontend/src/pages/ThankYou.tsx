import { CheckCircle2, ArrowRight, Terminal, LayoutDashboard, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { useState } from 'react';

export default function ThankYou() {
  const [copied, setCopied] = useState(false);

  const sampleKey = 'sg_live_7x9Q8kL2mNpR4vW6tY1z8aB';

  const copyKey = () => {
    navigator.clipboard.writeText(sampleKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col justify-between p-6">
      {/* Top Bar */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between py-4">
        <Link to="/" className="flex items-center space-x-2.5">
          <Logo size={28} iconSize={16} theme="dark" />
          <span className="font-bold text-base tracking-tight text-white">Flowshield AI</span>
        </Link>
        <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Environment: Active (ap-south-1)
        </span>
      </div>

      {/* Main Confirmation Box */}
      <div className="max-w-lg w-full mx-auto my-auto bg-[#0D131F] border border-slate-800 rounded p-8 space-y-6 shadow-2xl">
        <div className="w-12 h-12 rounded bg-emerald-950/50 border border-emerald-800/60 flex items-center justify-center mx-auto text-emerald-400">
          <CheckCircle2 className="w-6 h-6" />
        </div>

        <div className="text-center space-y-2">
          <div className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold">Account Initialized</div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome to Flowshield AI</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your sandbox organization and cryptographic API credentials have been provisioned successfully.
          </p>
        </div>

        {/* API Key Box */}
        <div className="space-y-2">
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>Root Sandbox API Key:</span>
            <span>Do not share publicly</span>
          </div>
          <div className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3 rounded font-mono text-xs text-blue-400">
            <span>{sampleKey}</span>
            <button
              onClick={copyKey}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
              aria-label="Copy API Key"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Quick Next Steps */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded p-4 text-xs space-y-2.5">
          <div className="font-semibold text-white text-xs">Recommended Next Steps:</div>
          <ul className="space-y-1.5 text-slate-400 text-[11px]">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-mono">1.</span>
              <span>Connect your payment gateway webhook (Razorpay / Cashfree / PayU).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-mono">2.</span>
              <span>Test transaction risk inference in under 43ms via our SDK.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-mono">3.</span>
              <span>Configure automated dispute defense rules in the console.</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button asChild className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold h-10 rounded">
            <Link to="/dashboard" className="flex items-center justify-center gap-1.5">
              <LayoutDashboard className="w-4 h-4" />
              <span>Enter Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1 border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium h-10 rounded">
            <Link to="/docs" className="flex items-center justify-center gap-1.5">
              <Terminal className="w-4 h-4" />
              <span>Read API Docs</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between text-xs text-slate-500 py-4 border-t border-slate-800/60">
        <div>© {new Date().getFullYear()} Flowshield AI Technologies Private Limited</div>
        <div className="flex space-x-4">
          <Link to="/privacy" className="hover:text-slate-300">Privacy</Link>
          <Link to="/terms" className="hover:text-slate-300">Terms</Link>
          <a href="mailto:support@flowshield.ai" className="hover:text-slate-300">Support</a>
        </div>
      </div>
    </div>
  );
}
