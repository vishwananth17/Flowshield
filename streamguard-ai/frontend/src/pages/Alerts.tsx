import { useEffect, useState } from 'react';
import { useAlertStore } from '@/stores/alertStore';
import { AlertDrawer } from '@/components/AlertDrawer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableActionCell } from '@/components/ui/Table';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Filter, 
  ShieldAlert, 
  UserCheck, 
  ChevronRight,
  Shield,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

export default function Alerts() {
  const { alerts, stats, fetchAlerts, fetchStats, bulkAction } = useAlertStore();
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('open');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  const selectAll = () => {
    if (selectedAlerts.length === filteredAlerts.length) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts(filteredAlerts.map(a => a.id));
    }
  };

  const handleBulkAction = async (action: string) => {
    try {
      await bulkAction(selectedAlerts, action);
      toast.success(`Successfully updated ${selectedAlerts.length} incident alerts`);
      setSelectedAlerts([]);
    } catch (err) {
      toast.error('Bulk action failed');
    }
  };

  const filteredAlerts = alerts.filter(a => {
    const matchesSearch = 
      a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalItems = filteredAlerts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedAlerts = filteredAlerts.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-h1 text-text-primary">Incident Triage Desk</h1>
          <p className="type-sm text-text-secondary mt-0.5">
            Security operations center queue for flagged anomalous transactions and card attacks.
          </p>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Critical (P1) Alerts"
          value={stats?.critical || 0}
          rawValue={stats?.critical || 0}
          trend={stats?.critical ? 'Action Req.' : 'Clear'}
          trendDirection={stats?.critical ? 'down' : 'up'}
          subtext="Immediate SOC review"
        />
        <StatCard
          label="Open Incidents"
          value={stats?.open || 0}
          rawValue={stats?.open || 0}
          subtext="Pending analyst sign-off"
        />
        <StatCard
          label="Avg Resolution SLA"
          value={`${stats?.avg_resolution_time_minutes || 14}m`}
          trend="43ms auto-tag"
          trendDirection="up"
          subtext="Target SLA: < 30m"
        />
      </div>

      {/* Filter and Bulk Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-200 pb-3">
        
        {/* Status Tabs */}
        <div className="flex items-center space-x-4 text-xs font-semibold select-none">
          {(['open', 'in_review', 'resolved', 'all'] as const).map((tab) => {
            const isActive = activeTab === tab;
            const label = tab === 'open' ? 'Open' : tab === 'in_review' ? 'In Review' : tab === 'resolved' ? 'Resolved' : 'All';

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-1 transition-colors ${
                  isActive ? 'text-cyan-400 border-b-2 border-cyan-500 font-bold' : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              aria-label="Filter incidents by severity level"
              className="h-8 bg-surface-200 border border-border-200 rounded text-xs px-2.5 text-text-primary focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">P1 Critical</option>
              <option value="high">P2 High</option>
              <option value="medium">P3 Medium</option>
            </select>
          </div>

          {selectedAlerts.length > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in duration-fast">
              <Button variant="primary" size="xs" onClick={() => handleBulkAction('resolved')}>
                <CheckCircle className="w-3 h-3" />
                <span>Resolve ({selectedAlerts.length})</span>
              </Button>
              <Button variant="secondary" size="xs" onClick={() => handleBulkAction('dismissed')}>
                <span>Dismiss</span>
              </Button>
            </div>
          )}
        </div>

      </div>

      {/* Incident Triage Table */}
      <Card variant="data" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={selectedAlerts.length === filteredAlerts.length && filteredAlerts.length > 0}
                    onChange={selectAll}
                    aria-label="Select all incidents"
                    className="rounded border-border-300 bg-surface-200 text-cyan-500 focus:ring-0"
                  />
                </TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Incident / Anomaly</TableHead>
                <TableHead>Transaction</TableHead>
                <TableHead>Risk Vector</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-text-tertiary text-xs">
                    All queues clear. No active alerts requiring intervention.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAlerts.map((alert) => {
                  const isCritical = alert.severity === 'critical';
                  const isHigh = alert.severity === 'high';
                  const isSelected = selectedAlerts.includes(alert.id);

                  return (
                    <TableRow
                      key={alert.id}
                      isClickable
                      onClick={() => setSelectedAlertId(alert.id)}
                      className={isSelected ? 'bg-surface-400/80' : ''}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()} className="w-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(alert.id)}
                          aria-label={`Select incident ${alert.title || alert.id}`}
                          className="rounded border-border-300 bg-surface-200 text-cyan-500 focus:ring-0"
                        />
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isCritical ? 'block' : isHigh ? 'review' : 'neutral'}
                          size="sm"
                        >
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-text-primary text-xs">
                        {alert.title || 'Anomalous Transaction Surge'}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-text-tertiary">
                        {alert.transaction_id || alert.id.substring(0, 12)}
                      </TableCell>
                      <TableCell className="text-xs text-text-secondary">
                        {alert.rule_name || 'XGBoost Isolation Forest'}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-text-tertiary">
                        {new Date(alert.created_at).toLocaleTimeString()}
                      </TableCell>
                      <TableActionCell />
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-border-100 gap-3 text-xs">
          <div className="text-text-tertiary font-mono">
            Showing {totalItems > 0 ? startIndex + 1 : 0}–{endIndex} of {totalItems} incidents
          </div>
          <div className="flex items-center space-x-1.5 font-mono">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded border border-border-200 bg-surface-200 text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <span className="px-2 text-text-tertiary">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded border border-border-200 bg-surface-200 text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </Card>

      {/* Alert Drawer */}
      <AlertDrawer
        alertId={selectedAlertId}
        onClose={() => setSelectedAlertId(null)}
      />

    </div>
  );
}
export { Alerts as AlertsPage };
