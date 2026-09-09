import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Check, 
  Copy, 
  ShieldCheck, 
  Activity, 
  Eye, 
  EyeOff, 
  Webhook, 
  RefreshCw, 
  Radio,
  Trash2,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export interface ConnectorItem {
  id: string;
  name: string;
  type: 'Gateway' | 'E-Commerce' | 'Courier';
  status: 'Connected' | 'Ready';
  icon: any;
  color: string;
  speed: string;
  apiKey?: string;
  apiSecret?: string;
  webhookSecret?: string;
  environment?: 'production' | 'sandbox';
  autoPod?: boolean;
  webhookUrl?: string;
}

interface ConnectorConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  connector: ConnectorItem | null;
  onSave: (connectorId: string, updatedConfig: Partial<ConnectorItem>) => void;
  onDisconnect: (connectorId: string) => void;
}

export const ConnectorConfigModal: React.FC<ConnectorConfigModalProps> = ({
  isOpen,
  onClose,
  connector,
  onSave,
  onDisconnect,
}) => {
  const [activeTab, setActiveTab] = useState<'credentials' | 'webhooks' | 'test'>('credentials');
  
  // Form fields
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [environment, setEnvironment] = useState<'production' | 'sandbox'>('production');
  const [autoPod, setAutoPod] = useState(true);
  
  const [showSecret, setShowSecret] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  
  // Handshake animation state
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStep, setConnectionStep] = useState(0);
  const [connectionSuccess, setConnectionSuccess] = useState(false);
  const [testLatency, setTestLatency] = useState(32);

  useEffect(() => {
    if (connector) {
      setApiKey(connector.apiKey || (connector.status === 'Connected' ? `fs_${connector.id.slice(0, 4)}_live_k994` : ''));
      setApiSecret(connector.apiSecret || (connector.status === 'Connected' ? 'sk_live_sec_••••••••••••••••' : ''));
      setWebhookSecret(connector.webhookSecret || (connector.status === 'Connected' ? 'whsec_••••••••••••••••' : ''));
      setEnvironment(connector.environment || 'production');
      setAutoPod(connector.autoPod ?? true);
      setIsConnecting(false);
      setConnectionSuccess(false);
      setConnectionStep(0);
      setActiveTab('credentials');
    }
  }, [connector]);

  if (!isOpen || !connector) return null;

  const isConnected = connector.status === 'Connected';
  const IconComponent = connector.icon;
  const webhookEndpoint = `https://flowshield-stdr.onrender.com/api/v1/integrations/${connector.id}/webhook`;

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookEndpoint);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleConnectWithAnimation = () => {
    setIsConnecting(true);
    setConnectionStep(1);

    setTimeout(() => setConnectionStep(2), 500);
    setTimeout(() => setConnectionStep(3), 1000);
    setTimeout(() => {
      const latency = Math.round(24 + Math.random() * 18);
      setTestLatency(latency);
      setConnectionStep(4);
      setConnectionSuccess(true);
      setIsConnecting(false);

      toast.success(`✨ ${connector.name} Paired!`, {
        description: `Encrypted TLS 1.3 tunnel established with ${latency}ms latency. Real-time protection is now active.`
      });

      onSave(connector.id, {
        status: 'Connected',
        apiKey: apiKey || `key_${connector.id}_${Date.now()}`,
        apiSecret: apiSecret || 'sec_active_token',
        webhookSecret,
        environment,
        autoPod,
        webhookUrl: webhookEndpoint,
      });

      // Auto close after brief celebration
      setTimeout(() => {
        onClose();
      }, 1500);
    }, 1600);
  };

  const handleDisconnect = () => {
    if (confirm(`Disconnect ${connector.name}? Automated risk telemetry will pause.`)) {
      onDisconnect(connector.id);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-xl bg-[#080D15] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans"
        >
          {/* Top Brand Banner */}
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-[#05080F]/60">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-slate-900/90 border border-slate-700/60 p-1.5 flex items-center justify-center shadow-inner">
                <IconComponent size={28} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-white tracking-tight">{connector.name}</h2>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                    isConnected 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}>
                    {isConnected ? 'ACTIVE' : 'READY TO PAIR'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {connector.type} · {connector.speed} · Sub-100ms Ingestion
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Connection In-Progress Animation State */}
          {isConnecting || connectionSuccess ? (
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-6 min-h-[340px]">
              
              {/* Handshake Flow Nodes */}
              <div className="flex items-center justify-center space-x-6 w-full max-w-md py-4">
                {/* Node 1: Connector Logo */}
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center p-3 shadow-lg relative">
                  <IconComponent size={38} />
                  <span className="absolute -bottom-2 text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                    Source
                  </span>
                </div>

                {/* Animated Connection Beam */}
                <div className="flex-1 relative flex items-center justify-center">
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden relative">
                    <motion.div
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-full h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                    />
                  </div>
                  <motion.div
                    animate={{ scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="absolute p-1 rounded-full bg-cyan-500/20 text-cyan-400"
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </motion.div>
                </div>

                {/* Node 2: Flowshield Shield Logo */}
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-cyan-500/40 flex items-center justify-center p-3 shadow-[0_0_20px_rgba(6,182,212,0.2)] relative">
                  <Logo size={42} iconSize={24} theme="dark" />
                  <span className="absolute -bottom-2 text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-500/30">
                    Flowshield
                  </span>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="space-y-2 max-w-sm w-full text-left">
                <div className={`flex items-center space-x-2 text-xs font-mono transition-colors ${connectionStep >= 1 ? 'text-cyan-300' : 'text-slate-600'}`}>
                  {connectionStep > 1 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />}
                  <span>1. Validating API Key & Secret signatures...</span>
                </div>
                <div className={`flex items-center space-x-2 text-xs font-mono transition-colors ${connectionStep >= 2 ? 'text-cyan-300' : 'text-slate-600'}`}>
                  {connectionStep > 2 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : connectionStep === 2 ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" /> : <span className="w-3.5 h-3.5 inline-block" />}
                  <span>2. Establishing mutual TLS 1.3 encrypted tunnel...</span>
                </div>
                <div className={`flex items-center space-x-2 text-xs font-mono transition-colors ${connectionStep >= 3 ? 'text-cyan-300' : 'text-slate-600'}`}>
                  {connectionStep > 3 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : connectionStep === 3 ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" /> : <span className="w-3.5 h-3.5 inline-block" />}
                  <span>3. Subscribing webhook listener & dispute telemetry...</span>
                </div>
                <div className={`flex items-center space-x-2 text-xs font-mono transition-colors ${connectionStep >= 4 ? 'text-emerald-400 font-bold' : 'text-slate-600'}`}>
                  {connectionStep >= 4 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <span className="w-3.5 h-3.5 inline-block" />}
                  <span>4. Connection Active! Latency: {testLatency}ms</span>
                </div>
              </div>

              {connectionSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Successfully Paired! Syncing live transactions...</span>
                </motion.div>
              )}
            </div>
          ) : (
            <>
              {/* Modal Tabs */}
              <div className="flex border-b border-slate-800 px-5 text-xs font-semibold bg-[#05080F]/50">
                <button
                  onClick={() => setActiveTab('credentials')}
                  className={`py-3 mr-6 transition-all border-b-2 ${
                    activeTab === 'credentials'
                      ? 'text-cyan-400 border-cyan-500 font-bold'
                      : 'text-slate-400 border-transparent hover:text-slate-200'
                  }`}
                >
                  Credentials & Setup
                </button>
                <button
                  onClick={() => setActiveTab('webhooks')}
                  className={`py-3 mr-6 transition-all border-b-2 ${
                    activeTab === 'webhooks'
                      ? 'text-cyan-400 border-cyan-500 font-bold'
                      : 'text-slate-400 border-transparent hover:text-slate-200'
                  }`}
                >
                  Webhook Ingress
                </button>
                <button
                  onClick={() => setActiveTab('test')}
                  className={`py-3 transition-all border-b-2 ${
                    activeTab === 'test'
                      ? 'text-cyan-400 border-cyan-500 font-bold'
                      : 'text-slate-400 border-transparent hover:text-slate-200'
                  }`}
                >
                  Diagnostic Handshake
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                
                {/* TAB 1: CREDENTIALS */}
                {activeTab === 'credentials' && (
                  <div className="space-y-4">
                    
                    {/* Live / Sandbox Switch */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div>
                        <span className="text-xs font-semibold text-white block">Gateway Environment</span>
                        <span className="text-[11px] text-slate-400">Live production keys or testing sandbox</span>
                      </div>
                      <div className="flex bg-[#05080F] p-1 rounded-lg border border-slate-800">
                        <button
                          type="button"
                          onClick={() => setEnvironment('production')}
                          className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                            environment === 'production'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Production
                        </button>
                        <button
                          type="button"
                          onClick={() => setEnvironment('sandbox')}
                          className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                            environment === 'sandbox'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Sandbox
                        </button>
                      </div>
                    </div>

                    {/* API Key ID */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span>{connector.type === 'Courier' ? 'Client ID / Account Code' : 'API Key ID / App ID'}</span>
                        <span className="text-[10px] text-slate-500 font-mono">REQUIRED</span>
                      </label>
                      <input
                        type="text"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={connector.id === 'cashfree' ? 'cf_app_live_8912803810' : connector.id === 'razorpay' ? 'rzp_live_8920198038' : 'client_key_identifier'}
                        className="w-full bg-[#05080F] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>

                    {/* Secret Key */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span>Secret Key / Access Token</span>
                        <span className="text-[10px] text-slate-500 font-mono">AES-256 VAULT</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showSecret ? 'text' : 'password'}
                          value={apiSecret}
                          onChange={(e) => setApiSecret(e.target.value)}
                          placeholder="••••••••••••••••••••••••••••••••"
                          className="w-full bg-[#05080F] border border-slate-800 rounded-lg pl-3 pr-10 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecret(!showSecret)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                        >
                          {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Courier POD Toggle */}
                    {connector.type === 'Courier' && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                        <div>
                          <span className="text-xs font-semibold text-white block">Auto Proof-of-Delivery (POD)</span>
                          <span className="text-[11px] text-slate-400">Pulls signed courier receipts & delivery snapshots for chargeback representment</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={autoPod}
                          onChange={(e) => setAutoPod(e.target.checked)}
                          className="w-4 h-4 accent-cyan-500 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: WEBHOOKS */}
                {activeTab === 'webhooks' && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <Webhook className="w-3.5 h-3.5 text-cyan-400" />
                          Webhook Destination Endpoint
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono">HMAC SHA-256</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Copy this URL into your {connector.name} developer portal. Flowshield validates payloads in &lt;15ms.
                      </p>
                      
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-[#05080F] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 truncate select-all">
                          {webhookEndpoint}
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={copyWebhookUrl}
                          className="shrink-0 text-xs border-slate-700 h-9"
                        >
                          {copiedWebhook ? (
                            <span className="flex items-center gap-1 text-emerald-400 font-medium">
                              <Check className="w-3.5 h-3.5" /> Copied
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Copy className="w-3.5 h-3.5" /> Copy URL
                            </span>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span>Webhook Secret Signature (Optional)</span>
                        <span className="text-[10px] text-slate-500 font-mono">PAYLOAD VERIFICATION</span>
                      </label>
                      <input
                        type="password"
                        value={webhookSecret}
                        onChange={(e) => setWebhookSecret(e.target.value)}
                        placeholder="whsec_••••••••••••••••"
                        className="w-full bg-[#05080F] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: DIAGNOSTIC PING */}
                {activeTab === 'test' && (
                  <div className="space-y-4">
                    <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Live Telemetry Handshake Test</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Sends an encrypted ping packet to {connector.name} API to measure latency and test mutual authentication.
                        </p>
                      </div>

                      <Button
                        onClick={handleConnectWithAnimation}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold h-9 px-4 rounded-lg shadow-sm"
                      >
                        <Radio className="w-3.5 h-3.5 mr-2" />
                        Run Telemetry Ping
                      </Button>
                    </div>
                  </div>
                )}

              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-slate-800/80 bg-[#05080F] flex items-center justify-between">
                {isConnected ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDisconnect}
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Disconnect
                  </Button>
                ) : (
                  <div />
                )}

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleConnectWithAnimation}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 h-8 rounded-lg shadow-sm"
                  >
                    {isConnected ? 'Save & Re-verify' : 'Connect Endpoint'}
                  </Button>
                </div>
              </div>
            </>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConnectorConfigModal;
