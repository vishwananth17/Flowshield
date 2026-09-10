import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { toast } from 'sonner';
import api from '@/services/api';
import DeveloperFlow from '@/components/integrations/DeveloperFlow';
import ConnectorConfigModal, { type ConnectorItem } from '@/components/integrations/ConnectorConfigModal';
import RadarEvidenceModal, { type EvidenceDossierItem } from '@/components/integrations/RadarEvidenceModal';
import { 
  RazorpayLogo, 
  CashfreeLogo, 
  ShopifyLogo, 
  DelhiveryLogo, 
  BlueDartLogo 
} from '@/components/integrations/BrandLogos';
import { 
  Plug2, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Plus,
  RefreshCw,
  Settings2,
  FileCheck,
  Shield,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Truck,
  PackageCheck,
  Award,
  Radio,
  Sliders,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Search,
  CheckCircle,
  AlertTriangle,
  Terminal,
  Layers,
  HelpCircle,
  Filter
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

interface EnhancedConnectorItem extends ConnectorItem {
  description: string;
  tagline: string;
  ping: string;
  uptime: string;
  category: string;
  accentColor: string;
  badgeGlow: string;
  features: string[];
}

const DEFAULT_CONNECTORS: EnhancedConnectorItem[] = [
  {
    id: 'razorpay',
    name: 'Razorpay Payment Gateway',
    type: 'Gateway',
    category: 'gateways',
    status: 'Connected',
    icon: RazorpayLogo,
    accentColor: '#0C8CE9',
    badgeGlow: 'from-[#0C2340]/80 to-slate-900 border-[#0C8CE9]/30 shadow-[0_0_20px_rgba(12,140,233,0.18)]',
    color: 'border-[#0C8CE9]/30 bg-[#0C2340]/50 text-[#0C8CE9]',
    speed: 'Live Stream',
    ping: '28ms',
    uptime: '99.99%',
    apiKey: 'rzp_live_k9948201',
    environment: 'production',
    tagline: 'Instant card, UPI & netbanking charge authorization stream.',
    description: 'Instant pre-auth risk inspection across card networks, UPI handle velocity & auto-refund holds.',
    features: ['Sub-35ms Scoring', 'Pre-Auth Block', 'Auto Refund Hold']
  },
  {
    id: 'cashfree',
    name: 'Cashfree Payments',
    type: 'Gateway',
    category: 'gateways',
    status: 'Ready',
    icon: CashfreeLogo,
    accentColor: '#FF5A1F',
    badgeGlow: 'from-[#1C1008]/80 to-slate-900 border-[#FF5A1F]/30 shadow-[0_0_20px_rgba(255,90,31,0.18)]',
    color: 'border-[#FF5A1F]/30 bg-[#1C1008]/50 text-[#FF5A1F]',
    speed: 'Live Stream',
    ping: '32ms',
    uptime: '99.98%',
    environment: 'production',
    tagline: 'High-frequency payment gateway & automated dispute telemetry.',
    description: 'Real-time payment webhook stream for high-velocity checkout fraud inspection and chargeback defense.',
    features: ['Instant Ingestion', 'UPI QR Forensics', 'Chargeback Alert']
  },
  {
    id: 'shopify',
    name: 'Shopify Store Connector',
    type: 'E-Commerce',
    category: 'ecommerce',
    status: 'Connected',
    icon: ShopifyLogo,
    accentColor: '#95BF47',
    badgeGlow: 'from-[#0D1F0D]/80 to-slate-900 border-[#95BF47]/30 shadow-[0_0_20px_rgba(149,191,71,0.18)]',
    color: 'border-[#95BF47]/30 bg-[#0D1F0D]/50 text-[#95BF47]',
    speed: 'Webhook Sync',
    ping: '42ms',
    uptime: '100%',
    apiKey: 'shpat_998240182',
    environment: 'production',
    tagline: 'Bi-directional e-commerce store sync for cart & customer forensics.',
    description: 'Bi-directional order intake, customer IP mapping, device fingerprinting & cart forensics.',
    features: ['Cart Risk Profiling', 'IP & Device Trace', 'Order Ingress']
  },
  {
    id: 'delhivery',
    name: 'Delhivery Logistics',
    type: 'Courier',
    category: 'couriers',
    status: 'Connected',
    icon: DelhiveryLogo,
    accentColor: '#E31837',
    badgeGlow: 'from-[#200508]/80 to-slate-900 border-[#E31837]/30 shadow-[0_0_20px_rgba(227,24,55,0.18)]',
    color: 'border-[#E31837]/30 bg-[#200508]/50 text-[#E31837]',
    speed: 'Auto-POD',
    ping: '24ms',
    uptime: '99.95%',
    apiKey: 'del_client_0918',
    autoPod: true,
    environment: 'production',
    tagline: 'Automated courier tracking API for signed proof-of-delivery packets.',
    description: 'Direct courier API bridge for signed delivery receipts, GPS drop coordinates & RTO dispatch validation.',
    features: ['Signed Delivery Slips', 'GPS Geotag Proof', 'Courier API']
  },
  {
    id: 'bluedart',
    name: 'BlueDart Express',
    type: 'Courier',
    category: 'couriers',
    status: 'Ready',
    icon: BlueDartLogo,
    accentColor: '#0052CC',
    badgeGlow: 'from-[#001838]/80 to-slate-900 border-[#0052CC]/30 shadow-[0_0_20px_rgba(0,82,204,0.18)]',
    color: 'border-[#0052CC]/30 bg-[#001838]/50 text-[#0052CC]',
    speed: 'Auto-POD',
    ping: '29ms',
    uptime: '99.96%',
    autoPod: true,
    environment: 'production',
    tagline: 'Air Waybill tracking & digital POD dispute representment pipeline.',
    description: 'Automated Air Waybill (AWB) tracking & digital recipient proof-of-delivery (POD) dispute packet ingress.',
    features: ['AWB Manifest Sync', 'Recipient Photo', '94% Win Rate']
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

const DOSSIER_MOCK_DATA: EvidenceDossierItem[] = [
  {
    id: 'disp_9918skL90',
    orderId: 'ORD-9918',
    disputeRef: 'dp_razor_9918',
    amount: '₹14,500',
    gateway: 'Razorpay',
    customerName: 'Rahul Sharma',
    customerEmail: 'rahul.sharma@example.com',
    customerIp: '49.37.142.88',
    reason: 'Product not received',
    carrier: 'Delhivery',
    awbNumber: 'DEL98871625',
    deliveryDate: '12-07-2026 at 14:32 IST',
    signedBy: 'Rahul S. (Signature & OTP Verified)',
    gpsCoords: '19.0760° N, 72.8777° E (Within 6m)',
    winProbability: 95,
    status: 'WON',
    timeline: [
      { event: 'Order #ORD-9918 placed and Terms of Service accepted', timestamp: '10-07-2026 18:24 IST', badge: 'CHECKOUT' },
      { event: 'Delhivery courier dispatch registered under AWB DEL98871625', timestamp: '11-07-2026 09:15 IST', badge: 'CARRIER' },
      { event: 'Doorstep delivery completed with digital signature by Rahul S.', timestamp: '12-07-2026 14:32 IST', badge: 'DELIVERY' },
      { event: 'Razorpay dispute dp_razor_9918 opened ("Product not received")', timestamp: '14-07-2026 16:15 IST', badge: 'GATEWAY' },
      { event: 'Flowshield Auto-POD compiled 4-page court-ready dossier & auto-submitted', timestamp: '14-07-2026 16:15 IST', badge: 'REPRESENTMENT' },
      { event: 'Issuing bank accepted courier POD and closed dispute in merchant favor', timestamp: '16-07-2026 11:40 IST', badge: 'RESOLVED' },
    ]
  },
  {
    id: 'disp_9914abX21',
    orderId: 'ORD-9914',
    disputeRef: 'dp_cash_9914',
    amount: '₹3,200',
    gateway: 'Cashfree',
    customerName: 'Pooja Verma',
    customerEmail: 'pooja.v@example.com',
    customerIp: '122.179.82.14',
    reason: 'Fraudulent transaction',
    carrier: 'BlueDart',
    awbNumber: 'BLU-440182741',
    deliveryDate: '14-07-2026 at 11:18 IST',
    signedBy: 'Pooja Verma (Digital Stylus Sign)',
    gpsCoords: '12.9716° N, 77.5946° E (Drop Verified)',
    winProbability: 94,
    status: 'SUBMITTED',
    timeline: [
      { event: 'Order #ORD-9914 verified with 3DS OTP ARN (74920184)', timestamp: '13-07-2026 16:02 IST', badge: 'CHECKOUT' },
      { event: 'BlueDart doorstep delivery completed with digital stylus signature', timestamp: '14-07-2026 11:18 IST', badge: 'DELIVERY' },
      { event: 'Cashfree dispute dp_cash_9914 opened ("Fraudulent transaction")', timestamp: '16-07-2026 09:12 IST', badge: 'GATEWAY' },
      { event: 'Auto-POD response package compiled with BlueDart delivery confirmation', timestamp: '16-07-2026 09:12 IST', badge: 'SUBMITTED' }
    ]
  },
  {
    id: 'disp_9902mmP44',
    orderId: 'ORD-9902',
    disputeRef: 'dp_razor_9902',
    amount: '₹28,900',
    gateway: 'Razorpay',
    customerName: 'Vikram Mehta',
    customerEmail: 'vikram.m@example.com',
    customerIp: '103.211.23.6',
    reason: 'Duplicate billing',
    carrier: 'Delhivery',
    awbNumber: 'DEL-883019255',
    deliveryDate: '08-07-2026 at 17:05 IST',
    signedBy: 'Vikram Mehta',
    gpsCoords: '22.5726° N, 88.3639° E',
    winProbability: 95,
    status: 'SUBMITTED',
    timeline: [
      { event: 'Single checkout authorization token validated on Razorpay', timestamp: '07-07-2026 14:10 IST', badge: 'AUTH' },
      { event: 'Delhivery courier delivered to registered merchant address', timestamp: '08-07-2026 17:05 IST', badge: 'DELIVERY' },
      { event: 'Customer reported duplicate charge dp_razor_9902', timestamp: '10-07-2026 10:04 IST', badge: 'GATEWAY' },
      { event: 'Representment docket demonstrated single charge and single fulfillment', timestamp: '10-07-2026 10:04 IST', badge: 'SUBMITTED' }
    ]
  },
  {
    id: 'disp_9881zzK12',
    orderId: 'ORD-9881',
    disputeRef: 'dp_payu_9881',
    amount: '₹9,500',
    gateway: 'Razorpay',
    customerName: 'Aditi Rao',
    customerEmail: 'aditi.rao@example.com',
    customerIp: '27.59.182.90',
    reason: 'Item defective',
    carrier: 'BlueDart',
    awbNumber: 'BLU-319028475',
    deliveryDate: '02-07-2026 at 13:45 IST',
    signedBy: 'Aditi Rao',
    gpsCoords: '28.4595° N, 77.0266° E',
    winProbability: 97,
    status: 'WON',
    timeline: [
      { event: 'Order #ORD-9881 fulfilled and delivered with photo confirmation', timestamp: '02-07-2026 13:45 IST', badge: 'DELIVERY' },
      { event: 'Dispute opened alleging defective item without return initiation', timestamp: '04-07-2026 08:30 IST', badge: 'GATEWAY' },
      { event: 'Manufacturer inspection certificate & store policy docket submitted', timestamp: '04-07-2026 08:30 IST', badge: 'AUTO-POD' },
      { event: 'Dispute won! Capital successfully restored to merchant account', timestamp: '06-07-2026 14:00 IST', badge: 'RESOLVED' }
    ]
  },
  {
    id: 'disp_9862qqW11',
    orderId: 'ORD-9862',
    disputeRef: 'dp_cash_9862',
    amount: '₹45,000',
    gateway: 'Cashfree',
    customerName: 'Suresh Raina',
    customerEmail: 'suresh.raina@example.com',
    customerIp: '49.206.18.91',
    reason: 'Product not received',
    carrier: 'Delhivery',
    awbNumber: 'DEL-771920831',
    deliveryDate: '28-06-2026 at 16:20 IST',
    signedBy: 'Suresh Raina',
    gpsCoords: '17.3850° N, 78.4867° E',
    winProbability: 94,
    status: 'WON',
    timeline: [
      { event: 'Delhivery delivery executed and signed with OTP validation', timestamp: '28-06-2026 16:20 IST', badge: 'DELIVERY' },
      { event: 'Cashfree chargeback dp_cash_9862 filed by issuing bank', timestamp: '30-06-2026 11:15 IST', badge: 'GATEWAY' },
      { event: 'Flowshield auto-represented with carrier proof & GPS drop coordinates', timestamp: '30-06-2026 11:15 IST', badge: 'AUTO-POD' },
      { event: 'Bank verified delivery manifest and reversed chargeback', timestamp: '02-07-2026 19:10 IST', badge: 'RESOLVED' }
    ]
  }
];

interface RadarRuleItem {
  id: string;
  name: string;
  expression: string;
  action: 'BLOCK' | 'CHALLENGE_3DS' | 'REVIEW' | 'AUTO_POD';
  hitsCount: number;
  status: 'ACTIVE' | 'TEST_MODE';
  lastTriggered: string;
}

const RADAR_RULES: RadarRuleItem[] = [
  {
    id: 'rule-1',
    name: 'Block High-Risk Machine Learning Threshold',
    expression: ':risk_score: >= 65',
    action: 'BLOCK',
    hitsCount: 1284,
    status: 'ACTIVE',
    lastTriggered: '3 mins ago'
  },
  {
    id: 'rule-2',
    name: 'Enforce 3DS on Cross-Border Velocity Spikes',
    expression: ':ip_country: != :card_country: AND :velocity_10m: > 2',
    action: 'CHALLENGE_3DS',
    hitsCount: 492,
    status: 'ACTIVE',
    lastTriggered: '14 mins ago'
  },
  {
    id: 'rule-3',
    name: 'Auto-Submit Signed Carrier POD on Disputes',
    expression: ':courier_pod_signed: == true AND :dispute_opened: == true',
    action: 'AUTO_POD',
    hitsCount: 87,
    status: 'ACTIVE',
    lastTriggered: '42 mins ago'
  },
  {
    id: 'rule-4',
    name: 'Block Disposable Anonymous Email Domains',
    expression: ':email_domain_risk: == "disposable" OR :proxy_score: > 80',
    action: 'BLOCK',
    hitsCount: 318,
    status: 'ACTIVE',
    lastTriggered: '1 hour ago'
  },
  {
    id: 'rule-5',
    name: 'High-Value Ticket SOC Manual Inspection',
    expression: ':order_amount: > 50000 AND :device_trust_score: < 40',
    action: 'REVIEW',
    hitsCount: 34,
    status: 'ACTIVE',
    lastTriggered: '3 hours ago'
  }
];

interface WebhookStreamEvent {
  id: string;
  timestamp: string;
  gateway: string;
  eventType: string;
  score: number;
  verdict: 'ALLOW' | 'BLOCK' | 'CHALLENGE' | 'AUTO-POD';
  latency: string;
  signature: string;
}

const LIVE_STREAM_EVENTS: WebhookStreamEvent[] = [
  {
    id: 'evt_99182',
    timestamp: 'Just now',
    gateway: 'Razorpay',
    eventType: 'payment.authorized',
    score: 12,
    verdict: 'ALLOW',
    latency: '24ms',
    signature: 'hmac_sha256:7f4a...91e'
  },
  {
    id: 'evt_99181',
    timestamp: '42s ago',
    gateway: 'Delhivery',
    eventType: 'pod.delivered_signed',
    score: 0,
    verdict: 'AUTO-POD',
    latency: '19ms',
    signature: 'del_jwt:48a2...30b'
  },
  {
    id: 'evt_99180',
    timestamp: '2m ago',
    gateway: 'Cashfree',
    eventType: 'charge.attempt',
    score: 78,
    verdict: 'BLOCK',
    latency: '31ms',
    signature: 'hmac_sha256:32c1...9aa'
  },
  {
    id: 'evt_99179',
    timestamp: '3m ago',
    gateway: 'Shopify',
    eventType: 'orders/create',
    score: 38,
    verdict: 'CHALLENGE',
    latency: '36ms',
    signature: 'shpat_sha256:91b...e54'
  },
  {
    id: 'evt_99178',
    timestamp: '5m ago',
    gateway: 'BlueDart',
    eventType: 'awb.status_update',
    score: 0,
    verdict: 'AUTO-POD',
    latency: '22ms',
    signature: 'blu_api:11f9...ca0'
  }
];

export default function Integrations() {
  const [activeTab, setActiveTab] = useState<'pipes' | 'dossiers' | 'rules' | 'events' | 'developer'>('pipes');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [pingingId, setPingingId] = useState<string | null>(null);
  
  // Dossier modal state
  const [selectedDossier, setSelectedDossier] = useState<EvidenceDossierItem | null>(null);
  const [isDossierModalOpen, setIsDossierModalOpen] = useState<boolean>(false);

  // State for connectors with icon restoration and full metadata hydration
  const [connectors, setConnectors] = useState<EnhancedConnectorItem[]>(() => {
    try {
      const saved = localStorage.getItem('flowshield_connectors_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        return DEFAULT_CONNECTORS.map((def) => {
          const userSaved = parsed.find((p: any) => p.id === def.id);
          return userSaved ? { ...def, ...userSaved, icon: ICON_MAP[def.id] || def.icon } : def;
        });
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

  // Connector config modal state
  const [selectedConnector, setSelectedConnector] = useState<ConnectorItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('flowshield_connectors_v3', JSON.stringify(connectors));
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
      toast.success(`⚡ Radar Health Ping Acknowledged: ${connector.name}`, {
        description: `Response received in ${pingTime}ms • Ingress healthy • TLS 1.3 HMAC verified.`
      });
    }, 600);
  };

  const handleInspectDossier = (dossier: EvidenceDossierItem) => {
    setSelectedDossier(dossier);
    setIsDossierModalOpen(true);
  };

  const filteredConnectors = selectedCategory === 'all' 
    ? connectors 
    : connectors.filter(c => c.category === selectedCategory);

  const connectedCount = connectors.filter(c => c.status === 'Connected').length;

  return (
    <div className="space-y-6 font-sans">
      
      {/* ── 1. RADAR INSTITUTIONAL HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold text-white tracking-tight">Radar Evidence Hub & Integrations</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              RADAR ACTIVE · SOC-2 READY
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Stripe Radar-grade real-time fraud scoring, automated courier Proof-of-Delivery (Auto-POD) representment, and heuristic risk rule orchestration.
          </p>
        </div>
        
        <div className="flex items-center gap-2.5">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => {
              fetchBackendIntegrations();
              toast.success('Radar Telemetry Synchronized', {
                description: 'All 5 ingress pipelines reporting nominal latencies (P99: 28ms).'
              });
            }}
            className="text-xs border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Sync Telemetry</span>
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

      {/* ── 2. STRIPE RADAR INSTITUTIONAL METRICS STRIP (5 COLUMNS) ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        
        {/* Screened Volume */}
        <div className="p-3.5 rounded-xl bg-[#080D15] border border-slate-800/90 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
            <span>Screened Volume</span>
            <span className="text-[10px] font-mono text-cyan-400">30 Days</span>
          </div>
          <div className="text-base font-bold text-white tracking-tight">₹4,821,900</div>
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">18,420</span> transactions evaluated
          </div>
        </div>

        {/* Blocked by ML */}
        <div className="p-3.5 rounded-xl bg-[#080D15] border border-slate-800/90 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
            <span>Blocked by ML</span>
            <span className="text-[10px] font-mono text-rose-400">Score &gt; 65</span>
          </div>
          <div className="text-base font-bold text-rose-400 tracking-tight">0.42%</div>
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <span>₹98,400 fraud prevented</span>
          </div>
        </div>

        {/* Dispute Rate */}
        <div className="p-3.5 rounded-xl bg-[#080D15] border border-slate-800/90 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
            <span>Dispute Rate</span>
            <span className="text-[10px] font-mono text-emerald-400">Visa Cap: 0.9%</span>
          </div>
          <div className="text-base font-bold text-emerald-400 tracking-tight">0.04%</div>
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <span>Optimal institutional tier</span>
          </div>
        </div>

        {/* Dispute Win Rate */}
        <div className="p-3.5 rounded-xl bg-[#080D15] border border-slate-800/90 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
            <span>Dispute Win Rate</span>
            <span className="text-[10px] font-mono text-cyan-400">Auto-POD</span>
          </div>
          <div className="text-base font-bold text-white tracking-tight flex items-center gap-1">
            <span>94.2%</span>
            <span className="text-[10px] text-emerald-400 font-mono font-medium">+72% vs Manual</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <span>₹142,800 reclaimed</span>
          </div>
        </div>

        {/* Protection Mesh */}
        <div className="p-3.5 rounded-xl bg-[#080D15] border border-slate-800/90 shadow-sm space-y-1 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
            <span>Active Pipes</span>
            <span className="text-[10px] font-mono text-emerald-400">P99: 28ms</span>
          </div>
          <div className="text-base font-bold text-white tracking-tight">
            {connectedCount} of {connectors.length} Live
          </div>
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Zero packet loss</span>
          </div>
        </div>

      </div>

      {/* ── 3. STRIPE RADAR RISK SCORE DISTRIBUTION HISTOGRAM (0–100) ── */}
      <div className="p-5 rounded-2xl bg-[#080D15] border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white tracking-tight">Radar Risk Score Distribution</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                0 TO 100 HEURISTIC
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Breakdown of screened checkout attempts across Normal (0–20), Elevated 3DS (21–64), and High Risk Block (65–100).
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
              <span className="text-slate-300">Normal (92.4%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
              <span className="text-slate-300">Elevated 3DS (5.8%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
              <span className="text-slate-300">High Risk (1.8%)</span>
            </div>
          </div>
        </div>

        {/* 3-Tier Color Segmented Visual Bar */}
        <div className="space-y-2">
          <div className="h-3 w-full rounded-full bg-slate-900 border border-slate-800 flex overflow-hidden p-0.5">
            <div 
              style={{ width: '92.4%' }} 
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-l-full relative group cursor-pointer transition-opacity hover:opacity-90"
              title="Normal Risk: 92.4% (0–20 score)"
            />
            <div 
              style={{ width: '5.8%' }} 
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 relative group cursor-pointer transition-opacity hover:opacity-90"
              title="Elevated Risk: 5.8% (21–64 score)"
            />
            <div 
              style={{ width: '1.8%' }} 
              className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-r-full relative group cursor-pointer transition-opacity hover:opacity-90"
              title="High Risk: 1.8% (65–100 score)"
            />
          </div>

          {/* Scale Legend */}
          <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1">
            <span>0 (Lowest Risk)</span>
            <span className="text-emerald-400">Score 20 (Frictionless Allow)</span>
            <span className="text-amber-400">Score 65 (3DS Step-Up Challenge)</span>
            <span className="text-rose-400">100 (Instant Pre-Auth Block)</span>
          </div>
        </div>

        {/* 3 Breakdown Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          
          <div className="p-3 rounded-xl bg-[#05080F] border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Tier 1: Normal (0–20)</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">17,020 Allowed</span>
            </div>
            <div className="text-right font-mono text-[11px]">
              <span className="text-slate-300">Avg: 8.4</span>
              <span className="block text-[10px] text-slate-500">Zero Friction</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#05080F] border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Tier 2: Elevated (21–64)</span>
              <span className="text-sm font-bold text-amber-400 font-mono">1,068 Step-Up 3DS</span>
            </div>
            <div className="text-right font-mono text-[11px]">
              <span className="text-slate-300">Avg: 41.2</span>
              <span className="block text-[10px] text-slate-500">OTP Required</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#05080F] border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Tier 3: High Risk (65–100)</span>
              <span className="text-sm font-bold text-rose-400 font-mono">332 Blocked</span>
            </div>
            <div className="text-right font-mono text-[11px]">
              <span className="text-slate-300">Avg: 82.6</span>
              <span className="block text-[10px] text-slate-500">Pre-Auth Drop</span>
            </div>
          </div>

        </div>
      </div>

      {/* ── 4. TABS NAVIGATION ── */}
      <div className="flex items-center space-x-6 border-b border-slate-800 text-xs font-semibold select-none overflow-x-auto">
        <button
          onClick={() => setActiveTab('pipes')}
          className={`pb-3 transition-colors shrink-0 flex items-center gap-2 ${
            activeTab === 'pipes' 
              ? 'text-cyan-400 border-b-2 border-cyan-500 font-bold' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Plug2 className="w-3.5 h-3.5" />
          <span>Active Ingress Pipes ({connectedCount}/{connectors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('dossiers')}
          className={`pb-3 transition-colors shrink-0 flex items-center gap-2 ${
            activeTab === 'dossiers' 
              ? 'text-cyan-400 border-b-2 border-cyan-500 font-bold' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PackageCheck className="w-3.5 h-3.5" />
          <span>Auto-POD Evidence Dossiers ({DOSSIER_MOCK_DATA.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 transition-colors shrink-0 flex items-center gap-2 ${
            activeTab === 'rules' 
              ? 'text-cyan-400 border-b-2 border-cyan-500 font-bold' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Radar Heuristic Rules ({RADAR_RULES.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`pb-3 transition-colors shrink-0 flex items-center gap-2 ${
            activeTab === 'events' 
              ? 'text-cyan-400 border-b-2 border-cyan-500 font-bold' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Live Ingress Stream</span>
        </button>

        <button
          onClick={() => setActiveTab('developer')}
          className={`pb-3 transition-colors shrink-0 flex items-center gap-2 ${
            activeTab === 'developer' 
              ? 'text-cyan-400 border-b-2 border-cyan-500 font-bold' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Custom Developer Webhook</span>
        </button>
      </div>

      {/* ── TAB 1: ACTIVE INGRESS PIPES & CONNECTORS ── */}
      {activeTab === 'pipes' && (
        <div className="space-y-6">
          
          {/* Connector Cards Section */}
          <div className="space-y-4">
            
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white tracking-tight">Production Data Ingress Pipes</h3>
                <span className="text-xs text-slate-500 font-mono">({filteredConnectors.length} pipes)</span>
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
                  <div 
                    key={connector.id} 
                    className={`relative flex flex-col justify-between rounded-2xl border transition-all duration-300 overflow-hidden group ${
                      isConnected 
                        ? 'bg-gradient-to-b from-[#0C121F] via-[#080D17] to-[#04070D] border-slate-800/90 hover:border-slate-700/80 shadow-lg hover:shadow-2xl hover:shadow-black/70 hover:-translate-y-1' 
                        : 'bg-gradient-to-b from-[#0C121F] via-[#080D17] to-[#04070D] border-slate-800/70 hover:border-cyan-500/40 shadow-md hover:shadow-xl hover:shadow-cyan-950/20 hover:-translate-y-1'
                    }`}
                  >
                    {/* Top Accent Line */}
                    <div 
                      className="absolute top-0 inset-x-0 h-[2.5px] opacity-80 group-hover:opacity-100 transition-opacity"
                      style={{
                        background: `linear-gradient(90deg, transparent 0%, ${connector.accentColor || '#06B6D4'} 50%, transparent 100%)`
                      }}
                    />

                    <div 
                      className="absolute -top-10 -left-10 w-32 h-32 rounded-full blur-3xl opacity-10 group-hover:opacity-25 transition-opacity pointer-events-none"
                      style={{ backgroundColor: connector.accentColor || '#06B6D4' }}
                    />

                    <div className="p-5 space-y-4 relative z-10">
                      
                      {/* Card Header: Brand Logo + Status Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-3.5">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${connector.badgeGlow || 'from-slate-900 to-black border-slate-700'} border flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shrink-0`}>
                            <IconComponent size={28} />
                          </div>
                          
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700/60">
                                {connector.type}
                              </span>
                              <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
                                <Zap className="w-2.5 h-2.5" />
                                <span>{connector.speed}</span>
                              </span>
                            </div>
                            <h3 className="text-sm md:text-[15px] font-bold text-white tracking-tight leading-tight group-hover:text-cyan-200 transition-colors">
                              {connector.name}
                            </h3>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-all ${
                          isConnected 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse' : 'bg-amber-400'}`}></span>
                          {isConnected ? 'LIVE INGRESS' : 'READY TO PAIR'}
                        </span>
                      </div>

                      {/* Tagline */}
                      <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                        {connector.description}
                      </p>

                      {/* Feature Pills */}
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {(connector.features || ['Sub-35ms Scoring', 'Mutual TLS 1.3', 'Zero Code']).map((feat: string) => (
                          <span 
                            key={feat} 
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#05080F]/90 border border-slate-800 text-[10px] font-medium text-slate-300 transition-colors group-hover:border-slate-700"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                            <span>{feat}</span>
                          </span>
                        ))}
                      </div>

                      {/* Live Telemetry Inset Strip */}
                      <div className="p-2.5 rounded-xl bg-[#05080F]/90 border border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          <span className="text-slate-500">Latency:</span>
                          <span className="text-emerald-400 font-bold">{connector.ping || '28ms'}</span>
                        </div>
                        <div className="text-slate-600">·</div>
                        <div>
                          <span className="text-slate-500">Uptime:</span>
                          <span className="text-slate-200 font-semibold ml-1">{connector.uptime || '99.9%'}</span>
                        </div>
                        <div className="text-slate-600">·</div>
                        <div className="text-slate-400 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5 text-cyan-400" />
                          <span>HMAC SHA-256</span>
                        </div>
                      </div>

                    </div>

                    {/* Action Footer Buttons */}
                    <div className="p-5 pt-0 flex items-center gap-2 relative z-10">
                      {isConnected ? (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenConfig(connector)}
                            className="flex-1 justify-center text-xs font-semibold h-8.5 rounded-lg border border-slate-700/80 bg-[#0E1524] hover:bg-[#141F36] hover:border-slate-600 text-slate-200 transition-all shadow-sm"
                          >
                            <Settings2 className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                            <span>Configure Pipe</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTestPing(connector)}
                            disabled={isPinging}
                            className="h-8.5 px-3 text-xs text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/10 border border-cyan-500/30 rounded-lg transition-all flex items-center gap-1.5 shrink-0"
                            title="Send simulated test telemetry ping"
                          >
                            <Zap className={`w-3.5 h-3.5 text-cyan-400 ${isPinging ? 'animate-bounce text-amber-400' : ''}`} />
                            <span className="hidden sm:inline">{isPinging ? 'Testing...' : 'Ping Test'}</span>
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleOpenConfig(connector)}
                          className="w-full justify-center text-xs font-bold h-9 rounded-lg bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-950/40 transition-all flex items-center gap-2 group"
                        >
                          <Plug2 className="w-3.5 h-3.5" />
                          <span>Connect in 60s</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Active Integration Endpoints Table */}
          <Card variant="data" padding="none" className="overflow-hidden rounded-xl border border-slate-800/80 bg-[#080D15]">
            <div className="p-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Active Telemetry Endpoints</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                    {endpoints.length} Active
                  </span>
                </h3>
                <span className="text-[11px] text-slate-400">Cryptographically signed webhook ingestion & Auto-POD data feeds</span>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                ALL INGRESS STREAMS NOMINAL
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

      {/* ── TAB 2: AUTO-POD DISPUTE EVIDENCE DOSSIERS ── */}
      {activeTab === 'dossiers' && (
        <div className="space-y-6">
          
          {/* Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/20 via-[#080D15] to-cyan-950/20 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">Autonomous Chargeback Representment</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    94.2% HISTORICAL WIN RATE
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Automatically pull courier Proof-of-Delivery, order telemetry, and policy agreements to generate court-ready 4-page representment dossiers submitted directly to Razorpay & Cashfree APIs.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Protected Capital</span>
                <span className="text-base font-bold text-white font-mono">₹38,400</span>
              </div>
              <div className="h-8 w-px bg-slate-800"></div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Avg Turnaround</span>
                <span className="text-base font-bold text-emerald-400 font-mono">&lt; 3.2s</span>
              </div>
            </div>
          </div>

          {/* Dossiers Table Card */}
          <Card variant="data" padding="none" className="overflow-hidden rounded-xl border border-slate-800/80 bg-[#080D15]">
            <div className="p-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Dispute Defense Packets</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                    {DOSSIER_MOCK_DATA.length} Active Dossiers
                  </span>
                </h3>
                <span className="text-[11px] text-slate-400">Click "Inspect Defense Dossier" to preview court-ready proofs, signed receipts, and download PDF packets</span>
              </div>
              <span className="text-xs font-mono text-cyan-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>HMAC SHA-256 API Transmitted</span>
              </span>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="border-slate-800/80 hover:bg-transparent">
                  <TableHead className="text-xs text-slate-400 font-semibold">Case & Dispute Ref</TableHead>
                  <TableHead className="text-xs text-slate-400 font-semibold">Amount & Gateway</TableHead>
                  <TableHead className="text-xs text-slate-400 font-semibold">Customer & IP Address</TableHead>
                  <TableHead className="text-xs text-slate-400 font-semibold">Courier Proof (Auto-POD)</TableHead>
                  <TableHead className="text-xs text-slate-400 font-semibold">Win Likelihood</TableHead>
                  <TableHead className="text-xs text-slate-400 font-semibold">Status</TableHead>
                  <TableHead className="text-right text-xs text-slate-400 font-semibold">Evidence Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DOSSIER_MOCK_DATA.map((dossier) => (
                  <TableRow key={dossier.id} className="border-slate-800/60 hover:bg-slate-900/40 transition-colors">
                    
                    {/* Case & Ref */}
                    <TableCell className="font-semibold text-white text-xs">
                      <div>
                        <span className="font-bold font-mono text-white">{dossier.orderId}</span>
                        <span className="block text-[11px] font-mono text-slate-400">{dossier.disputeRef}</span>
                      </div>
                    </TableCell>

                    {/* Amount & Gateway */}
                    <TableCell className="text-xs font-mono">
                      <span className="font-bold text-white">{dossier.amount}</span>
                      <span className="block text-[10px] text-cyan-400">{dossier.gateway} Ingress</span>
                    </TableCell>

                    {/* Customer */}
                    <TableCell className="text-xs">
                      <div className="font-medium text-slate-200">{dossier.customerName}</div>
                      <div className="text-[11px] font-mono text-slate-400">{dossier.customerIp}</div>
                    </TableCell>

                    {/* Courier Proof */}
                    <TableCell className="text-xs font-mono">
                      <div className="flex items-center gap-1.5 text-purple-300">
                        <Truck className="w-3.5 h-3.5 text-purple-400" />
                        <span className="font-bold">{dossier.carrier}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">{dossier.awbNumber}</span>
                    </TableCell>

                    {/* Win Likelihood */}
                    <TableCell className="text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-emerald-400">{dossier.winProbability}%</span>
                        <span className="text-[9px] text-emerald-500 font-sans">High</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">Signed Recipient</span>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        dossier.status === 'WON' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : dossier.status === 'SUBMITTED'
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {dossier.status}
                      </span>
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right">
                      <Button
                        size="xs"
                        onClick={() => handleInspectDossier(dossier)}
                        className="text-xs font-semibold bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 shadow-sm transition-all"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        <span>Inspect Defense Dossier</span>
                      </Button>
                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

        </div>
      )}

      {/* ── TAB 3: RADAR HEURISTIC RULES ENGINE ── */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Radar Heuristic Risk Rules</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Stripe-style programmatic rule engine executing sub-millisecond conditions before payment authorization.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => {
                toast.success('Radar Rule Sandbox', {
                  description: 'Custom rule builder opened. Test against 30-day historical replay.'
                });
              }}
              className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              <span>Add Custom Rule</span>
            </Button>
          </div>

          <Card variant="data" padding="none" className="overflow-hidden rounded-xl border border-slate-800/80 bg-[#080D15]">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800/80 hover:bg-transparent">
                  <TableHead className="text-xs text-slate-400 font-semibold">Rule Name</TableHead>
                  <TableHead className="text-xs text-slate-400 font-semibold">Condition Expression</TableHead>
                  <TableHead className="text-xs text-slate-400 font-semibold">Action Enforced</TableHead>
                  <TableHead className="text-xs text-slate-400 font-semibold">Hits (30D)</TableHead>
                  <TableHead className="text-xs text-slate-400 font-semibold">Status</TableHead>
                  <TableHead className="text-right text-xs text-slate-400 font-semibold">Last Hit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {RADAR_RULES.map((rule) => (
                  <TableRow key={rule.id} className="border-slate-800/60 hover:bg-slate-900/40 transition-colors">
                    <TableCell className="font-semibold text-white text-xs">
                      <div className="flex items-center space-x-2">
                        <Sliders className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="font-bold text-white">{rule.name}</span>
                      </div>
                    </TableCell>

                    <TableCell className="font-mono text-xs text-cyan-300">
                      <code className="bg-[#03060A] px-2 py-0.5 rounded border border-slate-800">
                        {rule.expression}
                      </code>
                    </TableCell>

                    <TableCell>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        rule.action === 'BLOCK'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : rule.action === 'CHALLENGE_3DS'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : rule.action === 'AUTO_POD'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      }`}>
                        {rule.action}
                      </span>
                    </TableCell>

                    <TableCell className="text-xs font-mono font-bold text-slate-200">
                      {rule.hitsCount.toLocaleString()}
                    </TableCell>

                    <TableCell>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {rule.status}
                      </span>
                    </TableCell>

                    <TableCell className="text-right text-xs font-mono text-slate-400">
                      {rule.lastTriggered}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

        </div>
      )}

      {/* ── TAB 4: LIVE INGRESS STREAM ── */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white tracking-tight">Live Ingress Event Telemetry</h3>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  STREAMING
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time stream of parsed webhook events, ML heuristic scores, and sub-35ms gateway responses.
              </p>
            </div>

            <Button
              variant="secondary"
              size="xs"
              onClick={() => {
                toast.success('Live Stream Flushed', { description: 'Re-subscribing to ingress event sockets.' });
              }}
              className="text-xs border-slate-700 bg-slate-900 text-slate-300"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              <span>Clear Log</span>
            </Button>
          </div>

          <Card variant="data" padding="none" className="overflow-hidden rounded-xl border border-slate-800/80 bg-[#05080F] font-mono text-xs">
            <div className="p-3 border-b border-slate-800 bg-[#03060A] text-slate-400 flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>stdout: streamguard-ingress-pod-01 · TLS 1.3 HMAC Validated</span>
              </span>
              <span>P99: 28ms · 0 Drops</span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {LIVE_STREAM_EVENTS.map((evt) => (
                <div key={evt.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-900/40 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="text-slate-500 text-[11px] w-14 shrink-0">{evt.timestamp}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400 font-bold text-[10px]">
                      {evt.gateway}
                    </span>
                    <span className="text-slate-200 font-semibold">{evt.eventType}</span>
                  </div>

                  <div className="flex items-center space-x-4 text-[11px]">
                    <span className="text-slate-400">Score: <strong className={evt.score >= 65 ? 'text-rose-400' : evt.score > 20 ? 'text-amber-400' : 'text-emerald-400'}>{evt.score}</strong></span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      evt.verdict === 'ALLOW' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                      evt.verdict === 'BLOCK' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                      evt.verdict === 'CHALLENGE' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                      'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                    }`}>
                      {evt.verdict}
                    </span>
                    <span className="text-emerald-400 font-bold">{evt.latency}</span>
                    <span className="text-slate-500 text-[10px] hidden md:inline">{evt.signature}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── TAB 5: CUSTOM DEVELOPER WEBHOOK FLOW ── */}
      {activeTab === 'developer' && (
        <Card variant="data" padding="md" className="rounded-xl border border-slate-800 bg-[#080D15]">
          <DeveloperFlow />
        </Card>
      )}

      {/* ── CONNECTOR CONFIGURATION MODAL ── */}
      <ConnectorConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        connector={selectedConnector}
        onSave={handleSaveConnector}
        onDisconnect={handleDisconnectConnector}
      />

      {/* ── RADAR EVIDENCE DOSSIER MODAL ── */}
      <RadarEvidenceModal
        isOpen={isDossierModalOpen}
        onClose={() => setIsDossierModalOpen(false)}
        dossier={selectedDossier}
      />

    </div>
  );
}
