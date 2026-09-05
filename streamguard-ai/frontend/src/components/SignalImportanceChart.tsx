import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Sliders, AlertTriangle, ShieldCheck, Zap, Info, ArrowUpRight } from 'lucide-react';
import api from '@/services/api';

interface SignalRank {
  signal: string;
  name: string;
  importance: number;
  category: string;
}

interface FalsePositiveDriver {
  signal: string;
  name: string;
  monthly_false_positives: number;
  recommendation: string;
}

export const SignalImportanceChart: React.FC = () => {
  const [predictiveSignals, setPredictiveSignals] = useState<SignalRank[]>([
    { signal: "card_multi_account_use", name: "Card Multi-Account Usage", importance: 0.35, category: "Card Testing" },
    { signal: "velocity_card_1min", name: "1-Min Rapid Card Velocity", importance: 0.30, category: "Velocity" },
    { signal: "is_headless_browser", name: "Headless Browser / Automation", importance: 0.25, category: "Device" },
    { signal: "amount_vs_average_ratio", name: "Amount vs 30d Average Ratio", importance: 0.22, category: "Spend Pattern" },
    { signal: "device_cluster_size", name: "Device Fingerprint Cluster", importance: 0.20, category: "Device Ring" },
    { signal: "account_prior_disputes", name: "Customer Prior Dispute History", importance: 0.18, category: "Account History" },
    { signal: "3ds_failed", name: "Failed 3DS Bank Verification", importance: 0.18, category: "Authentication" },
    { signal: "is_tor", name: "Tor Anonymization Exit Node", importance: 0.14, category: "Network" },
  ]);

  const [falsePositiveDrivers, setFalsePositiveDrivers] = useState<FalsePositiveDriver[]>([
    { signal: "ip_country_mismatch", name: "IP Country Mismatch", monthly_false_positives: 48, recommendation: "Customers travel or use VPN. Kept at low weight (0.06) to prevent false declines." },
    { signal: "name_mismatch", name: "Name on Card Mismatch", monthly_false_positives: 31, recommendation: "Spouse & corporate expense cards trigger this. Evaluated alongside CVV." },
    { signal: "is_vpn", name: "Commercial VPN Use", monthly_false_positives: 24, recommendation: "Legitimate privacy users trigger VPN. Only step up when combined with elevated spend." },
  ]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchImportance = async () => {
      setLoading(true);
      try {
        const res = await api.get('/transactions/signals/importance');
        if (res.data?.predictive_signals) {
          setPredictiveSignals(res.data.predictive_signals);
        }
        if (res.data?.false_positive_drivers) {
          setFalsePositiveDrivers(res.data.false_positive_drivers);
        }
      } catch (err) {
        // use default state
      } finally {
        setLoading(false);
      }
    };
    fetchImportance();
  }, []);

  const maxImportance = 0.40;

  return (
    <div className="space-y-6">
      {/* Top Predictive Signals Bar Chart */}
      <Card variant="data" padding="md" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-100 pb-3">
          <div>
            <h3 className="type-h3 text-text-primary flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Signal Predictive Power
            </h3>
            <p className="type-sm text-text-tertiary">
              Relative contribution of signals across positive fraud and chargeback outcomes
            </p>
          </div>
          <span className="font-mono text-xs text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/20 self-start sm:self-auto">
            Feature Weights Active
          </span>
        </div>

        <div className="space-y-3 pt-2">
          {predictiveSignals.map((item, idx) => {
            const widthPct = Math.min(100, Math.round((item.importance / maxImportance) * 100));
            const isHigh = item.importance >= 0.25;
            const isMedium = item.importance >= 0.18 && item.importance < 0.25;

            return (
              <div key={item.signal} className="space-y-1 group">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center space-x-2">
                    <span className="text-text-tertiary w-4">#{idx + 1}</span>
                    <span className="text-text-primary font-semibold group-hover:text-cyan-400 transition-colors">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-text-tertiary px-1.5 py-0.5 rounded bg-surface-200 border border-border-100">
                      {item.category}
                    </span>
                  </div>
                  <span className={`font-bold ${isHigh ? 'text-red-400' : isMedium ? 'text-amber-400' : 'text-cyan-400'}`}>
                    {(item.importance * 100).toFixed(0)}% weight
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-surface-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isHigh ? 'bg-gradient-to-r from-red-500 to-rose-400' : 
                      isMedium ? 'bg-gradient-to-r from-amber-500 to-amber-300' : 
                      'bg-gradient-to-r from-cyan-500 to-blue-400'
                    }`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* False Positive Drivers Table */}
      <Card variant="data" padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-border-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="type-label text-text-primary">False Positive Drivers & Merchant Tuning</h3>
              <p className="text-xs text-text-tertiary">Signals that most frequently challenge legitimate buyers</p>
            </div>
          </div>
          <span className="text-xs font-mono text-text-tertiary">Continuous Feedback</span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Signal Factor</TableHead>
              <TableHead>Monthly False Positives</TableHead>
              <TableHead>Engine Tuning Recommendation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {falsePositiveDrivers.map((driver) => (
              <TableRow key={driver.signal}>
                <TableCell className="font-semibold text-text-primary text-xs font-mono">
                  {driver.name}
                </TableCell>
                <TableCell className="font-mono text-xs text-amber-400">
                  {driver.monthly_false_positives} cases
                </TableCell>
                <TableCell className="text-xs text-text-secondary">
                  <div className="flex items-start space-x-1.5">
                    <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{driver.recommendation}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
