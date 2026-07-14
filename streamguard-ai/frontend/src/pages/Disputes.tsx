import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  Search,
  Plus,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Info,
  Calendar,
  AlertCircle
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

      const res = await api.post('/disputes', payload);
      toast.success("Dispute logged. Automated evidence gathering sequence started!", { id: toastId });
      
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

  const getUrgencyBadge = (urgency: string, deadlineStr: string) => {
    const deadline = new Date(deadlineStr);
    const label = deadline.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    
    switch (urgency) {
      case 'expired':
        return <span className="bg-gray-800/80 text-gray-500 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border border-gray-700">Expired ({label})</span>;
      case 'critical':
        return <span className="bg-red-500/10 text-red-500 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border border-red-500/20 animate-pulse">Critical ({label})</span>;
      case 'warning':
        return <span className="bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border border-amber-500/20">Action Required ({label})</span>;
      default:
        return <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border border-emerald-500/20">Normal ({label})</span>;
    }
  };

  const getStrengthBadge = (score: number) => {
    if (score >= 70) {
      return (
        <div className="flex items-center space-x-1.5 text-emerald-400">
          <TrendingUp className="h-4 w-4" />
          <span className="text-xs font-bold">Strong Case ({score}%)</span>
        </div>
      );
    } else if (score >= 40) {
      return (
        <div className="flex items-center space-x-1.5 text-amber-400">
          <Info className="h-4 w-4" />
          <span className="text-xs font-bold">Moderate ({score}%)</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center space-x-1.5 text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span className="text-xs font-bold">Weak ({score}%)</span>
        </div>
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'won':
        return <span className="text-emerald-400 font-bold text-xs uppercase flex items-center"><CheckCircle className="h-3 w-3 mr-1" /> Won</span>;
      case 'lost':
        return <span className="text-red-400 font-bold text-xs uppercase flex items-center"><XCircle className="h-3 w-3 mr-1" /> Lost</span>;
      case 'accepted':
        return <span className="text-gray-400 font-bold text-xs uppercase flex items-center"><CheckCircle className="h-3 w-3 mr-1" /> Accepted</span>;
      case 'evidence_gathering':
        return <span className="text-blue-400 font-bold text-xs uppercase flex items-center animate-pulse"><Clock className="h-3 w-3 mr-1" /> Gathering</span>;
      default:
        return <span className="text-amber-400 font-bold text-xs uppercase flex items-center"><Clock className="h-3 w-3 mr-1" /> Open</span>;
    }
  };

  const filteredDisputes = disputes.filter(d => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      d.dispute_reference.toLowerCase().includes(query) ||
      (d.customer_name || '').toLowerCase().includes(query) ||
      (d.customer_email || '').toLowerCase().includes(query) ||
      (d.order_id || '').toLowerCase().includes(query)
    );
  });

  const totalItems = filteredDisputes.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedDisputes = filteredDisputes.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-8 relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Dispute Resolution Workspace</h1>
          <p className="text-gray-400 mt-1">Automated evidence compilation and chargeback defense center.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-blue-900/20 transition-all font-bold text-xs self-start lg:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Log Chargeback Dispute</span>
        </button>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="backdrop-blur-xl bg-[#111827]/60 border-[#1F2937]/80">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Win Rate</p>
              <p className="text-3xl font-bold mt-2 text-white">{stats ? `${(stats.win_rate * 100).toFixed(1)}%` : '0.0%'}</p>
              <p className="text-[10px] text-emerald-400 mt-1 flex items-center font-bold">
                <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" /> High chargeback win recovery rate
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-[#111827]/60 border-[#1F2937]/80">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Volume at Risk</p>
              <p className="text-3xl font-bold mt-2 text-white">₹{stats ? stats.total_amount_at_risk.toLocaleString('en-IN') : '0'}</p>
              <p className="text-[10px] text-amber-400 mt-1 flex items-center font-bold">
                <AlertTriangle className="h-3.5 w-3.5 mr-0.5" /> Blocked payment gateway assets
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-500/10 text-amber-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-[#111827]/60 border-[#1F2937]/80">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Amount Recovered</p>
              <p className="text-3xl font-bold mt-2 text-white">₹{stats ? stats.total_amount_recovered.toLocaleString('en-IN') : '0'}</p>
              <p className="text-[10px] text-emerald-400 mt-1 flex items-center font-bold">
                <CheckCircle className="h-3.5 w-3.5 mr-0.5" /> Dispute settlements won
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-[#111827]/60 border-[#1F2937]/80">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Pending Open Cases</p>
              <p className="text-3xl font-bold mt-2 text-white">{stats ? stats.open : '0'}</p>
              <p className="text-[10px] text-gray-400 mt-1 flex items-center">
                <Clock className="h-3.5 w-3.5 mr-0.5" /> Gathering/Response compiled
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-blue-500/10 text-blue-400">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workspace Area */}
      <div className="bg-[#111827]/60 border border-[#1F2937]/80 rounded-2xl p-6 backdrop-blur-xl space-y-6">
        
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search disputes, customer or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#111827] border border-[#1F2937] text-white pl-10 pr-4 py-2 rounded-xl text-sm w-full focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            {/* Gateway Filter */}
            <select
              value={gatewayFilter}
              onChange={(e) => setGatewayFilter(e.target.value)}
              className="bg-[#111827] border border-[#1F2937] text-gray-300 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 font-bold"
            >
              <option value="">All Gateways</option>
              <option value="razorpay">Razorpay</option>
              <option value="cashfree">Cashfree</option>
              <option value="payu">PayU</option>
              <option value="stripe">Stripe</option>
              <option value="manual">Manual</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#111827] border border-[#1F2937] text-gray-300 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 font-bold"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="evidence_gathering">Evidence Gathering</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
              <option value="accepted">Accepted</option>
            </select>
          </div>
        </div>

        {/* Dispute Listing Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
              <p className="text-gray-400 mt-4 font-bold text-sm">Syncing dispute registries...</p>
            </div>
          ) : filteredDisputes.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-[#1F2937] rounded-xl">
              <div className="w-12 h-12 rounded-full bg-[#1F2937] flex items-center justify-center mx-auto mb-4 border border-[#374151]">
                <ShieldAlert className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-white font-bold">No active disputes found</h3>
              <p className="text-gray-400 text-xs mt-1">Try relaxing your search parameters, or log a dispute manually.</p>
            </div>
          ) : (
            <>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1F2937] text-gray-400 text-[10px] uppercase font-black tracking-wider">
                    <th className="pb-3 pr-4">Dispute Reference</th>
                    <th className="pb-3 px-4">Customer Details</th>
                    <th className="pb-3 px-4">Gateway</th>
                    <th className="pb-3 px-4">Evidence Strength</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 px-4">Response Deadline</th>
                    <th className="pb-3 pl-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2937]/40">
                  {paginatedDisputes.map((dispute) => (
                    <tr key={dispute.id} className="hover:bg-[#1F2937]/15 transition-colors group">
                      <td className="py-4 pr-4 align-middle">
                        <div className="font-bold text-white text-sm">{dispute.dispute_reference}</div>
                        <div className="text-gray-400 text-xs font-mono mt-0.5">Order: {dispute.order_id || 'N/A'}</div>
                      </td>
                      <td className="py-4 px-4 align-middle">
                        <div className="text-white text-sm font-semibold">{dispute.customer_name || 'Razorpay Client'}</div>
                        <div className="text-gray-400 text-xs mt-0.5">{dispute.customer_email || 'N/A'}</div>
                      </td>
                      <td className="py-4 px-4 align-middle">
                        <span className="bg-[#1F2937]/80 text-gray-300 px-2 py-0.5 rounded text-[10px] font-bold border border-gray-700 uppercase">{dispute.payment_gateway}</span>
                      </td>
                      <td className="py-4 px-4 align-middle">
                        {getStrengthBadge(dispute.evidence_strength_score)}
                      </td>
                      <td className="py-4 px-4 align-middle">
                        {getStatusBadge(dispute.status)}
                      </td>
                      <td className="py-4 px-4 align-middle">
                        {getUrgencyBadge(dispute.urgency, dispute.response_deadline)}
                      </td>
                      <td className="py-4 pl-4 align-middle text-right">
                        <button
                          onClick={() => navigate(`/dashboard/disputes/${dispute.id}`)}
                          className="bg-blue-600/10 hover:bg-blue-600 border border-blue-500/20 text-blue-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-[#1F2937]/80 gap-4 mt-4">
                <div className="text-xs text-gray-400 font-medium">
                  Showing {totalItems > 0 ? startIndex + 1 : 0}–{endIndex} of {totalItems} results
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-[#1F2937] bg-[#111827] text-xs font-bold text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-[#1F2937] bg-[#111827] text-gray-400 hover:text-white'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-[#1F2937] bg-[#111827] text-xs font-bold text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Manual Dispute Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#111827] border border-[#1F2937] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative"
          >
            <div className="flex justify-between items-center pb-4 border-b border-[#1F2937]">
              <h2 className="text-lg font-bold text-white flex items-center"><Plus className="h-5 w-5 mr-2 text-blue-400" /> Log Dispute Manually</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white text-lg">&times;</button>
            </div>

            <form onSubmit={handleCreateDispute} className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Dispute Reference (ID) *</label>
                  <input
                    type="text"
                    required
                    placeholder="disp_PzX891HskL"
                    value={formRef}
                    onChange={(e) => setFormRef(e.target.value)}
                    className="bg-[#111827] border border-[#1F2937] text-white p-2.5 rounded-xl text-xs w-full focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Dispute Amount (INR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="4999.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="bg-[#111827] border border-[#1F2937] text-white p-2.5 rounded-xl text-xs w-full focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Payment Gateway</label>
                  <select
                    value={formGateway}
                    onChange={(e) => setFormGateway(e.target.value)}
                    className="bg-[#111827] border border-[#1F2937] text-white p-2.5 rounded-xl text-xs w-full focus:outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="razorpay">Razorpay</option>
                    <option value="cashfree">Cashfree</option>
                    <option value="payu">PayU</option>
                    <option value="stripe">Stripe</option>
                    <option value="manual">Manual/Bank</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Dispute Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="bg-[#111827] border border-[#1F2937] text-white p-2.5 rounded-xl text-xs w-full focus:outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="chargeback">Chargeback</option>
                    <option value="dispute">UPI Dispute</option>
                    <option value="refund_claim">Refund Claim</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Dispute Reason</label>
                  <select
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    className="bg-[#111827] border border-[#1F2937] text-white p-2.5 rounded-xl text-xs w-full focus:outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="Product not received">Product not received</option>
                    <option value="Defective merchandise">Defective/Damaged</option>
                    <option value="Fraudulent transaction">Unrecognized/Fraud</option>
                    <option value="Duplicate payment">Duplicate charging</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Response Deadline *</label>
                  <input
                    type="date"
                    required
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="bg-[#111827] border border-[#1F2937] text-white p-2.5 rounded-xl text-xs w-full focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">External Transaction Ref (ID)</label>
                  <input
                    type="text"
                    placeholder="pay_PzX891HskL"
                    value={formTxId}
                    onChange={(e) => setFormTxId(e.target.value)}
                    className="bg-[#111827] border border-[#1F2937] text-white p-2.5 rounded-xl text-xs w-full focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="border-t border-[#1F2937] pt-3">
                <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-3">Customer Information (Recommended)</h4>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Customer Name</label>
                    <input
                      type="text"
                      placeholder="Rahul Sharma"
                      value={formCustName}
                      onChange={(e) => setFormCustName(e.target.value)}
                      className="bg-[#111827] border border-[#1F2937] text-white p-2.5 rounded-xl text-xs w-full focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="rahul@gmail.com"
                      value={formCustEmail}
                      onChange={(e) => setFormCustEmail(e.target.value)}
                      className="bg-[#111827] border border-[#1F2937] text-white p-2.5 rounded-xl text-xs w-full focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Phone</label>
                    <input
                      type="text"
                      placeholder="9988776655"
                      value={formCustPhone}
                      onChange={(e) => setFormCustPhone(e.target.value)}
                      className="bg-[#111827] border border-[#1F2937] text-white p-2.5 rounded-xl text-xs w-full focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Store Order Reference (ID)</label>
                  <input
                    type="text"
                    placeholder="ORD-998811"
                    value={formOrderId}
                    onChange={(e) => setFormOrderId(e.target.value)}
                    className="bg-[#111827] border border-[#1F2937] text-white p-2.5 rounded-xl text-xs w-full focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 justify-end pt-4 border-t border-[#1F2937]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-transparent border border-[#1F2937] hover:border-gray-500 text-gray-400 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2"
                >
                  {submitting && <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin mr-1.5" />}
                  <span>Save Dispute & Gather</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
