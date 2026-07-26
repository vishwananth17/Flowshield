import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  FileText,
  ShieldCheck,
  Upload,
  User,
  Activity,
  AlertCircle,
  Plus,
  Trash2,
  Download,
  CheckCircle,
  Clock,
  ChevronRight,
  Info,
  Loader2,
  FileCode,
  Globe
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import api, { API_BASE_URL } from '@/services/api';

export default function DisputeDetail() {
  const { disputeId } = useParams();
  const navigate = useNavigate();

  const [dispute, setDispute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState('shipping_receipt');
  const [uploadText, setUploadText] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchDisputeDetail = useCallback(async () => {
    try {
      const res = await api.get(`/disputes/${disputeId}`);
      setDispute(res.data);
      setNotes(res.data.merchant_notes || '');
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to retrieve dispute dossier.");
      navigate('/dashboard/disputes');
    } finally {
      setLoading(false);
    }
  }, [disputeId, navigate]);

  useEffect(() => {
    fetchDisputeDetail();
  }, [fetchDisputeDetail]);

  const handleToggleEvidence = async (evidenceId: string, currentVal: boolean) => {
    try {
      await api.patch(`/disputes/${disputeId}/evidence/${evidenceId}`, {
        is_included_in_response: !currentVal
      });
      toast.success("Response package evidence inclusion updated.");
      fetchDisputeDetail();
    } catch (e) {
      toast.error("Failed to update evidence selection status.");
    }
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    const confirm = window.confirm("Are you sure you want to discard this evidence document?");
    if (!confirm) return;

    try {
      await api.delete(`/disputes/${disputeId}/evidence/${evidenceId}`);
      toast.success("Evidence document discarded.");
      fetchDisputeDetail();
    } catch (e) {
      toast.error("Failed to delete evidence file.");
    }
  };

  const handleUploadEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile && !uploadText) {
      toast.error("Please provide either an upload file or supporting text.");
      return;
    }

    setUploading(true);
    const toastId = toast.loading("Uploading and index tagging evidence...");

    try {
      const formData = new FormData();
      formData.append("evidence_type", uploadType);
      if (uploadText) formData.append("content_text", uploadText);
      if (uploadFile) formData.append("file", uploadFile);

      await api.post(`/disputes/${disputeId}/evidence`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success("Evidence file indexed successfully!", { id: toastId });
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadText('');
      fetchDisputeDetail();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Upload failed.", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleGeneratePdf = async () => {
    setGeneratingPdf(true);
    const toastId = toast.loading("Compiling reportlab defense package...");
    try {
      await api.post(`/disputes/${disputeId}/generate-response`);
      toast.success("Defense package PDF compiled successfully!", { id: toastId });
      fetchDisputeDetail();
    } catch (e) {
      toast.error("Failed to compile defense package.", { id: toastId });
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await api.patch(`/disputes/${disputeId}`, { merchant_notes: notes });
      toast.success("Merchant dossier notes updated.");
    } catch (e) {
      toast.error("Failed to save merchant notes.");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleAcceptDispute = async () => {
    const confirm = window.confirm("Accepting this dispute will forfeit the chargeback amount and resolve the dispute. Continue?");
    if (!confirm) return;

    try {
      await api.patch(`/disputes/${disputeId}`, { outcome: "accepted" });
      toast.success("Dispute accepted and closed.");
      fetchDisputeDetail();
    } catch (e) {
      toast.error("Failed to update dispute outcome.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
        <p className="text-gray-400 mt-4 font-bold text-sm">Compiling case dossier...</p>
      </div>
    );
  }

  if (!dispute) return null;

  // Helpers
  const canModify = dispute.status === 'open' || dispute.status === 'evidence_gathering' || dispute.status === 'response_submitted';
  const displayScore = dispute.evidence_strength_score;
  const daysVal = dispute.days_remaining;

  const scoreColor = displayScore >= 70 ? 'text-emerald-400 border-emerald-500/30' : (displayScore >= 40 ? 'text-amber-400 border-amber-500/30' : 'text-red-400 border-red-500/30');
  const deadlineColor = dispute.urgency === 'expired' ? 'text-gray-500 border-gray-700 bg-gray-800/50' : (dispute.urgency === 'critical' ? 'text-red-500 border-red-500/30 bg-red-500/5 animate-pulse' : (dispute.urgency === 'warning' ? 'text-amber-400 border-amber-500/30 bg-amber-500/5' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5'));

  return (
    <div className="space-y-6 relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
      
      {/* Back Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard/disputes')}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors text-xs font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dispute Center</span>
        </button>

        <div className="flex items-center space-x-3">
          {canModify && (
            <button
              onClick={handleAcceptDispute}
              className="bg-transparent border border-red-500/30 hover:bg-red-500/10 text-red-400 px-4 py-2 rounded-xl text-xs font-bold transition-all"
            >
              Accept Liability
            </button>
          )}

          <button
            onClick={handleGeneratePdf}
            disabled={generatingPdf || !canModify}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-lg shadow-blue-900/20"
          >
            {generatingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            <span>Compile Defense Package</span>
          </button>
        </div>
      </div>

      {/* Overview Block */}
      <div className="bg-[#111827]/60 border border-[#1F2937]/80 rounded-2xl p-6 backdrop-blur-xl grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">{dispute.dispute_reference}</h1>
            <span className="bg-[#1F2937]/80 text-gray-300 px-2 py-0.5 rounded text-[10px] font-bold border border-gray-700 uppercase">{dispute.payment_gateway}</span>
            <span className={`border px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${deadlineColor}`}>
              {dispute.urgency === 'expired' ? 'Expired' : `${daysVal} Days Remaining`}
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Disputed Charge of <b className="text-white">INR {dispute.dispute_amount.toLocaleString('en-IN')}</b> for customer <b>{dispute.customer_name || 'N/A'}</b> ({dispute.customer_email || 'No email'}).
          </p>

          <div className="bg-[#1e293b]/40 border border-blue-500/10 p-4 rounded-xl flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Recommended Strategy</h4>
              <p className="text-gray-300 text-xs mt-1 leading-relaxed">{dispute.recommended_action}</p>
            </div>
          </div>
        </div>

        {/* Evidence Score Ring */}
        <div className="flex flex-col items-center justify-center p-4 border-l border-[#1F2937] lg:border-l-1 lg:border-t-0 border-t pt-6 lg:pt-4">
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* SVG circle meter */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#1F2937"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={displayScore >= 70 ? "#10b981" : (displayScore >= 40 ? "#f59e0b" : "#ef4444")}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * displayScore) / 100}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-2xl font-black text-white">{displayScore}%</span>
              <p className="text-[8px] uppercase font-bold text-gray-500 tracking-wider">Evidence Strength</p>
            </div>
          </div>
          <span className={`mt-3 text-xs font-bold px-2 py-0.5 rounded border ${scoreColor}`}>
            {displayScore >= 70 ? 'Strong Case' : (displayScore >= 40 ? 'Moderate case' : 'Weak Case')}
          </span>
        </div>
      </div>

      {/* Main Workspace split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Checklist & Evidence documents */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="backdrop-blur-xl bg-[#111827]/60 border-[#1F2937]/80">
            <CardHeader className="border-b border-[#1F2937]/50 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-white text-md font-medium flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-400" />
                Case Evidence Packages
              </CardTitle>
              {canModify && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 font-bold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Document</span>
                </button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {dispute.evidence.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs">
                  No evidence gathered. Log details or upload manual files.
                </div>
              ) : (
                <div className="divide-y divide-[#1F2937]/40">
                  {dispute.evidence.map((ev: any) => (
                    <div key={ev.id} className="p-4 hover:bg-[#1F2937]/10 transition-colors flex items-start justify-between gap-4">
                      <div className="flex items-start space-x-3">
                        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 mt-0.5">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm uppercase">{ev.evidence_type.replace('_', ' ')}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider font-semibold">Source: {ev.evidence_source}</div>
                          {ev.content_text && (
                            <div className="text-gray-400 text-xs mt-1.5 line-clamp-2 max-w-lg bg-[#1F2937]/20 p-2 rounded-lg font-mono">
                              {ev.content_text}
                            </div>
                          )}
                          {ev.file_url && (
                            <a
                              href={`${API_BASE_URL.replace('/api/v1', '')}${ev.file_url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-400 hover:text-blue-300 font-bold inline-flex items-center mt-2"
                            >
                              <Download className="h-3 w-3 mr-1" /> View Uploaded Document
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        {/* Include switch */}
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold text-gray-500 uppercase">Include</span>
                          <button
                            type="button"
                            disabled={!canModify}
                            onClick={() => handleToggleEvidence(ev.id, ev.is_included_in_response)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              ev.is_included_in_response ? 'bg-blue-600' : 'bg-gray-800'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                ev.is_included_in_response ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Discard */}
                        {canModify && ev.evidence_source === 'merchant_uploaded' && (
                          <button
                            onClick={() => handleDeleteEvidence(ev.id)}
                            className="text-gray-500 hover:text-red-400 transition-colors p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Defense Document compilation widget */}
          {dispute.response_document_url && (
            <Card className="backdrop-blur-xl bg-blue-600/5 border-blue-500/20">
              <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-600/10 text-blue-400 rounded-xl">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Response Package Compiled</h3>
                    <p className="text-gray-400 text-xs mt-0.5">Ready for submission to the payment gateway portal.</p>
                  </div>
                </div>

                <a
                  href={`${API_BASE_URL}/disputes/${dispute.id}/response-document`}
                  download
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-blue-900/20 transition-all w-full md:w-auto justify-center"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Response PDF</span>
                </a>
              </CardContent>
            </Card>
          )}

          {/* Premium ML scoring profile if matched transaction */}
          {dispute.ml_risk_score !== null && (
            <Card className="backdrop-blur-xl bg-[#111827]/60 border-[#1F2937]/80">
              <CardHeader className="border-b border-[#1F2937]/50 pb-4">
                <CardTitle className="text-white text-md font-medium flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-purple-400" />
                  Premium ML Fraud Evaluation Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Evaluation Risk Score</span>
                    <p className="text-3xl font-black text-white mt-1">{(dispute.ml_risk_score * 100).toFixed(1)}%</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    dispute.ml_risk_score < 0.15 ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : 'text-red-400 border-red-500/20 bg-red-500/5'
                  }`}>
                    {dispute.ml_risk_score < 0.15 ? 'LOW RISK' : 'RISKY TRANSACTION'}
                  </span>
                </div>

                {dispute.ml_fraud_signals && dispute.ml_fraud_signals.length > 0 ? (
                  <div>
                    <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">Signal Explanations:</span>
                    <ul className="space-y-1.5 text-xs text-gray-300">
                      {dispute.ml_fraud_signals.map((sig: string, idx: number) => (
                        <li key={idx} className="flex items-center space-x-2">
                          <ChevronRight className="h-3 w-3 text-purple-400" />
                          <span>{sig}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-gray-500 text-xs">No anomalies flagged. Payment satisfies validation rules.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Merchant Case Notes */}
          <Card className="backdrop-blur-xl bg-[#111827]/60 border-[#1F2937]/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-md font-medium">Merchant Dossier Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                rows={4}
                placeholder="Log notes, tracking codes, or gateway submission audit history here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-[#111827] border border-[#1F2937] text-white p-3 rounded-xl text-xs w-full focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="bg-[#1F2937] hover:bg-[#374151] text-gray-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2"
              >
                {savingNotes && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                <span>Save Notes</span>
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Right: History Timeline */}
        <div className="space-y-6">
          <Card className="backdrop-blur-xl bg-[#111827]/60 border-[#1F2937]/80">
            <CardHeader className="border-b border-[#1F2937]/50 pb-4">
              <CardTitle className="text-white text-md font-medium flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-400" />
                Dossier Audit Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative border-l border-gray-800 ml-3 space-y-6">
                {dispute.timeline.map((item: any) => (
                  <div key={item.id} className="relative pl-6">
                    {/* Circle bullet */}
                    <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-blue-600 border border-[#111827]" />
                    <div className="text-xs font-mono text-gray-500">{new Date(item.created_at).toLocaleString('en-IN')}</div>
                    <div className="text-sm font-bold text-white mt-1 uppercase text-xs">{item.event_type.replace('_', ' ')}</div>
                    <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{item.event_description}</p>
                    <div className="text-[9px] text-gray-600 mt-1 uppercase tracking-wider font-semibold">Triggered by: {item.triggered_by}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Manual Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#111827] border border-[#1F2937] rounded-2xl w-full max-w-md shadow-2xl p-6"
          >
            <div className="flex justify-between items-center pb-4 border-b border-[#1F2937]">
              <h2 className="text-lg font-bold text-white flex items-center"><Upload className="h-5 w-5 mr-2 text-blue-400" /> Index Custom Evidence</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-white text-lg">&times;</button>
            </div>

            <form onSubmit={handleUploadEvidence} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Evidence Type Tag</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="bg-[#111827] border border-[#1F2937] text-white p-2.5 rounded-xl text-xs w-full focus:outline-none focus:border-blue-500 font-bold"
                >
                  <option value="shipping_receipt">Shipping/Courier Receipt</option>
                  <option value="delivery_proof">Proof of Delivery Confirmation</option>
                  <option value="customer_communication">Customer Conversation Screenshot/Text</option>
                  <option value="order_confirmation">Invoice / Order Confirmation</option>
                  <option value="refund_policy">Store Return/Cancellation Policy</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Supporting Content Text</label>
                <textarea
                  rows={3}
                  placeholder="Paste chat message transcript, tracking log snippets, or verification emails..."
                  value={uploadText}
                  onChange={(e) => setUploadText(e.target.value)}
                  className="bg-[#111827] border border-[#1F2937] text-white p-2.5 rounded-xl text-xs w-full focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Attachment File (PDF, PNG, JPG - max 10MB)</label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  className="bg-[#111827] border border-[#1F2937] text-gray-300 p-2 rounded-xl text-xs w-full focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center space-x-3 justify-end pt-4 border-t border-[#1F2937]">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="bg-transparent border border-[#1F2937] hover:border-gray-500 text-gray-400 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2"
                >
                  {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                  <span>Add Document</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
