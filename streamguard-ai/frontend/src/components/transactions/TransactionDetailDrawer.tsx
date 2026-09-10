import React, { useState } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { RiskScore } from '@/components/ui/RiskScore';
import { SignalCard } from '@/components/ui/SignalCard';
import { Timeline } from '@/components/ui/Timeline';
import type { TimelineEvent } from '@/components/ui/Timeline';
import { Button } from '@/components/ui/Button';
import { Check, Flag, Ban, ChevronDown, ChevronUp, UserCheck, ExternalLink } from 'lucide-react';
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

          {/* Row 3: Status Badge + Timestamp */}
          <div className="flex items-center gap-2 pt-0.5">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-[var(--radius-xs)] border text-[11px] font-semibold font-mono tracking-wide ${statusBadgeColor}`}
            >
              {transaction.status}
            </span>
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
            <div className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase">Currency</div>
            <div className="font-mono text-[var(--text-primary)] font-medium mt-0.5">
              {transaction.currency}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase">Merchant</div>
            <div className="text-[var(--text-primary)] font-medium mt-0.5 truncate">
              {transaction.merchant}
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
            <div className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase">3DS Result</div>
            <div className="font-medium text-[var(--text-primary)] mt-0.5">
              {transaction.threeDsResult}
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
