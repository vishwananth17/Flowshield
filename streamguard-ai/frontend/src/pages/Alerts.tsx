import { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Clock, 
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
      toast.success(`Successfully updated ${selectedAlerts.length} alerts`);
      setSelectedAlerts([]);
    } catch (err) {
      toast.error('Bulk action failed');
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-white text-black font-extrabold px-2 py-0.5 rounded text-[10px] font-mono uppercase';
      case 'high': return 'bg-zinc-900 text-zinc-300 border border-zinc-700 px-2 py-0.5 rounded text-[10px] font-mono uppercase';
      default: return 'bg-black text-zinc-400 border border-zinc-800 px-2 py-0.5 rounded text-[10px] font-mono uppercase';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-black text-white text-left font-body">
      {/* Header & Stats Strip */}
      <div className="px-6 pt-6 pb-4 border-b border-zinc-800 bg-zinc-950">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">Alert Command Center</h1>
            <p className="text-zinc-400 text-xs mt-1">Monitor and triage flagged transaction signatures in real-time.</p>
          </div>
          <div className="flex gap-3">
             <div className="bg-black border border-zinc-800 rounded-lg p-3 flex items-center gap-3 min-w-[170px]">
                <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
                  <ShieldAlert size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-mono font-bold">Critical</p>
                  <p className="text-lg font-extrabold text-white">{stats?.critical || 0}</p>
                </div>
             </div>
             <div className="bg-black border border-zinc-800 rounded-lg p-3 flex items-center gap-3 min-w-[170px]">
                <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
                  <Clock size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-mono font-bold">Resolution</p>
                  <p className="text-lg font-extrabold text-white">{stats?.avg_resolution_time_minutes || 0}m</p>
                </div>
             </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center py-2 gap-4">
          <div className="flex gap-1 bg-black p-1 rounded border border-zinc-800">
            {['open', 'in_review', 'resolved', 'all'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-xs font-mono font-bold uppercase rounded transition-colors ${
                  activeTab === tab
                    ? 'bg-white text-black font-extrabold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="bg-black border border-zinc-800 text-xs font-mono text-white rounded px-3 py-1.5 focus:outline-none focus:border-white"
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

      {/* Main Table Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-black">
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="text-[10px] font-mono text-zinc-400 uppercase bg-black border-b border-zinc-800">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    onChange={e => {
                      if (e.target.checked) setSelectedAlerts(alerts.map(a => a.id));
                      else setSelectedAlerts([]);
                    }}
                    checked={selectedAlerts.length > 0 && selectedAlerts.length === alerts.length}
                    className="h-3.5 w-3.5 bg-black border-zinc-800 rounded"
                  />
                </th>
                <th className="p-4">Alert ID</th>
                <th className="p-4">Type</th>
                <th className="p-4">Severity</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500 font-mono text-xs">
                    No active alerts found. System normal.
                  </td>
                </tr>
              ) : (
                alerts.map(alert => (
                  <tr key={alert.id} className="hover:bg-zinc-900 transition-colors">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedAlerts.includes(alert.id)}
                        onChange={() => toggleSelect(alert.id)}
                        className="h-3.5 w-3.5 bg-black border-zinc-800 rounded"
                      />
                    </td>
                    <td className="p-4 font-mono font-bold text-white">
                      {alert.id.substring(0, 14)}...
                    </td>
                    <td className="p-4 text-zinc-300 font-medium">
                      {alert.title || alert.type}
                    </td>
                    <td className="p-4">
                      <span className={getSeverityBadge(alert.severity)}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="bg-black border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-[10px] font-mono uppercase">
                        {alert.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-zinc-500 text-[10px]">
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedAlertId(alert.id)}
                        className="text-xs text-white hover:bg-zinc-800 font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAlertId && (
        <AlertDrawer 
          alertId={selectedAlertId}
          isOpen={!!selectedAlertId}
          onClose={() => setSelectedAlertId(null)}
        />
      )}
    </div>
  );
};
