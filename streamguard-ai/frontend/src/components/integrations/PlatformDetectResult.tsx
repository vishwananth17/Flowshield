import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Heading3, Label, Caption } from '@/components/ui/Typography';
import { toast } from 'sonner';
import api from '@/services/api';
import { 
  ExternalLink, 
  Download, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';

interface PlatformResultProps {
  platform: 'shopify' | 'woocommerce' | 'razorpay_pages' | 'payu' | 'instamojo' | 'unknown';
  detectedUrl: string;
  storeName?: string;
  onFallback: () => void;
  onSuccess: () => void;
}

export default function PlatformDetectResult({ 
  platform, 
  detectedUrl, 
  storeName, 
  onFallback, 
  onSuccess 
}: PlatformResultProps) {
  const [shopifyShop, setShopifyShop] = useState(storeName || '');
  const [loading, setLoading] = useState(false);
  const [wooUrl, setWooUrl] = useState(detectedUrl);
  const [razorpayKey, setRazorpayKey] = useState('');
  const [razorpaySecret, setRazorpaySecret] = useState('');

  const handleShopifyConnect = async () => {
    if (!shopifyShop) {
      toast.error('Please enter your shop domain.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/integrations/shopify/oauth/start?shop=${encodeURIComponent(shopifyShop)}`);
      if (res.data?.auth_url) {
        window.location.href = res.data.auth_url;
      } else {
        toast.error('Could not initiate Shopify OAuth.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to start Shopify connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleWooTest = async () => {
    setLoading(true);
    try {
      const res = await api.post('/integrations/woocommerce/test', { storeUrl: wooUrl });
      if (res.data?.success) {
        toast.success(res.data.detail);
        onSuccess();
      } else {
        toast.error('Could not verify connection. Make sure the plugin is active.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'WooCommerce verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayConnect = async () => {
    if (!razorpayKey || !razorpaySecret) {
      toast.error('Please enter both Razorpay API Key and Secret.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/integrations/razorpay/connect', { 
        apiKey: razorpayKey, 
        apiSecret: razorpaySecret,
        storeUrl: detectedUrl 
      });
      toast.success('Razorpay Pages connected successfully!');
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to connect Razorpay Pages.');
    } finally {
      setLoading(false);
    }
  };

  if (platform === 'shopify') {
    return (
      <Card variant="gold" className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-[var(--color-primary-muted)] flex items-center justify-center border border-[var(--color-primary-border)]">
            <span className="text-[var(--text-gold)] text-lg font-bold">S</span>
          </div>
          <div>
            <Heading3 className="text-[var(--text-gold)]">Shopify Store Detected!</Heading3>
            <Caption>We found a Shopify site at {detectedUrl}</Caption>
          </div>
        </div>

        <p className="text-sm text-[var(--text-secondary)] mb-5">
          Connect your Shopify store in one click. We will sync orders and set up secure checkout monitoring.
        </p>

        <div className="space-y-4">
          <div>
            <Label className="mb-1 block">Shopify Domain</Label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={shopifyShop}
                onChange={(e) => setShopifyShop(e.target.value)}
                placeholder="storename.myshopify.com"
                className="flex-1 bg-[var(--bg-inset)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)]"
              />
              <Button 
                onClick={handleShopifyConnect} 
                disabled={loading}
                variant="gold"
              >
                {loading ? 'Redirecting...' : 'Connect Store'}
                <ExternalLink className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (platform === 'woocommerce') {
    return (
      <Card variant="default" className="p-6 border-purple-500/30">
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/40">
            <span className="text-purple-400 text-lg font-bold">W</span>
          </div>
          <div>
            <Heading3 className="text-purple-400">WooCommerce Store Detected!</Heading3>
            <Caption>We found WooCommerce files at {detectedUrl}</Caption>
          </div>
        </div>

        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Install the Flowshield AI WordPress plugin to automatically monitor transactions.
        </p>

        <div className="bg-[var(--bg-inset)] rounded-[var(--radius-md)] p-4 mb-5 border border-[var(--border-default)] text-sm space-y-3">
          <div className="flex items-start space-x-2">
            <span className="bg-purple-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs mt-0.5">1</span>
            <span className="text-gray-300">
              Download the official <a href="#" onClick={(e) => { e.preventDefault(); toast.success("Downloading flowshield-woocommerce.zip (Simulated)"); }} className="text-purple-400 font-semibold underline inline-flex items-center">Flowshield Plugin .zip <Download className="h-3 w-3 ml-1" /></a>
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="bg-purple-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs mt-0.5">2</span>
            <span className="text-gray-300">Go to your WordPress Admin Dashboard &rarr; <b>Plugins</b> &rarr; <b>Add New</b> &rarr; <b>Upload Plugin</b>.</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="bg-purple-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs mt-0.5">3</span>
            <span className="text-gray-300">Activate the plugin. Your transactions will stream immediately!</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button 
            onClick={handleWooTest} 
            disabled={loading}
            variant="gold"
          >
            {loading ? 'Testing...' : 'Test Connection'}
          </Button>
          <button onClick={onFallback} className="text-[var(--text-muted)] hover:text-white text-xs underline cursor-pointer">
            Or configure manually
          </button>
        </div>
      </Card>
    );
  }

  if (platform === 'razorpay_pages') {
    return (
      <Card variant="gold" className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-[var(--color-primary-muted)] flex items-center justify-center border border-[var(--color-primary-border)]">
            <span className="text-[var(--text-gold)] text-lg font-bold">R</span>
          </div>
          <div>
            <Heading3 className="text-[var(--text-gold)]">Razorpay Pages Detected!</Heading3>
            <Caption>Target host: {detectedUrl}</Caption>
          </div>
        </div>

        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Connect your Razorpay account via API Keys to track checkout frauds. We never store raw balance credentials.
        </p>

        <div className="space-y-4 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Razorpay Key ID</label>
              <input
                type="text"
                value={razorpayKey}
                onChange={(e) => setRazorpayKey(e.target.value)}
                placeholder="rzp_live_..."
                className="w-full bg-[var(--bg-inset)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Razorpay Secret</label>
              <input
                type="password"
                value={razorpaySecret}
                onChange={(e) => setRazorpaySecret(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[var(--bg-inset)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button 
            onClick={handleRazorpayConnect} 
            disabled={loading}
            variant="gold"
          >
            {loading ? 'Connecting...' : 'Connect Razorpay'}
          </Button>
          <button onClick={onFallback} className="text-[var(--text-muted)] hover:text-white text-xs underline cursor-pointer">
            Or configure manually
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="default" className="p-6">
      <div className="flex items-start space-x-3 mb-4">
        <div className="h-10 w-10 rounded-lg bg-[var(--bg-inset)] flex items-center justify-center border border-[var(--border-default)]">
          <AlertCircle className="h-5 w-5 text-[var(--text-gold)]" />
        </div>
        <div>
          <Heading3 className="text-white">No Instant Connector Found</Heading3>
          <Caption>Auto-detection completed for {detectedUrl}</Caption>
        </div>
      </div>

      <p className="text-sm text-[var(--text-secondary)] mb-5">
        We don't have a 1-click connector for this platform yet. No worries — you can connect any website in under 2 minutes using our manual snippet!
      </p>

      <Button 
        onClick={onFallback} 
        variant="gold"
        size="lg"
      >
        <span>Show me the 2-minute setup</span>
        <ArrowRight className="h-4 w-4 ml-1.5" />
      </Button>
    </Card>
  );
}
