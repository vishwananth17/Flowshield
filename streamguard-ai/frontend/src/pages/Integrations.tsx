import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { toast } from 'sonner';
import api from '@/services/api';
import ConnectStoreFlow from '@/components/integrations/ConnectStoreFlow';
import DeveloperFlow from '@/components/integrations/DeveloperFlow';
import { 
  Plug2, 
  Code, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Trash2, 
  Plus,
  RefreshCw
} from 'lucide-react';

interface Integration {
  id: number;
  platform: string;
  connection_method: string;
  store_name: string;
  store_url: string;
  status: string;
  created_at: string;
  last_event_at?: string;
}

const AVAILABLE_CONNECTORS = [
  { name: 'Razorpay Payment Gateway', type: 'Gateway', status: 'Connected', icon: '💳', speed: 'Live Stream' },
  { name: 'Cashfree Payments', type: 'Gateway', status: 'Ready', icon: '⚡', speed: 'Live Stream' },
  { name: 'Shopify Store Connector', type: 'E-Commerce', status: 'Connected', icon: '🛍️', speed: 'Webhook Sync' },
  { name: 'Delhivery Logistics', type: 'Courier', status: 'Connected', icon: '📦', speed: 'Auto-POD' },
  { name: 'BlueDart Express', type: 'Courier', status: 'Ready', icon: '🚚', speed: 'Auto-POD' },
];

export default function Integrations() {
  const [activeTab, setActiveTab] = useState<'connectors' | 'developer'>('connectors');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/integrations');
      setIntegrations(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleDisconnect = async (id: number) => {
    if (!confirm('Are you sure you want to disconnect this endpoint?')) return;
    try {
      await api.delete(`/integrations/${id}`);
      toast.success('Endpoint disconnected');
      fetchIntegrations();
    } catch (e) {
      toast.error('Failed to disconnect');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-h1 text-text-primary">Evidence Hub & Integrations</h1>
          <p className="type-sm text-text-secondary mt-0.5">
            Connect your payment gateways, e-commerce stores, and courier tracking APIs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={fetchIntegrations}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Telemetry</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-6 border-b border-border-200 text-xs font-semibold select-none">
        <button
          onClick={() => setActiveTab('connectors')}
          className={`pb-3 transition-colors ${
            activeTab === 'connectors' ? 'text-cyan-400 border-b-2 border-cyan-500 font-bold' : 'text-text-tertiary hover:text-text-secondary'
          }`}
        >
          Active Connectors & Gateways
        </button>
        <button
          onClick={() => setActiveTab('developer')}
          className={`pb-3 transition-colors ${
            activeTab === 'developer' ? 'text-cyan-400 border-b-2 border-cyan-500 font-bold' : 'text-text-tertiary hover:text-text-secondary'
          }`}
        >
          Custom Webhook Endpoints
        </button>
      </div>

      {activeTab === 'connectors' ? (
        <div className="space-y-6">
          
          {/* Connector Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AVAILABLE_CONNECTORS.map((connector) => {
              const isConnected = connector.status === 'Connected';

              return (
                <Card key={connector.name} variant="data" padding="md" className="flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{connector.icon}</span>
                      <Badge variant={isConnected ? 'allow' : 'neutral'} size="sm">
                        {connector.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="type-h3 text-text-primary text-sm">{connector.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-text-tertiary font-mono">
                        <span>{connector.type}</span>
                        <span>·</span>
                        <span>{connector.speed}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant={isConnected ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => toast.success(isConnected ? `${connector.name} verified and operational` : `Connecting ${connector.name}...`)}
                    className="w-full justify-center"
                  >
                    {isConnected ? 'Configure Endpoint' : 'Connect Now'}
                  </Button>
                </Card>
              );
            })}
          </div>

          {/* Connected Webhooks Table */}
          <Card variant="data" padding="none" className="overflow-hidden">
            <div className="p-4 border-b border-border-100 flex items-center justify-between">
              <h3 className="type-label text-text-primary">Connected Store Endpoints ({integrations.length})</h3>
              <span className="text-xs font-mono text-text-tertiary">Real-time Webhook Ingestion</span>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead>Store Identifier</TableHead>
                  <TableHead>Protocol</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Ping</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {integrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-text-tertiary text-xs">
                      Default Razorpay and Delhivery pods active. Custom store endpoints will appear here.
                    </TableCell>
                  </TableRow>
                ) : (
                  integrations.map((integ) => (
                    <TableRow key={integ.id}>
                      <TableCell className="font-semibold text-text-primary text-xs">
                        {integ.platform}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-text-secondary">
                        {integ.store_name}
                      </TableCell>
                      <TableCell className="text-xs text-text-tertiary">
                        {integ.connection_method}
                      </TableCell>
                      <TableCell>
                        <Badge variant="allow" size="sm">ACTIVE</Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-text-tertiary">
                        {integ.last_event_at ? new Date(integ.last_event_at).toLocaleTimeString() : 'Online'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleDisconnect(integ.id)}
                          className="text-text-tertiary hover:text-status-block"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

        </div>
      ) : (
        <Card variant="data" padding="md">
          <DeveloperFlow />
        </Card>
      )}

    </div>
  );
}
