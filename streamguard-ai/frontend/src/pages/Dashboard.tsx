import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { NativeAreaChart, NativeDonutChart } from '@/components/ui/Charts';
import { useTransactionStore } from '@/stores/transactionStore';
import { Shield, ArrowRight, Activity, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Chart Volume Data
const VOLUME_DATA = [
  { time: '00:00', volume: 1420, fraud: 12 },
  { time: '04:00', volume: 890, fraud: 8 },
  { time: '08:00', volume: 3450, fraud: 45 },
  { time: '12:00', volume: 6890, fraud: 82 },
  { time: '16:00', volume: 8420, fraud: 64 },
  { time: '20:00', volume: 7210, fraud: 51 },
  { time: '23:59', volume: 4100, fraud: 28 },
];

// Fraud Attack Vectors
const ATTACK_VECTORS = [
  { name: 'Proxy / TOR Exit', value: 48, color: '#EF4444' },
  { name: 'Velocity Burst', value: 26, color: '#F59E0B' },
  { name: 'Card Testing', value: 16, color: '#06B6D4' },
  { name: 'BIN Mismatch', value: 10, color: '#94A3B8' },
];

export default function Dashboard() {
  const { recentTransactions } = useTransactionStore();

  // Urgent Disputes Mock List
  const urgentDisputes = [
    { id: 'disp_9918', orderId: 'ORD-9918', amount: 14500, daysLeft: 2, gateway: 'Razorpay', status: 'URGENT' },
    { id: 'disp_9914', orderId: 'ORD-9914', amount: 3200, daysLeft: 4, gateway: 'Cashfree', status: 'PENDING' },
    { id: 'disp_9902', orderId: 'ORD-9902', amount: 28900, daysLeft: 7, gateway: 'Razorpay', status: 'IN_REVIEW' },
  ];

  return (
    <div className="space-y-6">
      
      {/* =========================================================================
          ROW 1: 4 HIGH-CONTRAST STAT CARDS (3 cols each on 12-col grid)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Evaluated"
          rawValue={248120}
          value="248,120"
          trend="↑ 14.2%"
          trendDirection="up"
          subtext="vs last 7 days"
        />
        <StatCard
          label="Protected Volume"
          rawValue={840000}
          value="₹8.4L"
          prefix="₹"
          trend="↑ 9.8%"
          trendDirection="up"
          subtext="Intercepted zero-loss"
        />
        <StatCard
          label="Dispute Win Rate"
          value="94.2%"
          trend="↑ 3.1%"
          trendDirection="up"
          subtext="Industry average: 42%"
        />
        <StatCard
          label="Active Disputes"
          rawValue={3}
          value="3"
          trend="→ 0.0%"
          trendDirection="neutral"
          subtext="2 urgent deadlines"
        />
      </div>

      {/* =========================================================================
          ROW 2: LIVE TRANSACTION FEED (8 Cols) + DISPUTES DUE THIS WEEK (4 Cols)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 8 Cols: Real-time Live Transaction Stream */}
        <Card variant="data" padding="none" className="lg:col-span-8 overflow-hidden">
          <div className="p-4 border-b border-border-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-allow opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-status-allow" />
              </span>
              <h3 className="type-label text-text-primary">Live Transaction Ingestion</h3>
            </div>
            <Link to="/dashboard/transactions" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              <span>View full feed</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-border-100">
            {recentTransactions.slice(0, 5).map((tx) => {
              const isBlock = tx.risk_label === 'fraud';
              const isReview = tx.risk_label === 'review';
              const riskPercent = Math.round((tx.risk_score || 0) * 100);

              return (
                <div
                  key={tx.id}
                  className="p-3.5 flex items-center justify-between hover:bg-surface-400/50 transition-colors text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-text-tertiary">
                          {tx.external_id || tx.id.substring(0, 10)}
                        </span>
                        <span className="text-xs text-text-tertiary">·</span>
                        <span className="text-xs text-text-secondary truncate max-w-[160px]">
                          {tx.merchant_name || 'Merchant Store'}
                        </span>
                      </div>
                      <div className="font-semibold text-text-primary">
                        {tx.currency || '₹'} {tx.amount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-end gap-1">
                      <span className="font-mono text-xs text-text-tertiary">
                        Score: {(tx.risk_score || 0).toFixed(2)}
                      </span>
                      <div className="w-20 bg-surface-500 h-1 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            isBlock ? 'bg-status-block' : isReview ? 'bg-status-review' : 'bg-status-allow'
                          }`}
                          style={{ width: `${riskPercent}%` }}
                        />
                      </div>
                    </div>

                    <Badge
                      variant={isBlock ? 'block' : isReview ? 'review' : 'allow'}
                      size="sm"
                    >
                      {isBlock ? 'BLOCKED' : isReview ? 'REVIEW' : 'ALLOWED'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Right 4 Cols: Disputes Urgency Deadline Card */}
        <Card variant="data" padding="md" className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between border-b border-border-100 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <h3 className="type-label text-text-primary">Disputes Due This Week</h3>
            </div>
            <span className="text-xs font-mono text-status-block font-bold">2 Urgent</span>
          </div>

          <div className="space-y-3">
            {urgentDisputes.map((disp) => {
              const isCrit = disp.daysLeft <= 2;

              return (
                <div
                  key={disp.id}
                  className={`p-3 rounded-sm border transition-colors space-y-2 ${
                    isCrit
                      ? 'bg-status-block/[0.04] border-status-block/20 border-l-2 border-l-status-block'
                      : 'bg-surface-200 border-border-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-text-primary">{disp.orderId}</span>
                    <span className="font-semibold text-xs text-text-primary">₹{disp.amount.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-tertiary">{disp.gateway}</span>
                    <span className={`font-mono font-bold ${isCrit ? 'text-status-block' : 'text-status-review'}`}>
                      {disp.daysLeft} days left
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <Button variant="secondary" size="sm" asChild className="w-full justify-center">
            <Link to="/dashboard/disputes">Open Dispute Triage Desk →</Link>
          </Button>
        </Card>

      </div>

      {/* =========================================================================
          ROW 3: VOLUME CHART (8 Cols) + ATTACK VECTOR DONUT (4 Cols)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 8 Cols: Native Precision SVG Area Chart */}
        <Card variant="data" padding="md" className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="type-h3 text-text-primary">Evaluation Volume & Interceptions</h3>
              <p className="type-sm text-text-tertiary">Real-time throughput across all connected gateways</p>
            </div>
            <span className="font-mono text-xs text-cyan-400">● 43ms Latency</span>
          </div>

          <div className="w-full pt-2">
            <NativeAreaChart data={VOLUME_DATA} height={220} />
          </div>
        </Card>

        {/* Right 4 Cols: Native Precision SVG Donut Chart */}
        <Card variant="data" padding="md" className="lg:col-span-4 space-y-4">
          <div className="border-b border-border-100 pb-3">
            <h3 className="type-h3 text-text-primary">Fraud Vectors</h3>
            <p className="type-sm text-text-tertiary">Distribution of blocked anomalies</p>
          </div>

          <div className="w-full flex items-center justify-center py-2">
            <NativeDonutChart data={ATTACK_VECTORS} size={160} />
          </div>

          <div className="space-y-2 pt-2 border-t border-border-100 text-xs font-mono">
            {ATTACK_VECTORS.map((vec) => (
              <div key={vec.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: vec.color }} />
                  <span className="text-text-secondary">{vec.name}</span>
                </div>
                <span className="font-bold text-text-primary">{vec.value}%</span>
              </div>
            ))}
          </div>
        </Card>

      </div>

    </div>
  );
}
