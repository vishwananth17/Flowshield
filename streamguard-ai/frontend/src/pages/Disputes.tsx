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
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Heading1, Heading3, Label, Caption } from '@/components/ui/Typography';
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
      <Badge variant="outline">
        Deadline: {label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'won':
        return <Badge variant="success" dot>WON</Badge>;
      case 'lost':
        return <Badge variant="danger" dot>LOST</Badge>;
      case 'submitted':
        return <Badge variant="info" dot>SUBMITTED</Badge>;
      case 'evidence_gathering':
        return <Badge variant="warning" dot pulse>GATHERING</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
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

  const columns = [
    {
      key: 'dispute_reference',
      header: 'Reference / Gateway',
      render: (row: any) => (
        <div>
          <div className="font-mono font-bold text-white">{row.dispute_reference}</div>
          <div className="text-[10px] text-[var(--text-muted)] font-mono uppercase mt-0.5">{row.payment_gateway}</div>
        </div>
      )
    },
    {
      key: 'customer_name',
      header: 'Customer / Order',
      render: (row: any) => (
        <div>
          <div className="text-[var(--text-primary)] font-medium">{row.customer_name || 'N/A'}</div>
          <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{row.order_id || 'No Order ID'}</div>
        </div>
      )
    },
    {
      key: 'dispute_reason',
      header: 'Reason',
      render: (row: any) => <span className="text-[var(--text-secondary)]">{row.dispute_reason}</span>
    },
    {
      key: 'dispute_amount',
      header: 'Amount',
      render: (row: any) => <span className="font-mono font-bold text-[var(--text-primary)]">₹{row.dispute_amount?.toLocaleString()}</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: any) => getStatusBadge(row.status)
    },
    {
      key: 'deadline',
      header: 'Deadline',
      render: (row: any) => getUrgencyBadge(row.urgency, row.response_deadline)
    },
    {
      key: 'action',
      header: 'Action',
      align: 'right' as const,
      render: (row: any) => (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => navigate(`/dashboard/disputes/${row.id}`)}
        >
          Review Evidence
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6 text-left font-body">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <Heading1>Chargeback & Dispute Manager</Heading1>
          <Caption className="mt-1 block">Automated evidence compilation and payment gateway dispute representation.</Caption>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          variant="gold"
          size="md"
          icon={<Plus className="h-4 w-4" />}
        >
          Log Dispute
        </Button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex justify-between items-center">
            <Label>Win Rate</Label>
            <TrendingUp className="h-4 w-4 text-[var(--color-success)]" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2 tracking-tight">
            {stats?.win_rate_percent !== undefined ? `${stats.win_rate_percent}%` : '0%'}
          </div>
          <Caption className="mt-1 block">Based on resolved disputes</Caption>
        </Card>

        <Card className="p-5">
          <div className="flex justify-between items-center">
            <Label>Open Disputes</Label>
            <AlertTriangle className="h-4 w-4 text-[var(--color-warning)]" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2 tracking-tight">
            {stats?.open_disputes || 0}
          </div>
          <Caption className="mt-1 block">Requires evidence submission</Caption>
        </Card>

        <Card className="p-5">
          <div className="flex justify-between items-center">
            <Label>Disputed Volume</Label>
            <Clock className="h-4 w-4 text-[var(--color-info)]" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2 tracking-tight">
            ₹{(stats?.total_at_risk_amount || 0).toLocaleString()}
          </div>
          <Caption className="mt-1 block">Pending gateway review</Caption>
        </Card>

        <Card className="p-5">
          <div className="flex justify-between items-center">
            <Label>Recovered Revenue</Label>
            <CheckCircle className="h-4 w-4 text-[var(--color-success)]" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2 tracking-tight">
            ₹{(stats?.total_won_amount || 0).toLocaleString()}
          </div>
          <Caption className="mt-1 block">Funds recovered successfully</Caption>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search reference, customer, order..."
            prefix={<Search className="h-3.5 w-3.5" />}
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[var(--bg-inset)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-2 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors h-11"
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
            className="bg-[var(--bg-inset)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-2 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors h-11"
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
      <Table 
        columns={columns}
        data={paginatedDisputes}
        loading={loading}
        keyExtractor={d => d.id}
        emptyState={
          <div className="text-center">
            <Caption>No disputes matching criteria.</Caption>
          </div>
        }
      />

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-4 text-xs font-mono">
          <span className="text-[var(--text-muted)]">
            Showing {startIndex + 1}-{endIndex} of {totalItems} disputes
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

      {/* Manual Dispute Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <Card className="max-w-lg w-full p-6 space-y-4 shadow-[var(--shadow-xl)] border border-[var(--border-default)]">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <Heading3>Log Dispute Reference</Heading3>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDispute} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  required
                  label="Reference #"
                  value={formRef}
                  onChange={e => setFormRef(e.target.value)}
                  placeholder="disp_991823"
                />
                <Input
                  required
                  type="number"
                  label="Amount (INR)"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  placeholder="4500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Gateway</label>
                  <select
                    value={formGateway}
                    onChange={e => setFormGateway(e.target.value)}
                    className="w-full h-11 bg-[var(--bg-inset)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] px-3 py-2 outline-none focus:border-[var(--color-primary)] transition-colors font-body"
                  >
                    <option value="razorpay">Razorpay</option>
                    <option value="cashfree">Cashfree</option>
                    <option value="stripe">Stripe</option>
                    <option value="manual">Manual Log</option>
                  </select>
                </div>
                <Input
                  required
                  type="date"
                  label="Deadline"
                  value={formDeadline}
                  onChange={e => setFormDeadline(e.target.value)}
                />
              </div>

              <Input
                type="email"
                label="Customer Email"
                value={formCustEmail}
                onChange={e => setFormCustEmail(e.target.value)}
                placeholder="customer@email.com"
              />

              <div className="flex justify-end space-x-3 pt-2 border-t border-[var(--border-default)]">
                <Button
                  variant="ghost"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  variant="gold"
                >
                  {submitting ? 'Submitting...' : 'Create Record'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
