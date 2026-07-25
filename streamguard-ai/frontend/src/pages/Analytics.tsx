import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Heading1, Caption, Label } from '@/components/ui/Typography';
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
          <div className="w-10 h-10 border-2 border-[var(--border-default)] border-t-[var(--color-primary)] rounded-full animate-spin mx-auto mb-3" />
          <Caption className="font-mono font-bold">Aggregating global intelligence...</Caption>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-left font-body">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <Heading1>Intelligence Ledger</Heading1>
          <Caption className="mt-1 block">Real-time fraud velocity and global risk telemetry.</Caption>
        </div>
        <div className="flex items-center space-x-2 text-[10px] font-mono bg-[var(--bg-inset)] text-[var(--text-secondary)] px-3 py-1 rounded border border-[var(--border-default)] uppercase tracking-wider">
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
          <Card key={i} className="hover:border-[var(--border-gold)] transition-colors p-5">
            <div className="flex items-center justify-between pb-2">
              <Label className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">{item.label}</Label>
              <item.icon className="h-4 w-4 text-[var(--text-gold)]" />
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {typeof item.value === 'number' ? item.value.toLocaleString() : item.value || '0'}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="default" className="lg:col-span-2 overflow-hidden">
          <div className="border-b border-[var(--border-default)] bg-[var(--bg-inset)] py-3 px-5 -mx-6 -mt-6 mb-6">
            <span className="text-white text-sm font-bold">Global Risk Telemetry Map</span>
          </div>
          <div className="h-[400px] relative flex items-center justify-center -mx-6 -mb-6 bg-[var(--bg-inset)]">
            <svg className="w-full h-full opacity-35" viewBox="0 0 1000 500" fill="none">
              {Object.entries(COUNTRY_COORDS).map(([code, coords]) => (
                <g key={code}>
                  <circle cx={coords.x} cy={coords.y} r="6" className="fill-[var(--border-strong)]" />
                  <circle cx={coords.x} cy={coords.y} r="3" className="fill-white" />
                  <text x={coords.x + 10} y={coords.y + 4} fill="var(--text-muted)" fontSize="10" fontFamily="monospace">{coords.name}</text>
                </g>
              ))}
            </svg>
          </div>
        </Card>

        <Card variant="default" className="flex flex-col">
          <div className="border-b border-[var(--border-default)] bg-[var(--bg-inset)] py-3 px-5 -mx-6 -mt-6 mb-6">
            <span className="text-white text-sm font-bold">Regional Distribution</span>
          </div>
          <div className="space-y-4 font-mono text-xs flex-1">
            {Object.entries(stats?.risk_by_country || {}).length === 0 ? (
              <p className="text-[var(--text-muted)] text-center py-8">No regional data recorded yet.</p>
            ) : (
              Object.entries(stats?.risk_by_country || {}).map(([country, count]) => (
                <div key={country} className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-2">
                  <span className="text-[var(--text-secondary)] font-bold">{COUNTRY_COORDS[country]?.name || country}</span>
                  <span className="text-white bg-[var(--bg-inset)] border border-[var(--border-default)] px-2 py-0.5 rounded text-[10px] font-bold">
                    {count} events
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
