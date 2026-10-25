import React, { useEffect, useMemo, useState } from 'react';
import { X, Download, ExternalLink, FileText, AlertTriangle, Check } from 'lucide-react';
import { UploadedDocument } from '../../types';

interface DocumentPreviewProps {
  document: UploadedDocument;
  onClose: () => void;
  /** Reviewer mode: mark the document verified without leaving the viewer. */
  onVerify?: () => void;
  /** Reviewer mode: reject with a mandatory reason. */
  onReject?: (reason: string) => void;
}

/** Convert a stored data URL into a blob URL so PDFs render reliably. */
function useBlobUrl(dataUrl: string): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!dataUrl?.startsWith('data:')) return;
    let created: string | null = null;
    try {
      const match = /^data:([^;]+);base64,([\s\S]*)$/.exec(dataUrl);
      if (!match) return;
      const [, mime, base64] = match;
      const binary = atob(base64.replace(/\s/g, ''));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      created = URL.createObjectURL(new Blob([bytes], { type: mime }));
      setUrl(created);
    } catch {
      setUrl(null);
    }
    return () => {
      if (created) URL.revokeObjectURL(created);
    };
  }, [dataUrl]);

  return url;
}

/**
 * Inline viewer for documents submitted with an application.
 * Images render directly; PDFs render in an embedded frame; anything else is
 * offered as a download so a reviewer is never blocked by an unsupported type.
 */
export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ document: doc, onClose, onVerify, onReject }) => {
  const blobUrl = useBlobUrl(doc.fileDataUrl);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const reviewerMode = Boolean(onVerify || onReject);
  const kind = useMemo(() => {
    const type = (doc.fileType || '').toLowerCase();
    if (type.includes('pdf') || doc.fileDataUrl.startsWith('data:application/pdf')) return 'pdf';
    if (type.startsWith('image/') || doc.fileDataUrl.startsWith('data:image/')) return 'image';
    return 'other';
  }, [doc.fileType, doc.fileDataUrl]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const download = () => {
    const anchor = window.document.createElement('a');
    anchor.href = blobUrl || doc.fileDataUrl;
    anchor.download = doc.fileName || 'document';
    anchor.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={`Preview ${doc.requirementName}`}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-[overlay-in_120ms_ease-out]" onClick={onClose} />

      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-[palette-in_140ms_ease-out] flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 py-3.5 border-b border-slate-200 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-slate-600" />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-slate-900 truncate">{doc.requirementName}</h2>
                <p className="text-[11px] text-slate-500 font-mono truncate">
                  {doc.fileName} · {(doc.fileSize / 1024).toFixed(0)} KB · uploaded{' '}
                  {new Date(doc.uploadedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={download}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
            {blobUrl && (
              <a
                href={blobUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#172b50] bg-slate-50 border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New tab</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 bg-slate-100 overflow-auto">
          {kind === 'image' && (
            <div className="h-full flex items-center justify-center p-4">
              <img
                src={blobUrl || doc.fileDataUrl}
                alt={doc.requirementName}
                className="max-h-full max-w-full object-contain rounded-lg shadow-sm bg-white"
              />
            </div>
          )}

          {kind === 'pdf' && blobUrl && (
            <iframe src={blobUrl} title={doc.fileName} className="w-full h-[70vh] bg-white" />
          )}

          {kind === 'pdf' && !blobUrl && (
            <div className="h-[50vh] flex flex-col items-center justify-center text-center px-6">
              <AlertTriangle className="w-7 h-7 text-amber-500" />
              <p className="text-sm font-semibold text-slate-800 mt-2">This PDF could not be embedded</p>
              <p className="text-xs text-slate-500 mt-1">Download it to review the full document.</p>
              <button
                onClick={download}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#172b50] rounded-lg"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </button>
            </div>
          )}

          {kind === 'other' && (
            <div className="h-[45vh] flex flex-col items-center justify-center text-center px-6">
              <FileText className="w-8 h-8 text-slate-400" />
              <p className="text-sm font-semibold text-slate-800 mt-2">Preview not available for this file type</p>
              <p className="text-xs text-slate-500 mt-1">Use download to open it with the appropriate application.</p>
              <button
                onClick={download}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#172b50] rounded-lg"
              >
                <Download className="w-3.5 h-3.5" />
                Download file
              </button>
            </div>
          )}
        </div>

        {doc.status === 'rejected' && doc.rejectionReason && (
          <div className="px-5 py-2.5 bg-rose-50 border-t border-rose-200 text-[11px] text-rose-800 shrink-0">
            Returned earlier: {doc.rejectionReason}
          </div>
        )}

        {/* Reviewer actions — verify straight after reading the document */}
        {reviewerMode && (
          <div className="border-t border-slate-200 bg-white shrink-0">
            {rejecting && (
              <div className="px-5 pt-3 space-y-2">
                <label className="text-[11px] font-semibold text-rose-900 block">
                  Why is this document being rejected?
                </label>
                <input
                  value={reason}
                  onChange={e => {
                    setReason(e.target.value);
                    setReasonError(null);
                  }}
                  placeholder="e.g. blurred scan, expired certificate, wrong document"
                  className="w-full px-3 py-2 text-xs border border-rose-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-400"
                  autoFocus
                />
                {reasonError && <p className="text-[11px] text-rose-700">{reasonError}</p>}
              </div>
            )}

            <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500">
                {doc.status === 'verified'
                  ? `Verified${doc.verifiedBy ? ' by ' + doc.verifiedBy : ''}`
                  : doc.status === 'rejected'
                    ? 'Rejected'
                    : 'Pending review'}
              </span>

              <div className="flex items-center gap-2">
                {onReject && !rejecting && (
                  <button
                    onClick={() => setRejecting(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-white border border-rose-300 hover:bg-rose-50 rounded-lg"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reject
                  </button>
                )}
                {onReject && rejecting && (
                  <>
                    <button
                      onClick={() => {
                        setRejecting(false);
                        setReason('');
                      }}
                      className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (!reason.trim()) {
                          setReasonError('A rejection reason is required.');
                          return;
                        }
                        onReject(reason.trim());
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
                    >
                      Confirm rejection
                    </button>
                  </>
                )}
                {onVerify && (
                  <button
                    onClick={onVerify}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {doc.status === 'verified' ? 'Verified' : 'Verify document'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
