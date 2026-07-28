import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/services/api';
import { 
  ShieldCheck, 
  ExternalLink, 
  CheckCircle2, 
  Zap, 
  Store,
  RefreshCw,
  Loader2
} from 'lucide-react';

interface ShopifyEmbeddedAppProps {
  initialShopDomain?: string;
  onConnectionSuccess?: () => void;
}

export default function ShopifyEmbeddedApp({ 
  initialShopDomain = '',
  onConnectionSuccess 
}: ShopifyEmbeddedAppProps) {
  const [shopDomain, setShopDomain] = useState(initialShopDomain);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [webhooksActive, setWebhooksActive] = useState(false);

  // Check if running inside Shopify Admin iFrame (App Bridge context)
  const isEmbeddedInShopify = typeof window !== 'undefined' && window.parent !== window;

  const handleStartOAuth = async () => {
    if (!shopDomain.trim()) {
      toast.error('Please enter your Shopify store domain.');
      return;
    }
    setLoading(true);
    try {
      let clean = shopDomain.trim().toLowerCase();
      if (clean.startsWith('https://')) clean = clean.replace('https://', '');
      if (clean.startsWith('http://')) clean = clean.replace('http://', '');
      clean = clean.replace(/\/$/, '');
      if (!clean.endsWith('.myshopify.com')) {
        clean = `${clean}.myshopify.com`;
      }

      const res = await api.get(`/integrations/shopify/partner/oauth/start?shop=${encodeURIComponent(clean)}`);
      if (res.data?.auth_url) {
        toast.success('Redirecting to Shopify Admin OAuth Authorization...');
        window.location.href = res.data.auth_url;
      } else {
        toast.error('Failed to generate Shopify OAuth URL.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'OAuth launch failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0C1425] border border-emerald-500/20 rounded-2xl p-6 shadow-2xl space-y-6 text-white">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-display">Shopify App Bridge Integration</h2>
            <p className="text-xs text-gray-400">Production OAuth 2.0 & Automated Webhook Subscriptions</p>
          </div>
        </div>
        {isEmbeddedInShopify && (
          <div className="flex items-center space-x-2 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
            <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-[10px] font-bold text-purple-400 uppercase">Embedded in Admin</span>
          </div>
        )}
      </div>

      {/* Input Form & OAuth Action */}
      <div className="space-y-4">
        <label className="block text-xs font-semibold text-gray-300">
          Shopify Store Domain (.myshopify.com)
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={shopDomain}
            onChange={(e) => setShopDomain(e.target.value)}
            placeholder="e.g. your-store.myshopify.com"
            className="flex-1 bg-[#111D35] border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-all"
          />
          <Button
            disabled={loading}
            onClick={handleStartOAuth}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 flex items-center justify-center space-x-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 fill-black" />}
            <span>Install App (1-Click OAuth)</span>
          </Button>
        </div>
      </div>

      {/* Feature Bullet Points */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="bg-[#111D35]/50 border border-gray-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
            <CheckCircle2 className="h-4 w-4" />
            <span>Automated Webhooks</span>
          </div>
          <p className="text-[11px] text-gray-400">
            Auto-subscribes to <code className="text-gray-300">orders/create</code> via GraphQL Admin API.
          </p>
        </div>

        <div className="bg-[#111D35]/50 border border-gray-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs">
            <ShieldCheck className="h-4 w-4" />
            <span>HMAC Signed</span>
          </div>
          <p className="text-[11px] text-gray-400">
            Cryptographic SHA-256 validation on every incoming event.
          </p>
        </div>

        <div className="bg-[#111D35]/50 border border-gray-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs">
            <Zap className="h-4 w-4" />
            <span>Decoupled ACK</span>
          </div>
          <p className="text-[11px] text-gray-400">
            Returns HTTP 202 to Shopify in &lt;50ms using Redis Stream queues.
          </p>
        </div>
      </div>
    </div>
  );
}
