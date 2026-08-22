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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  useEffect(() => {
    fetchAlerts(activeTab, severityFilter);
    fetchStats();
    setCurrentPage(1);
  }, [activeTab, severityFilter]);

  const toggleSelect = (id: string) => {
    setSelectedAlerts(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action: string) => {
    try {
      await bulkAction(selectedAlerts, action);
      toast.success(`Updated ${selectedAlerts.length} incidents`);
      setSelectedAlerts([]);
    } catch (err) {
      toast.error('Bulk triage failed');
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-950/60 text-red-400 border-red-800/80';
      case 'high': return 'bg-amber-950/60 text-amber-400 border-amber-800/80';
      case 'medium': return 'bg-blue-950/60 text-blue-400 border-blue-800/80';
      default: return 'bg-slate-900 text-slate-400 border-slate-800';
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-950/40 text-red-400 border-red-800/60';
      case 'in_review': return 'bg-amber-950/40 text-amber-400 border-amber-800/60';
      case 'resolved': return 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60';
      default: return 'bg-slate-950 text-slate-400 border-slate-800';
    }
  };

  const totalItems = alerts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedAlerts = alerts.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-5 font-sans text-xs">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Security Incident & Anomaly Triage</h1>
            <span className="text-[10px] font-mono uppercase bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
              Rule Engine + Isolation Forest
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time anomaly queues, proxy burst detection, and velocity cluster triage.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="bg-[#0D131F] border border-slate-800 px-3 py-1.5 rounded flex items-center gap-2">
            <span className="text-slate-500 uppercase text-[10px]">Open Incidents:</span>
            <span className="font-bold text-white">{stats?.critical || 0} Critical</span>
          </div>
          <div className="bg-[#0D131F] border border-slate-800 px-3 py-1.5 rounded flex items-center gap-2">
            <span className="text-slate-500 uppercase text-[10px]">Avg Triage:</span>
            <span className="font-bold text-emerald-400">{stats?.avg_resolution_time_minutes || 4}m SLA</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-[#0D131F] border border-slate-800 p-2.5 rounded">
        <div className="flex flex-wrap gap-1 w-full sm:w-auto font-mono text-xs">
          {['open', 'in_review', 'resolved', 'false_positive', 'all'].map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-1 rounded text-xs transition-colors capitalize ${
                activeTab === t 
                  ? 'bg-blue-600 text-white font-semibold' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {t.replace('_', ' ')}
              {t === 'open' && stats?.open ? (
                <span className="ml-1.5 bg-slate-900 border border-slate-700 px-1 py-0.2 rounded text-[10px]">
                  {stats.open}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
            <input 
              placeholder="Search by Tx ID, IP, or Rule..."
              className="bg-slate-950 border border-slate-800 rounded pl-7 pr-3 py-1 text-xs text-white placeholder:text-slate-500 font-mono focus:outline-none focus:border-blue-500 w-52"
            />
          </div>
          <select 
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-300 font-mono focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">P1 Critical</option>
            <option value="high">P2 High</option>
            <option value="medium">P3 Medium</option>
            <option value="low">P4 Low</option>
          </select>
        </div>
      </div>

      {/* Table & Empty State */}
      <div className="bg-[#0D131F] border border-slate-800 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] text-slate-400 uppercase font-mono bg-slate-950/80 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 w-8">
                  <input 
                    type="checkbox" 
                    onChange={(e) => {
                      if (e.target.checked) setSelectedAlerts(alerts.map(a => a.id));
                      else setSelectedAlerts([]);
                    }}
                    className="rounded border-slate-700 bg-slate-950"
                  />
                </th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Incident Classification</th>
                <th className="py-2.5 px-3">Merchant / Origin</th>
                <th className="py-2.5 px-3">Transaction Amount</th>
                <th className="py-2.5 px-3">Risk Vector</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {paginatedAlerts.length > 0 ? (
                paginatedAlerts.map((alert) => (
                  <tr 
                    key={alert.id}
                    onClick={() => setSelectedAlertId(alert.id)}
                    className="group hover:bg-slate-900/40 transition-colors cursor-pointer"
                  >
                    <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedAlerts.includes(alert.id)}
                        onChange={() => toggleSelect(alert.id)}
                        className="rounded border-slate-700 bg-slate-950"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border uppercase ${getSeverityStyles(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-white text-xs">{alert.title}</div>
                      <div className="text-slate-500 font-mono text-[11px] truncate max-w-xs mt-0.5">{alert.description}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {alert.merchant_name || 'merchant_store'}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-white">
                      {alert.currency === 'INR' ? '₹' : alert.currency || '$'}{Number(alert.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-xs text-red-400 font-bold">
                        {((Number(alert.risk_score || 0)) * 100).toFixed(0)}% Risk
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                      {new Date(alert.created_at || Date.now()).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAlertId(alert.id);
                        }}
                        className="bg-slate-900 hover:bg-blue-600 border border-slate-800 hover:border-blue-500 text-slate-300 hover:text-white px-2 py-0.5 rounded text-[11px] font-mono transition-all"
                      >
                        Triage →
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center bg-slate-950/40">
                    <div className="flex flex-col items-center gap-2 max-w-sm mx-auto">
                      <div className="w-9 h-9 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                        <ShieldCheck size={18} />
                      </div>
                      <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">Zero Unresolved Anomaly Flags</h3>
                      <p className="text-xs text-slate-500 leading-relaxed font-sans">
                        All transaction traffic within normal heuristic tolerances. Model inference active on ap-south-1 event stream.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-3 border-t border-slate-800 bg-slate-950/40 gap-3 font-mono text-[11px] text-slate-400">
          <div>
            Showing {totalItems > 0 ? startIndex + 1 : 0}–{endIndex} of {totalItems} incidents
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded border border-slate-800 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-6 rounded text-xs transition-all ${
                  currentPage === page
                    ? 'bg-blue-600 text-white font-bold'
                    : 'border border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded border border-slate-800 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
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
