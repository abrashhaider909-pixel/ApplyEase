import React, { useState } from 'react';
import { Application, SignatureAsset, StampAsset, UploadedDocument } from '../../types';
import { useApplyEaseStore } from '../../lib/store';
import { StatusBadge } from '../common/StatusBadge';
import { DocumentPreview } from '../common/DocumentPreview';
import { buildIssuedDocumentPdf } from '../../lib/issuedDocument';
import { PDF_RENDER_VERSION } from '../../lib/officialPdf';
import { downloadDataUrl } from '../../lib/download';
import { evaluateStageSLA } from '../../lib/slaEngine';
import {
  canApplySignature,
  canReviewRecord,
  availableSignatures,
  availableStamps
} from '../../lib/access';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Clock,
  PenTool,
  ShieldCheck,
  Send,
  User,
  Building,
  Calendar,
  AlertTriangle,
  FileCheck,
  CheckSquare,
  Square,
  Eye,
  Download
} from 'lucide-react';

interface ApplicationReviewPaneProps {
  application: Application;
  onBack: () => void;
  onDecisionCompleted: () => void;
}

export const ApplicationReviewPane: React.FC<ApplicationReviewPaneProps> = ({
  application,
  onBack,
  onDecisionCompleted
}) => {
  const {
    currentUser,
    signatures,
    stamps,
    applicationTypes,
    processStageDecision,
    reviewDocument
  } = useApplyEaseStore();

  const currentStage = application.stageInstances[application.currentStageIndex];
  const sla = currentStage ? evaluateStageSLA(currentStage) : null;

  const stageDepartment = currentStage?.assignedDepartment || '';
  const canSeal = canApplySignature(currentUser, stageDepartment);
  const mySignatures = availableSignatures(currentUser, signatures);
  const myStamps = availableStamps(currentUser, stamps);
  const recordLocked =
    (application.status === 'completed' ||
      application.status === 'rejected' ||
      application.status === 'cancelled') &&
    !canReviewRecord(currentUser, application);
  const needsSeal = Boolean(currentStage?.requiresSignature || currentStage?.requiresStamp);

  // Decision inputs
  const [decisionNotes, setDecisionNotes] = useState('');
  const [selectedSignatureId, setSelectedSignatureId] = useState<string>(() => mySignatures[0]?.id || '');
  const [selectedStampId, setSelectedStampId] = useState<string>(() => myStamps[0]?.id || '');

  // Document preview (images/PDFs uploaded with the application)
  const [previewDoc, setPreviewDoc] = useState<UploadedDocument | null>(null);

  // Modal for signature & stamp confirmation
  const [showSignModal, setShowSignModal] = useState(false);
  const [explicitConsent, setExplicitConsent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Document review rejection note modal
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [docRejectionReason, setDocRejectionReason] = useState('');

  // Selected signature & stamp objects
  const activeSignature = signatures.find((s) => s.id === selectedSignatureId);
  const activeStamp = stamps.find((st) => st.id === selectedStampId);

  const handleApprove = async (withSignature = false) => {
    setIsProcessing(true);
    try {
      await processStageDecision({
        applicationId: application.id,
        action: 'approve',
        decisionNotes: decisionNotes.trim() || 'Verified and approved as per university regulations.',
        signatureAssetId: withSignature ? selectedSignatureId : undefined,
        stampAssetId: withSignature ? selectedStampId : undefined
      });
      setShowSignModal(false);
      onDecisionCompleted();
    } catch (e: any) {
      alert('Error advancing workflow: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!decisionNotes.trim()) {
      alert('Mandatory explanation note is required for rejecting an application.');
      return;
    }
    if (!confirm('Are you certain you wish to reject this application? This is an auditable action.')) {
      return;
    }

    setIsProcessing(true);
    try {
      await processStageDecision({
        applicationId: application.id,
        action: 'reject',
        decisionNotes: decisionNotes.trim()
      });
      onDecisionCompleted();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestCorrection = async () => {
    if (!decisionNotes.trim()) {
      alert('Please specify the exact clarification or document replacement required from the student.');
      return;
    }

    setIsProcessing(true);
    try {
      await processStageDecision({
        applicationId: application.id,
        action: 'request_correction',
        decisionNotes: decisionNotes.trim()
      });
      onDecisionCompleted();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDocumentAction = (docId: string, status: 'verified' | 'rejected', reason?: string) => {
    reviewDocument({
      applicationId: application.id,
      documentId: docId,
      status,
      rejectionReason: reason
    });
    setRejectingDocId(null);
    setDocRejectionReason('');
  };

  /** Download the sealed order; older records are rendered on demand. */
  const handleDownloadIssued = async () => {
    const issued = application.issuedDocument;
    if (!issued) return;
    let dataUrl = issued.pdfDataUrl && issued.pdfVersion === PDF_RENDER_VERSION ? issued.pdfDataUrl : undefined;
    if (!dataUrl) {
      const template = applicationTypes.find(t => t.id === application.applicationTypeId)?.documentTemplate;
      dataUrl = (await buildIssuedDocumentPdf(application, template)) || undefined;
    }
    if (!dataUrl) {
      alert('The issued PDF could not be generated for this record.');
      return;
    }
    downloadDataUrl(dataUrl, `${application.referenceNumber}_Official_Certificate.pdf`);
  };

  // A closed file is only visible to the registrar and the student's own HOD.
  if (recordLocked) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xs p-8 text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-slate-500" />
        </div>
        <h2 className="text-base font-bold text-slate-900">This record is closed</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Completed student records are held by the Registrar and the Head of the student's
          department. Your access to {application.referenceNumber} ended when the file was closed.
        </p>
        <button
          onClick={onBack}
          className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#172b50] rounded-lg"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to records
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Task Queue</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">
            {application.referenceNumber}
          </span>
          <StatusBadge status={application.status} size="sm" />
        </div>
      </div>

      {/* Main Split-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane (7 Cols): Application Particulars, Form Values & Documents */}
        <div className="lg:col-span-7 space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[11px] font-mono text-slate-500 block mb-1">
                Submitted on {new Date(application.createdAt).toLocaleDateString()} • v{application.templateVersion}
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {application.applicationTypeTitle}
              </h1>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-600">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-900">
                  {application.studentSnapshot.name}
                </span>
                <span>•</span>
                <span className="font-mono">{application.studentSnapshot.registrationNumber}</span>
                <span>•</span>
                <span>{application.studentSnapshot.department}</span>
              </div>
            </div>

            {/* Submitted Form Fields Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Submitted Application Data
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                {Object.keys(application.formData).map((key) => {
                  const val = application.formData[key];
                  if (key === 'student_name' || key === 'reg_no') return null;

                  const formattedLabel = key
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (c) => c.toUpperCase());

                  return (
                    <div
                      key={key}
                      className={typeof val === 'string' && val.length > 50 ? 'sm:col-span-2' : ''}
                    >
                      <span className="text-slate-400 text-[11px] block">{formattedLabel}</span>
                      <span className="font-semibold text-slate-900 block mt-0.5">
                        {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val || '—')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Supporting Documents Verification Checklist */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Supporting Document Credentials ({application.uploadedDocuments.length})
                </h3>
                <span className="text-[11px] text-slate-400">
                  Click to inspect & verify
                </span>
              </div>

              {application.uploadedDocuments.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No document uploads required for this application type.</p>
              ) : (
                <div className="space-y-3">
                  {application.uploadedDocuments.map((doc) => {
                    const isVerified = doc.status === 'verified';
                    const isRejected = doc.status === 'rejected';

                    return (
                      <div
                        key={doc.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isVerified
                            ? 'border-emerald-200 bg-emerald-50/20'
                            : isRejected
                            ? 'border-rose-200 bg-rose-50/20'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-600 overflow-hidden hover:border-[#172b50] transition-colors"
                              title="Open document preview"
                            >
                              {doc.fileDataUrl.startsWith('data:image/') ? (
                                <img src={doc.fileDataUrl} alt={doc.fileName} className="w-full h-full object-cover" />
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                            </button>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-slate-900">
                                  {doc.requirementName}
                                </h4>
                                {isVerified ? (
                                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                                    Verified
                                  </span>
                                ) : isRejected ? (
                                  <span className="text-[10px] font-semibold text-rose-800 bg-rose-100 px-1.5 py-0.2 rounded">
                                    Rejected
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                                    Pending Review
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => setPreviewDoc(doc)}
                                className="text-[11px] text-slate-600 hover:text-[#172b50] font-mono mt-0.5 inline-flex items-center gap-1 underline decoration-dotted underline-offset-2"
                              >
                                <Eye className="w-3 h-3" />
                                {doc.fileName}
                              </button>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {' '}· {(doc.fileSize / 1024).toFixed(0)} KB
                              </span>
                              {doc.rejectionReason && (
                                <p className="text-[11px] text-rose-600 mt-1 font-medium">
                                  Rejection Note: {doc.rejectionReason}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Verification Buttons */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDocumentAction(doc.id, 'verified')}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1 ${
                                isVerified
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{isVerified ? 'Verified' : 'Verify'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setRejectingDocId(doc.id);
                                setDocRejectionReason('');
                              }}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1 ${
                                isRejected
                                  ? 'bg-rose-700 text-white'
                                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-300'
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </div>

                        {/* Rejection Note Input Popup if currently rejecting */}
                        {rejectingDocId === doc.id && (
                          <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                            <label className="text-[11px] font-semibold text-rose-900 block">
                              Mandatory Document Rejection Explanation:
                            </label>
                            <input
                              type="text"
                              value={docRejectionReason}
                              onChange={(e) => setDocRejectionReason(e.target.value)}
                              placeholder="e.g. Blurry image scan, expired certificate, missing signature..."
                              className="w-full px-3 py-1.5 text-xs bg-white border border-rose-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setRejectingDocId(null)}
                                className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!docRejectionReason.trim()) {
                                    alert('Please provide an explanation for rejecting this document.');
                                    return;
                                  }
                                  handleDocumentAction(doc.id, 'rejected', docRejectionReason);
                                }}
                                className="px-3 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                              >
                                Confirm Rejection
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Pane (5 Cols): Stage Decision Engine & Action Controls */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Stage & SLA Tracker Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                  Active Workflow Stage
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {currentStage?.name}
                </h3>
              </div>
              {sla?.isOverdue ? (
                <div className="text-right">
                  <span className="text-[10px] font-bold text-rose-600 block uppercase font-mono">
                    Warning {sla.warningLevel} Overdue
                  </span>
                  <span className="text-xs font-bold text-rose-700 font-mono tabular-nums">
                    {sla.formattedRemaining}
                  </span>
                </div>
              ) : (
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">
                    SLA Target
                  </span>
                  <span className="text-xs font-semibold text-slate-700 font-mono tabular-nums">
                    {sla?.formattedRemaining}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Department:</span>
                <span className="font-semibold text-slate-800">{currentStage?.assignedDepartment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Role:</span>
                <span className="font-semibold text-slate-800">{currentStage?.assignedRole}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Electronic Signature:</span>
                <span className="font-semibold text-purple-700">
                  {currentStage?.requiresSignature ? 'Required for Approval' : 'Optional / Not Required'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Official Seal / Stamp:</span>
                <span className="font-semibold text-navy-800">
                  {currentStage?.requiresStamp ? 'Affixed upon Sanction' : 'Optional / Not Required'}
                </span>
              </div>
            </div>

            {application.issuedDocument && (
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                    Official document issued
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                </div>
                <p className="text-[11px] text-slate-700 font-mono break-all">
                  {application.issuedDocument.documentNumber}
                </p>
                <p className="text-[10px] text-slate-500 font-mono break-all">
                  Verification code: {application.issuedDocument.verificationCode}
                </p>
                <button
                  type="button"
                  onClick={handleDownloadIssued}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-900 bg-white border border-emerald-300 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download official PDF</span>
                </button>
              </div>
            )}

            {/* Decision Notes Input */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold text-slate-900">
                Official Decision Notes & Comments:
              </label>
              <textarea
                rows={3}
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="Enter formal justification, review notes, or correction instructions..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50] focus:bg-white"
              />
            </div>

            {/* Consequential Action Buttons */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              {/* Primary Approval / Signature Action */}
              <button
                type="button"
                disabled={isProcessing || (needsSeal && !canSeal)}
                onClick={() => {
                  if (needsSeal && !canSeal) return;
                  if (needsSeal) {
                    setShowSignModal(true);
                  } else {
                    handleApprove(false);
                  }
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:text-slate-600 rounded-xl transition-colors shadow-xs"
              >
                {needsSeal && !canSeal ? (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Awaiting Head of Department signature</span>
                  </>
                ) : currentStage?.requiresSignature ? (
                  <>
                    <PenTool className="w-4 h-4" />
                    <span>Authorize, Sign & Approve Stage</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Stage & Forward</span>
                  </>
                )}
              </button>

              {needsSeal && !canSeal && (
                <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
                  Stage “{currentStage?.name}” carries a signature and official seal. It must be
                  completed by the Head of {stageDepartment}; the administrator and other faculty
                  cannot sign on that department's behalf.
                </p>
              )}

              {/* Request Correction Button */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleRequestCorrection}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl transition-colors"
              >
                <AlertCircle className="w-4 h-4 text-amber-700" />
                <span>Request Correction from Student</span>
              </button>

              {/* Reject Application Button */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleReject}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-xl transition-colors"
              >
                <XCircle className="w-4 h-4 text-rose-700" />
                <span>Reject Application with Reason</span>
              </button>
            </div>
          </div>

          {/* Timeline Mini-Tracker */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Prior Audit Actions
            </h4>
            <div className="space-y-3 text-xs">
              {application.timeline.map((item) => (
                <div key={item.id} className="border-l-2 border-slate-200 pl-3 py-0.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-600">{item.actorName}</span>
                    <span className="font-mono">
                      {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-slate-900 font-medium text-xs mt-0.5">{item.title}</p>
                  <p className="text-slate-500 text-[11px] line-clamp-1">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Explicit Electronic Signature & Official Stamp Authorization Modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-[#172b50]" />
                <h3 className="text-base font-bold text-slate-900">
                  Electronic Signature & Seal Authorization
                </h3>
              </div>
              <button
                onClick={() => setShowSignModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              As the signing officer for <strong>{currentUser.department}</strong> (
              {currentUser.designation}), you are applying your registered signature and the
              department's official seal to <strong>{application.referenceNumber}</strong>.
            </p>

            {/* Signature Asset Selection & Preview */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                Select Authorized Signature Asset:
              </label>
              {mySignatures.length === 0 && (
                <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  No active signature is registered for you in {currentUser.department}. The
                  administrator must provision your signature asset before this stage can be signed.
                </p>
              )}
              <select
                value={selectedSignatureId}
                onChange={(e) => setSelectedSignatureId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]"
              >
                {mySignatures.map((sig) => (
                  <option key={sig.id} value={sig.id}>
                    {sig.name} ({sig.ownerRole} • {sig.department})
                  </option>
                ))}
              </select>

              {activeSignature && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Transparent Asset Preview</span>
                    <span className="text-xs font-semibold text-slate-800">{activeSignature.ownerName}</span>
                    <span className="text-[10px] font-mono text-slate-500 block">Audit Hash: {activeSignature.auditHash.substring(0, 16)}...</span>
                  </div>
                  <div className="h-12 w-28 bg-white border border-slate-200 rounded flex items-center justify-center p-1">
                    <img
                      src={activeSignature.imageUrl}
                      alt="Signature Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Stamp Asset Selection & Preview */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                Select Official Seal / Stamp Asset:
              </label>
              {myStamps.length === 0 && (
                <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  No official seal is registered for {currentUser.department}. Ask the administrator
                  to issue the department seal.
                </p>
              )}

              <select
                value={selectedStampId}
                onChange={(e) => setSelectedStampId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]"
              >
                {myStamps.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.department})
                  </option>
                ))}
              </select>

              {activeStamp && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Official Seal Preview</span>
                    <span className="text-xs font-semibold text-slate-800">{activeStamp.name}</span>
                    <span className="text-[10px] font-mono text-slate-500 block">Audit Hash: {activeStamp.auditHash.substring(0, 16)}...</span>
                  </div>
                  <div className="h-12 w-12 bg-white border border-slate-200 rounded flex items-center justify-center p-1">
                    <img
                      src={activeStamp.imageUrl}
                      alt="Stamp Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Strict Legal & Policy Authorization Checkbox */}
            <div className="p-3.5 bg-orange-50/50 border border-orange-200 rounded-xl">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={explicitConsent}
                  onChange={(e) => setExplicitConsent(e.target.checked)}
                  className="w-4 h-4 text-[#172b50] border-slate-300 rounded focus:ring-1 focus:ring-[#172b50] mt-0.5"
                />
                <span className="text-xs text-slate-800 leading-snug select-none">
                  I explicitly confirm that I have verified the student application particulars and hereby authorize the embedding of my electronic signature and official seal for this decision.
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSignModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  !explicitConsent ||
                  isProcessing ||
                  (Boolean(currentStage?.requiresSignature) && !selectedSignatureId) ||
                  (Boolean(currentStage?.requiresStamp) && !selectedStampId)
                }
                onClick={() => handleApprove(true)}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 rounded-lg transition-colors shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Affix Electronic Signatures</span>
              </button>            </div>
          </div>
        </div>
      )}

      {previewDoc && (
        <DocumentPreview
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
          onVerify={() => {
            handleDocumentAction(previewDoc.id, 'verified');
            setPreviewDoc(null);
          }}
          onReject={reason => {
            handleDocumentAction(previewDoc.id, 'rejected', reason);
            setPreviewDoc(null);
          }}
        />
      )}
    </div>
  );
};
