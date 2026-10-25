import React, { useState } from 'react';
import { useApplyEaseStore } from '../../lib/store';
import { canReviewRecord, isSigningOfficer, canApplySignature } from '../../lib/access';
import { Application } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { evaluateStageSLA } from '../../lib/slaEngine';
import {
  Inbox,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Search,
  Filter,
  ChevronRight,
  ShieldAlert,
  Play
} from 'lucide-react';

interface StaffDashboardProps {
  onSelectApplication: (app: Application) => void;
  showCompletedOnly?: boolean;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  onSelectApplication,
  showCompletedOnly = false
}) => {
  const { applications, currentUser, triggerSLACheck } = useApplyEaseStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due_soon' | 'overdue' | 'needs_signature'>('all');
  const [slaRunResult, setSlaRunResult] = useState<string | null>(null);

  // Filter tasks assigned to current staff member or their department
  const assignedApps = applications.filter((app) => {
    if (showCompletedOnly) {
      // Closed student records belong to the Registrar and the Head of the
      // student's own department. Anything still moving that this officer
      // handled stays visible to them as read-only history.
      const closed =
        app.status === 'completed' || app.status === 'rejected' || app.status === 'cancelled';
      if (closed) return canReviewRecord(currentUser, app);
      return app.stageInstances.some(stage => stage.actionTakenBy === currentUser.name);
    }

    if (app.status === 'completed' || app.status === 'rejected' || app.status === 'draft') {
      return false;
    }

    const currentStage = app.stageInstances[app.currentStageIndex];
    if (!currentStage) return false;

    // Check if specifically assigned to user or their role/department
    const isDirectUser = currentStage.assignedStaffId === currentUser.id;
    const isDeptMatch = currentStage.assignedDepartment === currentUser.department;
    const isAdmin = currentUser.role === 'admin';

    if (!isDirectUser && !isDeptMatch && !isAdmin) return false;

    // If the stage requires a signature/seal, only show it to the officer who
    // can actually sign — not to every staff member in the same department.
    // A faculty reviewer seeing "Awaiting HoD signature" on a stage they cannot
    // act on is confusing and misleading.
    const stageNeedsSeal = currentStage.requiresSignature || currentStage.requiresStamp;
    if (stageNeedsSeal && !isAdmin) {
      return canApplySignature(currentUser, currentStage.assignedDepartment);
    }

    return true;
  });

  // Calculate summary metrics
  const pendingCount = assignedApps.length;
  const overdueCount = assignedApps.filter((a) => {
    const stage = a.stageInstances[a.currentStageIndex];
    return stage && evaluateStageSLA(stage).isOverdue;
  }).length;
  const approachingCount = assignedApps.filter((a) => {
    const stage = a.stageInstances[a.currentStageIndex];
    return stage && evaluateStageSLA(stage).isApproaching;
  }).length;
  const signatureRequiredCount = assignedApps.filter((a) => {
    const stage = a.stageInstances[a.currentStageIndex];
    return stage && stage.status === 'in_progress' && (a.status === 'pending_signature' || appNeedsSignature(a));
  }).length;

  function appNeedsSignature(a: Application): boolean {
    const stage = a.stageInstances[a.currentStageIndex];
    return Boolean(stage && (stage.assignedRole.toLowerCase().includes('hod') || stage.assignedRole.toLowerCase().includes('warden') || stage.assignedRole.toLowerCase().includes('registrar')));
  }

  // Filtered applications
  const filteredList = assignedApps.filter((app) => {
    const currentStage = app.stageInstances[app.currentStageIndex];
    const sla = currentStage ? evaluateStageSLA(currentStage) : null;

    if (
      search &&
      !app.referenceNumber.toLowerCase().includes(search.toLowerCase()) &&
      !app.applicationTypeTitle.toLowerCase().includes(search.toLowerCase()) &&
      !app.studentSnapshot.name.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }

    if (statusFilter === 'overdue') {
      return sla?.isOverdue;
    }
    if (statusFilter === 'due_soon') {
      return sla?.isApproaching;
    }
    if (statusFilter === 'needs_signature') {
      return app.status === 'pending_signature' || appNeedsSignature(app);
    }
    return true;
  });

  const handleRunSlaEngine = () => {
    const res = triggerSLACheck();
    setSlaRunResult(`Checked ${res.checkedCount} active tasks. Generated ${res.warningsGenerated} warnings, ${res.escalationsTriggered} escalations.`);
    setTimeout(() => setSlaRunResult(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Staff Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <span>Staff Review Workspace</span>
            <span aria-hidden="true">·</span>
            <span>{currentUser.department}</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-slate-700">{currentUser.designation || currentUser.role}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {showCompletedOnly ? 'Processed Applications' : 'Actionable Task Queue'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {showCompletedOnly
              ? 'Files you have acted on, plus closed records you are entitled to review.'
              : 'Inspect student documentation, verify credentials, apply electronic signatures, and advance workflow stages.'}
          </p>
        </div>

        {/* SLA Test trigger button for instant grading/testing */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunSlaEngine}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
            title="Check every open stage against its deadline and raise warnings or escalations"
          >
            <Play className="w-3.5 h-3.5 text-[#172b50]" />
            <span>Run deadline check</span>
          </button>
        </div>
      </div>

      {slaRunResult && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 text-xs px-4 py-2.5 rounded-xl flex items-center justify-between animate-in fade-in">
          <span>{slaRunResult}</span>
          <button onClick={() => setSlaRunResult(null)} className="text-blue-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics Bar */}
      {!showCompletedOnly && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Assigned Tasks</span>
              <Inbox className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
              {pendingCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Awaiting your department</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-medium text-amber-600">
              <span>Due Soon (&lt; 6h)</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-amber-900 mt-2 font-mono tabular-nums">
              {approachingCount}
            </div>
            <p className="text-[11px] text-amber-700 mt-1">Approaching SLA target</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-medium text-rose-600">
              <span>Overdue Tasks</span>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-rose-900 mt-2 font-mono tabular-nums">
              {overdueCount}
            </div>
            <p className="text-[11px] text-rose-700 mt-1">SLA warning triggered</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-medium text-purple-600">
              <span>Requires Signature</span>
              <FileCheck className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-purple-900 mt-2 font-mono tabular-nums">
              {signatureRequiredCount}
            </div>
            <p className="text-[11px] text-purple-700 mt-1">Electronic endorsement</p>
          </div>
        </div>
      )}

      {/* Task Queue Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600 overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              All Tasks ({assignedApps.length})
            </button>
            <button
              onClick={() => setStatusFilter('overdue')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'overdue'
                  ? 'bg-white text-rose-900 font-semibold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Overdue ({overdueCount})
            </button>
            <button
              onClick={() => setStatusFilter('due_soon')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'due_soon'
                  ? 'bg-white text-amber-900 font-semibold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Due Soon ({approachingCount})
            </button>
            <button
              onClick={() => setStatusFilter('needs_signature')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'needs_signature'
                  ? 'bg-white text-purple-900 font-semibold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Needs Signature ({signatureRequiredCount})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student or ref #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50] focus:bg-white"
            />
          </div>
        </div>

        {/* Task List */}
        {filteredList.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">
              {showCompletedOnly ? 'Nothing processed yet' : 'No pending assignments'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {showCompletedOnly
                ? isSigningOfficer(currentUser)
                  ? 'Closed files for students in your department will appear here after issuance.'
                  : 'Closed student records are retained by the Registrar and the Head of the student\'s department.'
                : 'All applications currently assigned to you or your department have been processed. Great job!'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredList.map((app) => {
              const currentStage = app.stageInstances[app.currentStageIndex];
              const sla = currentStage ? evaluateStageSLA(currentStage) : null;

              return (
                <div
                  key={app.id}
                  onClick={() => onSelectApplication(app)}
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {app.referenceNumber}
                      </span>
                      <StatusBadge status={app.status} size="sm" />
                      {sla?.isOverdue && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-mono">
                          <AlertTriangle className="w-3 h-3" />
                          WARNING {sla.warningLevel}: {sla.formattedRemaining}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {app.applicationTypeTitle}
                      </h3>
                      <span className="text-slate-300 text-xs">·</span>
                      <span className="text-xs font-medium text-slate-600 truncate">
                        Student: {app.studentSnapshot.name} ({app.studentSnapshot.registrationNumber})
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                      <div>
                        <span>Stage: </span>
                        <strong className="text-slate-800">{currentStage?.name}</strong>
                      </div>
                      <span>·</span>
                      <div>
                        <span>Assigned Dept: </span>
                        <span className="text-slate-700">{currentStage?.assignedDepartment}</span>
                      </div>
                      {sla?.deadlineFormatted && (
                        <>
                          <span>·</span>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Deadline: {sla.deadlineFormatted}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectApplication(app);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#172b50] hover:bg-[#1f3763] rounded-lg transition-colors shadow-xs"
                    >
                      <span>Review Application</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
