import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/StatCard';
import {
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  ArrowRight,
  Sliders,
  AlertTriangle,
  FileText,
  Clock,
  ChevronRight,
  Info,
  CheckCircle2,
  Filter,
  Download,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RadarOverview() {
  const [dateRange, setDateRange] = useState('30d');

  // Top Triggered Rules
  const topRules = [
    {
      id: 'rule_1',
      name: 'Block if :risk_level: = \'highest\'',
      type: 'BLOCK',
      category: 'Machine learning',
      triggeredCount: 142,
      volumeBlocked: '₹1,248,000',
      activeSince: '3 months ago',
    },
    {
      id: 'rule_2',
      name: 'Block if :ip_country: != :card_country: and :amount_in_inr: > 25000',
      type: 'BLOCK',
      category: 'Location & Amount',
      triggeredCount: 89,
      volumeBlocked: '₹892,500',
      activeSince: '6 months ago',
    },
    {
      id: 'rule_3',
      name: 'Review if :risk_level: = \'elevated\'',
      type: 'REVIEW',
      category: 'Manual triage',
      triggeredCount: 64,
      volumeBlocked: '₹412,000',
      activeSince: '1 month ago',
    },
    {
      id: 'rule_4',
      name: 'Request 3DS if :is_3d_secure_recommended: = \'true\'',
      type: '3DS',
      category: 'Authentication',
      triggeredCount: 420,
      volumeBlocked: '₹3,610,000',
      activeSince: '6 months ago',
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E3E8EE] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#1A1F36]">Radar Overview</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#EEF2FF] text-[#635BFF] border border-[#C7D2FE]">
              Active Protection
            </span>
          </div>
          <p className="text-sm text-[#4F566B] mt-1">
            Machine learning fraud defense, dispute prevention, and early risk intervention.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="h-9 px-3 rounded bg-white border border-[#E3E8EE] text-xs font-medium text-[#1A1F36] shadow-sm hover:border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="12m">Last 12 months</option>
          </select>

          <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5 text-[#697386]" />
            <span>Export Report</span>
          </Button>

          <Button size="sm" asChild className="gap-1.5 text-xs bg-[#635BFF] hover:bg-[#4F46E5] text-white">
            <Link to="/dashboard/radar/rules">
              <Sliders className="w-3.5 h-3.5" />
              <span>Manage Rules</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Top 4 Key Radar Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Screened Volume"
          rawValue={24810000}
          prefix="₹"
          value="24.8M"
          trend="↑ 18.4%"
          trendDirection="up"
          subtext="48,290 successful checkouts"
        />

        <StatCard
          label="Blocked by Radar"
          value="1.42%"
          trend="↓ 0.28%"
          trendDirection="up"
          subtext="₹842,000 fraud intercepted"
        />

        {/* Dispute Rate vs Network Monitoring Programs */}
        <Card variant="data" padding="md" className="flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="type-label text-[#697386]">Dispute Rate</span>
              <Info className="w-3.5 h-3.5 text-[#697386] cursor-help" title="Calculated as disputed volume divided by total screened volume over 30 days." />
            </div>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-xs font-mono font-semibold bg-[#CBF4C9] text-[#0E6245] border border-[#A3E7A0]">
              HEALTHY
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl lg:text-4xl font-bold tracking-tight text-[#1A1F36]">0.12%</span>
              <span className="text-xs text-[#697386] font-medium">vs 0.90% limit</span>
            </div>
            {/* Visual threshold meter */}
            <div className="mt-2 space-y-1">
              <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden relative">
                <div className="h-full bg-[#0E6245] rounded-full" style={{ width: '13.3%' }} />
              </div>
              <div className="flex justify-between text-[10px] text-[#697386] font-mono">
                <span>0.0%</span>
                <span className="text-[#A8071A] font-semibold">Visa 0.90% Threshold</span>
              </div>
            </div>
          </div>
        </Card>

        <StatCard
          label="3D Secure Challenge Rate"
          value="8.4%"
          trend="96.2% Auth"
          trendDirection="up"
          subtext="Liability shift secured"
        />
      </div>

      {/* Network Benchmark & Monitoring Alert */}
      <div className="rounded-lg bg-[#F8FAFC] border border-[#E3E8EE] p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#CBF4C9] flex items-center justify-center flex-shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5 text-[#0E6245]" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#1A1F36]">
              Your dispute rate is 86% below the card network threshold
            </h4>
            <p className="text-xs text-[#4F566B] mt-0.5 leading-relaxed">
              Visa and Mastercard place merchants in excessive dispute monitoring programs when their dispute rate crosses <strong>0.90%</strong>. Flowshield Radar keeps your merchant accounts in high standing.
            </p>
          </div>
        </div>
        <Link
          to="/dashboard/disputes"
          className="text-xs font-semibold text-[#635BFF] hover:text-[#4F46E5] flex items-center gap-1 whitespace-nowrap self-start md:self-auto"
        >
          <span>View Dispute Desk</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid: Payment Outcomes & Radar Triage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 8 Cols: Payment Outcomes Breakdown */}
        <Card variant="data" padding="none" className="lg:col-span-8 overflow-hidden">
          <div className="p-4 border-b border-[#E3E8EE] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#1A1F36]">Payment Outcomes</h3>
              <p className="text-xs text-[#697386]">How Flowshield Radar handled 49,150 transactions in the last 30 days</p>
            </div>
            <span className="text-xs font-mono text-[#0E6245] font-semibold">98.58% Approved</span>
          </div>

          <div className="p-5 space-y-4">
            
            {/* Outcome Bars */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[#1A1F36] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0E6245]" />
                    Allowed without challenge
                  </span>
                  <span className="text-[#4F566B] font-mono">44,890 (91.3%)</span>
                </div>
                <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#0E6245] h-full rounded-full" style={{ width: '91.3%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[#1A1F36] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#635BFF]" />
                    3D Secure Authenticated (Liability shifted)
                  </span>
                  <span className="text-[#4F566B] font-mono">3,560 (7.2%)</span>
                </div>
                <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#635BFF] h-full rounded-full" style={{ width: '7.2%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[#1A1F36] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8A6100]" />
                    Sent to Manual Review Queue
                  </span>
                  <span className="text-[#4F566B] font-mono">240 (0.5%)</span>
                </div>
                <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#D97706] h-full rounded-full" style={{ width: '3%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[#1A1F36] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#A8071A]" />
                    Blocked by Radar Machine Learning & Rules
                  </span>
                  <span className="text-[#4F566B] font-mono">460 (0.94%)</span>
                </div>
                <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#A8071A] h-full rounded-full" style={{ width: '4%' }} />
                </div>
              </div>
            </div>

            {/* Quick summary strip */}
            <div className="pt-4 border-t border-[#E3E8EE] grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-[#697386]">False Positive Est.</div>
                <div className="text-base font-bold text-[#1A1F36] mt-0.5">&lt; 0.04%</div>
              </div>
              <div>
                <div className="text-xs text-[#697386]">Review Accuracy</div>
                <div className="text-base font-bold text-[#1A1F36] mt-0.5">99.2%</div>
              </div>
              <div>
                <div className="text-xs text-[#697386]">Net Loss Prevented</div>
                <div className="text-base font-bold text-[#0E6245] mt-0.5">₹842,000</div>
              </div>
            </div>

          </div>
        </Card>

        {/* Right 4 Cols: Review Queue Callout */}
        <Card variant="data" padding="md" className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E3E8EE] pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#635BFF]" />
              <h3 className="text-sm font-bold text-[#1A1F36]">Review Queue</h3>
            </div>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#FFECD1] text-[#8A6100]">
              4 Pending
            </span>
          </div>

          <p className="text-xs text-[#4F566B] leading-relaxed">
            Payments flagged with elevated risk requiring your manual confirmation before capture.
          </p>

          <div className="space-y-2.5">
            <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E3E8EE] flex items-center justify-between text-xs">
              <div>
                <div className="font-semibold text-[#1A1F36]">₹14,500 · Rahul S.</div>
                <div className="text-[11px] text-[#697386]">IP mismatch with BIN country</div>
              </div>
              <Badge variant="review" size="sm">Score 78</Badge>
            </div>

            <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E3E8EE] flex items-center justify-between text-xs">
              <div>
                <div className="font-semibold text-[#1A1F36]">₹8,200 · Priya K.</div>
                <div className="text-[11px] text-[#697386]">Velocity spike: 5 attempts</div>
              </div>
              <Badge variant="review" size="sm">Score 74</Badge>
            </div>

            <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E3E8EE] flex items-center justify-between text-xs">
              <div>
                <div className="font-semibold text-[#1A1F36]">₹29,900 · Vikram M.</div>
                <div className="text-[11px] text-[#697386]">Proxy / Tor exit detected</div>
              </div>
              <Badge variant="review" size="sm">Score 82</Badge>
            </div>
          </div>

          <Button variant="secondary" size="sm" asChild className="w-full justify-center text-xs">
            <Link to="/dashboard/radar/reviews">Open Review Queue Desk →</Link>
          </Button>
        </Card>

      </div>

      {/* Row 3: Top Triggered Rules */}
      <Card variant="data" padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-[#E3E8EE] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#1A1F36]">Top Triggered Rules</h3>
            <p className="text-xs text-[#697386]">Rules actively protecting your business in production</p>
          </div>
          <Link
            to="/dashboard/radar/rules"
            className="text-xs font-semibold text-[#635BFF] hover:text-[#4F46E5] flex items-center gap-1"
          >
            <span>View all rules</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] border-b border-[#E3E8EE] text-[11px] font-semibold text-[#697386] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Rule Definition</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Times Triggered</th>
                <th className="px-4 py-3">Volume Intercepted</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E8EE] bg-white">
              {topRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-4 py-3.5 font-mono text-xs text-[#1A1F36] font-medium">
                    {rule.name}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        rule.type === 'BLOCK'
                          ? 'bg-[#FFD8D8] text-[#A8071A]'
                          : rule.type === 'REVIEW'
                          ? 'bg-[#FFECD1] text-[#8A6100]'
                          : 'bg-[#EEF2FF] text-[#635BFF]'
                      }`}
                    >
                      {rule.type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-[#4F566B]">
                    {rule.category}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs font-semibold text-[#1A1F36]">
                    {rule.triggeredCount}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs font-semibold text-[#1A1F36]">
                    {rule.volumeBlocked}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 text-xs text-[#0E6245] font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0E6245]" />
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
