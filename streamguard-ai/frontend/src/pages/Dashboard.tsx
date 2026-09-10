import React, { useState, useEffect } from 'react';
import { MetricCard } from '@/components/ui/MetricCard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { LiveIndicator } from '@/components/ui/LiveIndicator';
import { Button } from '@/components/ui/button';
import {
  TransactionDetailDrawer,
  type TransactionRecord,
} from '@/components/transactions/TransactionDetailDrawer';
import { Download, RefreshCw, ChevronDown, Filter } from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'HIGH' | 'BLOCKED' | 'REVIEW'>('ALL');
  const [activeSignalFilter, setActiveSignalFilter] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Realistic mock transactions adhering to Part 4.3 specs
  const [transactions, setTransactions] = useState<TransactionRecord[]>([
    {
      id: 'TXN-10483',
      amount: 98500,
      currency: 'INR',
      customer: 'CUS-8124',
      riskScore: 92,
      status: 'BLOCKED',
      time: '2s ago',
      timestamp: 'Apr 17, 2026, 10:32:48 AM IST',
      merchant: 'CryptoExchange.io',
      category: '6051 — Quasi-Cash',
      location: 'Lagos, Nigeria',
      device: 'New — iPhone 14',
      ipAddress: '41.58.100.5 (Nigeria)',
      threeDsResult: 'Not enrolled',
      signals: [
        {
          name: 'Anonymous Proxy / Tor Exit',
          description: 'IP origin identified in global malicious proxy exit list',
          impact: 42,
          severity: 'critical',
        },
        {
          name: 'Billing & Geo Mismatch',
          description: 'Card issuing country (IN) does not match terminal IP (NG)',
          impact: 28,
          severity: 'high',
        },
        {
          name: 'Velocity Spike',
          description: '4 failed payment attempts with different CVVs in past 10 minutes',
          impact: 22,
          severity: 'high',
        },
      ],
      timeline: [
        { id: 1, time: '10:32:40 AM', title: 'Checkout session initiated', detail: 'Cart value ₹98,500' },
        { id: 2, time: '10:32:42 AM', title: 'IP geo-lookup completed', detail: 'Country mismatch detected (NG vs IN)', type: 'risk' },
        { id: 3, time: '10:32:45 AM', title: 'Card CVC check failed (Attempt 1)', detail: 'Issuing bank returned Mismatch', type: 'risk' },
        { id: 4, time: '10:32:48 AM', title: 'ML scoring engine evaluated', detail: 'Score 92 exceeds Critical Block threshold (85)', type: 'critical' },
      ],
      customerContext: {
        accountAge: '3 days',
        priorTransactions: 0,
        priorDisputes: 0,
        knownDevices: 1,
      },
    },
    {
      id: 'TXN-10482',
      amount: 14200,
      currency: 'INR',
      customer: 'CUS-5510',
      riskScore: 78,
      status: 'REVIEW',
      time: '14s ago',
      timestamp: 'Apr 17, 2026, 10:32:36 AM IST',
      merchant: 'StyleStreet Retail',
      category: '5651 — Family Apparel',
      location: 'Bangalore, India',
      device: 'Android 14 · Chrome 124',
      ipAddress: '157.48.12.90',
      threeDsResult: '3DS 2.0 Challenged',
      signals: [
        {
          name: 'Rapid IP Subnet Shift',
          description: 'User switched IP addresses 3 times during checkout',
          impact: 34,
          severity: 'high',
        },
        {
          name: 'High-Ticket Velocity',
          description: 'Cart total 4x higher than merchant customer median',
          impact: 22,
          severity: 'medium',
        },
      ],
      timeline: [
        { id: 1, time: '10:32:15 AM', title: 'Item added to cart', detail: 'Women designer wear' },
        { id: 2, time: '10:32:28 AM', title: 'IP address changed mid-session', detail: 'Switched from cellular to public Wi-Fi', type: 'risk' },
        { id: 3, time: '10:32:36 AM', title: 'Transaction held in manual review', detail: 'Score 78 flagged for secondary approval', type: 'risk' },
      ],
      customerContext: {
        accountAge: '4 months',
        priorTransactions: 2,
        priorDisputes: 0,
        knownDevices: 2,
      },
    },
    {
      id: 'TXN-10481',
      amount: 4500,
      currency: 'INR',
      customer: 'CUS-9912',
      riskScore: 14,
      status: 'APPROVED',
      time: '38s ago',
      timestamp: 'Apr 17, 2026, 10:32:12 AM IST',
      merchant: 'FreshBites Daily',
      category: '5411 — Grocery Store',
      location: 'Mumbai, India',
      device: 'MacBook Pro · Safari 17',
      ipAddress: '49.207.181.12',
      threeDsResult: 'Frictionless Authenticated',
      signals: [
        {
          name: 'Trusted Customer Account',
          description: 'Device fingerprint matched 18 prior successful orders',
          impact: -15,
          severity: 'low',
        },
      ],
      timeline: [
        { id: 1, time: '10:32:00 AM', title: 'Checkout initiated', detail: 'Cart value ₹4,500' },
        { id: 2, time: '10:32:12 AM', title: 'Approved automatically', detail: 'Safe score 14 passed directly to gateway', type: 'normal' },
      ],
      customerContext: {
        accountAge: '14 months',
        priorTransactions: 18,
        priorDisputes: 0,
        knownDevices: 1,
      },
    },
    {
      id: 'TXN-10480',
      amount: 32000,
      currency: 'INR',
      customer: 'CUS-2041',
      riskScore: 84,
      status: 'REVIEW',
      time: '1m ago',
      timestamp: 'Apr 17, 2026, 10:31:50 AM IST',
      merchant: 'ElectronicsDirect',
      category: '5732 — Electronics',
      location: 'New Delhi, India',
      device: 'Windows 11 · Edge 122',
      ipAddress: '182.73.19.4',
      threeDsResult: 'Not requested',
      signals: [
        {
          name: 'BIN Country Mismatch',
          description: 'Card issued in United Kingdom used for delivery in India',
          impact: 38,
          severity: 'high',
        },
      ],
      timeline: [
        { id: 1, time: '10:31:30 AM', title: 'Checkout started', detail: 'High value electronics order' },
        { id: 2, time: '10:31:50 AM', title: 'Review triggered', detail: 'Score 84 held for verification', type: 'risk' },
      ],
      customerContext: {
        accountAge: '1 day',
        priorTransactions: 0,
        priorDisputes: 0,
        knownDevices: 1,
      },
    },
    {
      id: 'TXN-10479',
      amount: 2100,
      currency: 'INR',
      customer: 'CUS-7718',
      riskScore: 8,
      status: 'APPROVED',
      time: '2m ago',
      timestamp: 'Apr 17, 2026, 10:30:45 AM IST',
      merchant: 'StyleStreet Retail',
      category: '5651 — Family Apparel',
      location: 'Chennai, India',
      device: 'iPhone 13 · Safari',
      ipAddress: '157.48.22.180',
      threeDsResult: 'Frictionless',
      signals: [],
      timeline: [
        { id: 1, time: '10:30:45 AM', title: 'Payment captured', detail: 'Standard transaction' },
      ],
      customerContext: {
        accountAge: '8 months',
        priorTransactions: 6,
        priorDisputes: 0,
        knownDevices: 1,
      },
    },
  ]);

  // Handle row click to open right drawer
  const handleRowClick = (tx: TransactionRecord) => {
    setSelectedTransaction(tx);
    setIsDrawerOpen(true);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Live ledger synchronized');
    }, 400);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (selectedFilter === 'HIGH') return tx.riskScore >= 70;
    if (selectedFilter === 'BLOCKED') return tx.status === 'BLOCKED';
    if (selectedFilter === 'REVIEW') return tx.status === 'REVIEW';
    return true;
  });

  // Table Column definitions
  const columns: Column<TransactionRecord>[] = [
    {
      key: 'id',
      label: 'Transaction',
      width: '20%',
      render: (row) => (
        <span className="font-mono text-[13px] font-medium text-[var(--text-secondary)]">
          {row.id}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right',
      width: '18%',
      render: (row) => (
        <span className="font-bold text-[14px] text-[var(--text-primary)] tabular-numbers font-sans">
          ₹{row.amount.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      width: '18%',
      render: (row) => (
        <span className="font-mono text-[12px] text-[var(--text-secondary)]">
          {row.customer}
        </span>
      ),
    },
    {
      key: 'riskScore',
      label: 'Risk Score',
      width: '18%',
      render: (row) => (
        <RiskBadge
          level={
            row.riskScore >= 85 ? 'critical' :
            row.riskScore >= 70 ? 'high' :
            row.riskScore >= 35 ? 'medium' :
            'low'
          }
          score={row.riskScore}
          size="sm"
        />
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: '14%',
      render: (row) => (
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded-[var(--radius-xs)] text-[10px] font-mono font-bold tracking-wide ${
            row.status === 'APPROVED'
              ? 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]'
              : row.status === 'REVIEW'
              ? 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]'
              : 'bg-[var(--status-error-bg)] text-[var(--status-error-text)]'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: 'time',
      label: 'Time',
      align: 'right',
      width: '12%',
      render: (row) => (
        <span className="text-[12px] text-[var(--text-tertiary)] font-mono">
          {row.time}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* 4.1 — PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
        <div>
          <h1 className="text-[20px] font-semibold text-[var(--text-primary)] tracking-tight">
            Good morning, Vishwanath.
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
            Showing transaction risk intelligence for the last 24 hours.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Selector */}
          <div className="h-[34px] px-3 bg-[var(--surface-page)] border border-[var(--border-default)] rounded-[var(--radius-sm)] flex items-center gap-2 text-[12px] font-medium text-[var(--text-primary)] select-none">
            <span>Last 24 hours</span>
            <ChevronDown size={14} className="text-[var(--text-tertiary)]" />
          </div>

          {/* Export Button */}
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => toast.info('Exporting 24h risk ledger...')}>
            <Download size={13} />
            <span>Export</span>
          </Button>

          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="p-2"
            title="Refresh telemetry"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-[var(--brand-500)]' : ''} />
          </Button>
        </div>
      </div>

      {/* 4.2 — KPI ROW (4 METRIC CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Transactions Analyzed"
          rawValue={128492}
          value="128,492"
          trend={14.2}
          subtext="vs last 24h"
        />
        <MetricCard
          label="Fraud Events"
          rawValue={2184}
          value="2,184"
          trend={-3.8}
          isInverseTrend={true}
          subtext="Intercepted zero-loss"
        />
        <MetricCard
          label="High Risk Flagged"
          rawValue={412}
          value="412"
          trend={0.4}
          isInverseTrend={true}
          subtext="Requires review"
        />
        <MetricCard
          label="Potential Exposure Prevented"
          rawValue={1840000}
          value="₹18.4L"
          trend={-12.5}
          isInverseTrend={true}
          subtext="Protected merchant capital"
        />
      </div>

      {/* 4.3 — TWO-COLUMN MAIN CONTENT (58% / 42%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (58% / 7 cols): Live Transaction Feed */}
        <div className="lg:col-span-7 space-y-3">
          <div className="p-4 bg-[var(--surface-page)] border border-[var(--border-default)] rounded-[var(--radius-lg)] space-y-4">
            
            {/* Header with LiveIndicator and count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
                  Live Transactions
                </h3>
                <LiveIndicator />
              </div>
              <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
                {transactions.length} events stream
              </span>
            </div>

            {/* Sub-header Filter Tabs */}
            <div className="flex items-center gap-1 border-b border-[var(--border-subtle)] pb-2 text-[12px] font-medium">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'HIGH', label: 'High Risk' },
                { id: 'BLOCKED', label: 'Blocked' },
                { id: 'REVIEW', label: 'Review' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedFilter(tab.id as any)}
                  className={`px-3 py-1 rounded-[var(--radius-xs)] transition-colors select-none ${
                    selectedFilter === tab.id
                      ? 'bg-[var(--surface-subtle)] text-[var(--text-primary)] font-semibold'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Data Table */}
            <DataTable
              columns={columns}
              data={filteredTransactions}
              rowKey={(row) => row.id}
              onRowClick={handleRowClick}
            />

          </div>
        </div>

        {/* Right Column (42% / 5 cols): Risk Intelligence Summary */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card 1: Risk Score Distribution */}
          <div className="p-5 bg-[var(--surface-page)] border border-[var(--border-default)] rounded-[var(--radius-lg)] space-y-4">
            <div>
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
                Risk Score Distribution
              </h3>
              <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">
                Distribution across 128,492 evaluated sessions
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {/* Low Risk */}
              <div className="space-y-1">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[var(--text-secondary)] font-medium">Low (0–30)</span>
                  <span className="font-mono text-[var(--text-primary)] font-semibold">86,089 (67%)</span>
                </div>
                <div className="w-full bg-[var(--surface-subtle)] h-[6px] rounded-[3px] overflow-hidden">
                  <div className="bg-[var(--risk-low-dot)] h-full rounded-[3px]" style={{ width: '67%' }} />
                </div>
              </div>

              {/* Medium Risk */}
              <div className="space-y-1">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[var(--text-secondary)] font-medium">Medium (31–70)</span>
                  <span className="font-mono text-[var(--text-primary)] font-semibold">30,838 (24%)</span>
                </div>
                <div className="w-full bg-[var(--surface-subtle)] h-[6px] rounded-[3px] overflow-hidden">
                  <div className="bg-[var(--risk-medium-dot)] h-full rounded-[3px]" style={{ width: '24%' }} />
                </div>
              </div>

              {/* High Risk */}
              <div className="space-y-1">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[var(--text-secondary)] font-medium">High (71–100)</span>
                  <span className="font-mono text-[var(--text-primary)] font-semibold">11,565 (9%)</span>
                </div>
                <div className="w-full bg-[var(--surface-subtle)] h-[6px] rounded-[3px] overflow-hidden">
                  <div className="bg-[var(--risk-high-dot)] h-full rounded-[3px]" style={{ width: '9%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Top Risk Signals */}
          <div className="p-5 bg-[var(--surface-page)] border border-[var(--border-default)] rounded-[var(--radius-lg)] space-y-4">
            <div>
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
                Top Risk Signals
              </h3>
              <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">
                What's triggering flags today? Click to inspect
              </p>
            </div>

            <div className="divide-y divide-[var(--border-subtle)] text-[13px]">
              {[
                { name: 'New device fingerprint', count: '847' },
                { name: 'Velocity threshold', count: '623' },
                { name: 'Amount anomaly', count: '412' },
                { name: 'Location mismatch', count: '398' },
                { name: 'Account age < 7d', count: '201' },
              ].map((sig) => (
                <div
                  key={sig.name}
                  onClick={() => {
                    setActiveSignalFilter(sig.name);
                    setSelectedFilter('HIGH');
                    toast.info(`Filtering table by "${sig.name}"`);
                  }}
                  className="py-2.5 flex items-center justify-between cursor-pointer hover:text-[var(--brand-600)] transition-colors select-none"
                >
                  <span className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                    {sig.name}
                  </span>
                  <span className="font-mono text-[12px] text-[var(--text-primary)] font-semibold">
                    {sig.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* 4.4 — CHARTS ROW (60% / 40% STRICT MINIMALIST SPEC) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 60% (7 cols): Transaction Volume Area Chart */}
        <div className="lg:col-span-7 p-5 bg-[var(--surface-page)] border border-[var(--border-default)] rounded-[var(--radius-lg)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
                Transaction Volume (7d)
              </h3>
              <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">
                Daily evaluation throughput across all connected gateways
              </p>
            </div>
            <span className="text-[11px] font-mono text-[var(--brand-600)] font-semibold">
              43ms avg response
            </span>
          </div>

          {/* Clean minimalist SVG Area Chart */}
          <div className="w-full h-[180px] relative pt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 600 160" preserveAspectRatio="none">
              <defs>
                <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand-500)" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="var(--brand-500)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Minimal horizontal grid only */}
              <line x1="0" y1="40" x2="600" y2="40" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
              <line x1="0" y1="80" x2="600" y2="80" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
              <line x1="0" y1="120" x2="600" y2="120" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />

              {/* Area path */}
              <path
                d="M 0,130 L 100,110 L 200,75 L 300,90 L 400,45 L 500,60 L 600,25 L 600,160 L 0,160 Z"
                fill="url(#volumeFill)"
              />

              {/* 1.5px Stroke line */}
              <path
                d="M 0,130 L 100,110 L 200,75 L 300,90 L 400,45 L 500,60 L 600,25"
                fill="none"
                stroke="var(--brand-500)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* X-Axis labels */}
            <div className="flex justify-between text-[11px] font-mono text-[var(--text-tertiary)] pt-2 select-none">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Today</span>
            </div>
          </div>
        </div>

        {/* Right 40% (5 cols): Fraud Rate Trend Line Chart */}
        <div className="lg:col-span-5 p-5 bg-[var(--surface-page)] border border-[var(--border-default)] rounded-[var(--radius-lg)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
                Fraud Rate Trend (7d)
              </h3>
              <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">
                Target &lt; 0.90% network monitoring threshold
              </p>
            </div>
            <span className="text-[11px] font-mono text-[var(--risk-low-text)] font-semibold">
              0.14% current
            </span>
          </div>

          <div className="w-full h-[180px] relative pt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 160" preserveAspectRatio="none">
              {/* Horizontal threshold reference line */}
              <line x1="0" y1="50" x2="400" y2="50" stroke="var(--risk-high-border)" strokeWidth="1" strokeDasharray="3 3" />

              <line x1="0" y1="90" x2="400" y2="90" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
              <line x1="0" y1="130" x2="400" y2="130" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />

              {/* Line path */}
              <path
                d="M 0,110 L 66,105 L 133,120 L 200,95 L 266,100 L 333,85 L 400,75"
                fill="none"
                stroke="var(--risk-high-dot)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <div className="flex justify-between text-[11px] font-mono text-[var(--text-tertiary)] pt-2 select-none">
              <span>Day 1</span>
              <span>Day 3</span>
              <span>Day 5</span>
              <span>Today (0.14%)</span>
            </div>
          </div>
        </div>

      </div>

      {/* 5.1 — TRANSACTION DETAIL RIGHT-SIDE DRAWER */}
      <TransactionDetailDrawer
        transaction={selectedTransaction}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onStatusChange={(id, newStatus) => {
          setTransactions((prev) =>
            prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
          );
        }}
      />

    </div>
  );
}
