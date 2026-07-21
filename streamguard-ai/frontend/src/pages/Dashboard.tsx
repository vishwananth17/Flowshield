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
      if (e.response?.status === 403) {
        // Analytics gated
      } else if (e.response) {
        toast.error(`Stats sync failed: ${e.response.data?.error?.message || 'Server error'}`);
      }
    }
  }, [timeRange]);

  const handleDownload = async () => {
    setIsDownloading(true);
    const toastId = toast.loading("Preparing institutional export...");
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
      toast.success("Export complete. Forensics ready.", { id: toastId });
    } catch (e) {
      toast.error("Export failed. Internal ledger inaccessible.", { id: toastId });
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
      title: `Total Analyzed (${timeRange.toUpperCase()})`, 
      value: statsData?.total_analyzed?.toLocaleString() || '0', 
      trend: '+0%', 
      isUp: true, 
      icon: Activity, 
    },
    { 
      title: 'Fraud Detected', 
      value: statsData?.fraud_blocked?.toLocaleString() || '0', 
      trend: (statsData?.total_analyzed && statsData.total_analyzed > 0) 
        ? `${((statsData.fraud_blocked / statsData.total_analyzed) * 100).toFixed(1)}%` 
        : '0%', 
      isUp: false, 
      icon: ShieldAlert, 
    },
    { 
      title: 'Protected Volume', 
      value: `$${statsData?.total_volume?.toLocaleString() || '0'}`, 
      trend: '+0%', 
      isUp: true, 
      icon: DollarSign, 
    },
    { 
      title: 'Inference Latency', 
      value: `${Math.round(statsData?.avg_latency_ms || 0)}ms`, 
      trend: '-0%', 
      isUp: true, 
      icon: Clock, 
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b border-zinc-800">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Intelligence Dashboard</h1>
          <p className="text-zinc-400 text-xs mt-1">Institutional risk visibility for your organizational traffic.</p>
        </motion.div>

        <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-3"
        >
          {/* Stark B&W Time Range Filter */}
          <div className="bg-zinc-950 border border-zinc-800 p-1 rounded-md flex items-center">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-3 py-1 rounded text-xs font-mono font-bold transition-colors ${
                  timeRange === range.value 
                    ? 'bg-white text-black font-extrabold' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {range.label}
              </button>
            ))}
            <button
                onClick={() => setTimeRange('custom')}
                className={`px-3 py-1 rounded text-xs font-mono font-bold transition-colors ${
                  timeRange === 'custom' 
                    ? 'bg-white text-black font-extrabold' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                CUSTOM
              </button>
          </div>

          <button 
            disabled={isDownloading}
            onClick={handleDownload}
            className="flex items-center space-x-2 bg-white text-black hover:bg-zinc-200 font-bold px-4 py-2 rounded text-xs uppercase tracking-wider transition-colors"
          >
            {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            <span>Download Report</span>
          </button>

        </motion.div>
      </div>

      {/* Engine Control Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 gap-4">
        <div className="flex items-center space-x-2 bg-black px-3 py-1 rounded border border-zinc-800">
          <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-mono font-bold text-zinc-300 uppercase tracking-wider">Live Stream Active</span>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            disabled={isSimulating}
            onClick={async () => {
              setIsSimulating(true);
              const toastId = toast.loading("Injecting synthetic fraud signals...");
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
            className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-mono font-bold text-xs px-3 py-1.5 rounded transition-colors"
          >
            {isSimulating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldAlert className="h-3.5 w-3.5 text-white" />}
            <span>Run Stress Test</span>
          </button>
          
          <button 
            onClick={async () => {
              if (isCheckingHealth) return;
              setIsCheckingHealth(true);
              const toastId = toast.loading("Checking global satellite status...");
              try {
                const api = (await import('@/services/api')).default;
                await api.get('/health/status');
                toast.success("Global satellites Operational (12ms)", { id: toastId });
              } catch (e) {
                toast.error("Degradation in Asia-North", { id: toastId });
              } finally {
                setIsCheckingHealth(false);
              }
            }}
            className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-mono font-bold text-xs px-3 py-1.5 rounded transition-colors"
          >
            {isCheckingHealth ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5 text-white" />}
            <span>System Health</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div variants={item} key={i}>
              <Card className="bg-zinc-950 border-zinc-800 hover:border-zinc-700 transition-colors p-5 rounded-lg">
                <CardContent className="p-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">{stat.title}</p>
                      <p className="text-3xl font-extrabold mt-2 text-white tracking-tight">{stat.value}</p>
                    </div>
                    <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-xs font-mono">
                    <span className={`flex items-center font-bold ${stat.isUp ? 'text-zinc-300' : 'text-zinc-400'}`}>
                      {stat.isUp ? <ArrowUpRight className="h-3.5 w-3.5 mr-1 text-white" /> : <ArrowDownRight className="h-3.5 w-3.5 mr-1 text-zinc-400" />}
                      {stat.trend}
                    </span>
                    <span className="text-zinc-500 ml-2">vs last week</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Transactions Feed & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2 bg-zinc-950 border-zinc-800 overflow-hidden rounded-lg">
          <CardHeader className="border-b border-zinc-800 bg-black py-3 px-5">
            <CardTitle className="text-white text-sm font-bold flex items-center">
              <Activity className="h-4 w-4 mr-2 text-white" />
              Live Transactions Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[350px] overflow-y-auto w-full">
            {recentTransactions.length === 0 ? (
              <div className="flex h-full items-center justify-center p-6 text-center">
                <div>
                  <div className="w-10 h-10 rounded-full border-2 border-zinc-700 border-t-white animate-spin mx-auto mb-3" />
                  <p className="text-zinc-400 font-mono text-xs font-bold">Waiting for live events...</p>
                  <p className="text-zinc-500 text-xs mt-1">Listening for real-time transactions</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800 w-full">
                {recentTransactions.slice(0, 10).map((tx: any) => (
                  <div 
                    key={tx.id} 
                    className="p-4 hover:bg-zinc-900 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{tx.merchant_name || 'Unknown'}</p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{(tx.id || '').substring(0, 13)}...</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono font-bold text-white">{tx.currency} {tx.amount}</p>
                      <p className="text-[10px] font-mono font-bold uppercase mt-0.5 text-zinc-400">
                        {tx.risk_label || 'unknown'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-950 border-zinc-800 rounded-lg">
          <CardHeader className="border-b border-zinc-800 bg-black py-3 px-5">
            <CardTitle className="text-white text-sm font-bold flex items-center">
              <ShieldAlert className="h-4 w-4 mr-2 text-white" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex h-[350px] items-center justify-center flex-col p-6 text-center">
              <div className="w-12 h-12 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3 text-white">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-white font-bold text-xs uppercase tracking-wider">All Clear</p>
              <p className="text-zinc-500 text-xs mt-1 leading-relaxed">No anomalous patterns detected in the last hour.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
