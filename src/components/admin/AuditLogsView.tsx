import React, { useState } from 'react';
import { useApplyEaseStore } from '../../lib/store';
import { Shield, Search, Download, Clock, User, FileText } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const { auditLogs } = useApplyEaseStore();
  const [search, setSearch] = useState('');

  const filteredLogs = auditLogs.filter((log) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(query) ||
      log.actorName.toLowerCase().includes(query) ||
      log.details.toLowerCase().includes(query) ||
      (log.applicationRef && log.applicationRef.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Cryptographic Security & System Audit Logs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable, append-only chronological record of all administrative actions, signature applications, approvals, and SLA warnings.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action, actor, or ref #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Application Reference</th>
                <th className="py-3 px-4">Action Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-900">{log.actorName}</div>
                    <div className="text-[10px] text-slate-400 capitalize">{log.actorRole}</div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {log.applicationRef ? (
                      <span className="font-mono font-bold text-[#172b50]">
                        {log.applicationRef}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-700 leading-relaxed max-w-md">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
