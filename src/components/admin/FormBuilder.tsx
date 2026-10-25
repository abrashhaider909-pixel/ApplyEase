import React, { useState } from 'react';
import { useApplyEaseStore } from '../../lib/store';
import { ApplicationType, FormFieldDefinition, DocumentRequirement, FormTemplate } from '../../types';
import { DynamicApplicationForm } from '../student/DynamicApplicationForm';
import {
  PlusCircle,
  Trash2,
  Save,
  CheckCircle2,
  Eye,
  Sliders,
  FileText,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Layers,
  Sparkles,
  Info,
  X,
  FilePlus2
} from 'lucide-react';

export const FormBuilder: React.FC = () => {
  const {
    applicationTypes,
    saveFormTemplateDraft,
    publishFormTemplate,
    createApplicationType
  } = useApplyEaseStore();

  const [selectedTypeId, setSelectedTypeId] = useState<string>(applicationTypes[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // "New form" dialog: a fresh schema attached to a service by name.
  const [showNewForm, setShowNewForm] = useState(false);
  const [newFormName, setNewFormName] = useState('');
  const [newFormDescription, setNewFormDescription] = useState('');
  const [newFormTarget, setNewFormTarget] = useState(applicationTypes[0]?.id || '');
  const [newFormError, setNewFormError] = useState<string | null>(null);

  const selectedType = applicationTypes.find((t) => t.id === selectedTypeId) || applicationTypes[0];

  // Working copy of formConfig
  const [config, setConfig] = useState<FormTemplate>(() => {
    return JSON.parse(JSON.stringify(selectedType.draftFormConfig || selectedType.formConfig));
  });

  // Keep config in sync when selectedType changes
  const handleSelectType = (typeId: string) => {
    setSelectedTypeId(typeId);
    const target = applicationTypes.find((t) => t.id === typeId);
    if (target) {
      setConfig(JSON.parse(JSON.stringify(target.draftFormConfig || target.formConfig)));
    }
  };

  const handleAddField = () => {
    const newFieldId = `field_${Date.now().toString(36)}`;
    const newField: FormFieldDefinition = {
      id: newFieldId,
      label: 'New Question Field',
      type: 'text',
      placeholder: 'Enter response...',
      required: false
    };
    setConfig((prev) => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
  };

  const handleUpdateField = (index: number, updates: Partial<FormFieldDefinition>) => {
    setConfig((prev) => {
      const copy = [...prev.fields];
      copy[index] = { ...copy[index], ...updates };
      return { ...prev, fields: copy };
    });
  };

  const handleDeleteField = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    setConfig((prev) => {
      const copy = [...prev.fields];
      const targetIdx = direction === 'up' ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return { ...prev, fields: copy };
    });
  };

  const handleAddDocumentRequirement = () => {
    const newDoc: DocumentRequirement = {
      id: `doc_req_${Date.now().toString(36)}`,
      name: 'Supporting Certificate or Proof',
      description: 'Official document issued by authorized personnel.',
      required: true,
      acceptedFormats: ['pdf', 'png', 'jpg'],
      maxSizeMB: 5
    };
    setConfig((prev) => ({
      ...prev,
      requiredDocuments: [...prev.requiredDocuments, newDoc]
    }));
  };

  const handleDeleteDocumentRequirement = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      requiredDocuments: prev.requiredDocuments.filter((_, i) => i !== index)
    }));
  };

  const handleAddDeclaration = () => {
    setConfig((prev) => ({
      ...prev,
      declarations: [
        ...prev.declarations,
        'I hereby declare that all information provided in this submission is accurate and verified.'
      ]
    }));
  };

  const handleDeleteDeclaration = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      declarations: prev.declarations.filter((_, i) => i !== index)
    }));
  };

  const handleSaveDraft = () => {
    saveFormTemplateDraft(selectedType.id, config);
    setSaveNotice('Draft saved successfully! You can test it in the Preview tab.');
    setTimeout(() => setSaveNotice(null), 4000);
  };

  const handlePublish = () => {
    publishFormTemplate(selectedType.id, config);
    setSaveNotice(`Version ${selectedType.publishedVersion + 1} published successfully! Past applications retain Version ${selectedType.publishedVersion}.`);
    setTimeout(() => setSaveNotice(null), 5000);
  };

  /** Create a completely new form schema and attach it to a service by name. */
  const handleCreateForm = () => {
    setNewFormError(null);
    const name = newFormName.trim();
    if (!name) {
      setNewFormError('Give the form a name.');
      return;
    }
    const target = applicationTypes.find(t => t.id === newFormTarget);
    if (!target) {
      setNewFormError('Choose the service this form belongs to.');
      return;
    }

    const template: FormTemplate = {
      version: 1,
      title: name,
      description: newFormDescription.trim() || `${name} — student submission form`,
      instructions: 'Complete every required field and attach the requested documents.',
      fields: [],
      requiredDocuments: [],
      declarations: ['I confirm that the information provided is accurate and complete.'],
      feeRules: { required: false, amount: 0 }
    };

    saveFormTemplateDraft(target.id, template);
    setSelectedTypeId(target.id);
    setConfig(template);
    setShowNewForm(false);
    setNewFormName('');
    setNewFormDescription('');
    setSaveNotice(`New form “${name}” linked to ${target.title}. Add fields, then publish.`);
    setTimeout(() => setSaveNotice(null), 5000);
  };

  // Virtual type for preview mode
  const previewAppType: ApplicationType = {
    ...selectedType,
    formConfig: config
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Dynamic Application Form Builder
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Design student form schemas, conditional fields, required upload credentials, and versioned publication without writing code.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setNewFormTarget(selectedTypeId);
              setNewFormError(null);
              setShowNewForm(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#172b50] bg-orange-50 border border-orange-200 hover:bg-orange-100 rounded-lg transition-colors shadow-xs"
          >
            <FilePlus2 className="w-3.5 h-3.5" />
            <span>New form</span>
          </button>
          <button
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span>Save Draft</span>
          </button>
          <button
            onClick={handlePublish}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#172b50] hover:bg-[#1f3763] rounded-lg transition-colors shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Publish Version {selectedType.publishedVersion + 1}</span>
          </button>
        </div>
      </div>

      {saveNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs px-4 py-2.5 rounded-xl flex items-center justify-between animate-in fade-in">
          <span>{saveNotice}</span>
          <button onClick={() => setSaveNotice(null)} className="text-emerald-700 hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* Application Type Selector & Tab Switcher Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
            Selected Application:
          </label>
          <select
            value={selectedTypeId}
            onChange={(e) => handleSelectType(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50] font-semibold text-slate-800"
          >
            {applicationTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} (v{t.publishedVersion}) {t.hasUnpublishedDraft ? '• [Draft Modified]' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Editor vs Preview Mode Switch */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'editor'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Form Schema Designer</span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-[#f4772e]" />
            <span>Interactive Student Preview</span>
          </button>
        </div>
      </div>

      {/* Main Tab Body */}
      {activeTab === 'preview' ? (
        <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200">
          <div className="max-w-2xl mx-auto mb-4 bg-blue-50 border border-blue-200 text-blue-900 text-xs p-3 rounded-xl flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-700 shrink-0" />
            <span>
              <strong>Student Simulation Mode:</strong> Test field inputs, profile auto-fill, conditional displays, and validation rules exactly as a student would experience them.
            </span>
          </div>
          <DynamicApplicationForm
            applicationType={previewAppType}
            onCancel={() => setActiveTab('editor')}
            onSubmitted={() => {}}
            isPreviewMode={true}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Form Meta Settings */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              General Header & Instructions
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Application Title Display:
                </label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Short Description:
                </label>
                <input
                  type="text"
                  value={config.description}
                  onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Student Visible Instructions & Guidelines:
                </label>
                <textarea
                  rows={2}
                  value={config.instructions}
                  onChange={(e) => setConfig({ ...config, instructions: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Fields List */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Configured Form Fields ({config.fields.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Configure validation rules, auto-fill keys, and conditional dependencies.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddField}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#172b50] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Question Field</span>
              </button>
            </div>

            <div className="space-y-4">
              {config.fields.map((field, idx) => (
                <div
                  key={field.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                    <span className="text-xs font-bold font-mono text-slate-500">
                      #{idx + 1} • Key: <span className="text-[#172b50]">{field.id}</span>
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveField(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        title="Move up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveField(idx, 'down')}
                        disabled={idx === config.fields.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        title="Move down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteField(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors ml-2"
                        title="Delete field"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Label */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 block">
                        Field Label / Question:
                      </label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleUpdateField(idx, { label: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]"
                      />
                    </div>

                    {/* Field Type */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 block">
                        Field Input Type:
                      </label>
                      <select
                        value={field.type}
                        onChange={(e) => handleUpdateField(idx, { type: e.target.value as any })}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]"
                      >
                        <option value="text">Single-line Text</option>
                        <option value="textarea">Multi-line Paragraph</option>
                        <option value="select">Dropdown Select</option>
                        <option value="date">Calendar Date</option>
                        <option value="number">Numeric Input</option>
                        <option value="checkbox">Checkbox Boolean</option>
                        <option value="profile_autofill">Student Profile Autofill (Verified)</option>
                      </select>
                    </div>

                    {/* If Profile Autofill */}
                    {field.type === 'profile_autofill' && (
                      <div className="sm:col-span-3 p-3 bg-blue-50/70 border border-blue-200 rounded-lg space-y-1">
                        <label className="text-[11px] font-semibold text-blue-900 block">
                          Mapped Student Profile Field:
                        </label>
                        <select
                          value={field.autoFillProfileKey || 'name'}
                          onChange={(e) =>
                            handleUpdateField(idx, { autoFillProfileKey: e.target.value as any })
                          }
                          className="w-full px-3 py-1.5 text-xs bg-white border border-blue-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]"
                        >
                          <option value="name">Full Student Name</option>
                          <option value="registrationNumber">Registration / Enrollment Number</option>
                          <option value="department">Enrolled Department</option>
                          <option value="email">University Email</option>
                          <option value="phone">Registered Telephone</option>
                          <option value="hostelRoom">Residential Hostel & Room Number</option>
                        </select>
                      </div>
                    )}

                    {/* If Select Dropdown: Options list */}
                    {field.type === 'select' && (
                      <div className="sm:col-span-3 space-y-1">
                        <label className="text-[11px] font-semibold text-slate-700 block">
                          Dropdown Options (Comma separated):
                        </label>
                        <input
                          type="text"
                          value={field.options?.join(', ') || ''}
                          onChange={(e) =>
                            handleUpdateField(idx, {
                              options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                            })
                          }
                          placeholder="Option 1, Option 2, Option 3..."
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]"
                        />
                      </div>
                    )}

                    {/* Placeholder & Required Checkbox */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 block">
                        Placeholder / Watermark:
                      </label>
                      <input
                        type="text"
                        value={field.placeholder || ''}
                        onChange={(e) => handleUpdateField(idx, { placeholder: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 block">
                        Help Text / Guidance:
                      </label>
                      <input
                        type="text"
                        value={field.helpText || ''}
                        onChange={(e) => handleUpdateField(idx, { helpText: e.target.value })}
                        placeholder="e.g. As stated on passport..."
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-5">
                      <input
                        type="checkbox"
                        id={`req_${field.id}`}
                        checked={field.required}
                        onChange={(e) => handleUpdateField(idx, { required: e.target.checked })}
                        className="w-4 h-4 text-[#172b50] rounded"
                      />
                      <label htmlFor={`req_${field.id}`} className="text-xs font-semibold text-slate-800">
                        Mandatory Field
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Required Supporting Documents Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Required Document Credentials ({config.requiredDocuments.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Specify which supporting certificates, proofs, or receipts must be attached by the student.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddDocumentRequirement}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#172b50] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Document Requirement</span>
              </button>
            </div>

            <div className="space-y-3">
              {config.requiredDocuments.map((docReq, dIdx) => (
                <div
                  key={docReq.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-4"
                >
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={docReq.name}
                      onChange={(e) => {
                        const copy = [...config.requiredDocuments];
                        copy[dIdx].name = e.target.value;
                        setConfig({ ...config, requiredDocuments: copy });
                      }}
                      placeholder="Document Name (e.g. Identity Proof)"
                      className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50] font-semibold"
                    />

                    <input
                      type="text"
                      value={docReq.description}
                      onChange={(e) => {
                        const copy = [...config.requiredDocuments];
                        copy[dIdx].description = e.target.value;
                        setConfig({ ...config, requiredDocuments: copy });
                      }}
                      placeholder="Instructions for student"
                      className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]"
                    />

                    <div className="sm:col-span-2 flex flex-wrap items-center gap-3 pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          const copy = [...config.requiredDocuments];
                          copy[dIdx].required = !copy[dIdx].required;
                          setConfig({ ...config, requiredDocuments: copy });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                          docReq.required
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'
                        }`}
                        title="Toggle whether the student must upload this document"
                      >
                        {docReq.required ? 'Mandatory' : 'Optional'}
                      </button>

                      <label className="flex items-center gap-1 text-[11px] text-slate-600">
                        Max size
                        <input
                          type="number"
                          min={1}
                          value={docReq.maxSizeMB}
                          onChange={(e) => {
                            const copy = [...config.requiredDocuments];
                            copy[dIdx].maxSizeMB = Math.max(1, Number(e.target.value) || 1);
                            setConfig({ ...config, requiredDocuments: copy });
                          }}
                          className="w-14 px-1.5 py-1 text-[11px] bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#172b50]"
                        />
                        MB
                      </label>

                      <span className="text-[10px] text-slate-400 font-mono">
                        {(docReq.acceptedFormats || []).join(' / ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteDocumentRequirement(dIdx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Remove requirement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Declarations Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Mandatory Declarations & Consents ({config.declarations.length})
                </h3>
              </div>

              <button
                type="button"
                onClick={handleAddDeclaration}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#172b50] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Declaration</span>
              </button>
            </div>

            <div className="space-y-2">
              {config.declarations.map((decl, declIdx) => (
                <div key={declIdx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={decl}
                    onChange={(e) => {
                      const copy = [...config.declarations];
                      copy[declIdx] = e.target.value;
                      setConfig({ ...config, declarations: copy });
                    }}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteDeclaration(declIdx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showNewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-[overlay-in_120ms_ease-out]" onClick={() => setShowNewForm(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 animate-[palette-in_140ms_ease-out]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900">Create a new form</h2>
              <button onClick={() => setShowNewForm(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold text-slate-600">Form name</span>
                <input
                  value={newFormName}
                  onChange={(e) => setNewFormName(e.target.value)}
                  placeholder="e.g. Transcript Request Form"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50] focus:bg-white"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-[11px] font-semibold text-slate-600">Link to service</span>
                <select
                  value={newFormTarget}
                  onChange={(e) => setNewFormTarget(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50] focus:bg-white"
                >
                  {applicationTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.title}</option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 block">
                  The new form becomes a draft of the selected service. Publishing it replaces that
                  service's live form for new submissions.
                </span>
              </label>

              <label className="block space-y-1">
                <span className="text-[11px] font-semibold text-slate-600">Description (optional)</span>
                <textarea
                  rows={2}
                  value={newFormDescription}
                  onChange={(e) => setNewFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50] focus:bg-white"
                />
              </label>

              {newFormError && (
                <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{newFormError}</p>
              )}
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex items-center justify-end gap-2">
              <button
                onClick={() => setShowNewForm(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateForm}
                className="px-3.5 py-2 text-xs font-bold text-white bg-[#172b50] hover:bg-[#1f3763] rounded-lg"
              >
                Create form
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
