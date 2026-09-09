import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Shield, 
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
  ArrowRight,
  Sparkles,
  ExternalLink,
  Code
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface AttackScenario {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'CLEAN';
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
  expectedResult: {
    score: number;
    decision: 'ALLOW' | 'REVIEW' | 'BLOCK';
    latencyMs: number;
    shapFactors: { name: string; impact: number; description: string }[];
    forensicNotes: string[];
  };
}

const PRESET_SCENARIOS: AttackScenario[] = [
  {
    id: 'card-testing',
    title: 'Card Testing Botnet Storm',
    subtitle: 'Automated micro-transaction probe attack',
    category: 'CARD TESTING',
    severity: 'CRITICAL',
    icon: <CreditCard className="w-5 h-5 text-red-400" />,
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
    expectedResult: {
      score: 96,
      decision: 'BLOCK',
      latencyMs: 38,
      shapFactors: [
        { name: 'VELOCITY_SURGE', impact: 42, description: '18 rapid attempts from single hardware fingerprint' },
        { name: 'DATACENTER_PROXY', impact: 31, description: 'Traffic routed through commercial hosting subnet' },
        { name: 'BIN_COUNTRY_MISMATCH', impact: 18, description: 'Card issuer located in US, IP located in Vietnam' },
        { name: 'MICRO_CHARGE_PATTERN', impact: 9, description: 'Amount characteristics match card validation brute-force' }
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
    subtitle: 'High-frequency checkout flood from unified device',
    category: 'VELOCITY ATTACK',
    severity: 'CRITICAL',
    icon: <Zap className="w-5 h-5 text-amber-400" />,
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
    expectedResult: {
      score: 88,
      decision: 'BLOCK',
      latencyMs: 44,
      shapFactors: [
        { name: 'DEVICE_VELOCITY_FLOOD', impact: 48, description: '9 distinct checkout attempts in under 60 seconds' },
        { name: 'EMAIL_IDENTITY_HOPPING', impact: 26, description: 'Rotating customer email identities across requests' },
        { name: 'CART_VALUE_ESCALATION', impact: 14, description: 'Order size doubled every 2 attempts' }
      ],
      forensicNotes: [
        'WebGL renderer and audio fingerprint identical across 9 prior transactions.',
        'Cart session originated via headless script instrumentation.',
        'Automated defense triggered rate-limit lockdown for device token.'
      ]
    }
  },
  {
    id: 'tor-geo-spoof',
    title: 'Tor Exit Relay & Geo-Spoofing',
    subtitle: 'Anonymized routing masking cross-border fraud',
    category: 'ANONYMOUS PROXY',
    severity: 'HIGH',
    icon: <Globe className="w-5 h-5 text-purple-400" />,
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
    expectedResult: {
      score: 92,
      decision: 'BLOCK',
      latencyMs: 35,
      shapFactors: [
        { name: 'TOR_EXIT_NODE', impact: 52, description: 'Origin IP flagged in dynamic directory of public Tor relays' },
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
    subtitle: 'Dormant profile revived with sudden luxury cart',
    category: 'ACCOUNT TAKEOVER',
    severity: 'MEDIUM',
    icon: <UserX className="w-5 h-5 text-amber-400" />,
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
    expectedResult: {
      score: 74,
      decision: 'REVIEW',
      latencyMs: 51,
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
    title: 'Legitimate Institutional Checkout',
    subtitle: 'Verified corporate transaction with trusted history',
    category: 'AUTHORIZED BUYER',
    severity: 'CLEAN',
    icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
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
    expectedResult: {
      score: 4,
      decision: 'ALLOW',
      latencyMs: 31,
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

  // Execution state
  const [isSimulating, setIsSimulating] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [activeScore, setActiveScore] = useState<number>(0);
  const [activeDecision, setActiveDecision] = useState<'ALLOW' | 'REVIEW' | 'BLOCK'>('BLOCK');
  const [activeFactors, setActiveFactors] = useState<typeof PRESET_SCENARIOS[0]['expectedResult']['shapFactors']>([]);
  const [activeNotes, setActiveNotes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'hud' | 'json' | 'curl'>('hud');
  const [copied, setCopied] = useState(false);

  // Live feed stream
  const [feedEvents, setFeedEvents] = useState<Array<{ id: string; time: string; name: string; decision: string; score: number }>>([
    { id: '1', time: '10:42:19', name: 'Card Testing Bot #9', decision: 'BLOCK', score: 96 },
    { id: '2', time: '10:42:04', name: 'Standard Checkout #81', decision: 'ALLOW', score: 4 },
    { id: '3', time: '10:41:48', name: 'Tor Relay Spoof #12', decision: 'BLOCK', score: 92 },
  ]);

  // Trigger evaluation
  const runSimulation = (scenario: AttackScenario) => {
    setIsSimulating(true);
    setHasRun(false);

    const startTime = performance.now();

    setTimeout(() => {
      const elapsed = Math.round(performance.now() - startTime + (Math.random() * 10 + 28));
      
      let finalScore = scenario.expectedResult.score;
      let finalDecision = scenario.expectedResult.decision;
      let finalFactors = scenario.expectedResult.shapFactors;
      let finalNotes = scenario.expectedResult.forensicNotes;

      // Dynamic adjustment if in custom mode
      if (isCustomMode) {
        let calcScore = 10;
        if (customProxy) calcScore += 35;
        if (customVelocity > 5) calcScore += 30;
        else if (customVelocity > 2) calcScore += 15;
        if (!custom3DS) calcScore += 15;
        calcScore += Math.round((100 - customTrustScore) * 0.25);
        finalScore = Math.min(99, Math.max(2, calcScore));
        finalDecision = finalScore >= 75 ? 'BLOCK' : finalScore >= 45 ? 'REVIEW' : 'ALLOW';
        
        finalFactors = [
          { name: customProxy ? 'PROXY_TOR_FLAG' : 'CLEAN_IP_SIGNAL', impact: customProxy ? 38 : -20, description: customProxy ? 'High-risk anonymized proxy connection' : 'Recognized domestic ISP' },
          { name: 'VELOCITY_INDEX', impact: customVelocity * 5, description: `${customVelocity} checkout calls per minute` },
          { name: custom3DS ? '3DS_CHALLENGE_SUCCESS' : 'NO_3DS_SECURITY', impact: custom3DS ? -25 : 20, description: custom3DS ? 'Bank cardholder 3DS2 confirmed' : 'Frictionless unverified gateway' }
        ];

        finalNotes = [
          `Custom telemetry evaluated across ${customVelocity} attempts.`,
          customProxy ? 'Anonymized connection detected. High probability of geo-spoofing.' : 'Direct domestic ISP connection.',
          finalDecision === 'BLOCK' ? 'Threshold exceeded. Autonomous defensive block enforced.' : 'Transaction within risk parameters.'
        ];
      }

      setExecutionTime(elapsed);
      setActiveScore(finalScore);
      setActiveDecision(finalDecision);
      setActiveFactors(finalFactors);
      setActiveNotes(finalNotes);
      setIsSimulating(false);
      setHasRun(true);

      // Add to live feed
      const newFeedItem = {
        id: Math.random().toString(),
        time: new Date().toLocaleTimeString(),
        name: isCustomMode ? 'Custom Attack Test' : scenario.title,
        decision: finalDecision,
        score: finalScore
      };
      setFeedEvents(prev => [newFeedItem, ...prev.slice(0, 5)]);

      if (finalDecision === 'BLOCK') {
        toast.error(`Autonomous Shield: ${scenario.title} Blocked!`, {
          description: `Threat score: ${finalScore}/100 • Latency: ${elapsed}ms`
        });
      } else if (finalDecision === 'REVIEW') {
        toast.warning(`Manual Review Triggered: Score ${finalScore}/100`, {
          description: `Latency: ${elapsed}ms • Escalation dispatched`
        });
      } else {
        toast.success(`Transaction Verified & Approved`, {
          description: `Threat score: ${finalScore}/100 • Clean latency: ${elapsed}ms`
        });
      }
    }, 650);
  };

  // Run automatically on first load
  useEffect(() => {
    runSimulation(PRESET_SCENARIOS[0]);
  }, []);

  // Prepare cURL & JSON representations
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
    toast.success('Payload copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#05080F] text-slate-100 font-sans selection:bg-cyan-500/30 pb-20">
      
      {/* Top Ambient Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[20%] w-[50%] h-[40%] bg-cyan-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Simulator Hero & Header */}
      <div className="border-b border-slate-800/80 bg-[#080D15]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base text-white tracking-tight">Flowshield Attack Simulator</span>
                <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-[10px] font-mono uppercase">
                  LIVE TELEMETRY
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Sub-100ms Autonomous Threat Verification & Forensic Scoring</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <a 
              href="/docs" 
              className="text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors hidden sm:flex items-center gap-1.5"
            >
              <span>View API Docs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a href="/dashboard">
              <Button size="sm" variant="outline" className="border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-xs">
                Console Dashboard
              </Button>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        
        {/* Intro Banner */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#080D15] border border-cyan-500/20 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Penetration Sandbox</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Test Real-World Fraud Vectors in Real Time
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
              Trigger simulated card testing storms, velocity floods, and Tor geo-spoofing. Observe Flowshield AI calculate risk probability, identify SHAP feature drivers, and enforce autonomous decisions in milliseconds.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-[#05080F] p-1.5 rounded-xl border border-slate-800 self-start md:self-center">
            <button
              onClick={() => { setIsCustomMode(false); runSimulation(selectedScenario); }}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${!isCustomMode ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Preset Attack Vectors
            </button>
            <button
              onClick={() => { setIsCustomMode(true); }}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${isCustomMode ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Custom Sandbox
            </button>
          </div>
        </div>

        {/* MAIN WORKSPACE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* =========================================================================
              LEFT COLUMN: SCENARIO SELECTION / CUSTOM SANDBOX (5 cols)
              ========================================================================= */}
          <div className="lg:col-span-5 space-y-6">
            
            {!isCustomMode ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Attack Scenario</h3>
                  <span className="text-[11px] text-slate-500">{PRESET_SCENARIOS.length} Vectors Available</span>
                </div>

                <div className="space-y-2.5">
                  {PRESET_SCENARIOS.map((scenario) => {
                    const isSelected = selectedScenario.id === scenario.id;
                    const isBlock = scenario.expectedResult.decision === 'BLOCK';
                    const isReview = scenario.expectedResult.decision === 'REVIEW';

                    return (
                      <div
                        key={scenario.id}
                        onClick={() => {
                          setSelectedScenario(scenario);
                          runSimulation(scenario);
                        }}
                        className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                          isSelected 
                            ? 'bg-[#0E1726] border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/40' 
                            : 'bg-[#080D15] border-slate-800/80 hover:border-slate-700 hover:bg-[#0A101C]'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                              {scenario.icon}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="text-sm font-semibold text-white">{scenario.title}</h4>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">{scenario.subtitle}</p>
                            </div>
                          </div>

                          <Badge 
                            variant="outline" 
                            className={`text-[10px] font-mono font-semibold uppercase ${
                              isBlock ? 'border-red-500/30 bg-red-500/10 text-red-400' :
                              isReview ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' :
                              'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                            }`}
                          >
                            {scenario.expectedResult.decision}
                          </Badge>
                        </div>

                        {/* Parameter Snapshot */}
                        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <span>₹{scenario.params.amount.toLocaleString()}</span>
                          <span>Velocity: {scenario.params.velocity10Min} req/10m</span>
                          <span>{scenario.params.isProxyOrTor ? 'TOR/Proxy: YES' : 'Proxy: NO'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* CUSTOM SANDBOX SLIDERS */
              <div className="p-6 rounded-2xl bg-[#080D15] border border-cyan-500/20 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Custom Risk Parameters</h3>
                  </div>
                  <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-[10px] font-mono">
                    SANDBOX
                  </Badge>
                </div>

                {/* Amount Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400">Transaction Amount</span>
                    <span className="text-white font-mono font-bold">₹{customAmount.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="200000"
                    step="500"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(Number(e.target.value))}
                    className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Velocity Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400">10-Minute Velocity (Requests)</span>
                    <span className={`font-mono font-bold ${customVelocity > 5 ? 'text-red-400' : 'text-white'}`}>
                      {customVelocity} checkouts / 10m
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    value={customVelocity}
                    onChange={(e) => setCustomVelocity(Number(e.target.value))}
                    className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Device Trust Score Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400">Device Trust / Entropy (0 = Emulator)</span>
                    <span className={`font-mono font-bold ${customTrustScore < 30 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {customTrustScore} / 100
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={customTrustScore}
                    onChange={(e) => setCustomTrustScore(Number(e.target.value))}
                    className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Boolean Toggles */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div 
                    onClick={() => setCustomProxy(!customProxy)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      customProxy ? 'bg-red-500/10 border-red-500/40 text-red-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span>Tor / Proxy</span>
                      <span className="font-bold">{customProxy ? 'ACTIVE' : 'OFF'}</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => setCustom3DS(!custom3DS)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      custom3DS ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span>3DS Verified</span>
                      <span className="font-bold">{custom3DS ? 'PASS' : 'NONE'}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => runSimulation(selectedScenario)}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl h-11 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                >
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  Evaluate Custom Risk Model
                </Button>
              </div>
            )}

            {/* LIVE FEED ACTIVITY STREAM */}
            <div className="p-5 rounded-2xl bg-[#080D15] border border-slate-800/80 shadow-lg">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800/60 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Live Defense Feed</h3>
                </div>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
                </span>
              </div>

              <div className="space-y-2">
                {feedEvents.map((evt) => (
                  <div key={evt.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/50 border border-slate-800/40">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-[10px] text-slate-500 font-mono">{evt.time}</span>
                      <span className="text-slate-200 font-medium truncate max-w-[170px]">{evt.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[11px] text-slate-400">{evt.score}/100</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                        evt.decision === 'BLOCK' ? 'bg-red-500/20 text-red-400' :
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

          {/* =========================================================================
              RIGHT COLUMN: REAL-TIME HUD RADAR & DECISION CONSOLE (7 cols)
              ========================================================================= */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* HUD Top Bar / Tab Nav */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('hud')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeTab === 'hud' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Real-Time Forensics</span>
                </button>
                <button
                  onClick={() => setActiveTab('json')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeTab === 'json' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>JSON Payload</span>
                </button>
                <button
                  onClick={() => setActiveTab('curl')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeTab === 'curl' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>cURL Command</span>
                </button>
              </div>

              {/* Trigger Attack Button */}
              <Button
                onClick={() => runSimulation(selectedScenario)}
                disabled={isSimulating}
                size="sm"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.25)] text-xs"
              >
                {isSimulating ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                    Execute Defense Check
                  </>
                )}
              </Button>
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'hud' && (
              <div className="space-y-6">
                
                {/* RADAR & DECISION HERO CARD */}
                <div className="p-6 rounded-2xl bg-[#080D15] border border-cyan-500/20 shadow-2xl relative overflow-hidden">
                  
                  {/* Subtle Radar Background Waves */}
                  <div className="absolute right-0 top-0 w-80 h-80 rounded-full bg-cyan-500/5 blur-[80px] pointer-events-none" />

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                    
                    {/* Radial Score Meter */}
                    <div className="sm:col-span-5 flex flex-col items-center justify-center p-4">
                      <div className="relative w-36 h-36 flex items-center justify-center">
                        {/* Outer Glow Ring */}
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                          <circle
                            cx="60"
                            cy="60"
                            r="50"
                            className="stroke-slate-800"
                            strokeWidth="8"
                            fill="transparent"
                          />
                          <motion.circle
                            cx="60"
                            cy="60"
                            r="50"
                            stroke={
                              activeDecision === 'BLOCK' ? '#EF4444' :
                              activeDecision === 'REVIEW' ? '#F59E0B' :
                              '#10B981'
                            }
                            strokeWidth="8"
                            strokeDasharray={314}
                            strokeDashoffset={314 - (314 * (isSimulating ? 0 : activeScore)) / 100}
                            strokeLinecap="round"
                            fill="transparent"
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                          />
                        </svg>

                        {/* Center Gauge Stats */}
                        <div className="absolute flex flex-col items-center text-center">
                          {isSimulating ? (
                            <div className="animate-pulse text-cyan-400 font-mono text-sm">CALCULATING</div>
                          ) : (
                            <>
                              <span className="text-3xl font-black font-mono text-white tracking-tight">{activeScore}</span>
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Risk Score</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Execution Speed Badge */}
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Inference Latency:</span>
                        <span className="text-cyan-300 font-bold">{executionTime || 38}ms</span>
                      </div>
                    </div>

                    {/* Decision Verdict & Summary */}
                    <div className="sm:col-span-7 space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Autonomous Verdict</span>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className={`px-4 py-2 rounded-xl text-lg font-black font-mono tracking-wider flex items-center gap-2 border ${
                          activeDecision === 'BLOCK' ? 'bg-red-500/10 border-red-500/40 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]' :
                          activeDecision === 'REVIEW' ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]' :
                          'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                        }`}>
                          {activeDecision === 'BLOCK' && <ShieldAlert className="w-5 h-5" />}
                          {activeDecision === 'REVIEW' && <AlertTriangle className="w-5 h-5" />}
                          {activeDecision === 'ALLOW' && <ShieldCheck className="w-5 h-5" />}
                          <span>{activeDecision}</span>
                        </div>
                        
                        <div className="text-xs text-slate-400">
                          {activeDecision === 'BLOCK' ? 'Intercepted & Rejected (Sub-100ms)' :
                           activeDecision === 'REVIEW' ? 'Escalated to Fraud Analyst Queue' :
                           'Instant Clearance Granted'}
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed pt-1">
                        {selectedScenario.subtitle}. All risk weights evaluated across probability density models.
                      </p>
                    </div>

                  </div>
                </div>

                {/* SHAP FEATURE ATTRIBUTION BREAKDOWN */}
                <div className="p-6 rounded-2xl bg-[#080D15] border border-slate-800/80 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <Cpu className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        SHAP Forensic Factor Attribution
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-500">Explainable ML Telemetry</span>
                  </div>

                  <div className="space-y-3.5">
                    {activeFactors.map((factor, idx) => {
                      const isPositive = factor.impact > 0;
                      const widthPercent = Math.min(100, Math.abs(factor.impact) * 2);

                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-slate-200">{factor.name}</span>
                            <span className={`font-mono font-bold ${isPositive ? 'text-red-400' : 'text-emerald-400'}`}>
                              {isPositive ? `+${factor.impact}%` : `${factor.impact}%`}
                            </span>
                          </div>

                          {/* Attribution Progress Track */}
                          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${widthPercent}%` }}
                              transition={{ duration: 0.6, delay: idx * 0.1 }}
                              className={`h-full rounded-full ${
                                isPositive 
                                  ? 'bg-gradient-to-r from-red-600 to-red-400' 
                                  : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                              }`}
                            />
                          </div>

                          <p className="text-[11px] text-slate-400 leading-normal">{factor.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* FORENSIC OBSERVATION LOGS */}
                <div className="p-5 rounded-2xl bg-[#080D15] border border-slate-800/80 shadow-lg space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    Forensic Inspection Notes
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
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
              <div className="relative p-5 rounded-2xl bg-[#020408] border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto shadow-xl">
                <button
                  onClick={() => copyToClipboard(JSON.stringify(payloadData, null, 2))}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Copy JSON"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <pre>{JSON.stringify(payloadData, null, 2)}</pre>
              </div>
            )}

            {/* TAB: cURL */}
            {activeTab === 'curl' && (
              <div className="relative p-5 rounded-2xl bg-[#020408] border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto shadow-xl">
                <button
                  onClick={() => copyToClipboard(curlCode)}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Copy cURL"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <pre className="text-slate-300 whitespace-pre-wrap">{curlCode}</pre>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
