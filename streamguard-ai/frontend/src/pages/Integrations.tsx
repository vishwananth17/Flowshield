import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/services/api';
import ConnectStoreFlow from '@/components/integrations/ConnectStoreFlow';
import DeveloperFlow from '@/components/integrations/DeveloperFlow';
import { 
  Plug2, 
  Code, 
  Trash2,
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

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/integrations');
      setIntegrations(res.data);
    } catch (err: any) {
      toast.error('Failed to fetch connected integrations.');
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-left font-body">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800 pb-4 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Integrations Hub</h1>
          <p className="text-zinc-400 text-xs mt-1">Connect payment gateways, e-commerce stores, and fraud webhooks.</p>
        </div>
      </div>

      {/* Path Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setActivePath('no_code')}
          className={`p-6 rounded-lg border text-left transition-colors ${
            activePath === 'no_code'
              ? 'bg-zinc-950 border-white text-white'
              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 rounded bg-black border border-zinc-800 text-white">
              <Plug2 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-base">No-Code Store Connection</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Connect Shopify, WooCommerce, Razorpay, or Cashfree stores automatically in under 60 seconds without code.
          </p>
        </button>

        <button
          onClick={() => setActivePath('developer')}
          className={`p-6 rounded-lg border text-left transition-colors ${
            activePath === 'developer'
              ? 'bg-zinc-950 border-white text-white'
              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 rounded bg-black border border-zinc-800 text-white">
              <Code className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-base">Developer Custom API</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Embed JavaScript monitoring tags or integrate sub-100ms Python/Node REST API endpoints directly into your checkout.
          </p>
        </button>
      </div>

      {/* Connection Flow Sub-components */}
      {activePath === 'no_code' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
          <ConnectStoreFlow onConnected={fetchIntegrations} />
        </div>
      )}

      {activePath === 'developer' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
          <DeveloperFlow />
        </div>
      )}

      {/* Connected Stores Directory */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="border-b border-zinc-800 bg-black p-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Connected Stores ({integrations.length})</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchIntegrations}
            className="bg-black border-zinc-800 text-zinc-300 hover:text-white text-xs font-mono"
          >
            Refresh List
          </Button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="py-8 text-center text-zinc-500 font-mono text-xs">Fetching connected stores...</div>
          ) : integrations.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 font-mono text-xs">
              No store connections active. Connect your first store above.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {integrations.map((item) => (
                <div key={item.id} className="py-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-white">{item.store_name}</span>
                      <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-black border border-zinc-800 text-zinc-300">
                        {item.platform}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {getMethodLabel(item.connection_method)}
                      </span>
                    </div>
                    {item.store_url && (
                      <p className="text-xs font-mono text-zinc-500 mt-1">{item.store_url}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="text-[10px] font-mono uppercase text-white bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded">
                      {item.status}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDisconnect(item.id)}
                      className="text-zinc-400 hover:text-white hover:bg-zinc-900 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
