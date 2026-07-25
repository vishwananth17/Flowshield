import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  X
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import api from '@/services/api';

export default function Disputes() {
  const navigate = useNavigate();
  
  // List & Stats states
  const [disputes, setDisputes] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, gatewayFilter]);

  // Create Manual Dispute Modal state
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form values
  const [formRef, setFormRef] = useState('');
  const [formGateway, setFormGateway] = useState('manual');
  const [formType, setFormType] = useState('chargeback');
  const [formReason, setFormReason] = useState('Product not received');
  const [formAmount, setFormAmount] = useState('');
  const [formCustName, setFormCustName] = useState('');
  const [formCustEmail, setFormCustEmail] = useState('');
  const [formCustPhone, setFormCustPhone] = useState('');
  const [formOrderId, setFormOrderId] = useState('');
  const [formTxId, setFormTxId] = useState('');
  const [formDeadline, setFormDeadline] = useState('');

  const fetchDisputesAndStats = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Stats
      const statsRes = await api.get('/disputes/stats');
      setStats(statsRes.data);

      // 2. Fetch disputes list with filters
      let url = '/disputes?';
      if (statusFilter) url += `status=${statusFilter}&`;
      if (gatewayFilter) url += `payment_gateway=${gatewayFilter}&`;
      const listRes = await api.get(url);
      setDisputes(listRes.data);
    } catch (e: any) {
      console.error("Failed to load disputes data", e);
      toast.error("Failed to retrieve dispute logs. Please re-sync.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, gatewayFilter]);

  useEffect(() => {
    fetchDisputesAndStats();
  }, [fetchDisputesAndStats]);

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef || !formAmount || !formDeadline) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Logging dispute and scheduling reminders...");

    try {
      const payload = {
        dispute_reference: formRef,
        payment_gateway: formGateway,
        dispute_type: formType,
        dispute_reason: formReason,
        dispute_amount: parseFloat(formAmount),
        currency: "INR",
        customer_name: formCustName || null,
        customer_email: formCustEmail || null,
        customer_phone: formCustPhone || null,
        order_id: formOrderId || null,
        order_date: new Date().toISOString(),
        dispute_raised_at: new Date().toISOString(),
        response_deadline: new Date(formDeadline).toISOString(),
        external_transaction_id: formTxId || null
      };

      await api.post('/disputes', payload);
      toast.success("Dispute logged. Automated evidence gathering initialized.", { id: toastId });
      
      // Reset Form & Close
      setShowModal(false);
      setFormRef('');
      setFormAmount('');
      setFormCustName('');
      setFormCustEmail('');
      setFormCustPhone('');
      setFormOrderId('');
      setFormTxId('');
      setFormDeadline('');
      
      // Refresh list
      fetchDisputesAndStats();
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.detail || "Failed to create manual dispute.", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const getUrgencyBadge = (_urgency: string, deadlineStr: string) => {
    const deadline = new Date(deadlineStr);
    const label = deadline.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    return (
      <span className="bg-zinc-900 text-zinc-300 border border-zinc-800 px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase">
        Deadline: {label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'won':
        return <span className="bg-white text-black font-extrabold px-2.5 py-0.5 rounded text-[10px] font-mono uppercase">WON</span>;
      case 'lost':
        return <span className="bg-zinc-900 text-zinc-500 border border-zinc-800 px-2.5 py-0.5 rounded text-[10px] font-mono uppercase">LOST</span>;
      case 'submitted':
        return <span className="bg-zinc-900 text-white border border-zinc-700 px-2.5 py-0.5 rounded text-[10px] font-mono uppercase">SUBMITTED</span>;
      case 'evidence_gathering':
        return <span className="bg-zinc-900 text-zinc-300 border border-zinc-800 px-2.5 py-0.5 rounded text-[10px] font-mono uppercase">GATHERING</span>;
      default:
        return <span className="bg-black text-white border border-zinc-800 px-2.5 py-0.5 rounded text-[10px] font-mono uppercase">{status}</span>;
    }
  };

  const filteredDisputes = disputes.filter(d => {
    const query = searchQuery.toLowerCase();
    const matchRef = d.dispute_reference?.toLowerCase().includes(query);
    const matchCust = d.customer_name?.toLowerCase().includes(query) || d.customer_email?.toLowerCase().includes(query);
    const matchOrder = d.order_id?.toLowerCase().includes(query);
    return matchRef || matchCust || matchOrder;
  });

  const totalItems = filteredDisputes.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedDisputes = filteredDisputes.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6 text-left font-body">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Chargeback & Dispute Manager</h1>
          <p className="text-zinc-400 text-xs mt-1">Automated evidence compilation and payment gateway dispute representation.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-white text-black hover:bg-zinc-200 font-bold px-4 py-2 rounded text-xs uppercase tracking-wider transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Log Dispute</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-950 border-zinc-800 p-5 rounded-lg">
          <CardContent className="p-0">
            <div className="flex justify-between items-center text-xs font-mono uppercase tracking-wider text-zinc-400">
              <span>Win Rate</span>
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div className="text-3xl font-extrabold text-white mt-2 tracking-tight">
              {stats?.win_rate_percent !== undefined ? `${stats.win_rate_percent}%` : '0%'}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-1">Based on resolved disputes</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800 p-5 rounded-lg">
          <CardContent className="p-0">
            <div className="flex justify-between items-center text-xs font-mono uppercase tracking-wider text-zinc-400">
              <span>Open Disputes</span>
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
            <div className="text-3xl font-extrabold text-white mt-2 tracking-tight">
              {stats?.open_disputes || 0}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-1">Requires evidence submission</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800 p-5 rounded-lg">
          <CardContent className="p-0">
            <div className="flex justify-between items-center text-xs font-mono uppercase tracking-wider text-zinc-400">
              <span>Disputed Volume</span>
              <Clock className="h-4 w-4 text-white" />
            </div>
            <div className="text-3xl font-extrabold text-white mt-2 tracking-tight">
              ₹{(stats?.total_at_risk_amount || 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-1">Pending gateway review</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800 p-5 rounded-lg">
          <CardContent className="p-0">
            <div className="flex justify-between items-center text-xs font-mono uppercase tracking-wider text-zinc-400">
              <span>Recovered Revenue</span>
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
            <div className="text-3xl font-extrabold text-white mt-2 tracking-tight">
              ₹{(stats?.total_won_amount || 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-1">Funds recovered successfully</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center bg-black border border-zinc-800 rounded px-3.5 py-2 w-full sm:w-80 focus-within:border-white transition-colors">
          <Search className="h-3.5 w-3.5 text-zinc-500 mr-2.5" />
          <input
            type="text"
            placeholder="Search reference, customer, order..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs w-full text-white placeholder:text-zinc-600 font-mono"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-black border border-zinc-800 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-white"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="evidence_gathering">Evidence Gathering</option>
            <option value="submitted">Submitted</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>

          <select
            value={gatewayFilter}
            onChange={e => setGatewayFilter(e.target.value)}
            className="bg-black border border-zinc-800 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-white"
          >
            <option value="">All Gateways</option>
            <option value="razorpay">Razorpay</option>
            <option value="cashfree">Cashfree</option>
            <option value="stripe">Stripe</option>
            <option value="manual">Manual Log</option>
          </select>
        </div>
      </div>

      {/* Disputes Table */}
      <Card className="bg-zinc-950 border-zinc-800 overflow-hidden rounded-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] font-mono text-zinc-400 uppercase bg-black border-b border-zinc-800">
                <tr>
                  <th className="px-5 py-3.5">Reference / Gateway</th>
                  <th className="px-5 py-3.5">Customer / Order</th>
                  <th className="px-5 py-3.5">Reason</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Urgency</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 font-mono text-xs">
                      Loading dispute records...
                    </td>
                  </tr>
                ) : paginatedDisputes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 font-mono text-xs">
                      No disputes matching criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedDisputes.map(d => (
                    <tr key={d.id} className="hover:bg-zinc-900 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-mono font-bold text-white">{d.dispute_reference}</div>
                        <div className="text-[10px] text-zinc-500 font-mono uppercase mt-0.5">{d.payment_gateway}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-white font-medium">{d.customer_name || 'N/A'}</div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{d.order_id || 'No Order ID'}</div>
                      </td>
                      <td className="px-5 py-3.5 text-zinc-400">
                        {d.dispute_reason}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-white">
                        ₹{d.dispute_amount?.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        {getStatusBadge(d.status)}
                      </td>
                      <td className="px-5 py-3.5">
                        {getUrgencyBadge(d.urgency, d.response_deadline)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => navigate(`/dashboard/disputes/${d.id}`)}
                          className="text-xs text-white hover:bg-zinc-800 font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-colors"
                        >
                          Review Evidence
                        </button>
                      </td>
                    </tr>
                  ))
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
            Showing {startIndex + 1}-{endIndex} of {totalItems} disputes
          </span>
          <div className="flex items-center space-x-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="bg-black border border-zinc-800 text-white px-3 py-1.5 rounded hover:bg-zinc-900 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-zinc-400 font-bold px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="bg-black border border-zinc-800 text-white px-3 py-1.5 rounded hover:bg-zinc-900 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Manual Dispute Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white">Log Dispute Reference</h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDispute} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-zinc-400">Reference #</label>
                  <input
                    required
                    type="text"
                    value={formRef}
                    onChange={e => setFormRef(e.target.value)}
                    placeholder="disp_991823"
                    className="w-full bg-black border border-zinc-800 text-white text-xs px-3 py-2 rounded focus:outline-none focus:border-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-zinc-400">Amount (INR)</label>
                  <input
                    required
                    type="number"
                    value={formAmount}
                    onChange={e => setFormAmount(e.target.value)}
                    placeholder="4500"
                    className="w-full bg-black border border-zinc-800 text-white text-xs px-3 py-2 rounded focus:outline-none focus:border-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-zinc-400">Gateway</label>
                  <select
                    value={formGateway}
                    onChange={e => setFormGateway(e.target.value)}
                    className="w-full bg-black border border-zinc-800 text-white text-xs px-3 py-2 rounded focus:outline-none focus:border-white font-mono"
                  >
                    <option value="razorpay">Razorpay</option>
                    <option value="cashfree">Cashfree</option>
                    <option value="stripe">Stripe</option>
                    <option value="manual">Manual Log</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-zinc-400">Deadline</label>
                  <input
                    required
                    type="date"
                    value={formDeadline}
                    onChange={e => setFormDeadline(e.target.value)}
                    className="w-full bg-black border border-zinc-800 text-white text-xs px-3 py-2 rounded focus:outline-none focus:border-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-zinc-400">Customer Email</label>
                <input
                  type="email"
                  value={formCustEmail}
                  onChange={e => setFormCustEmail(e.target.value)}
                  placeholder="customer@email.com"
                  className="w-full bg-black border border-zinc-800 text-white text-xs px-3 py-2 rounded focus:outline-none focus:border-white font-mono"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-white text-black font-bold text-xs uppercase tracking-wider rounded hover:bg-zinc-200"
                >
                  {submitting ? 'Submitting...' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
