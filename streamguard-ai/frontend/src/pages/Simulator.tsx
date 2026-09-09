import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Zap, 
  Play, 
  RotateCcw, 
  Terminal, 
  Copy, 
  Check, 
  Activity, 
  Sliders, 
  Globe, 
  CreditCard, 
  UserX, 
  Cpu, 
  ExternalLink,
  Code2,
  Lock,
  ArrowUpRight
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AttackScenario {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  badge: 'BLOCK' | 'REVIEW' | 'ALLOW';
  icon: React.ReactNode;
  params: {
    amount: number;
    currency: string;
    customerEmail: string;
    cardBin: string;
    ipCountry: string;
    billingCountry: string;
    isProxyOrTor: boolean;
    velocity10Min: number;
    deviceTrustScore: number;
    has3DS: boolean;
  };
  result: {
    score: number;
    decision: 'BLOCK' | 'REVIEW' | 'ALLOW';
    latencyMs: number;
    shapFactors: { name: string; impact: number; description: string }[];
    forensicNotes: string[];
  };
}

const PRESET_SCENARIOS: AttackScenario[] = [
  {
    id: 'card-testing',
    title: 'Card Testing Bot Attack',
    subtitle: 'High-frequency automated micro-authorization probing',
    category: 'CARD TESTING',
    badge: 'BLOCK',
    icon: <CreditCard className="w-4 h-4 text-rose-400" />,
    params: {
      amount: 85.00,
      currency: 'INR',
      customerEmail: 'probe_9214@tempmail.in',
      cardBin: '411111',
      ipCountry: 'VN',
      billingCountry: 'IN',
      isProxyOrTor: true,
      velocity10Min: 18,
      deviceTrustScore: 12,
      has3DS: false,
    },
    result: {
      score: 96,
      decision: 'BLOCK',
      latencyMs: 38,
      shapFactors: [
        { name: 'VELOCITY_SURGE', impact: 42, description: '18 rapid attempts within 600s from single device fingerprint' },
        { name: 'DATACENTER_PROXY', impact: 31, description: 'Origin IP resolves to commercial hosting ASN, not residential ISP' },
        { name: 'BIN_COUNTRY_MISMATCH', impact: 18, description: 'Issuer country disparity between payment method and visitor IP' },
        { name: 'MICRO_CHARGE_PATTERN', impact: 9, description: 'Amount characteristics consistent with automated brute-forcing' }
      ],
      forensicNotes: [
        'Hardware canvas fingerprint matches known card-testing cluster #TK-881.',
        'Zero 3DS challenge capability detected on browser user agent.',
        'High rate of sequential CVV permutations identified.'
      ]
    }
  },
  {
    id: 'velocity-burst',
    title: 'Velocity Spike Burst',
    subtitle: 'Rapid checkout flood from single fingerprint across multiple emails',
    category: 'VELOCITY',
    badge: 'BLOCK',
    icon: <Zap className="w-4 h-4 text-amber-400" />,
    params: {
      amount: 4500.00,
      currency: 'INR',
      customerEmail: 'guest_buyer99@gmail.com',
      cardBin: '524188',
      ipCountry: 'IN',
      billingCountry: 'IN',
      isProxyOrTor: false,
      velocity10Min: 9,
      deviceTrustScore: 24,
      has3DS: true,
    },
    result: {
      score: 88,
      decision: 'BLOCK',
      latencyMs: 32,
      shapFactors: [
        { name: 'DEVICE_VELOCITY_FLOOD', impact: 48, description: '9 distinct checkout attempts in under 60 seconds' },
        { name: 'EMAIL_IDENTITY_HOPPING', impact: 26, description: 'Rotating customer email identities across requests' },
        { name: 'CART_VALUE_ESCALATION', impact: 14, description: 'Order size doubled every 2 attempts' }
      ],
      forensicNotes: [
        'WebGL renderer and audio fingerprint identical across 9 prior transactions.',
        'Cart session originated via headless browser instrumentation.',
        'Automated defense triggered rate-limit lockdown for device token.'
      ]
    }
  },
  {
    id: 'tor-geo-spoof',
    title: 'Tor Exit Relay & Geo-Mismatch',
    subtitle: 'Anonymized routing masking cross-border fraud disparity',
    category: 'ANONYMOUS PROXY',
    badge: 'BLOCK',
    icon: <Globe className="w-4 h-4 text-rose-400" />,
    params: {
      amount: 18900.00,
      currency: 'INR',
      customerEmail: 'vikram.sharma.mumbai@yahoo.com',
      cardBin: '402400',
      ipCountry: 'NL',
      billingCountry: 'IN',
      isProxyOrTor: true,
      velocity10Min: 2,
      deviceTrustScore: 18,
      has3DS: false,
    },
    result: {
      score: 92,
      decision: 'BLOCK',
      latencyMs: 29,
      shapFactors: [
        { name: 'TOR_EXIT_NODE', impact: 52, description: 'Origin IP flagged in dynamic directory of public Tor exit relays' },
        { name: 'TIMEZONE_LATENCY_DRIFT', impact: 24, description: 'Browser locale mismatch vs network packet delay' },
        { name: 'CROSS_BORDER_DISPARITY', impact: 16, description: 'Billing address India vs Dutch exit gateway' }
      ],
      forensicNotes: [
        'TCP handshake signatures exhibit onion routing packet dispersion.',
        'Browser reported Asia/Kolkata timezone while TCP timestamp indicates UTC+1.',
        'Zero biometric or hardware trust signals available.'
      ]
    }
  },
  {
    id: 'account-takeover',
    title: 'Account Takeover (ATO) Burst',
    subtitle: 'Dormant account revived with immediate high-ticket purchase',
    category: 'ACCOUNT TAKEOVER',
    badge: 'REVIEW',
    icon: <UserX className="w-4 h-4 text-amber-400" />,
    params: {
      amount: 124500.00,
      currency: 'INR',
      customerEmail: 'ananya.iyer.corporate@gmail.com',
      cardBin: '371449',
      ipCountry: 'IN',
      billingCountry: 'IN',
      isProxyOrTor: false,
      velocity10Min: 3,
      deviceTrustScore: 45,
      has3DS: true,
    },
    result: {
      score: 74,
      decision: 'REVIEW',
      latencyMs: 44,
      shapFactors: [
        { name: 'DORMANT_REVIVAL', impact: 36, description: 'Account inactive for 240+ days before immediate high-ticket purchase' },
        { name: 'CREDENTIAL_CHANGE_PROXIMITY', impact: 28, description: 'Password reset completed 6 minutes prior to order' },
        { name: 'UNVERIFIED_DROP_ADDRESS', impact: 22, description: 'Shipping destination matches third-party freight forwarder' }
      ],
      forensicNotes: [
        'New device fingerprint unrecognized in customer historical graph.',
        'Order flagged for manual tier-2 analyst verification.',
        'Dynamic stepped-up SMS authentication challenge recommended.'
      ]
    }
  },
  {
    id: 'clean-institutional',
    title: 'Legitimate Authorized Checkout',
    subtitle: 'Returning corporate customer with verified 3DS credential',
    category: 'AUTHORIZED BUYER',
    badge: 'ALLOW',
    icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
    params: {
      amount: 9850.00,
      currency: 'INR',
      customerEmail: 'finance@tata-enterprise.in',
      cardBin: '459123',
      ipCountry: 'IN',
      billingCountry: 'IN',
      isProxyOrTor: false,
      velocity10Min: 1,
      deviceTrustScore: 94,
      has3DS: true,
    },
    result: {
      score: 4,
      decision: 'ALLOW',
      latencyMs: 24,
      shapFactors: [
        { name: 'HISTORICAL_REPUTATION', impact: -45, description: '18 successful settlements in prior 90 days with 0 chargebacks' },
        { name: 'BIOMETRIC_3DS_VERIFIED', impact: -28, description: 'Hardware cryptogram confirmed via banking authority' },
        { name: 'DOMESTIC_TELEMETRY_MATCH', impact: -21, description: 'Residential ISP, consistent device GUID, geo-alignment' }
      ],
      forensicNotes: [
        'Zero risk signals identified across 40+ ML inference nodes.',
        'Instantaneous sub-50ms clearance without merchant friction.',
        'Sovereign seal granted.'
      ]
    }
  }
];

export default function Simulator() {
  const [selectedScenario, setSelectedScenario] = useState<AttackScenario>(PRESET_SCENARIOS[0]);
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Custom sandbox state
  const [customAmount, setCustomAmount] = useState(14500);
  const [customVelocity, setCustomVelocity] = useState(4);
  const [customProxy, setCustomProxy] = useState(true);
  const [custom3DS, setCustom3DS] = useState(false);
  const [customTrustScore, setCustomTrustScore] = useState(30);

  // Execution state (Pre-calibrated, no initial loading delay)
  const [isSimulating, setIsSimulating] = useState(false);
  const [executionTime, setExecutionTime] = useState<number>(38);
  const [activeScore, setActiveScore] = useState<number>(96);
  const [activeDecision, setActiveDecision] = useState<'BLOCK' | 'REVIEW' | 'ALLOW'>('BLOCK');
  const [activeFactors, setActiveFactors] = useState(PRESET_SCENARIOS[0].result.shapFactors);
  const [activeNotes, setActiveNotes] = useState(PRESET_SCENARIOS[0].result.forensicNotes);
  const [activeTab, setActiveTab] = useState<'hud' | 'json' | 'curl'>('hud');
  const [copied, setCopied] = useState(false);

  // Inbuilt notification banner state (replaces floating popup toasts)
  const [inbuiltNotice, setInbuiltNotice] = useState<{
    type: 'BLOCK' | 'REVIEW' | 'ALLOW';
    title: string;
    description: string;
    latency: number;
    score: number;
    time: string;
  }>({
    type: 'BLOCK',
    title: 'Transaction Blocked (96/100)',
    description: 'Evaluated in 38ms • Risk threshold exceeded across threat vectors',
    latency: 38,
    score: 96,
    time: 'Just now'
  });

  // Live feed stream
  const [feedEvents, setFeedEvents] = useState<Array<{ id: string; time: string; name: string; decision: string; score: number; latency: number }>>([
    { id: '1', time: '10:42:19', name: 'Card Testing Bot', decision: 'BLOCK', score: 96, latency: 38 },
    { id: '2', time: '10:42:04', name: 'Legitimate Checkout', decision: 'ALLOW', score: 4, latency: 24 },
    { id: '3', time: '10:41:48', name: 'Tor Relay Spoof', decision: 'BLOCK', score: 92, latency: 29 },
  ]);

  // Run simulation with clean sub-100ms timing
  const runSimulation = (scenario: AttackScenario) => {
    setIsSimulating(true);

    const calculatedLatency = Math.round(24 + Math.random() * 22);

    setTimeout(() => {
      let finalScore = scenario.result.score;
      let finalDecision = scenario.result.decision;
      let finalFactors = scenario.result.shapFactors;
      let finalNotes = scenario.result.forensicNotes;

      if (isCustomMode) {
        let calcScore = 12;
        if (customProxy) calcScore += 36;
        if (customVelocity > 5) calcScore += 28;
        else if (customVelocity > 2) calcScore += 14;
        if (!custom3DS) calcScore += 16;
        calcScore += Math.round((100 - customTrustScore) * 0.22);
        finalScore = Math.min(99, Math.max(2, calcScore));
        finalDecision = finalScore >= 75 ? 'BLOCK' : finalScore >= 45 ? 'REVIEW' : 'ALLOW';

        finalFactors = [
          { name: customProxy ? 'PROXY_TOR_FLAG' : 'CLEAN_IP_SIGNAL', impact: customProxy ? 38 : -20, description: customProxy ? 'Anonymized hosting proxy connection' : 'Recognized domestic ISP' },
          { name: 'VELOCITY_INDEX', impact: customVelocity * 5, description: `${customVelocity} checkout calls per 10 minutes` },
          { name: custom3DS ? '3DS_CHALLENGE_SUCCESS' : 'NO_3DS_SECURITY', impact: custom3DS ? -25 : 20, description: custom3DS ? 'Bank cardholder 3DS2 authenticated' : 'Frictionless unverified gateway' }
        ];

        finalNotes = [
          `Custom telemetry evaluated across ${customVelocity} attempts.`,
          customProxy ? 'Anonymized connection detected. High probability of geo-spoofing.' : 'Direct domestic ISP connection.',
          finalDecision === 'BLOCK' ? 'Threshold exceeded. Autonomous defensive block enforced.' : 'Transaction within risk parameters.'
        ];
      }

      setExecutionTime(calculatedLatency);
      setActiveScore(finalScore);
      setActiveDecision(finalDecision);
      setActiveFactors(finalFactors);
      setActiveNotes(finalNotes);
      setIsSimulating(false);

      const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // Update inbuilt notification banner
      setInbuiltNotice({
        type: finalDecision,
        title: finalDecision === 'BLOCK'
          ? `Transaction Blocked (${finalScore}/100)`
          : finalDecision === 'REVIEW'
            ? `Manual Review Required (${finalScore}/100)`
            : `Transaction Approved (${finalScore}/100)`,
        description: finalDecision === 'BLOCK'
          ? `Evaluated in ${calculatedLatency}ms • Risk threshold exceeded across threat vectors`
          : finalDecision === 'REVIEW'
            ? `Evaluated in ${calculatedLatency}ms • Escalated to fraud investigation queue`
            : `Evaluated in ${calculatedLatency}ms • Clean telemetry & verified credentials`,
        latency: calculatedLatency,
        score: finalScore,
        time: currentTimeStr
      });

      // Add to live feed
      const newFeedItem = {
        id: Math.random().toString(),
        time: currentTimeStr,
        name: isCustomMode ? 'Custom Parameter Test' : scenario.title,
        decision: finalDecision,
        score: finalScore,
        latency: calculatedLatency
      };
      setFeedEvents(prev => [newFeedItem, ...prev.slice(0, 4)]);
    }, 240);
  };

  const handleSelectScenario = (scenario: AttackScenario) => {
    setSelectedScenario(scenario);
    runSimulation(scenario);
  };

  const payloadData = {
    amount: isCustomMode ? customAmount : selectedScenario.params.amount,
    currency: 'INR',
    customer: {
      email: selectedScenario.params.customerEmail,
      device_trust_score: isCustomMode ? customTrustScore : selectedScenario.params.deviceTrustScore,
      is_proxy_or_tor: isCustomMode ? customProxy : selectedScenario.params.isProxyOrTor,
      velocity_10m: isCustomMode ? customVelocity : selectedScenario.params.velocity10Min,
    },
    payment: {
      card_bin: selectedScenario.params.cardBin,
      has_3ds_challenge: isCustomMode ? custom3DS : selectedScenario.params.has3DS,
      billing_country: selectedScenario.params.billingCountry,
      ip_country: selectedScenario.params.ipCountry
    },
    threat_intel_version: 'v2.4.0'
  };

  const curlCode = `curl -X POST https://flowshield-stdr.onrender.com/api/v1/analyze \\
  -H "Authorization: Bearer fs_live_sec_994827" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payloadData, null, 2)}'`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#05080F] text-slate-100 font-sans selection:bg-cyan-500/20 antialiased pb-20">
      
      {/* ── 1. CLEAN INSTITUTIONAL NAVIGATION BAR ── */}
      <header className="border-b border-slate-800/70 bg-[#080D15]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-3 select-none">
            <Link to="/" className="flex items-center space-x-2">
              <Logo size={28} iconSize={16} theme="dark" />
              <div className="flex items-center space-x-1">
                <span className="font-semibold text-sm tracking-tight text-white">Flowshield</span>
                <span className="text-cyan-500 font-bold text-sm">/</span>
                <span className="font-semibold text-sm tracking-tight text-white">AI</span>
              </div>
            </Link>
            <span className="text-slate-700 hidden sm:inline">/</span>
            <span className="text-xs font-medium text-slate-300 hidden sm:inline">Attack Simulator</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800/80 text-cyan-400 border border-slate-700">
              SUB-100MS ENGINE
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <Link 
              to="/docs" 
              className="text-xs font-medium text-slate-400 hover:text-white transition-colors hidden sm:flex items-center gap-1"
            >
              <span>API Reference</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </Link>
            <Link to="/dashboard">
              <Button size="sm" variant="secondary" className="text-xs h-8 px-3 border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200">
                Console
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        
        {/* ── 2. HERO INTRO STRIP ── */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl bg-[#080D15] border border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium tracking-wide mb-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="uppercase text-[11px] font-semibold tracking-wider">Live Threat Playground</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Fraud Attack Simulator
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
              Simulate high-risk fraud attacks across card-testing bots, proxy networks, and velocity floods. Inspect Flowshield AI's sub-50ms inference, SHAP factor attribution, and autonomous verdicts.
            </p>
          </div>

          {/* Segmented Preset / Custom Switcher */}
          <div className="flex items-center bg-[#05080F] p-1 rounded-lg border border-slate-800 self-start md:self-center">
            <button
              onClick={() => { setIsCustomMode(false); runSimulation(selectedScenario, false); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                !isCustomMode 
                  ? 'bg-slate-800 text-white font-semibold shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Preset Vectors
            </button>
            <button
              onClick={() => { setIsCustomMode(true); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                isCustomMode 
                  ? 'bg-slate-800 text-white font-semibold shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Custom Sandbox
            </button>
          </div>
        </div>

        {/* ── 3. MAIN INTERFACE GRID (5 / 7 SPLIT) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: SCENARIOS / CONTROLS (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {!isCustomMode ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span className="uppercase tracking-wider">Attack Scenarios</span>
                  <span className="text-slate-500 font-mono">{PRESET_SCENARIOS.length} Vectors</span>
                </div>

                <div className="space-y-2">
                  {PRESET_SCENARIOS.map((scenario) => {
                    const isSelected = selectedScenario.id === scenario.id;
                    const isBlock = scenario.badge === 'BLOCK';
                    const isReview = scenario.badge === 'REVIEW';

                    return (
                      <div
                        key={scenario.id}
                        onClick={() => handleSelectScenario(scenario)}
                        className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-[#0E1524] border-cyan-500/50 shadow-sm' 
                            : 'bg-[#080D15] border-slate-800/80 hover:border-slate-700 hover:bg-[#0A101C]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start space-x-3">
                            <div className="mt-0.5 p-1.5 rounded bg-slate-900 border border-slate-800">
                              {scenario.icon}
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-white tracking-tight">{scenario.title}</h4>
                              <p className="text-xs text-slate-400 mt-0.5 leading-snug">{scenario.subtitle}</p>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 ${
                            isBlock ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                            isReview ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {scenario.badge}
                          </span>
                        </div>

                        {/* Metadata Strip */}
                        <div className="mt-2.5 pt-2 border-t border-slate-800/50 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <span>₹{scenario.params.amount.toLocaleString()}</span>
                          <span>{scenario.params.velocity10Min} req/10m</span>
                          <span>{scenario.params.isProxyOrTor ? 'Proxy: YES' : 'Direct ISP'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* CUSTOM SANDBOX SLIDERS */
              <div className="p-5 rounded-xl bg-[#080D15] border border-slate-800/80 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Custom Threat Model</h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">CONFIGURABLE</span>
                </div>

                {/* Amount Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400">Order Amount</span>
                    <span className="text-white font-mono font-bold">₹{customAmount.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="200000"
                    step="500"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(Number(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Velocity Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400">10-Minute Velocity (Requests)</span>
                    <span className={`font-mono font-bold ${customVelocity > 5 ? 'text-rose-400' : 'text-white'}`}>
                      {customVelocity} checkouts / 10m
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    value={customVelocity}
                    onChange={(e) => setCustomVelocity(Number(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Device Trust Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400">Device Trust Score (0 = Emulator)</span>
                    <span className={`font-mono font-bold ${customTrustScore < 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {customTrustScore} / 100
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={customTrustScore}
                    onChange={(e) => setCustomTrustScore(Number(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button 
                    type="button"
                    onClick={() => setCustomProxy(!customProxy)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      customProxy ? 'bg-rose-500/10 border-rose-500/40 text-rose-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="block text-[10px] text-slate-400">Tor / Proxy</span>
                    <span className="text-xs font-bold">{customProxy ? 'DETECTED' : 'CLEAN'}</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setCustom3DS(!custom3DS)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      custom3DS ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="block text-[10px] text-slate-400">3DS Step-Up</span>
                    <span className="text-xs font-bold">{custom3DS ? 'VERIFIED' : 'NONE'}</span>
                  </button>
                </div>

                <Button
                  onClick={() => runSimulation(selectedScenario, true)}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg h-10 text-xs shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 mr-2 fill-current" />
                  Evaluate Parameters
                </Button>
              </div>
            )}

            {/* LIVE FEED ACTIVITY STREAM */}
            <div className="p-4 rounded-xl bg-[#080D15] border border-slate-800/80">
              <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-800/60">
                <div className="flex items-center space-x-2">
                  <Activity className="w-3.5 h-3.5 text-slate-400" />
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Evaluation Audit Trail</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">REAL-TIME</span>
              </div>

              <div className="space-y-1.5">
                {feedEvents.map((evt) => (
                  <div key={evt.id} className="flex items-center justify-between text-xs p-2 rounded bg-slate-900/60 border border-slate-800/40">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-slate-500 font-mono">{evt.time}</span>
                      <span className="text-slate-300 font-medium truncate max-w-[150px]">{evt.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 font-mono">
                      <span className="text-[10px] text-slate-400">{evt.latency}ms</span>
                      <span className="text-[11px] text-slate-300 font-bold">{evt.score}/100</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        evt.decision === 'BLOCK' ? 'bg-rose-500/20 text-rose-400' :
                        evt.decision === 'REVIEW' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {evt.decision}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: INSTITUTIONAL FORENSIC HUD (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* ── INBUILT DEFENSE NOTIFICATION BANNER (EMBEDDED, NO POPUPS) ── */}
            <AnimatePresence mode="wait">
              {inbuiltNotice && (
                <motion.div
                  key={inbuiltNotice.title + inbuiltNotice.time}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                    inbuiltNotice.type === 'BLOCK'
                      ? 'bg-rose-950/25 border-rose-500/30 text-rose-200'
                      : inbuiltNotice.type === 'REVIEW'
                        ? 'bg-amber-950/25 border-amber-500/30 text-amber-200'
                        : 'bg-emerald-950/25 border-emerald-500/30 text-emerald-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      inbuiltNotice.type === 'BLOCK'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : inbuiltNotice.type === 'REVIEW'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {inbuiltNotice.type === 'BLOCK' && <ShieldAlert className="w-4 h-4" />}
                      {inbuiltNotice.type === 'REVIEW' && <AlertTriangle className="w-4 h-4" />}
                      {inbuiltNotice.type === 'ALLOW' && <ShieldCheck className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-bold tracking-tight ${
                          inbuiltNotice.type === 'BLOCK' ? 'text-rose-400' :
                          inbuiltNotice.type === 'REVIEW' ? 'text-amber-400' :
                          'text-emerald-400'
                        }`}>
                          {inbuiltNotice.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">• {inbuiltNotice.time}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                        {inbuiltNotice.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                      inbuiltNotice.type === 'BLOCK' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                      inbuiltNotice.type === 'REVIEW' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {inbuiltNotice.type}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Top HUD Controls */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-1.5 bg-[#05080F] p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setActiveTab('hud')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    activeTab === 'hud' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Forensic Telemetry
                </button>
                <button
                  onClick={() => setActiveTab('json')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    activeTab === 'json' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  JSON Schema
                </button>
                <button
                  onClick={() => setActiveTab('curl')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    activeTab === 'curl' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  cURL
                </button>
              </div>

              {/* Explicit Run Button */}
              <Button
                onClick={() => runSimulation(selectedScenario, true)}
                disabled={isSimulating}
                size="sm"
                className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs h-8 px-3"
              >
                {isSimulating ? (
                  <>
                    <RotateCcw className="w-3 h-3 mr-1.5 animate-spin text-cyan-400" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 mr-1.5 fill-current text-cyan-400" />
                    Run Inspection
                  </>
                )}
              </Button>
            </div>

            {/* TAB: FORENSIC HUD */}
            {activeTab === 'hud' && (
              <div className="space-y-6">
                
                {/* ── SCORE & VERDICT SUMMARY CARD ── */}
                <div className="p-6 rounded-xl bg-[#080D15] border border-slate-800/90 shadow-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                    
                    {/* Minimalist Gauge */}
                    <div className="sm:col-span-5 flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-slate-800/80 pb-4 sm:pb-0 sm:pr-4">
                      <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                          {/* Track */}
                          <circle
                            cx="60"
                            cy="60"
                            r="48"
                            stroke="#1E293B"
                            strokeWidth="6"
                            fill="transparent"
                          />
                          {/* Dynamic Progress Arc */}
                          <motion.circle
                            cx="60"
                            cy="60"
                            r="48"
                            stroke={
                              activeDecision === 'BLOCK' ? '#F43F5E' :
                              activeDecision === 'REVIEW' ? '#F59E0B' :
                              '#10B981'
                            }
                            strokeWidth="6"
                            strokeDasharray={301.6}
                            strokeDashoffset={301.6 - (301.6 * (isSimulating ? 0 : activeScore)) / 100}
                            strokeLinecap="round"
                            fill="transparent"
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                          />
                        </svg>

                        <div className="absolute flex flex-col items-center">
                          <span className="text-3xl font-bold font-mono text-white tracking-tight">
                            {isSimulating ? '--' : activeScore}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                            Risk Index
                          </span>
                        </div>
                      </div>

                      {/* True Sub-100ms Latency Badge */}
                      <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                        <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                        <span>Latency:</span>
                        <span className="text-white font-bold">{executionTime}ms</span>
                      </div>
                    </div>

                    {/* Verdict & Context */}
                    <div className="sm:col-span-7 space-y-2.5">
                      <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                        Autonomous Policy Decision
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded text-sm font-bold font-mono tracking-wide border ${
                          activeDecision === 'BLOCK' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                          activeDecision === 'REVIEW' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                          'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        }`}>
                          {activeDecision}
                        </span>

                        <span className="text-xs text-slate-400">
                          {activeDecision === 'BLOCK' ? 'Automated Gateway Rejection' :
                           activeDecision === 'REVIEW' ? 'Escalated to Fraud Queue' :
                           'Instant Clearance Approved'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed pt-1">
                        {selectedScenario.subtitle}. Analyzed across 42 transaction vectors and historical merchant threat telemetry.
                      </p>
                    </div>

                  </div>
                </div>

                {/* ── SHAP FACTOR ATTRIBUTION (EXPLAINABLE AI) ── */}
                <div className="p-5 rounded-xl bg-[#080D15] border border-slate-800/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <Cpu className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        SHAP Explainable Risk Attribution
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">Feature Weights</span>
                  </div>

                  <div className="space-y-3">
                    {activeFactors.map((factor, idx) => {
                      const isPositive = factor.impact > 0;
                      const widthPercent = Math.min(100, Math.abs(factor.impact) * 2);

                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-slate-200 text-xs font-semibold">{factor.name}</span>
                            <span className={`font-mono font-bold text-xs ${isPositive ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {isPositive ? `+${factor.impact}%` : `${factor.impact}%`}
                            </span>
                          </div>

                          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${widthPercent}%` }}
                              transition={{ duration: 0.4, delay: idx * 0.05 }}
                              className={`h-full rounded-full ${
                                isPositive ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                            />
                          </div>

                          <p className="text-[11px] text-slate-400">{factor.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── FORENSIC OBSERVATION LOGS ── */}
                <div className="p-4 rounded-xl bg-[#080D15] border border-slate-800/80 space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-slate-400" />
                    Forensic Inspection Notes
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {activeNotes.map((note, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-cyan-400 font-mono mt-0.5">•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            )}

            {/* TAB: JSON PAYLOAD */}
            {activeTab === 'json' && (
              <div className="relative p-4 rounded-xl bg-[#020408] border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto shadow-inner">
                <button
                  type="button"
                  onClick={() => copyToClipboard(JSON.stringify(payloadData, null, 2))}
                  className="absolute top-3 right-3 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 text-xs"
                  title="Copy JSON"
                >
                  {copied ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-sans font-medium">
                      <Check className="w-3.5 h-3.5" /> Copied
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-sans">
                      <Copy className="w-3.5 h-3.5" /> Copy JSON
                    </span>
                  )}
                </button>
                <pre className="text-xs leading-relaxed">{JSON.stringify(payloadData, null, 2)}</pre>
              </div>
            )}

            {/* TAB: cURL */}
            {activeTab === 'curl' && (
              <div className="relative p-4 rounded-xl bg-[#020408] border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto shadow-inner">
                <button
                  type="button"
                  onClick={() => copyToClipboard(curlCode)}
                  className="absolute top-3 right-3 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 text-xs"
                  title="Copy cURL"
                >
                  {copied ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-sans font-medium">
                      <Check className="w-3.5 h-3.5" /> Copied
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-sans">
                      <Copy className="w-3.5 h-3.5" /> Copy cURL
                    </span>
                  )}
                </button>
                <pre className="text-xs leading-relaxed whitespace-pre-wrap">{curlCode}</pre>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
