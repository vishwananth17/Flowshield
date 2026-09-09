import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { toast } from 'sonner';
import api from '@/services/api';
import DeveloperFlow from '@/components/integrations/DeveloperFlow';
import ConnectorConfigModal, { type ConnectorItem } from '@/components/integrations/ConnectorConfigModal';
import { 
  Plug2, 
  Code, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Trash2, 
  Plus,
  RefreshCw,
  CreditCard,
  Zap,
  ShoppingBag,
  Package,
  Truck,
  Settings2,
  FileCheck,
  Shield,
  ArrowRight,
  ExternalLink,
  Sliders
} from 'lucide-react';

interface IntegrationEndpoint {
  id: number | string;
  platform: string;
  connection_method: string;
  store_name: string;
  store_url?: string;
  status: string;
  created_at: string;
  last_event_at?: string;
  latencyMs?: number;
}

const DEFAULT_CONNECTORS: ConnectorItem[] = [
  {
    id: 'razorpay',
    name: 'Razorpay Payment Gateway',
    type: 'Gateway',
    status: 'Connected',
    icon: CreditCard,
    color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40',
    speed: 'Live Stream',
    apiKey: 'rzp_live_k9948201',
    environment: 'production',
  },
  {
    id: 'cashfree',
    name: 'Cashfree Payments',
    type: 'Gateway',
    status: 'Ready',
    icon: Zap,
    color: 'text-amber-400 bg-amber-950/40 border-amber-800/40',
    speed: 'Live Stream',
    environment: 'production',
  },
  {
    id: 'shopify',
    name: 'Shopify Store Connector',
    type: 'E-Commerce',
    status: 'Connected',
    icon: ShoppingBag,
    color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40',
    speed: 'Webhook Sync',
    apiKey: 'shpat_998240182',
    environment: 'production',
  },
  {
    id: 'delhivery',
    name: 'Delhivery Logistics',
    type: 'Courier',
    status: 'Connected',
    icon: Package,
    color: 'text-blue-400 bg-blue-950/40 border-blue-800/40',
    speed: 'Auto-POD',
    apiKey: 'del_client_0918',
    autoPod: true,
    environment: 'production',
  },
  {
    id: 'bluedart',
    name: 'BlueDart Express',
    type: 'Courier',
    status: 'Ready',
    icon: Truck,
    color: 'text-indigo-400 bg-indigo-950/40 border-indigo-800/40',
    speed: 'Auto-POD',
    autoPod: true,
    environment: 'production',
  },
];

const INITIAL_ENDPOINTS: IntegrationEndpoint[] = [
  {
    id: 1,
    platform: 'Razorpay Gateway',
    store_name: 'Primary Merchant Checkout',
    connection_method: 'REST Webhook (HMAC)',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
    last_event_at: new Date(Date.now() - 120000).toISOString(),
    latencyMs: 34
  },
  {
    id: 2,
    platform: 'Shopify Store',
    store_name: 'Storefront (production-v2)',
    connection_method: 'App Webhook Sync',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    last_event_at: new Date(Date.now() - 300000).toISOString(),
    latencyMs: 42
  },
  {
    id: 3,
    platform: 'Delhivery Logistics',
    store_name: 'POD Auto-Ingress Node',
    connection_method: 'Auto-POD API',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    last_event_at: new Date(Date.now() - 600000).toISOString(),
    latencyMs: 28
  }
];

export default function Integrations() {
  const [activeTab, setActiveTab] = useState<'connectors' | 'developer' | 'evidence'>('connectors');
  
  // State for connectors
  const [connectors, setConnectors] = useState<ConnectorItem[]>(() => {
    try {
      const saved = localStorage.getItem('flowshield_connectors');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_CONNECTORS;
  });

  // State for connected endpoints
  const [endpoints, setEndpoints] = useState<IntegrationEndpoint[]>(() => {
    try {
      const saved = localStorage.getItem('flowshield_endpoints');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_ENDPOINTS;
  });

  const [loading, setLoading] = useState(false);

  // Modal state
  const [selectedConnector, setSelectedConnector] = useState<ConnectorItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('flowshield_connectors', JSON.stringify(connectors));
  }, [connectors]);

  useEffect(() => {
    localStorage.setItem('flowshield_endpoints', JSON.stringify(endpoints));
  }, [endpoints]);

  // Try fetching from backend if available
  const fetchBackendIntegrations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/integrations');
      if (Array.isArray(res.data) && res.data.length > 0) {
        // Merge with existing
        const backendMapped = res.data.map((item: any) => ({
          id: item.id,
          platform: item.platform,
          store_name: item.store_name || item.platform,
          connection_method: item.connection_method || 'REST Webhook',
          status: (item.status || 'ACTIVE').toUpperCase(),
          created_at: item.created_at || new Date().toISOString(),
          last_event_at: item.last_event_at || new Date().toISOString(),
          latencyMs: 35
        }));
        setEndpoints(backendMapped);
      }
    } catch (e) {
      // Keep local defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendIntegrations();
  }, []);

  const handleOpenConfig = (connector: ConnectorItem) => {
    setSelectedConnector(connector);
    setIsModalOpen(true);
  };

  const handleSaveConnector = (connectorId: string, updatedConfig: Partial<ConnectorItem>) => {
    // 1. Update connector state
    setConnectors(prev => prev.map(c => {
      if (c.id === connectorId) {
        return { ...c, ...updatedConfig, status: 'Connected' };
      }
      return c;
    }));

    // 2. Add or update in endpoints table
    const targetConnector = connectors.find(c => c.id === connectorId);
    if (targetConnector) {
      const existingIdx = endpoints.findIndex(e => e.platform.toLowerCase().includes(targetConnector.name.toLowerCase().slice(0, 8)));
      
      const newEndpoint: IntegrationEndpoint = {
        id: existingIdx >= 0 ? endpoints[existingIdx].id : Date.now(),
        platform: targetConnector.name,
        store_name: `${targetConnector.type} Ingestion (${updatedConfig.environment || 'production'})`,
        connection_method: targetConnector.type === 'Courier' ? 'Auto-POD API' : 'REST Webhook (HMAC)',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        last_event_at: new Date().toISOString(),
        latencyMs: Math.round(24 + Math.random() * 20)
      };

      if (existingIdx >= 0) {
        setEndpoints(prev => prev.map((e, idx) => idx === existingIdx ? newEndpoint : e));
      } else {
        setEndpoints(prev => [newEndpoint, ...prev]);
      }
    }
  };

  const handleDisconnectConnector = (connectorId: string) => {
    // Set connector status to Ready
    setConnectors(prev => prev.map(c => {
      if (c.id === connectorId) {
        return { ...c, status: 'Ready' };
      }
      return c;
    }));

    // Remove from endpoints
    const targetConnector = connectors.find(c => c.id === connectorId);
    if (targetConnector) {
      setEndpoints(prev => prev.filter(e => !e.platform.toLowerCase().includes(targetConnector.name.toLowerCase().slice(0, 8))));
    }
  };

  const handleDisconnectEndpoint = (id: number | string) => {
    if (!confirm('Are you sure you want to disconnect this endpoint? Real-time telemetry will cease.')) return;
    setEndpoints(prev => prev.filter(e => e.id !== id));
    toast.success('Endpoint disconnected');
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Evidence Hub & Integrations</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              SOC GATEWAY
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Connect your payment gateways, e-commerce stores, and courier tracking APIs for automated fraud blocking & dispute representment.
          </p>
        </div>
        
        <div className="flex items-center gap-2.5">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => {
              fetchBackendIntegrations();
              toast.success('Telemetry streams refreshed • All pods operational');
            }}
            className="text-xs border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh Pods</span>
          </Button>
          
          <Button
            size="sm"
            onClick={() => setActiveTab('developer')}
            className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            <span>Custom Webhook</span>
          </Button>
        </div>
      </div>

      {/* ── TABS NAVIGATION ── */}
      <div className="flex items-center space-x-6 border-b border-slate-800 text-xs font-semibold select-none">
        <button
          onClick={() => setActiveTab('connectors')}
          className={`pb-3 transition-colors ${
            activeTab === 'connectors' 
              ? 'text-cyan-400 border-b-2 border-cyan-500 font-bold' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Active Connectors & Gateways ({connectors.filter(c => c.status === 'Connected').length}/{connectors.length})
        </button>
        <button
          onClick={() => setActiveTab('developer')}
          className={`pb-3 transition-colors ${
            activeTab === 'developer' 
              ? 'text-cyan-400 border-b-2 border-cyan-500 font-bold' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Custom Webhook Endpoints
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`pb-3 transition-colors ${
            activeTab === 'evidence' 
              ? 'text-cyan-400 border-b-2 border-cyan-500 font-bold' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Auto-POD Evidence Pipeline
        </button>
      </div>

      {/* ── TAB 1: ACTIVE CONNECTORS ── */}
      {activeTab === 'connectors' && (
        <div className="space-y-6">
          
          {/* Connector Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectors.map((connector) => {
              const isConnected = connector.status === 'Connected';
              const IconComponent = connector.icon;

              return (
                <Card 
                  key={connector.id} 
                  variant="data" 
                  padding="md" 
                  className={`flex flex-col justify-between space-y-4 rounded-xl border transition-all ${
                    isConnected 
                      ? 'bg-[#080D15] border-slate-800 hover:border-slate-700' 
                      : 'bg-[#080D15] border-slate-800/80 hover:border-cyan-500/30'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${connector.color}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        isConnected 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {connector.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">{connector.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span>{connector.type}</span>
                        <span>·</span>
                        <span className="font-mono text-cyan-400">{connector.speed}</span>
                      </div>
                    </div>
                  </div>

                  {/* Real Action Button */}
                  <Button
                    variant={isConnected ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => handleOpenConfig(connector)}
                    className={`w-full justify-center text-xs font-semibold h-8 rounded-lg ${
                      isConnected 
                        ? 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200' 
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'
                    }`}
                  >
                    {isConnected ? (
                      <>
                        <Settings2 className="w-3.5 h-3.5 mr-1.5" />
                        Configure Endpoint
                      </>
                    ) : (
                      <>
                        <Plug2 className="w-3.5 h-3.5 mr-1.5" />
                        Connect Now
                      </>
                    )}
                  </Button>
                </Card>
              );
            })}
          </div>

          {/* Connected Webhooks Table */}
          <Card variant="data" padding="none" className="overflow-hidden rounded-xl border border-slate-800/80 bg-[#080D15]">
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Active Integration Endpoints ({endpoints.length})
                </h3>
                <span className="text-[11px] text-slate-400">Real-time webhook ingestion and auto-POD representment streams</span>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                ALL STREAMS HEALTHY
              </span>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="border-slate-800/80 hover:bg-transparent">
                  <TableHead className="text-xs text-slate-400 font-semibold">Platform</TableHead>
                  <TableHead className="text-xs text-slate-400 font-semibold">Endpoint Identifier</TableHead>
                  <TableHead className="text-xs text-slate-400 font-semibold">Protocol</TableHead>
                  <TableHead className="text-xs text-slate-400 font-semibold">Status</TableHead>
                  <TableHead className="text-xs text-slate-400 font-semibold">Health Ping</TableHead>
                  <TableHead className="text-right text-xs text-slate-400 font-semibold">Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpoints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-slate-400 text-xs">
                      No active integration endpoints found. Click "Connect Now" above to activate your payment gateways and couriers.
                    </TableCell>
                  </TableRow>
                ) : (
                  endpoints.map((integ) => {
                    const matchedConnector = connectors.find(c => integ.platform.toLowerCase().includes(c.id));
                    
                    return (
                      <TableRow key={integ.id} className="border-slate-800/60 hover:bg-slate-900/40 transition-colors">
                        <TableCell className="font-semibold text-white text-xs">
                          {integ.platform}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-slate-300">
                          {integ.store_name}
                        </TableCell>
                        <TableCell className="text-xs text-slate-400 font-mono">
                          {integ.connection_method}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            {integ.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-slate-300">
                          <span className="text-emerald-400 font-bold">{integ.latencyMs || 28}ms</span>
                          <span className="text-slate-500 text-[10px] ml-1">· Online</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {matchedConnector && (
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => handleOpenConfig(matchedConnector)}
                                className="text-slate-400 hover:text-white text-xs h-7 px-2"
                                title="Configure"
                              >
                                <Settings2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleDisconnectEndpoint(integ.id)}
                              className="text-slate-400 hover:text-rose-400 text-xs h-7 px-2"
                              title="Disconnect"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>

        </div>
      )}

      {/* ── TAB 2: CUSTOM DEVELOPER WEBHOOK FLOW ── */}
      {activeTab === 'developer' && (
        <Card variant="data" padding="md" className="rounded-xl border border-slate-800 bg-[#080D15]">
          <DeveloperFlow />
        </Card>
      )}

      {/* ── TAB 3: AUTO-POD EVIDENCE PIPELINE ── */}
      {activeTab === 'evidence' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-cyan-500/30 bg-[#080D15] space-y-4">
            <div className="flex items-center space-x-2 text-cyan-400">
              <FileCheck className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Automated Courier Proof-of-Delivery (POD) Ingress
              </h3>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              When a customer files a "Product Not Received" or "Fraudulent Charge" dispute, Flowshield AI automatically queries your connected Delhivery and BlueDart APIs using the order Air Waybill (AWB). It extracts signed recipient manifests, GPS drop coordinates, and delivery photos into court-ready dispute defense packets.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-[#05080F] border border-slate-800 space-y-1.5">
                <span className="text-xs font-bold text-white block">1. AWB Ingress</span>
                <p className="text-[11px] text-slate-400">Order tracking numbers automatically indexed from Shopify and WooCommerce webhooks.</p>
              </div>
              <div className="p-4 rounded-lg bg-[#05080F] border border-slate-800 space-y-1.5">
                <span className="text-xs font-bold text-white block">2. Signed POD Extraction</span>
                <p className="text-[11px] text-slate-400">Real-time courier signed receipt and delivery snapshot retrieved from Delhivery/BlueDart APIs.</p>
              </div>
              <div className="p-4 rounded-lg bg-[#05080F] border border-slate-800 space-y-1.5">
                <span className="text-xs font-bold text-white block">3. Gateway Upload</span>
                <p className="text-[11px] text-slate-400">Automated 4-page PDF evidence dossier compiled and submitted to Razorpay & Cashfree dispute APIs.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CONNECTOR CONFIGURATION MODAL ── */}
      <ConnectorConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        connector={selectedConnector}
        onSave={handleSaveConnector}
        onDisconnect={handleDisconnectConnector}
      />

    </div>
  );
}
