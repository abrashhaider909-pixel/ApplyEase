import React, { useEffect, useState } from 'react';
import { ApplyEaseLogo } from '../common/ApplyEaseLogo';
import { NotificationBell } from '../common/NotificationBell';
import { useApplyEaseStore } from '../../lib/store';
import { PlusCircle, Search, LogOut, Command, Menu, X, ChevronRight } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNewApplication?: () => void;
  onSelectApplication?: (ref: string) => void;
  onOpenCommandPalette?: () => void;
}

interface NavLink {
  tab: string;
  label: string;
}

/**
 * Three-zone institutional header: brand, role-scoped navigation, and account
 * actions. One link list drives both the desktop bar and the mobile sheet, so
 * the two can never drift apart.
 */
export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewApplication,
  onSelectApplication,
  onOpenCommandPalette
}) => {
  const { currentUser, logout } = useApplyEaseStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links: NavLink[] =
    currentUser.role === 'student'
      ? [
          { tab: 'student-dashboard', label: 'My Applications' },
          { tab: 'application-catalog', label: 'Catalog' },
          { tab: 'verify-document', label: 'Verify Document' }
        ]
      : currentUser.role === 'staff'
        ? [
            { tab: 'staff-dashboard', label: 'Task Queue' },
            { tab: 'staff-completed', label: 'Processed Decisions' },
            { tab: 'verify-document', label: 'Verify Document' }
          ]
        : [
            { tab: 'admin-dashboard', label: 'Overview' },
            { tab: 'admin-services', label: 'Services' },
            { tab: 'admin-form-builder', label: 'Form Builder' },
            { tab: 'admin-doc-designer', label: 'Documents' },
            { tab: 'admin-signatures', label: 'Signatures' },
            { tab: 'admin-sla-report', label: 'SLA Report' },
            { tab: 'admin-users', label: 'Users' },
            { tab: 'admin-audit-logs', label: 'Audit' }
          ];

  const homeTab =
    currentUser.role === 'student'
      ? 'student-dashboard'
      : currentUser.role === 'staff'
        ? 'staff-dashboard'
        : 'admin-dashboard';

  // Close the mobile sheet whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [currentTab]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab(homeTab)}
            className="text-left focus:outline-none"
            aria-label="ApplyEase home"
          >
            <ApplyEaseLogo size="md" />
          </button>
        </div>

        {/* Zone 2: Role-scoped navigation */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-600">
          {links.map(link => {
            const active = currentTab === link.tab;
            return (
              <button
                key={link.tab}
                onClick={() => onSelectTab(link.tab)}
                aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
                  active
                    ? 'text-slate-900 font-semibold border-[#172b50]'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions & Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="hidden sm:inline-flex items-center gap-2 pl-3 pr-1.5 py-1.5 text-xs font-medium text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              title="Search applications, pages and actions"
              aria-label="Open command palette"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Search</span>
              <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-slate-300 bg-white text-[10px] font-mono text-slate-500">
                <Command className="w-2.5 h-2.5" />K
              </kbd>
            </button>
          )}

          {currentUser.role === 'student' && onOpenNewApplication && (
            <button
              onClick={onOpenNewApplication}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#f4772e] hover:bg-[#de6219] rounded-lg transition-colors shadow-xs whitespace-nowrap shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              New Application
            </button>
          )}

          <NotificationBell onSelectApplication={onSelectApplication} />

          <button
            onClick={() => logout()}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors hidden sm:inline-flex"
            title="Sign out to the university login page"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>

          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -mr-1 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      </header>

      {/* Mobile navigation sheet */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Navigation">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-[overlay-in_120ms_ease-out]"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white opacity-100 shadow-2xl border-l border-slate-200 flex flex-col animate-[sheet-in_140ms_ease-out]">
            <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Menu</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                aria-label="Close navigation menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-bold text-slate-900">{currentUser.name}</p>
              <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
              <span className="inline-flex mt-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 capitalize">
                {currentUser.role}
              </span>
            </div>

            <nav className="flex-1 overflow-y-auto py-2">
              {links.map(link => {
                const active = currentTab === link.tab;
                return (
                  <button
                    key={link.tab}
                    onClick={() => onSelectTab(link.tab)}
                    className={`w-full flex items-center justify-between px-5 py-3 text-sm transition-colors ${
                      active
                        ? 'bg-slate-50 text-[#172b50] font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{link.label}</span>
                    <ChevronRight className={`w-4 h-4 ${active ? 'text-[#f4772e]' : 'text-slate-300'}`} />
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-100 space-y-2">
              {onOpenCommandPalette && (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenCommandPalette();
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <Search className="w-3.5 h-3.5" />
                  Search everything
                </button>
              )}
              <button
                onClick={() => logout()}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
