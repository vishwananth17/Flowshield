import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { 
  Activity, 
  ShieldAlert, 
  CheckCircle2, 
  Globe, 
  Sliders, 
  Server,
  Zap
} from 'lucide-react';
import api from '@/services/api';
import { SignalImportanceChart } from '@/components/SignalImportanceChart';

interface Stats {
  total_analyzed: number;
  fraud_blocked: number;
  safe_transactions: number;
  avg_latency_ms: number;
  total_volume: number;
  risk_by_country: Record<string, number>;
}

const COUNTRY_COORDS: Record<string, { x: number; y: number; name: string }> = {
  'IN': { x: 700, y: 230, name: 'India (Domestic)' },
  'US': { x: 220, y: 160, name: 'United States' },
  'DE': { x: 520, y: 130, name: 'Germany' },
  'GB': { x: 470, y: 120, name: 'United Kingdom' },
  'NL': { x: 500, y: 125, name: 'Netherlands' },
  'SG': { x: 770, y: 280, name: 'Singapore' },
  'AE': { x: 620, y: 210, name: 'UAE' },
};

export default function Analytics() {
  const [stats, setStats] = useState<Stats | null>({
    total_analyzed: 248120,
    fraud_blocked: 11910,
    safe_transactions: 236210,
    avg_latency_ms: 43.2,
    total_volume: 840000,
    risk_by_country: {
      'IN': 0.04,
      'US': 0.72,
      'DE': 0.88,
      'NL': 0.65,
      'SG': 0.12,
      'AE': 0.18,
    }
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/analytics/stats');
        if (response.data) {
          setStats(response.data);
        }
      } catch (e) {
        // use fallback state
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-h1 text-text-primary">Intelligence & Telemetry Ledger</h1>
          <p className="type-sm text-text-secondary mt-0.5">
            Cross-merchant velocity vectors, geographic anomaly dispersion, and model confidence metrics.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono bg-cyan-500/10 text-cyan-400 px-3 py-1.5 rounded-sm border border-cyan-500/20">
          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
          <span>GLOBAL ML RADAR ACTIVE</span>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Intercepted"
          rawValue={stats?.total_analyzed || 248120}
          value="248,120"
          trend="↑ 14.2%"
          trendDirection="up"
          subtext="Processed in < 50ms"
        />
        <StatCard
          label="Fraud Intercepted"
          rawValue={stats?.fraud_blocked || 11910}
          value="11,910"
          trend="4.8% rate"
          trendDirection="neutral"
          subtext="Zero chargeback liability"
        />
        <StatCard
          label="Protected Value"
          value="₹8.4L"
          prefix="₹"
          trend="↑ 9.8%"
          trendDirection="up"
          subtext="Shielded merchant capital"
        />
        <StatCard
          label="P99 Inference Latency"
          value="43.2ms"
          trend="Target: < 60ms"
          trendDirection="up"
          subtext="AWS ap-south-1 Edge"
        />
      </div>

      {/* Global Anomaly Map & Origin Country Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Interactive SVG Coordinate Map (7 Cols) */}
        <Card variant="data" padding="md" className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-border-100 pb-3">
            <div>
              <h3 className="type-h3 text-text-primary">Geographic Anomaly Radar</h3>
              <p className="type-sm text-text-tertiary">Real-time IP proxy origin coordinates</p>
            </div>
            <span className="font-mono text-xs text-text-tertiary">Live Geolocation</span>
          </div>

          <div className="relative w-full h-[280px] bg-surface-100 border border-border-100 rounded-sm overflow-hidden flex items-center justify-center p-4">
            
            {/* World Grid Map Background */}
            <svg className="w-full h-full opacity-30 pointer-events-none" viewBox="0 0 1000 500">
              <defs>
                <pattern id="grid-map" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="#475569" />
                </pattern>
              </defs>
              <rect width="1000" height="500" fill="url(#grid-map)" />
            </svg>

            {/* Geolocation Ping Nodes */}
            <div className="absolute inset-0">
              <svg className="w-full h-full" viewBox="0 0 1000 500">
                {Object.entries(COUNTRY_COORDS).map(([code, coords]) => {
                  const risk = stats?.risk_by_country?.[code] || 0.1;
                  const isHigh = risk > 0.6;

                  return (
                    <g key={code} className="cursor-pointer group">
                      <circle
                        cx={coords.x}
                        cy={coords.y}
                        r={isHigh ? 6 : 4}
                        className={isHigh ? 'fill-status-block animate-pulse' : 'fill-cyan-400'}
                      />
                      <circle
                        cx={coords.x}
                        cy={coords.y}
                        r={isHigh ? 14 : 9}
                        className={isHigh ? 'stroke-status-block/40 fill-none' : 'stroke-cyan-400/30 fill-none'}
                      />
                      <text
                        x={coords.x + 12}
                        y={coords.y + 4}
                        fill="#94A3B8"
                        fontSize="11"
                        fontFamily="JetBrains Mono"
                      >
                        {code} ({Math.round(risk * 100)}%)
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

          </div>
        </Card>

        {/* Right: Anomaly by Country Table (5 Cols) */}
        <Card variant="data" padding="none" className="lg:col-span-5 overflow-hidden">
          <div className="p-4 border-b border-border-100 flex items-center justify-between">
            <h3 className="type-label text-text-primary">Origin Anomaly Matrix</h3>
            <span className="text-xs font-mono text-text-tertiary">Weighted Score</span>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Territory</TableHead>
                <TableHead>Avg Risk</TableHead>
                <TableHead className="text-right">Threat Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(stats?.risk_by_country || {}).map(([code, risk]) => {
                const isCrit = risk >= 0.7;
                const isReview = risk >= 0.3 && risk < 0.7;
                const name = COUNTRY_COORDS[code]?.name || code;

                return (
                  <TableRow key={code}>
                    <TableCell className="font-medium text-text-primary text-xs">
                      {name}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {(risk).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={isCrit ? 'block' : isReview ? 'review' : 'allow'} size="sm">
                        {isCrit ? 'HIGH THREAT' : isReview ? 'MODERATE' : 'CLEAN'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

      </div>

      {/* Signal Importance & False Positive Drivers Analysis */}
      <SignalImportanceChart />

    </div>
  );
}
