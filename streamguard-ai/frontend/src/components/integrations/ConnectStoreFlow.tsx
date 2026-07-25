import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import api from '@/services/api';
import PlatformDetectResult from './PlatformDetectResult';
import { Search, Loader2 } from 'lucide-react';
import { Heading3, Label, Caption } from '@/components/ui/Typography';

interface ConnectStoreFlowProps {
  onConnected?: () => void;
  onFallback?: () => void;
  onSuccess?: () => void;
}

export default function ConnectStoreFlow({ onConnected, onFallback, onSuccess }: ConnectStoreFlowProps) {
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

    const steps = [
      { msg: 'Normalizing URL...', duration: 600, pct: 15 },
      { msg: 'Resolving DNS records...', duration: 600, pct: 40 },
      { msg: 'Running SSRF boundary checks...', duration: 600, pct: 70 },
      { msg: 'Scanning HTML headers and meta tags...', duration: 700, pct: 95 }
    ];

    try {
      const backendPromise = api.post('/integrations/detect', { url });

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

  const handleSuccess = () => {
    if (onSuccess) onSuccess();
    if (onConnected) onConnected();
  };

  return (
    <div className="space-y-6 text-left font-body">
      {!detectResult && !loading && (
        <form onSubmit={handleSubmit} className="max-w-2xl">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-xl)] p-6">
            <Heading3 className="text-white mb-2">Connect Your Store</Heading3>
            <Caption className="mb-5 block">
              Enter your website URL. We will check the platform tags and guide you through the zero-code connection setup.
            </Caption>

            <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-3 h-5 w-5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://mystore.com"
                  className="w-full bg-[var(--bg-inset)] border border-[var(--border-default)] rounded-[var(--radius-md)] pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                />
              </div>
              <Button 
                type="submit" 
                variant="gold"
                size="lg"
              >
                Detect & Connect
              </Button>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-2 items-center text-xs text-[var(--text-muted)]">
              <span>Supports instant connectors for:</span>
              <span className="bg-[var(--bg-inset)] border border-[var(--border-default)] px-2 py-0.5 rounded text-gray-300">Shopify OAuth</span>
              <span className="bg-[var(--bg-inset)] border border-[var(--border-default)] px-2 py-0.5 rounded text-gray-300">WooCommerce Plugin</span>
              <span className="bg-[var(--bg-inset)] border border-[var(--border-default)] px-2 py-0.5 rounded text-gray-300">Razorpay Pages</span>
            </div>
          </div>
        </form>
      )}

      {loading && (
        <div className="max-w-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-xl)] p-8 flex flex-col items-center justify-center text-center">
          <Loader2 className="h-10 w-10 text-[var(--color-primary)] animate-spin mb-4" />
          <h4 className="font-medium text-white text-base mb-1">{loadingStep}</h4>
          <Caption className="mb-4 block">Please wait while we audit the remote page signatures...</Caption>
          
          <div className="w-full bg-[var(--bg-inset)] border border-[var(--border-default)] h-2 rounded-full overflow-hidden max-w-xs">
            <div 
              className="bg-[var(--color-primary)] h-2 rounded-full transition-all duration-300 ease-out"
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
            onFallback={onFallback || (() => {})}
            onSuccess={handleSuccess}
          />
        </div>
      )}
    </div>
  );
}
