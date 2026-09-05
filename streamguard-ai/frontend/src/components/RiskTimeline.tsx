import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Ban, 
  Clock, 
  TrendingUp, 
  Activity, 
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import api from '@/services/api';

interface TimelineItem {
  id: string;
  amount: number;
  currency: string;
  risk_score: number;
  decision: string;
  risk_label: string;
  is_confirmed_fraud: boolean;
  created_at: string | null;
}

interface CustomerRiskProfile {
  risk_multiplier?: string;
  fraud_count?: string;
  dispute_count?: string;
  false_positive_count?: string;
  legitimate_count?: string;
  total_transactions?: string;
  last_updated?: string;
}

interface RiskTimelineProps {
  customerId: string;
  currentTxId?: string;
}

export const RiskTimeline: React.FC<RiskTimelineProps> = ({ customerId, currentTxId }) => {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [profile, setProfile] = useState<CustomerRiskProfile>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customerId) {
      fetchTimeline();
    }
  }, [customerId]);

  const fetchTimeline = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/transactions/customer/${customerId}/timeline`);
      setTimeline(res.data.timeline || []);
      setProfile(res.data.risk_profile || {});
    } catch (err: any) {
      console.error('Failed to load customer timeline', err);
      setError('Unable to load customer timeline.');
    } finally {
      setLoading(false);
    }
  };

  const riskMultiplier = parseFloat(profile.risk_multiplier || '0');
  const fraudCount = parseInt(profile.fraud_count || '0', 10);
  const legitimateCount = parseInt(profile.legitimate_count || '0', 10);

  return (
    <div className="space-y-5">
      {/* Customer Header Stats */}
      <div className="bg-surface-200/80 border border-border-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Customer Risk Trajectory
            </h4>
          </div>
          <button 
            onClick={fetchTimeline} 
            className="text-text-tertiary hover:text-text-primary transition-colors p-1"
            title="Refresh Timeline"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-surface-100 p-2.5 rounded border border-border-100">
            <span className="text-[10px] text-text-tertiary font-mono block">Profile Multiplier</span>
            <span className={`text-sm font-mono font-bold ${
              riskMultiplier > 0 ? 'text-red-400' : riskMultiplier < 0 ? 'text-emerald-400' : 'text-text-primary'
            }`}>
              {riskMultiplier > 0 ? `+${riskMultiplier.toFixed(2)}` : riskMultiplier.toFixed(2)}
            </span>
          </div>
          <div className="bg-surface-100 p-2.5 rounded border border-border-100">
            <span className="text-[10px] text-text-tertiary font-mono block">Confirmed Fraud</span>
            <span className={`text-sm font-mono font-bold ${fraudCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {fraudCount}
            </span>
          </div>
          <div className="bg-surface-100 p-2.5 rounded border border-border-100">
            <span className="text-[10px] text-text-tertiary font-mono block">Legitimate Txs</span>
            <span className="text-sm font-mono font-bold text-cyan-400">
              {legitimateCount}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Timeline Stream */}
      {loading ? (
        <div className="text-center py-8 text-xs text-text-tertiary font-mono animate-pulse">
          Reconstructing customer risk trajectory...
        </div>
      ) : error ? (
        <div className="text-center py-6 text-xs text-red-400 bg-red-500/10 rounded border border-red-500/20">
          {error}
        </div>
      ) : timeline.length === 0 ? (
        <div className="text-center py-8 text-xs text-text-tertiary bg-surface-100 rounded border border-border-100">
          No prior transaction history on record for this customer.
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-[2px] before:bg-border-200">
          {timeline.map((item, idx) => {
            const isCurrent = item.id === currentTxId;
            const score = Math.round(item.risk_score * 100);
            const isBlock = item.risk_score > 0.72 || item.is_confirmed_fraud;
            const isChallenge = item.risk_score > 0.35 && item.risk_score <= 0.72;
            const isApprove = item.risk_score <= 0.35;

            const dotColor = isBlock ? 'bg-red-500 ring-red-500/30' : isChallenge ? 'bg-amber-500 ring-amber-500/30' : 'bg-emerald-500 ring-emerald-500/30';
            const badgeColor = isBlock ? 'bg-red-500/10 text-red-400 border-red-500/20' : isChallenge ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

            return (
              <div 
                key={item.id} 
                className={`relative group transition-all rounded-lg p-3 border ${
                  isCurrent 
                    ? 'bg-cyan-950/20 border-cyan-500/40 shadow-sm' 
                    : 'bg-surface-200/50 border-border-100 hover:border-border-200'
                }`}
              >
                {/* Timeline node dot */}
                <div className={`absolute -left-[31px] top-4 w-3.5 h-3.5 rounded-full ring-4 ${dotColor} transition-transform group-hover:scale-125`} />

                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs text-text-primary font-bold">
                      {item.currency} {item.amount.toLocaleString('en-IN')}
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 font-mono font-semibold uppercase">
                        Current
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${badgeColor}`}>
                    {item.is_confirmed_fraud ? 'FRAUD CONFIRMED' : isBlock ? 'BLOCKED' : isChallenge ? 'CHALLENGED' : 'APPROVED'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-text-tertiary font-mono">
                  <div className="flex items-center space-x-2">
                    <span>Score: <strong className={isBlock ? 'text-red-400' : isChallenge ? 'text-amber-400' : 'text-emerald-400'}>{score}/100</strong></span>
                    <span>•</span>
                    <span>Tx #{idx + 1}</span>
                  </div>
                  <span>
                    {item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
