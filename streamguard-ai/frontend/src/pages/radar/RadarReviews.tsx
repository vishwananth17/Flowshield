import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Shield,
  CreditCard,
  Globe,
  Smartphone,
  Calendar,
  User,
  ArrowUpRight,
  ChevronRight,
  Info,
  Check,
  X,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

interface ReviewItem {
  id: string;
  chargeId: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  riskScore: number;
  riskLevel: 'elevated' | 'highest';
  triggeredRule: string;
  ipAddress: string;
  ipCountry: string;
  cardCountry: string;
  cardLast4: string;
  cardBrand: string;
  cvcCheck: 'passed' | 'failed' | 'unchecked';
  addressCheck: 'match' | 'mismatch';
  device: string;
  hoursRemaining: number;
  signals: string[];
}

export default function RadarReviews() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);

  const [reviews, setReviews] = useState<ReviewItem[]>([
    {
      id: 'rev_1',
      chargeId: 'ch_3N8x762eZvKYlo2C1',
      amount: 14500,
      currency: 'INR',
      customerName: 'Rahul Sharma',
      customerEmail: 'rahul.sharma882@gmail.com',
      riskScore: 78,
      riskLevel: 'elevated',
      triggeredRule: 'Review if :risk_level: = \'elevated\'',
      ipAddress: '185.220.101.42',
      ipCountry: 'Netherlands (NL)',
      cardCountry: 'India (IN)',
      cardLast4: '4242',
      cardBrand: 'Visa',
      cvcCheck: 'passed',
      addressCheck: 'mismatch',
      device: 'Mac OS · Chrome 124 (TOR Exit Node detected)',
      hoursRemaining: 18,
      signals: [
        'TOR exit node / Proxy network identified',
        'IP country (NL) does not match billing country (IN)',
        'First time purchase from this IP subnet',
      ],
    },
    {
      id: 'rev_2',
      chargeId: 'ch_3N8x991eZvKYlo2C9',
      amount: 8200,
      currency: 'INR',
      customerName: 'Priya Kulkarni',
      customerEmail: 'priyakulkarni1994@outlook.com',
      riskScore: 74,
      riskLevel: 'elevated',
      triggeredRule: 'Review if :customer_velocity_1h: > 4',
      ipAddress: '49.207.181.12',
      ipCountry: 'India (IN)',
      cardCountry: 'India (IN)',
      cardLast4: '8812',
      cardBrand: 'Mastercard',
      cvcCheck: 'passed',
      addressCheck: 'match',
      device: 'Android 14 · Mobile Safari',
      hoursRemaining: 26,
      signals: [
        '5 checkout attempts from this device in under 30 minutes',
        '2 previous payment attempts were declined by issuing bank',
        'Shipping address changed 3 times during checkout',
      ],
    },
    {
      id: 'rev_3',
      chargeId: 'ch_3N8y011eZvKYlo2M3',
      amount: 29900,
      currency: 'INR',
      customerName: 'Vikram Malhotra',
      customerEmail: 'v.malhotra.orders@proton.me',
      riskScore: 82,
      riskLevel: 'highest',
      triggeredRule: 'Review if :amount_in_inr: > 25000 and :device_is_suspicious: = \'true\'',
      ipAddress: '104.28.212.90',
      ipCountry: 'United States (US)',
      cardCountry: 'India (IN)',
      cardLast4: '1094',
      cardBrand: 'HDFC Visa Platinum',
      cvcCheck: 'failed',
      addressCheck: 'mismatch',
      device: 'Linux x86_64 · Headless Chrome Emulator',
      hoursRemaining: 8,
      signals: [
        'Headless browser automation detected',
        'CVC verification failed on 1st attempt',
        'High ticket transaction (₹29,900) without 3DS biometric proof',
      ],
    },
    {
      id: 'rev_4',
      chargeId: 'ch_3N8y240eZvKYlo2F7',
      amount: 4500,
      currency: 'INR',
      customerName: 'Amitava Sen',
      customerEmail: 'sen.amitava@yahoo.co.in',
      riskScore: 68,
      riskLevel: 'elevated',
      triggeredRule: 'Review if :billing_zip: != :shipping_zip:',
      ipAddress: '157.48.22.180',
      ipCountry: 'India (IN)',
      cardCountry: 'India (IN)',
      cardLast4: '3319',
      cardBrand: 'Rupay Debit',
      cvcCheck: 'passed',
      addressCheck: 'match',
      device: 'Windows 11 · Edge 122',
      hoursRemaining: 42,
      signals: [
        'Cardholder billing postal code (700001) differs from shipping destination (400050)',
        'Standard velocity pattern observed',
      ],
    },
  ]);

  const handleApprove = (id: string, customerName: string) => {
    setReviews(reviews.filter((r) => r.id !== id));
    if (selectedReview?.id === id) setSelectedReview(null);
    toast.success(`Payment approved for ${customerName}. Charge captured successfully.`);
  };

  const handleRefundFraud = (id: string, customerName: string) => {
    setReviews(reviews.filter((r) => r.id !== id));
    if (selectedReview?.id === id) setSelectedReview(null);
    toast.error(`Payment refunded and reported as fraud for ${customerName}. Card added to blocklist.`);
  };

  const filteredReviews = reviews.filter((r) =>
    r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.chargeId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E3E8EE] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#1A1F36]">Review Queue</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#FFECD1] text-[#8A6100] border border-[#F9D08B]">
              {reviews.length} PENDING
            </span>
          </div>
          <p className="text-sm text-[#4F566B] mt-1">
            Flagged payments awaiting manual triage. Approved payments are captured; refunded payments train Radar's machine learning.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" onClick={() => toast.info('Queue synchronized with payment gateways')} className="text-xs">
            <RotateCcw className="w-3.5 h-3.5 text-[#697386]" />
            <span>Refresh Queue</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-white border border-[#E3E8EE] shadow-sm">
          <span className="text-xs text-[#697386] font-medium">Pending Review</span>
          <div className="text-2xl font-bold text-[#1A1F36] mt-1">{reviews.length} payments</div>
          <span className="text-xs text-[#8A6100] font-medium mt-0.5 block">Requires decision</span>
        </div>

        <div className="p-4 rounded-lg bg-white border border-[#E3E8EE] shadow-sm">
          <span className="text-xs text-[#697386] font-medium">Total Flagged Volume</span>
          <div className="text-2xl font-bold text-[#1A1F36] mt-1">
            ₹{reviews.reduce((acc, r) => acc + r.amount, 0).toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-[#697386] mt-0.5 block">Held uncaptured</span>
        </div>

        <div className="p-4 rounded-lg bg-white border border-[#E3E8EE] shadow-sm">
          <span className="text-xs text-[#697386] font-medium">Oldest Pending</span>
          <div className="text-2xl font-bold text-[#1A1F36] mt-1">8 hours left</div>
          <span className="text-xs text-[#A8071A] font-semibold mt-0.5 block">Expires if not captured</span>
        </div>

        <div className="p-4 rounded-lg bg-white border border-[#E3E8EE] shadow-sm">
          <span className="text-xs text-[#697386] font-medium">Resolved Today</span>
          <div className="text-2xl font-bold text-[#0E6245] mt-1">28 reviews</div>
          <span className="text-xs text-[#697386] mt-0.5 block">92.8% approved</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#697386] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, email, or charge ID..."
            className="w-full h-9 pl-9 pr-4 rounded bg-white border border-[#E3E8EE] text-xs text-[#1A1F36] placeholder:text-[#697386] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20"
          />
        </div>
      </div>

      {/* Queue Table */}
      <Card variant="data" padding="none" className="overflow-hidden">
        {filteredReviews.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#CBF4C9] flex items-center justify-center mx-auto text-[#0E6245]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#1A1F36]">Review Queue is All Clear</h3>
            <p className="text-xs text-[#697386] max-w-sm mx-auto">
              There are no pending payments requiring manual evaluation. Great job keeping chargebacks at zero!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8FAFC] border-b border-[#E3E8EE] text-[11px] font-semibold text-[#697386] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Customer & Charge</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Risk Score</th>
                  <th className="px-4 py-3">Triggered Rule</th>
                  <th className="px-4 py-3">Time to Capture</th>
                  <th className="px-4 py-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E8EE] bg-white">
                {filteredReviews.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedReview(item)}
                    className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-xs text-[#1A1F36] group-hover:text-[#635BFF] transition-colors">
                        {item.customerName}
                      </div>
                      <div className="text-[11px] text-[#697386] font-mono">
                        {item.customerEmail} · {item.chargeId}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-bold text-xs text-[#1A1F36]">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold ${
                          item.riskScore >= 80
                            ? 'bg-[#FFD8D8] text-[#A8071A] border border-[#F4A4A4]'
                            : 'bg-[#FFECD1] text-[#8A6100] border border-[#F9D08B]'
                        }`}
                      >
                        Score {item.riskScore}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px] text-[#4F566B] truncate max-w-[220px]">
                      {item.triggeredRule}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-[#A8071A]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{item.hoursRemaining}h remaining</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleApprove(item.id, item.customerName)}
                        title="Approve payment"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-[#CBF4C9] text-[#0E6245] hover:bg-[#A3E7A0] transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>

                      <button
                        onClick={() => handleRefundFraud(item.id, item.customerName)}
                        title="Refund and report fraud"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-[#FFD8D8] text-[#A8071A] hover:bg-[#F4A4A4] transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Refund Fraud</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Review Detail Drawer Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/30 backdrop-blur-xs">
          <div className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-[#E3E8EE] animate-in slide-in-from-right duration-fast">
            
            {/* Drawer Header */}
            <div>
              <div className="p-5 border-b border-[#E3E8EE] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#697386]">{selectedReview.chargeId}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#FFECD1] text-[#8A6100]">
                      Score {selectedReview.riskScore}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-[#1A1F36] mt-1">
                    ₹{selectedReview.amount.toLocaleString('en-IN')} · {selectedReview.customerName}
                  </h2>
                </div>

                <button
                  onClick={() => setSelectedReview(null)}
                  className="p-1 rounded text-[#697386] hover:text-[#1A1F36] hover:bg-[#F1F5F9]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-6 space-y-6">
                
                {/* Fraud Signals Alert */}
                <div className="p-4 rounded-lg bg-[#FFF8F0] border border-[#F9D08B] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#8A6100]">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Triggered Signals</span>
                  </div>
                  <ul className="text-xs text-[#4F566B] space-y-1.5 list-disc pl-4">
                    {selectedReview.signals.map((sig, i) => (
                      <li key={i}>{sig}</li>
                    ))}
                  </ul>
                </div>

                {/* Radar Breakdown Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#697386]">Radar Risk Insights</h4>
                  
                  <div className="divide-y divide-[#E3E8EE] border border-[#E3E8EE] rounded-lg text-xs">
                    <div className="p-3 flex justify-between">
                      <span className="text-[#697386]">IP Geolocation</span>
                      <span className="font-semibold text-[#1A1F36]">{selectedReview.ipCountry} ({selectedReview.ipAddress})</span>
                    </div>

                    <div className="p-3 flex justify-between">
                      <span className="text-[#697386]">Card Origin Country</span>
                      <span className="font-semibold text-[#1A1F36]">{selectedReview.cardCountry}</span>
                    </div>

                    <div className="p-3 flex justify-between">
                      <span className="text-[#697386]">Card CVC Check</span>
                      <span className="font-semibold text-[#0E6245] uppercase">{selectedReview.cvcCheck}</span>
                    </div>

                    <div className="p-3 flex justify-between">
                      <span className="text-[#697386]">Card Fingerprint</span>
                      <span className="font-mono text-[#1A1F36]">{selectedReview.cardBrand} ···· {selectedReview.cardLast4}</span>
                    </div>

                    <div className="p-3 flex justify-between">
                      <span className="text-[#697386]">Client Device</span>
                      <span className="font-mono text-[#1A1F36] max-w-[280px] truncate">{selectedReview.device}</span>
                    </div>

                    <div className="p-3 flex justify-between">
                      <span className="text-[#697386]">Triggered Rule</span>
                      <span className="font-mono text-[#635BFF]">{selectedReview.triggeredRule}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Drawer Sticky Footer Actions */}
            <div className="p-5 border-t border-[#E3E8EE] bg-[#F8FAFC] flex items-center justify-end gap-3">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRefundFraud(selectedReview.id, selectedReview.customerName)}
                className="text-xs"
              >
                Refund & Report Fraud
              </Button>

              <Button
                size="sm"
                onClick={() => handleApprove(selectedReview.id, selectedReview.customerName)}
                className="bg-[#0E6245] hover:bg-[#0A4A34] text-white text-xs"
              >
                Approve & Capture Payment
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
