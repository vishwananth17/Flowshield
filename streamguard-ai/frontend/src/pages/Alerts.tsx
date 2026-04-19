import { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  ShieldCheck,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
  UserCheck
} from 'lucide-react';
import { useAlertStore } from '@/stores/alertStore';
import { AlertDrawer } from '@/components/AlertDrawer';
import { toast } from 'sonner';

export const AlertsPage: React.FC = () => {
  const { alerts, stats, fetchAlerts, fetchStats, bulkAction } = useAlertStore();
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('open');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  useEffect(() => {
    fetchAlerts(activeTab, severityFilter);
    fetchStats();
  }, [activeTab, severityFilter]);

  const toggleSelect = (id: string) => {
    setSelectedAlerts(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action: string) => {
    try {
      await bulkAction(selectedAlerts, action);
      toast.success(`Successfully updated ${selectedAlerts.length} alerts`);
      setSelectedAlerts([]);
    } catch (err) {
      toast.error('Bulk action failed');
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-white/5';
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'in_review': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'resolved': return 'bg-green-500/10 text-green-400 border-green-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-white/5';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0A0C10]">
      {/* Header & Stats Strip */}
      <div className="px-8 pt-8 pb-4 border-b border-slate-800 bg-slate-900/20">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Alert Center</h1>
            <p className="text-slate-500 text-sm">Monitor and triage flagged transactions in real-time.</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4 min-w-[200px]">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Critical Alerts</p>
                  <p className="text-xl font-black text-white">{stats?.critical || 0}</p>
                </div>
             </div>
             <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4 min-w-[200px]">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Resolution Time</p>
                  <p className="text-xl font-black text-white">{stats?.avg_resolution_time_minutes || 0}m</p>
                </div>
             </div>
          </div>
        </div>

        {/* Sticky Filter Bar */}
        <div className="flex justify-between items-center py-2">
          <div className="flex gap-1">
            {['open', 'in_review', 'resolved', 'false_positive', 'all'].map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all capitalize ${
                  activeTab === t 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {t.replace('_', ' ')}
                {t === 'open' && stats?.open ? (
                  <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded text-[10px] leading-none">
                    {stats.open}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              <input 
                placeholder="Search tx ID, merchant..."
                className="bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-64 transition-all"
              />
            </div>
            <select 
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="flex-1 overflow-auto relative p-8">
        {/* Bulk Action Bar */}
        {selectedAlerts.length > 0 && (
          <div className="absolute top-4 left-8 right-8 bg-blue-600 text-white p-4 rounded-xl flex justify-between items-center z-10 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                {selectedAlerts.length}
              </div>
              <span className="font-bold tracking-tight">Alerts Selected</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleBulkAction('resolved')}
                className="bg-white text-blue-600 font-bold px-4 py-2 rounded-lg text-sm hover:bg-slate-100 transition-all"
              >
                Mark Resolved
              </button>
              <button 
                onClick={() => handleBulkAction('false_positive')}
                className="bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-blue-800 transition-all border border-blue-500/50"
              >
                False Positive
              </button>
              <button 
                onClick={() => setSelectedAlerts([])}
                className="text-white/80 hover:text-white px-4 py-2 text-sm font-bold"
              >
                Deselect All
              </button>
            </div>
          </div>
        )}

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800">
                <th className="p-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-700 bg-slate-950 checked:bg-blue-500 focus:ring-offset-slate-900"
                    onChange={(e) => {
                      if (e.target.checked) setSelectedAlerts(alerts.map(a => a.id));
                      else setSelectedAlerts([]);
                    }}
                  />
                </th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Severity</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Alert Title</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Merchant</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Tx Amount</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Score</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Inception</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <tr 
                    key={alert.id}
                    onClick={() => setSelectedAlertId(alert.id)}
                    className="group hover:bg-blue-500/5 transition-all cursor-pointer"
                  >
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedAlerts.includes(alert.id)}
                        onChange={() => toggleSelect(alert.id)}
                        className="rounded border-slate-700 bg-slate-950 checked:bg-blue-500"
                      />
                    </td>
                    <td className="p-4">
                      <div className={`px-2 py-1 rounded text-[10px] font-black border flex items-center gap-1.5 w-fit uppercase ${getSeverityStyles(alert.severity)}`}>
                        {alert.severity === 'critical' && <Zap size={10} className="fill-current animate-pulse" />}
                        {alert.severity}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-white font-bold group-hover:text-blue-400 transition-colors">{alert.title}</span>
                        <span className="text-slate-500 text-[11px] truncate max-w-[240px]">{alert.description}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-slate-300 font-medium">{alert.merchant_name}</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-white font-black">{alert.currency} {alert.amount}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              alert.risk_score >= 0.8 ? 'bg-red-500' : 
                              alert.risk_score >= 0.5 ? 'bg-amber-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${alert.risk_score * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 font-mono">{(alert.risk_score * 100).toFixed(0)}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-slate-500 text-[11px] font-medium">{new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="p-4 text-right">
                       <div className="flex items-center justify-end gap-3">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border ${getStatusStyles(alert.status)}`}>
                             {alert.status === 'open' && <AlertCircle size={10} />}
                             {alert.status === 'in_review' && <UserCheck size={10} className="animate-pulse" />}
                             {alert.status === 'resolved' && <CheckCircle size={10} />}
                             {alert.status.replace('_', ' ')}
                          </div>
                          <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               setSelectedAlertId(alert.id);
                             }}
                             className="bg-slate-800 hover:bg-slate-700 text-blue-400 font-bold px-3 py-1 rounded text-[10px] uppercase tracking-wider border border-slate-700 transition-all"
                          >
                             Open
                          </button>
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-700">
                        <ShieldCheck size={40} />
                      </div>
                      <div className="max-w-xs mx-auto">
                        <h3 className="text-lg font-bold text-white mb-1">Clear Horizon</h3>
                        <p className="text-sm text-slate-500">No transactions currently match your verification criteria. Your platform detection engine is running flawlessly.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Drawer Overlay */}
      {selectedAlertId && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-300"
          onClick={() => setSelectedAlertId(null)}
        />
      )}
      <AlertDrawer 
        alertId={selectedAlertId} 
        onClose={() => setSelectedAlertId(null)} 
      />
    </div>
  );
};

export default AlertsPage;

