import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableActionCell } from '@/components/ui/Table';
import { 
  Shield, 
  Download, 
  Filter, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  ChevronRight,
  X,
  FileText,
  Truck,
  User,
  CreditCard
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

interface Dispute {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  gateway: string;
  customer_name: string;
  reason: string;
  days_left: number;
  status: 'open' | 'evidence_gathering' | 'submitted' | 'won' | 'lost';
  evidence_count: number; // out of 5
  created_at: string;
}

const MOCK_DISPUTES: Dispute[] = [
  {
    id: 'disp_9918skL90',
    order_id: 'ORD-9918',
    amount: 14500,
    currency: '₹',
    gateway: 'Razorpay',
    customer_name: 'Rahul Sharma',
    reason: 'Product not received',
    days_left: 2,
    status: 'open',
    evidence_count: 4,
    created_at: '2026-08-20T10:14:00Z',
  },
  {
    id: 'disp_9914abX21',
    order_id: 'ORD-9914',
    amount: 3200,
    currency: '₹',
    gateway: 'Cashfree',
    customer_name: 'Pooja Verma',
    reason: 'Fraudulent transaction',
    days_left: 4,
    status: 'evidence_gathering',
    evidence_count: 3,
    created_at: '2026-08-18T14:30:00Z',
  },
  {
    id: 'disp_9902mmP44',
    order_id: 'ORD-9902',
    amount: 28900,
    currency: '₹',
    gateway: 'Razorpay',
    customer_name: 'Vikram Mehta',
    reason: 'Duplicate billing',
    days_left: 7,
    status: 'submitted',
    evidence_count: 5,
    created_at: '2026-08-15T09:00:00Z',
  },
  {
    id: 'disp_9881zzK12',
    order_id: 'ORD-9881',
    amount: 9500,
    currency: '₹',
    gateway: 'PayU',
    customer_name: 'Aditi Rao',
    reason: 'Item defective',
    days_left: 0,
    status: 'won',
    evidence_count: 5,
    created_at: '2026-08-10T12:00:00Z',
  },
  {
    id: 'disp_9870kkL89',
    order_id: 'ORD-9870',
    amount: 1200,
    currency: '₹',
    gateway: 'Razorpay',
    customer_name: 'Karan Singh',
    reason: 'Unrecognized charge',
    days_left: 0,
    status: 'won',
    evidence_count: 5,
    created_at: '2026-08-08T16:20:00Z',
  },
  {
    id: 'disp_9862qqW11',
    order_id: 'ORD-9862',
    amount: 45000,
    currency: '₹',
    gateway: 'Cashfree',
    customer_name: 'Suresh Raina',
    reason: 'Product not received',
    days_left: 0,
    status: 'lost',
    evidence_count: 2,
    created_at: '2026-08-01T11:15:00Z',
  }
];

export default function Disputes() {
  const [disputes, setDisputes] = useState<Dispute[]>(MOCK_DISPUTES);
  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'won' | 'lost'>('all');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(MOCK_DISPUTES[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        const res = await api.get('/disputes');
        if (res.data && res.data.length > 0) {
          // Normalize server disputes
          const mapped: Dispute[] = res.data.map((d: any) => ({
            id: d.id || `disp_${d.order_id}`,
            order_id: d.order_id || 'ORD-UNKNOWN',
            amount: d.amount || 0,
            currency: d.currency || '₹',
            gateway: d.gateway || 'Razorpay',
            customer_name: d.customer_name || 'Customer',
            reason: d.reason || 'Chargeback',
            days_left: d.days_left ?? 3,
            status: d.status || 'open',
            evidence_count: d.evidence_count ?? 4,
            created_at: d.created_at || new Date().toISOString(),
          }));
          setDisputes(mapped);
          setSelectedDispute(mapped[0]);
        }
      } catch (e) {
        // use fallback mock
      }
    };
    fetchDisputes();
  }, []);

  const counts = {
    all: disputes.length,
    open: disputes.filter(d => d.status === 'open' || d.status === 'evidence_gathering').length,
    won: disputes.filter(d => d.status === 'won').length,
    lost: disputes.filter(d => d.status === 'lost').length,
  };

  const filtered = disputes.filter(d => {
    const matchesFilter = 
      activeFilter === 'all' ? true :
      activeFilter === 'open' ? (d.status === 'open' || d.status === 'evidence_gathering' || d.status === 'submitted') :
      d.status === activeFilter;

    const matchesSearch = 
      d.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.id.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleAutoRepresent = async (dispute: Dispute) => {
    setIsSubmitting(true);
    try {
      await new Promise(r => setTimeout(r, 900));
      toast.success(`Evidence dossier auto-submitted to ${dispute.gateway}! Status updated to SUBMITTED.`);
      setDisputes(prev => prev.map(item => item.id === dispute.id ? { ...item, status: 'submitted' } : item));
      if (selectedDispute?.id === dispute.id) {
        setSelectedDispute(prev => prev ? { ...prev, status: 'submitted' } : null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-h1 text-text-primary">Dispute Defense Desk</h1>
          <p className="type-sm text-text-secondary mt-0.5">
            Autonomous evidence collection, courier verification, and gateway representment.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => toast.success("Exported dispute history to CSV")}>
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar (Not tabs) */}
      <div className="flex items-center justify-between border-b border-border-200 pb-px gap-4 overflow-x-auto">
        <div className="flex items-center space-x-6 text-[13px] font-medium font-sans select-none">
          {(['all', 'open', 'won', 'lost'] as const).map((filter) => {
            const isActive = activeFilter === filter;
            const label = filter === 'all' ? `All (${counts.all})` :
                          filter === 'open' ? `Open (${counts.open})` :
                          filter === 'won' ? `Won (${counts.won})` : `Lost (${counts.lost})`;

            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`pb-3 font-semibold transition-colors duration-fast relative ${
                  isActive ? 'text-text-primary' : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                <span>{label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="w-56 pb-2">
          <input
            type="text"
            placeholder="Search order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-7 bg-surface-200 border border-border-200 rounded text-xs px-2.5 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Panel: Dispute List (56% / 7 cols) */}
        <Card variant="data" padding="none" className="lg:col-span-7 overflow-hidden">
          <div className="divide-y divide-border-100">
            {filtered.length === 0 ? (
              <div className="p-12 text-center text-text-tertiary text-xs">
                No dispute records matching current filter.
              </div>
            ) : (
              filtered.map((disp) => {
                const isCrit = disp.days_left > 0 && disp.days_left <= 2;
                const isWarn = disp.days_left > 2 && disp.days_left <= 5;
                const isSelected = selectedDispute?.id === disp.id;

                return (
                  <div
                    key={disp.id}
                    onClick={() => setSelectedDispute(disp)}
                    className={`p-4 transition-all duration-fast cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected ? 'bg-surface-400' : 'hover:bg-surface-300/60'
                    } ${
                      isCrit
                        ? 'border-l-2 border-l-status-block bg-status-block/[0.02]'
                        : isWarn
                        ? 'border-l-2 border-l-status-review'
                        : 'border-l-2 border-l-transparent'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-text-primary">{disp.order_id}</span>
                        <span className="text-xs text-text-tertiary">·</span>
                        <span className="text-xs text-text-secondary">{disp.customer_name}</span>
                        <span className="text-xs text-text-tertiary">({disp.gateway})</span>
                      </div>
                      <div className="text-xs text-text-tertiary">
                        Reason: <span className="text-text-secondary">{disp.reason}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div className="space-y-1">
                        <div className="font-sans font-bold text-sm text-text-primary">
                          {disp.currency}{disp.amount.toLocaleString('en-IN')}
                        </div>

                        {/* Evidence Strength Sparkline (5 squares) */}
                        <div className="flex items-center gap-1 justify-end" title={`${disp.evidence_count}/5 Evidence Collected`}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={`w-1.5 h-1.5 rounded-xs ${
                                i < disp.evidence_count ? 'bg-status-allow' : 'bg-surface-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="w-20 text-right">
                        {disp.days_left > 0 ? (
                          <span className={`font-mono text-xs font-bold block ${isCrit ? 'text-status-block' : 'text-status-review'}`}>
                            {disp.days_left}d left
                          </span>
                        ) : (
                          <Badge variant={disp.status === 'won' ? 'allow' : 'neutral'} size="sm">
                            {disp.status.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Right Panel: Dispute Detail Drawer / Panel (44% / 5 cols) */}
        <div className="lg:col-span-5">
          {selectedDispute ? (
            <Card variant="data" padding="md" className="space-y-5 sticky top-20">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border-100 pb-3.5">
                <div>
                  <span className="type-label text-text-tertiary block">Dossier Telemetry</span>
                  <h3 className="type-h3 text-text-primary font-mono mt-0.5">{selectedDispute.order_id}</h3>
                </div>
                <Badge
                  variant={selectedDispute.status === 'won' ? 'allow' : selectedDispute.status === 'lost' ? 'block' : 'review'}
                  size="sm"
                >
                  {selectedDispute.status.toUpperCase()}
                </Badge>
              </div>

              {/* Dispute Metadata Details */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-surface-200 border border-border-100 p-2.5 rounded-sm">
                  <span className="text-text-tertiary block text-[10px] uppercase">Disputed Amount</span>
                  <span className="font-bold text-text-primary text-sm">₹{selectedDispute.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-surface-200 border border-border-100 p-2.5 rounded-sm">
                  <span className="text-text-tertiary block text-[10px] uppercase">Gateway Channel</span>
                  <span className="font-bold text-text-primary text-sm">{selectedDispute.gateway}</span>
                </div>
              </div>

              {/* Evidence Checklist Docket */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="type-label text-text-secondary">Compiled Evidence (5 Checks)</span>
                  <span className="font-mono text-xs text-status-allow font-bold">
                    {selectedDispute.evidence_count}/5 Verified
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-sm bg-surface-200 border border-border-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-status-allow" />
                      <span className="text-text-primary">Shopify Order & Invoice Receipt</span>
                    </div>
                    <span className="font-mono text-[10px] text-text-tertiary">#ORD-9918</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-sm bg-surface-200 border border-border-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-status-allow" />
                      <span className="text-text-primary">Delhivery Air Waybill Confirmation</span>
                    </div>
                    <span className="font-mono text-[10px] text-status-allow">DELIVERED</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-sm bg-surface-200 border border-border-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-status-allow" />
                      <span className="text-text-primary">Signed Proof-of-Delivery Receipt</span>
                    </div>
                    <span className="font-mono text-[10px] text-text-tertiary">Signed by R. Sharma</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-sm bg-surface-200 border border-border-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-status-allow" />
                      <span className="text-text-primary">Terms of Service Acceptance Log</span>
                    </div>
                    <span className="font-mono text-[10px] text-text-tertiary">IP Verified</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-sm bg-surface-200 border border-border-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-text-primary">Bank Representment PDF Cover Letter</span>
                    </div>
                    <span className="font-mono text-[10px] text-cyan-400">Compiled</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-border-100 space-y-2">
                <Button
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  onClick={() => handleAutoRepresent(selectedDispute)}
                  className="w-full justify-center"
                >
                  <span>Auto-Submit Evidence to {selectedDispute.gateway}</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => toast.success("Downloaded 4-page court-grade evidence PDF")}
                  className="w-full justify-center"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download Representment PDF Docket</span>
                </Button>
              </div>

            </Card>
          ) : (
            <Card variant="data" padding="md" className="p-12 text-center text-text-tertiary text-xs">
              Select a dispute to view evidence and representment telemetry.
            </Card>
          )}
        </div>

      </div>

    </div>
  );
}
