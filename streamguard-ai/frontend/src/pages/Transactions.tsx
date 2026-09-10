import React, { useState, useEffect } from 'react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { LiveIndicator } from '@/components/ui/LiveIndicator';
import { Button } from '@/components/ui/button';
import {
  TransactionDetailDrawer,
  type TransactionRecord,
} from '@/components/transactions/TransactionDetailDrawer';
import { Download, RefreshCw, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useTransactionStore } from '@/stores/transactionStore';
import api from '@/services/api';

const DEFAULT_TRANSACTIONS: TransactionRecord[] = [
  {
    id: 'TXN-10483',
    amount: 48500,
    currency: 'INR',
    customer: 'CUS-8124',
    riskScore: 94,
    status: 'BLOCKED',
    time: '2s ago',
    timestamp: 'Apr 17, 2026, 10:32:48 AM IST',
    merchant: 'CryptoExchange India',
    category: '6051 — Quasi-Cash',
    location: 'New Delhi, India',
    device: 'Realme 11 Pro · Android 14',
    ipAddress: '103.21.124.5',
    threeDsResult: 'UPI MPIN Initiated',
    paymentMethod: 'upi',
    gateway: 'razorpay',
    vpa: 'refund.claim88@ybl',
    upiApp: 'Google Pay',
    upiFlowType: 'collect',
    signals: [
      {
        name: 'Cybercrime 1930 Account Freeze Risk',
        description: 'MHA Cybercrime Portal freeze vector. Auto-blocked to protect merchant bank account',
        impact: 48,
        severity: 'critical',
      },
      {
        name: 'Unsolicited UPI Collect Request',
        description: 'Inverted UPI collect request initiated without active cart checkout session',
        impact: 28,
        severity: 'high',
      },
      {
        name: 'Burner VPA Cycling',
        description: '6 distinct virtual payment addresses cycled from single hardware GUID',
        impact: 18,
        severity: 'high',
      },
    ],
    timeline: [
      { id: 1, time: '10:32:40 AM', title: 'UPI Collect session initiated', detail: 'VPA: refund.claim88@ybl' },
      { id: 2, time: '10:32:42 AM', title: 'Cybercrime ledger evaluated', detail: 'Pattern matches 1930 Section 102 CrPC alert', type: 'critical' },
      { id: 3, time: '10:32:45 AM', title: 'Burner VPA cycle detected', detail: 'Same hardware hash cycled 6 VPAs in 15m', type: 'risk' },
      { id: 4, time: '10:32:48 AM', title: 'Defensive block enforced', detail: 'Razorpay settlement account protected from lien', type: 'critical' },
    ],
    customerContext: {
      accountAge: '2 days',
      priorTransactions: 0,
      priorDisputes: 2,
      knownDevices: 1,
    },
  },
  {
    id: 'TXN-10482',
    amount: 8990,
    currency: 'INR',
    customer: 'CUS-5510',
    riskScore: 82,
    status: 'REVIEW',
    time: '14s ago',
    timestamp: 'Apr 17, 2026, 10:32:36 AM IST',
    merchant: 'StyleStreet D2C',
    category: '5651 — Family Apparel',
    location: 'Patna, Bihar',
    device: 'Android 14 · Chrome 124',
    ipAddress: '157.48.12.90',
    threeDsResult: 'Cash on Delivery (Unverified)',
    paymentMethod: 'cod',
    isCod: true,
    deliveryPincode: '800001',
    rtoRiskScore: 86,
    codRecommendation: 'REQUIRE_PREPAID_UPI',
    signals: [
      {
        name: 'High RTO Delivery Cluster (800001)',
        description: 'Destination pincode exhibits >42% courier return-to-origin and refusal rate',
        impact: 44,
        severity: 'high',
      },
      {
        name: 'First-Time Buyer High Ticket COD',
        description: 'Cart total exceeds ₹5,000 with zero prior purchase history',
        impact: 26,
        severity: 'medium',
      },
      {
        name: 'Incomplete Street Address Hash',
        description: 'Generic landmark hash correlates with first-attempt delivery refusal',
        impact: 12,
        severity: 'low',
      },
    ],
    timeline: [
      { id: 1, time: '10:32:15 AM', title: 'Order placed via COD', detail: 'Cart total ₹8,990 to Patna (800001)' },
      { id: 2, time: '10:32:28 AM', title: 'RTO courier risk evaluated', detail: 'Pincode historical refusal 42%', type: 'risk' },
      { id: 3, time: '10:32:36 AM', title: 'COD converted to Prepaid Recommendation', detail: 'Trigger WhatsApp 5% discount prepaid UPI prompt', type: 'risk' },
    ],
    customerContext: {
      accountAge: '4 hours',
      priorTransactions: 0,
      priorDisputes: 0,
      knownDevices: 1,
    },
  },
  {
    id: 'TXN-10481',
    amount: 4500,
    currency: 'INR',
    customer: 'CUS-9912',
    riskScore: 12,
    status: 'APPROVED',
    time: '38s ago',
    timestamp: 'Apr 17, 2026, 10:32:12 AM IST',
    merchant: 'FreshBites Daily',
    category: '5411 — Grocery Store',
    location: 'Mumbai, India',
    device: 'iPhone 15 · PhonePe App',
    ipAddress: '49.207.181.12',
    threeDsResult: 'UPI Intent Authenticated',
    paymentMethod: 'upi',
    gateway: 'phonepe',
    vpa: 'ananya.iyer@okhdfcbank',
    upiApp: 'PhonePe',
    upiFlowType: 'intent',
    rtoRiskScore: 8,
    codRecommendation: 'ALLOW_COD',
    signals: [
      {
        name: 'Trusted Domestic UPI Profile',
        description: 'Hardware fingerprint matched 18 prior successful orders with zero disputes',
        impact: -18,
        severity: 'low',
      },
    ],
    timeline: [
      { id: 1, time: '10:32:00 AM', title: 'UPI Intent launched', detail: 'PhonePe app intent invoked' },
      { id: 2, time: '10:32:12 AM', title: 'Approved automatically', detail: 'Safe score 12 passed directly to settlement', type: 'normal' },
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
  {
    id: 'TXN-10478',
    amount: 54000,
    currency: 'INR',
    customer: 'CUS-1192',
    riskScore: 89,
    status: 'BLOCKED',
    time: '4m ago',
    timestamp: 'Apr 17, 2026, 10:28:10 AM IST',
    merchant: 'GadgetZone',
    category: '5732 — Electronics',
    location: 'Bucharest, Romania',
    device: 'Linux x86_64 · Firefox',
    ipAddress: '82.76.104.22',
    threeDsResult: 'Failed Challenge',
    signals: [
      {
        name: 'Device Emulator Detected',
        description: 'Canvas fingerprint indicates headless automated browser',
        impact: 45,
        severity: 'critical',
      },
    ],
    timeline: [
      { id: 1, time: '10:28:02 AM', title: 'Automated session started', detail: 'Headless browser identified' },
      { id: 2, time: '10:28:10 AM', title: 'Hard block enforced', detail: 'Emulation heuristic match', type: 'critical' },
    ],
    customerContext: {
      accountAge: '1 hour',
      priorTransactions: 0,
      priorDisputes: 0,
      knownDevices: 1,
    },
  },
  {
    id: 'TXN-10477',
    amount: 890,
    currency: 'INR',
    customer: 'CUS-3401',
    riskScore: 5,
    status: 'APPROVED',
    time: '6m ago',
    timestamp: 'Apr 17, 2026, 10:26:00 AM IST',
    merchant: 'CoffeeRoasters',
    category: '5812 — Eating Places',
    location: 'Hyderabad, India',
    device: 'Pixel 8 · Chrome',
    ipAddress: '103.21.124.5',
    threeDsResult: 'Frictionless',
    signals: [],
    timeline: [
      { id: 1, time: '10:26:00 AM', title: 'Payment captured', detail: 'Regular customer order' },
    ],
    customerContext: {
      accountAge: '2 years',
      priorTransactions: 42,
      priorDisputes: 0,
      knownDevices: 1,
    },
  },
];

export default function Transactions() {
  const { recentTransactions, setInitialTransactions } = useTransactionStore();
  const [transactions, setTransactions] = useState<TransactionRecord[]>(DEFAULT_TRANSACTIONS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'REVIEW' | 'BLOCKED'>('ALL');
  const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Load from API if available
  const fetchTransactions = async () => {
    try {
      const res = await api.get('/transactions');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setInitialTransactions(res.data);
        const mapped: TransactionRecord[] = res.data.map((item: any) => ({
          id: item.id || `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
          amount: parseFloat(item.amount) || 0,
          currency: item.currency || 'INR',
          customer: item.customer_id || item.external_id || 'CUS-UNKNOWN',
          riskScore: Math.round((item.risk_score || 0) * (item.risk_score <= 1 ? 100 : 1)),
          status: item.decision === 'BLOCK' || item.risk_label === 'fraud' ? 'BLOCKED' : item.decision === 'REVIEW' || item.risk_label === 'review' ? 'REVIEW' : 'APPROVED',
          time: 'Recently',
          timestamp: item.created_at || new Date().toISOString(),
          merchant: item.merchant_name || 'Standard Checkout',
          category: 'Retail',
          location: item.location || 'India',
          device: item.device || 'Web Browser',
          ipAddress: item.ip_address || '127.0.0.1',
          threeDsResult: item.three_ds || 'Authenticated',
          signals: [],
          timeline: [
            { id: 1, time: 'Just now', title: 'Evaluated by FlowShield ML engine', detail: `Risk Score ${item.risk_score}` },
          ],
          customerContext: {
            accountAge: 'Verified',
            priorTransactions: 1,
            priorDisputes: 0,
            knownDevices: 1,
          },
        }));
        setTransactions(mapped);
      }
    } catch {
      // Default fallback mock is kept
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTransactions().finally(() => {
      setTimeout(() => {
        setIsRefreshing(false);
        toast.success('Transactions synchronized');
      }, 400);
    });
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.ipAddress.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || tx.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + pageSize);

  const handleRowClick = (tx: TransactionRecord) => {
    setSelectedTx(tx);
    setIsDrawerOpen(true);
  };

  const handleStatusChange = (id: string, newStatus: 'APPROVED' | 'REVIEW' | 'BLOCKED') => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error('No records to export');
      return;
    }
    const headers = ['ID', 'Amount', 'Currency', 'Customer', 'Merchant', 'Risk Score', 'Status', 'Timestamp'];
    const rows = filteredTransactions.map((tx) => [
      tx.id,
      tx.amount,
      tx.currency,
      tx.customer,
      `"${tx.merchant}"`,
      tx.riskScore,
      tx.status,
      `"${tx.timestamp}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `flowshield_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredTransactions.length} records to CSV`);
  };

  const columns: Column<TransactionRecord>[] = [
    {
      key: 'id',
      label: 'Transaction ID',
      width: '18%',
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
      width: '16%',
      render: (row) => (
        <span className="font-bold text-[14px] text-[var(--text-primary)] tabular-numbers font-sans">
          ₹{row.amount.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'customer',
      label: 'Customer / Merchant',
      width: '24%',
      render: (row) => (
        <div>
          <div className="font-mono text-[12px] text-[var(--text-primary)] font-medium flex items-center gap-1.5 flex-wrap">
            <span className="truncate">{row.customer}</span>
            {row.paymentMethod === 'upi' || row.vpa ? (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                UPI {row.upiApp ? `· ${row.upiApp}` : ''}
              </span>
            ) : row.isCod ? (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                COD · PIN {row.deliveryPincode || 'RTO'}
              </span>
            ) : null}
          </div>
          <div className="text-[11px] text-[var(--text-tertiary)] truncate flex items-center gap-1 mt-0.5">
            <span>{row.merchant}</span>
            {row.vpa && <span className="text-indigo-400 font-mono">· {row.vpa}</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'riskScore',
      label: 'Risk Score',
      width: '16%',
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
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[20px] font-semibold text-[var(--text-primary)] tracking-tight">
              Transactions
            </h1>
            <LiveIndicator />
          </div>
          <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
            Real-time packet interception, fraud classification, and 3DS challenge logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={handleExportCSV}>
            <Download size={13} />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="p-2"
            title="Refresh transactions"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-[var(--brand-500)]' : ''} />
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search by ID, customer, merchant, IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-[var(--radius-sm)] bg-[var(--surface-page)] border border-[var(--border-default)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--brand-500)] transition-colors"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-[var(--surface-page)] border border-[var(--border-default)] p-0.5 rounded-[var(--radius-sm)] text-[12px] font-medium w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'REVIEW', label: 'Review' },
            { id: 'BLOCKED', label: 'Blocked' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1 rounded-[var(--radius-xs)] transition-colors whitespace-nowrap select-none ${
                statusFilter === tab.id
                  ? 'bg-[var(--surface-subtle)] text-[var(--text-primary)] font-semibold shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-[var(--surface-page)] border border-[var(--border-default)] rounded-[var(--radius-lg)] overflow-hidden">
        <DataTable
          columns={columns}
          data={paginatedTransactions}
          rowKey={(row) => row.id}
          onRowClick={handleRowClick}
          emptyState={
            <div className="text-center py-12 space-y-2">
              <p className="text-[13px] text-[var(--text-secondary)] font-medium">
                No transactions matched your criteria.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                }}
              >
                Clear all filters
              </Button>
            </div>
          }
        />

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-[var(--border-subtle)] gap-3 text-[12px]">
          <div className="text-[var(--text-tertiary)] font-mono">
            Showing {totalItems > 0 ? startIndex + 1 : 0}–{Math.min(startIndex + pageSize, totalItems)} of {totalItems} records
          </div>
          <div className="flex items-center gap-2 font-mono">
            <Button
              variant="secondary"
              size="xs"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-[var(--text-tertiary)] px-1">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Transaction Detail Drawer */}
      <TransactionDetailDrawer
        transaction={selectedTx}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onStatusChange={handleStatusChange}
      />

    </div>
  );
}
