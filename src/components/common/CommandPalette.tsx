import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApplyEaseStore } from '../../lib/store';
import { toast } from '../../lib/toast';
import {
  Search,
  FileText,
  LayoutDashboard,
  PlusCircle,
  ShieldCheck,
  Users,
  Layers,
  PenTool,
  ScrollText,
  Play,
  ArrowRight,
  CornerDownLeft,
  Command,
  ListChecks,
  ClipboardList,
  GitBranch
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelectTab: (tab: string) => void;
  onSelectApplication: (ref: string) => void;
}

interface CommandItem {
  id: string;
  group: 'Applications' | 'Pages' | 'Actions';
  label: string;
  hint?: string;
  icon: React.ReactNode;
  keywords?: string;
  run: () => void;
}

/**
 * Global command palette (Ctrl/⌘ + K).
 * Searches live application records plus role-appropriate pages and actions,
 * so a registrar never has to hunt through menus for a reference number.
 */
export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
  onSelectTab,
  onSelectApplication
}) => {
  const { applications, currentUser, triggerSLACheck } = useApplyEaseStore();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    const timer = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(timer);
  }, [open]);

  const go = (tab: string) => {
    onSelectTab(tab);
    onClose();
  };

  const items = useMemo<CommandItem[]>(() => {
    const pages: CommandItem[] = [];
    const actions: CommandItem[] = [];

    if (currentUser.role === 'student') {
      pages.push(
        { id: 'p-student', group: 'Pages', label: 'My Applications', icon: <LayoutDashboard className="w-4 h-4" />, run: () => go('student-dashboard') },
        { id: 'p-catalog', group: 'Pages', label: 'Application Catalog', icon: <Layers className="w-4 h-4" />, run: () => go('application-catalog') },
        { id: 'p-verify', group: 'Pages', label: 'Verify a Document', icon: <ShieldCheck className="w-4 h-4" />, run: () => go('verify-document') }
      );
      actions.push({
        id: 'a-new',
        group: 'Actions',
        label: 'Start a new application',
        hint: 'Choose from the catalog',
        icon: <PlusCircle className="w-4 h-4" />,
        run: () => go('application-catalog')
      });
    }

    if (currentUser.role === 'staff') {
      pages.push(
        { id: 'p-queue', group: 'Pages', label: 'My Task Queue', icon: <ListChecks className="w-4 h-4" />, run: () => go('staff-dashboard') },
        { id: 'p-done', group: 'Pages', label: 'Processed Decisions', icon: <ClipboardList className="w-4 h-4" />, run: () => go('staff-completed') },
        { id: 'p-verify', group: 'Pages', label: 'Verify a Document', icon: <ShieldCheck className="w-4 h-4" />, run: () => go('verify-document') }
      );
    }

    if (currentUser.role === 'admin') {
      pages.push(
        { id: 'p-admin', group: 'Pages', label: 'Operations Overview', icon: <LayoutDashboard className="w-4 h-4" />, run: () => go('admin-dashboard') },
        { id: 'p-services', group: 'Pages', label: 'Services & Workflows', icon: <GitBranch className="w-4 h-4" />, run: () => go('admin-services') },
        { id: 'p-registry', group: 'Pages', label: 'All Applications (registry)', icon: <ClipboardList className="w-4 h-4" />, run: () => go('admin-applications') },
        { id: 'p-form', group: 'Pages', label: 'Dynamic Form Builder', icon: <Layers className="w-4 h-4" />, run: () => go('admin-form-builder') },
        { id: 'p-doc', group: 'Pages', label: 'Document Designer', icon: <FileText className="w-4 h-4" />, run: () => go('admin-doc-designer') },
        { id: 'p-sig', group: 'Pages', label: 'Signatures & Official Seals', icon: <PenTool className="w-4 h-4" />, run: () => go('admin-signatures') },
        { id: 'p-users', group: 'Pages', label: 'User & Account Provisioning', icon: <Users className="w-4 h-4" />, run: () => go('admin-users') },
        { id: 'p-audit', group: 'Pages', label: 'Audit Trails', icon: <ScrollText className="w-4 h-4" />, run: () => go('admin-audit-logs') }
      );
      actions.push(
        {
          id: 'a-sla',
          group: 'Actions',
          label: 'Run the SLA scheduler',
          hint: 'Evaluate deadlines and escalate',
          icon: <Play className="w-4 h-4" />,
          run: () => {
            const res = triggerSLACheck();
            toast(
              'info',
              'SLA pass complete',
              `${res.checkedCount} tasks evaluated · ${res.warningsGenerated} warnings · ${res.escalationsTriggered} escalations.`
            );
            onClose();
          }
        },
        {
          id: 'a-new-account',
          group: 'Actions',
          label: 'Provision a user account',
          icon: <Users className="w-4 h-4" />,
          run: () => go('admin-users')
        }
      );
    }

    const q = query.trim().toLowerCase();

    const matches = (label: string, hint = '', keywords = '') =>
      !q || `${label} ${hint} ${keywords}`.toLowerCase().includes(q);

    const pageResults = pages.filter(p => matches(p.label, p.hint, p.id));
    const actionResults = actions.filter(a => matches(a.label, a.hint));

    const appResults: CommandItem[] = applications
      .filter(app => {
        if (!q) return false;
        const haystack = [
          app.referenceNumber,
          app.studentSnapshot.name,
          app.studentSnapshot.registrationNumber,
          app.applicationTypeTitle,
          app.status
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 6)
      .map(app => ({
        id: `app-${app.id}`,
        group: 'Applications' as const,
        label: app.referenceNumber,
        hint: `${app.applicationTypeTitle} · ${app.studentSnapshot.name}`,
        keywords: app.status,
        icon: <FileText className="w-4 h-4" />,
        run: () => {
          onSelectApplication(app.referenceNumber);
          onClose();
        }
      }));

    return [...appResults, ...pageResults, ...actionResults];
  }, [applications, currentUser.role, query, triggerSLACheck, onClose, onSelectApplication, onSelectTab]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  if (!open) return null;

  const grouped = items.reduce<Record<string, CommandItem[]>>((acc, item) => {
    (acc[item.group] ||= []).push(item);
    return acc;
  }, {});

  let flatIndex = -1;

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex(prev => (items.length ? (prev + 1) % items.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(prev => (items.length ? (prev - 1 + items.length) % items.length : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      items[activeIndex]?.run();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-[overlay-in_120ms_ease-out]" onClick={onClose} />

      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-[palette-in_140ms_ease-out]"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search applications, students, pages or actions…"
            className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
            aria-label="Command palette search"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-300 bg-slate-50 text-[10px] font-mono text-slate-500">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[55vh] overflow-y-auto py-2">
          {items.length === 0 && (
            <div className="px-4 py-10 text-center">
              <Search className="w-6 h-6 text-slate-300 mx-auto" />
              <p className="text-sm font-medium text-slate-700 mt-2">No matches for “{query}”</p>
              <p className="text-xs text-slate-500 mt-1">
                Try a reference number (APP-2026-…), a student name, or a page name.
              </p>
            </div>
          )}

          {Object.entries(grouped).map(([group, groupItems]) => (
            <div key={group} className="py-1">
              <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group}
              </div>
              {groupItems.map(item => {
                flatIndex += 1;
                const index = flatIndex;
                const active = index === activeIndex;
                return (
                  <button
                    key={item.id}
                    data-index={index}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={item.run}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      active ? 'bg-slate-100' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-[#172b50] text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {item.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900 truncate">{item.label}</span>
                      {item.hint && <span className="block text-[11px] text-slate-500 truncate">{item.hint}</span>}
                    </span>
                    {active ? (
                      <CornerDownLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
          <span className="inline-flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded border border-slate-300 bg-white font-mono">↑</kbd>
              <kbd className="px-1 py-0.5 rounded border border-slate-300 bg-white font-mono">↓</kbd>
              navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded border border-slate-300 bg-white font-mono">↵</kbd>
              open
            </span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Command className="w-3 h-3" />
            <span>K to open anywhere</span>
          </span>
        </div>
      </div>
    </div>
  );
};
