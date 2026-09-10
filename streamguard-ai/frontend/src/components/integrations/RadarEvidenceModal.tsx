import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  Truck, 
  Clock, 
  Lock, 
  RefreshCw,
  UserCheck,
  PackageCheck,
  ShoppingBag,
  MapPin,
  FileCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export interface EvidenceDossierItem {
  id: string;
  orderId: string;
  disputeRef: string;
  amount: string;
  gateway: 'Razorpay' | 'Cashfree';
  customerName: string;
  customerEmail: string;
  customerIp: string;
  reason: string;
  carrier: 'Delhivery' | 'BlueDart';
  awbNumber: string;
  deliveryDate: string;
  signedBy: string;
  gpsCoords: string;
  winProbability: number;
  status: 'AUTO-COMPILED' | 'SUBMITTED' | 'WON';
  timeline: {
    event: string;
    timestamp: string;
    badge: string;
  }[];
}

interface RadarEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossier: EvidenceDossierItem | null;
}

export const RadarEvidenceModal: React.FC<RadarEvidenceModalProps> = ({
  isOpen,
  onClose,
  dossier,
}) => {
  if (!isOpen || !dossier) return null;

  const handleDownloadPdf = () => {
    toast.success('Compiling defense package PDF...', {
      description: `Court-grade response dossier for ${dossier.disputeRef} compiled with signed courier manifest.`
    });
    setTimeout(() => {
      toast.success('Defense Package PDF Ready for Download (4 Pages)');
    }, 700);
  };

  const handleReSubmit = () => {
    toast.success(`Evidence Re-transmitted to ${dossier.gateway} API`, {
      description: `Representment payload verified via HMAC SHA-256 for dispute ops team.`
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl bg-[#080D15] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans max-h-[90vh] flex flex-col"
        >
          {/* Top Banner & Header */}
          <div className="p-5 border-b border-slate-800/90 flex items-center justify-between bg-[#05080F]/80">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Dispute Defense Dossier
                  </h2>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    dossier.status === 'WON'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : dossier.status === 'SUBMITTED'
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}>
                    {dossier.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Court-Ready Representment Packet · Order <span className="font-mono text-slate-200 font-semibold">{dossier.orderId}</span> (Ref: <span className="font-mono text-slate-300">{dossier.disputeRef}</span>)
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Dossier Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-sans">
            
            {/* Win Probability & Gateway Strip */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/30 via-[#070B14] to-cyan-950/30 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold font-mono text-sm">
                  {dossier.winProbability}%
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>High Win Likelihood</span>
                    <span className="text-[10px] text-emerald-400 font-normal">· Court-Admissible Proof</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Physical signed recipient manifest and GPS match refute customer claim of <span className="text-slate-200 font-medium">"{dossier.reason}"</span>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs shrink-0">
                <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
                  Disputed Amount: <strong className="text-white font-mono">{dossier.amount}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-cyan-400 font-mono">
                  {dossier.gateway} Ingress
                </span>
              </div>
            </div>

            {/* 4-Tier Evidence Verification Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Tier 1: Merchant Order & Customer Identity */}
              <div className="p-4 rounded-xl bg-[#05080F] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                    Tier 1: Customer Identity & Auth
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    VERIFIED
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Order Reference:</span>
                    <span className="text-slate-200 font-mono font-semibold">{dossier.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Customer Name:</span>
                    <span className="text-slate-200 font-medium">{dossier.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Customer Email:</span>
                    <span className="text-slate-200">{dossier.customerEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Checkout IP Address:</span>
                    <span className="text-cyan-400 font-mono">{dossier.customerIp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">AVS / 3DS OTP Auth:</span>
                    <span className="text-emerald-400 font-mono">Pass (ARN: 74920184)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Proxy / VPN Check:</span>
                    <span className="text-emerald-400">Clean Residential (Airtel Broadband)</span>
                  </div>
                </div>
              </div>

              {/* Tier 2: Carrier Auto-POD Proof (Courier Manifest) */}
              <div className="p-4 rounded-xl bg-[#05080F] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-purple-400" />
                    Tier 2: Courier Signed Proof of Delivery
                  </span>
                  <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-500/10 px-1.5 py-0.5 rounded">
                    {dossier.carrier} API
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Air Waybill (AWB):</span>
                    <span className="text-purple-300 font-bold font-mono">{dossier.awbNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Delivery Status:</span>
                    <span className="text-emerald-400 font-bold font-mono">DELIVERED</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Delivery Completed:</span>
                    <span className="text-slate-200">{dossier.deliveryDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Signed Recipient:</span>
                    <span className="text-white font-bold">{dossier.signedBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Delivery GPS Tag:</span>
                    <span className="text-cyan-400 font-mono">{dossier.gpsCoords}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">POD Signature Hash:</span>
                    <span className="text-slate-300 font-mono">sha256:d8a9f...b41</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Simulated Signed Delivery Receipt Manifest Card */}
            <div className="p-4 rounded-xl bg-[#05080F] border border-slate-800/90 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  Tier 3: Attached Physical Proof Manifest ({dossier.carrier} Auto-Ingress)
                </span>
                <span className="text-[10px] text-slate-400">Format: Cryptographic Digital Scan</span>
              </div>

              <div className="p-3.5 rounded-lg bg-[#03060A] border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
                <div className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold font-mono">
                  CERTIFICATE OF COMPLETED CARRIER DELIVERY
                </div>
                <div>
                  Air Waybill <span className="text-white font-bold font-mono">{dossier.awbNumber}</span> delivered to registered consignee address on <span className="text-white font-medium">{dossier.deliveryDate}</span>.
                </div>
                <div className="text-slate-400">
                  Recipient Signature: <span className="italic text-cyan-300 font-medium">"{dossier.signedBy}"</span> · Verified with OTP doorstep validation by {dossier.carrier} dispatch agent.
                </div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>GPS drop coordinates validated within 6 meters of registered shipping address.</span>
                </div>
              </div>
            </div>

            {/* Autonomous Audit Timeline */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs block">
                  Tier 4: Terms of Service & Autonomous Representment Timeline
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Audit Trail Lineage</span>
              </div>
              <div className="space-y-1.5">
                {dossier.timeline.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-[#05080F] border border-slate-800/60 text-[11px]">
                    <div className="flex items-center space-x-2 text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                      <span>{item.event}</span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                        {item.badge}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Dossier Modal Footer */}
          <div className="p-4 border-t border-slate-800/90 bg-[#05080F]/90 flex flex-col sm:flex-row items-center justify-between gap-3 font-sans">
            <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
              <Lock className="w-3 h-3 text-cyan-400" />
              <span>TLS 1.3 HMAC SHA-256 Validated</span>
            </div>

            <div className="flex items-center space-x-2.5 w-full sm:w-auto">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleReSubmit}
                className="text-xs border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                <span>Re-Sync Gateway API</span>
              </Button>

              <Button
                size="sm"
                onClick={handleDownloadPdf}
                className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-md flex-1 sm:flex-initial"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                <span>Download Defense Dossier PDF (4pg)</span>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RadarEvidenceModal;
