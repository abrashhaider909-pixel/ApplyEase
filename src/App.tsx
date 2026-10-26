/**
 * ApplyEase — University Application Workflow Automation Platform
 * Main Application Orchestrator
 */

import React, { Suspense, lazy, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useApplyEaseStore } from './lib/store';
import { LoginPage } from './components/auth/LoginPage';
import { Navbar } from './components/layout/Navbar';
import { Toaster } from './components/common/Toaster';
import { CommandPalette } from './components/common/CommandPalette';
import { ChatAssistant } from './components/common/ChatAssistant';
import { StudentDashboard } from './components/student/StudentDashboard';
import { ApplicationCatalog } from './components/student/ApplicationCatalog';
import { DynamicApplicationForm } from './components/student/DynamicApplicationForm';
import { CustomApplicationForm } from './components/student/CustomApplicationForm';
import { ApplicationTracker } from './components/student/ApplicationTracker';
import { StaffDashboard } from './components/staff/StaffDashboard';
import { ApplicationReviewPane } from './components/staff/ApplicationReviewPane';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { DocumentVerificationView } from './components/verification/DocumentVerificationView';
import { Application, ApplicationType } from './types';
import { ApplyEaseLogo } from './components/common/ApplyEaseLogo';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

/* Heavy administrative workspaces are code-split: the login, dashboards and
   student flows stay in the initial bundle, while designers and the cloud
   console load the first time an administrator opens them. */
const ApplicationRegistry = lazy(() =>
  import('./components/admin/ApplicationRegistry').then(m => ({ default: m.ApplicationRegistry }))
);
const ServiceWorkflowDesigner = lazy(() =>
  import('./components/admin/ServiceWorkflowDesigner').then(m => ({ default: m.ServiceWorkflowDesigner }))
);
const FormBuilder = lazy(() =>
  import('./components/admin/FormBuilder').then(m => ({ default: m.FormBuilder }))
);
const DocumentTemplateDesigner = lazy(() =>
  import('./components/admin/DocumentTemplateDesigner').then(m => ({ default: m.DocumentTemplateDesigner }))
);
const SignatureStampManager = lazy(() =>
  import('./components/admin/SignatureStampManager').then(m => ({ default: m.SignatureStampManager }))
);
const UserManager = lazy(() =>
  import('./components/admin/UserManager').then(m => ({ default: m.UserManager }))
);
const AuditLogsView = lazy(() =>
  import('./components/admin/AuditLogsView').then(m => ({ default: m.AuditLogsView }))
);
const SlaComplianceReport = lazy(() =>
  import('./components/admin/SlaComplianceReport').then(m => ({ default: m.SlaComplianceReport }))
);

/** Skeleton shown while a code-split workspace loads. */
const WorkspaceFallback: React.FC = () => (
  <div className="space-y-4" aria-busy="true" aria-label="Loading workspace">
    <div className="h-6 w-64 bg-slate-200/80 rounded animate-pulse" />
    <div className="h-3 w-96 max-w-full bg-slate-200/60 rounded animate-pulse" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="h-24 bg-white border border-slate-200 rounded-2xl animate-pulse" />
      ))}
    </div>
    <div className="h-72 bg-white border border-slate-200 rounded-2xl animate-pulse" />
  </div>
);

export default function App() {
  const { isAuthenticated, currentUser, applications, initCloudSync, isHydrating } = useApplyEaseStore();

  // Establish Supabase cloud sync (hydrate + realtime) for restored sessions
  useEffect(() => {
    if (isAuthenticated) {
      void initCloudSync();
    }
  }, [isAuthenticated, initCloudSync]);

  // Tab navigation state
  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (currentUser.role === 'student') return 'student-dashboard';
    if (currentUser.role === 'staff') return 'staff-dashboard';
    return 'admin-dashboard';
  });

  // Selected item states
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [selectedAppTypeToApply, setSelectedAppTypeToApply] = useState<ApplicationType | null>(null);
  // Always resolve the selected application from live store data, otherwise the
  // review pane keeps rendering the snapshot it was opened with (stale statuses).
  const activeApp = selectedApp
    ? applications.find(app => app.id === selectedApp.id) ?? selectedApp
    : null;
  const [verificationInitialCode, setVerificationInitialCode] = useState<string>('');
  const [pendingOpenRef, setPendingOpenRef] = useState<string | null>(null);

  // A freshly submitted application exists in the store before this component
  // re-renders, so open it as soon as it appears in the list.
  useEffect(() => {
    if (!pendingOpenRef) return;
    const created = applications.find(app => app.referenceNumber === pendingOpenRef);
    if (!created) return;
    setSelectedApp(created);
    setCurrentTab('application-tracker');
    setPendingOpenRef(null);
  }, [applications, pendingOpenRef]);
  const [showPublicVerify, setShowPublicVerify] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Deep link from a document QR: /#verify=CODE opens the public verification screen.
  useEffect(() => {
    const openFromHash = () => {
      const match = /(?:#|&|\?)verify=([^&]+)/.exec(`${window.location.hash}${window.location.search}`);
      if (!match) return;
      setVerificationInitialCode(decodeURIComponent(match[1]));
      setShowPublicVerify(true);
      if (window.location.hash) window.history.replaceState(null, '', window.location.pathname);
    };
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, []);

  // Global command palette shortcut: Ctrl/⌘ + K
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen(open => !open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Automatically adjust default view when user switches role via RoleSwitcher
  useEffect(() => {
    if (currentUser.role === 'student') {
      if (
        currentTab === 'staff-dashboard' ||
        currentTab === 'staff-completed' ||
        currentTab.startsWith('admin-')
      ) {
        setCurrentTab('student-dashboard');
      }
    } else if (currentUser.role === 'staff') {
      if (
        currentTab === 'student-dashboard' ||
        currentTab === 'application-catalog' ||
        currentTab === 'custom-application' ||
        currentTab === 'new-application' ||
        currentTab.startsWith('admin-')
      ) {
        setCurrentTab('staff-dashboard');
      }
    } else if (currentUser.role === 'admin') {
      if (
        currentTab === 'student-dashboard' ||
        currentTab === 'staff-dashboard'
      ) {
        setCurrentTab('admin-dashboard');
      }
    }
  }, [currentUser.role]);

  // Handler to navigate directly to an application by reference number
  const handleSelectAppByRef = (ref: string) => {
    const target = applications.find((a) => a.referenceNumber === ref);
    if (target) {
      setSelectedApp(target);
      if (currentUser.role === 'student') {
        setCurrentTab('application-tracker');
      } else {
        setCurrentTab('staff-review');
      }
    }
  };

  const handleStartApplication = (type: ApplicationType) => {
    setSelectedAppTypeToApply(type);
    setCurrentTab('new-application');
  };

  const handleApplicationSubmitted = (ref: string) => {
    const created = applications.find((a) => a.referenceNumber === ref);
    if (created) {
      setSelectedApp(created);
      setCurrentTab('application-tracker');
    } else {
      // The store has the new record, but this render's snapshot may not: remember
      // the reference and open it as soon as the list refreshes.
      setPendingOpenRef(ref);
    }
  };

  // 1. Unauthenticated: Render dedicated Login Page or Public Document Verification
  if (!isAuthenticated) {
    if (showPublicVerify) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
          <Toaster />
          <header className="bg-white border-b border-slate-200 py-3 px-6">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <ApplyEaseLogo size="md" />
              <button
                onClick={() => setShowPublicVerify(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to University Sign In</span>
              </button>
            </div>
          </header>

          <main className="flex-1 max-w-4xl w-full mx-auto p-6 sm:p-8">
            <DocumentVerificationView />
          </main>

          <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
            ApplyEase • MCS Records Office
          </footer>
        </div>
      );
    }

    return (
      <>
        <LoginPage onPublicVerifyClick={() => setShowPublicVerify(true)} />
        <Toaster />
      </>
    );
  }

  // 2. Authenticated: public verifier opened from a QR link or the navbar.
  if (showPublicVerify) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Toaster />
        <header className="bg-white border-b border-slate-200 py-3 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <ApplyEaseLogo size="md" />
            <button
              onClick={() => setShowPublicVerify(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to workspace</span>
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-4xl w-full mx-auto p-6 sm:p-8">
          <DocumentVerificationView
            key={verificationInitialCode}
            initialCode={verificationInitialCode}
            onViewApplication={ref => {
              setShowPublicVerify(false);
              handleSelectAppByRef(ref);
            }}
          />
        </main>

        <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
          ApplyEase • MCS Records Office
        </footer>
      </div>
    );
  }

  // 3. Authenticated: Render Main Application Workspace
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900" data-current-tab={currentTab}>
      {/* Top 3-Zone Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'student-dashboard' || tab === 'staff-dashboard') {
            setSelectedApp(null);
          }
        }}
        onOpenNewApplication={() => setCurrentTab('application-catalog')}
        onSelectApplication={handleSelectAppByRef}
        onOpenCommandPalette={() => setPaletteOpen(true)}
      />

      {/* Main Content Area with animated tab transitions */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Thin progress rail while the first cloud hydration is running */}
        {isHydrating && (
          <div className="fixed top-16 left-0 right-0 z-40 h-0.5 bg-slate-200 overflow-hidden" aria-hidden="true">
            <div className="h-full w-1/3 bg-[#f4772e] animate-[hydrate_1.1s_ease-in-out_infinite]" />
          </div>
        )}
        <motion.div
          key={currentTab + (activeApp?.id ?? '')}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <Suspense fallback={<WorkspaceFallback />}>
            {/* STUDENT VIEWS */}
        {currentTab === 'student-dashboard' && (
          <StudentDashboard
            onOpenNewApplication={() => setCurrentTab('application-catalog')}
            onSelectApplication={(app) => {
              setSelectedApp(app);
              setCurrentTab('application-tracker');
            }}
          />
        )}

        {currentTab === 'application-catalog' && (
          <ApplicationCatalog
            onSelectType={handleStartApplication}
            onStartCustom={() => setCurrentTab('custom-application')}
          />
        )}

        {currentTab === 'custom-application' && (
          <CustomApplicationForm
            onCancel={() => setCurrentTab('application-catalog')}
            onSubmitted={handleApplicationSubmitted}
          />
        )}

        {currentTab === 'new-application' && selectedAppTypeToApply && (
          <DynamicApplicationForm
            applicationType={selectedAppTypeToApply}
            onCancel={() => setCurrentTab('application-catalog')}
            onSubmitted={handleApplicationSubmitted}
          />
        )}

        {currentTab === 'application-tracker' && activeApp && (
          <ApplicationTracker
            application={activeApp}
            onBack={() => {
              setSelectedApp(null);
              setCurrentTab(currentUser.role === 'student' ? 'student-dashboard' : 'staff-dashboard');
            }}
            onOpenVerification={(code) => {
              setVerificationInitialCode(code);
              setCurrentTab('verify-document');
            }}
          />
        )}

        {/* STAFF VIEWS */}
        {(currentTab === 'staff-dashboard' || currentTab === 'staff-completed') && (
          <StaffDashboard
            showCompletedOnly={currentTab === 'staff-completed'}
            onSelectApplication={(app) => {
              setSelectedApp(app);
              setCurrentTab('staff-review');
            }}
          />
        )}

        {currentTab === 'staff-review' && activeApp && (
          <ApplicationReviewPane
            application={activeApp}
            onBack={() => {
              setSelectedApp(null);
              setCurrentTab('staff-dashboard');
            }}
            onDecisionCompleted={() => {
              setSelectedApp(null);
              setCurrentTab('staff-dashboard');
            }}
          />
        )}

        {/* ADMINISTRATOR VIEWS */}
        {currentTab === 'admin-dashboard' && (
          <AdminDashboard
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onSelectApplication={handleSelectAppByRef}
          />
        )}

        {currentTab === 'admin-applications' && (
          <ApplicationRegistry onSelectApplication={handleSelectAppByRef} />
        )}

        {currentTab === 'admin-services' && (
          <ServiceWorkflowDesigner onNavigateTab={tab => setCurrentTab(tab)} />
        )}

        {currentTab === 'admin-form-builder' && <FormBuilder />}

        {currentTab === 'admin-doc-designer' && <DocumentTemplateDesigner />}

        {currentTab === 'admin-signatures' && <SignatureStampManager />}

        {currentTab === 'admin-users' && <UserManager />}

        {currentTab === 'admin-audit-logs' && <AuditLogsView />}

        {currentTab === 'admin-sla-report' && <SlaComplianceReport />}

        {/* PUBLIC / UNIVERSAL VERIFICATION */}
        {currentTab === 'verify-document' && (
          <DocumentVerificationView
            initialCode={verificationInitialCode}
            onViewApplication={handleSelectAppByRef}
          />
        )}
          </Suspense>
          </motion.div>
      </main>

      {/* Quiet Professional Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2.5">
            <ApplyEaseLogo size="sm" showWordmark={true} />
            <span className="text-slate-300">|</span>
            <span>University Administrative Workflow Automation</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-700">Apply. Track. Approve. Simplify.</span>
            <span className="text-slate-300">·</span>
            <span>MCS Records Office</span>
          </div>
        </div>
      </footer>

      {/* Transient toast notifications (cloud sync, workflow events) */}
      <Toaster />

      {/* Global search & quick actions */}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelectTab={tab => {
          setCurrentTab(tab);
          if (tab.endsWith('dashboard')) setSelectedApp(null);
        }}
        onSelectApplication={ref => {
          handleSelectAppByRef(ref);
        }}
      />

      {/* Floating AI Application Assistant */}
      <ChatAssistant />
    </div>
  );
}
