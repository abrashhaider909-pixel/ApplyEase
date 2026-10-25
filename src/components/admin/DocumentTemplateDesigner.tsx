import React, { useState } from 'react';
import { useApplyEaseStore } from '../../lib/store';
import { OfficialDocumentTemplate, SignatureSlot, StampSlot, Application } from '../../types';
import { renderDocumentText } from '../../lib/pdfGenerator';
import { buildOfficialDocumentPdf } from '../../lib/officialPdf';
import { downloadDataUrl } from '../../lib/download';
import { VerificationQr } from '../common/VerificationQr';
import {
  FileText,
  Save,
  Download,
  PenTool,
  Shield,
  PlusCircle,
  Trash2,
  Move,
  RotateCw,
  Eye,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';

export const DocumentTemplateDesigner: React.FC = () => {
  const { applicationTypes, saveDocumentTemplate, signatures, stamps } = useApplyEaseStore();

  const [selectedTypeId, setSelectedTypeId] = useState<string>(applicationTypes[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'visual' | 'properties'>('visual');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const selectedType = applicationTypes.find((t) => t.id === selectedTypeId) || applicationTypes[0];

  // Working template draft
  const [template, setTemplate] = useState<OfficialDocumentTemplate>(() => {
    return JSON.parse(JSON.stringify(selectedType.documentTemplate));
  });

  // Sample student for realistic preview
  const sampleApplication = {
    id: 'sample-app',
    referenceNumber: 'APP-2026-LV-0194',
    applicationTypeId: selectedType.id,
    applicationTypeTitle: selectedType.title,
    templateVersion: selectedType.publishedVersion,
    studentId: 'sample-student',
    studentSnapshot: {
      name: 'Sarah Jenkins',
      registrationNumber: '2024-CS-104',
      email: 'sarah.jenkins@university.edu',
      department: 'Computer Science & Engineering',
      phone: '+1 (555) 234-8901'
    },
    status: 'completed' as const,
    currentStageId: 'final',
    currentStageIndex: 1,
    formData: {
      student_name: 'Sarah Jenkins',
      reg_no: '2024-CS-104',
      leave_type: 'Academic Hackathon Representation',
      start_date: '2026-10-28',
      end_date: '2026-11-02',
      destination: 'San Francisco, CA',
      reason: 'Invited to present undergraduate machine learning paper at national symposium.',
      document_requested: 'Senior Secondary / 12th Grade Marksheet',
      withdrawal_mode: 'Temporary Withdrawal (Will Re-Deposit)',
      purpose: 'Verification requirement for US Consulate F-1 visa appointment at Embassy in downtown.'
    },
    uploadedDocuments: [],
    stageInstances: [],
    timeline: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submissionDate: new Date().toISOString()
  };

  const handleSelectType = (typeId: string) => {
    setSelectedTypeId(typeId);
    const target = applicationTypes.find((t) => t.id === typeId);
    if (target) {
      setTemplate(JSON.parse(JSON.stringify(target.documentTemplate)));
    }
  };

  const handleSave = () => {
    saveDocumentTemplate(selectedType.id, template);
    setSaveNotice('Official Document Template saved and updated!');
    setTimeout(() => setSaveNotice(null), 4000);
  };

  const handleTestDownloadPdf = async () => {
    setIsExporting(true);
    try {
      const previewApplication: Application = {
        id: 'preview',
        referenceNumber: 'PREVIEW-2026-0001',
        applicationTypeId: selectedType.id,
        applicationTypeTitle: selectedType.title,
        templateVersion: template.version,
        studentId: 'preview',
        studentSnapshot: {
          name: 'Preview Student',
          registrationNumber: '2024-PRE-001',
          email: 'preview@university.edu',
          department: 'Computer Science & Engineering',
          phone: '+1 (555) 000-0000'
        },
        status: 'completed',
        currentStageId: 'preview-stage',
        currentStageIndex: 0,
        formData: {},
        uploadedDocuments: [],
        stageInstances: [],
        timeline: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        issuedDocument: {
          id: 'preview-doc',
          documentNumber: 'PREVIEW-2026-0001',
          referenceNumber: 'PREVIEW-2026-0001',
          generatedAt: new Date().toISOString(),
          verificationCode: 'PREVIEW-CODE',
          documentHash: 'preview-hash',
          appliedSignatures: [],
          appliedStamps: []
        }
      };

      const dataUrl = await buildOfficialDocumentPdf(previewApplication, template, { preview: true });
      if (!dataUrl) throw new Error('the PDF renderer returned no data');
      downloadDataUrl(dataUrl, `Template_Preview_${selectedType.key}.pdf`);
    } catch (e: any) {
      alert('PDF generation error: ' + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddParagraph = () => {
    setTemplate((prev) => ({
      ...prev,
      bodyParagraphs: [
        ...prev.bodyParagraphs,
        'This certifies that student {{student_name}} (Reg: {{registration_number}}) has completed all required clearances.'
      ]
    }));
  };

  const handleDeleteParagraph = (idx: number) => {
    setTemplate((prev) => ({
      ...prev,
      bodyParagraphs: prev.bodyParagraphs.filter((_, i) => i !== idx)
    }));
  };

  const handleAddSignatureSlot = () => {
    const newSlot: SignatureSlot = {
      id: `sig_slot_${Date.now()}`,
      roleTitle: 'Dean of Academic Affairs',
      requiredStaffRole: 'dean',
      xPercent: 50,
      yPercent: 78,
      widthPx: 180,
      heightPx: 60,
      showDate: true,
      showPrintedName: true
    };
    setTemplate((prev) => ({
      ...prev,
      signatureSlots: [...prev.signatureSlots, newSlot]
    }));
  };

  const handleDeleteSignatureSlot = (id: string) => {
    setTemplate((prev) => ({
      ...prev,
      signatureSlots: prev.signatureSlots.filter((s) => s.id !== id)
    }));
  };

  const handleAddStampSlot = () => {
    const newStamp: StampSlot = {
      id: `stamp_slot_${Date.now()}`,
      title: 'Registrar Official Seal',
      department: 'Office of the University Registrar',
      xPercent: 50,
      yPercent: 72,
      sizePx: 110,
      rotationDeg: 0,
      opacity: 0.88
    };
    setTemplate((prev) => ({
      ...prev,
      stampSlots: [...prev.stampSlots, newStamp]
    }));
  };

  const handleDeleteStampSlot = (id: string) => {
    setTemplate((prev) => ({
      ...prev,
      stampSlots: prev.stampSlots.filter((st) => st.id !== id)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Official Document Template Designer
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Visual A4 layout designer for issued certificates, clearance passes, transparent electronic signatures, and official seals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestDownloadPdf}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{isExporting ? 'Exporting...' : 'Test PDF Output'}</span>
          </button>

          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#172b50] hover:bg-[#1f3763] rounded-lg transition-colors shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Document Template</span>
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

      {/* Control Selector Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
            Document for Application:
          </label>
          <select
            value={selectedTypeId}
            onChange={(e) => handleSelectType(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50] font-semibold text-slate-800"
          >
            {applicationTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} • {t.documentTemplate.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('visual')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'visual'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Visual Canvas Layout</span>
          </button>
          <button
            onClick={() => setActiveTab('properties')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'properties'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Tokens & Text Content</span>
          </button>
        </div>
      </div>

      {/* Visual Canvas vs Properties Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center: Interactive A4 Page Viewport */}
        <div className={`${activeTab === 'visual' ? 'lg:col-span-8' : 'lg:col-span-7'} flex justify-center bg-slate-200 p-4 sm:p-8 rounded-2xl border border-slate-300 overflow-x-auto`}>
          <div
            id="document-designer-canvas-preview"
            className="w-[680px] min-h-[920px] bg-white border border-slate-400 p-10 shadow-xl relative text-slate-900 flex flex-col justify-between select-none"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {/* Watermark Crest */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <img
                src="/assets/aistudio/image_133404a9.png"
                alt="Watermark"
                className="w-96 h-96 object-contain"
              />
            </div>

            {/* Header */}
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
                      APEX STATE UNIVERSITY
                    </h2>
                    <p className="text-[11px] font-semibold text-slate-600 tracking-wider">
                      {template.headerNotice}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      REF: APP-2026-LV-0194 • ISSUED: {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Verification QR */}
                <div className="text-center">
                  <VerificationQr
                    code="ASU-SAMPLE-PREVIEW-QR"
                    size={56}
                    className="border border-slate-200 p-0.5 rounded bg-white"
                  />
                  <span className="text-[8px] font-mono block text-slate-500 mt-0.5">
                    SCAN TO VERIFY
                  </span>
                </div>
              </div>

              {/* Title */}
              <div className="text-center my-6">
                <h1 className="text-lg font-extrabold tracking-wider text-[#172b50] border-y border-slate-200 py-1.5 uppercase">
                  {template.title}
                </h1>
                <p className="text-[10px] font-medium text-slate-500 mt-1 italic">
                  {template.subtitle || 'Official Sanction Order'}
                </p>
              </div>

              {/* Body Paragraphs */}
              <div className="space-y-4 text-xs leading-relaxed text-slate-800 text-justify">
                {template.bodyParagraphs.map((para, idx) => (
                  <p key={idx}>
                    {renderDocumentText(para, sampleApplication as any)}
                  </p>
                ))}
              </div>
            </div>

            {/* Visual Signature & Stamp Placement Area */}
            <div className="mt-8 pt-6 border-t border-slate-200 relative min-h-[140px]">
              {/* Stamp Slots */}
              {template.stampSlots.map((slot) => {
                const sampleStamp = stamps[0];
                return (
                  <div
                    key={slot.id}
                    className="absolute pointer-events-none select-none transition-all"
                    style={{
                      left: `${slot.xPercent}%`,
                      top: '-30px',
                      transform: `translate(-50%, 0) rotate(${slot.rotationDeg}deg)`,
                      opacity: slot.opacity,
                      width: `${slot.sizePx}px`,
                      height: `${slot.sizePx}px`
                    }}
                  >
                    <img
                      src={sampleStamp?.imageUrl}
                      alt={slot.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                );
              })}

              {/* Signature Slots */}
              <div className="flex items-end justify-between relative">
                {template.signatureSlots.map((slot, sIdx) => {
                  const sampleSig = signatures[sIdx % signatures.length];

                  return (
                    <div
                      key={slot.id}
                      className="relative text-left"
                      style={{ minWidth: '160px' }}
                    >
                      <div className="h-14 flex items-end">
                        <img
                          src={sampleSig?.imageUrl}
                          alt="Signature"
                          className="h-12 object-contain"
                        />
                      </div>
                      <div className="border-t border-slate-800 pt-1 mt-1">
                        <p className="text-xs font-bold text-slate-900">
                          {sampleSig?.ownerName || 'Dr. Authorized Signatory'}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {slot.roleTitle}
                        </p>
                        <p className="text-[9px] text-slate-400 font-mono">
                          Date: {new Date().toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Security Footer Notice */}
              <div className="mt-8 pt-3 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                <div>
                  HASH: c74fae98129bb8041d8e90145efb7720914619d8011234fa...
                </div>
                <div>
                  SECURITY AUDIT CODE: ASU-VRF-889104-LV
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane: Slot Coordinates & Placement Controls */}
        <div className={`${activeTab === 'visual' ? 'lg:col-span-4' : 'lg:col-span-5'} space-y-6`}>
          {activeTab === 'visual' ? (
            <div className="space-y-6">
              {/* Signatures Slot Configuration */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <PenTool className="w-4 h-4 text-[#172b50]" />
                    <span>Signature Slots ({template.signatureSlots.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSignatureSlot}
                    className="p-1 text-slate-600 hover:text-[#172b50] rounded"
                    title="Add signature box"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {template.signatureSlots.map((slot, sIdx) => (
                    <div key={slot.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-800">
                          Signatory #{sIdx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteSignatureSlot(slot.id)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 block">Signatory Title / Designation:</label>
                        <input
                          type="text"
                          value={slot.roleTitle}
                          onChange={(e) => {
                            const copy = [...template.signatureSlots];
                            copy[sIdx].roleTitle = e.target.value;
                            setTemplate({ ...template, signatureSlots: copy });
                          }}
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stamp Slots Configuration */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Shield className="w-4 h-4 text-[#172b50]" />
                    <span>Official Stamp Overlays ({template.stampSlots.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddStampSlot}
                    className="p-1 text-slate-600 hover:text-[#172b50] rounded"
                    title="Add official stamp position"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {template.stampSlots.map((slot, stIdx) => (
                    <div key={slot.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-800">
                          {slot.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteStampSlot(slot.id)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Horizontal placement slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Horizontal Position (X %):</span>
                          <span className="font-mono">{slot.xPercent}%</span>
                        </div>
                        <input
                          type="range"
                          min="15"
                          max="85"
                          value={slot.xPercent}
                          onChange={(e) => {
                            const copy = [...template.stampSlots];
                            copy[stIdx].xPercent = Number(e.target.value);
                            setTemplate({ ...template, stampSlots: copy });
                          }}
                          className="w-full accent-[#172b50]"
                        />
                      </div>

                      {/* Rotation angle */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Realistic Stamp Rotation:</span>
                          <span className="font-mono">{slot.rotationDeg}°</span>
                        </div>
                        <input
                          type="range"
                          min="-25"
                          max="25"
                          value={slot.rotationDeg}
                          onChange={(e) => {
                            const copy = [...template.stampSlots];
                            copy[stIdx].rotationDeg = Number(e.target.value);
                            setTemplate({ ...template, stampSlots: copy });
                          }}
                          className="w-full accent-[#172b50]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Properties Editor */
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Paragraphs & Dynamic Token Placeholders
              </h3>

              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
                <span className="font-bold block">Available Dynamic Tokens:</span>
                <div className="flex flex-wrap gap-1 font-mono text-[10px] text-blue-800">
                  <span className="bg-white px-1.5 py-0.5 rounded border border-blue-200">{'{{student_name}}'}</span>
                  <span className="bg-white px-1.5 py-0.5 rounded border border-blue-200">{'{{registration_number}}'}</span>
                  <span className="bg-white px-1.5 py-0.5 rounded border border-blue-200">{'{{department}}'}</span>
                  <span className="bg-white px-1.5 py-0.5 rounded border border-blue-200">{'{{application_ref}}'}</span>
                  <span className="bg-white px-1.5 py-0.5 rounded border border-blue-200">{'{{start_date}}'}</span>
                  <span className="bg-white px-1.5 py-0.5 rounded border border-blue-200">{'{{end_date}}'}</span>
                  <span className="bg-white px-1.5 py-0.5 rounded border border-blue-200">{'{{destination}}'}</span>
                  <span className="bg-white px-1.5 py-0.5 rounded border border-blue-200">{'{{reason}}'}</span>
                </div>
              </div>

              {/* Title edit */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Document Header Title:
                </label>
                <input
                  type="text"
                  value={template.title}
                  onChange={(e) => setTemplate({ ...template, title: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]"
                />
              </div>

              {/* Paragraphs list */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Body Paragraphs</span>
                  <button
                    type="button"
                    onClick={handleAddParagraph}
                    className="text-xs text-[#172b50] font-semibold hover:underline"
                  >
                    + Add Paragraph
                  </button>
                </div>

                {template.bodyParagraphs.map((para, pIdx) => (
                  <div key={pIdx} className="space-y-1 relative">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Paragraph #{pIdx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteParagraph(pIdx)}
                        className="text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={para}
                      onChange={(e) => {
                        const copy = [...template.bodyParagraphs];
                        copy[pIdx] = e.target.value;
                        setTemplate({ ...template, bodyParagraphs: copy });
                      }}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
