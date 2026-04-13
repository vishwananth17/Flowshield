import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Filter, Search } from 'lucide-react';
import api from '@/services/api';

interface Transaction {
  id: string;
  external_id: string;
  amount: string;
  currency: string;
  merchant_name: string;
  risk_score: number;
  risk_label: string;
  decision: string;
  created_at: string;
}

import { toast } from 'sonner';

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await api.get('/transactions');
        setTransactions(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
    
    // Connect to WebSocket feed
    const wsUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('http', 'ws') + '/api/v1/feed/ws'
      : 'ws://localhost:8000/api/v1/feed/ws';
      
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'new_transaction') {
          setTransactions(prev => [payload.data, ...prev].slice(0, 200));
        }
      } catch (err) {
        console.error("WS message error", err);
      }
    };

    return () => ws.close();
  }, []);

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.merchant_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.external_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === 'all' || tx.risk_label === riskFilter;
    return matchesSearch && matchesRisk;
  });

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Transactions Feed</h1>
          <p className="text-gray-400 mt-1">Live monitoring of your transaction stream</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <select 
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[#1F2937] border border-[#374151] rounded-lg text-sm text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
            className="text-gray-300 border-[#374151] hover:bg-[#1F2937]"
          >
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="flex items-center bg-[#111827] border border-[#1F2937] rounded-xl px-4 py-2 focus-within:border-blue-500/50 transition-colors">
        <Search className="h-4 w-4 text-gray-500 mr-3" />
        <input 
          type="text"
          placeholder="Search by Merchant, ID, or Reference..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-gray-500"
        />
      </div>

      <Card className="backdrop-blur-xl bg-[#111827]/60 border-[#1F2937]/80 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 uppercase bg-[#1F2937]/50 border-b border-[#1F2937]/50">
                <tr>
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Merchant</th>
                  <th className="px-6 py-4 text-center">Risk Analysis</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]/30">
                {loading && filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 italic">
                      Intercepting transaction packets...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No matches found for your current filters.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx, idx) => (
                    <tr key={tx.id} className={`border-b border-[#1F2937] ${idx % 2 === 0 ? 'bg-[#0A0E1A]' : 'bg-[#111827]'} hover:bg-[#1F2937]/50 transition-colors`}>
                      <td className="px-6 py-4 font-mono text-gray-300">
                        {tx.external_id || tx.id.substring(0, 13)}
                      </td>
                      <td className="px-6 py-4 font-medium text-white">
                        {tx.currency} {tx.amount}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {tx.merchant_name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 w-24">
                          <span className="font-mono text-xs">{tx.risk_score.toFixed(2)}</span>
                          <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getRiskColor(tx.risk_score)}`} 
                              style={{ width: `${Math.min(100, Math.max(0, tx.risk_score * 100))}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={tx.risk_label as any} pulsingDot={tx.risk_label === 'fraud' || tx.risk_label === 'review'}>
                          {tx.risk_label.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4">
                        <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 h-8">
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
