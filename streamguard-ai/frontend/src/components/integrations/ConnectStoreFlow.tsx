import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/services/api';
import PlatformDetectResult from './PlatformDetectResult';
import { Search, Loader2 } from 'lucide-react';

interface ConnectStoreFlowProps {
  onFallback: () => void;
  onSuccess: () => void;
}

export default function ConnectStoreFlow({ onFallback, onSuccess }: ConnectStoreFlowProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [detectResult, setDetectResult] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      toast.error('Please enter a website URL.');
      return;
    }

    setLoading(true);
    setDetectResult(null);
    setProgress(0);

    // Mock progress messages to give it a premium, heavy analysis feel (2-3 seconds)
    const steps = [
      { msg: 'Normalizing URL...', duration: 600, pct: 15 },
      { msg: 'Resolving DNS records...', duration: 600, pct: 40 },
      { msg: 'Running SSRF boundary checks...', duration: 600, pct: 70 },
      { msg: 'Scanning HTML headers and meta tags...', duration: 700, pct: 95 }
    ];

    try {
      // Start backend request in parallel
      const backendPromise = api.post('/integrations/detect', { url });

      // Run visual steps
      for (const step of steps) {
        setLoadingStep(step.msg);
        setProgress(step.pct);
        await new Promise(r => setTimeout(r, step.duration));
      }

      const res = await backendPromise;
      setProgress(100);
      setDetectResult(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Url resolution failed. Make sure the domain is public.');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!detectResult && !loading && (
        <form onSubmit={handleSubmit} className="max-w-2xl">
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 shadow-xl">
            <h3 className="font-semibold text-lg text-white mb-2">Connect Your Store</h3>
            <p className="text-sm text-gray-400 mb-5">
              Enter your website URL. We will check the platform tags and guide you through the zero-code connection setup.
            </p>

            <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://mystore.com"
                  className="w-full bg-[#1F2937] border border-[#374151] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors"
              >
                Detect & Connect
              </Button>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-2 items-center text-xs text-gray-500">
              <span>Supports instant connectors for:</span>
              <span className="bg-[#1F2937] px-2 py-0.5 rounded text-gray-300">Shopify OAuth</span>
              <span className="bg-[#1F2937] px-2 py-0.5 rounded text-gray-300">WooCommerce Plugin</span>
              <span className="bg-[#1F2937] px-2 py-0.5 rounded text-gray-300">Razorpay Pages</span>
            </div>
          </div>
        </form>
      )}

      {loading && (
        <div className="max-w-2xl bg-[#111827] border border-[#1F2937] rounded-xl p-8 shadow-xl flex flex-col items-center justify-center text-center">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
          <h4 className="font-medium text-white text-base mb-1">{loadingStep}</h4>
          <p className="text-xs text-gray-400 mb-4">Please wait while we audit the remote page signatures...</p>
          
          <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden max-w-xs">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {detectResult && (
        <div className="max-w-2xl">
          <PlatformDetectResult
            platform={detectResult.platform}
            detectedUrl={url}
            storeName={detectResult.store_name}
            onFallback={onFallback}
            onSuccess={onSuccess}
          />
        </div>
      )}
    </div>
  );
}
