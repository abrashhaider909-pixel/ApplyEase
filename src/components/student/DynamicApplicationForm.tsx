import React, { useState, useEffect } from 'react';
import { useApplyEaseStore } from '../../lib/store';
import { ApplicationType, FormFieldDefinition, UploadedDocument } from '../../types';
import {
  FileText,
  Upload,
  AlertCircle,
  CheckCircle2,
  X,
  FileCheck,
  ArrowLeft,
  DollarSign,
  Info
} from 'lucide-react';

interface DynamicApplicationFormProps {
  applicationType: ApplicationType;
  onCancel: () => void;
  onSubmitted: (referenceNumber: string) => void;
  isPreviewMode?: boolean;
}

export const DynamicApplicationForm: React.FC<DynamicApplicationFormProps> = ({
  applicationType,
  onCancel,
  onSubmitted,
  isPreviewMode = false
}) => {
  const { currentUser, createApplication } = useApplyEaseStore();
  const formConfig = applicationType.formConfig;

  // Initialize form state with profile autofill and defaults
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};

    formConfig.fields.forEach((field) => {
      if (field.autoFillProfileKey) {
        initial[field.id] = (currentUser as any)[field.autoFillProfileKey] || '';
      } else if (field.defaultValue !== undefined) {
        initial[field.id] = field.defaultValue;
      } else {
        initial[field.id] = field.type === 'checkbox' ? false : '';
      }
    });

    return initial;
  });

  // Track uploaded documents
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  // Declarations consent states
  const [agreedDeclarations, setAgreedDeclarations] = useState<Record<number, boolean>>({});
  // Fee receipt upload
  const [feeReceiptUrl, setFeeReceiptUrl] = useState<string>('');
  const [feeReceiptName, setFeeReceiptName] = useState<string>('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if a conditional field should be visible
  const isFieldVisible = (field: FormFieldDefinition): boolean => {
    if (!field.condition) return true;
    const parentVal = formData[field.condition.fieldId];

    if (field.condition.operator === 'equals') {
      return String(parentVal) === String(field.condition.value);
    }
    if (field.condition.operator === 'not_equals') {
      return String(parentVal) !== String(field.condition.value);
    }
    if (field.condition.operator === 'contains') {
      return Array.isArray(parentVal)
        ? parentVal.includes(field.condition.value)
        : String(parentVal).includes(String(field.condition.value));
    }
    return true;
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    // Clear validation error when modified
    if (errors[fieldId]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[fieldId];
        return copy;
      });
    }
  };

  const handleFileUpload = (
    requirementId: string,
    requirementName: string,
    file: File
  ) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const newDoc: UploadedDocument = {
        id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        requirementId,
        requirementName,
        fileName: file.name,
        fileDataUrl: dataUrl,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: new Date().toISOString(),
        status: 'pending'
      };

      setUploadedDocs((prev) => [
        ...prev.filter((d) => d.requirementId !== requirementId),
        newDoc
      ]);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveUploadedDoc = (requirementId: string) => {
    setUploadedDocs((prev) => prev.filter((d) => d.requirementId !== requirementId));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate visible fields
    formConfig.fields.forEach((field) => {
      if (!isFieldVisible(field)) return;

      const val = formData[field.id];

      if (field.required) {
        if (
          val === undefined ||
          val === null ||
          val === '' ||
          (field.type === 'checkbox' && !val)
        ) {
          newErrors[field.id] = `${field.label} is required.`;
        }
      }

      if (val && field.validationRegex) {
        try {
          const regex = new RegExp(field.validationRegex);
          if (!regex.test(String(val))) {
            newErrors[field.id] = field.validationMessage || `Invalid format for ${field.label}.`;
          }
        } catch (e) {
          console.warn('Regex error:', e);
        }
      }
    });

    // Validate required supporting documents
    formConfig.requiredDocuments.forEach((docReq) => {
      if (docReq.required) {
        const isUploaded = uploadedDocs.some((d) => d.requirementId === docReq.id);
        if (!isUploaded) {
          newErrors[`doc_${docReq.id}`] = `Please upload ${docReq.name}.`;
        }
      }
    });

    // Validate declarations
    formConfig.declarations.forEach((_, idx) => {
      if (!agreedDeclarations[idx]) {
        newErrors[`declaration_${idx}`] = 'You must accept all required declarations.';
      }
    });

    // Validate fee receipt if required
    if (formConfig.feeRules.required && !feeReceiptUrl) {
      newErrors['fee_receipt'] = 'Please upload proof of fee payment.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    if (isPreviewMode) {
      alert('Validation passed! In preview mode, application is not submitted.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createApplication({
        applicationTypeId: applicationType.id,
        formData,
        uploadedDocuments: uploadedDocs,
        paymentReceiptUrl: feeReceiptUrl || undefined
      });

      onSubmitted(created.referenceNumber);
    } catch (err: any) {
      alert('Submission failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </button>

        <div className="text-right">
          <span className="text-[11px] font-mono text-slate-400">
            Form Definition v{formConfig.version} (Published)
          </span>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="bg-[#172b50] p-6 text-white">
          <h2 className="text-xl font-bold tracking-tight">
            {formConfig.title || applicationType.title}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            {formConfig.description || applicationType.description}
          </p>

          {formConfig.instructions && (
            <div className="mt-3 bg-white/10 rounded-lg p-3 text-xs text-slate-200 flex items-start gap-2 border border-white/15">
              <Info className="w-4 h-4 text-[#f4772e] shrink-0 mt-0.5" />
              <span>{formConfig.instructions}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {formConfig.fields.length === 0 && (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-900 leading-relaxed">
              <strong className="block mb-1">This service is not ready yet</strong>
              The administrator has not added any questions to this form, so there is nothing to
              submit. Please choose another service or contact the records office.
            </div>
          )}
          {/* Section 1: Dynamic Fields */}
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                Application Particulars
              </h3>
              <p className="text-[11px] text-slate-500">
                Identity fields are automatically verified from your active student record.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {formConfig.fields.map((field) => {
                if (!isFieldVisible(field)) return null;

                const isFullWidth =
                  field.type === 'textarea' ||
                  field.type === 'checkbox' ||
                  field.label.length > 35;
                const fieldError = errors[field.id];

                return (
                  <div
                    key={field.id}
                    className={`${isFullWidth ? 'md:col-span-2' : 'col-span-1'} space-y-1.5`}
                  >
                    <label className="block text-xs font-semibold text-slate-800">
                      {field.label}
                      {field.required && (
                        <span className="text-rose-500 ml-1" title="Required">*</span>
                      )}
                    </label>

                    {/* Auto-filled student identity fields */}
                    {field.type === 'profile_autofill' ? (
                      <div className="relative">
                        <input
                          type="text"
                          value={formData[field.id] || ''}
                          readOnly
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed select-none"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                          Verified Profile
                        </span>
                      </div>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        rows={3}
                        placeholder={field.placeholder}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50] ${
                          fieldError ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                        }`}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={formData[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50] ${
                          fieldError ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                        }`}
                      >
                        <option value="">-- Select an option --</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'checkbox' ? (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id={field.id}
                          checked={Boolean(formData[field.id])}
                          onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                          className="w-4 h-4 text-[#172b50] border-slate-300 rounded focus:ring-1 focus:ring-[#172b50]"
                        />
                        <label htmlFor={field.id} className="text-xs text-slate-700 select-none">
                          {field.placeholder || field.label}
                        </label>
                      </div>
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                        placeholder={field.placeholder}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50] ${
                          fieldError ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                        }`}
                      />
                    )}

                    {field.helpText && (
                      <p className="text-[11px] text-slate-400">{field.helpText}</p>
                    )}
                    {fieldError && (
                      <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {fieldError}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Supporting Documents */}
          {formConfig.requiredDocuments.length > 0 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Supporting Credentials & Attachments
                </h3>
                <p className="text-[11px] text-slate-500">
                  Upload authentic PDF or high-resolution images as required by university bylaws.
                </p>
              </div>

              <div className="space-y-3">
                {formConfig.requiredDocuments.map((docReq) => {
                  const uploaded = uploadedDocs.find((d) => d.requirementId === docReq.id);
                  const docError = errors[`doc_${docReq.id}`];

                  return (
                    <div
                      key={docReq.id}
                      className={`p-4 rounded-xl border transition-colors ${
                        uploaded
                          ? 'border-emerald-200 bg-emerald-50/30'
                          : docError
                          ? 'border-rose-300 bg-rose-50/20'
                          : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              uploaded
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {uploaded ? (
                              <FileCheck className="w-4 h-4" />
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-900">
                                {docReq.name}
                              </h4>
                              {docReq.required ? (
                                <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                                  Required
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                  Optional
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {docReq.description} (Max {docReq.maxSizeMB}MB • {docReq.acceptedFormats.join(', ').toUpperCase()})
                            </p>
                          </div>
                        </div>

                        {/* File Action */}
                        <div className="shrink-0">
                          {uploaded ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-emerald-800 truncate max-w-[150px]">
                                {uploaded.fileName}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveUploadedDoc(docReq.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                title="Remove file"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs">
                              <Upload className="w-3.5 h-3.5 text-slate-500" />
                              <span>Select File</span>
                              <input
                                type="file"
                                accept={docReq.acceptedFormats.map((f) => `.${f}`).join(',')}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleFileUpload(docReq.id, docReq.name, file);
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      {docError && (
                        <p className="text-[11px] text-rose-600 font-medium mt-2 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {docError}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3: Fee Payment Requirement (if applicable) */}
          {formConfig.feeRules.required && (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  <span>Fee Requirement: ${formConfig.feeRules.amount} USD</span>
                </div>
                <span className="text-[11px] font-medium text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
                  {formConfig.feeRules.feeType || 'Processing Fee'}
                </span>
              </div>
              <p className="text-[11px] text-amber-800">
                {formConfig.feeRules.instructions ||
                  'Please upload your transaction payment voucher / university cashier receipt.'}
              </p>

              <div>
                {feeReceiptUrl ? (
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-amber-200">
                    <span className="text-xs font-mono text-slate-800 truncate">
                      Receipt: {feeReceiptName}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFeeReceiptUrl('');
                        setFeeReceiptName('');
                      }}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-900 bg-white border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Payment Receipt</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setFeeReceiptUrl(ev.target?.result as string);
                            setFeeReceiptName(file.name);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                )}
                {errors['fee_receipt'] && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">
                    {errors['fee_receipt']}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Section 4: Declarations & Undertaking */}
          {formConfig.declarations.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Student Undertaking & Declarations
                </h3>
              </div>

              <div className="space-y-2">
                {formConfig.declarations.map((decl, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id={`decl_${idx}`}
                      checked={Boolean(agreedDeclarations[idx])}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setAgreedDeclarations((prev) => ({ ...prev, [idx]: checked }));
                        if (errors[`declaration_${idx}`]) {
                          setErrors((prev) => {
                            const copy = { ...prev };
                            delete copy[`declaration_${idx}`];
                            return copy;
                          });
                        }
                      }}
                      className="w-4 h-4 text-[#172b50] border-slate-300 rounded focus:ring-1 focus:ring-[#172b50] mt-0.5"
                    />
                    <label htmlFor={`decl_${idx}`} className="text-xs text-slate-700 leading-snug cursor-pointer select-none">
                      {decl}
                    </label>
                  </div>
                ))}

                {Object.keys(errors).some((k) => k.startsWith('declaration_')) && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Please confirm all mandatory declarations before submitting.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Submit Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || formConfig.fields.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#f4772e] hover:bg-[#de6219] disabled:bg-slate-400 rounded-lg transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Application'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
