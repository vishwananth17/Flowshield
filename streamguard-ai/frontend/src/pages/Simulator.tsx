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
  Layers,
  Fingerprint,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { RiskBadge, type RiskLevel } from '@/components/ui/RiskBadge';
import { RiskScore } from '@/components/ui/RiskScore';

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
    paymentMethod?: string;
    vpa?: string;
    upiApp?: string;
    upiFlowType?: string;
    pincode?: string;
    isCod?: boolean;
    rtoRiskScore?: number;
    gateway?: string;
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
    id: 'upi-1930-freeze',
    title: 'UPI Collect & 1930 Police Freeze Vector',
    subtitle: 'Unsolicited UPI collect request with burner VPA cycling threatening merchant bank account freeze',
    category: 'UPI & CYBERCRIME 1930',
    badge: 'BLOCK',
    icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
    params: {
      amount: 48500.00,
      currency: 'INR',
      customerEmail: 'probe_claim89@rediffmail.com',
      cardBin: 'UPI (GPay / YBL)',
      paymentMethod: 'upi',
      vpa: 'refund.claim88@ybl',
      upiApp: 'Google Pay',
      upiFlowType: 'collect',
      gateway: 'razorpay',
      ipCountry: 'IN',
      billingCountry: 'IN',
      isProxyOrTor: false,
      velocity10Min: 12,
      deviceTrustScore: 14,
      has3DS: false,
    },
    result: {
      score: 95,
      decision: 'BLOCK',
      latencyMs: 27,
      shapFactors: [
        { name: 'CYBERCRIME_1930_FREEZE_DEFENSE', impact: 48, description: 'Virtual Payment Address matched active cybercrime syndicate mule cluster. Section 102 CrPC defense triggered.' },
        { name: 'UNSOLICITED_UPI_COLLECT', impact: 28, description: 'Inverted UPI collect request initiated without active checkout or cart session tokens' },
        { name: 'BURNER_VPA_CYCLING', impact: 19, description: '6 distinct UPI IDs registered across single hardware GUID within 15 minutes' },
        { name: 'RAPID_SUB_SECOND_CALLS', impact: 8, description: 'Automated intent generation bypassing native human biometric screen authentication' }
      ],
      forensicNotes: [
        'Proactive freeze defense triggered: Preventing MHA Cybercrime Portal (1930) Section 102 CrPC merchant bank account freeze.',
        'UPI Collect intent dispatched without active session token; typical social engineering reverse refund vector.',
        'Hardware canvas fingerprint matched previously frozen ICICI/Axis gateway settlement complaints.'
      ]
    }
  },
  {
    id: 'd2c-rto-syndicate',
    title: 'D2C Cash on Delivery (COD) & RTO Syndicate',
    subtitle: 'High-value COD order routed to repeat courier return-to-origin refusal cluster',
    category: 'RTO / COD ABUSE',
    badge: 'REVIEW',
    icon: <Layers className="w-4 h-4 text-amber-400" />,
    params: {
      amount: 8990.00,
      currency: 'INR',
      customerEmail: 'buyer.patna02@gmail.com',
      cardBin: 'CASH ON DELIVERY',
      paymentMethod: 'cod',
      isCod: true,
      pincode: '800001',
      rtoRiskScore: 86,
      gateway: 'cashfree',
      ipCountry: 'IN',
      billingCountry: 'IN',
      isProxyOrTor: false,
      velocity10Min: 4,
      deviceTrustScore: 32,
      has3DS: false,
    },
    result: {
      score: 82,
      decision: 'REVIEW',
      latencyMs: 31,
      shapFactors: [
        { name: 'HIGH_RISK_RTO_DELIVERY_CLUSTER', impact: 44, description: 'Destination pincode 800001 exhibits >42% courier return-to-origin and refusal rate' },
        { name: 'FIRST_TIME_HIGH_TICKET_COD', impact: 26, description: 'Order size exceeds ₹5,000 threshold for unverified first-time buyer on COD' },
        { name: 'INCOMPLETE_STREET_ENTROPY', impact: 16, description: 'Generic street description increases first-attempt courier non-delivery by 3.8x' }
      ],
      forensicNotes: [
        'RTO Risk Index: 86/100. Autonomous action: Convert COD to Prepaid UPI (+5% instant discount incentive).',
        'Direct freight savings: Merchant avoids ₹180 forward + reverse courier penalty fees on refusal.',
        'Device token previously associated with 2 undelivered packages on Delhivery network.'
      ]
    }
  },
  {
    id: 'card-testing',
    title: 'Card Testing Bot Attack',
    subtitle: 'High-frequency micro-authorization probing across card clusters',
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
        { name: 'VELOCITY_SURGE', impact: 42, description: '18 rapid authorization attempts within 600s from single device GUID' },
        { name: 'DATACENTER_PROXY', impact: 31, description: 'Origin IP resolves to commercial hosting ASN rather than residential carrier' },
        { name: 'BIN_COUNTRY_MISMATCH', impact: 18, description: 'Issuer country disparity between payment method (IN) and client IP (VN)' },
        { name: 'MICRO_CHARGE_PATTERN', impact: 9, description: 'Sub-₹100 amount consistent with automated card validation brute-forcing' }
      ],
      forensicNotes: [
        'Hardware canvas fingerprint matches active card-testing syndicate cluster #TK-881.',
        'Zero 3DS biometric challenge capability detected on headless browser user agent.',
        'Rapid sequential CVV permutation sequence detected across 4 preceding requests.'
      ]
    }
  },
  {
    id: 'velocity-burst',
    title: 'Velocity Spike Burst',
    subtitle: 'Automated checkout flood rotating email identities across single device',
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
        { name: 'DEVICE_VELOCITY_FLOOD', impact: 48, description: '9 distinct checkout attempts in under 60 seconds from same hardware hash' },
        { name: 'EMAIL_IDENTITY_HOPPING', impact: 26, description: 'Rotating disposable customer email identities across sequential requests' },
        { name: 'CART_VALUE_ESCALATION', impact: 14, description: 'Order size doubled every 2 attempts without browsing session history' }
      ],
      forensicNotes: [
        'WebGL renderer and audio context fingerprint identical across 9 prior transactions.',
        'Cart session initiated via headless Chromium instrumentation without human cursor movement.',
        'Rate-limit threshold triggered: Device token temporarily quarantined.'
      ]
    }
  },
  {
    id: 'tor-geo-spoof',
    title: 'Tor Exit Relay & Geo-Mismatch',
    subtitle: 'Anonymized routing masking cross-border payment disparity',
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
        { name: 'TOR_EXIT_NODE', impact: 52, description: 'Origin IP flagged in dynamic real-time directory of public Tor exit relays' },
        { name: 'TIMEZONE_LATENCY_DRIFT', impact: 24, description: 'Browser locale (Asia/Kolkata) diverges from network round-trip packet delay' },
        { name: 'CROSS_BORDER_DISPARITY', impact: 16, description: 'Billing address in Mumbai, India routed through Netherlands exit node' }
      ],
      forensicNotes: [
        'TCP handshake signatures exhibit onion routing packet dispersion characteristics.',
        'Browser reported Asia/Kolkata timezone while TCP timestamp indicates UTC+1 (Amsterdam).',
        'Zero biometric or persistent hardware trust signals available.'
      ]
    }
  },
  {
    id: 'account-takeover',
    title: 'Account Takeover (ATO) Burst',
    subtitle: 'Dormant user account revived with immediate high-ticket purchase',
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
        { name: 'CREDENTIAL_CHANGE_PROXIMITY', impact: 28, description: 'Password reset and 2FA credential updated 6 minutes prior to transaction' },
        { name: 'UNVERIFIED_DROP_ADDRESS', impact: 22, description: 'Shipping destination matches third-party commercial freight forwarder' }
      ],
      forensicNotes: [
        'New device hardware fingerprint unrecognized in customer historical telemetry graph.',
        'Order routed to tier-2 risk analyst verification queue.',
        'Dynamic step-up biometric SMS challenge recommended before fulfillment.'
      ]
    }
  },
  {
    id: 'clean-institutional',
    title: 'Legitimate Authorized Checkout',
    subtitle: 'Returning enterprise corporate customer with verified 3DS credential',
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
        { name: 'HISTORICAL_REPUTATION', impact: -45, description: '18 successful settlements in prior 90 days with zero chargebacks' },
        { name: 'BIOMETRIC_3DS_VERIFIED', impact: -28, description: 'Hardware cryptogram confirmed via banking authority 3DS2 channel' },
        { name: 'DOMESTIC_TELEMETRY_MATCH', impact: -21, description: 'Verified residential ISP, consistent device GUID, and geographic alignment' }
      ],
      forensicNotes: [
        'Zero anomalous risk signals identified across 42 ML inference evaluation nodes.',
        'Instantaneous sub-50ms clearance granted without merchant friction.',
        'Zero-liability merchant protection active.'
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

  // Execution state
  const [isSimulating, setIsSimulating] = useState(false);
  const [executionTime, setExecutionTime] = useState<number>(38);
  const [activeScore, setActiveScore] = useState<number>(96);
  const [activeDecision, setActiveDecision] = useState<'BLOCK' | 'REVIEW' | 'ALLOW'>('BLOCK');
  const [activeFactors, setActiveFactors] = useState(PRESET_SCENARIOS[0].result.shapFactors);
  const [activeNotes, setActiveNotes] = useState(PRESET_SCENARIOS[0].result.forensicNotes);
  const [activeTab, setActiveTab] = useState<'forensics' | 'json' | 'curl'>('forensics');
  const [copied, setCopied] = useState(false);

  // Live feed stream
  const [feedEvents, setFeedEvents] = useState<Array<{ id: string; time: string; name: string; decision: string; score: number; latency: number }>>([
    { id: '1', time: '18:24:19', name: 'Card Testing Bot Attack', decision: 'BLOCK', score: 96, latency: 38 },
    { id: '2', time: '18:24:04', name: 'Legitimate Authorized Checkout', decision: 'ALLOW', score: 4, latency: 24 },
    { id: '3', time: '18:23:48', name: 'Tor Exit Relay & Geo-Mismatch', decision: 'BLOCK', score: 92, latency: 29 },
  ]);

  // Run simulation with clean sub-100ms timing
  const runSimulation = (scenario: AttackScenario, useCustom: boolean = isCustomMode) => {
    setIsSimulating(true);
    const calculatedLatency = Math.round(22 + Math.random() * 20);

    setTimeout(() => {
      let finalScore = scenario.result.score;
      let finalDecision = scenario.result.decision;
      let finalFactors = scenario.result.shapFactors;
      let finalNotes = scenario.result.forensicNotes;

      if (useCustom) {
        let calcScore = 14;
        if (customProxy) calcScore += 38;
        if (customVelocity > 5) calcScore += 26;
        else if (customVelocity > 2) calcScore += 12;
        if (!custom3DS) calcScore += 18;
        calcScore += Math.round((100 - customTrustScore) * 0.20);
        finalScore = Math.min(99, Math.max(2, calcScore));
        finalDecision = finalScore >= 75 ? 'BLOCK' : finalScore >= 45 ? 'REVIEW' : 'ALLOW';

        finalFactors = [
          { 
            name: customProxy ? 'PROXY_TOR_FLAG' : 'CLEAN_IP_SIGNAL', 
            impact: customProxy ? 40 : -22, 
            description: customProxy ? 'Anonymized hosting proxy or Tor exit relay connection detected' : 'Recognized domestic residential carrier ASN' 
          },
          { 
            name: 'VELOCITY_INDEX', 
            impact: customVelocity * 5, 
            description: `${customVelocity} checkout calls per 10 minutes from client fingerprint` 
          },
          { 
            name: custom3DS ? '3DS_CHALLENGE_SUCCESS' : 'NO_3DS_SECURITY', 
            impact: custom3DS ? -24 : 18, 
            description: custom3DS ? 'Bank cardholder 3DS2 cryptographic challenge authenticated' : 'Frictionless unverified payment gateway routing' 
          }
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

      // Add to live feed
      const newFeedItem = {
        id: Math.random().toString(),
        time: currentTimeStr,
        name: useCustom ? 'Custom Parameter Test' : scenario.title,
        decision: finalDecision,
        score: finalScore,
        latency: calculatedLatency
      };
      setFeedEvents(prev => [newFeedItem, ...prev.slice(0, 3)]);
    }, 220);
  };

  const handleSelectScenario = (scenario: AttackScenario) => {
    setSelectedScenario(scenario);
    runSimulation(scenario, false);
  };

  const payloadData = {
    amount: isCustomMode ? customAmount : selectedScenario.params.amount,
    currency: 'INR',
    payment_method: selectedScenario.params.paymentMethod || 'card',
    gateway: selectedScenario.params.gateway || 'razorpay',
    customer: {
      email: selectedScenario.params.customerEmail,
      device_trust_score: isCustomMode ? customTrustScore : selectedScenario.params.deviceTrustScore,
      is_proxy_or_tor: isCustomMode ? customProxy : selectedScenario.params.isProxyOrTor,
      velocity_10m: isCustomMode ? customVelocity : selectedScenario.params.velocity10Min,
    },
    ...(selectedScenario.params.paymentMethod === 'upi' ? {
      upi: {
        vpa: selectedScenario.params.vpa,
        app: selectedScenario.params.upiApp,
        flow_type: selectedScenario.params.upiFlowType,
      }
    } : selectedScenario.params.isCod ? {
      delivery: {
        pincode: selectedScenario.params.pincode,
        is_cod: true,
        rto_risk_score: selectedScenario.params.rtoRiskScore
      }
    } : {
      card: {
        card_bin: selectedScenario.params.cardBin,
        has_3ds_challenge: isCustomMode ? custom3DS : selectedScenario.params.has3DS,
        billing_country: selectedScenario.params.billingCountry,
        ip_country: selectedScenario.params.ipCountry
      }
    }),
    threat_intel_version: 'v2.4.0'
  };

  const curlCode = `curl -X POST https://api.flowshield.ai/v1/evaluations \\
  -H "Authorization: Bearer fs_live_sec_994827" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payloadData, null, 2)}'`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert scenario badge to RiskLevel for the institutional RiskBadge
  const getRiskLevel = (badge: 'BLOCK' | 'REVIEW' | 'ALLOW', score: number): RiskLevel => {
    if (badge === 'BLOCK' || score >= 85) return 'critical';
    if (badge === 'REVIEW' || score >= 60) return 'high';
    if (score >= 35) return 'medium';
    return 'low';
  };

  const activeRiskLevel = getRiskLevel(activeDecision, activeScore);

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 font-sans selection:bg-indigo-500/20 antialiased pb-20">
      
      {/* ── 1. CLEAN TOPBAR ── */}
      <header className="border-b border-slate-800/80 bg-[#0B0F19]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[52px] flex items-center justify-between">
          <div className="flex items-center space-x-3 select-none">
            <Link to="/" className="flex items-center space-x-2.5">
              <Logo size={24} iconSize={14} theme="dark" />
              <span className="font-semibold text-sm tracking-tight text-white">Flowshield</span>
            </Link>
            <span className="text-slate-700">/</span>
            <span className="text-xs font-medium text-slate-300">Attack Simulator</span>
            
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Inference Engine v2.4</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link 
              to="/docs" 
              className="text-xs font-medium text-slate-400 hover:text-white transition-colors hidden sm:flex items-center gap-1.5"
            >
              <span>API Reference</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </Link>
            <Link to="/dashboard">
              <Button size="sm" variant="secondary" className="text-xs h-8 px-3 border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200">
                Open Console
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        
        {/* ── 2. WORKSPACE HEADER ── */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/60">
          <div>
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium tracking-wide mb-1">
              <span>Interactive Threat Sandbox</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400 font-mono">Sub-50ms Evaluation</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Fraud Attack Simulator
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Execute adversarial payment scenarios against Flowshield's multi-layered fraud engine. Inspect autonomous verdicts, SHAP feature attributions, and forensic device signals.
            </p>
          </div>

          {/* Segmented Preset / Custom Switcher */}
          <div className="inline-flex items-center p-1 rounded-lg bg-[#0F172A] border border-slate-800 self-start md:self-center shrink-0">
            <button
              onClick={() => { setIsCustomMode(false); runSimulation(selectedScenario, false); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                !isCustomMode 
                  ? 'bg-slate-800 text-white font-semibold shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Preset Vectors ({PRESET_SCENARIOS.length})
            </button>
            <button
              onClick={() => { setIsCustomMode(true); runSimulation(selectedScenario, true); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                isCustomMode 
                  ? 'bg-slate-800 text-white font-semibold shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Custom Sandbox
            </button>
          </div>
        </div>

        {/* ── 3. MAIN WORKSPACE GRID (5 / 7 SPLIT) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ── LEFT COLUMN: SCENARIO SELECTOR / CONTROLS (5 cols) ── */}
          <div className="lg:col-span-5 space-y-5">
            
            {!isCustomMode ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
                  <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-400">Threat Scenarios</span>
                  <span className="text-slate-500 font-mono text-[11px]">Select to simulate</span>
                </div>

                {/* Scenario List */}
                <div className="space-y-2">
                  {PRESET_SCENARIOS.map((scenario) => {
                    const isSelected = selectedScenario.id === scenario.id;
                    const riskLvl = getRiskLevel(scenario.badge, scenario.result.score);

                    return (
                      <div
                        key={scenario.id}
                        onClick={() => handleSelectScenario(scenario)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                          isSelected 
                            ? 'bg-[#121A2B] border-indigo-500/40 ring-1 ring-indigo-500/20 shadow-xs' 
                            : 'bg-[#0E1524]/60 border-slate-800/80 hover:bg-[#121A2B]/70 hover:border-slate-700/80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-start space-x-3">
                            <div className="mt-0.5 p-2 rounded-lg bg-slate-900/80 border border-slate-800 shrink-0">
                              {scenario.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs sm:text-sm font-semibold text-white tracking-tight">
                                  {scenario.title}
                                </h4>
                              </div>
                              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-snug">
                                {scenario.subtitle}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 pt-0.5">
                            <RiskBadge level={riskLvl} size="sm" />
                          </div>
                        </div>

                        {/* Clean Metadata Micro-strip */}
                        <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="text-slate-500">Value:</span>
                            <span className="text-slate-300 font-semibold">₹{scenario.params.amount.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="text-slate-500">Rate:</span>
                            <span className="text-slate-300">{scenario.params.velocity10Min} req/10m</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                              scenario.params.isProxyOrTor 
                                ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' 
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {scenario.params.isProxyOrTor ? 'Proxy Detected' : 'Direct ISP'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* CUSTOM SANDBOX CONFIGURATOR */
              <div className="p-5 rounded-xl bg-[#0E1524]/80 border border-slate-800 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Custom Parameter Matrix</h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">CONFIGURABLE</span>
                </div>

                {/* Amount Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400">Transaction Amount</span>
                    <span className="text-white font-mono font-bold">₹{customAmount.toLocaleString()} INR</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="200000"
                    step="500"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(Number(e.target.value))}
                    className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>₹50</span>
                    <span>₹1,00,000</span>
                    <span>₹2,00,000</span>
                  </div>
                </div>

                {/* Velocity Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400">10-Minute Velocity Window</span>
                    <span className={`font-mono font-bold ${customVelocity > 5 ? 'text-rose-400' : 'text-slate-200'}`}>
                      {customVelocity} checkout calls
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    value={customVelocity}
                    onChange={(e) => setCustomVelocity(Number(e.target.value))}
                    className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>1 (Normal)</span>
                    <span>10 (High)</span>
                    <span>25 (Attack)</span>
                  </div>
                </div>

                {/* Device Trust Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400">Device Hardware Trust Score</span>
                    <span className={`font-mono font-bold ${customTrustScore < 30 ? 'text-rose-400' : customTrustScore > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {customTrustScore} / 100
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={customTrustScore}
                    onChange={(e) => setCustomTrustScore(Number(e.target.value))}
                    className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>5 (Suspicious / Bot)</span>
                    <span>50</span>
                    <span>100 (Verified HW)</span>
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button 
                    type="button"
                    onClick={() => setCustomProxy(!customProxy)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      customProxy 
                        ? 'bg-rose-500/[0.08] border-rose-500/30 text-rose-300' 
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="block text-[10px] text-slate-400 uppercase font-medium">Proxy / Tor Route</span>
                    <span className="text-xs font-bold font-mono mt-0.5 block">{customProxy ? 'DETECTED' : 'RESIDENTIAL ISP'}</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setCustom3DS(!custom3DS)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      custom3DS 
                        ? 'bg-emerald-500/[0.08] border-emerald-500/30 text-emerald-300' 
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="block text-[10px] text-slate-400 uppercase font-medium">3DS Authentication</span>
                    <span className="text-xs font-bold font-mono mt-0.5 block">{custom3DS ? 'AUTHENTICATED' : 'BYPASSED'}</span>
                  </button>
                </div>

                <Button
                  onClick={() => runSimulation(selectedScenario, true)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg h-9 text-xs shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 mr-2 fill-current" />
                  Run Custom Simulation
                </Button>
              </div>
            )}

            {/* LIVE EVALUATION AUDIT STREAM */}
            <div className="p-4 rounded-xl bg-[#0E1524]/60 border border-slate-800/80">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/60">
                <div className="flex items-center space-x-2">
                  <Activity className="w-3.5 h-3.5 text-slate-400" />
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Evaluation Audit Trail</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">REAL-TIME</span>
              </div>

              <div className="space-y-1.5">
                {feedEvents.map((evt) => {
                  const evtLvl = evt.decision === 'BLOCK' ? 'critical' : evt.decision === 'REVIEW' ? 'high' : 'low';
                  return (
                    <div key={evt.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/50 border border-slate-800/50">
                      <div className="flex items-center space-x-2 truncate mr-2">
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">{evt.time}</span>
                        <span className="text-slate-300 font-medium truncate">{evt.name}</span>
                      </div>
                      <div className="flex items-center space-x-2 font-mono shrink-0">
                        <span className="text-[10px] text-slate-400">{evt.latency}ms</span>
                        <RiskBadge level={evtLvl} score={evt.score} size="sm" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN: INSTITUTIONAL INSPECTOR PANEL (7 cols) ── */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Top Toolbar Strip */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-1 p-1 rounded-lg bg-[#0F172A] border border-slate-800">
                <button
                  onClick={() => setActiveTab('forensics')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    activeTab === 'forensics' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Decision & Forensics
                </button>
                <button
                  onClick={() => setActiveTab('json')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    activeTab === 'json' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Payload Schema (JSON)
                </button>
                <button
                  onClick={() => setActiveTab('curl')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    activeTab === 'curl' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  cURL Request
                </button>
              </div>

              {/* Action Button */}
              <Button
                onClick={() => runSimulation(selectedScenario, isCustomMode)}
                disabled={isSimulating}
                size="sm"
                className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs h-8 px-3"
              >
                {isSimulating ? (
                  <>
                    <RotateCcw className="w-3 h-3 mr-1.5 animate-spin text-indigo-400" />
                    Evaluating...
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 mr-1.5 fill-current text-indigo-400" />
                    Simulate API Call
                  </>
                )}
              </Button>
            </div>

            {/* TAB: DECISION & FORENSICS */}
            {activeTab === 'forensics' && (
              <div className="space-y-4">
                
                {/* ── 1. AUTONOMOUS VERDICT BANNER ── */}
                <div className="p-4 sm:p-5 rounded-xl bg-[#0E1524] border border-slate-800/90 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <RiskBadge level={activeRiskLevel} size="md" />
                        <span className="text-xs font-mono text-slate-400">
                          Execution: <strong className="text-slate-200 font-semibold">{executionTime}ms</strong>
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-white tracking-tight pt-1">
                        {activeDecision === 'BLOCK' ? 'Autonomous Gateway Verdict: Blocked' :
                         activeDecision === 'REVIEW' ? 'Autonomous Gateway Verdict: Manual Review Required' :
                         'Autonomous Gateway Verdict: Approved & Cleared'}
                      </h2>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                        {isCustomMode 
                          ? 'Evaluated against custom parameter threat matrix and automated merchant policy rules.'
                          : `${selectedScenario.subtitle}. Evaluated across 42 ML risk vectors and global merchant threat intelligence.`}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800/60 shrink-0">
                      <span className="text-[11px] text-slate-500 uppercase font-semibold">Engine Latency</span>
                      <span className="text-lg font-bold font-mono text-white">{executionTime}ms</span>
                    </div>
                  </div>

                  {/* Standardized RiskScore Spectrum */}
                  <div className="pt-4">
                    <RiskScore score={activeScore} />
                  </div>
                </div>

                {/* ── 2. SHAP EXPLAINABILITY (CLEAN ATTRIBUTION) ── */}
                <div className="p-5 rounded-xl bg-[#0E1524] border border-slate-800/90 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                    <div className="flex items-center space-x-2">
                      <Cpu className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        SHAP Explainable Risk Attribution
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">Relative Feature Weights</span>
                  </div>

                  <div className="space-y-3.5">
                    {activeFactors.map((factor, idx) => {
                      const isPositive = factor.impact > 0;
                      const widthPercent = Math.min(100, Math.abs(factor.impact) * 2);

                      return (
                        <div key={idx} className="space-y-1.5 p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/40">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-slate-200 font-semibold text-xs">{factor.name}</span>
                            </div>
                            <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                              isPositive 
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {isPositive ? `+${factor.impact}% Risk` : `${factor.impact}% Risk`}
                            </span>
                          </div>

                          {/* Subtle, refined progress bar */}
                          <div className="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${widthPercent}%` }}
                              transition={{ duration: 0.4, delay: idx * 0.04 }}
                              className={`h-full rounded-full ${
                                isPositive ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                            />
                          </div>

                          <p className="text-[11px] text-slate-400 leading-snug">{factor.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── 3. TRANSACTION TELEMETRY GRID ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-[#0E1524] border border-slate-800/80 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Order Value</span>
                    <p className="text-xs font-mono font-bold text-white">
                      ₹{(isCustomMode ? customAmount : selectedScenario.params.amount).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0E1524] border border-slate-800/80 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">
                      {selectedScenario.params.paymentMethod === 'upi' ? 'UPI Identity' : selectedScenario.params.isCod ? 'Logistics' : 'Payment Method'}
                    </span>
                    <p className="text-xs font-mono font-bold text-white truncate">
                      {selectedScenario.params.paymentMethod === 'upi' 
                        ? (selectedScenario.params.vpa || 'UPI Native')
                        : selectedScenario.params.isCod
                        ? `PIN ${selectedScenario.params.pincode} (COD)`
                        : `${selectedScenario.params.cardBin} • Card`}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0E1524] border border-slate-800/80 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">
                      {selectedScenario.params.paymentMethod === 'upi' ? 'UPI Flow' : selectedScenario.params.isCod ? 'RTO Risk Index' : 'Network Route'}
                    </span>
                    <p className="text-xs font-mono font-bold text-slate-200 truncate">
                      {selectedScenario.params.paymentMethod === 'upi'
                        ? `${selectedScenario.params.upiApp} (${selectedScenario.params.upiFlowType?.toUpperCase()})`
                        : selectedScenario.params.isCod
                        ? `${selectedScenario.params.rtoRiskScore}/100 High Risk`
                        : ((isCustomMode ? customProxy : selectedScenario.params.isProxyOrTor) ? 'Proxy / Tor' : 'Direct Carrier')}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0E1524] border border-slate-800/80 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Security Defense</span>
                    <p className="text-xs font-mono font-bold text-slate-200 truncate">
                      {selectedScenario.params.paymentMethod === 'upi'
                        ? '1930 Freeze Check'
                        : selectedScenario.params.isCod
                        ? 'Prepaid UPI Prompt'
                        : ((isCustomMode ? custom3DS : selectedScenario.params.has3DS) ? 'Challenge OK' : 'No 3DS')}
                    </p>
                  </div>
                </div>

                {/* ── 4. FORENSIC INSPECTION EVIDENCE ── */}
                <div className="p-4 rounded-xl bg-[#0E1524] border border-slate-800/80 space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-slate-400" />
                    Forensic Engine Observations
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {activeNotes.map((note, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                        <span className="text-indigo-400 font-mono mt-0.5">•</span>
                        <span className="text-slate-300">{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            )}

            {/* TAB: JSON PAYLOAD */}
            {activeTab === 'json' && (
              <div className="relative p-4 rounded-xl bg-[#070A12] border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto shadow-inner">
                <button
                  type="button"
                  onClick={() => copyToClipboard(JSON.stringify(payloadData, null, 2))}
                  className="absolute top-3 right-3 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 text-xs border border-slate-700"
                  title="Copy JSON Payload"
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
                <pre className="text-xs leading-relaxed text-slate-300">{JSON.stringify(payloadData, null, 2)}</pre>
              </div>
            )}

            {/* TAB: cURL */}
            {activeTab === 'curl' && (
              <div className="relative p-4 rounded-xl bg-[#070A12] border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto shadow-inner">
                <button
                  type="button"
                  onClick={() => copyToClipboard(curlCode)}
                  className="absolute top-3 right-3 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 text-xs border border-slate-700"
                  title="Copy cURL Command"
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
                <pre className="text-xs leading-relaxed whitespace-pre-wrap text-slate-300">{curlCode}</pre>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
