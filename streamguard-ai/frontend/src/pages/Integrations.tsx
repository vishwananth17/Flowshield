import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/services/api';
import ConnectStoreFlow from '@/components/integrations/ConnectStoreFlow';
import DeveloperFlow from '@/components/integrations/DeveloperFlow';
import { 
  Plug2, 
  Code, 
  HelpCircle, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Trash2, 
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Integration {
  id: number;
  platform: string;
  connection_method: 'no_code_oauth' | 'no_code_plugin' | 'no_code_apikey' | 'script';
  store_name: string;
  store_url: string;
  status: string;
  created_at: string;
  last_event_at?: string;
}

export default function Integrations() {
  const [activePath, setActivePath] = useState<'no_code' | 'developer' | null>('no_code');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Fetch connected integrations
  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/integrations');
      setIntegrations(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.warn('Failed to fetch connected integrations', err);
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleDisconnect = async (id: number) => {
    if (!confirm('Are you sure you want to disconnect this store? Order events will no longer be analyzed.')) {
      return;
    }
    try {
      await api.delete(`/integrations/${id}`);
      toast.success('Store disconnected successfully.');
      fetchIntegrations();
    } catch (err: any) {
      toast.error('Failed to disconnect store.');
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'no_code_oauth':
        return 'No-Code OAuth';
      case 'no_code_plugin':
        return 'Plugin Integration';
      case 'no_code_apikey':
        return 'Connected API Card';
      case 'script':
        return 'Monitoring Tag';
      default:
        return 'Manual';
    }
  };

  const getPlatformColors = (platform: string) => {
    switch (platform) {
      case 'shopify':
        return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' };
      case 'woocommerce':
        return { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' };
      case 'razorpay_pages':
        return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' };
      default:
        return { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' };
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Integrations</h1>
          <p className="text-sm text-gray-400 mt-1">
            Connect your shop, payment page, or custom app to monitor checkout transactions.
          </p>
        </div>
        
        {/* Info Tooltip Trigger */}
        <button 
          onClick={() => setShowTooltip(!showTooltip)} 
          className="flex items-center space-x-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5 self-start md:self-auto transition-colors"
        >
          <HelpCircle className="h-4 w-4" />
          <span>How does 'Connect Your Store' work?</span>
          {showTooltip ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Tooltip Content */}
      {showTooltip && (
        <div className="bg-[#111827] border border-blue-500/20 rounded-xl p-5 text-sm text-gray-300 space-y-3 shadow-lg">
          <div className="flex items-center space-x-2 text-blue-400 font-semibold">
            <Info className="h-4 w-4" />
            <span>Honest & Secure Onboarding Info</span>
          </div>
          <ul className="list-disc pl-5 space-y-2 text-xs leading-relaxed text-gray-400">
            <li>
              <b>Supported Platforms:</b> For Shopify, WooCommerce, and Razorpay, we provide secure zero-code connectors.
            </li>
            <li>
              <b>Unknown/Unsupported Sites:</b> If our detector doesn't find a platform tag, we route you to the manual SDK block code or the lightweight client monitoring tag.
            </li>
            <li>
              <b>Data Isolation & Security:</b> Flowshield AI only accesses checkout metadata (amounts, device indicators) needed for fraud score analytics. We do not access customer logins or credentials.
            </li>
          </ul>
        </div>
      )}

      {/* Two Path Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card A: Connect Your Store */}
        <div 
          onClick={() => setActivePath('no_code')}
          className={`cursor-pointer rounded-xl p-6 border transition-all duration-200 ${
            activePath === 'no_code' 
              ? 'bg-[#111827] border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
              : 'bg-[#111827]/60 border-[#1F2937] hover:border-[#374151]'
          }`}
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className={`p-2 rounded-lg ${activePath === 'no_code' ? 'bg-blue-600/20' : 'bg-gray-800'}`}>
              <Plug2 className={`h-5 w-5 ${activePath === 'no_code' ? 'text-blue-400' : 'text-gray-400'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-white">Connect Your Store</h3>
              <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">NO CODE NEEDED</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Just paste your website URL. We will scan platform headers and automatically link Shopify, WooCommerce, and Razorpay Pages.
          </p>
        </div>

        {/* Card B: Developer Integration */}
        <div 
          onClick={() => setActivePath('developer')}
          className={`cursor-pointer rounded-xl p-6 border transition-all duration-200 ${
            activePath === 'developer' 
              ? 'bg-[#111827] border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
              : 'bg-[#111827]/60 border-[#1F2937] hover:border-[#374151]'
          }`}
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className={`p-2 rounded-lg ${activePath === 'developer' ? 'bg-blue-600/20' : 'bg-gray-800'}`}>
              <Code className={`h-5 w-5 ${activePath === 'developer' ? 'text-blue-400' : 'text-gray-400'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-white">Developer Integration</h3>
              <span className="text-[10px] text-gray-400 font-bold bg-gray-800 border border-gray-700 px-2 py-0.5 rounded">API & SDK</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Connect using server-side SDKs (Node.js, Python, PHP), standard cURL endpoints, or checkout monitoring tags.
          </p>
        </div>
      </div>

      {/* Expanded Flows */}
      <div className="mt-8 border-t border-[#1F2937] pt-8">
        {activePath === 'no_code' ? (
          <ConnectStoreFlow 
            onFallback={() => setActivePath('developer')} 
            onSuccess={fetchIntegrations} 
          />
        ) : (
          <DeveloperFlow />
        )}
      </div>

      {/* Connected Integrations List */}
      <div className="mt-12 space-y-4">
        <h2 className="text-lg font-semibold text-white">Connected Stores</h2>
        {integrations.length === 0 ? (
          <div className="bg-[#111827]/30 border border-dashed border-[#1F2937] rounded-xl p-8 text-center text-gray-500">
            No connected storefronts or active integrations found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration) => {
              const colors = getPlatformColors(integration.platform);
              return (
                <div 
                  key={integration.id} 
                  className="bg-[#111827] border border-[#1F2937] rounded-xl p-5 space-y-4 flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${colors.bg} ${colors.text} ${colors.border}`}>
                          {integration.platform.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-gray-400 bg-gray-800 border border-gray-700 px-2 py-0.5 rounded">
                          {getMethodLabel(integration.connection_method)}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-200 text-sm">
                        {integration.store_name || 'Active Store'}
                      </h4>
                      {integration.store_url && (
                        <a 
                          href={integration.store_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-xs text-blue-400 hover:underline block truncate max-w-[200px]"
                        >
                          {integration.store_url}
                        </a>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>{integration.status}</span>
                    </div>
                  </div>

                  <div className="border-t border-[#1F2937] pt-4 flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3.5 w-3.5 text-gray-500" />
                      <span>
                        {integration.last_event_at 
                          ? `Last event: ${new Date(integration.last_event_at).toLocaleTimeString()}`
                          : 'No events received yet'}
                      </span>
                    </div>

                    <button 
                      onClick={() => handleDisconnect(integration.id)}
                      className="text-red-400 hover:text-red-300 font-medium flex items-center space-x-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Disconnect</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
