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

  const getRiskColor = (score: number) => {
    if (score < 0.3) return 'bg-[#10B981]';
    if (score < 0.7) return 'bg-[#F59E0B]';
    return 'bg-[#EF4444]';
  };

  return (
    <div className="space-y-5 relative font-sans text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Live Transactions Feed</h1>
            <span className="text-[10px] font-mono uppercase bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 px-2 py-0.5 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Event Stream Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time inference packet inspection across connected merchant gateways.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <div className="relative">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <select 
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-300 appearance-none focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="all">All Risk Levels</option>
              <option value="fraud">Fraud (Block)</option>
              <option value="review">Review (Flag)</option>
              <option value="safe">Safe (Allow)</option>
            </select>
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-1.5 text-slate-300 border border-slate-800 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded text-xs font-mono transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center bg-slate-950 border border-slate-800 rounded px-3 py-1.5 focus-within:border-blue-500/80 transition-colors">
        <Search className="h-3.5 w-3.5 text-slate-500 mr-2.5" />
        <input 
          type="text"
          placeholder="Filter by Transaction ID, Merchant, or External Reference..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none outline-none text-xs w-full text-white placeholder:text-slate-500 font-mono"
        />
      </div>

      {/* Dense Table */}
      <div className="bg-[#0D131F] border border-slate-800 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] text-slate-400 uppercase font-mono bg-slate-950/80 border-b border-slate-800">
              <tr>
                <th className="px-3.5 py-2.5">Transaction ID</th>
                <th className="px-3.5 py-2.5">Amount</th>
                <th className="px-3.5 py-2.5">Merchant / Store</th>
                <th className="px-3.5 py-2.5">Inference Score</th>
                <th className="px-3.5 py-2.5">Decision</th>
                <th className="px-3.5 py-2.5">Timestamp</th>
                <th className="px-3.5 py-2.5 text-right">Forensics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {loading && filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500 font-mono">
                    Intercepting transaction telemetry stream...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500 font-mono">
                    No transactions match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx, idx) => {
                  const isFraud = tx.risk_label === 'fraud' || tx.risk_score >= 0.75;
                  const isReview = tx.risk_label === 'review' || (tx.risk_score >= 0.40 && tx.risk_score < 0.75);
                  
                  return (
                    <tr 
                      key={tx.id} 
                      onClick={() => setSelectedTxId(tx.id)}
                      className={`group hover:bg-slate-900/50 transition-colors cursor-pointer ${idx % 2 === 0 ? 'bg-[#0D131F]' : 'bg-[#0A0E1A]'}`}
                    >
                      <td className="px-3.5 py-2.5 font-mono text-slate-300 group-hover:text-blue-400 transition-colors">
                        {tx.external_id || (tx.id ? tx.id.substring(0, 16) : 'tx_live')}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono font-bold text-white">
                        {tx.currency === 'INR' ? '₹' : tx.currency || '$'}{Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-300 font-mono text-[11px]">
                        {tx.merchant_name || 'store_checkout'}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center space-x-2 w-28 font-mono">
                          <span className={`text-[11px] font-bold ${isFraud ? 'text-red-400' : isReview ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {Number(tx.risk_score || 0).toFixed(2)}
                          </span>
                          <div className="w-full bg-slate-800 h-1 rounded overflow-hidden">
                            <div 
                              className={`h-full ${isFraud ? 'bg-red-500' : isReview ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                              style={{ width: `${Math.min(100, Math.max(0, (tx.risk_score || 0) * 100))}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 font-mono">
                        {isFraud ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-950/60 border border-red-800/80 text-red-400">
                            • BLOCK
                          </span>
                        ) : isReview ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-950/60 border border-amber-800/80 text-amber-400">
                            • REVIEW
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 border border-emerald-800/80 text-emerald-400">
                            • ALLOW
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {new Date(tx.created_at || Date.now()).toLocaleTimeString()}
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTxId(tx.id);
                          }}
                          className="text-slate-400 hover:text-white bg-slate-900 hover:bg-blue-600 border border-slate-800 hover:border-blue-500 px-2 py-0.5 rounded text-[11px] font-mono transition-all"
                        >
                          Inspect →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-3 border-t border-slate-800 bg-slate-950/40 gap-3 font-mono text-[11px] text-slate-400">
          <div>
            Showing {totalItems > 0 ? startIndex + 1 : 0}–{endIndex} of {totalItems} transactions
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded border border-slate-800 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-6 rounded text-xs transition-all ${
                  currentPage === page
                    ? 'bg-blue-600 text-white font-bold'
                    : 'border border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded border border-slate-800 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Overlay Backdrop */}
      {selectedTxId && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-300"
          onClick={() => setSelectedTxId(null)}
        />
      )}
      <TransactionDrawer 
        txId={selectedTxId} 
        onClose={() => setSelectedTxId(null)} 
      />
    </div>
  );
}

