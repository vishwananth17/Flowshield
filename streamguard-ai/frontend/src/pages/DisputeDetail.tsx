import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  ShieldCheck,
  Upload,
  Plus,
  Trash2,
  Download,
  Clock,
  ChevronRight,
  Info,
  Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Heading1, Heading2, Heading3, Label, Caption } from '@/components/ui/Typography';
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
        <Loader2 className="h-10 w-10 text-[var(--color-primary)] animate-spin" />
        <p className="text-[var(--text-muted)] mt-4 font-mono font-bold text-sm">Compiling case dossier...</p>
      </div>
    );
  }

  if (!dispute) return null;

  const canModify = dispute.status === 'open' || dispute.status === 'evidence_gathering' || dispute.status === 'response_submitted';
  const displayScore = dispute.evidence_strength_score;
  const daysVal = dispute.days_remaining;

  const scoreColor = displayScore >= 70 ? 'text-emerald-400 border-emerald-500/30' : (displayScore >= 40 ? 'text-amber-400 border-amber-500/30' : 'text-red-400 border-red-500/30');
  const deadlineColor = dispute.urgency === 'expired' ? 'text-gray-500 border-gray-700 bg-gray-800/50' : (dispute.urgency === 'critical' ? 'text-red-500 border-red-500/30 bg-red-500/5 animate-pulse' : (dispute.urgency === 'warning' ? 'text-amber-400 border-amber-500/30 bg-amber-500/5' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5'));

  return (
    <div className="space-y-6 relative text-left font-body">
      
      {/* Back Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard/disputes')}
          className="flex items-center space-x-2 text-[var(--text-muted)] hover:text-white transition-colors text-xs font-mono font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dispute Center</span>
        </button>

        <div className="flex items-center space-x-3">
          {canModify && (
            <Button
              onClick={handleAcceptDispute}
              variant="danger"
              size="md"
            >
              Accept Liability
            </Button>
          )}

          <Button
            onClick={handleGeneratePdf}
            disabled={generatingPdf || !canModify}
            variant="gold"
            size="md"
          >
            {generatingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Plus className="h-3.5 w-3.5 mr-2" />}
            <span>Compile Defense Package</span>
          </Button>
        </div>
      </div>

      {/* Overview Block */}
      <Card variant="gold" className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">{dispute.dispute_reference}</h1>
            <Badge variant="outline">{dispute.payment_gateway.toUpperCase()}</Badge>
            <span className={`border px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase ${deadlineColor}`}>
              {dispute.urgency === 'expired' ? 'Expired' : `${daysVal} Days Remaining`}
            </span>
          </div>

          <p className="text-[var(--text-secondary)] text-sm">
            Disputed Charge of <b className="text-white">INR {dispute.dispute_amount.toLocaleString('en-IN')}</b> for customer <b>{dispute.customer_name || 'N/A'}</b> ({dispute.customer_email || 'No email'}).
          </p>

          <div className="bg-[var(--bg-inset)] border border-[var(--border-default)] p-4 rounded-[var(--radius-lg)] flex items-start space-x-3">
            <Info className="h-5 w-5 text-[var(--text-gold)] shrink-0 mt-0.5" />
            <div>
              <Label className="text-[var(--text-gold)]">Recommended Strategy</Label>
              <p className="text-[var(--text-secondary)] text-xs mt-1 leading-relaxed">{dispute.recommended_action}</p>
            </div>
          </div>
        </div>

        {/* Evidence Score Ring */}
        <div className="flex flex-col items-center justify-center p-4 border-l border-[var(--border-subtle)] lg:border-l-1 lg:border-t-0 border-t pt-6 lg:pt-4">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="var(--border-subtle)"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={displayScore >= 70 ? "#22c55e" : (displayScore >= 40 ? "#f59e0b" : "#ef4444")}
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
            {displayScore >= 70 ? 'Strong Case' : (displayScore >= 40 ? 'Moderate Case' : 'Weak Case')}
          </span>
        </div>
      </Card>

      {/* Main Workspace split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Checklist & Evidence documents */}
        <div className="lg:col-span-2 space-y-6">
          <Card variant="default">
            <div className="border-b border-[var(--border-default)] bg-[var(--bg-inset)] py-3 px-5 -mx-6 -mt-6 mb-6 flex items-center justify-between">
              <Heading3 className="text-white flex items-center">
                <FileText className="h-5 w-5 mr-2 text-[var(--text-gold)]" />
                Case Evidence Packages
              </Heading3>
              {canModify && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center space-x-1 text-xs text-[var(--text-gold)] hover:text-white font-mono font-bold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Document</span>
                </button>
              )}
            </div>

            {dispute.evidence.length === 0 ? (
              <div className="py-8 text-center text-[var(--text-muted)] text-xs font-mono">
                No evidence gathered. Log details or upload manual files.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {dispute.evidence.map((ev: any) => (
                  <div key={ev.id} className="py-4 hover:bg-[var(--bg-highlight)] transition-colors flex items-start justify-between gap-4 -mx-6 px-6">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded bg-[var(--bg-inset)] border border-[var(--border-default)] text-[var(--text-gold)] mt-0.5">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm uppercase">{ev.evidence_type.replace('_', ' ')}</div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5 uppercase tracking-wider font-semibold">Source: {ev.evidence_source}</div>
                        {ev.content_text && (
                          <div className="text-[var(--text-secondary)] text-xs mt-1.5 line-clamp-2 max-w-lg bg-[var(--bg-inset)] border border-[var(--border-default)] p-2 rounded-lg font-mono">
                            {ev.content_text}
                          </div>
                        )}
                        {ev.file_url && (
                          <a
                            href={`${API_BASE_URL.replace('/api/v1', '')}${ev.file_url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-[var(--text-gold)] hover:underline font-bold inline-flex items-center mt-2"
                          >
                            <Download className="h-3 w-3 mr-1" /> View Uploaded Document
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Include</span>
                        <button
                          type="button"
                          disabled={!canModify}
                          onClick={() => handleToggleEvidence(ev.id, ev.is_included_in_response)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            ev.is_included_in_response ? 'bg-[var(--color-primary)]' : 'bg-[var(--bg-inset)] border border-[var(--border-default)]'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              ev.is_included_in_response ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {canModify && ev.evidence_source === 'merchant_uploaded' && (
                        <button
                          onClick={() => handleDeleteEvidence(ev.id)}
                          className="text-[var(--text-muted)] hover:text-red-400 transition-colors p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Defense Document compilation widget */}
          {dispute.response_document_url && (
            <Card variant="gold" className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-[var(--color-primary-muted)] text-[var(--text-gold)] rounded-xl border border-[var(--color-primary-border)]">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Response Package Compiled</h3>
                  <Caption className="mt-0.5 block">Ready for submission to the payment gateway portal.</Caption>
                </div>
              </div>

              <a
                href={`${API_BASE_URL}/disputes/${dispute.id}/response-document`}
                download
                className="flex items-center space-x-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--text-inverse)] px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all w-full md:w-auto justify-center"
              >
                <Download className="h-4 w-4" />
                <span>Download Response PDF</span>
              </a>
            </Card>
          )}

          {/* Merchant Case Notes */}
          <Card variant="default">
            <div className="border-b border-[var(--border-default)] bg-[var(--bg-inset)] py-3 px-5 -mx-6 -mt-6 mb-6">
              <Heading3 className="text-white">Merchant Dossier Notes</Heading3>
            </div>
            <div className="space-y-3">
              <textarea
                rows={4}
                placeholder="Log notes, tracking codes, or gateway submission audit history here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-[var(--bg-inset)] border border-[var(--border-default)] text-white p-3 rounded-[var(--radius-md)] text-xs w-full focus:outline-none focus:border-[var(--color-primary)]"
              />
              <Button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                variant="ghost"
                size="sm"
              >
                {savingNotes && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                <span>Save Notes</span>
              </Button>
            </div>
          </Card>
        </div>

        {/* Right: History Timeline */}
        <div className="space-y-6">
          <Card variant="default">
            <div className="border-b border-[var(--border-default)] bg-[var(--bg-inset)] py-3 px-5 -mx-6 -mt-6 mb-6">
              <Heading3 className="text-white flex items-center">
                <Clock className="h-5 w-5 mr-2 text-[var(--text-gold)]" />
                Dossier Audit Timeline
              </Heading3>
            </div>
            <div className="relative border-l border-[var(--border-default)] ml-3 space-y-6">
              {dispute.timeline.map((item: any) => (
                <div key={item.id} className="relative pl-6">
                  <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-[var(--color-primary)] border border-[#111827]" />
                  <div className="text-[10px] font-mono text-[var(--text-muted)]">{new Date(item.created_at).toLocaleString('en-IN')}</div>
                  <div className="text-sm font-bold text-white mt-1 uppercase text-xs">{item.event_type.replace('_', ' ')}</div>
                  <p className="text-[var(--text-secondary)] text-xs mt-0.5 leading-relaxed">{item.event_description}</p>
                  <div className="text-[9px] text-[var(--text-muted)] mt-1 uppercase tracking-wider font-semibold">Triggered by: {item.triggered_by}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

      </div>

      {/* Manual Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 space-y-4 shadow-[var(--shadow-xl)] border border-[var(--border-default)]">
            <div className="flex justify-between items-center pb-4 border-b border-[var(--border-default)]">
              <Heading3 className="flex items-center"><Upload className="h-5 w-5 mr-2 text-[var(--text-gold)]" /> Index Custom Evidence</Heading3>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-white text-lg">&times;</button>
            </div>

            <form onSubmit={handleUploadEvidence} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Evidence Type Tag</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="bg-[var(--bg-inset)] border border-[var(--border-default)] text-white p-2.5 rounded-xl text-xs w-full focus:outline-none focus:border-[var(--color-primary)] font-bold"
                >
                  <option value="shipping_receipt">Shipping/Courier Receipt</option>
                  <option value="delivery_proof">Proof of Delivery Confirmation</option>
                  <option value="customer_communication">Customer Conversation Screenshot/Text</option>
                  <option value="order_confirmation">Invoice / Order Confirmation</option>
                  <option value="refund_policy">Store Return/Cancellation Policy</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Supporting Content Text</label>
                <textarea
                  rows={3}
                  placeholder="Paste chat message transcript, tracking log snippets, or verification emails..."
                  value={uploadText}
                  onChange={(e) => setUploadText(e.target.value)}
                  className="bg-[var(--bg-inset)] border border-[var(--border-default)] text-white p-2.5 rounded-xl text-xs w-full focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Attachment File (PDF, PNG, JPG - max 10MB)</label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  className="bg-[var(--bg-inset)] border border-[var(--border-default)] text-gray-300 p-2 rounded-xl text-xs w-full focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="flex items-center space-x-3 justify-end pt-4 border-t border-[var(--border-default)]">
                <Button
                  onClick={() => setShowUploadModal(false)}
                  variant="ghost"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={uploading}
                  variant="gold"
                >
                  {uploading ? 'Adding...' : 'Add Document'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
