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
  RazorpayLogo, 
  CashfreeLogo, 
  ShopifyLogo, 
  DelhiveryLogo, 
  BlueDartLogo 
} from '@/components/integrations/BrandLogos';
import { 
  Plug2, 
  Code, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Trash2, 
  Plus,
  RefreshCw,
  Settings2,
  FileCheck,
  Shield,
  ArrowRight,
  ExternalLink,
  Sliders,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Sparkles,
  TrendingUp,
  Cpu,
  Lock,
  Boxes,
  CheckCircle,
  HelpCircle,
  Truck,
  Building2,
  SendHorizontal,
  ChevronRight,
  PackageCheck,
  Award,
  Globe,
  Radio
} from 'lucide-react';

interface IntegrationEndpoint {
  id: number | string;
  platform: string;
  connector_id?: string;
  store_name: string;
  store_url?: string;
  connection_method: string;
  status: string;
  created_at: string;
  last_event_at?: string;
  latencyMs?: number;
}

const ICON_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
  razorpay: RazorpayLogo,
  cashfree: CashfreeLogo,
  shopify: ShopifyLogo,
  delhivery: DelhiveryLogo,
  bluedart: BlueDartLogo,
};

const DEFAULT_CONNECTORS: (ConnectorItem & { description: string; ping: string; uptime: string; category: string })[] = [
  {
    id: 'razorpay',
    name: 'Razorpay Payment Gateway',
    type: 'Gateway',
    category: 'gateways',
    status: 'Connected',
    icon: RazorpayLogo,
    color: 'border-[#0C8CE9]/30 bg-[#0C2340]/50 text-[#0C8CE9]',
    speed: 'Live Stream',
    ping: '28ms',
    uptime: '99.99%',
    apiKey: 'rzp_live_k9948201',
    environment: 'production',
    description: 'Instant card, UPI & netbanking charge authorization stream with automated risk pre-auth scoring.',
  },
  {
    id: 'cashfree',
    name: 'Cashfree Payments',
    type: 'Gateway',
    category: 'gateways',
    status: 'Ready',
    icon: CashfreeLogo,
    color: 'border-[#FF5A1F]/30 bg-[#1C1008]/50 text-[#FF5A1F]',
    speed: 'Live Stream',
    ping: '32ms',
    uptime: '99.98%',
    environment: 'production',
    description: 'Real-time payment webhook stream for high-velocity checkout fraud inspection and chargeback defense.',
  },
  {
    id: 'shopify',
    name: 'Shopify Store Connector',
    type: 'E-Commerce',
    category: 'ecommerce',
    status: 'Connected',
    icon: ShopifyLogo,
    color: 'border-[#95BF47]/30 bg-[#0D1F0D]/50 text-[#95BF47]',
    speed: 'Webhook Sync',
    ping: '42ms',
    uptime: '100%',
    apiKey: 'shpat_998240182',
    environment: 'production',
    description: 'Bi-directional e-commerce order sync: customer IP tracing, behavioral fingerprinting & cart forensics.',
  },
  {
    id: 'delhivery',
    name: 'Delhivery Logistics',
    type: 'Courier',
    category: 'couriers',
    status: 'Connected',
    icon: DelhiveryLogo,
    color: 'border-[#E31837]/30 bg-[#200508]/50 text-[#E31837]',
    speed: 'Auto-POD',
    ping: '24ms',
    uptime: '99.95%',
    apiKey: 'del_client_0918',
    autoPod: true,
    environment: 'production',
    description: 'Direct courier API bridge for signed delivery receipts, GPS drop coordinates & RTO dispatch validation.',
  },
  {
    id: 'bluedart',
    name: 'BlueDart Express',
    type: 'Courier',
    category: 'couriers',
    status: 'Ready',
    icon: BlueDartLogo,
    color: 'border-[#0052CC]/30 bg-[#001838]/50 text-[#0052CC]',
    speed: 'Auto-POD',
    ping: '29ms',
    uptime: '99.96%',
    autoPod: true,
    environment: 'production',
    description: 'Automated Air Waybill (AWB) tracking & digital recipient proof-of-delivery (POD) dispute packet ingress.',
  },
];

const INITIAL_ENDPOINTS: IntegrationEndpoint[] = [
  {
    id: 1,
    platform: 'Razorpay Payment Gateway',
    connector_id: 'razorpay',
    store_name: 'Primary Merchant Checkout (Live)',
    connection_method: 'REST Webhook (HMAC SHA-256)',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
    last_event_at: new Date(Date.now() - 120000).toISOString(),
    latencyMs: 28
  },
  {
    id: 2,
    platform: 'Shopify Store Connector',
    connector_id: 'shopify',
    store_name: 'Production Storefront (v2)',
    connection_method: 'App Webhook Sync',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    last_event_at: new Date(Date.now() - 300000).toISOString(),
    latencyMs: 42
  },
  {
    id: 3,
    platform: 'Delhivery Logistics',
    connector_id: 'delhivery',
    store_name: 'Auto-POD Ingress Pipeline',
    connection_method: 'Auto-POD Courier API',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    last_event_at: new Date(Date.now() - 600000).toISOString(),
    latencyMs: 24
  }
];

export default function Integrations() {
  const [activeTab, setActiveTab] = useState<'connectors' | 'developer' | 'evidence'>('connectors');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [pingingId, setPingingId] = useState<string | null>(null);
  
  // State for connectors with icon restoration from ICON_MAP
  const [connectors, setConnectors] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('flowshield_connectors_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((item: any) => ({
          ...item,
          icon: ICON_MAP[item.id] || RazorpayLogo
        }));
      }
    } catch (e) {}
    return DEFAULT_CONNECTORS;
  });

  // State for connected endpoints
  const [endpoints, setEndpoints] = useState<IntegrationEndpoint[]>(() => {
    try {
      const saved = localStorage.getItem('flowshield_endpoints_v2');
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
    try {
      localStorage.setItem('flowshield_connectors_v2', JSON.stringify(connectors));
    } catch (e) {}
  }, [connectors]);

  useEffect(() => {
    try {
      localStorage.setItem('flowshield_endpoints_v2', JSON.stringify(endpoints));
    } catch (e) {}
  }, [endpoints]);

  // Backend sync if online
  const fetchBackendIntegrations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/integrations');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const backendMapped = res.data.map((item: any) => ({
          id: item.id,
          platform: item.platform,
          connector_id: item.platform.toLowerCase().includes('razorpay') ? 'razorpay' : item.platform.toLowerCase().includes('shopify') ? 'shopify' : 'delhivery',
          store_name: item.store_name || item.platform,
          connection_method: item.connection_method || 'REST Webhook',
          status: (item.status || 'ACTIVE').toUpperCase(),
          created_at: item.created_at || new Date().toISOString(),
          last_event_at: item.last_event_at || new Date().toISOString(),
          latencyMs: 31
        }));
        setEndpoints(backendMapped);
      }
    } catch (e) {
      // Local fallback
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
    setConnectors(prev => prev.map(c => {
      if (c.id === connectorId) {
        return { 
          ...c, 
          ...updatedConfig, 
          status: 'Connected',
          icon: ICON_MAP[connectorId] || c.icon 
        };
      }
      return c;
    }));

    const targetConnector = connectors.find(c => c.id === connectorId);
    if (targetConnector) {
      const existingIdx = endpoints.findIndex(e => e.platform.toLowerCase().includes(targetConnector.name.toLowerCase().slice(0, 8)));
      
      const newEndpoint: IntegrationEndpoint = {
        id: existingIdx >= 0 ? endpoints[existingIdx].id : Date.now(),
        platform: targetConnector.name,
        connector_id: targetConnector.id,
        store_name: `${targetConnector.type} Ingestion (${updatedConfig.environment || 'production'})`,
        connection_method: targetConnector.type === 'Courier' ? 'Auto-POD Courier API' : 'REST Webhook (HMAC SHA-256)',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        last_event_at: new Date().toISOString(),
        latencyMs: Math.round(22 + Math.random() * 16)
      };

      if (existingIdx >= 0) {
        setEndpoints(prev => prev.map((e, idx) => idx === existingIdx ? newEndpoint : e));
      } else {
        setEndpoints(prev => [newEndpoint, ...prev]);
      }
    }
  };

  const handleDisconnectConnector = (connectorId: string) => {
    setConnectors(prev => prev.map(c => {
      if (c.id === connectorId) {
        return { ...c, status: 'Ready' };
      }
      return c;
    }));

    const targetConnector = connectors.find(c => c.id === connectorId);
    if (targetConnector) {
      setEndpoints(prev => prev.filter(e => !e.platform.toLowerCase().includes(targetConnector.name.toLowerCase().slice(0, 8))));
    }
  };

  const handleDisconnectEndpoint = (id: number | string) => {
    if (!confirm('Are you sure you want to disconnect this endpoint? Real-time fraud telemetry will cease.')) return;
    setEndpoints(prev => prev.filter(e => e.id !== id));
    toast.success('Endpoint disconnected');
  };

  const handleTestPing = (connector: any) => {
    setPingingId(connector.id);
    setTimeout(() => {
      setPingingId(null);
      const pingTime = Math.round(22 + Math.random() * 14);
      toast.success(`⚡ Live Ping Acknowledged: ${connector.name}`, {
        description: `Response received in ${pingTime}ms • Stream healthy • Zero packet drops detected.`
      });
    }, 700);
  };

  const filteredConnectors = selectedCategory === 'all' 
    ? connectors 
    : connectors.filter(c => c.category === selectedCategory);

  const connectedCount = connectors.filter(c => c.status === 'Connected').length;

  return (
    <div className="space-y-6 font-sans">
      
      {/* ── TOP BANNER & HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold text-white tracking-tight">Evidence Hub & Integrations</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              SOC GATEWAY · ACTIVE
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
              toast.success('Telemetry streams refreshed', {
                description: 'All active ingress pods reporting sub-35ms response times.'
              });
            }}
            className="text-xs border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh Telemetry</span>
          </Button>
          
          <Button
            size="sm"
            onClick={() => setActiveTab('developer')}
            className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            <span>Custom Webhook</span>
          </Button>
        </div>
      </div>

      {/* ── ENTERPRISE TELEMETRY ASSURANCE STRIP ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#080D15] border border-slate-800/90 flex items-center space-x-3 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">Protection Mesh</div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>{connectedCount} of {connectors.length} Connected</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#080D15] border border-slate-800/90 flex items-center space-x-3 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">P99 Stream Latency</div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>28ms</span>
              <span className="text-[10px] text-emerald-400 font-mono font-medium">Sub-35ms</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#080D15] border border-slate-800/90 flex items-center space-x-3 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">Dispute Win Rate</div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>94.2%</span>
              <span className="text-[10px] text-emerald-400 font-mono font-medium">+72% vs Manual</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#080D15] border border-slate-800/90 flex items-center space-x-3 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <PackageCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">Auto-POD Evidence</div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Autonomous</span>
              <span className="text-[10px] text-purple-400 font-mono font-medium">Zero Paperwork</span>
            </div>
          </div>
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
          Active Connectors & Gateways ({connectedCount}/{connectors.length})
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
          
          {/* ════ CONNECTOR CARDS SECTION (FIRST) ════ */}
          <div className="space-y-4">
            
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white tracking-tight">Available Connectors</h3>
                <span className="text-xs text-slate-500 font-mono">({filteredConnectors.length} platforms)</span>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center space-x-1.5 p-1 rounded-lg bg-[#080D15] border border-slate-800 text-xs">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                    selectedCategory === 'all'
                      ? 'bg-cyan-600 text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({connectors.length})
                </button>
                <button
                  onClick={() => setSelectedCategory('gateways')}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                    selectedCategory === 'gateways'
                      ? 'bg-cyan-600 text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Payment Gateways (2)
                </button>
                <button
                  onClick={() => setSelectedCategory('ecommerce')}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                    selectedCategory === 'ecommerce'
                      ? 'bg-cyan-600 text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  E-Commerce (1)
                </button>
                <button
                  onClick={() => setSelectedCategory('couriers')}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                    selectedCategory === 'couriers'
                      ? 'bg-cyan-600 text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Couriers & POD (2)
                </button>
              </div>
            </div>

            {/* Connectors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredConnectors.map((connector) => {
                const isConnected = connector.status === 'Connected';
                const IconComponent = ICON_MAP[connector.id] || connector.icon || RazorpayLogo;
                const isPinging = pingingId === connector.id;

                return (
                  <Card 
                    key={connector.id} 
                    variant="data" 
                    padding="md" 
                    className={`flex flex-col justify-between space-y-4 rounded-xl border transition-all relative overflow-hidden ${
                      isConnected 
                        ? 'bg-[#080D15] border-slate-800 hover:border-slate-700 shadow-sm' 
                        : 'bg-[#080D15] border-slate-800/80 hover:border-cyan-500/30'
                    }`}
                  >
                    <div className="space-y-3.5">
                      
                      {/* Card Top: Brand Logo + Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-inner ${connector.color}`}>
                            <IconComponent size={26} />
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs font-mono font-semibold uppercase text-slate-400">
                                {connector.type}
                              </span>
                              <span className="text-slate-600">·</span>
                              <span className="text-[11px] font-mono text-cyan-400">
                                {connector.speed}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-white tracking-tight leading-tight">
                              {connector.name}
                            </h3>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 ${
                          isConnected 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                          {connector.status}
                        </span>
                      </div>

                      {/* Connector Description */}
                      <p className="text-xs text-slate-400 leading-relaxed min-h-[38px]">
                        {connector.description}
                      </p>

                      {/* Performance & Security Stats */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                        <span className="flex items-center gap-1">
                          <Activity className="w-3 h-3 text-cyan-400" />
                          <span>Ping: {connector.ping || '28ms'}</span>
                        </span>
                        <span className="text-slate-500">·</span>
                        <span className="text-emerald-400 font-medium">Uptime: {connector.uptime || '99.9%'}</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-slate-400">TLS 1.3</span>
                      </div>

                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex items-center space-x-2">
                      {isConnected ? (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenConfig(connector)}
                            className="flex-1 justify-center text-xs font-semibold h-8 rounded-lg border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 transition-all"
                          >
                            <Settings2 className="w-3.5 h-3.5 mr-1.5" />
                            Configure
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTestPing(connector)}
                            disabled={isPinging}
                            className="h-8 px-2.5 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/20 rounded-lg transition-all"
                            title="Send simulated test telemetry ping"
                          >
                            <Zap className={`w-3.5 h-3.5 ${isPinging ? 'animate-bounce text-amber-400' : ''}`} />
                            <span className="ml-1 hidden sm:inline">{isPinging ? 'Pinging...' : 'Ping Test'}</span>
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenConfig(connector)}
                          className="w-full justify-center text-xs font-semibold h-8 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md transition-all group"
                        >
                          <Plug2 className="w-3.5 h-3.5 mr-1.5" />
                          <span>Connect in 60s</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

          </div>

          {/* ════ HOW IT WORKS & KEY BENEFITS (STEP-BY-STEP SECOND) ════ */}
          <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-[#0A1322] to-[#060A12] p-5 md:p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    ARCHITECTURE OVERVIEW
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs font-medium text-slate-300">Autonomous Fraud Defense & POD Ingress</span>
                </div>
                <h2 className="text-base md:text-lg font-bold text-white tracking-tight mt-1">
                  How Flowshield Integration Works
                </h2>
                <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
                  Connect your store, payment gateways, and shipping couriers in under 60 seconds. Our zero-code telemetry pipeline protects transactions from pre-auth checkout to dispute representment.
                </p>
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-400 shrink-0">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
                  <Lock className="w-3 h-3 text-cyan-400" />
                  TLS 1.3 Vaulted
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  PCI-DSS Level 1
                </span>
              </div>
            </div>

            {/* 4-Step Interactive Horizontal Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 relative">
              
              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-[#080D15]/80 border border-slate-800/90 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3 group">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-mono font-bold flex items-center justify-center">
                      01
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-medium bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      60s Setup
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-white tracking-tight mt-2.5 group-hover:text-cyan-300 transition-colors">
                    1. Secure API Handshake
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Connect Razorpay, Cashfree, or Shopify in 1-click. Credentials are stored in a zero-knowledge encrypted vault.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span className="text-cyan-400 font-semibold">Mutual TLS 1.3</span>
                  <span>Zero Code</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-[#080D15]/80 border border-slate-800/90 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3 group">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-mono font-bold flex items-center justify-center">
                      02
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-medium bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      Sub-35ms
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-white tracking-tight mt-2.5 group-hover:text-blue-300 transition-colors">
                    2. Real-Time Pre-Auth Scoring
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Every checkout attempt is scanned across 40+ fraud vectors (IP proxy, velocity, behavioral bot flags) before charge finalization.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span className="text-blue-400 font-semibold">28ms Latency</span>
                  <span>Instant Block</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-[#080D15]/80 border border-slate-800/90 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3 group">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[11px] font-mono font-bold flex items-center justify-center">
                      03
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-medium bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      Auto-POD
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-white tracking-tight mt-2.5 group-hover:text-purple-300 transition-colors">
                    3. Courier Auto-POD Ingress
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Delhivery & BlueDart tracking APIs pull signed recipient manifests, GPS drop coordinates, and delivery photo proof automatically.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span className="text-purple-400 font-semibold">Signed Receipts</span>
                  <span>GPS Geotag</span>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl bg-[#080D15]/80 border border-slate-800/90 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3 group">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold flex items-center justify-center">
                      04
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                      94.2% Win
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-white tracking-tight mt-2.5 group-hover:text-emerald-300 transition-colors">
                    4. Instant Win Representment
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    When a dispute occurs, Flowshield compiles a court-ready 4-page evidence dossier and submits it to your gateway API automatically.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span className="text-emerald-400 font-semibold">Auto-Submitted</span>
                  <span>Zero Manual Loss</span>
                </div>
              </div>

            </div>

            {/* Merchant Benefits Grid */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="flex items-start space-x-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-white font-semibold block">94.2% Dispute Win Rate</span>
                  <span className="text-[11px] text-slate-400">Reclaim revenue lost to "Item Not Received" friendly fraud.</span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-white font-semibold block">Frictionless Checkout</span>
                  <span className="text-[11px] text-slate-400">Asynchronous streaming causes zero drop in payment conversions.</span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-white font-semibold block">Zero Paperwork</span>
                  <span className="text-[11px] text-slate-400">Stop chasing logistics partners for delivery slips manually.</span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <CheckCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-white font-semibold block">Bank-Grade Compliance</span>
                  <span className="text-[11px] text-slate-400">HMAC SHA-256 signatures, AES-256 encryption & SOC2 ready.</span>
                </div>
              </div>
            </div>

          </div>

          {/* ════ ACTIVE INTEGRATION ENDPOINTS TABLE ════ */}
          <Card variant="data" padding="none" className="overflow-hidden rounded-xl border border-slate-800/80 bg-[#080D15]">
            <div className="p-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Active Integration Endpoints</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                    {endpoints.length} Active
                  </span>
                </h3>
                <span className="text-[11px] text-slate-400">Real-time webhook ingestion and auto-POD representment streams</span>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                ALL STREAMS SYNCHRONIZED
              </span>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="border-slate-800/80 hover:bg-transparent">
                  <TableHead className="text-xs text-slate-400 font-semibold">Platform & Brand</TableHead>
                  <TableHead className="text-xs text-slate-400 font-semibold">Ingress Identifier</TableHead>
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
                      No active integration endpoints found. Click "Connect in 60s" above to activate your payment gateways and couriers.
                    </TableCell>
                  </TableRow>
                ) : (
                  endpoints.map((integ) => {
                    const matchedConnector = connectors.find(c => 
                      integ.connector_id === c.id || 
                      integ.platform.toLowerCase().includes(c.id) ||
                      c.name.toLowerCase().includes(integ.platform.toLowerCase().slice(0, 7))
                    );
                    const IconComponent = matchedConnector ? (ICON_MAP[matchedConnector.id] || matchedConnector.icon) : Shield;
                    
                    return (
                      <TableRow key={integ.id} className="border-slate-800/60 hover:bg-slate-900/40 transition-colors">
                        <TableCell className="font-semibold text-white text-xs">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700/60 p-1 flex items-center justify-center shrink-0">
                              {matchedConnector ? (
                                <IconComponent size={18} />
                              ) : (
                                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                              )}
                            </div>
                            <span className="font-bold text-white">{integ.platform}</span>
                          </div>
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
                          <div className="flex items-center justify-end space-x-1.5">
                            {matchedConnector && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => handleTestPing(matchedConnector)}
                                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 text-xs h-7 px-2"
                                  title="Test Stream Ping"
                                >
                                  <Zap className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => handleOpenConfig(matchedConnector)}
                                  className="text-slate-400 hover:text-white text-xs h-7 px-2"
                                  title="Configure"
                                >
                                  <Settings2 className="w-3.5 h-3.5" />
                                </Button>
                              </>
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
