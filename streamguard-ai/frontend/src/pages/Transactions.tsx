import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableActionCell } from '@/components/ui/Table';
import { Download, Filter, Search, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import api from '@/services/api';
import { useTransactionStore } from '@/stores/transactionStore';
import { toast } from 'sonner';
import { TransactionDrawer } from '@/components/TransactionDrawer';

export default function Transactions() {
  const { recentTransactions, setInitialTransactions } = useTransactionStore();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, riskFilter]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await api.get('/transactions');
        setInitialTransactions(res.data);
      } catch (e) {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [setInitialTransactions]);

  const filteredTransactions = recentTransactions.filter(tx => {
    const matchesSearch = 
      tx.merchant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.external_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === 'all' || tx.risk_label === riskFilter;
    return matchesSearch && matchesRisk;
  });

  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  const handleExport = () => {
    if (filteredTransactions.length === 0) {
      toast.error("No records to export");
      return;
    }
    const headers = ["ID", "External ID", "Amount", "Currency", "Merchant", "Risk Score", "Label", "Time"];
    const rows = filteredTransactions.map(tx => [
      tx.id, tx.external_id || '', tx.amount, tx.currency, tx.merchant_name, tx.risk_score, tx.risk_label, tx.created_at
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `flowshield_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredTransactions.length} records to CSV`);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-h1 text-text-primary">Transaction Telemetry</h1>
          <p className="type-sm text-text-secondary mt-0.5">
            Real-time packet interception, fraud classification, and 3DS challenge logs.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              aria-label="Filter transactions by risk label"
              className="pl-8 pr-4 h-9 bg-surface-200 border border-border-200 rounded text-xs text-text-primary focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Risk Levels</option>
              <option value="fraud">Blocked (Fraud)</option>
              <option value="review">Needs Review</option>
              <option value="safe">Allowed (Safe)</option>
            </select>
          </div>
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="flex items-center bg-surface-200 border border-border-200 rounded px-3 h-9 focus-within:border-cyan-500 transition-colors">
        <Search className="h-3.5 w-3.5 text-text-tertiary mr-2.5" />
        <input
          type="text"
          placeholder="Filter by Transaction ID, Merchant, or Reference..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none outline-none text-xs w-full text-text-primary placeholder:text-text-tertiary"
        />
      </div>

      {/* Transactions Data Table */}
      <Card variant="data" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Risk Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-text-tertiary">
                    Intercepting transaction telemetry stream...
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-text-tertiary">
                    No transactions found for the current query.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTransactions.map((tx) => {
                  const isBlock = tx.risk_label === 'fraud';
                  const isReview = tx.risk_label === 'review';
                  const riskPercent = Math.round((tx.risk_score || 0) * 100);

                  return (
                    <TableRow
                      key={tx.id}
                      isClickable
                      onClick={() => setSelectedTxId(tx.id)}
                    >
                      <TableCell className="font-mono text-xs text-text-secondary group-hover:text-cyan-400 transition-colors">
                        {tx.external_id || tx.id.substring(0, 13)}
                      </TableCell>
                      <TableCell className="font-semibold text-text-primary">
                        {tx.currency || '₹'} {tx.amount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-text-secondary text-xs">
                        {tx.merchant_name || 'Direct Checkout'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 w-24">
                          <span className="font-mono text-xs text-text-tertiary">
                            {(tx.risk_score || 0).toFixed(2)}
                          </span>
                          <div className="w-full bg-surface-500 h-1 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                isBlock ? 'bg-status-block' : isReview ? 'bg-status-review' : 'bg-status-allow'
                              }`}
                              style={{ width: `${riskPercent}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={isBlock ? 'block' : isReview ? 'review' : 'allow'} size="sm">
                          {isBlock ? 'BLOCKED' : isReview ? 'REVIEW' : 'ALLOWED'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-text-tertiary">
                        {new Date(tx.created_at).toLocaleTimeString()}
                      </TableCell>
                      <TableActionCell />
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-border-100 gap-3 text-xs">
          <div className="text-text-tertiary font-mono">
            Showing {totalItems > 0 ? startIndex + 1 : 0}–{endIndex} of {totalItems} records
          </div>
          <div className="flex items-center space-x-1.5 font-mono">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded border border-border-200 bg-surface-200 text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <span className="px-2 text-text-tertiary">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded border border-border-200 bg-surface-200 text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </Card>

      {/* Drawer */}
      <TransactionDrawer
        txId={selectedTxId}
        onClose={() => setSelectedTxId(null)}
      />

    </div>
  );
}
