import React, { useMemo, useRef, useState } from 'react';
import { useApplyEaseStore } from '../../lib/store';
import { UploadedDocument } from '../../types';
import {
  buildCustomStages,
  listSignatoryOptions
} from '../../lib/customApplication';
import { toast } from '../../lib/toast';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Paperclip,
  PenLine,
  Send,
  Trash2,
  Upload,
  UserCheck,
  X
} from 'lucide-react';

interface CustomApplicationFormProps {
  onCancel: () => void;
  onSubmitted: (referenceNumber: string) => void;
}

const MAX_FILE_MB = 5;
const MAX_FILES = 8;

const CATEGORIES = [
  { value: 'academic', label: 'Academic Affairs' },
  { value: 'hostel', label: 'Hostel & Residential' },
  { value: 'administrative', label: 'Administrative & Records' },
  { value: 'financial', label: 'Finance & Accounts' }
];

type Step = 1 | 2 | 3;

export const CustomApplicationForm: React.FC<CustomApplicationFormProps> = ({ onCancel, onSubmitted }) => {
  const { currentUser, users, signatures, stamps, createApplication } = useApplyEaseStore();

  const [step, setStep] = useState<Step>(1);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('academic');
  const [statement, setStatement] = useState('');
  const [neededBy, setNeededBy] = useState('');
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [route, setRoute] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const options = useMemo(() => listSignatoryOptions(users, signatures, stamps), [users, signatures, stamps]);
  const routeOptions = options.filter(option => option.hasSignature);
  const chosen = route.map(id => routeOptions.find(option => option.staffId === id)).filter(Boolean);

  const subjectError = subject.trim().length < 4 ? 'Give your application a short title (at least 4 characters).' : '';
  const statementError = statement.trim().length < 20 ? 'Describe what you are requesting (at least 20 characters).' : '';
  const canContinueFromStep1 = !subjectError && !statementError;
  const canSubmit = canContinueFromStep1 && route.length > 0 && !submitting;

  const addFiles = async (fileList: FileList | File[]) => {
    const incoming = Array.from(fileList);
    const accepted: UploadedDocument[] = [];

    for (const file of incoming) {
      if (documents.length + accepted.length >= MAX_FILES) {
        toast('error', `You can attach up to ${MAX_FILES} documents.`);
        break;
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        toast('error', `"${file.name}" is larger than ${MAX_FILE_MB} MB. Please compress it first.`);
        continue;
      }

      const dataUrl = await new Promise<string | null>(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
      if (!dataUrl) {
        toast('error', `Could not read "${file.name}".`);
        continue;
      }

      accepted.push({
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        requirementId: 'custom',
        requirementName: 'Supporting document',
        fileName: file.name,
        fileDataUrl: dataUrl,
        fileSize: file.size,
        fileType: file.type || 'application/octet-stream',
        uploadedAt: new Date().toISOString(),
        status: 'pending'
      });
    }

    if (accepted.length) setDocuments(prev => [...prev, ...accepted]);
  };

  const toggleSignatory = (staffId: string) => {
    setRoute(prev => (prev.includes(staffId) ? prev.filter(id => id !== staffId) : [...prev, staffId]));
  };

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const stages = buildCustomStages(chosen as any);
      const created = await createApplication({
        applicationTypeId: 'custom',
        formData: {
          custom_subject: subject.trim(),
          custom_category: CATEGORIES.find(item => item.value === category)?.label || category,
          custom_statement: statement.trim(),
          custom_needed_by: neededBy || 'As soon as possible',
          custom_route: chosen.map(option => `${option!.name} (${option!.roleTitle})`).join(' → ')
        },
        uploadedDocuments: documents,
        custom: {
          title: subject.trim(),
          key: 'CU',
          stages
        }
      });
      toast('success', `Submitted. Reference ${created.referenceNumber}.`);
      onSubmitted(created.referenceNumber);
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'Could not submit your application.');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { id: 1 as Step, label: 'Your request', icon: PenLine },
    { id: 2 as Step, label: 'Documents', icon: Paperclip },
    { id: 3 as Step, label: 'Signatures', icon: UserCheck }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to catalog
          </button>
          <h1 className="text-xl font-bold text-slate-900">Write your own application</h1>
          <p className="text-sm text-slate-500 mt-1">
            Describe what you need, attach supporting files, and choose whose signature it needs. It goes straight to them.
          </p>
        </div>
      </div>

      {/* Stepper */}
      <ol className="flex items-center gap-2 text-xs">
        {steps.map((item, index) => {
          const Icon = item.icon;
          const done = step > item.id;
          const active = step === item.id;
          return (
            <li key={item.id} className="flex items-center gap-2">
              <button
                onClick={() => (item.id < step || canContinueFromStep1 ? setStep(item.id) : null)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold transition-colors ${
                  active
                    ? 'bg-[#172b50] text-white'
                    : done
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                {item.label}
              </button>
              {index < steps.length - 1 && <span className="w-4 h-px bg-slate-300" />}
            </li>
          );
        })}
      </ol>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        {step === 1 && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                What is this application for? <span className="text-rose-500">*</span>
              </label>
              <input
                value={subject}
                onChange={event => setSubject(event.target.value)}
                placeholder="e.g. Permission to sit a missed mid-term examination"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#172b50]/20 focus:border-[#172b50] outline-none"
                maxLength={90}
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-[11px] text-rose-600">{subjectError && subject.length > 0 ? subjectError : ''}</p>
                <p className="text-[11px] text-slate-400">{subject.length}/90</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={event => setCategory(event.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#172b50]/20 focus:border-[#172b50] outline-none"
                >
                  {CATEGORIES.map(item => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Needed by (optional)</label>
                <input
                  type="date"
                  value={neededBy}
                  onChange={event => setNeededBy(event.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#172b50]/20 focus:border-[#172b50] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Explain your request <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={statement}
                onChange={event => setStatement(event.target.value)}
                rows={6}
                placeholder="Write in your own words. Include dates, course codes, or any detail the officer will need to decide."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#172b50]/20 focus:border-[#172b50] outline-none resize-y"
                maxLength={2000}
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-[11px] text-rose-600">{statementError && statement.length > 0 ? statementError : ''}</p>
                <p className="text-[11px] text-slate-400">{statement.length}/2000</p>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div
              onDragOver={event => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={event => {
                event.preventDefault();
                setDragging(false);
                if (event.dataTransfer.files?.length) void addFiles(event.dataTransfer.files);
              }}
              className={`rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                dragging ? 'border-[#172b50] bg-slate-50' : 'border-slate-300 bg-slate-50/60'
              }`}
            >
              <div className="w-11 h-11 rounded-full bg-white border border-slate-200 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-5 h-5 text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-slate-800">Drag files here, or choose them</p>
              <p className="text-xs text-slate-500 mt-1">
                Photos or PDFs · up to {MAX_FILES} files · max {MAX_FILE_MB} MB each
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#172b50] hover:bg-[#1f3763] rounded-lg"
              >
                <Paperclip className="w-3.5 h-3.5" /> Attach documents
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf,.doc,.docx"
                className="hidden"
                onChange={event => {
                  if (event.target.files?.length) void addFiles(event.target.files);
                  event.target.value = '';
                }}
              />
            </div>

            {documents.length === 0 ? (
              <p className="text-xs text-slate-500 text-center">
                Documents are optional — attach whatever supports your request.
              </p>
            ) : (
              <ul className="space-y-2">
                {documents.map(doc => (
                  <li key={doc.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 bg-white">
                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">{doc.fileName}</p>
                      <p className="text-[11px] text-slate-500">{(doc.fileSize / 1024).toFixed(0)} KB</p>
                    </div>
                    <button
                      onClick={() => setDocuments(prev => prev.filter(item => item.id !== doc.id))}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                      aria-label={`Remove ${doc.fileName}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1">Whose signature do you need?</p>
              <p className="text-[11px] text-slate-500 mb-3">
                Pick in the order the application should travel. It moves to the next officer only after the previous one signs.
              </p>

              {chosen.length > 0 && (
                <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide mb-1.5">Route</p>
                  <ol className="space-y-1">
                    {chosen.map((option, index) => (
                      <li key={option!.staffId} className="flex items-center gap-2 text-xs text-emerald-900">
                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <span className="font-semibold">{option!.name}</span>
                        <span className="text-emerald-700">· {option!.roleTitle}</span>
                        <button
                          onClick={() => toggleSignatory(option!.staffId)}
                          className="ml-auto text-emerald-700 hover:text-rose-600"
                          aria-label={`Remove ${option!.name}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {routeOptions.map(option => {
                  const selected = route.includes(option.staffId);
                  const position = route.indexOf(option.staffId) + 1;
                  return (
                    <button
                      key={option.staffId}
                      onClick={() => toggleSignatory(option.staffId)}
                      className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        selected ? 'border-[#172b50] bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                          selected ? 'bg-[#172b50] border-[#172b50] text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {selected ? (position <= 9 ? <span className="text-[10px] font-bold">{position}</span> : <Check className="w-3 h-3" />) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold text-slate-800 truncate">{option.name}</span>
                        <span className="block text-[11px] text-slate-500 truncate">
                          {option.roleTitle} · {option.department}
                        </span>
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                        {option.hasStamp ? 'signature + seal' : 'signature'}
                      </span>
                    </button>
                  );
                })}
                {routeOptions.length === 0 && (
                  <p className="text-xs text-slate-500">
                    No signing officer has a signature on file yet. Please contact the registrar&apos;s office.
                  </p>
                )}
              </div>

              {options.some(option => !option.hasSignature) && (
                <p className="text-[11px] text-slate-500 mt-3">
                  Officers without a signature on file are hidden — a signing stage they cannot complete would block your application.
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => (step === 1 ? onCancel() : setStep((step - 1) as Step))}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {step === 1 ? 'Cancel' : 'Back'}
        </button>

        {step < 3 ? (
          <button
            onClick={() => setStep((step + 1) as Step)}
            disabled={step === 1 && !canContinueFromStep1}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#172b50] hover:bg-[#1f3763] rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {submitting ? 'Submitting…' : 'Submit application'}
          </button>
        )}
      </div>

      <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
        Submitted as {currentUser.name}
        {currentUser.registrationNumber ? ` · ${currentUser.registrationNumber}` : ''} · {documents.length} document
        {documents.length === 1 ? '' : 's'} attached
        {chosen.length > 0 ? ` · ${chosen.length} signature${chosen.length === 1 ? '' : 's'} required` : ''}
      </p>
    </div>
  );
};
