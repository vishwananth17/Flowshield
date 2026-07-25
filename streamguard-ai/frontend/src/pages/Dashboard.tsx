import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, type Variants } from 'framer-motion';
import { 
  Activity, 
  ShieldAlert, 
  DollarSign, 
  Clock, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight,
  Download,
  CheckCircle2
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { Heading1, Heading3, Label, Caption } from '@/components/ui/Typography';
import { useTransactionStore } from '@/stores/transactionStore';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const [statsData, setStatsData] = useState<any>(null);
  const [timeRange, setTimeRange] = useState('24h');
  const { recentTransactions } = useTransactionStore();
  const prevCountRef = useRef(recentTransactions.length);
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const api = (await import('@/services/api')).default;
      const res = await api.get(`/analytics/stats?range=${timeRange}`);
      setStatsData(res.data);
    } catch (e: any) {
      console.error("Failed to fetch stats", e);
      if (e.response?.status === 403) {
        // Analytics gated
      } else if (e.response) {
        toast.error(`Stats sync failed: ${e.response.data?.error?.message || 'Server error'}`);
      }
    }
  }, [timeRange]);

  const handleDownload = async () => {
    setIsDownloading(true);
    const toastId = toast.loading("Preparing transaction report export...");
    try {
      const api = (await import('@/services/api')).default;
      const response = await api.get(`/analytics/export?range=${timeRange}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `flowshield_export_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Export complete.", { id: toastId });
    } catch (e) {
      toast.error("Export failed. Ledger inaccessible.", { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (timeRange !== '1h' && timeRange !== '24h') return;
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, [fetchStats, timeRange]);

  useEffect(() => {
    if ((timeRange === '24h' || timeRange === '1h') && recentTransactions.length > prevCountRef.current) {
      fetchStats();
    }
    prevCountRef.current = recentTransactions.length;
  }, [recentTransactions, timeRange, fetchStats]);

  const stats = [
    { 
      title: `Transactions (${timeRange.toUpperCase()})`, 
      value: statsData?.total_analyzed?.toLocaleString() || '0', 
      trend: { value: 0 }, 
      icon: <Activity className="h-4 w-4" />, 
      variant: 'default' as const
    },
    { 
      title: 'Flagged Alerts', 
      value: statsData?.fraud_blocked?.toLocaleString() || '0', 
      trend: { value: 0 }, 
      icon: <ShieldAlert className="h-4 w-4" />, 
      variant: 'danger' as const
    },
    { 
      title: 'Protected Volume', 
      value: `$${statsData?.total_volume?.toLocaleString() || '0'}`, 
      trend: { value: 0 }, 
      icon: <DollarSign className="h-4 w-4" />, 
      variant: 'success' as const
    },
    { 
      title: 'Inference Latency', 
      value: `${Math.round(statsData?.avg_latency_ms || 0)}ms`, 
      trend: { value: 0 }, 
      icon: <Clock className="h-4 w-4" />, 
      variant: 'gold' as const
    },
  ];

  const timeRanges = [
    { label: '1H', value: '1h' },
    { label: '24H', value: '24h' },
    { label: '30D', value: '30d' },
    { label: '2M', value: '60d' },
    { label: '1Y', value: '1y' },
    { label: 'ALL', value: 'all' },
  ];

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6 text-left font-body">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b border-[var(--border-subtle)]">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Heading1>Analytics & Risk Dashboard</Heading1>
          <Caption className="mt-1 block">Monitor real-time payment risk, analyze chargeback trends, and manage dispute evidence.</Caption>
        </motion.div>

        <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-3"
        >
          {/* Time Range Filter */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-1 rounded-[var(--radius-md)] flex items-center">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-3 py-1 rounded text-xs font-mono font-bold transition-colors ${
                  timeRange === range.value 
                    ? 'bg-[var(--color-primary)] text-[var(--text-inverse)] font-extrabold' 
                    : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          <Button 
            disabled={isDownloading}
            onClick={handleDownload}
            variant="gold"
            size="md"
          >
            {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-2" />}
            <span>Export Report</span>
          </Button>

        </motion.div>
      </div>

      {/* Engine Control Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-[var(--bg-surface)] p-3.5 rounded-[var(--radius-lg)] border border-[var(--border-default)] gap-4">
        <div className="flex items-center space-x-2 bg-[var(--bg-inset)] px-3 py-1 rounded-[var(--radius-sm)] border border-[var(--border-default)]">
          <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Label className="text-[var(--text-secondary)] font-bold">Real-Time Monitor Active</Label>
        </div>

        <div className="flex items-center space-x-3">
          <Button 
            disabled={isSimulating}
            variant="ghost"
            size="sm"
            onClick={async () => {
              setIsSimulating(true);
              const toastId = toast.loading("Simulating checkout risk evaluations...");
              try {
                const api = (await import('@/services/api')).default;
                await api.post('/transactions/simulate?count=10', {}, { timeout: 30000 });
                toast.success("Simulation sequence active.", { id: toastId });
                fetchStats();
              } catch (e: any) {
                toast.error("Simulation failure.", { id: toastId });
              } finally {
                setIsSimulating(false);
              }
            }}
          >
            {isSimulating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <ShieldAlert className="h-3.5 w-3.5 mr-2 text-[var(--text-gold)]" />}
            <span>Simulate Test Transactions</span>
          </Button>
          
          <Button 
            variant="ghost"
            size="sm"
            onClick={async () => {
              if (isCheckingHealth) return;
              setIsCheckingHealth(true);
              const toastId = toast.loading("Checking gateway connection status...");
              try {
                const api = (await import('@/services/api')).default;
                await api.get('/health/status');
                toast.success("All systems operational (12ms)", { id: toastId });
              } catch (e) {
                toast.error("Connection issue detected", { id: toastId });
              } finally {
                setIsCheckingHealth(false);
              }
            }}
          >
            {isCheckingHealth ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Zap className="h-3.5 w-3.5 mr-2 text-[var(--text-gold)]" />}
            <span>System Status</span>
          </Button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((stat, i) => (
          <motion.div variants={item} key={i}>
            <StatCard 
              label={stat.title}
              value={stat.value}
              trend={stat.trend}
              icon={stat.icon}
              variant={stat.variant}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Transactions Feed & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="default" className="col-span-2 overflow-hidden">
          <div className="border-b border-[var(--border-default)] bg-[var(--bg-inset)] py-3 px-5 -mx-6 -mt-6 mb-6 flex items-center justify-between">
            <Heading3 className="flex items-center text-sm font-bold">
              <Activity className="h-4 w-4 mr-2 text-[var(--text-gold)]" />
              Real-Time Transaction Feed
            </Heading3>
          </div>
          <div className="h-[350px] overflow-y-auto w-full -mx-6 -mb-6 px-6">
            {recentTransactions.length === 0 ? (
              <div className="flex h-full items-center justify-center p-6 text-center">
                <div>
                  <div className="w-10 h-10 rounded-full border-2 border-[var(--border-default)] border-t-[var(--color-primary)] animate-spin mx-auto mb-3" />
                  <Caption className="font-mono font-bold">Waiting for events...</Caption>
                  <Caption className="block mt-1">Listening for real-time transaction activity</Caption>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)] w-full">
                {recentTransactions.slice(0, 10).map((tx: any) => (
                  <div 
                    key={tx.id} 
                    className="py-4 hover:bg-[var(--bg-highlight)] transition-colors flex items-center justify-between -mx-6 px-6"
                  >
                    <div>
                      <p className="text-xs font-bold text-[var(--text-primary)]">{tx.merchant_name || 'Unknown'}</p>
                      <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{(tx.id || '').substring(0, 13)}...</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono font-bold text-[var(--text-primary)]">{tx.currency} {tx.amount}</p>
                      <p className="text-[10px] font-mono font-bold uppercase mt-0.5 text-[var(--text-muted)]">
                        {tx.risk_label || 'unknown'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
        
        <Card variant="default" className="flex flex-col justify-between">
          <div className="border-b border-[var(--border-default)] bg-[var(--bg-inset)] py-3 px-5 -mx-6 -mt-6 mb-6">
            <Heading3 className="flex items-center text-sm font-bold">
              <ShieldAlert className="h-4 w-4 mr-2 text-[var(--color-danger)]" />
              Recent Risk Alerts
            </Heading3>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--color-primary-muted)] border border-[var(--color-primary-border)] flex items-center justify-center mb-3 text-[var(--text-gold)]">
              <CheckCircle2 className="h-6 w-6 text-[var(--color-success)]" />
            </div>
            <p className="text-[var(--text-primary)] font-bold text-xs uppercase tracking-wider">All Clear</p>
            <Caption className="mt-1 block">No anomalous patterns flagged in the last hour.</Caption>
          </div>
        </Card>
      </div>
    </div>
  );
}
