import { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  Clock, 
} from 'lucide-react';
import { useAlertStore } from '@/stores/alertStore';
import { AlertDrawer } from '@/components/AlertDrawer';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Heading1, Caption, Label } from '@/components/ui/Typography';

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

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': 
        return <Badge variant="danger" dot pulse>CRITICAL</Badge>;
      case 'high': 
        return <Badge variant="warning" dot>HIGH</Badge>;
      case 'medium': 
        return <Badge variant="gold" dot>MEDIUM</Badge>;
      default: 
        return <Badge variant="default" dot>LOW</Badge>;
    }
  };

  return (
    <div className="flex-grow space-y-6 text-left font-body">
      {/* Header & Stats Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--border-subtle)] gap-4">
        <div>
          <Heading1>Security & Fraud Alerts</Heading1>
          <Caption className="mt-1 block">Review and resolve automated transaction warnings.</Caption>
        </div>
        
        <div className="flex gap-3">
          <Card padding="sm" className="flex items-center gap-3 min-w-[170px]">
            <div className="w-8 h-8 rounded bg-[var(--bg-inset)] border border-[var(--border-default)] flex items-center justify-center text-[var(--color-danger)]">
              <ShieldAlert size={16} />
            </div>
            <div>
              <Label className="block text-[var(--text-muted)] text-[9px]">Critical Warnings</Label>
              <span className="text-lg font-bold text-white leading-none">{stats?.critical || 0}</span>
            </div>
          </Card>
          
          <Card padding="sm" className="flex items-center gap-3 min-w-[170px]">
            <div className="w-8 h-8 rounded bg-[var(--bg-inset)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-gold)]">
              <Clock size={16} />
            </div>
            <div>
              <Label className="block text-[var(--text-muted)] text-[9px]">Avg. Resolution</Label>
              <span className="text-lg font-bold text-white leading-none">{stats?.avg_resolution_time_minutes || 0}m</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center py-2 gap-4">
        <div className="flex gap-1 bg-[var(--bg-inset)] p-1 rounded-[var(--radius-md)] border border-[var(--border-default)] w-full sm:w-auto overflow-x-auto">
          {['open', 'in_review', 'resolved', 'all'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-mono font-bold uppercase rounded transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-[var(--color-primary)] text-[var(--text-inverse)] font-extrabold'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="bg-[var(--bg-inset)] border border-[var(--border-default)] text-xs font-mono text-[var(--text-primary)] rounded-[var(--radius-md)] px-3 py-2.5 focus:outline-none focus:border-[var(--color-primary)] transition-colors h-11"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          {selectedAlerts.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBulkAction('resolve')}
              >
                Resolve Selected
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleBulkAction('dismiss')}
              >
                Dismiss
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="text-[10px] font-mono text-[var(--text-muted)] uppercase bg-[var(--bg-inset)] border-b border-[var(--border-default)]">
            <tr>
              <th className="p-4 w-10">
                <input
                  type="checkbox"
                  onChange={e => {
                    if (e.target.checked) setSelectedAlerts(alerts.map(a => a.id));
                    else setSelectedAlerts([]);
                  }}
                  checked={selectedAlerts.length > 0 && selectedAlerts.length === alerts.length}
                  className="h-3.5 w-3.5 bg-black border-[var(--border-default)] rounded cursor-pointer"
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
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {alerts.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[var(--text-muted)] font-mono text-xs">
                  No active warnings. System running normally.
                </td>
              </tr>
            ) : (
              alerts.map(alert => (
                <tr key={alert.id} className="hover:bg-[var(--bg-highlight)] transition-colors">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedAlerts.includes(alert.id)}
                      onChange={() => toggleSelect(alert.id)}
                      className="h-3.5 w-3.5 bg-black border-[var(--border-default)] rounded cursor-pointer"
                    />
                  </td>
                  <td className="p-4 font-mono font-bold text-white">
                    {alert.id.substring(0, 14)}...
                  </td>
                  <td className="p-4 text-[var(--text-primary)] font-medium">
                    {alert.title || alert.type}
                  </td>
                  <td className="p-4">
                    {getSeverityBadge(alert.severity)}
                  </td>
                  <td className="p-4">
                    <Badge variant="outline">
                      {alert.status}
                    </Badge>
                  </td>
                  <td className="p-4 font-mono text-[var(--text-muted)] text-[10px]">
                    {new Date(alert.created_at).toLocaleTimeString()}
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      onClick={() => setSelectedAlertId(alert.id)}
                      variant="ghost"
                      size="xs"
                    >
                      Inspect
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
}

export default AlertsPage;
