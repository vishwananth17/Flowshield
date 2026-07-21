import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, ShieldAlert, DollarSign } from 'lucide-react';
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
      <div className="flex items-center justify-center min-h-[60vh] font-body">
        <div className="text-center">
            <div className="w-10 h-10 border-2 border-zinc-700 border-t-white rounded-full animate-spin mx-auto mb-3" />
            <p className="text-zinc-400 font-mono text-xs">Aggregating global intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-left font-body">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Intelligence Ledger</h1>
          <p className="text-zinc-400 text-xs mt-1">Real-time fraud velocity and global risk telemetry.</p>
        </div>
        <div className="flex items-center space-x-2 text-[10px] font-mono bg-black text-zinc-300 px-3 py-1 rounded border border-zinc-800 uppercase tracking-wider">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Live Feed Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Analyzed', value: stats?.total_analyzed, icon: Activity },
          { label: 'Fraud Shielded', value: stats?.fraud_blocked, icon: ShieldAlert },
          { label: 'Protected Value', value: `$${(stats?.total_volume || 0).toLocaleString()}`, icon: DollarSign },
          { label: 'System Latency', value: `${stats?.avg_latency_ms.toFixed(1)}ms`, icon: Activity },
        ].map((item, i) => (
          <Card key={i} className="bg-zinc-950 border-zinc-800 hover:border-zinc-700 transition-colors p-5 rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between p-0 pb-2">
              <CardTitle className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">{item.label}</CardTitle>
              <item.icon className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-3xl font-extrabold text-white tracking-tight">{item.value?.toLocaleString() || 0}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-zinc-950 border-zinc-800 overflow-hidden rounded-lg">
          <CardHeader className="border-b border-zinc-800 bg-black py-3 px-5">
            <CardTitle className="text-white text-sm font-bold">Global Risk Telemetry Map</CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[400px] bg-black relative flex items-center justify-center">
            <svg className="w-full h-full opacity-30" viewBox="0 0 1000 500" fill="none">
              {Object.entries(COUNTRY_COORDS).map(([code, coords]) => (
                <g key={code}>
                  <circle cx={coords.x} cy={coords.y} r="6" className="fill-zinc-700" />
                  <circle cx={coords.x} cy={coords.y} r="3" className="fill-white" />
                  <text x={coords.x + 10} y={coords.y + 4} fill="#A1A1AA" fontSize="10" fontFamily="monospace">{coords.name}</text>
                </g>
              ))}
            </svg>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800 rounded-lg">
          <CardHeader className="border-b border-zinc-800 bg-black py-3 px-5">
            <CardTitle className="text-white text-sm font-bold">Regional Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4 font-mono text-xs">
            {Object.entries(stats?.risk_by_country || {}).length === 0 ? (
              <p className="text-zinc-500 text-center py-8">No regional data recorded yet.</p>
            ) : (
              Object.entries(stats?.risk_by_country || {}).map(([country, count]) => (
                <div key={country} className="flex justify-between items-center border-b border-zinc-800 pb-2">
                  <span className="text-zinc-300 font-bold">{COUNTRY_COORDS[country]?.name || country}</span>
                  <span className="text-white bg-black border border-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold">
                    {count} events
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
