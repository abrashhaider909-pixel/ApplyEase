import React, { useState } from 'react';
import { Application, UploadedDocument } from '../../types';
import { useApplyEaseStore } from '../../lib/store';
import { StatusBadge } from '../common/StatusBadge';
import { DocumentPreview } from '../common/DocumentPreview';
import { evaluateStageSLA } from '../../lib/slaEngine';
import { renderDocumentText } from '../../lib/pdfGenerator';
import { buildOfficialDocumentPdf } from '../../lib/officialPdf';
import { PDF_RENDER_VERSION } from '../../lib/officialPdf';
import { downloadDataUrl } from '../../lib/download';
import { VerificationQr } from '../common/VerificationQr';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Download,
  ShieldCheck,
  FileText,
  User,
  Building,
  Calendar,
  AlertCircle,
  ExternalLink,
  QrCode,
  PenTool
} from 'lucide-react';

interface ApplicationTrackerProps {
  application: Application;
  onBack: () => void;
  onOpenVerification?: (code: string) => void;
}

export const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({
  application,
  onBack,
  onOpenVerification
}) => {
  const { applicationTypes, resubmitCorrection, currentUser } = useApplyEaseStore();
  const [correctionText, setCorrectionText] = useState('');
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<UploadedDocument | null>(null);

  const appType = applicationTypes.find((t) => t.id === application.applicationTypeId);
  const currentStage = application.stageInstances[application.currentStageIndex];
  const isCompleted = application.status === 'completed';
  const issuedDoc = application.issuedDocument;

  // SLA evaluation
  const slaStatus = currentStage ? evaluateStageSLA(currentStage) : null;

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      // The sealed PDF is rendered once at issuance; reuse it when present so
      // every party downloads the identical file.
      let dataUrl =
        issuedDoc?.pdfDataUrl && issuedDoc.pdfVersion === PDF_RENDER_VERSION
          ? issuedDoc.pdfDataUrl
          : undefined;
      if (!dataUrl) {
        const template = applicationTypes.find(t => t.id === application.applicationTypeId)?.documentTemplate;
        dataUrl = (await buildOfficialDocumentPdf(application, template)) || undefined;
      }
      if (!dataUrl) {
        alert('The document PDF could not be generated.');
        return;
      }
      downloadDataUrl(dataUrl, `${application.referenceNumber}_Official_Certificate.pdf`);
    } catch (e: any) {
      alert('Could not export PDF: ' + e.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleResubmitCorrection = () => {
    if (!correctionText.trim()) {
      alert('Please provide an explanatory response before resubmitting.');
      return;
    }
    setIsSubmittingCorrection(true);
    try {
      resubmitCorrection({
        applicationId: application.id,
        updatedFormData: {
          ...application.formData,
          student_correction_response: correctionText
        }
      });
      alert('Correction submitted! Review will now resume.');
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button and quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Applications</span>
        </button>

        <div className="flex items-center gap-3">
          {isCompleted && (
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#172b50] hover:bg-[#1f3763] rounded-lg transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? 'Generating PDF...' : 'Download Official PDF'}</span>
            </button>
          )}

          {issuedDoc && onOpenVerification && (
            <button
              onClick={() => onOpenVerification(issuedDoc.verificationCode)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verify Integrity</span>
            </button>
          )}
        </div>
      </div>

      {/* Overview Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold text-[#172b50] bg-slate-100 px-2 py-0.5 rounded">
                {application.referenceNumber}
              </span>
              <StatusBadge status={application.status} />
              <span className="text-slate-400 text-xs">·</span>
              <span className="text-xs text-slate-500 font-mono">v{application.templateVersion} Form</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {application.applicationTypeTitle}
            </h1>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <div>
              <span className="text-[11px] text-slate-400 block">Submitted On</span>
              <span className="font-medium text-slate-800">
                {application.submissionDate
                  ? new Date(application.submissionDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })
                  : 'N/A'}
              </span>
            </div>
            <div className="border-l border-slate-200 pl-4">
              <span className="text-[11px] text-slate-400 block">Target SLA</span>
              <span className="font-medium text-slate-800">
                {application.targetDeadline
                  ? new Date(application.targetDeadline).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Correction Action Callout (if awaiting student action) */}
        {application.status === 'awaiting_student_action' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">
                  Reviewer Requested Correction / Clarification
                </h4>
                <p className="text-xs text-amber-800 mt-1">
                  "{application.correctionRequestNote}"
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-amber-200/60">
              <label className="text-xs font-semibold text-amber-950 block">
                Provide Clarification Response:
              </label>
              <textarea
                rows={2}
                value={correctionText}
                onChange={(e) => setCorrectionText(e.target.value)}
                placeholder="Type your response or update here..."
                className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                onClick={handleResubmitCorrection}
                disabled={isSubmittingCorrection}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-800 hover:bg-amber-900 rounded-lg transition-colors shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Submit Response & Resume Processing</span>
              </button>
            </div>
          </div>
        )}

        {/* Workflow Stage Connected Disks / Circles Stepper */}
        <div className="pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Workflow Progression Pipeline
            </h3>
            {/* Color Legend */}
            <div className="flex items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block shrink-0 shadow-xs" />
                <span className="font-semibold text-emerald-900">Green = Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block shrink-0 shadow-xs animate-pulse ring-2 ring-yellow-200" />
                <span className="font-semibold text-yellow-950">Yellow = Current Active Stage</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-300 inline-block shrink-0" />
                <span className="text-slate-500">Gray = Upcoming</span>
              </div>
            </div>
          </div>

          {/* Connected Circles / Disks Bar */}
          <div className="p-4 sm:p-6 bg-slate-50/70 rounded-2xl border border-slate-200 overflow-x-auto">
            <div className="flex items-start min-w-[580px] justify-between relative">
              {application.stageInstances.map((stg, idx) => {
                const isPast = stg.status === 'completed';
                const isCurrent = idx === application.currentStageIndex && !isCompleted;
                const isUpcoming = !isPast && !isCurrent;
                const isLast = idx === application.stageInstances.length - 1;

                // Color configuration
                // Completed = Green
                // Current = Yellow
                // Upcoming = Gray
                const diskColor = isPast
                  ? 'bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100 border-2 border-emerald-500'
                  : isCurrent
                  ? 'bg-yellow-400 text-yellow-950 font-extrabold shadow-lg ring-4 ring-yellow-200 animate-pulse border-2 border-yellow-500'
                  : 'bg-slate-200 text-slate-500 border border-slate-300';

                const connectorColor = isPast
                  ? 'bg-emerald-500'
                  : isCurrent
                  ? 'bg-gradient-to-r from-emerald-500 to-yellow-300'
                  : 'bg-slate-200';

                return (
                  <div key={stg.stageId} className="flex-1 flex flex-col items-center relative group">
                    {/* Horizontal Connector Line (rendered between circles) */}
                    {!isLast && (
                      <div
                        className={`absolute top-6 left-1/2 w-full h-1.5 -translate-y-1/2 z-0 ${connectorColor}`}
                        style={{ width: '100%' }}
                      />
                    )}

                    {/* Circular Disk */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${diskColor}`}
                    >
                      {isPast ? (
                        <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                      ) : isCurrent ? (
                        <span className="text-base font-extrabold font-mono">{idx + 1}</span>
                      ) : (
                        <span className="text-sm font-semibold font-mono">{idx + 1}</span>
                      )}
                    </div>

                    {/* Stage Label & Details below disk */}
                    <div className="mt-3 text-center px-1 max-w-[140px]">
                      <div className="flex items-center justify-center mb-1">
                        {isPast ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Completed
                          </span>
                        ) : isCurrent ? (
                          <span className="text-[10px] font-bold text-yellow-950 bg-yellow-100 px-2 py-0.5 rounded-full border border-yellow-300 shadow-xs">
                            Active Stage
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            Stage {idx + 1}
                          </span>
                        )}
                      </div>

                      <h5 className="text-xs font-bold text-slate-900 leading-tight line-clamp-2">
                        {stg.name}
                      </h5>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {stg.assignedDepartment}
                      </p>

                      {stg.completedAt && (
                        <span className="text-[9px] text-slate-400 font-mono block mt-1">
                          {new Date(stg.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Left Column = Application Particulars & Documents; Right Column = Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Submitted Form Details */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              Submitted Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Applicant Name</span>
                <span className="font-semibold text-slate-900">
                  {application.studentSnapshot.name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Registration Number</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {application.studentSnapshot.registrationNumber}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Department</span>
                <span className="font-medium text-slate-800">
                  {application.studentSnapshot.department}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">University Email</span>
                <span className="font-medium text-slate-800 font-mono">
                  {application.studentSnapshot.email}
                </span>
              </div>

              {/* Dynamic form keys */}
              {Object.keys(application.formData).map((key) => {
                const val = application.formData[key];
                if (key === 'student_name' || key === 'reg_no') return null;

                const formattedLabel = key
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (c) => c.toUpperCase());

                return (
                  <div key={key} className={typeof val === 'string' && val.length > 50 ? 'sm:col-span-2' : ''}>
                    <span className="text-slate-400 block mb-0.5">{formattedLabel}</span>
                    <span className="font-medium text-slate-800">
                      {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val || '—')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Attached Documents */}
            {application.uploadedDocuments.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 mb-3">
                  Uploaded Supporting Documents ({application.uploadedDocuments.length})
                </h4>
                <div className="space-y-2">
                  {application.uploadedDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                        <div className="truncate">
                          <span className="font-semibold text-slate-900 block truncate">
                            {doc.requirementName}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="text-[11px] text-slate-500 hover:text-[#172b50] font-mono underline decoration-dotted underline-offset-2"
                          >
                            {doc.fileName} • {(doc.fileSize / 1024).toFixed(0)} KB
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {doc.status === 'verified' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified
                          </span>
                        ) : doc.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                            <AlertCircle className="w-3 h-3" />
                            Rejected
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            Pending Verification
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* If Application is Completed: Official Issued Document Live Render & Certificate Preview */}
          {isCompleted && issuedDoc && appType && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      Official Issued Document Preview
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Doc #{issuedDoc.documentNumber} • Auth Code: {issuedDoc.verificationCode}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#f4772e] hover:bg-[#de6219] rounded-lg transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>

              {/* Printable Official Document Container (used for both preview and html2canvas PDF rendering) */}
              <div className="p-4 sm:p-8 bg-slate-100 flex justify-center overflow-x-auto">
                <div
                  id="official-document-render-container"
                  className="w-[680px] min-h-[920px] bg-white border border-slate-300 p-10 shadow-lg text-slate-900 relative flex flex-col justify-between"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {/* Watermark Crest behind document */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                    <img
                      src="/assets/aistudio/image_133404a9.png"
                      alt="Watermark"
                      className="w-96 h-96 object-contain"
                    />
                  </div>

                  {/* Document Header */}
                  <div>
                    <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
                      <div className="flex items-center gap-3">
                        <img
                          src="/assets/aistudio/image_133404a9.png"
                          alt="University Seal"
                          className="w-14 h-14 object-contain"
                        />
                        <div>
                          <h2 className="text-base font-extrabold tracking-tight text-[#172b50]">
                            MCS
                          </h2>
                          <p className="text-[11px] font-semibold text-slate-600 tracking-wider">
                            OFFICE OF ACADEMIC AFFAIRS & REGISTRATION
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            REF: {application.referenceNumber} • ISSUED: {new Date(issuedDoc.generatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Verification QR Code */}
                      <div className="text-center">
                        <VerificationQr
                          code={issuedDoc.verificationCode}
                          size={56}
                          className="border border-slate-200 p-0.5 rounded bg-white"
                        />
                        <span className="text-[8px] font-mono block text-slate-500 mt-0.5">
                          SCAN TO VERIFY
                        </span>
                      </div>
                    </div>

                    {/* Document Title */}
                    <div className="text-center my-6">
                      <h1 className="text-lg font-extrabold tracking-wider text-[#172b50] border-y border-slate-200 py-1.5 uppercase">
                        {appType.documentTemplate.title}
                      </h1>
                      <p className="text-[10px] font-medium text-slate-500 mt-1 italic">
                        {appType.documentTemplate.subtitle || 'Official Sanction Order'}
                      </p>
                    </div>

                    {/* Document Body Paragraphs */}
                    <div className="space-y-4 text-xs leading-relaxed text-slate-800 text-justify">
                      {appType.documentTemplate.bodyParagraphs.map((para, pIdx) => (
                        <p key={pIdx}>
                          {renderDocumentText(para, application)}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Signatures & Stamps Section with Realistic Transparency */}
                  <div className="mt-8 pt-6 border-t border-slate-200">
                    <div className="flex items-end justify-between relative min-h-[120px]">
                      {/* Left Side: Department Authority & Seal */}
                      <div className="relative text-left">
                        {/* Transparent Seal Overlay */}
                        {issuedDoc.appliedStamps[0] && (
                          <div className="absolute -top-10 left-6 pointer-events-none select-none z-10">
                            <img
                              src={issuedDoc.appliedStamps[0].stampUrl}
                              alt="Official Seal"
                              className="w-28 h-28 object-contain"
                              style={{ transform: 'rotate(-5deg)', opacity: 0.9 }}
                            />
                          </div>
                        )}

                        {/* Signature */}
                        {issuedDoc.appliedSignatures[0] && (
                          <div className="h-14 flex items-end">
                            <img
                              src={issuedDoc.appliedSignatures[0].signatureUrl}
                              alt="Signature"
                              className="h-12 object-contain"
                            />
                          </div>
                        )}
                        <div className="border-t border-slate-800 pt-1 w-44 mt-1">
                          <p className="text-xs font-bold text-slate-900">
                            {issuedDoc.appliedSignatures[0]?.staffName || 'Head of Department'}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {issuedDoc.appliedSignatures[0]?.roleTitle || 'Departmental Authority'}
                          </p>
                          <p className="text-[9px] text-slate-400 font-mono">
                            Digitally Signed: {new Date(issuedDoc.generatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Right Side: University Registrar / Final Approver */}
                      <div className="relative text-right">
                        {/* Stamp 2 if available */}
                        {issuedDoc.appliedStamps[1] && (
                          <div className="absolute -top-10 right-8 pointer-events-none select-none z-10">
                            <img
                              src={issuedDoc.appliedStamps[1].stampUrl}
                              alt="Official Stamp"
                              className="w-28 h-28 object-contain"
                              style={{ transform: 'rotate(4deg)', opacity: 0.88 }}
                            />
                          </div>
                        )}

                        {/* Signature 2 */}
                        <div className="h-14 flex items-end justify-end">
                          {issuedDoc.appliedSignatures[1] ? (
                            <img
                              src={issuedDoc.appliedSignatures[1].signatureUrl}
                              alt="Signature"
                              className="h-12 object-contain"
                            />
                          ) : (
                            issuedDoc.appliedSignatures[0] && (
                              <img
                                src={issuedDoc.appliedSignatures[0].signatureUrl}
                                alt="Signature"
                                className="h-12 object-contain"
                              />
                            )
                          )}
                        </div>
                        <div className="border-t border-slate-800 pt-1 w-44 ml-auto mt-1">
                          <p className="text-xs font-bold text-slate-900">
                            {issuedDoc.appliedSignatures[1]?.staffName || 'University Registrar'}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {issuedDoc.appliedSignatures[1]?.roleTitle || 'Authorized Signatory'}
                          </p>
                          <p className="text-[9px] text-slate-400 font-mono">
                            Digitally Signed: {new Date(issuedDoc.generatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Official Security Footer */}
                    <div className="mt-8 pt-3 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                      <div>
                        HASH: {issuedDoc.documentHash.substring(0, 32)}...
                      </div>
                      <div>
                        SECURITY AUDIT CODE: {issuedDoc.verificationCode}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Detailed Chronological Timeline */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              Chronological Timeline & Audit Events
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {application.timeline.map((event) => {
                const isWarn = event.type === 'warning' || event.type === 'escalation';
                const isGood = event.type === 'approval' || event.type === 'signature' || event.type === 'issuance';

                return (
                  <div key={event.id} className="relative group">
                    {/* Node Dot */}
                    <div
                      className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center shrink-0 ${
                        isGood
                          ? 'bg-emerald-600'
                          : isWarn
                          ? 'bg-amber-600'
                          : event.type === 'rejection'
                          ? 'bg-rose-600'
                          : 'bg-[#172b50]'
                      }`}
                    />

                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
                        <span className="font-semibold text-slate-600">{event.stageName}</span>
                        <span className="font-mono">
                          {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900">
                        {event.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {event.description}
                      </p>

                      <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                        <User className="w-3 h-3" />
                        <span>{event.actorName}</span>
                        <span>·</span>
                        <span className="capitalize">{event.actorRole}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {previewDoc && (
        <DocumentPreview document={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  );
};
