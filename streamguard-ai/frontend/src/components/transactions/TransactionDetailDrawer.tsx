import React, { useState } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { RiskScore } from '@/components/ui/RiskScore';
import { SignalCard } from '@/components/ui/SignalCard';
import { Timeline } from '@/components/ui/Timeline';
import type { TimelineEvent } from '@/components/ui/Timeline';
import { Button } from '@/components/ui/Button';
import { Check, Flag, Ban, ChevronDown, ChevronUp, UserCheck, ExternalLink, Smartphone, Truck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export interface TransactionRecord {
  id: string; // e.g. TXN-10483
  amount: number;
  currency: string;
  customer: string;
  riskScore: number;
  status: 'APPROVED' | 'REVIEW' | 'BLOCKED';
  time: string;
  timestamp: string;
  merchant: string;
  category: string;
  location: string;
  device: string;
  ipAddress: string;
  threeDsResult: string;
  // India & UPI Telemetry
  paymentMethod?: 'upi' | 'card' | 'cod' | 'netbanking' | 'wallet';
  gateway?: 'razorpay' | 'cashfree' | 'phonepe' | 'stripe' | 'payu';
  vpa?: string;
  upiApp?: string;
  upiFlowType?: 'intent' | 'collect';
  bankRefNo?: string;
  // D2C Delivery & RTO Risk
  isCod?: boolean;
  deliveryPincode?: string;
  rtoRiskScore?: number;
  codRecommendation?: 'ALLOW_COD' | 'REQUIRE_PREPAID_UPI' | 'BLOCK';
  signals: Array<{
    name: string;
    description: string;
    impact: number;
    severity: 'critical' | 'high' | 'medium' | 'low';
  }>;
  timeline: TimelineEvent[];
  customerContext: {
    accountAge: string;
    priorTransactions: number;
    priorDisputes: number;
    knownDevices: number;
  };
}

export interface TransactionDetailDrawerProps {
  transaction: TransactionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (id: string, newStatus: 'APPROVED' | 'REVIEW' | 'BLOCKED') => void;
}

export const TransactionDetailDrawer: React.FC<TransactionDetailDrawerProps> = ({
  transaction,
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const [isCustomerContextOpen, setIsCustomerContextOpen] = useState(false);

  if (!transaction) return null;

  const handleApprove = () => {
    if (onStatusChange) onStatusChange(transaction.id, 'APPROVED');
    toast.success(`Transaction ${transaction.id} approved and captured.`);
    onClose();
  };

  const handleFlag = () => {
    if (onStatusChange) onStatusChange(transaction.id, 'REVIEW');
    toast.warning(`Transaction ${transaction.id} escalated to review queue.`);
    onClose();
  };

  const handleBlock = () => {
    if (onStatusChange) onStatusChange(transaction.id, 'BLOCKED');
    toast.error(`Transaction ${transaction.id} blocked. Card fingerprint added to blocklist.`);
    onClose();
  };

  const statusBadgeColor =
    transaction.status === 'APPROVED'
      ? 'bg-[var(--status-success-bg)] text-[var(--status-success-text)] border-[var(--status-success-border)]'
      : transaction.status === 'REVIEW'
      ? 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border-[var(--status-warning-border)]'
      : 'bg-[var(--status-error-bg)] text-[var(--status-error-text)] border-[var(--status-error-border)]';

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="space-y-2">
          {/* Row 1: Transaction ID mono */}
          <div className="text-[12px] font-mono text-[var(--text-secondary)] font-medium">
            {transaction.id}
          </div>

          {/* Row 2: Amount (28px Inter 700) + RiskBadge lg */}
          <div className="flex items-center justify-between">
            <div className="text-[28px] font-bold font-sans text-[var(--text-primary)] tabular-numbers tracking-tight">
              {transaction.currency === 'INR' ? '₹' : '$'}
              {transaction.amount.toLocaleString('en-IN')}
            </div>
            <RiskBadge
              level={
                transaction.riskScore >= 85 ? 'critical' :
                transaction.riskScore >= 70 ? 'high' :
                transaction.riskScore >= 35 ? 'medium' :
                'low'
              }
              score={transaction.riskScore}
              size="lg"
            />
          </div>

          {/* Row 3: Status Badge + UPI/COD Badge + Timestamp */}
          <div className="flex items-center gap-2 pt-0.5 flex-wrap">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-[var(--radius-xs)] border text-[11px] font-semibold font-mono tracking-wide ${statusBadgeColor}`}
            >
              {transaction.status}
            </span>

            {/* Native India UPI Telemetry Badge */}
            {(transaction.paymentMethod === 'upi' || transaction.vpa) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-xs)] border text-[11px] font-semibold font-mono bg-blue-500/10 text-blue-400 border-blue-500/20">
                <Smartphone size={11} />
                UPI · {transaction.upiApp || 'Direct'}
              </span>
            )}

            {/* D2C Cash on Delivery Badge */}
            {transaction.isCod && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-xs)] border text-[11px] font-semibold font-mono bg-amber-500/10 text-amber-400 border-amber-500/20">
                <Truck size={11} />
                Cash on Delivery
              </span>
            )}

            <span className="text-[12px] text-[var(--text-tertiary)] font-mono">
              {transaction.time}
            </span>
          </div>
        </div>
      }
      footer={
        /* Action Buttons: Context-Aware */
        <div className="flex items-center justify-end gap-2 w-full">
          {transaction.status === 'REVIEW' ? (
            <>
              <Button variant="danger" size="sm" onClick={handleBlock}>
                Block Transaction
              </Button>
              <Button variant="primary" size="sm" onClick={handleApprove}>
                Approve & Capture
              </Button>
            </>
          ) : transaction.status === 'APPROVED' ? (
            <>
              <Button variant="ghost" size="sm" onClick={handleBlock}>
                Block
              </Button>
              <Button variant="secondary" size="sm" onClick={handleFlag}>
                Flag for Review
              </Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={handleApprove}>
              Unblock Transaction
            </Button>
          )}
        </div>
      }
    >
      {/* 5.2 — RISK SCORE SECTION */}
      <section className="space-y-4">
        <RiskScore score={transaction.riskScore} />

        {/* ── INDIA-SPECIFIC DEFENSE ALERTS ── */}
        {/* 1. Cybercrime 1930 Account Freeze Defense Banner */}
        {transaction.signals.some(s => s.name.toLowerCase().includes('1930') || s.name.toLowerCase().includes('freeze') || s.name.toLowerCase().includes('cybercrime') || s.description.toLowerCase().includes('1930')) && (
          <div className="p-3.5 rounded-[var(--radius-md)] bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-300">
            <ShieldAlert size={18} className="text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-rose-200 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                Cybercrime 1930 Account Freeze Defense
              </div>
              <p className="text-[11px] text-rose-300/90 mt-1 leading-relaxed">
                This transaction matches known cybercrime mule and burner VPA clusters. Auto-blocking this payment prevents your merchant Razorpay MID and nodal bank account from being frozen under Section 102 CrPC by law enforcement.
              </p>
            </div>
          </div>
        )}

        {/* 2. D2C RTO Risk & Courier Defense Card */}
        {transaction.rtoRiskScore !== undefined && (
          <div className={`p-3.5 rounded-[var(--radius-md)] border flex items-start gap-3 text-xs ${
            transaction.rtoRiskScore >= 70
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
          }`}>
            <Truck size={18} className={`shrink-0 mt-0.5 ${transaction.rtoRiskScore >= 70 ? 'text-amber-400' : 'text-emerald-400'}`} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wide text-[11px]">
                  {transaction.rtoRiskScore >= 70 ? 'High RTO (Return-to-Origin) Risk' : 'Healthy D2C Delivery Profile'}
                </span>
                <span className="font-mono font-bold text-[12px]">{transaction.rtoRiskScore} / 100</span>
              </div>
              <p className="text-[11px] mt-1 leading-relaxed opacity-95">
                {transaction.codRecommendation === 'REQUIRE_PREPAID_UPI'
                  ? `Courier rejection probability in pincode ${transaction.deliveryPincode || 'cluster'} is over 40%. Recommended action: Convert COD to Prepaid UPI with 5% discount incentive to save ₹180 courier RTO charges.`
                  : transaction.codRecommendation === 'BLOCK'
                  ? 'Historical refusal rate exceeds 80% for this customer hash. Recommended action: Cancel dispatch.'
                  : 'Recipient address and device reputation confirmed. Safe for standard courier delivery.'}
              </p>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-[var(--border-subtle)] space-y-3">
          <div className="text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Why was this flagged?
          </div>
          <div className="space-y-2">
            {transaction.signals.map((sig, idx) => (
              <SignalCard
                key={idx}
                severity={sig.severity}
                signalName={sig.name}
                description={sig.description}
                impact={sig.impact}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 5.3 — TRANSACTION DETAILS SECTION */}
      <section className="pt-4 border-t border-[var(--border-subtle)] space-y-3">
        <div className="text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          Transaction Parameters
        </div>

        <div className="grid grid-cols-2 gap-y-3 gap-x-4 p-4 rounded-[var(--radius-md)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] text-[13px]">
          <div>
            <div className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase">Amount</div>
            <div className="font-mono text-[var(--text-primary)] tabular-numbers font-medium mt-0.5">
              ₹{transaction.amount.toLocaleString('en-IN')}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase">Currency / Method</div>
            <div className="font-mono text-[var(--text-primary)] font-medium mt-0.5 flex items-center gap-1.5">
              <span>{transaction.currency}</span>
              <span className="text-[11px] text-[var(--text-tertiary)]">·</span>
              <span className="text-[11px] text-blue-400 font-semibold">{transaction.paymentMethod?.toUpperCase() || (transaction.vpa ? 'UPI' : 'CARD')}</span>
            </div>
          </div>

          {/* UPI Specific Parameters */}
          {transaction.vpa && (
            <>
              <div>
                <div className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase">UPI ID / VPA</div>
                <div className="font-mono text-[12px] text-indigo-400 font-semibold mt-0.5 truncate">
                  {transaction.vpa}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase">UPI Flow & App</div>
                <div className="font-medium text-[var(--text-primary)] mt-0.5 text-[12px]">
                  {transaction.upiApp || 'UPI'} · {transaction.upiFlowType === 'collect' ? 'Collect (Inverted)' : 'Intent (Native)'}
                </div>
              </div>
            </>
          )}

          {/* D2C Logistics Parameters */}
          {transaction.deliveryPincode && (
            <>
              <div>
                <div className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase">Delivery Pincode</div>
                <div className="font-mono text-[var(--text-primary)] font-medium mt-0.5">
                  {transaction.deliveryPincode} {transaction.isCod ? '(COD)' : '(Prepaid)'}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase">COD Recommendation</div>
                <div className={`font-mono text-[11px] font-bold mt-0.5 ${
                  transaction.codRecommendation === 'REQUIRE_PREPAID_UPI' ? 'text-amber-400' :
                  transaction.codRecommendation === 'BLOCK' ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {transaction.codRecommendation || 'ALLOW_COD'}
                </div>
              </div>
            </>
          )}

          <div>
            <div className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase">Merchant / Gateway</div>
            <div className="text-[var(--text-primary)] font-medium mt-0.5 truncate flex items-center gap-1.5">
              <span>{transaction.merchant}</span>
              {transaction.gateway && (
                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-300">
                  {transaction.gateway.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase">MCC Category</div>
            <div className="font-mono text-[var(--text-primary)] font-medium mt-0.5">
              {transaction.category}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase">Customer</div>
            <div className="font-mono text-[var(--text-primary)] font-medium mt-0.5">
              {transaction.customer}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase">Geo Location</div>
            <div className="text-[var(--text-primary)] font-medium mt-0.5">
              {transaction.location}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase">Client Device</div>
            <div className="text-[var(--text-primary)] font-medium mt-0.5 truncate">
              {transaction.device}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase">IP Address</div>
            <div className="font-mono text-[var(--text-primary)] font-medium mt-0.5">
              {transaction.ipAddress}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase">Authentication</div>
            <div className="font-medium text-[var(--text-primary)] mt-0.5">
              {transaction.paymentMethod === 'upi' || transaction.vpa ? 'UPI MPIN Biometric' : transaction.threeDsResult}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase">Timestamp</div>
            <div className="font-mono text-[11px] text-[var(--text-primary)] mt-0.5 truncate">
              {transaction.timestamp}
            </div>
          </div>
        </div>
      </section>

      {/* 5.4 — RISK TIMELINE */}
      <section className="pt-4 border-t border-[var(--border-subtle)] space-y-3">
        <div className="text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          Risk Timeline
        </div>
        <Timeline events={transaction.timeline} />
      </section>

      {/* 5.5 — CUSTOMER CONTEXT */}
      <section className="pt-4 border-t border-[var(--border-subtle)]">
        <div
          onClick={() => setIsCustomerContextOpen(!isCustomerContextOpen)}
          className="flex items-center justify-between cursor-pointer py-1 select-none"
        >
          <div className="flex items-center gap-2">
            <UserCheck size={16} className="text-[var(--text-tertiary)]" />
            <span className="text-[13px] font-semibold text-[var(--text-primary)]">
              Customer Context ({transaction.customer})
            </span>
          </div>
          {isCustomerContextOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>

        {isCustomerContextOpen && (
          <div className="mt-3 p-3.5 rounded-[var(--radius-md)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] space-y-2 text-[12px] animate-in fade-in duration-fast">
            <div className="flex justify-between">
              <span className="text-[var(--text-tertiary)]">Account Age</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {transaction.customerContext.accountAge}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-tertiary)]">Prior Transactions</span>
              <span className="font-semibold text-[var(--text-primary)] tabular-numbers">
                {transaction.customerContext.priorTransactions}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-tertiary)]">Prior Disputes</span>
              <span className="font-semibold text-[var(--text-primary)] tabular-numbers">
                {transaction.customerContext.priorDisputes}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-tertiary)]">Known Devices</span>
              <span className="font-semibold text-[var(--text-primary)] tabular-numbers">
                {transaction.customerContext.knownDevices} (new)
              </span>
            </div>
          </div>
        )}
      </section>
    </Drawer>
  );
};
