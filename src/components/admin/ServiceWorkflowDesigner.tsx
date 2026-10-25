import React, { useMemo, useState } from 'react';
import { useApplyEaseStore } from '../../lib/store';
import { toast } from '../../lib/toast';
import { isSigningTitle } from '../../lib/access';
import {
  ApplicationType,
  WorkflowDefinition,
  WorkflowStageDefinition,
  FormTemplate,
  OfficialDocumentTemplate
} from '../../types';
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Save,
  Layers,
  Users,
  PenTool,
  Stamp,
  Clock,
  ChevronRight,
  FileText,
  X,
  Building2,
  GitBranch
} from 'lucide-react';

interface ServiceWorkflowDesignerProps {
  onNavigateTab: (tab: string) => void;
}

const CATEGORIES = [
  { value: 'academic', label: 'Academic' },
  { value: 'hostel', label: 'Hostel & Residential' },
  { value: 'administrative', label: 'Administrative & Records' },
  { value: 'financial', label: 'Finance & Accounts' }
] as const;

function makeStage(overrides: Partial<WorkflowStageDefinition> = {}): WorkflowStageDefinition {
  return {
    id: `stage-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    order: 0,
    name: 'New Review Stage',
    assignedDepartment: '',
    assignedRole: 'Faculty Advisor',
    assignedStaffId: undefined,
    allowedActions: ['verify', 'approve', 'reject', 'request_correction'],
    requiresSignature: false,
    requiresStamp: false,
    slaHours: 24,
    escalationPolicy: { warning1Hours: 12, warning2Hours: 24, warning3Hours: 36, escalateToAdmin: true },
    ...overrides
  };
}

/**
 * Administrator workspace for the two structural levers of the platform:
 * creating a service, and defining the route an application takes through
 * departments — who reviews it, who signs it, and how long each stage may take.
 */
export const ServiceWorkflowDesigner: React.FC<ServiceWorkflowDesignerProps> = ({ onNavigateTab }) => {
  const { applicationTypes, users, saveWorkflowDefinition, createApplicationType } = useApplyEaseStore();

  const [selectedTypeId, setSelectedTypeId] = useState<string>(applicationTypes[0]?.id || '');
  const selectedType = applicationTypes.find(t => t.id === selectedTypeId) || applicationTypes[0];
  const [stages, setStages] = useState<WorkflowStageDefinition[]>(
    () => JSON.parse(JSON.stringify(selectedType?.workflowDefinition.stages || []))
  );
  const [dirty, setDirty] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // New service form
  const [draft, setDraft] = useState({
    title: '',
    key: '',
    category: 'academic' as ApplicationType['category'],
    description: '',
    durationDays: 5,
    firstDepartment: 'Computer Science & Engineering',
    firstRole: 'Faculty Advisor'
  });
  const [createError, setCreateError] = useState<string | null>(null);

  const departments = useMemo(() => {
    const set = new Set<string>();
    users.forEach(u => u.department && set.add(u.department));
    applicationTypes.forEach(t =>
      t.workflowDefinition.stages.forEach(s => s.assignedDepartment && set.add(s.assignedDepartment))
    );
    return [...set].sort();
  }, [users, applicationTypes]);

  const staff = users.filter(u => u.role === 'staff');

  const selectType = (typeId: string) => {
    if (dirty && !confirm('Discard unsaved workflow changes?')) return;
    setSelectedTypeId(typeId);
    const target = applicationTypes.find(t => t.id === typeId);
    setStages(JSON.parse(JSON.stringify(target?.workflowDefinition.stages || [])));
    setDirty(false);
  };

  const updateStage = (index: number, patch: Partial<WorkflowStageDefinition>) => {
    setStages(prev => prev.map((stage, i) => (i === index ? { ...stage, ...patch } : stage)));
    setDirty(true);
  };

  const moveStage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= stages.length) return;
    setStages(prev => {
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
    setDirty(true);
  };

  const removeStage = (index: number) => {
    setStages(prev => prev.filter((_, i) => i !== index));
    setDirty(true);
  };

  const addStage = () => {
    setStages(prev => [...prev, makeStage({ order: prev.length, assignedDepartment: departments[0] || '' })]);
    setDirty(true);
  };

  const saveWorkflow = () => {
    if (!selectedType) return;
    const invalid = stages.find(stage => !stage.name.trim() || !stage.assignedDepartment.trim());
    if (invalid) {
      toast('error', 'Incomplete stage', 'Every stage needs a name and a department.');
      return;
    }
    if (stages.length === 0) {
      toast('error', 'No stages', 'A workflow needs at least one stage.');
      return;
    }
    const workflow: WorkflowDefinition = {
      ...selectedType.workflowDefinition,
      stages: stages.map((stage, index) => ({ ...stage, order: index }))
    };
    saveWorkflowDefinition(selectedType.id, workflow);
    setDirty(false);
    toast('success', 'Workflow published', `Version ${selectedType.workflowDefinition.version + 1} is live for new submissions.`);
  };

  const submitNewService = () => {
    setCreateError(null);
    const title = draft.title.trim();
    const key = (draft.key.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).toLowerCase();

    if (!title) return setCreateError('Give the service a title.');
    if (!key) return setCreateError('A service key is required.');
    if (applicationTypes.some(t => t.key === key)) return setCreateError('That service key is already in use.');

    const id = `app-type-${Date.now().toString(36)}`;
    const stage = makeStage({
      name: `${draft.firstDepartment.split('&')[0].trim()} Review`,
      assignedDepartment: draft.firstDepartment,
      assignedRole: draft.firstRole,
      order: 0
    });

    const formConfig: FormTemplate = {
      version: 1,
      title,
      description: draft.description || `${title} request`,
      instructions: 'Complete every required field and attach the requested documents.',
      fields: [],
      requiredDocuments: [],
      declarations: ['I confirm that the information provided is accurate and complete.'],
      feeRules: { required: false, amount: 0 }
    };

    const documentTemplate: OfficialDocumentTemplate = {
      id: `doc-${id}`,
      version: 1,
      title: `${title.toUpperCase()} — OFFICIAL ORDER`,
      subtitle: 'Apex State University',
      orientation: 'portrait',
      headerNotice: 'APEX STATE UNIVERSITY · OFFICE OF THE REGISTRAR',
      bodyParagraphs: [
        `This is to certify that {{student_name}} ({{registration_number}}) has been granted the ${title.toLowerCase()} recorded under reference {{application_ref}}.`,
        'This order is issued electronically and may be verified against the university registry using the code printed below.'
      ],
      signatureSlots: [],
      stampSlots: [],
      footerNotice: 'Issued by the Office of the Registrar · Apex State University',
      includeVerificationQR: true
    };

    const newType: ApplicationType = {
      id,
      key,
      title,
      description: draft.description || `${title} request`,
      category: draft.category,
      icon: 'FileText',
      estimatedDurationDays: Number(draft.durationDays) || 5,
      active: true,
      publishedVersion: 1,
      formConfig,
      documentTemplate,
      workflowDefinition: { id: `wf-${id}`, version: 1, stages: [stage] }
    };

    createApplicationType(newType);
    setSelectedTypeId(id);
    setStages([stage]);
    setDirty(false);
    setShowCreate(false);
    setDraft({
      title: '',
      key: '',
      category: 'academic',
      description: '',
      durationDays: 5,
      firstDepartment: departments[0] || 'Computer Science & Engineering',
      firstRole: 'Faculty Advisor'
    });
    toast('success', 'Service created', 'Now add form fields, then finish the workflow.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <span>Administration</span>
            <span aria-hidden="true">·</span>
            <span>Services</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Services & Workflows</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create a service, then define every stage it passes through: the department, the officer,
            the deadline, and whether it carries a signature and seal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('admin-form-builder')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Form fields</span>
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#f4772e] hover:bg-[#de6219] rounded-lg shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New service</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Service list */}
        <aside className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Services</h2>
            <span className="text-[11px] font-mono text-slate-400">{applicationTypes.length}</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[65vh] overflow-y-auto">
            {applicationTypes.map(type => {
              const active = type.id === selectedTypeId;
              return (
                <button
                  key={type.id}
                  onClick={() => selectType(type.id)}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    active ? 'bg-slate-50' : 'hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-semibold ${active ? 'text-[#172b50]' : 'text-slate-800'}`}>
                      {type.title}
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-[#f4772e]' : 'text-slate-300'}`} />
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <GitBranch className="w-3 h-3" />
                      {type.workflowDefinition.stages.length} stages
                    </span>
                    <span>·</span>
                    <span className="capitalize">{type.category}</span>
                    {type.hasUnpublishedDraft && (
                      <span className="text-amber-700 bg-amber-50 border border-amber-200 rounded px-1">draft</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Workflow editor */}
        <section className="lg:col-span-8 space-y-4">
          {!selectedType ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500">
              Create a service to define its workflow.
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">{selectedType.title}</h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Workflow version {selectedType.workflowDefinition.version} · {stages.length} stage
                      {stages.length === 1 ? '' : 's'} · changes apply to new submissions only
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={addStage}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#172b50] bg-slate-50 border border-slate-300 hover:bg-slate-100 rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add stage
                    </button>
                    <button
                      onClick={saveWorkflow}
                      disabled={!dirty}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#172b50] hover:bg-[#1f3763] disabled:bg-slate-300 rounded-lg"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Publish workflow
                    </button>
                  </div>
                </div>
              </div>

              {stages.some(stage => stage.requiresSignature || stage.requiresStamp) && (
                <div className="bg-amber-50 border border-amber-200 text-[11px] text-amber-900 rounded-xl px-4 py-2.5 leading-relaxed">
                  <strong>Signature &amp; seal required on:</strong>{' '}
                  {stages
                    .filter(stage => stage.requiresSignature || stage.requiresStamp)
                    .map(stage => `${stage.name} (${stage.assignedDepartment || 'no department'})`)
                    .join(' · ')}
                </div>
              )}

              <div className="space-y-3">
                {stages.map((stage, index) => {
                  const deptStaff = staff.filter(u => u.department === stage.assignedDepartment);
                  const otherStaff = staff.filter(u => u.department !== stage.assignedDepartment);
                  const hasSigningOfficer = deptStaff.some(person => isSigningTitle(person.designation));
                  const signingStage = stage.requiresSignature || stage.requiresStamp;
                  return (
                    <div key={stage.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#172b50] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                            {signingStage ? 'Signature & seal stage' : 'Review stage'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveStage(index, -1)}
                            disabled={index === 0}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-30"
                            aria-label="Move stage up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveStage(index, 1)}
                            disabled={index === stages.length - 1}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-30"
                            aria-label="Move stage down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removeStage(index)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            aria-label="Remove stage"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        <label className="space-y-1">
                          <span className="text-[11px] font-semibold text-slate-600">Stage name</span>
                          <input
                            value={stage.name}
                            onChange={e => updateStage(index, { name: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50] focus:bg-white"
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-[11px] font-semibold text-slate-600">Department</span>
                          <input
                            list="applyease-departments"
                            value={stage.assignedDepartment}
                            onChange={e => updateStage(index, { assignedDepartment: e.target.value, assignedStaffId: undefined })}
                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50] focus:bg-white"
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-[11px] font-semibold text-slate-600">Role expected to act</span>
                          <input
                            value={stage.assignedRole}
                            onChange={e => updateStage(index, { assignedRole: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50] focus:bg-white"
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                            <Users className="w-3 h-3" /> Assign faculty
                          </span>
                          <select
                            value={stage.assignedStaffId || ''}
                            onChange={e => updateStage(index, { assignedStaffId: e.target.value || undefined })}
                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50] focus:bg-white"
                          >
                            <option value="">
                              {deptStaff.length > 0
                                ? `Unassigned — any of the ${deptStaff.length} officers below`
                                : 'Unassigned — any officer in the department'}
                            </option>

                            {deptStaff.length > 0 && (
                              <optgroup label={`${stage.assignedDepartment} (${deptStaff.length})`}>
                                {deptStaff.map(person => (
                                  <option key={person.id} value={person.id}>
                                    {person.name} — {person.designation || person.role}
                                  </option>
                                ))}
                              </optgroup>
                            )}

                            {otherStaff.length > 0 && (
                              <optgroup
                                label={
                                  deptStaff.length > 0
                                    ? 'Other departments'
                                    : 'No staff in this department — assign from another'
                                }
                              >
                                {otherStaff.map(person => (
                                  <option key={person.id} value={person.id}>
                                    {person.name} — {person.department}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                          <span className="block text-[10px] text-slate-500">
                            {deptStaff.length > 0
                              ? `${deptStaff.length} staff in ${stage.assignedDepartment}: ${deptStaff.map(p => p.name).join(', ')}`
                              : stage.assignedDepartment
                                ? `No staff registered in ${stage.assignedDepartment} — provision one in Users, or assign from another department.`
                                : 'Choose a department to see its staff.'}
                          </span>
                        </label>

                        <label className="space-y-1">
                          <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> SLA (business hours)
                          </span>
                          <input
                            type="number"
                            min={1}
                            value={stage.slaHours}
                            onChange={e => updateStage(index, { slaHours: Math.max(1, Number(e.target.value) || 1) })}
                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50] focus:bg-white"
                          />
                        </label>

                        <div className="space-y-2 sm:pt-5">
                          <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={stage.requiresSignature}
                              onChange={e => updateStage(index, { requiresSignature: e.target.checked })}
                              className="w-3.5 h-3.5 rounded border-slate-300 text-[#172b50]"
                            />
                            <PenTool className="w-3 h-3" /> Requires HOD signature
                          </label>
                          <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={stage.requiresStamp}
                              onChange={e => updateStage(index, { requiresStamp: e.target.checked })}
                              className="w-3.5 h-3.5 rounded border-slate-300 text-[#172b50]"
                            />
                            <Stamp className="w-3 h-3" /> Requires department seal
                          </label>
                        </div>
                      </div>

                      {signingStage && (
                        hasSigningOfficer ? (
                          <p className="mt-3 text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                            Applied only by the head of {stage.assignedDepartment || 'this department'}.
                            The administrator and other faculty cannot sign on that department's behalf.
                          </p>
                        ) : (
                          <p className="mt-3 text-[10px] text-rose-800 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5">
                            No signing officer is registered in {stage.assignedDepartment || 'this department'} —
                            this stage can never be completed. Add a Head of Department in <strong>Users</strong>,
                            or turn off the signature/seal requirement here.
                          </p>
                        )
                      )}
                    </div>
                  );
                })}

                {stages.length === 0 && (
                  <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
                    <Layers className="w-7 h-7 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700 mt-2">No stages yet</p>
                    <p className="text-xs text-slate-500 mt-1">Add the first review stage to build the route.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      <datalist id="applyease-departments">
        {departments.map(dept => (
          <option key={dept} value={dept} />
        ))}
      </datalist>

      {/* New service modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-[overlay-in_120ms_ease-out]" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 animate-[palette-in_140ms_ease-out]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900">Create a new service</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold text-slate-600">Service title</span>
                <input
                  value={draft.title}
                  onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                  placeholder="e.g. Transcript Request"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50] focus:bg-white"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600">Key (URL-safe)</span>
                  <input
                    value={draft.key}
                    onChange={e => setDraft(d => ({ ...d, key: e.target.value }))}
                    placeholder="transcript-request"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50] focus:bg-white"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600">Category</span>
                  <select
                    value={draft.category}
                    onChange={e => setDraft(d => ({ ...d, category: e.target.value as ApplicationType['category'] }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50] focus:bg-white"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-[11px] font-semibold text-slate-600">Description</span>
                <textarea
                  rows={2}
                  value={draft.description}
                  onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
                  placeholder="What the student is requesting"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50] focus:bg-white"
                />
              </label>

              <div className="grid grid-cols-3 gap-3">
                <label className="block space-y-1 col-span-1">
                  <span className="text-[11px] font-semibold text-slate-600">Days</span>
                  <input
                    type="number"
                    min={1}
                    value={draft.durationDays}
                    onChange={e => setDraft(d => ({ ...d, durationDays: Number(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50] focus:bg-white"
                  />
                </label>
                <label className="block space-y-1 col-span-2">
                  <span className="text-[11px] font-semibold text-slate-600">First department</span>
                  <input
                    list="applyease-departments"
                    value={draft.firstDepartment}
                    onChange={e => setDraft(d => ({ ...d, firstDepartment: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50] focus:bg-white"
                  />
                </label>
              </div>

              {createError && (
                <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{createError}</p>
              )}
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex items-center justify-end gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={submitNewService}
                className="px-3.5 py-2 text-xs font-bold text-white bg-[#172b50] hover:bg-[#1f3763] rounded-lg"
              >
                Create service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
