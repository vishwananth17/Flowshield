import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, ShieldAlert, CheckCircle2, DollarSign } from 'lucide-react';
import api from '@/services/api';

interface Stats {
  total_analyzed: number;
  fraud_blocked: number;
  safe_transactions: number;
  avg_latency_ms: number;
  total_volume: number;
  risk_by_country: Record<string, number>;
}

const COUNTRY_COORDS: Record<string, { x: number; y: number; name: string }> = {
  'US': { x: 180, y: 140, name: 'United States' },
  'CA': { x: 160, y: 80,  name: 'Canada' },
  'BR': { x: 280, y: 320, name: 'Brazil' },
  'GB': { x: 460, y: 100, name: 'United Kingdom' },
  'FR': { x: 480, y: 130, name: 'France' },
  'DE': { x: 510, y: 110, name: 'Germany' },
  'RU': { x: 650, y: 80,  name: 'Russia' },
  'CN': { x: 780, y: 180, name: 'China' },
  'IN': { x: 720, y: 220, name: 'India' },
  'JP': { x: 880, y: 160, name: 'Japan' },
  'AU': { x: 860, y: 380, name: 'Australia' },
  'NG': { x: 490, y: 270, name: 'Nigeria' },
  'ZA': { x: 520, y: 390, name: 'South Africa' },
};

import { motion } from 'framer-motion';

export default function Analytics() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/analytics/stats');
        setStats(response.data);
      } catch (e) {
        console.error('Failed to fetch stats', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
            <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Aggregating global intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6 md:p-12 text-white">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight">Intelligence Ledger</h1>
          <p className="text-gray-400 mt-2 text-lg">Real-time fraud velocity and global risk telemetry.</p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-md border border-blue-500/20">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2" />
            LIVE FEED ACTIVE
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Analyzed', value: stats?.total_analyzed, icon: Activity, color: 'text-blue-400' },
          { label: 'Fraud Shielded', value: stats?.fraud_blocked, icon: ShieldAlert, color: 'text-red-400' },
          { label: 'Protected Value', value: `$${(stats?.total_volume || 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400' },
          { label: 'System Latency', value: `${stats?.avg_latency_ms.toFixed(1)}ms`, icon: Activity, color: 'text-purple-400' },
        ].map((item, i) => (
          <Card key={i} className="bg-[#111827]/50 border-[#1F2937] backdrop-blur-sm group hover:border-blue-500/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{item.label}</CardTitle>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tighter">{item.value?.toLocaleString() || 0}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-[#111827]/50 border-[#1F2937] overflow-hidden relative group">
          <CardHeader className="border-b border-[#1F2937]/50">
            <CardTitle className="text-lg font-medium">Global Risk Heatmap</CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[450px] bg-[#0B0F1A] relative">
            {/* Simple SVG World Map Outline Placeholder */}
            <svg viewBox="0 0 1000 500" className="w-full h-full opacity-20 transition-opacity group-hover:opacity-30">
                <path fill="currentColor" className="text-gray-600" d="M150,100 L250,100 L250,200 L150,200 Z M400,100 L600,100 L600,250 L400,250 Z M700,150 L850,150 L850,300 L700,300 Z M200,300 L350,300 L350,450 L200,450 Z" />
            </svg>
            
            {/* Interactive Dots for Countries with Data */}
            <div className="absolute inset-0">
                {stats && Object.entries(stats.risk_by_country || {}).map(([code, count], index) => {
                    const coord = COUNTRY_COORDS[code] || { x: Math.random() * 800 + 100, y: Math.random() * 300 + 100, name: code };
                    const size = Math.min(60, 10 + count * 5);
                    return (
                        <motion.div
                            key={code}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.1, type: "spring" }}
                            className="absolute cursor-help group/dot"
                            style={{ left: `${(coord.x / 1000) * 100}%`, top: `${(coord.y / 500) * 100}%` }}
                        >
                            <div className="relative -translate-x-1/2 -translate-y-1/2">
                                <div 
                                    className="rounded-full bg-red-500/40 animate-ping absolute inset-0" 
                                    style={{ width: size, height: size }} 
                                />
                                <div 
                                    className="rounded-full bg-red-500/60 border border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)] flex items-center justify-center text-[10px] font-bold" 
                                    style={{ width: size, height: size }}
                                >
                                    {count}
                                </div>
                                
                                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-800 p-2 rounded shadow-2xl opacity-0 group-hover/dot:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                    <p className="font-bold text-white">{coord.name}</p>
                                    <p className="text-red-400 text-xs">{count} blocked threats</p>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
          </CardContent>
          <div className="absolute bottom-4 right-4 text-[10px] text-gray-500 font-mono">
            COORDINATE MAPPING SYSTEM V2.4
          </div>
        </Card>

        <Card className="bg-[#111827]/50 border-[#1F2937] p-8">
          <CardTitle className="text-xl font-bold mb-6 flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2 text-blue-500" />
            Risk Decomposition
          </CardTitle>
          <div className="space-y-6">
            {[
              { label: 'Geographic Mismatch', impact: '42%', color: 'bg-red-500' },
              { label: 'Velocity Thresholds', impact: '28%', color: 'bg-orange-500' },
              { label: 'Device Integrity', impact: '17%', color: 'bg-amber-500' },
              { label: 'Digital Footprint', impact: '13%', color: 'bg-blue-500' },
            ].map((factor, i) => (
              <div key={i} className="group">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{factor.label}</span>
                  <span className="text-xs font-mono text-gray-500">{factor.impact}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: factor.impact }}
                        transition={{ duration: 1, delay: i * 0.2 }}
                        className={`h-full ${factor.color}`}
                    />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
              <p className="text-xs text-blue-400 font-medium italic">"The Isolation Forest model is currently weighting cross-border IP deviations as the most critical risk vector for your organization."</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

