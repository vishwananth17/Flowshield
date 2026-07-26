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
    <div className={`fixed inset-y-0 right-0 w-[460px] bg-[#0F172A] border-l border-slate-800 shadow-2xl z-50 slide-in transition-all duration-300 ease-out`}>
      <div className="h-full flex flex-col relative">
        {loading && <div className="absolute inset-0 z-10 bg-slate-900/40 backdrop-blur-[2px] shimmer" />}
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-900/40">
          <div>
             <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                   tx?.risk_label === 'fraud' ? 'bg-red-500/20 text-red-400' :
                   tx?.risk_label === 'review' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                   {tx?.risk_label || 'analyzing...'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{(tx?.id || '').substring(0, 13)}</span>
             </div>
             <h2 className="text-xl font-bold text-white tracking-tight">
                {tx?.merchant_name || 'Transaction Details'}
             </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all">
             <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
           {/* Amount Hero */}
           <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 text-center space-y-1">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Transaction Volume</p>
              <h3 className="text-3xl font-black text-white">{tx?.currency} {Number(tx?.amount || 0).toLocaleString()}</h3>
              <p className="text-xs text-slate-500">{new Date(tx?.created_at).toLocaleString()}</p>
           </div>

           {/* Cards Grid */}
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-2">
                 <div className="flex items-center gap-2 text-slate-500">
                    <CreditCard size={14} />
                    <span className="text-[10px] font-bold uppercase">Payment Method</span>
                 </div>
                 <p className="text-sm font-bold text-white uppercase italic">**** {tx?.card_last_four} {tx?.card_type}</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-2">
                 <div className="flex items-center gap-2 text-slate-500">
                    <Globe size={14} />
                    <span className="text-[10px] font-bold uppercase">Jurisdiction</span>
                 </div>
                 <p className="text-sm font-bold text-white">{tx?.customer_country || 'Unknown'}</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-2">
                 <div className="flex items-center gap-2 text-slate-500">
                    <Monitor size={14} />
                    <span className="text-[10px] font-bold uppercase">Channel</span>
                 </div>
                 <p className="text-sm font-bold text-white capitalize">{tx?.channel || 'API'}</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-2">
                 <div className="flex items-center gap-2 text-slate-500">
                    <User size={14} />
                    <span className="text-[10px] font-bold uppercase">Customer</span>
                 </div>
                 <p className="text-sm font-bold text-white truncate">{tx?.customer_id}</p>
              </div>
           </div>

           {/* AI Section */}
           <section className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                 <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={16} className="text-blue-500" /> Ensemble Analysis
                 </h3>
                 <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">Active Matrix</span>
              </div>
              
              <div className="bg-blue-600/5 border border-blue-500/20 p-5 rounded-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 rounded-full blur-3xl -mr-12 -mt-12" />
                 <div className="flex items-center gap-6">
                    <div className="text-center">
                       <p className="text-[8px] text-blue-500 font-bold uppercase mb-1">Risk Vec</p>
                       <p className="text-3xl font-black text-white">{Math.round((tx?.risk_score || 0) * 100)}</p>
                    </div>
                    <div className="flex-1 space-y-2">
                       <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic">
                          "Autonomous pattern recognition flagged transaction due to high spatial anomaly."
                       </p>
                       <div className="flex flex-wrap gap-2">
                          {tx?.fraud_reasons?.map((reason: string, i: number) => (
                             <span key={i} className="bg-slate-900 text-[10px] text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                                {reason}
                             </span>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
           </section>

           <section className="space-y-4">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                 <MapPin size={16} /> Forensic Location
              </h3>
              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-3">
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">City / Region</span>
                    <span className="text-white font-bold">{tx?.customer_city || 'N/A (Global)'}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">IP Address</span>
                    <span className="text-white font-bold font-mono italic">{tx?.customer_ip || '0.0.0.0'}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Device Fingerprint</span>
                    <span className="text-slate-400 font-mono text-[10px] break-all">{tx?.device_fingerprint || 'sg_dfp_pending_triangulation'}</span>
                 </div>
              </div>
           </section>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-[#0F172A]">
           <button onClick={onClose} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-all uppercase tracking-widest text-[11px]">
              Close Forensic Report
           </button>
        </div>
      </div>
    </div>
  );
};
