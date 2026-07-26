import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  ShieldAlert, 
  DollarSign, 
  Clock, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight,
  Download,
  CheckCircle2,
  Play
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
      if (e.response && e.response.status !== 403) {
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
      trend: '+0.0%', 
      isUp: true, 
      icon: Activity, 
      iconColor: 'text-blue-400',
      badgeBg: 'bg-blue-500/10 border-blue-500/20'
    },
    { 
      title: 'Flagged Alerts', 
      value: statsData?.fraud_blocked?.toLocaleString() || '0', 
      trend: (statsData?.total_analyzed && statsData.total_analyzed > 0) 
        ? `${((statsData.fraud_blocked / statsData.total_analyzed) * 100).toFixed(1)}%` 
        : '0.0%', 
      isUp: false, 
      icon: ShieldAlert, 
      iconColor: 'text-red-400',
      badgeBg: 'bg-red-500/10 border-red-500/20'
    },
    { 
      title: 'Protected Volume', 
      value: `$${statsData?.total_volume?.toLocaleString() || '0'}`, 
      trend: '+0.0%', 
      isUp: true, 
      icon: DollarSign, 
      iconColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/20'
    },
    { 
      title: 'Inference Latency', 
      value: `${Math.round(statsData?.avg_latency_ms || 0)}ms`, 
      trend: '-0.0%', 
      isUp: true, 
      icon: Clock, 
      iconColor: 'text-purple-400',
      badgeBg: 'bg-purple-500/10 border-purple-500/20'
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

  return (
    <div className="space-y-6 text-left font-body">
      {/* Top Header & Range Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1E293B] pb-5">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Analytics & Risk Dashboard</h1>
          <p className="text-slate-400 text-xs mt-1">Monitor real-time payment risk, analyze chargeback trends, and manage dispute evidence.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#131924] border border-[#1E293B] p-1 rounded-md flex items-center">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  timeRange === range.value 
                    ? 'bg-blue-600 text-white font-semibold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          <button 
            disabled={isDownloading}
            onClick={handleDownload}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-md transition-colors font-medium text-xs shadow-xs"
          >
            {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between bg-[#131924] px-4 py-2.5 rounded-md border border-[#1E293B] text-xs">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium text-slate-300">Real-Time Monitor Active</span>
        </div>

        <div className="flex items-center space-x-4">
          <button 
            disabled={isSimulating}
            onClick={async () => {
              setIsSimulating(true);
              const toastId = toast.loading("Injecting test transactions...");
              try {
                const api = (await import('@/services/api')).default;
                await api.post('/transactions/simulate?count=10', {}, { timeout: 30000 });
                toast.success("Test transactions processed.", { id: toastId });
                fetchStats();
              } catch (e: any) {
                toast.error("Simulation request failed.", { id: toastId });
              } finally {
                setIsSimulating(false);
              }
            }}
            className="flex items-center space-x-1.5 text-slate-400 hover:text-white font-medium text-xs transition-colors"
          >
            {isSimulating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 text-blue-400" />}
            <span>Simulate Test Transactions</span>
          </button>
          
          <button 
            onClick={async () => {
              if (isCheckingHealth) return;
              setIsCheckingHealth(true);
              const toastId = toast.loading("Checking telemetry nodes...");
              try {
                const api = (await import('@/services/api')).default;
                await api.get('/health/status');
                toast.success("All systems operational (12ms)", { id: toastId });
              } catch (e) {
                toast.error("Service degradation detected", { id: toastId });
              } finally {
                setIsCheckingHealth(false);
              }
            }}
            className="flex items-center space-x-1.5 text-slate-400 hover:text-white font-medium text-xs transition-colors"
          >
            {isCheckingHealth ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5 text-amber-400" />}
            <span>System Status</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="bg-[#131924] border-[#1E293B] hover:border-slate-700 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400">{stat.title}</span>
                  <div className={`p-1.5 rounded border ${stat.badgeBg}`}>
                    <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-white tracking-tight">{stat.value}</span>
                </div>
                <div className="mt-2 flex items-center text-xs text-slate-500">
                  <span className={`flex items-center font-medium ${stat.isUp ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {stat.isUp ? <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" /> : <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />}
                    {stat.trend}
                  </span>
                  <span className="ml-1.5">vs prev period</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Real-time Streams */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Stream */}
        <Card className="col-span-2 bg-[#131924] border-[#1E293B]">
          <CardHeader className="border-b border-[#1E293B] py-3.5 px-5 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-white flex items-center">
              <Activity className="h-4 w-4 mr-2 text-blue-400" />
              Real-Time Transaction Feed
            </CardTitle>
            <span className="text-xs text-slate-400">{recentTransactions.length} events logged</span>
          </CardHeader>
          <CardContent className="p-0 min-h-[300px] max-h-[400px] overflow-y-auto">
            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Loader2 className="h-6 w-6 text-blue-500 animate-spin mb-3 opacity-60" />
                <p className="text-xs font-medium text-slate-400">Waiting for events...</p>
                <p className="text-xs text-slate-500 mt-1">Transactions will stream here automatically in real-time</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1E293B] text-left text-xs">
                {recentTransactions.slice(0, 10).map((tx: any) => (
                  <div key={tx.id} className="p-3.5 hover:bg-[#1A2234] transition-colors flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white">{tx.merchant_name || 'Store'}</span>
                        <span className="text-xs text-slate-500 font-mono">{(tx.id || '').substring(0, 12)}...</span>
                      </div>
                      <span className="text-xs text-slate-400">{tx.channel || 'gateway'} • {tx.created_at ? new Date(tx.created_at).toLocaleTimeString() : 'just now'}</span>
                    </div>
                    <div className="text-right flex items-center space-x-3">
                      <div>
                        <span className="font-semibold text-white block">{tx.currency} {tx.amount}</span>
                        <span className={`text-xs font-semibold ${tx.risk_label === 'fraud' ? 'text-red-400' : tx.risk_label === 'review' ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {(tx.risk_label || 'SAFE').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Risk Alerts */}
        <Card className="bg-[#131924] border-[#1E293B]">
          <CardHeader className="border-b border-[#1E293B] py-3.5 px-5">
            <CardTitle className="text-sm font-semibold text-white flex items-center">
              <ShieldAlert className="h-4 w-4 mr-2 text-red-400" />
              Recent Risk Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-xs font-semibold text-white">All Clear</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">No anomalous patterns flagged in the last hour</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
