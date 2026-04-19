import { useEffect, useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  MapPin, 
  CreditCard, 
  User, 
  History,
  Info
} from 'lucide-react';
import api from '@/services/api';
import { useAlertStore } from '@/stores/alertStore';

interface AlertDrawerProps {
  alertId: string | null;
  onClose: () => void;
}

export const AlertDrawer: React.FC<AlertDrawerProps> = ({ alertId, onClose }) => {
  const [alert, setAlert] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const updateAlertStatus = useAlertStore(state => state.updateAlertStatus);

  useEffect(() => {
    if (alertId) {
      fetchDetail();
    }
  }, [alertId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const resp = await api.get(`/alerts/${alertId}`);
      setAlert(resp.data);
    } catch (err) {
      console.error('Failed to fetch alert details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!alertId) return;
    try {
      await updateAlertStatus(alertId, newStatus, note);
      onClose();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (!alertId) return null;

  return (
    <div className={`fixed inset-y-0 right-0 w-[480px] bg-slate-900 border-l border-slate-800 shadow-2xl z-50 slide-in glass-morphism`}>
      <div className="h-full flex flex-col relative">
        {loading && <div className="absolute inset-0 z-10 bg-slate-900/40 backdrop-blur-[2px] shimmer" />}
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                alert?.severity === 'critical' ? 'bg-red-500/20 text-red-500' :
                alert?.severity === 'high' ? 'bg-orange-500/20 text-orange-500' :
                alert?.severity === 'medium' ? 'bg-amber-500/20 text-amber-500' :
                'bg-slate-500/20 text-slate-400'
              }`}>
                {alert?.severity || '...'}
              </span>
              <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                {alert?.status || '...'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white leading-tight">
              {alert?.title || 'Loading incident...'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Transaction Details */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <CreditCard size={16} /> Transaction Details
                </h3>
                <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800 space-y-3 font-medium">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Amount</span>
                    <span className="text-white text-lg font-bold">{alert?.transaction?.currency} {alert?.transaction?.amount}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Merchant</span>
                    <span className="text-slate-200">{alert?.transaction?.merchant_name}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Transaction ID</span>
                    <span className="text-slate-300 font-mono text-xs">SG_{(alert?.transaction?.id || '').substring(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Card</span>
                    <span className="text-slate-300 flex items-center gap-1">
                      <CreditCard size={12} /> **** {alert?.transaction?.card_last_four} ({alert?.transaction?.card_type})
                    </span>
                  </div>
                </div>
              </section>

              {/* Customer Info */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <User size={16} /> Customer Intelligence
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase mb-1">Customer ID</p>
                    <p className="text-slate-200 text-xs truncate">{alert?.transaction?.customer_id}</p>
                  </div>
                  <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase mb-1">IP Address</p>
                    <p className="text-slate-200 text-xs">{alert?.transaction?.customer_ip || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase mb-1">Location</p>
                    <p className="text-slate-200 text-xs flex items-center gap-1">
                      <MapPin size={12} /> {alert?.transaction?.customer_country || 'Unknown'}
                    </p>
                  </div>
                  <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase mb-1">Channel</p>
                    <p className="text-slate-200 text-xs capitalize">{alert?.transaction?.channel}</p>
                  </div>
                </div>
              </section>

              {/* ML Explanation */}
              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert size={16} /> ML Risk Analysis
                  </h3>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700">
                    <Info size={10} /> model_v2.1
                  </div>
                </div>
                
                <div className="flex items-center gap-6 bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-inner">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                      <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" 
                        strokeDasharray={226}
                        strokeDashoffset={226 - (226 * (alert?.transaction?.risk_score || 0))}
                        className={
                          alert?.transaction?.risk_score >= 0.8 ? 'text-red-500' :
                          alert?.transaction?.risk_score >= 0.5 ? 'text-amber-500' : 'text-green-500'
                        }
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-white">{Math.round((alert?.transaction?.risk_score || 0) * 100)}</span>
                      <span className="text-[8px] text-slate-500 uppercase">SCORE</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-xs text-slate-400 font-medium italic leading-relaxed">
                      "Flagged due to high spatial anomaly in high-risk jurisdiction."
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {alert?.transaction?.fraud_reasons?.map((reason: string, idx: number) => (
                        <span key={idx} className="bg-slate-800 text-[10px] text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Timeline */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <History size={16} /> Audit Timeline
                </h3>
                <div className="space-y-4 ml-2 border-l border-slate-800 pl-4 py-1">
                  {alert?.activities?.map((activity: any, idx: number) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-slate-800 border border-slate-700 shadow-sm" />
                      <div>
                        <p className="text-xs text-slate-300">
                          <span className="font-bold text-white">{activity.changed_by_name || 'System'}</span> 
                          {' transitioned alert to '}
                          <span className="text-blue-400 font-semibold">{activity.to_status}</span>
                        </p>
                        {activity.note && (
                          <p className="text-[11px] text-slate-500 bg-slate-800/30 p-2 mt-1 rounded border border-slate-800 italic">
                            "{activity.note}"
                          </p>
                        )}
                        <p className="text-[10px] text-slate-600 mt-1 uppercase font-semibold">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md space-y-4">
          <textarea 
            placeholder="Add internal investigation note..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none h-20 placeholder:text-slate-600"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex gap-3">
            {alert?.status === 'open' && (
              <button 
                onClick={() => handleStatusUpdate('in_review')}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20"
              >
                In Review
              </button>
            )}
            {alert?.status === 'in_review' && (
              <>
                <button 
                  onClick={() => handleStatusUpdate('resolved')}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-green-600/20"
                >
                  Mark Safe
                </button>
                <button 
                  onClick={() => handleStatusUpdate('false_positive')}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-all"
                >
                  False Positive
                </button>
              </>
            )}
            {(alert?.status === 'resolved' || alert?.status === 'false_positive') && (
              <button 
                onClick={() => handleStatusUpdate('open')}
                className="flex-1 border border-slate-700 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all"
              >
                Reopen Incident
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

