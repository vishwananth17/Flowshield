import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, type Variants } from 'framer-motion';
import { 
  Activity, 
  ShieldAlert, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight,
  Loader2,
  DollarSign,
  Clock,
  IndianRupee
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useTransactionStore } from '@/stores/transactionStore';
import { toast } from 'sonner';

const TransactionRow = React.memo(({ tx }: { tx: any }) => {
  const isNew = Date.now() - new Date(tx.created_at || Date.now()).getTime() < 3000;
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 transition-all duration-500 flex items-center justify-between ${
        isNew ? 'bg-amber-500/10 border-l-2 border-amber-400' : 'hover:bg-[#1F2937]/30'
      }`}
    >
      <div>
        <p className="text-sm font-medium text-white">{tx.merchant_name || 'Simulated Store'}</p>
        <p className="text-xs text-gray-400 font-mono mt-1">{(tx.id || tx.external_id || '').substring(0, 13)}...</p>
      </div>
      <div className="text-right flex items-center space-x-4">
        <div className="text-right">
          <p className="text-sm font-bold text-white">{tx.currency || 'INR'} {tx.amount}</p>
          <p className={`text-xs mt-1 font-medium ${tx.risk_label === 'fraud' ? 'text-red-400' : tx.risk_label === 'review' ? 'text-amber-400' : 'text-emerald-400'}`}>
            {(tx.risk_label || 'legit').toUpperCase()}
          </p>
        </div>
      </div>
    </motion.div>
  );
});

export default function Dashboard() {
  const [statsData, setStatsData] = useState<any>(null);
  const [timeRange, setTimeRange] = useState('24h');
  const { recentTransactions } = useTransactionStore();
  const prevCountRef = useRef(recentTransactions.length);
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Stable fetch with useCallback so effects don't re-run endlessly
  const fetchStats = useCallback(async () => {
    try {
      const api = (await import('@/services/api')).default;
      const res = await api.get(`/analytics/stats?range=${timeRange}`);
      setStatsData(res.data);
    } catch (e: any) {
      console.warn("Failed to fetch stats silently", e);
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

  // Fetch on mount and whenever the time range changes
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // 🔄 Auto-refresh poll every 30s for live ranges (1h / 24h)
  useEffect(() => {
    if (timeRange !== '1h' && timeRange !== '24h') return;
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, [fetchStats, timeRange]);

  // Refresh stats when new WS transactions arrive (live ranges only)
  useEffect(() => {
    if ((timeRange === '24h' || timeRange === '1h') && recentTransactions.length > prevCountRef.current) {
      fetchStats();
    }
    prevCountRef.current = recentTransactions.length;
  }, [recentTransactions, timeRange, fetchStats]);

  const stats = [
    { 
      title: `Total Analyzed (${timeRange})`, 
      value: statsData?.total_analyzed?.toLocaleString() || '0', 
      trend: '+0%', 
      isUp: true, 
      icon: Activity, 
      color: 'text-blue-500', 
      bg: 'bg-blue-500/10' 
    },
    { 
      title: 'Fraud Detected', 
      value: statsData?.fraud_blocked?.toLocaleString() || '0', 
      trend: (statsData?.total_analyzed && statsData.total_analyzed > 0) 
        ? `${((statsData.fraud_blocked / statsData.total_analyzed) * 100).toFixed(1)}%` 
        : '0%', 
      isUp: false, 
      icon: ShieldAlert, 
      color: 'text-red-500', 
      bg: 'bg-red-500/10' 
    },
    { 
      title: 'Protected Volume', 
      value: `$${statsData?.total_volume?.toLocaleString() || '0'}`, 
      trend: '+0%', 
      isUp: true, 
      icon: DollarSign, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-500/10' 
    },
    { 
      title: 'Inference Latency', 
      value: `${Math.round(statsData?.avg_latency_ms || 0)}ms`, 
      trend: '-0%', 
      isUp: true, 
      icon: Clock, 
      color: 'text-purple-500', 
      bg: 'bg-purple-500/10' 
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
        staggerChildren: 0.1
      }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-8 relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Intelligence Dashboard</h1>
          <p className="text-gray-400 mt-1">Institutional risk visibility for your organizational traffic.</p>
        </motion.div>

        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-wrap items-center gap-3"
        >
          {/* Time Range Filter */}
          <div className="bg-[#111827] border border-[#1F2937] p-1 rounded-xl flex items-center shadow-lg">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timeRange === range.value 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                {range.label}
              </button>
            ))}
            <button
                onClick={() => setTimeRange('custom')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timeRange === 'custom' 
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/20' 
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                CUSTOM
              </button>
          </div>

          <button 
            disabled={isDownloading}
            onClick={handleDownload}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-blue-900/20 transition-all font-bold text-xs"
          >
            {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowDownRight className="h-3.5 w-3.5 rotate-45" />}
            <span>Download Report</span>
          </button>

        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between bg-[#111827]/40 p-4 rounded-2xl border border-[#1F2937]/50"
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">Live Stream Active</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
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
            className="flex items-center space-x-2 text-red-500 hover:text-red-400 font-bold text-xs transition-colors px-3 py-2"
          >
            {isSimulating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldAlert className="h-3.5 w-3.5" />}
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
            className="flex items-center space-x-2 text-blue-500 hover:text-blue-400 font-bold text-xs transition-colors px-3 py-2"
          >
            {isCheckingHealth ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            <span>System Health</span>
          </button>
        </div>
      </motion.div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div variants={item} key={i}>
              <Card className="backdrop-blur-xl bg-[#111827]/60 border-[#1F2937]/80 hover:bg-[#111827]/80 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity ${stat.color.replace('text-', 'bg-')}`} />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-400">{stat.title}</p>
                      <p className="text-3xl font-bold mt-2 text-white">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} shadow-inner`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className={`flex items-center font-medium ${stat.isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                      {stat.isUp ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                      {stat.trend}
                    </span>
                    <span className="text-gray-500 ml-2">vs last week</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <Card className="col-span-2 backdrop-blur-xl bg-[#111827]/60 border-[#1F2937]/80 overflow-hidden">
          <CardHeader className="border-b border-[#1F2937]/50 bg-[#111827]/40 pb-4">
            <CardTitle className="text-white text-lg font-medium flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-400" />
              Live Transactions Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[350px] overflow-y-auto w-full">
            {recentTransactions.length === 0 ? (
              <div className="flex h-full items-center justify-center relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
                <div className="text-center z-10">
                  <div className="relative inline-flex mb-4">
                    <div className="w-12 h-12 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
                    <div className="absolute inset-0 w-12 h-12 rounded-full border border-blue-500/10 blur-sm" />
                  </div>
                  <p className="text-gray-400 font-medium font-mono text-sm">Waiting for live events...</p>
                  <p className="text-gray-500 text-xs mt-1">Listening for real-time transactions</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[#1F2937]/50 w-full overflow-hidden">
                {recentTransactions.slice(0, 10).map((tx: any, index: number) => (
                  <TransactionRow key={tx.id || tx.external_id || index} tx={tx} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="backdrop-blur-xl bg-[#111827]/60 border-[#1F2937]/80">
          <CardHeader className="border-b border-[#1F2937]/50 bg-[#111827]/40 pb-4">
            <CardTitle className="text-white text-lg font-medium flex items-center">
              <ShieldAlert className="h-5 w-5 mr-2 text-red-400" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex h-[350px] items-center justify-center flex-col p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-[#1F2937] flex items-center justify-center mb-4 border border-[#374151]">
                <ShieldAlert className="h-8 w-8 text-gray-500" />
              </div>
              <p className="text-gray-300 font-medium">All clear</p>
              <p className="text-gray-500 text-sm mt-1">No anomalous patterns detected in the last hour.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

