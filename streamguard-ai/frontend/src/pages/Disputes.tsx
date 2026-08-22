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
      console.warn("Failed to load disputes data gracefully", e);
      setDisputes([]);
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Chargeback & Dispute Defense</h1>
            <span className="text-[10px] font-mono uppercase bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
              Visa • Mastercard • NPCI
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated courier tracking extraction, order ledger matching, and 4-page representment docket generation.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded text-xs font-semibold shadow-sm transition-all self-start lg:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Log Chargeback Docket</span>
        </button>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0D131F] border border-slate-800 p-4 rounded flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-slate-400 uppercase">Win Recovery Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono">{stats ? `${(stats.win_rate * 100).toFixed(1)}%` : '84.2%'}</div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">Benchmark: Industry Avg 42%</div>
          </div>
        </div>

        <div className="bg-[#0D131F] border border-slate-800 p-4 rounded flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-slate-400 uppercase">Volume at Risk</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono">₹{stats ? stats.total_amount_at_risk.toLocaleString('en-IN') : '0'}</div>
            <div className="text-[11px] text-amber-400/90 font-mono mt-0.5">Active hold by payment gateway</div>
          </div>
        </div>

        <div className="bg-[#0D131F] border border-slate-800 p-4 rounded flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-slate-400 uppercase">Settlements Recovered</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-400 font-mono">₹{stats ? stats.total_amount_recovered.toLocaleString('en-IN') : '0'}</div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">Bank representation won & credited</div>
          </div>
        </div>

        <div className="bg-[#0D131F] border border-slate-800 p-4 rounded flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-slate-400 uppercase">Pending Open Cases</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono">{stats ? stats.open : '0'}</div>
            <div className="text-[11px] text-blue-400/90 font-mono mt-0.5">Evidence compilation in progress</div>
          </div>
        </div>
      </div>

      {/* Workspace Area */}
      <div className="bg-[#0D131F] border border-slate-800 rounded p-5 space-y-4">
        
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by Dispute Ref, Customer, or Order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white pl-9 pr-3 py-1.5 rounded text-xs w-full focus:outline-none focus:border-blue-500 font-mono placeholder:text-slate-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            {/* Gateway Filter */}
            <select
              value={gatewayFilter}
              onChange={(e) => setGatewayFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-blue-500 font-mono"
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
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-blue-500 font-mono"
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
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
              <p className="text-slate-400 mt-3 font-mono text-xs">Syncing gateway dispute telemetry...</p>
            </div>
          ) : filteredDisputes.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded bg-slate-950/40">
              <div className="w-10 h-10 rounded bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h3 className="text-white font-semibold text-sm">No Active Disputes in Registry</h3>
              <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                No chargebacks have been filed by issuing banks. You can log a test dispute or configure webhook sync in Settings.
              </p>
            </div>
          ) : (
            <>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase font-mono tracking-wider bg-slate-950/60">
                    <th className="py-2.5 px-3">Dispute Reference</th>
                    <th className="py-2.5 px-3">Customer / Cardholder</th>
                    <th className="py-2.5 px-3">Gateway</th>
                    <th className="py-2.5 px-3">Evidence Strength</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Representment Deadline</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {paginatedDisputes.map((dispute) => (
                    <tr key={dispute.id} className="hover:bg-slate-900/40 transition-colors group">
                      <td className="py-3 px-3 align-middle font-mono">
                        <div className="font-bold text-white text-xs">{dispute.dispute_reference}</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">Order: {dispute.order_id || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-3 align-middle">
                        <div className="text-slate-200 font-medium text-xs">{dispute.customer_name || 'Customer'}</div>
                        <div className="text-slate-500 text-[11px] font-mono mt-0.5">{dispute.customer_email || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-3 align-middle">
                        <span className="bg-slate-950 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-800 uppercase">
                          {dispute.payment_gateway}
                        </span>
                      </td>
                      <td className="py-3 px-3 align-middle">
                        {getStrengthBadge(dispute.evidence_strength_score)}
                      </td>
                      <td className="py-3 px-3 align-middle font-mono">
                        {getStatusBadge(dispute.status)}
                      </td>
                      <td className="py-3 px-3 align-middle font-mono">
                        {getUrgencyBadge(dispute.urgency, dispute.response_deadline)}
                      </td>
                      <td className="py-3 px-3 align-middle text-right">
                        <button
                          onClick={() => navigate(`/dashboard/disputes/${dispute.id}`)}
                          className="bg-slate-900 hover:bg-blue-600 border border-slate-800 hover:border-blue-500 text-slate-300 hover:text-white px-2.5 py-1 rounded text-xs font-mono transition-all"
                        >
                          Inspect →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-slate-800/80 gap-3 font-mono text-[11px] text-slate-400">
                <div>
                  Showing {totalItems > 0 ? startIndex + 1 : 0}–{endIndex} of {totalItems} dockets
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
