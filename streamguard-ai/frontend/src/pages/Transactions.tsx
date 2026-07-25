import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Heading1, Caption } from '@/components/ui/Typography';
import { Download, Filter, Search } from 'lucide-react';
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
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [setInitialTransactions]);

  const filteredTransactions = recentTransactions.filter(tx => {
    const matchesSearch = tx.merchant_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
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
      toast.error("No data to export");
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

  const columns = [
    {
      key: 'id',
      header: 'Transaction ID',
      render: (row: any) => <span className="font-mono text-[var(--text-secondary)]">{row.id.substring(0, 16)}...</span>
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row: any) => <span className="font-mono font-bold text-white">{row.currency} {row.amount}</span>
    },
    {
      key: 'merchant_name',
      header: 'Merchant',
      render: (row: any) => <span className="text-[var(--text-primary)] font-medium">{row.merchant_name || 'N/A'}</span>
    },
    {
      key: 'risk_score',
      header: 'Risk Analysis',
      align: 'center' as const,
      render: (row: any) => (
        <span className="font-mono font-bold text-[var(--text-gold)]">
          {(row.risk_score * 100).toFixed(0)}/100
        </span>
      )
    },
    {
      key: 'risk_label',
      header: 'Status',
      render: (row: any) => {
        const label = row.risk_label || 'SAFE';
        return (
          <Badge 
            variant={
              label === 'fraud' ? 'danger' :
              label === 'review' ? 'warning' : 'success'
            }
            dot
          >
            {label.toUpperCase()}
          </Badge>
        );
      }
    },
    {
      key: 'created_at',
      header: 'Time',
      render: (row: any) => <span className="font-mono text-[var(--text-muted)] text-[10px]">{row.created_at ? new Date(row.created_at).toLocaleTimeString() : 'Just now'}</span>
    },
    {
      key: 'action',
      header: 'Action',
      align: 'right' as const,
      render: (row: any) => (
        <Button 
          variant="ghost" 
          size="xs" 
          onClick={() => setSelectedTxId(row.id)}
        >
          Inspect
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6 text-left font-body">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <Heading1>Transaction Activity Log</Heading1>
          <Caption className="mt-1 block">Real-time log of gateway transaction events.</Caption>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
            <select 
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="pl-8 pr-4 py-1.5 bg-black border border-[var(--border-default)] rounded-[var(--radius-sm)] text-xs text-white appearance-none focus:outline-none focus:border-[var(--color-primary)] h-10 font-mono"
            >
              <option value="all">All Risk Levels</option>
              <option value="fraud">Fraud</option>
              <option value="review">Review</option>
              <option value="safe">Safe</option>
            </select>
          </div>
          <Button 
            onClick={handleExport}
            variant="gold"
            size="md"
            icon={<Download className="h-3.5 w-3.5" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      <div className="w-full">
        <Input 
          placeholder="Search by Merchant, ID, or Reference..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          prefix={<Search className="h-3.5 w-3.5" />}
        />
      </div>

      <Table 
        columns={columns}
        data={paginatedTransactions}
        loading={loading}
        keyExtractor={tx => tx.id}
        emptyState={
          <div className="text-center">
            <Caption>No matches found for your current filters.</Caption>
          </div>
        }
      />

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-4 text-xs font-mono">
          <span className="text-[var(--text-muted)]">
            Showing {startIndex + 1}-{endIndex} of {totalItems} transactions
          </span>
          <div className="flex items-center space-x-2">
            <Button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              variant="ghost"
              size="sm"
            >
              Previous
            </Button>
            <span className="text-[var(--text-secondary)] font-bold px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              variant="ghost"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {selectedTxId && (
        <TransactionDrawer 
          transactionId={selectedTxId}
          isOpen={!!selectedTxId}
          onClose={() => setSelectedTxId(null)}
        />
      )}
    </div>
  );
}
