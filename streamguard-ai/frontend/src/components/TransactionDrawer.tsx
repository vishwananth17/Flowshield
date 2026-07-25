import { useEffect, useState } from 'react';
import { 
  X, 
  MapPin, 
  CreditCard, 
  User, 
  ShieldCheck,
  Globe,
  Monitor
} from 'lucide-react';
import api from '@/services/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Heading3, Label, Caption } from '@/components/ui/Typography';

interface TransactionDrawerProps {
  txId: string | null;
  onClose: () => void;
}

export const TransactionDrawer: React.FC<TransactionDrawerProps> = ({ txId, onClose }) => {
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (txId) {
      fetchDetail();
    }
  }, [txId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const resp = await api.get(`/transactions/${txId}`);
      setTx(resp.data);
    } catch (err) {
      console.error('Failed to fetch transaction details', err);
    } finally {
      setLoading(false);
    }
  };

  if (!txId) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[460px] bg-[var(--bg-surface)] border-l border-[var(--border-default)] shadow-[var(--shadow-xl)] z-50 slide-in transition-all duration-300 ease-out font-body text-left">
      <div className="h-full flex flex-col relative">
        {loading && <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[2px] shimmer" />}
        
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-default)] flex justify-between items-start bg-[var(--bg-inset)]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">
                {tx?.risk_label || 'ANALYZING...'}
              </Badge>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">{(tx?.id || '').substring(0, 13)}</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {tx?.merchant_name || 'Transaction Details'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-highlight)] rounded-lg text-[var(--text-muted)] hover:text-white transition-all cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Amount Hero */}
          <div className="bg-[var(--bg-inset)] p-6 rounded-2xl border border-[var(--border-default)] text-center space-y-1">
            <Label className="text-[var(--text-muted)] uppercase tracking-wider block font-bold">Transaction Volume</Label>
            <h3 className="text-3xl font-black text-white">{tx?.currency} {Number(tx?.amount || 0).toLocaleString()}</h3>
            <Caption className="block">{new Date(tx?.created_at).toLocaleString()}</Caption>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[var(--bg-inset)] p-4 rounded-xl border border-[var(--border-default)] space-y-2">
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <CreditCard size={14} className="text-[var(--text-gold)]" />
                <span className="text-[10px] font-bold uppercase">Payment Method</span>
              </div>
              <p className="text-sm font-bold text-white uppercase italic">**** {tx?.card_last_four} {tx?.card_type}</p>
            </div>
            <div className="bg-[var(--bg-inset)] p-4 rounded-xl border border-[var(--border-default)] space-y-2">
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <Globe size={14} className="text-[var(--text-gold)]" />
                <span className="text-[10px] font-bold uppercase">Jurisdiction</span>
              </div>
              <p className="text-sm font-bold text-white">{tx?.customer_country || 'Unknown'}</p>
            </div>
            <div className="bg-[var(--bg-inset)] p-4 rounded-xl border border-[var(--border-default)] space-y-2">
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <Monitor size={14} className="text-[var(--text-gold)]" />
                <span className="text-[10px] font-bold uppercase">Channel</span>
              </div>
              <p className="text-sm font-bold text-white capitalize">{tx?.channel || 'API'}</p>
            </div>
            <div className="bg-[var(--bg-inset)] p-4 rounded-xl border border-[var(--border-default)] space-y-2">
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <User size={14} className="text-[var(--text-gold)]" />
                <span className="text-[10px] font-bold uppercase">Customer</span>
              </div>
              <p className="text-sm font-bold text-white truncate">{tx?.customer_id}</p>
            </div>
          </div>

          {/* AI Section */}
          <section className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={16} className="text-[var(--text-gold)]" /> Ensemble Analysis
              </h3>
              <Badge variant="gold">Active Matrix</Badge>
            </div>
            
            <div className="bg-[var(--bg-inset)] border border-[var(--border-default)] p-5 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-primary-muted)] rounded-full blur-3xl -mr-12 -mt-12" />
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-[8px] text-[var(--text-gold)] font-bold uppercase mb-1">Risk Vec</p>
                  <p className="text-3xl font-black text-white">{Math.round((tx?.risk_score || 0) * 100)}</p>
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-[11px] text-[var(--text-secondary)] font-medium leading-relaxed italic">
                    "Autonomous pattern recognition flagged transaction due to high spatial anomaly."
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tx?.fraud_reasons?.map((reason: string, i: number) => (
                      <span key={i} className="bg-black text-[10px] text-gray-300 px-2 py-0.5 rounded border border-[var(--border-default)] font-mono">
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
              <MapPin size={16} className="text-[var(--text-gold)]" /> Forensic Location
            </h3>
            <div className="bg-[var(--bg-inset)] p-4 rounded-xl border border-[var(--border-default)] space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[var(--text-secondary)]">City / Region</span>
                <span className="text-white font-bold">{tx?.customer_city || 'N/A (Global)'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[var(--text-secondary)]">IP Address</span>
                <span className="text-white font-bold font-mono italic">{tx?.customer_ip || '0.0.0.0'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[var(--text-secondary)]">Device Fingerprint</span>
                <span className="text-[var(--text-muted)] font-mono text-[10px] break-all">{tx?.device_fingerprint || 'sg_dfp_pending_triangulation'}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[var(--border-default)] bg-[var(--bg-inset)]">
          <Button variant="gold" fullWidth size="lg" onClick={onClose}>
            Close Forensic Report
          </Button>
        </div>
      </div>
    </div>
  );
};
