import React, { useState } from 'react';
import { useApplyEaseStore } from '../../lib/store';
import { StatusBadge } from '../common/StatusBadge';
import { Application } from '../../types';
import {
  FileText,
  PlusCircle,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Search,
  Filter
} from 'lucide-react';

interface StudentDashboardProps {
  onOpenNewApplication: () => void;
  onSelectApplication: (app: Application) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onOpenNewApplication,
  onSelectApplication
}) => {
  const { applications, currentUser } = useApplyEaseStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'action_required' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter only applications belonging to current student
  const studentApps = applications.filter((a) => a.studentId === currentUser.id);

  // Metrics
  const totalCount = studentApps.length;
  const pendingCount = studentApps.filter(
    (a) =>
      a.status === 'under_verification' ||
      a.status === 'pending_approval' ||
      a.status === 'pending_signature' ||
      a.status === 'submitted' ||
      a.status === 'overdue'
  ).length;
  const actionRequiredCount = studentApps.filter(
    (a) => a.status === 'awaiting_student_action' || a.status === 'awaiting_payment'
  ).length;
  const completedCount = studentApps.filter((a) => a.status === 'completed').length;

  // Filtered list
  const filteredApps = studentApps.filter((app) => {
    const matchesSearch =
      app.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicationTypeTitle.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'pending') {
      return (
        app.status === 'under_verification' ||
        app.status === 'pending_approval' ||
        app.status === 'pending_signature' ||
        app.status === 'submitted' ||
        app.status === 'overdue'
      );
    }
    if (filter === 'action_required') {
      return app.status === 'awaiting_student_action' || app.status === 'awaiting_payment';
    }
    if (filter === 'completed') {
      return app.status === 'completed';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Student Welcome Header Banner */}
      <div className="bg-gradient-to-r from-[#172b50] to-[#1f3763] rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Profile avatar */}
          {currentUser.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-white/30 shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-white/15 border-2 border-white/30 flex items-center justify-center shrink-0 text-lg font-bold text-white select-none">
              {currentUser.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300 mb-1">
              <span>Student Portal</span>
              <span aria-hidden="true">·</span>
              <span>{currentUser.department}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{currentUser.registrationNumber}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {currentUser.name}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Track submitted applications in real-time, respond to verification notes, and download official electronically signed university documents.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenNewApplication}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#f4772e] hover:bg-[#de6219] rounded-xl transition-colors shadow-sm whitespace-nowrap shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Application
        </button>
      </div>

      {/* Action Required Alert Banner (if any application needs student action) */}
      {actionRequiredCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-xs font-bold text-amber-900">
              Immediate Action Required ({actionRequiredCount})
            </h3>
            <p className="text-xs text-amber-800 mt-0.5">
              One or more applications have notes from reviewing officers requesting clarification or document replacement.
            </p>
          </div>
          <button
            onClick={() => setFilter('action_required')}
            className="text-xs font-semibold text-amber-900 underline hover:text-amber-950 shrink-0"
          >
            Review Now
          </button>
        </div>
      )}

      {/* 4 Quantitative Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Submitted</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
            {totalCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across all semesters</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 text-xs font-medium">
            <span>In Processing</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-blue-900 mt-2 font-mono tabular-nums">
            {pendingCount}
          </div>
          <p className="text-[11px] text-blue-700 mt-1">Active in workflow stages</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 text-xs font-medium">
            <span>Action Required</span>
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-2 font-mono tabular-nums">
            {actionRequiredCount}
          </div>
          <p className="text-[11px] text-amber-700 mt-1">Pending student response</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 text-xs font-medium">
            <span>Official Documents</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-emerald-900 mt-2 font-mono tabular-nums">
            {completedCount}
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">Signed & ready for PDF download</p>
        </div>
      </div>

      {/* Applications Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Controls Bar: Search & Filter Tabs */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Segmented Filter Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600 overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              All Applications ({totalCount})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                filter === 'pending'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Processing ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('action_required')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                filter === 'action_required'
                  ? 'bg-white text-amber-900 font-semibold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Needs Action ({actionRequiredCount})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                filter === 'completed'
                  ? 'bg-white text-emerald-900 font-semibold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reference # or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50] focus:bg-white"
            />
          </div>
        </div>

        {/* List of Applications */}
        {filteredApps.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No applications found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchQuery
                ? 'No applications match your search query.'
                : "You haven't submitted any applications under this category yet."}
            </p>
            <button
              onClick={onOpenNewApplication}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#172b50] hover:bg-[#1f3763] rounded-lg transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Apply for a Service
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredApps.map((app) => {
              const currentStage = app.stageInstances[app.currentStageIndex];
              const isFinished = app.status === 'completed';

              return (
                <div
                  key={app.id}
                  onClick={() => onSelectApplication(app)}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {app.referenceNumber}
                      </span>
                      <StatusBadge status={app.status} size="sm" />
                      <span className="text-slate-400 text-xs hidden sm:inline">·</span>
                      <span className="text-xs text-slate-500">
                        Submitted{' '}
                        {app.submissionDate
                          ? new Date(app.submissionDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : 'Draft'}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-slate-900 truncate">
                      {app.applicationTypeTitle}
                    </h3>

                    {/* Progress Information */}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">Current Stage:</span>
                        <span className="font-medium text-slate-800">
                          {isFinished ? 'Workflow Completed' : currentStage?.name || 'In Progress'}
                        </span>
                      </div>

                      {!isFinished && currentStage && (
                        <>
                          <span className="text-slate-300">·</span>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">Responsible Dept:</span>
                            <span className="font-medium text-slate-700">
                              {currentStage.assignedDepartment}
                            </span>
                          </div>
                        </>
                      )}

                      {app.targetDeadline && (
                        <>
                          <span className="text-slate-300">·</span>
                          <div className="flex items-center gap-1 text-slate-500">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>
                              Target: {new Date(app.targetDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Correction Notice Preview */}
                    {app.correctionRequestNote && (
                      <div className="mt-2.5 bg-amber-50 text-amber-900 border border-amber-200 text-xs px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span className="truncate">
                          Reviewer Note: <strong>{app.correctionRequestNote}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectApplication(app);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <span>Track Details</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
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
