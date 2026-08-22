import { AlertCircle, ArrowLeft, Home, Terminal, ShieldAlert } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-[#080C14] text-slate-100 p-6 selection:bg-blue-600/30">
      
      {/* Top Header */}
      <div className="w-full max-w-5xl flex items-center justify-between py-4">
        <Link to="/" className="flex items-center space-x-2.5">
          <Logo size={28} iconSize={16} theme="dark" />
          <span className="font-bold text-base tracking-tight text-white">Flowshield AI</span>
        </Link>
        <span className="text-xs font-mono text-slate-500">Error Code: HTTP_404_NOT_FOUND</span>
      </div>

      {/* Main 404 Content */}
      <div className="max-w-md w-full bg-[#0D131F] border border-slate-800 rounded p-8 text-center space-y-6 shadow-xl my-auto">
        <div className="w-12 h-12 rounded bg-red-950/40 border border-red-800/60 flex items-center justify-center mx-auto text-red-400">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-mono uppercase tracking-widest text-red-400 font-semibold">404 Exception</div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Endpoint Not Located</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            The resource, dashboard path, or API documentation route you requested does not exist on this gateway cluster.
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800/80 p-3 rounded text-left font-mono text-[11px] text-slate-400 space-y-1">
          <div><span className="text-slate-500">URI:</span> {window.location.pathname}</div>
          <div><span className="text-slate-500">Cluster:</span> in-south-1a</div>
          <div><span className="text-slate-500">Status:</span> Gateway Resolution Failed</div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            onClick={() => navigate('/')}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium h-9 rounded"
          >
            <Home className="w-3.5 h-3.5 mr-1.5" />
            <span>Return Home</span>
          </Button>

          <Button
            asChild
            variant="outline"
            className="flex-1 border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium h-9 rounded"
          >
            <Link to="/docs">
              <Terminal className="w-3.5 h-3.5 mr-1.5" />
              <span>API Docs</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="w-full max-w-5xl flex items-center justify-between text-xs text-slate-500 py-4 border-t border-slate-800/60">
        <div>© 2026 Flowshield AI Technologies</div>
        <div className="flex space-x-4">
          <Link to="/privacy" className="hover:text-slate-300">Privacy</Link>
          <Link to="/terms" className="hover:text-slate-300">Terms</Link>
          <a href="mailto:support@flowshield.ai" className="hover:text-slate-300">Support</a>
        </div>
      </div>

    </div>
  );
}

