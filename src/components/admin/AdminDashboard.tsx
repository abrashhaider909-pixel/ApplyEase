import React, { useMemo, useState } from 'react';
import { useApplyEaseStore } from '../../lib/store';
import { StatusBadge } from '../common/StatusBadge';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Play,
  TrendingUp,
  Building2,
  ShieldCheck,
  Activity
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
  onSelectApplication: (ref: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateTab,
  onSelectApplication
}) => {
  const { applications, applicationTypes, auditLogs, triggerSLACheck } = useApplyEaseStore();
  const [slaMessage, setSlaMessage] = useState<string | null>(null);

  const total = applications.length;
  const completed = applications.filter((a) => a.status === 'completed').length;
  const inProgress = applications.filter(
    (a) =>
      a.status === 'under_verification' ||
      a.status === 'pending_approval' ||
      a.status === 'pending_signature' ||
      a.status === 'submitted'
  ).length;
  const overdue = applications.filter((a) => a.status === 'overdue').length;
  const actionRequired = applications.filter(
    (a) => a.status === 'awaiting_student_action' || a.status === 'awaiting_payment'
  ).length;

  const slaCompliancePct = total > 0 ? Math.round(((total - overdue) / total) * 100) : 100;

  const handleRunSlaEngine = () => {
    const res = triggerSLACheck();
    setSlaMessage(`Scheduler Pass Completed: Evaluated ${res.checkedCount} tasks. ${res.warningsGenerated} warnings generated, ${res.escalationsTriggered} escalations to Admin.`);
    setTimeout(() => setSlaMessage(null), 6000);
  };

  /* Department workload derived from the live workflow instances, not a
     hardcoded table — the numbers move as applications advance. */
  const departmentStats = useMemo(() => {
    const map = new Map<string, { total: number; overdue: number }>();
    applications.forEach(app => {
      const stage = app.stageInstances[app.currentStageIndex];
      const department = stage?.assignedDepartment || app.studentSnapshot.department;
      if (!department) return;
      const entry = map.get(department) || { total: 0, overdue: 0 };
      entry.total += 1;
      if (app.status === 'overdue') entry.overdue += 1;
      map.set(department, entry);
    });
    return [...map.entries()]
      .map(([name, value]) => ({
        name,
        count: value.total,
        overdue: value.overdue,
        compliance: value.total ? Math.round(((value.total - value.overdue) / value.total) * 100) : 100
      }))
      .sort((a, b) => b.count - a.count);
  }, [applications]);

  const maxDepartmentCount = departmentStats.reduce((max, d) => Math.max(max, d.count), 1);

  const relativeTime = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const minutes = Math.round(diffMs / 60000);
    if (!Number.isFinite(minutes)) return '';
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <span>University Administration Center</span>
            <span aria-hidden="true">·</span>
            <span>Office of the Registrar</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Institutional Operations & SLA Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Oversee cross-departmental processing workflows, enforce SLA accountability, and manage dynamic templates.
          </p>
        </div>

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

      {slaMessage && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 text-xs px-4 py-3 rounded-xl flex items-center justify-between animate-in fade-in">
          <span>{slaMessage}</span>
          <button onClick={() => setSlaMessage(null)} className="text-blue-700 hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* 5 Executive Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Total Applications</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
            {total}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">University-wide filings</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-blue-600">
            <span>In Processing</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-blue-900 mt-2 font-mono tabular-nums">
            {inProgress}
          </div>
          <p className="text-[11px] text-blue-700 mt-1">Active in stage queues</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-rose-600">
            <span>Overdue / Escalated</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-rose-900 mt-2 font-mono tabular-nums">
            {overdue}
          </div>
          <p className="text-[11px] text-rose-700 mt-1">SLA warning triggered</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-emerald-600">
            <span>SLA Compliance</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-emerald-900 mt-2 font-mono tabular-nums">
            {slaCompliancePct}%
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">On-time processing rate</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Documents Issued</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
            {completed}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Signed & sealed orders</p>
        </div>
      </div>

      {/* Cross-Department Workload & Recent Filings Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Processing Volume */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#172b50]" />
              <span>Departmental Application Volume</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Real-time</span>
          </div>

          <div className="space-y-3">
            {departmentStats.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-500">
                No applications are in a departmental queue right now.
              </div>
            )}
            {departmentStats.map((dept) => (
              <div key={dept.name} className="p-3 bg-slate-50 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-900 truncate">{dept.name}</h4>
                    <span className="text-[11px] text-slate-500">
                      SLA compliance:{' '}
                      <strong className={dept.overdue > 0 ? 'text-rose-700' : 'text-emerald-700'}>
                        {dept.compliance}%
                      </strong>
                      {dept.overdue > 0 && ` · ${dept.overdue} overdue`}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200 shrink-0">
                    {dept.count} {dept.count === 1 ? 'case' : 'cases'}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${dept.overdue > 0 ? 'bg-rose-400' : 'bg-[#172b50]'}`}
                    style={{ width: `${Math.max(6, Math.round((dept.count / maxDepartmentCount) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Applications Monitor */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#172b50]" />
              <span>All Active University Applications</span>
            </h3>
            <button
              onClick={() => onNavigateTab('admin-applications')}
              className="text-[11px] font-semibold text-[#172b50] hover:text-[#f4772e] inline-flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {applications.slice(0, 5).map((app) => (
              <div
                key={app.id}
                onClick={() => onSelectApplication(app.referenceNumber)}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {app.referenceNumber}
                    </span>
                    <StatusBadge status={app.status} size="sm" />
                  </div>
                  <p className="text-xs text-slate-600 truncate mt-0.5">
                    {app.applicationTypeTitle} • {app.studentSnapshot.name}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live activity stream */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#172b50]" />
            <span>Live Audit Activity</span>
          </h3>
          <button
            onClick={() => onNavigateTab('admin-audit-logs')}
            className="text-[11px] font-semibold text-[#172b50] hover:text-[#f4772e] inline-flex items-center gap-1"
          >
            <span>Full audit trail</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No activity recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {auditLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="py-2.5 flex items-start gap-3">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#f4772e] shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-800 font-mono tracking-tight">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    {log.applicationRef && (
                      <button
                        onClick={() => onSelectApplication(log.applicationRef!)}
                        className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
                      >
                        {log.applicationRef}
                      </button>
                    )}
                    <span className="text-[10px] text-slate-400 ml-auto shrink-0">{relativeTime(log.timestamp)}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate">{log.details}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {log.actorName} · {log.actorRole}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


    </div>
  );
};
