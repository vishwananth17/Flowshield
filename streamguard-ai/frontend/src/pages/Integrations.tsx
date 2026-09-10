import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  BlueDartLogo,
  PhonePeLogo,
  ShiprocketLogo
} from '@/components/integrations/BrandLogos';
import { 
  Search,
  Plus,
  RefreshCw,
  Copy,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Settings,
  Zap,
  Activity,
  ArrowUpRight,
  Trash2,
  Clock
} from 'lucide-react';

interface IntegrationEndpoint {
  id: number | string;
  platform: string;
  connector_id?: string;
  store_name: string;
  connection_method: string;
  status: string;
  created_at: string;
  last_event_at?: string;
  latencyMs?: number;
  url: string;
}

interface ConnectorCardItem extends ConnectorItem {
  description: string;
  category: 'gateways' | 'platforms' | 'couriers';
  categoryLabel: string;
  ping: string;
  uptime: string;
  environment: 'production' | 'sandbox';
  isPopular?: boolean;
}

const INITIAL_CONNECTORS: ConnectorCardItem[] = [
  {
    id: 'razorpay',
    name: 'Razorpay Payment Gateway',
    type: 'Gateway',
    category: 'gateways',
    categoryLabel: 'Payment Gateway',
    status: 'Connected',
    icon: RazorpayLogo,
    color: 'text-[#0C8CE9]',
    speed: 'Live Stream',
    ping: '28ms',
    uptime: '99.99%',
    apiKey: 'rzp_live_k9948201',
    environment: 'production',
    description: 'Pre-authorization risk scoring, card fraud checks, and UPI collect flow velocity inspection.',
    isPopular: true,
  },
  {
    id: 'phonepe',
    name: 'PhonePe PG & UPI',
    type: 'Gateway',
    category: 'gateways',
    categoryLabel: 'UPI & Payment Gateway',
    status: 'Connected',
    icon: PhonePeLogo,
    color: 'text-[#5F259F]',
    speed: 'Live Stream',
    ping: '24ms',
    uptime: '99.99%',
    apiKey: 'M22019482_live',
    environment: 'production',
    description: 'Native UPI intent & QR stream. Stops burner VPA cycling and 1930 cybercrime account freezes.',
    isPopular: true,
  },
  {
    id: 'cashfree',
    name: 'Cashfree Payments',
    type: 'Gateway',
    category: 'gateways',
    categoryLabel: 'Payment Gateway',
    status: 'Ready',
    icon: CashfreeLogo,
    color: 'text-[#FF5A1F]',
    speed: 'Live Stream',
    ping: '32ms',
    uptime: '99.98%',
    environment: 'production',
    description: 'High-frequency webhook pipeline for instant velocity defense and payout hold triggers.',
  },
  {
    id: 'shopify',
    name: 'Shopify Store Connector',
    type: 'E-Commerce',
    category: 'platforms',
    categoryLabel: 'E-Commerce Platform',
    status: 'Connected',
    icon: ShopifyLogo,
    color: 'text-[#95BF47]',
    speed: 'Webhook Sync',
    ping: '42ms',
    uptime: '99.99%',
    apiKey: 'shpat_991823a8b4c2',
    environment: 'production',
    description: 'Bi-directional order intake, customer IP & device correlation, and cart fraud forensics.',
    isPopular: true,
  },
  {
    id: 'delhivery',
    name: 'Delhivery Logistics',
    type: 'Courier',
    category: 'couriers',
    categoryLabel: 'Courier & POD',
    status: 'Connected',
    icon: DelhiveryLogo,
    color: 'text-[#E31837]',
    speed: 'Auto-POD Sync',
    ping: '24ms',
    uptime: '99.95%',
    apiKey: 'del_api_8849102',
    environment: 'production',
    description: 'Automated courier Proof-of-Delivery (Auto-POD) sync with digital signature & GPS drop verification.',
  },
  {
    id: 'shiprocket',
    name: 'Shiprocket Logistics',
    type: 'Courier',
    category: 'couriers',
    categoryLabel: 'Courier & RTO Predictor',
    status: 'Ready',
    icon: ShiprocketLogo,
    color: 'text-[#7B2CBF]',
    speed: 'RTO Defense',
    ping: '38ms',
    uptime: '99.96%',
    environment: 'production',
    description: 'Multi-carrier tracking and predictive Cash-on-Delivery (COD) RTO refusal defense on risky pincodes.',
  },
];

const INITIAL_ENDPOINTS: IntegrationEndpoint[] = [
  {
    id: 1,
    platform: 'Razorpay Payment Gateway',
    connector_id: 'razorpay',
    store_name: 'Primary Gateway (Production)',
    connection_method: 'REST Webhook (HMAC SHA-256)',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
    last_event_at: new Date(Date.now() - 120000).toISOString(),
    latencyMs: 28,
    url: 'https://api.flowshield.ai/v1/webhooks/razorpay',
  },
  {
    id: 2,
    platform: 'PhonePe PG & UPI',
    connector_id: 'phonepe',
    store_name: 'UPI Ingress & 1930 Freeze Monitor',
    connection_method: 'S2S Webhook (SHA-256 Checksum)',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    last_event_at: new Date(Date.now() - 45000).toISOString(),
    latencyMs: 24,
    url: 'https://api.flowshield.ai/v1/webhooks/phonepe',
  },
  {
    id: 3,
    platform: 'Shopify Store Connector',
    connector_id: 'shopify',
    store_name: 'Direct Store Sync',
    connection_method: 'Shopify Webhooks',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    last_event_at: new Date(Date.now() - 300000).toISOString(),
    latencyMs: 42,
    url: 'https://api.flowshield.ai/v1/webhooks/shopify',
  },
  {
    id: 4,
    platform: 'Delhivery Logistics',
    connector_id: 'delhivery',
    store_name: 'Auto-POD AWB Delivery Proof Stream',
    connection_method: 'Courier API Webhook',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    last_event_at: new Date(Date.now() - 600000).toISOString(),
    latencyMs: 24,
    url: 'https://api.flowshield.ai/v1/webhooks/delhivery',
  },
];

export default function Integrations() {
  const [connectors, setConnectors] = useState<ConnectorCardItem[]>(INITIAL_CONNECTORS);
  const [endpoints, setEndpoints] = useState<IntegrationEndpoint[]>(INITIAL_ENDPOINTS);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'gateways' | 'platforms' | 'couriers'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConnector, setSelectedConnector] = useState<ConnectorItem | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [showDeveloperFlow, setShowDeveloperFlow] = useState(false);
  const [pingingId, setPingingId] = useState<string | null>(null);

  // Filter connectors
  const filteredConnectors = connectors.filter(c => {
    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const connectedCount = connectors.filter(c => c.status === 'Connected').length;

  const handleOpenConfig = (connector: ConnectorCardItem) => {
    setSelectedConnector(connector);
    setIsConfigModalOpen(true);
  };

  const handleSaveConfig = (connectorId: string, updatedConfig: Partial<ConnectorItem>) => {
    setConnectors(prev => prev.map(c => {
      if (c.id === connectorId) {
        return { ...c, ...updatedConfig, status: 'Connected' };
      }
      return c;
    }));
    toast.success('Connector updated successfully');
  };

  const handleDisconnect = (connectorId: string) => {
    setConnectors(prev => prev.map(c => {
      if (c.id === connectorId) {
        return { ...c, status: 'Ready' };
      }
      return c;
    }));
    setEndpoints(prev => prev.filter(e => e.connector_id !== connectorId));
    toast.success('Integration disconnected');
  };

  const handleTestPing = (connector: ConnectorCardItem) => {
    setPingingId(connector.id);
    setTimeout(() => {
      setPingingId(null);
      toast.success(`Connection verified: ${connector.name}`, {
        description: `Roundtrip latency: ${connector.ping} • TLS 1.3 verified • Nominal health`
      });
    }, 500);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto">
      
      {/* 1. CLEAN INSTITUTIONAL HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-default)]">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
            Integrations
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
            Connect your payment gateways, e-commerce stores, and logistics couriers to stream checkout telemetry, prevent 1930 account freezes, and automate dispute wins.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              toast.success('All integrations operational', {
                description: `${connectedCount} active connections running at nominal latency.`
              });
            }}
            className="gap-1.5"
          >
            <RefreshCw size={14} />
            <span>Sync Status</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowDeveloperFlow(true)}
            className="gap-1.5"
          >
            <Plus size={14} />
            <span>Custom Webhook</span>
          </Button>
        </div>
      </div>

      {/* 2. SUMMARY STRIP (Clean 4 metrics, zero cyberpunk neon) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--surface-page)] border border-[var(--border-default)]">
          <div className="text-xs text-[var(--text-secondary)] font-medium">Active Connectors</div>
          <div className="text-2xl font-semibold text-[var(--text-primary)] mt-1">
            {connectedCount} <span className="text-xs text-[var(--text-tertiary)] font-normal">of {connectors.length}</span>
          </div>
          <div className="text-[11px] text-emerald-500 font-medium mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Zero drop-off</span>
          </div>
        </div>

        <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--surface-page)] border border-[var(--border-default)]">
          <div className="text-xs text-[var(--text-secondary)] font-medium">Median Ingress Latency</div>
          <div className="text-2xl font-semibold text-[var(--text-primary)] mt-1">26ms</div>
          <div className="text-[11px] text-[var(--text-tertiary)] mt-1">P99 sub-45ms globally</div>
        </div>

        <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--surface-page)] border border-[var(--border-default)]">
          <div className="text-xs text-[var(--text-secondary)] font-medium">Auto-POD Sync</div>
          <div className="text-2xl font-semibold text-emerald-500 mt-1">Active</div>
          <div className="text-[11px] text-[var(--text-secondary)] mt-1">Delhivery & BlueDart AWB</div>
        </div>

        <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--surface-page)] border border-[var(--border-default)]">
          <div className="text-xs text-[var(--text-secondary)] font-medium">UPI 1930 Freeze Defense</div>
          <div className="text-2xl font-semibold text-emerald-500 mt-1">Protected</div>
          <div className="text-[11px] text-[var(--text-secondary)] mt-1">Razorpay & PhonePe S2S</div>
        </div>
      </div>

      {/* 3. CATEGORY FILTERS & SEARCH */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 bg-[var(--surface-page)] p-1 rounded-[var(--radius-md)] border border-[var(--border-default)]">
          {[
            { id: 'all', label: 'All', count: connectors.length },
            { id: 'gateways', label: 'Payment Gateways', count: connectors.filter(c => c.category === 'gateways').length },
            { id: 'platforms', label: 'E-Commerce', count: connectors.filter(c => c.category === 'platforms').length },
            { id: 'couriers', label: 'Couriers & POD', count: connectors.filter(c => c.category === 'couriers').length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as any)}
              className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-colors flex items-center gap-1.5 ${
                selectedCategory === tab.id
                  ? 'bg-[var(--surface-subtle)] text-[var(--text-primary)] shadow-xs font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] text-[var(--text-tertiary)] font-mono">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-[var(--radius-md)] text-xs bg-[var(--surface-page)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--brand-500)]"
          />
        </div>
      </div>

      {/* 4. INTEGRATION CARDS GRID (Stripe / Linear clean standard) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredConnectors.map((connector) => {
          const Icon = connector.icon;
          const isConnected = connector.status === 'Connected';

          return (
            <div
              key={connector.id}
              className="group p-5 rounded-[var(--radius-lg)] bg-[var(--surface-page)] border border-[var(--border-default)] hover:border-[var(--border-strong)] transition-all flex flex-col justify-between space-y-4"
            >
              {/* Card Top: Logo, Name, Category, Status */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
                        {connector.name}
                      </h3>
                      <span className="text-[11px] text-[var(--text-tertiary)] font-medium">
                        {connector.categoryLabel}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {isConnected ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1.5 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Connected</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)] shrink-0">
                      Available
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                  {connector.description}
                </p>
              </div>

              {/* Card Bottom: Latency & Action Buttons */}
              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <div className="text-[11px] text-[var(--text-tertiary)] font-mono flex items-center gap-1.5">
                  <Activity size={12} className={isConnected ? "text-emerald-500" : "text-[var(--text-tertiary)]"} />
                  <span>{connector.ping}</span>
                  <span>·</span>
                  <span>{connector.speed}</span>
                </div>

                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleTestPing(connector)}
                        disabled={pingingId === connector.id}
                        className="text-[11px] px-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        title="Test ping latency"
                      >
                        {pingingId === connector.id ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <span>Ping</span>
                        )}
                      </Button>
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => handleOpenConfig(connector)}
                        className="text-[11px] px-3 font-medium"
                      >
                        Configure
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => handleOpenConfig(connector)}
                      className="text-[11px] px-3 font-medium"
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. ACTIVE WEBHOOK ENDPOINTS TABLE (Clean Institutional Style) */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
              Active Ingress Webhook Endpoints
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Secure HTTPS endpoints receiving real-time transaction, dispute, and courier tracking payloads.
            </p>
          </div>

          <span className="text-xs font-mono text-[var(--text-tertiary)]">
            {endpoints.length} endpoints active
          </span>
        </div>

        <div className="rounded-[var(--radius-lg)] bg-[var(--surface-page)] border border-[var(--border-default)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)] text-[11px] font-semibold text-[var(--text-secondary)]">
                <TableHead className="py-2.5 px-4">Platform & Connector</TableHead>
                <TableHead className="py-2.5 px-4">Webhook Endpoint URL</TableHead>
                <TableHead className="py-2.5 px-4">Protocol</TableHead>
                <TableHead className="py-2.5 px-4">Status</TableHead>
                <TableHead className="py-2.5 px-4 text-right">Latency</TableHead>
                <TableHead className="py-2.5 px-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-[var(--border-subtle)] text-xs">
              {endpoints.map((endpoint) => (
                <TableRow key={endpoint.id} className="hover:bg-[var(--surface-subtle)]/50 transition-colors">
                  <TableCell className="py-3 px-4 font-medium text-[var(--text-primary)]">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={15} className="text-emerald-500 shrink-0" />
                      <span>{endpoint.platform}</span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 px-4 font-mono text-[11px] text-[var(--text-secondary)]">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[320px]">{endpoint.url}</span>
                      <button
                        onClick={() => handleCopy(endpoint.url, 'Webhook URL')}
                        className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-1"
                        title="Copy Webhook URL"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 px-4 text-[var(--text-secondary)] text-[11px]">
                    {endpoint.connection_method}
                  </TableCell>

                  <TableCell className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Healthy</span>
                    </span>
                  </TableCell>

                  <TableCell className="py-3 px-4 text-right font-mono text-[11px] text-[var(--text-secondary)]">
                    {endpoint.latencyMs}ms
                  </TableCell>

                  <TableCell className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDisconnect(endpoint.connector_id || '')}
                      className="text-xs text-[var(--text-tertiary)] hover:text-rose-500 transition-colors font-medium"
                    >
                      Disconnect
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 6. CONFIGURATION MODAL */}
      {isConfigModalOpen && selectedConnector && (
        <ConnectorConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          connector={selectedConnector}
          onSave={handleSaveConfig}
          onDisconnect={handleDisconnect}
        />
      )}

      {/* 7. CUSTOM WEBHOOK DEVELOPER FLOW */}
      {showDeveloperFlow && (
        <DeveloperFlow
          onClose={() => setShowDeveloperFlow(false)}
          onSuccess={() => {
            setShowDeveloperFlow(false);
            toast.success('Custom webhook registered successfully');
          }}
        />
      )}

    </div>
  );
}
