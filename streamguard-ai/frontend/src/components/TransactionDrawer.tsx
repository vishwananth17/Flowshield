import React, { useEffect, useState } from 'react';
import { 
  X, 
  MapPin, 
  CreditCard, 
  User, 
  ShieldCheck,
  ShieldAlert,
  Globe, 
  Monitor,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle,
  AlertOctagon,
  Copy,
  Info,
  Clock,
  Sparkles,
  Check,
  RefreshCw,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import { RiskTimeline } from './RiskTimeline';

interface TransactionDrawerProps {
  txId: string | null;
  onClose: () => void;
  onUpdate?: () => void;
}

interface SignalItem {
  name: string;
  key?: string;
  category: string;
  value: any;
  impact: number;
  reason: string;
}

export const TransactionDrawer: React.FC<TransactionDrawerProps> = ({ txId, onClose, onUpdate }) => {
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'signals' | 'timeline'>('signals');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (txId) {
      fetchDetail();
      setActiveTab('signals');
    }
  }, [txId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const resp = await api.get(`/transactions/${txId}`);
      setTx(resp.data);
    } catch (err) {
      console.error('Failed to fetch transaction details', err);
      toast.error('Failed to load transaction details.');
    } finally {
      setLoading(false);
    }
  };

  const copyTxId = () => {
    if (tx?.id) {
      navigator.clipboard.writeText(tx.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success('Transaction ID copied to clipboard');
    }
  };

  const handleOverrideApprove = async () => {
    if (!tx?.id) return;
    setActionLoading('approve');
    try {
      await api.post(`/transactions/${tx.id}/override-approve`);
      toast.success('Decision overridden: Transaction Approved.');
      setTx((prev: any) => ({ ...prev, decision: 'allow', risk_label: 'safe' }));
      if (onUpdate) onUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to override approval.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkFalsePositive = async () => {
    if (!tx?.id) return;
    setActionLoading('false-positive');
    try {
      const res = await api.post(`/transactions/${tx.id}/false-positive`);
      toast.success(res.data?.message || 'Feedback recorded — continuous learning model updated.');
      setTx((prev: any) => ({ ...prev, feedback_label: 0 }));
      if (onUpdate) onUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to record false positive.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmFraud = async () => {
    if (!tx?.id) return;
    setActionLoading('confirm-fraud');
    try {
      const res = await api.post(`/transactions/${tx.id}/confirm-fraud`);
      toast.success(res.data?.message || 'Transaction confirmed as fraud. Signatures broadcast.');
      setTx((prev: any) => ({ ...prev, is_confirmed_fraud: true, decision: 'block', risk_label: 'fraud' }));
      if (onUpdate) onUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to confirm fraud.');
    } finally {
      setActionLoading(null);
    }
  };

  if (!txId) return null;

  const rawScore = tx?.risk_score !== undefined && tx?.risk_score !== null ? Number(tx.risk_score) : 0.15;
  const scorePercent = Math.round(rawScore * 100);

  // Decision determination
  const decision = tx?.decision || (rawScore > 0.72 ? 'block' : rawScore > 0.35 ? 'challenge' : 'allow');
  const challengeMethod = tx?.challenge_method || '3ds_redirect';
  const isBlock = decision === 'block';
  const isChallenge = decision === 'challenge';
  const isApprove = decision === 'allow';

  // Format challenge display
  const challengeBadgeText = challengeMethod === 'otp_sms' ? 'CHALLENGE — OTP SMS' :
                            challengeMethod === 'manual_review' ? 'CHALLENGE — MANUAL REVIEW' :
                            'CHALLENGE — 3DS';

  // Signals list extraction
  const signalsList: SignalItem[] = [];
  if (Array.isArray(tx?.top_signals) && tx.top_signals.length > 0) {
    tx.top_signals.forEach((s: any) => {
      signalsList.push({
        name: s.name || s.signal || 'Signal Factor',
        key: s.signal,
        category: s.category || 'Behavioral',
        value: s.value !== undefined ? String(s.value) : 'Active',
        impact: Number(s.impact || 0),
        reason: s.reason || 'Telemetry indicator.'
      });
    });
  } else if (tx?.signals_json && typeof tx.signals_json === 'object') {
    Object.entries(tx.signals_json).forEach(([k, v]: [string, any]) => {
      if (v !== null && v !== false && v !== 0 && v !== 'none') {
        const valStr = typeof v === 'object' ? JSON.stringify(v) : String(v);
        signalsList.push({
          name: k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          key: k,
          category: k.includes('card') ? 'Card' : k.includes('ip') || k.includes('tor') || k.includes('vpn') ? 'Network' : k.includes('velocity') ? 'Velocity' : 'Device',
          value: valStr,
          impact: 0.05,
          reason: 'Signal captured during telemetry extraction.'
        });
      }
    });
  }

  // Sort signals by absolute impact or positive risk contribution first
  signalsList.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  // Synthesized Explanation
  const explanation = tx?.explanation || (
    isBlock 
      ? `This transaction was BLOCKED (risk score: ${scorePercent}/100). The primary risk vectors indicate critical anomaly thresholds were exceeded. Automated defense rules prohibited execution to protect merchant liability.`
      : isChallenge 
      ? `This transaction was CHALLENGED (risk score: ${scorePercent}/100). Elevated risk contributions require step-up authentication. Recommended action: Route to ${challengeMethod === 'otp_sms' ? 'SMS OTP' : '3D Secure step-up'}.`
      : `This transaction was APPROVED (risk score: ${scorePercent}/100). Positive historical trust signals and standard behavioral characteristics indicate normal customer purchase patterns.`
  );

  // Gauge Angle Calculation: 0 score = 180 deg (left), 100 score = 0 deg (right)
  const clampedScore = Math.max(0, Math.min(100, scorePercent));
  const needleAngle = 180 - (clampedScore / 100) * 180;
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleLen = 58;
  const needleX = 110 + needleLen * Math.cos(needleRad);
  const needleY = 95 - needleLen * Math.sin(needleRad);

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[540px] md:w-[600px] bg-[#0A0F1D] border-l border-border-200 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* Header Bar */}
      <div className="p-5 border-b border-border-100 flex items-start justify-between bg-surface-100/60 backdrop-blur-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-text-tertiary">TRANSACTION</span>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded flex items-center gap-1.5">
              {tx?.id ? `${tx.id.substring(0, 18)}...` : 'Analyzing...'}
              <button 
                onClick={copyTxId} 
                className="hover:text-white transition-colors"
                title="Copy full transaction ID"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </span>
          </div>

          <div className="flex items-center space-x-3 pt-1">
            <h2 className="text-2xl font-bold font-mono text-white">
              {tx?.currency || '₹'} {Number(tx?.amount || 0).toLocaleString('en-IN')}
            </h2>
            <span className="text-xs text-text-secondary font-medium">
              {tx?.merchant_name || 'Checkout Gateway'}
            </span>
          </div>
        </div>

        <button 
          onClick={onClose} 
          className="p-1.5 rounded-lg bg-surface-200 text-text-tertiary hover:text-white hover:bg-surface-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border-100 bg-surface-100/40 px-5">
        <button
          onClick={() => setActiveTab('signals')}
          className={`py-3 text-xs font-mono font-semibold flex items-center space-x-2 border-b-2 transition-all mr-6 ${
            activeTab === 'signals'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-text-tertiary hover:text-text-secondary'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Decision & Signal Vectors</span>
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`py-3 text-xs font-mono font-semibold flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === 'timeline'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-text-tertiary hover:text-text-secondary'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Customer Risk Timeline</span>
        </button>
      </div>

      {/* Drawer Content Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {loading && !tx ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
            <span className="text-xs text-text-tertiary font-mono">Decoupling telemetry signals...</span>
          </div>
        ) : activeTab === 'timeline' ? (
          <RiskTimeline customerId={tx?.customer_id || 'anonymous'} currentTxId={tx?.id} />
        ) : (
          <>
            {/* Risk Gauge Hero Card */}
            <div className="bg-surface-200/50 border border-border-200 rounded-xl p-5 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Arc Gauge SVG */}
              <div className="relative w-[220px] h-[125px] flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 220 120">
                  <defs>
                    <linearGradient id="gaugeArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="35%" stopColor="#10B981" />
                      <stop offset="42%" stopColor="#F59E0B" />
                      <stop offset="72%" stopColor="#F59E0B" />
                      <stop offset="78%" stopColor="#EF4444" />
                      <stop offset="100%" stopColor="#EF4444" />
                    </linearGradient>
                  </defs>

                  {/* Base Track */}
                  <path
                    d="M 30 95 A 80 80 0 0 1 190 95"
                    fill="none"
                    stroke="#1E293B"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />

                  {/* Gradient Multi-Tier Arc */}
                  <path
                    d="M 30 95 A 80 80 0 0 1 190 95"
                    fill="none"
                    stroke="url(#gaugeArcGrad)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    opacity="0.85"
                  />

                  {/* Needle Indicator */}
                  <line
                    x1="110"
                    y1="95"
                    x2={needleX}
                    y2={needleY}
                    stroke="#FFFFFF"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                  <circle cx="110" cy="95" r="7" fill="#0F172A" stroke="#FFFFFF" strokeWidth="2.5" />

                  {/* Arc boundary tick labels */}
                  <text x="24" y="112" fill="#64748B" fontSize="9" fontFamily="JetBrains Mono">0</text>
                  <text x="80" y="32" fill="#64748B" fontSize="9" fontFamily="JetBrains Mono">35</text>
                  <text x="135" y="32" fill="#64748B" fontSize="9" fontFamily="JetBrains Mono">72</text>
                  <text x="192" y="112" fill="#64748B" fontSize="9" fontFamily="JetBrains Mono">100</text>
                </svg>
              </div>

              {/* Numeric Readout & Decision Badge */}
              <div className="mt-1 space-y-2">
                <div className="flex items-baseline justify-center space-x-1 font-mono">
                  <span className={`text-3xl font-extrabold ${
                    isBlock ? 'text-red-400' : isChallenge ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {scorePercent}
                  </span>
                  <span className="text-xs text-text-tertiary font-bold">/ 100</span>
                </div>

                {/* Primary Decision Badge */}
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${
                    isBlock 
                      ? 'bg-red-500/15 text-red-400 border-red-500/30' 
                      : isChallenge 
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' 
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {isBlock && <AlertOctagon className="w-3.5 h-3.5" />}
                    {isChallenge && <AlertTriangle className="w-3.5 h-3.5" />}
                    {isApprove && <CheckCircle className="w-3.5 h-3.5" />}
                    {isBlock ? 'BLOCK — FRAUD' : isChallenge ? challengeBadgeText : 'APPROVE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Decision Explanation (Auto-Generated Paragraph) */}
            <div className="bg-surface-200/60 border border-border-100 rounded-lg p-4 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Decision Explanation</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed font-sans">
                {explanation}
              </p>
            </div>

            {/* Signal Breakdown Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  Signal Breakdown ({signalsList.length} Extracted)
                </h4>
                <span className="text-[10px] text-text-tertiary font-mono">Sorted by Impact</span>
              </div>

              {signalsList.length === 0 ? (
                <div className="text-center py-6 text-xs text-text-tertiary bg-surface-200/40 rounded border border-border-100">
                  Standard baseline risk parameters applied.
                </div>
              ) : (
                <div className="border border-border-100 rounded-lg overflow-hidden bg-surface-100/30">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-surface-200/80 text-text-tertiary border-b border-border-100 text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3 font-medium">Signal Factor</th>
                        <th className="py-2.5 px-3 font-medium">Value</th>
                        <th className="py-2.5 px-3 font-medium text-right">Impact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-100/60">
                      {signalsList.map((sig, idx) => {
                        const isRisk = sig.impact > 0;
                        const isTrust = sig.impact < 0;
                        const impactStr = isRisk 
                          ? `+${sig.impact.toFixed(2)}` 
                          : isTrust 
                          ? sig.impact.toFixed(2) 
                          : '0.00';

                        return (
                          <tr key={idx} className="hover:bg-surface-200/40 transition-colors group">
                            <td className="py-2.5 px-3">
                              <div className="flex flex-col">
                                <div className="flex items-center space-x-1.5">
                                  <span className="text-text-primary font-semibold group-hover:text-cyan-400 transition-colors">
                                    {sig.name}
                                  </span>
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-surface-300 text-text-tertiary">
                                    {sig.category}
                                  </span>
                                </div>
                                <span className="text-[10px] text-text-tertiary font-sans mt-0.5 line-clamp-1">
                                  {sig.reason}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-text-secondary">
                              <span className="px-1.5 py-0.5 rounded bg-surface-200 text-[11px]">
                                {sig.value}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className={`inline-flex items-center gap-1 font-bold ${
                                isRisk ? 'text-red-400' : isTrust ? 'text-emerald-400' : 'text-slate-400'
                              }`}>
                                {isRisk && <ArrowUp className="w-3 h-3 text-red-400 stroke-[2.5]" />}
                                {isTrust && <ArrowDown className="w-3 h-3 text-emerald-400 stroke-[2.5]" />}
                                {!isRisk && !isTrust && <Minus className="w-3 h-3 text-slate-400" />}
                                {impactStr}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Context Details Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-surface-200/50 p-3 rounded-lg border border-border-100 space-y-1">
                <div className="flex items-center space-x-1.5 text-text-tertiary text-[10px] font-mono uppercase">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Card Token</span>
                </div>
                <p className="text-xs font-mono font-bold text-text-primary">
                  •••• {tx?.card_last_four || 'XXXX'} ({tx?.card_type || 'VISA'})
                </p>
              </div>

              <div className="bg-surface-200/50 p-3 rounded-lg border border-border-100 space-y-1">
                <div className="flex items-center space-x-1.5 text-text-tertiary text-[10px] font-mono uppercase">
                  <Globe className="w-3.5 h-3.5" />
                  <span>IP Geolocation</span>
                </div>
                <p className="text-xs font-mono font-bold text-text-primary">
                  {tx?.customer_country || 'IN'} ({tx?.customer_city || 'Domestic'})
                </p>
              </div>

              <div className="bg-surface-200/50 p-3 rounded-lg border border-border-100 space-y-1">
                <div className="flex items-center space-x-1.5 text-text-tertiary text-[10px] font-mono uppercase">
                  <User className="w-3.5 h-3.5" />
                  <span>Customer Identifier</span>
                </div>
                <p className="text-xs font-mono font-bold text-text-primary truncate">
                  {tx?.customer_id || 'guest_user'}
                </p>
              </div>

              <div className="bg-surface-200/50 p-3 rounded-lg border border-border-100 space-y-1">
                <div className="flex items-center space-x-1.5 text-text-tertiary text-[10px] font-mono uppercase">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Analyzed At</span>
                </div>
                <p className="text-xs font-mono text-text-secondary">
                  {tx?.created_at ? new Date(tx.created_at).toLocaleString() : 'Just now'}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Analyst Action Buttons (Bottom Bar) */}
      <div className="p-4 border-t border-border-100 bg-surface-100/90 backdrop-blur-sm space-y-2">
        <div className="grid grid-cols-3 gap-2">
          
          {/* Override Approve */}
          <button
            onClick={handleOverrideApprove}
            disabled={actionLoading !== null || isApprove}
            className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {actionLoading === 'approve' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle className="w-3.5 h-3.5" />
            )}
            <span>Override: Approve</span>
          </button>

          {/* Mark False Positive */}
          <button
            onClick={handleMarkFalsePositive}
            disabled={actionLoading !== null}
            className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title="Feeds back into continuous learning loop to retrain model"
          >
            {actionLoading === 'false-positive' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileCheck className="w-3.5 h-3.5" />
            )}
            <span>Mark False Positive</span>
          </button>

          {/* Confirm Fraud */}
          <button
            onClick={handleConfirmFraud}
            disabled={actionLoading !== null || tx?.is_confirmed_fraud}
            className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {actionLoading === 'confirm-fraud' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <AlertOctagon className="w-3.5 h-3.5" />
            )}
            <span>Confirm Fraud</span>
          </button>
        </div>
      </div>

    </div>
  );
};
