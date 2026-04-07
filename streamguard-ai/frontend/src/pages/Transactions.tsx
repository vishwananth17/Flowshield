import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Filter } from 'lucide-react';
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

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getRiskColor = (score: number) => {
    if (score < 0.3) return 'bg-[#10B981]';
    if (score < 0.7) return 'bg-[#F59E0B]';
    return 'bg-[#EF4444]';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Transactions Feed</h1>
          <p className="text-gray-400 mt-1">Live monitoring of your transaction stream</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="text-gray-300 border-[#374151]">
            <Filter className="mr-2 h-4 w-4" /> Filters
          </Button>
          <Button variant="outline" className="text-gray-300 border-[#374151]">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 uppercase bg-[#1F2937] border-b border-[#374151]">
                <tr>
                  <th className="px-6 py-4 rounded-tl-lg">Transaction ID</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Merchant</th>
                  <th className="px-6 py-4">Risk Score</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4 rounded-tr-lg">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Loading transactions...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No transactions found. Send a test request via API.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx, idx) => (
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
