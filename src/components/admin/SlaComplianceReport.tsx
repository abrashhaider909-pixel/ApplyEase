import React, { useEffect, useMemo, useState } from 'react';
import { useApplyEaseStore } from '../../lib/store';
import { evaluateStageSLA } from '../../lib/slaEngine';
import { toast } from '../../lib/toast';
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Clock,
  Download,
  RefreshCw,
  ShieldAlert,
  TimerReset,
  Users
} from 'lucide-react';

interface BreachRow {
  applicationRef: string;
  applicationTitle: string;
  stageName: string;
  deadline?: string;
  hoursOverdue: number;
}

interface OfficerRow {
  staffId: string;
  name: string;
  role: string;
  department: string;
  overdue: number;
  atRisk: number;
  openTasks: number;
  worstDelayHours: number;
  breaches: BreachRow[];
}

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${Math.floor(hours / 24)}d ${Math.round(hours % 24)}h`;
}

/**
 * Automatic SLA compliance report.
 *
 * Reads every live workflow stage, compares its deadline with the current time,
 * and groups the misses per officer — so the administrator can see who is
 * holding a file past its target without chasing individual applications.
 */
export const SlaComplianceReport: React.FC = () => {
  const { applications, users, addNotification, addAuditLog } = useApplyEaseStore();
  const [tick, setTick] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Keep the numbers honest without a manual refresh.
  useEffect(() => {
    const timer = window.setInterval(() => setTick(value => value + 1), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const rows = useMemo<OfficerRow[]>(() => {
    const byOfficer = new Map<string, OfficerRow>();

    applications
      .filter(app => !['completed', 'rejected', 'cancelled'].includes(app.status))
      .forEach(app => {
        app.stageInstances.forEach(stage => {
          // `escalated` stages are precisely the ones that blew their deadline.
          if (!['in_progress', 'pending', 'escalated'].includes(stage.status)) return;
          if (!stage.deadline) return;

          const sla = evaluateStageSLA(stage);
          const key = stage.assignedStaffId || `${stage.assignedRole}::${stage.assignedDepartment}`;
          const officer = users.find(user => user.id === stage.assignedStaffId);

          const row = byOfficer.get(key) ?? {
            staffId: key,
            name: stage.assignedStaffName || officer?.name || stage.assignedRole || 'Unassigned',
            role: stage.assignedRole || officer?.designation || 'Reviewer',
            department: stage.assignedDepartment || officer?.department || '—',
            overdue: 0,
            atRisk: 0,
            openTasks: 0,
            worstDelayHours: 0,
            breaches: []
          };

          row.openTasks += 1;

          if (sla.isOverdue) {
            row.overdue += 1;
            row.worstDelayHours = Math.max(row.worstDelayHours, sla.hoursOverdue);
            row.breaches.push({
              applicationRef: app.referenceNumber,
              applicationTitle: app.applicationTypeTitle,
              stageName: stage.name,
              deadline: stage.deadline,
              hoursOverdue: sla.hoursOverdue
            });
          } else if (sla.isApproaching) {
            row.atRisk += 1;
          }

          byOfficer.set(key, row);
        });
      });

    return [...byOfficer.values()].sort(
      (a, b) => b.overdue - a.overdue || b.worstDelayHours - a.worstDelayHours || a.name.localeCompare(b.name)
    );
  }, [applications, users, tick]);

  const breaching = rows.filter(row => row.overdue > 0);
  const totalOverdue = breaching.reduce((sum, row) => sum + row.overdue, 0);
  const worst = breaching.reduce((max, row) => Math.max(max, row.worstDelayHours), 0);
  const atRisk = rows.reduce((sum, row) => sum + row.atRisk, 0);
  const generatedAt = new Date();

  const exportCsv = () => {
    const header = ['Officer', 'Role', 'Department', 'Overdue tasks', 'At risk', 'Open tasks', 'Worst delay (hours)'];
    const lines = rows.map(row => [
      row.name,
      row.role,
      row.department,
      String(row.overdue),
      String(row.atRisk),
      String(row.openTasks),
      row.worstDelayHours.toFixed(1)
    ]);
    const csv = [header, ...lines]
      .map(cells => cells.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SLA_Compliance_${generatedAt.toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast('success', 'Report exported', 'The SLA compliance report has been downloaded as CSV.');
  };

  const remind = (row: OfficerRow) => {
    const officer = users.find(user => user.id === row.staffId);
    if (!officer) {
      toast('error', 'No account linked', `${row.name} has no active account to notify.`);
      return;
    }
    addNotification({
      userId: officer.id,
      title: 'SLA reminder: pending decisions',
      message: `You have ${row.overdue} task${row.overdue === 1 ? '' : 's'} past the SLA target (worst delay ${formatHours(row.worstDelayHours)}). Please review your queue.`,
      type: 'warning',
      read: false
    });
    addAuditLog(
      'SLA_REMINDER_SENT',
      `Administrator sent an SLA reminder to ${row.name} for ${row.overdue} overdue task(s).`
    );
    toast('success', 'Reminder sent', `${row.name} was notified about ${row.overdue} overdue task(s).`);
  };

  const remindAll = () => {
    breaching.forEach(remind);
  };

  const cards = [
    { label: 'Overdue tasks', value: totalOverdue, icon: AlertTriangle, tone: 'rose' },
    { label: 'Officers breaching SLA', value: breaching.length, icon: ShieldAlert, tone: 'amber' },
    { label: 'Tasks nearing deadline', value: atRisk, icon: Clock, tone: 'sky' },
    { label: 'Worst delay', value: worst > 0 ? formatHours(worst) : '—', icon: TimerReset, tone: 'slate' }
  ] as const;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Faculty SLA Compliance</h1>
          <p className="text-sm text-slate-500 mt-1">
            Generated automatically from live workflow deadlines · refreshed {generatedAt.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTick(value => value + 1)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={remindAll}
            disabled={breaching.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#172b50] hover:bg-[#1f3763] rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <BellRing className="w-3.5 h-3.5" /> Remind all
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(card => {
          const Icon = card.icon;
          const tone =
            card.tone === 'rose'
              ? 'text-rose-600 bg-rose-50'
              : card.tone === 'amber'
                ? 'text-amber-600 bg-amber-50'
                : card.tone === 'sky'
                  ? 'text-sky-600 bg-sky-50'
                  : 'text-slate-600 bg-slate-100';
          return (
            <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tone}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-3">{card.value}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{card.label}</p>
            </div>
          );
        })}
      </div>

      {breaching.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-emerald-900">No officer is past an SLA target</p>
          <p className="text-xs text-emerald-700 mt-1">
            Every live stage is inside its deadline{atRisk > 0 ? ` · ${atRisk} task${atRisk === 1 ? '' : 's'} nearing the limit` : ''}.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900">Officers with overdue tasks</h2>
          </div>

          <div className="divide-y divide-slate-100">
            {breaching.map(row => (
              <div key={row.staffId}>
                <button
                  onClick={() => setExpanded(expanded === row.staffId ? null : row.staffId)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {row.overdue}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{row.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {row.role} · {row.department}
                    </p>
                  </div>
                  <div className="hidden sm:block text-right shrink-0">
                    <p className="text-[11px] text-slate-500">Worst delay</p>
                    <p className="text-xs font-semibold text-rose-700">{formatHours(row.worstDelayHours)}</p>
                  </div>
                  <div className="hidden sm:block text-right shrink-0 w-20">
                    <p className="text-[11px] text-slate-500">Open tasks</p>
                    <p className="text-xs font-semibold text-slate-700">{row.openTasks}</p>
                  </div>
                  <span
                    onClick={event => {
                      event.stopPropagation();
                      remind(row);
                    }}
                    className="ml-2 inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[#172b50] bg-slate-100 hover:bg-slate-200 rounded shrink-0"
                  >
                    <BellRing className="w-3 h-3" /> Remind
                  </span>
                </button>

                {expanded === row.staffId && (
                  <div className="px-4 pb-3 bg-slate-50/70">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-wide text-slate-500">
                          <th className="py-2 font-semibold">Reference</th>
                          <th className="py-2 font-semibold">Application</th>
                          <th className="py-2 font-semibold">Stage</th>
                          <th className="py-2 font-semibold text-right">Late by</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {row.breaches.map(breach => (
                          <tr key={`${breach.applicationRef}-${breach.stageName}`} className="text-xs">
                            <td className="py-2 font-mono text-[11px] text-slate-600">{breach.applicationRef}</td>
                            <td className="py-2 text-slate-800 truncate max-w-[220px]">{breach.applicationTitle}</td>
                            <td className="py-2 text-slate-600">{breach.stageName}</td>
                            <td className="py-2 text-right font-semibold text-rose-700">
                              {formatHours(breach.hoursOverdue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">All officers with live tasks</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Includes officers who are currently on time.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 font-semibold">Officer</th>
                <th className="px-4 py-2 font-semibold">Department</th>
                <th className="px-4 py-2 font-semibold text-right">Open</th>
                <th className="px-4 py-2 font-semibold text-right">At risk</th>
                <th className="px-4 py-2 font-semibold text-right">Overdue</th>
                <th className="px-4 py-2 font-semibold text-right">Worst delay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(row => (
                <tr key={`all-${row.staffId}`} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <p className="font-semibold text-slate-800">{row.name}</p>
                    <p className="text-[11px] text-slate-500">{row.role}</p>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{row.department}</td>
                  <td className="px-4 py-2 text-right text-slate-700">{row.openTasks}</td>
                  <td className="px-4 py-2 text-right text-amber-700">{row.atRisk}</td>
                  <td className={`px-4 py-2 text-right font-semibold ${row.overdue > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                    {row.overdue}
                  </td>
                  <td className="px-4 py-2 text-right text-slate-600">
                    {row.worstDelayHours > 0 ? formatHours(row.worstDelayHours) : '—'}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    No live workflow stages right now.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
