import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/services/api';
import { 
  CheckCircle2, 
  ExternalLink, 
  Download, 
  ArrowRight,
  ShieldCheck,
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

  // --------------------------------------------------------
  // Shopify Connect Trigger
  // --------------------------------------------------------
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

  // --------------------------------------------------------
  // WooCommerce Connect Test
  // --------------------------------------------------------
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

  // --------------------------------------------------------
  // Razorpay Pages Connect
  // --------------------------------------------------------
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

  // --------------------------------------------------------
  // Shopify Layout
  // --------------------------------------------------------
  if (platform === 'shopify') {
    return (
      <div className="bg-[#111827] border border-emerald-500/30 rounded-xl p-6 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
            <span className="text-emerald-400 text-lg font-bold">S</span>
          </div>
          <div>
            <h3 className="font-semibold text-lg text-emerald-400">Shopify Store Detected!</h3>
            <p className="text-xs text-gray-400">We found a Shopify site at {detectedUrl}</p>
          </div>
        </div>

        <p className="text-sm text-gray-300 mb-5">
          Connect your Shopify store in one click. We will sync orders and set up secure checkout monitoring.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Shopify Domain</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={shopifyShop}
                onChange={(e) => setShopifyShop(e.target.value)}
                placeholder="storename.myshopify.com"
                className="flex-1 bg-[#1F2937] border border-[#374151] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              <Button 
                onClick={handleShopifyConnect} 
                disabled={loading}
                className="bg-[#2c6ecb] hover:bg-[#1a5bb8] text-white flex items-center space-x-1"
              >
                {loading ? 'Redirecting...' : 'Connect Store'}
                <ExternalLink className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------
  // WooCommerce Layout
  // --------------------------------------------------------
  if (platform === 'woocommerce') {
    return (
      <div className="bg-[#111827] border border-purple-500/30 rounded-xl p-6 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/40">
            <span className="text-purple-400 text-lg font-bold">W</span>
          </div>
          <div>
            <h3 className="font-semibold text-lg text-purple-400">WooCommerce Store Detected!</h3>
            <p className="text-xs text-gray-400">We found WooCommerce files at {detectedUrl}</p>
          </div>
        </div>

        <p className="text-sm text-gray-300 mb-4">
          Install the Flowshield AI WordPress plugin to automatically monitor transactions.
        </p>

        <div className="bg-[#1F2937] rounded-lg p-4 mb-5 border border-[#374151] text-sm space-y-3">
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
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {loading ? 'Testing Connection...' : 'Test Connection'}
          </Button>
          <button onClick={onFallback} className="text-gray-400 hover:text-white text-xs underline">
            Or configure manually
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------
  // Razorpay Pages Layout
  // --------------------------------------------------------
  if (platform === 'razorpay_pages') {
    return (
      <div className="bg-[#111827] border border-blue-500/30 rounded-xl p-6 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/40">
            <span className="text-blue-400 text-lg font-bold">R</span>
          </div>
          <div>
            <h3 className="font-semibold text-lg text-blue-400">Razorpay Pages Detected!</h3>
            <p className="text-xs text-gray-400">Target host: {detectedUrl}</p>
          </div>
        </div>

        <p className="text-sm text-gray-300 mb-4">
          Connect your Razorpay account via API Keys to track checkout frauds. We never store raw balance credentials.
        </p>

        <div className="space-y-4 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Razorpay Key ID</label>
              <input
                type="text"
                value={razorpayKey}
                onChange={(e) => setRazorpayKey(e.target.value)}
                placeholder="rzp_live_..."
                className="w-full bg-[#1F2937] border border-[#374151] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Razorpay Secret</label>
              <input
                type="password"
                value={razorpaySecret}
                onChange={(e) => setRazorpaySecret(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#1F2937] border border-[#374151] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button 
            onClick={handleRazorpayConnect} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Connecting...' : 'Connect Razorpay'}
          </Button>
          <button onClick={onFallback} className="text-gray-400 hover:text-white text-xs underline">
            Or configure manually
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------
  // Unsupported / Unknown Fallback Layout
  // --------------------------------------------------------
  return (
    <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
      <div className="flex items-start space-x-3 mb-4">
        <div className="h-10 w-10 rounded-lg bg-gray-500/20 flex items-center justify-center border border-[#374151]">
          <AlertCircle className="h-5 w-5 text-gray-400" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-gray-200">No Instant Connector Found</h3>
          <p className="text-xs text-gray-400">Auto-detection completed for {detectedUrl}</p>
        </div>
      </div>

      <p className="text-sm text-gray-300 mb-5">
        We don't have a 1-click connector for this platform yet. No worries — you can connect any website in under 2 minutes using our manual snippet!
      </p>

      <Button 
        onClick={onFallback} 
        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-1"
      >
        <span>Show me the 2-minute setup</span>
        <ArrowRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
