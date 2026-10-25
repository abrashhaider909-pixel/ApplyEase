import React, { useMemo, useState } from 'react';
import { useApplyEaseStore } from '../../lib/store';
import { StatusBadge } from '../common/StatusBadge';
import { toast } from '../../lib/toast';
import {
  Search,
  Download,
  ArrowRight,
  Filter,
  Clock,
  Building2,
  FileText,
  AlertTriangle,
  Inbox
} from 'lucide-react';

interface ApplicationRegistryProps {
  onSelectApplication: (ref: string) => void;
}

type SortKey = 'newest' | 'deadline' | 'reference';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'under_verification', label: 'Under verification' },
  { value: 'pending_approval', label: 'Pending approval' },
  { value: 'pending_signature', label: 'Pending signature' },
  { value: 'awaiting_student_action', label: 'Awaiting student action' },
  { value: 'awaiting_payment', label: 'Awaiting payment' },
  { value: 'overdue', label: 'Overdue / escalated' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' }
];

/**
 * University-wide application registry: the operational counterpart to the
 * executive dashboard. Search, filter, sort, open, and export every filing.
 */
export const ApplicationRegistry: React.FC<ApplicationRegistryProps> = ({ onSelectApplication }) => {
  const { applications } = useApplyEaseStore();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [department, setDepartment] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('newest');

  const departments = useMemo(() => {
    const set = new Set<string>();
    applications.forEach(app => {
      const dept = app.stageInstances[app.currentStageIndex]?.assignedDepartment;
      if (dept) set.add(dept);
    });
    return [...set].sort();
  }, [applications]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = applications.filter(app => {
      if (status !== 'all' && app.status !== status) return false;
      const dept = app.stageInstances[app.currentStageIndex]?.assignedDepartment;
      if (department !== 'all' && dept !== department) return false;
      if (!q) return true;
      return [
        app.referenceNumber,
        app.studentSnapshot.name,
        app.studentSnapshot.registrationNumber,
        app.applicationTypeTitle,
        dept || ''
      ]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });

    return [...filtered].sort((a, b) => {
      if (sortKey === 'reference') return a.referenceNumber.localeCompare(b.referenceNumber);
      if (sortKey === 'deadline') {
        const aTime = new Date(a.targetDeadline || a.estimatedCompletionDate || a.createdAt).getTime();
        const bTime = new Date(b.targetDeadline || b.estimatedCompletionDate || b.createdAt).getTime();
        return aTime - bTime;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [applications, query, status, department, sortKey]);

  const overdueCount = rows.filter(app => app.status === 'overdue').length;

  const deadlineLabel = (iso?: string) => {
    if (!iso) return { text: '—', tone: 'text-slate-400' };
    const diffMs = new Date(iso).getTime() - Date.now();
    const days = Math.ceil(diffMs / 86_400_000);
    if (days < 0) return { text: `${Math.abs(days)}d overdue`, tone: 'text-rose-700 font-semibold' };
    if (days === 0) return { text: 'Due today', tone: 'text-amber-700 font-semibold' };
    if (days === 1) return { text: 'Due tomorrow', tone: 'text-amber-700' };
    return { text: `in ${days} days`, tone: 'text-slate-600' };
  };

  const exportCsv = () => {
    const header = [
      'Reference',
      'Applicant',
      'Registration',
      'Application type',
      'Status',
      'Current stage',
      'Department',
      'Submitted',
      'Target deadline'
    ];
    const escape = (value: string) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const lines = rows.map(app => {
      const stage = app.stageInstances[app.currentStageIndex];
      return [
        app.referenceNumber,
        app.studentSnapshot.name,
        app.studentSnapshot.registrationNumber,
        app.applicationTypeTitle,
        app.status,
        stage?.name || '',
        stage?.assignedDepartment || '',
        app.submissionDate || app.createdAt,
        app.targetDeadline || ''
      ]
        .map(escape)
        .join(',');
    });

    const blob = new Blob([[header.map(escape).join(','), ...lines].join('\r\n')], {
      type: 'text/csv;charset=utf-8'
    });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = `applyease-applications-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(href);
    toast('success', 'Export ready', `${rows.length} applications written to CSV.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <span>Administration</span>
            <span aria-hidden="true">·</span>
            <span>Registry</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">All Applications</h1>
          <p className="text-xs text-slate-500 mt-1">
            Every filing across the university, with live stage ownership and deadline state.
          </p>
        </div>

        <button
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Matching filings', value: rows.length, tone: 'text-slate-900' },
          { label: 'Overdue in view', value: overdueCount, tone: overdueCount ? 'text-rose-700' : 'text-slate-900' },
          { label: 'Departments involved', value: departments.length, tone: 'text-slate-900' },
          { label: 'Completed in view', value: rows.filter(a => a.status === 'completed').length, tone: 'text-emerald-700' }
        ].map(metric => (
          <div key={metric.label} className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
            <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">{metric.label}</div>
            <div className={`text-xl font-bold font-mono tabular-nums mt-1 ${metric.tone}`}>{metric.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="p-4 flex flex-col lg:flex-row lg:items-center gap-3 border-b border-slate-100">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search reference, applicant, registration number…"
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50] focus:bg-white"
              aria-label="Search applications"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="text-xs bg-transparent focus:outline-none text-slate-700"
                aria-label="Filter by status"
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="text-xs bg-transparent focus:outline-none text-slate-700 max-w-[190px]"
                aria-label="Filter by department"
              >
                <option value="all">All departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortKey}
                onChange={e => setSortKey(e.target.value as SortKey)}
                className="text-xs bg-transparent focus:outline-none text-slate-700"
                aria-label="Sort applications"
              >
                <option value="newest">Newest first</option>
                <option value="deadline">Soonest deadline</option>
                <option value="reference">Reference</option>
              </select>
            </div>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-800 mt-3">No applications match these filters</p>
            <p className="text-xs text-slate-500 mt-1">Clear the search or widen the status filter.</p>
            <button
              onClick={() => {
                setQuery('');
                setStatus('all');
                setDepartment('all');
              }}
              className="mt-4 px-3 py-1.5 text-xs font-semibold text-[#172b50] border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-2.5 font-bold">Reference</th>
                  <th className="px-4 py-2.5 font-bold">Applicant</th>
                  <th className="px-4 py-2.5 font-bold">Application</th>
                  <th className="px-4 py-2.5 font-bold">Current stage</th>
                  <th className="px-4 py-2.5 font-bold">Status</th>
                  <th className="px-4 py-2.5 font-bold">Deadline</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(app => {
                  const stage = app.stageInstances[app.currentStageIndex];
                  const deadline = deadlineLabel(app.targetDeadline || app.estimatedCompletionDate);
                  return (
                    <tr
                      key={app.id}
                      onClick={() => onSelectApplication(app.referenceNumber)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-slate-900">{app.referenceNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-semibold text-slate-800">{app.studentSnapshot.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{app.studentSnapshot.registrationNumber}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-slate-800 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[220px]">{app.applicationTypeTitle}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-slate-800">{stage?.name || 'Completed'}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          {app.status === 'overdue' && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                          {stage?.assignedDepartment || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={app.status} size="sm" />
                      </td>
                      <td className={`px-4 py-3 text-xs whitespace-nowrap ${deadline.tone}`}>{deadline.text}</td>
                      <td className="px-4 py-3 text-right">
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#172b50] group-hover:translate-x-0.5 transition-all inline" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
          <span>
            Showing <strong className="text-slate-700">{rows.length}</strong> of {applications.length} applications
          </span>
          <span className="hidden sm:inline">Click any row to open the review workspace</span>
        </div>
      </div>
    </div>
  );
};
