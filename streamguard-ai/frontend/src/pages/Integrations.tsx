import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Heading1, Heading3, Label, Caption } from '@/components/ui/Typography';
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
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--border-subtle)] pb-4 gap-4">
        <div>
          <Heading1>Integrations Hub</Heading1>
          <Caption className="mt-1 block">Connect payment gateways, e-commerce stores, and fraud webhooks.</Caption>
        </div>
      </div>

      {/* Path Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setActivePath('no_code')}
          className={`p-6 rounded-[var(--radius-lg)] border text-left transition-colors cursor-pointer ${
            activePath === 'no_code'
              ? 'bg-[var(--bg-surface)] border-[var(--border-gold)] text-white shadow-[var(--shadow-gold)] bg-[var(--gradient-card)]'
              : 'bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
          }`}
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 rounded bg-[var(--bg-inset)] border border-[var(--border-default)] text-[var(--text-gold)]">
              <Plug2 className="h-5 w-5" />
            </div>
            <Heading3 className="text-white text-base">No-Code Store Connection</Heading3>
          </div>
          <Caption className="leading-relaxed block">
            Connect Shopify, WooCommerce, Razorpay, or Cashfree stores automatically in under 60 seconds without code.
          </Caption>
        </button>

        <button
          onClick={() => setActivePath('developer')}
          className={`p-6 rounded-[var(--radius-lg)] border text-left transition-colors cursor-pointer ${
            activePath === 'developer'
              ? 'bg-[var(--bg-surface)] border-[var(--border-gold)] text-white shadow-[var(--shadow-gold)] bg-[var(--gradient-card)]'
              : 'bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
          }`}
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 rounded bg-[var(--bg-inset)] border border-[var(--border-default)] text-[var(--text-gold)]">
              <Code className="h-5 w-5" />
            </div>
            <Heading3 className="text-white text-base">Developer Custom API</Heading3>
          </div>
          <Caption className="leading-relaxed block">
            Embed JavaScript monitoring tags or integrate sub-100ms Python/Node REST API endpoints directly into your checkout.
          </Caption>
        </button>
      </div>

      {/* Connection Flow Sub-components */}
      {activePath === 'no_code' && (
        <Card variant="default">
          <ConnectStoreFlow onConnected={fetchIntegrations} />
        </Card>
      )}

      {activePath === 'developer' && (
        <Card variant="default">
          <DeveloperFlow />
        </Card>
      )}

      {/* Connected Stores Directory */}
      <Card variant="default" padding="none" className="overflow-hidden">
        <div className="border-b border-[var(--border-default)] bg-[var(--bg-inset)] py-3 px-5 flex items-center justify-between">
          <span className="text-white text-sm font-bold">CONNECTED STORES ({integrations.length})</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchIntegrations}
          >
            Refresh List
          </Button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-8 text-center text-[var(--text-muted)] font-mono text-xs">Fetching connected stores...</div>
          ) : integrations.length === 0 ? (
            <div className="py-8 text-center text-[var(--text-muted)] font-mono text-xs">
              No store connections active. Connect your first store above.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {integrations.map((item) => (
                <div key={item.id} className="py-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-white">{item.store_name}</span>
                      <Badge variant="outline">
                        {item.platform.toUpperCase()}
                      </Badge>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">
                        {getMethodLabel(item.connection_method)}
                      </span>
                    </div>
                    {item.store_url && (
                      <p className="text-xs font-mono text-[var(--text-muted)] mt-1">{item.store_url}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-4">
                    <Badge variant="outline">
                      {item.status.toUpperCase()}
                    </Badge>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => handleDisconnect(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
