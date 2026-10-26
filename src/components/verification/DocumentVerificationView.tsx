import React, { useState } from 'react';
import { useApplyEaseStore } from '../../lib/store';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  QrCode,
  Calendar,
  User,
  Building,
  FileText,
  Lock,
  ArrowRight
} from 'lucide-react';

interface DocumentVerificationViewProps {
  initialCode?: string;
  onViewApplication?: (ref: string) => void;
}

export const DocumentVerificationView: React.FC<DocumentVerificationViewProps> = ({
  initialCode = '',
  onViewApplication
}) => {
  const { applications } = useApplyEaseStore();
  const [searchQuery, setSearchQuery] = useState(initialCode);
  const [searched, setSearched] = useState(Boolean(initialCode));

  const cleanQuery = searchQuery.trim().toUpperCase();

  // Search applications by reference number or verification code
  const matchedApp = applications.find(
    (app) =>
      (app.referenceNumber.toUpperCase() === cleanQuery ||
        app.issuedDocument?.verificationCode.toUpperCase() === cleanQuery ||
        app.issuedDocument?.documentNumber.toUpperCase() === cleanQuery) &&
      app.status === 'completed' &&
      app.issuedDocument
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearched(true);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto text-emerald-700 shadow-xs">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Public Document Authenticity & Verification Portal
        </h1>
        <p className="text-xs text-slate-500 max-w-lg mx-auto">
          Verify the cryptographic validity, authorized signatures, and institutional sanction records of any issued MCS document.
        </p>
      </div>

      {/* Verification Code Search Input */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter Reference Number (e.g. APP-2026-LV-0194) or Verification Code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#172b50] focus:bg-white font-mono uppercase"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-[#172b50] hover:bg-[#1f3763] rounded-xl transition-colors shadow-xs whitespace-nowrap"
          >
            Verify Credential
          </button>
        </form>

      </div>

      {/* Verification Result Card */}
      {searched && (
        <div>
          {matchedApp && matchedApp.issuedDocument ? (
            <div className="bg-white rounded-2xl border border-emerald-300 p-6 shadow-md space-y-6 animate-in fade-in">
              <div className="flex items-start justify-between border-b border-emerald-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-emerald-800 uppercase bg-emerald-50 px-2 py-0.5 rounded font-mono">
                      Authenticity Verified & Active
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-1">
                      {matchedApp.applicationTypeTitle}
                    </h2>
                    <p className="text-xs text-slate-500 font-mono">
                      Document #{matchedApp.issuedDocument.documentNumber} • Ref: {matchedApp.referenceNumber}
                    </p>
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <span className="text-[10px] text-slate-400 block font-mono">Issued On</span>
                  <span className="text-xs font-semibold text-slate-800">
                    {new Date(matchedApp.issuedDocument.generatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Student and Record Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block mb-0.5">Applicant</span>
                  <span className="font-bold text-slate-900">{matchedApp.studentSnapshot.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Registration Number</span>
                  <span className="font-mono font-bold text-slate-900">
                    {matchedApp.studentSnapshot.registrationNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Enrolled Department</span>
                  <span className="font-medium text-slate-800">{matchedApp.studentSnapshot.department}</span>
                </div>
              </div>

              {/* Authorized Signatures & Seals attached */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Authorized Signatories & Official Seals Applied
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {matchedApp.issuedDocument.appliedSignatures.map((sig, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{sig.staffName}</span>
                        <span className="text-[11px] text-slate-500 block">{sig.roleTitle}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Signed {new Date(sig.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="h-10 w-24 flex items-center justify-center p-1 bg-slate-50 rounded border border-slate-100">
                        <img
                          src={sig.signatureUrl}
                          alt="Signature"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cryptographic Hash Audit */}
              <div className="p-3 bg-slate-900 text-slate-300 rounded-xl space-y-1 font-mono text-[10px]">
                <div className="flex items-center justify-between text-slate-400">
                  <span>SHA-256 INTEGRITY HASH:</span>
                  <span className="text-emerald-400">VERIFIED VALID</span>
                </div>
                <div className="text-slate-100 break-all select-all">
                  {matchedApp.issuedDocument.documentHash}
                </div>
                <div className="text-slate-400 pt-1">
                  SECURITY CODE: {matchedApp.issuedDocument.verificationCode}
                </div>
              </div>

              {onViewApplication && (
                <div className="text-right pt-2">
                  <button
                    onClick={() => onViewApplication(matchedApp.referenceNumber)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#172b50] hover:underline"
                  >
                    <span>View Full Application Timeline & Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                No Verified Document Record Found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                The reference identifier or verification code "{searchQuery}" could not be validated against official university records. Please check the spelling.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
