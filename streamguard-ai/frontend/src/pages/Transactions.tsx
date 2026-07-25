import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

  return (
    <div className="space-y-6 text-left font-body">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Transaction Activity Log</h1>
          <p className="text-zinc-400 text-xs mt-1">Real-time log of gateway transaction events.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <select 
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="pl-8 pr-4 py-1.5 bg-black border border-zinc-800 rounded text-xs text-white appearance-none focus:outline-none focus:border-white font-mono"
            >
              <option value="all">All Risk Levels</option>
              <option value="fraud">Fraud</option>
              <option value="review">Review</option>
              <option value="safe">Safe</option>
            </select>
          </div>
          <Button 
            variant="outline" 
            onClick={handleExport}
            className="text-white border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold uppercase tracking-wider rounded h-9"
          >
            <Download className="mr-2 h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="flex items-center bg-black border border-zinc-800 rounded px-3.5 py-2 focus-within:border-white transition-colors">
        <Search className="h-3.5 w-3.5 text-zinc-500 mr-2.5" />
        <input 
          type="text"
          placeholder="Search by Merchant, ID, or Reference..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none outline-none text-xs w-full text-white placeholder:text-zinc-600 font-mono"
        />
      </div>

      <Card className="bg-zinc-950 border-zinc-800 overflow-hidden rounded-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] font-mono text-zinc-400 uppercase bg-black border-b border-zinc-800">
                <tr>
                  <th className="px-5 py-3.5">Transaction ID</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Merchant</th>
                  <th className="px-5 py-3.5 text-center">Risk Analysis</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Time</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {loading && filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 font-mono text-xs">
                      Processing transaction records...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 font-mono text-xs">
                      No matches found for your current filters.
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((tx) => {
                    return (
                      <tr key={tx.id} className="hover:bg-zinc-900 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-zinc-300">
                          {tx.id.substring(0, 16)}...
                        </td>
                        <td className="px-5 py-3.5 font-mono font-bold text-white">
                          {tx.currency} {tx.amount}
                        </td>
                        <td className="px-5 py-3.5 text-zinc-300 font-medium">
                          {tx.merchant_name || 'N/A'}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="inline-flex items-center gap-2 bg-black px-2.5 py-1 rounded border border-zinc-800">
                            <span className="text-[10px] font-mono font-bold text-white">
                              {(tx.risk_score * 100).toFixed(0)}/100
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge className={`font-mono text-[10px] uppercase font-bold border ${
                            tx.risk_label === 'fraud' ? 'bg-zinc-900 text-white border-zinc-700' :
                            tx.risk_label === 'review' ? 'bg-zinc-900 text-zinc-300 border-zinc-800' :
                            'bg-black text-white border-zinc-800'
                          }`}>
                            {tx.risk_label || 'SAFE'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-zinc-500 text-[10px]">
                          {tx.created_at ? new Date(tx.created_at).toLocaleTimeString() : 'Just now'}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setSelectedTxId(tx.id)}
                            className="text-xs text-white hover:bg-zinc-800 font-bold uppercase tracking-wider"
                          >
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-800 pt-4 text-xs font-mono">
          <span className="text-zinc-500">
            Showing {startIndex + 1}-{endIndex} of {totalItems} transactions
          </span>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="bg-black border-zinc-800 text-white hover:bg-zinc-900 disabled:opacity-40"
            >
              Previous
            </Button>
            <span className="text-zinc-400 font-bold px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="bg-black border-zinc-800 text-white hover:bg-zinc-900 disabled:opacity-40"
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
