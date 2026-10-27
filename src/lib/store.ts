/**
 * ApplyEase Central State Store & Persistence Layer
 * Provides reactive persistence across sessions, strict role-based state transitions,
 * audit logging, document issuance pipeline, and notification dispatch.
 */

import { useState, useEffect } from 'react';
import {
  UserProfile,
  ApplicationType,
  Application,
  SignatureAsset,
  StampAsset,
  AuditLog,
  NotificationItem,
  UploadedDocument,
  OfficialDocumentTemplate,
  FormTemplate,
  WorkflowDefinition,
  WorkflowStageDefinition,
  IssuedDocument
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_APPLICATION_TYPES,
  INITIAL_APPLICATIONS,
  INITIAL_SIGNATURES,
  INITIAL_STAMPS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS
} from './constants';
import { addBusinessHours, runSLASchedulerCheck } from './slaEngine';
import { calculateDocumentHash } from './pdfGenerator';
import { buildIssuedDocumentPdf } from './issuedDocument';
import { PDF_RENDER_VERSION } from './officialPdf';
import {
  CUSTOM_APPLICATION_ID_PREFIX,
  customDocumentTemplate,
  isCustomApplication
} from './customApplication';
import { canApplySignature, canSignStage } from './access';
import {
  cloud,
  pullAll,
  seedIfEmpty,
  pushAll,
  subscribeToChanges,
  setCloudErrorHandler,
  wipeCloud,
  CloudData
} from './cloud';
import {
  isCloudConfigured as isCloudConfiguredNow,
  saveCloudConfig,
  clearCloudConfig,
  probeConnection
} from './supabase';
import { toast } from './toast';

export type CloudStatus = 'local' | 'connecting' | 'online' | 'offline';

// Re-exported for components that need to know whether cloud mode is on.
// A function (not a constant) so runtime connections are reflected immediately.
export function isCloudConfigured(): boolean {
  return isCloudConfiguredNow();
}

const STORAGE_KEYS = {
  IS_AUTHENTICATED: 'applyease_is_authenticated',
  CURRENT_USER: 'applyease_current_user',
  USERS: 'applyease_users',
  APPLICATION_TYPES: 'applyease_app_types',
  APPLICATIONS: 'applyease_applications',
  SIGNATURES: 'applyease_signatures',
  STAMPS: 'applyease_stamps',
  AUDIT_LOGS: 'applyease_audit_logs',
  NOTIFICATIONS: 'applyease_notifications'
};

function safeLoad<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Error loading ${key} from storage:`, e);
    return defaultValue;
  }
}

function safeSave(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}

// Global subscribers for multi-component reactivity
type Listener = () => void;
const listeners = new Set<Listener>();
function notifyListeners() {
  listeners.forEach(fn => fn());
}

const restoredUsers = safeLoad<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
const restoredCurrentUser = safeLoad<UserProfile>(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
const restoredAccount = restoredUsers.find(user => user.id === restoredCurrentUser.id);

// State container
let state = {
  // Restore the session across refreshes; explicit logout clears this flag.
  isAuthenticated: safeLoad<boolean>(STORAGE_KEYS.IS_AUTHENTICATED, false) &&
    Boolean(restoredAccount?.active && restoredCurrentUser.active),
  currentUser: restoredAccount ?? restoredCurrentUser,
  users: restoredUsers,
  applicationTypes: safeLoad<ApplicationType[]>(STORAGE_KEYS.APPLICATION_TYPES, INITIAL_APPLICATION_TYPES),
  applications: safeLoad<Application[]>(STORAGE_KEYS.APPLICATIONS, INITIAL_APPLICATIONS),
  signatures: safeLoad<SignatureAsset[]>(STORAGE_KEYS.SIGNATURES, INITIAL_SIGNATURES),
  stamps: safeLoad<StampAsset[]>(STORAGE_KEYS.STAMPS, INITIAL_STAMPS),
  auditLogs: safeLoad<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS),
  notifications: safeLoad<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS),
  cloudStatus: 'local' as CloudStatus,
  /** Why the cloud is offline, so the UI can distinguish setup from network. */
  cloudIssue: 'none' as 'none' | 'schema' | 'network',
  /** True while the first cloud hydration runs, so the UI can show progress. */
  isHydrating: false
};

/* ------------------------------------------------------------------ */
/* Cloud synchronization engine                                        */
/* ------------------------------------------------------------------ */

let cloudSyncStarted = false;
let isPulling = false;
let lastSelfPushAt = 0;
let lastHydrateAttemptAt = 0;
let cloudRefreshQueued = false;
let cloudRefreshTimer: ReturnType<typeof setTimeout> | null = null;
let warnedMissingConfig = false;
let unsubscribeRealtime: (() => void) | null = null;

// Surface cloud write failures once (throttled) instead of spamming toasts.
let lastCloudErrorAt = 0;
setCloudErrorHandler((message) => {
  const now = Date.now();
  if (now - lastCloudErrorAt > 15000) {
    lastCloudErrorAt = now;
    state.cloudStatus = 'offline';
    toast('warning', 'Cloud sync issue', `${message} Changes are saved locally and will retry.`);
    notifyListeners();
  }
});

function markSelfPush() {
  lastSelfPushAt = Date.now();
}

function cloudWritable() {
  return cloud.enabled && state.cloudStatus !== 'offline';
}

function drainQueuedCloudRefresh() {
  if (!cloudRefreshQueued || isPulling || cloudRefreshTimer) return;
  const waitMs = Math.max(0, lastSelfPushAt + 1500 - Date.now());
  cloudRefreshTimer = setTimeout(() => {
    cloudRefreshTimer = null;
    if (!cloudRefreshQueued) return;
    if (isPulling) return;
    if (Date.now() - lastSelfPushAt < 1500) {
      drainQueuedCloudRefresh();
      return;
    }
    cloudRefreshQueued = false;
    void hydrateFromCloud(true).then(() => drainQueuedCloudRefresh());
  }, waitMs);
}

function requestCloudRefresh() {
  if (isPulling || Date.now() - lastSelfPushAt < 1500) {
    cloudRefreshQueued = true;
    drainQueuedCloudRefresh();
    return;
  }
  void hydrateFromCloud(true).then(() => drainQueuedCloudRefresh());
}

function applyCloudData(data: CloudData) {
  // Merge cloud users but preserve locally-held avatarUrls that haven't been
  // pushed yet — avatar data-URLs are large and may lag behind other fields.
  const localUserMap = new Map(state.users.map(u => [u.id, u]));
  state.users = data.users.map(cloudUser => {
    const local = localUserMap.get(cloudUser.id);
    if (local?.avatarUrl && !cloudUser.avatarUrl) {
      return { ...cloudUser, avatarUrl: local.avatarUrl };
    }
    return cloudUser;
  });
  state.applicationTypes = data.applicationTypes.length ? data.applicationTypes : state.applicationTypes;
  state.applications = data.applications;
  state.signatures = data.signatures.length ? data.signatures : state.signatures;
  state.stamps = data.stamps.length ? data.stamps : state.stamps;
  state.auditLogs = data.auditLogs;
  // A cloud pull can race an in-flight read-status upsert. Read is monotonic
  // for a notification, so retain a locally saved "read" state if the cloud
  // response still has the older unread value.
  const localNotificationsById = new Map(state.notifications.map(n => [n.id, n]));
  state.notifications = data.notifications.map(notification =>
    localNotificationsById.get(notification.id)?.read && !notification.read
      ? { ...notification, read: true }
      : notification
  );

  // Keep the signed-in session, but refresh the profile from cloud truth
  const freshProfile = state.users.find(u => u.id === state.currentUser.id);
  if (freshProfile) state.currentUser = freshProfile;

  safeSave(STORAGE_KEYS.USERS, state.users);
  safeSave(STORAGE_KEYS.APPLICATION_TYPES, state.applicationTypes);
  safeSave(STORAGE_KEYS.APPLICATIONS, state.applications);
  safeSave(STORAGE_KEYS.SIGNATURES, state.signatures);
  safeSave(STORAGE_KEYS.STAMPS, state.stamps);
  safeSave(STORAGE_KEYS.AUDIT_LOGS, state.auditLogs);
  safeSave(STORAGE_KEYS.NOTIFICATIONS, state.notifications);
  safeSave(STORAGE_KEYS.CURRENT_USER, state.currentUser);
}

/**
 * Pull the full dataset from Supabase and replace local state.
 * On a brand-new database the built-in seed data is uploaded first.
 */
async function hydrateFromCloud(silent = false): Promise<boolean> {
  if (!cloud.enabled || isPulling) return false;
  isPulling = true;
  if (!silent) {
    state.cloudStatus = 'connecting';
    notifyListeners();
  }
  try {
    const seeded = await seedIfEmpty();
    const data = await pullAll();
    applyCloudData(data);
    state.cloudStatus = 'online';
    state.cloudIssue = 'none';
    isPulling = false;
    notifyListeners();
    drainQueuedCloudRefresh();
    if (seeded) {
      toast('success', 'Supabase connected', 'Your cloud database was empty — initial platform data has been uploaded.');
    }
    return true;
  } catch (e: any) {
    console.warn('[ApplyEase Cloud] Falling back to local data:', e?.message);
    state.cloudStatus = 'offline';
    isPulling = false;
    notifyListeners();
    drainQueuedCloudRefresh();
    const message = String(e?.message || '');
    const schemaMissing = /could not find the table|does not exist|schema cache/i.test(message);
    state.cloudIssue = schemaMissing ? 'schema' : 'network';
    if (!silent) {
      // Operators get the technical cause in the console; users get a plain
      // status message — the backend is not their concern.
      toast(
        'warning',
        'Working offline',
        'Your changes are saved on this device and will sync automatically when the connection returns.'
      );
    }
    return false;
  }
}

/**
 * Establish cloud sync exactly once per session: hydrate, then subscribe to
 * realtime changes so updates from other devices appear live.
 */
async function ensureCloudSync(): Promise<boolean> {
  if (!cloud.enabled) {
    // Operators only: users never see backend configuration, so surface a
    // clear hint in the console when a deployment ships without credentials.
    if (!warnedMissingConfig) {
      warnedMissingConfig = true;
      console.warn(
        '[ApplyEase Cloud] No backend configured — running on local data. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.'
      );
    }
    return false;
  }
  if (cloudSyncStarted) return state.cloudStatus === 'online';
  // Guard against repeated boot/login triggers hammering an unreachable project.
  if (Date.now() - lastHydrateAttemptAt < 3000) return false;
  lastHydrateAttemptAt = Date.now();
  cloudSyncStarted = true;
  state.isHydrating = true;
  notifyListeners();
  const ok = await hydrateFromCloud();
  state.isHydrating = false;
  if (ok) {
    unsubscribeRealtime?.();
    try {
      unsubscribeRealtime = subscribeToChanges(() => {
        // Coalesce nearby row events, but never lose an update arriving during
        // a pull or while a local write is still settling.
        requestCloudRefresh();
      });
    } catch (error) {
      // Realtime is a convenience; never let it fail a sign-in.
      console.warn('[ApplyEase Cloud] Realtime unavailable:', error);
      unsubscribeRealtime = null;
    }
  } else {
    cloudSyncStarted = false; // allow retry on the next login / boot
  }
  return ok;
}

/** Write-through helper: push a single application to the cloud. */
function syncApplication(appId: string) {
  if (!cloudWritable()) return;
  const app = state.applications.find(a => a.id === appId);
  if (app) {
    markSelfPush();
    cloud.pushApplication(app);
  }
}

/** Write-through helper: push a single application type to the cloud. */
function syncApplicationType(typeId: string) {
  if (!cloudWritable()) return;
  const type = state.applicationTypes.find(t => t.id === typeId);
  if (type) {
    markSelfPush();
    cloud.pushApplicationType(type);
  }
}

export const ApplyEaseStore = {
  getState() {
    return state;
  },

  /**
   * Cloud-aware credential verification.
   * 1. admin@gmail.com / 123 is the master administrator account (always valid).
   * 2. Other accounts authenticate against the Supabase `profiles` table when
   *    the cloud is configured, with a transparent fallback to the local list.
   */
  async authenticate(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanEmail === 'admin@gmail.com') {
      if (cleanPassword !== '123') {
        return { ok: false, error: 'Incorrect email or password.' };
      }
      const adminUser =
        state.users.find(u => u.email.toLowerCase() === 'admin@gmail.com') ||
        INITIAL_USERS.find(u => u.email.toLowerCase() === 'admin@gmail.com')!;
      this.login(adminUser);
      return { ok: true };
    }

    if (cloud.enabled) {
      try {
        const cloudUser = await cloud.authenticate(cleanEmail, cleanPassword);
        if (cloudUser) {
          this.login(cloudUser);
          return { ok: true };
        }
        // Cloud says no — allow a locally-provisioned account to self-heal into the cloud.
        const localMatch = state.users.find(u => u.email.toLowerCase() === cleanEmail);
        if (localMatch && localMatch.active && (localMatch.password || '123') === cleanPassword) {
          markSelfPush();
          cloud.pushUsers([localMatch]);
          this.login(localMatch);
          return { ok: true };
        }
        return { ok: false, error: 'Incorrect email or password. Please check your credentials and try again.' };
      } catch {
        // Cloud unreachable — fall through to the local account list below.
      }
    }

    const matchedUser = state.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!matchedUser) {
      return {
        ok: false,
        error: `No account found for "${email}". The administrator can provision staff and student accounts in the Admin panel.`
      };
    }
    if (!matchedUser.active) {
      return { ok: false, error: 'This account has been deactivated. Please contact the administrator.' };
    }
    if (cleanPassword !== (matchedUser.password || '123')) {
      return { ok: false, error: `Incorrect password for ${matchedUser.name}.` };
    }
    this.login(matchedUser);
    return { ok: true };
  },

  initCloudSync: ensureCloudSync,

  /**
   * Connect this browser to a Supabase project without a rebuild.
   * Credentials are probed first so a typo can never knock a working local
   * session out of offline mode.
   */
  async connectCloud(url: string, anonKey: string): Promise<{ ok: boolean; error?: string }> {
    const probe = await probeConnection(url, anonKey);
    if (!probe.ok) {
      return { ok: false, error: probe.message };
    }

    const saved = saveCloudConfig(url, anonKey);
    if (!saved.ok) {
      return { ok: false, error: saved.error };
    }

    unsubscribeRealtime?.();
    unsubscribeRealtime = null;
    cloudSyncStarted = false;
    state.cloudStatus = 'connecting';
    notifyListeners();

    const ok = await ensureCloudSync();
    if (!ok) {
      return {
        ok: false,
        error: 'Credentials worked, but the ApplyEase data could not be loaded. Confirm supabase/schema.sql has been run in the SQL Editor.'
      };
    }

    this.addAuditLog('CLOUD_CONNECTED', 'Administrator connected this deployment to the Supabase project.');
    toast('success', 'Supabase connected', 'Every change now syncs to your cloud database in realtime.');
    return { ok: true };
  },

  /** Return this browser to standalone local mode. */
  disconnectCloud(): { ok: boolean } {
    clearCloudConfig();
    unsubscribeRealtime?.();
    unsubscribeRealtime = null;
    cloudSyncStarted = false;
    state.cloudStatus = 'local';
    state.isHydrating = false;
    state.cloudIssue = 'none';
    this.addAuditLog('CLOUD_DISCONNECTED', 'Administrator disconnected the Supabase project; this browser is running on local data.');
    toast('info', 'Local mode restored', 'Cloud sync is off for this browser. Existing cloud data is untouched.');
    notifyListeners();
    return { ok: true };
  },

  /** Force a full pull from Supabase. */
  async resyncCloud(): Promise<{ ok: boolean; error?: string }> {
    if (!cloud.enabled) {
      return { ok: false, error: 'Supabase is not connected.' };
    }
    state.cloudStatus = 'connecting';
    notifyListeners();
    const ok = await hydrateFromCloud(false);
    if (ok) {
      toast('success', 'Re-synced', 'Loaded the latest data from Supabase.');
      return { ok: true };
    }
    return { ok: false, error: 'Could not reach Supabase. Check the project URL, anon key and network connection.' };
  },

  /** Upload the current local dataset to the connected project. */
  async pushLocalToCloud(): Promise<{ ok: boolean; error?: string }> {
    if (!cloud.enabled) {
      return { ok: false, error: 'Supabase is not connected.' };
    }
    try {
      await pushAll({
        users: state.users,
        applicationTypes: state.applicationTypes,
        applications: state.applications,
        signatures: state.signatures,
        stamps: state.stamps,
        auditLogs: state.auditLogs,
        notifications: state.notifications
      });
      markSelfPush();
      this.addAuditLog('CLOUD_PUSHED', 'Administrator pushed the local dataset to Supabase.');
      toast('success', 'Uploaded to Supabase', 'All local records now exist in your cloud database.');
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error?.message || 'Upload failed.' };
    }
  },

  login(user: UserProfile) {
    state.currentUser = user;
    state.isAuthenticated = true;
    safeSave(STORAGE_KEYS.CURRENT_USER, user);
    safeSave(STORAGE_KEYS.IS_AUTHENTICATED, true);
    this.addAuditLog('USER_LOGIN', `User ${user.name} (${user.role}) authenticated successfully`);
    notifyListeners();
    if (cloud.enabled) {
      void ensureCloudSync();
    }
  },

  logout() {
    state.isAuthenticated = false;
    safeSave(STORAGE_KEYS.IS_AUTHENTICATED, false);
    this.addAuditLog('USER_LOGOUT', `User ${state.currentUser.name} signed out`);
    notifyListeners();
  },

  setCurrentUser(user: UserProfile) {
    state.currentUser = user;
    safeSave(STORAGE_KEYS.CURRENT_USER, user);
    notifyListeners();
  },

  addUser(newUser: UserProfile) {
    state.users = [...state.users, newUser];
    safeSave(STORAGE_KEYS.USERS, state.users);
    if (cloudWritable()) {
      markSelfPush();
      cloud.pushUsers([newUser]);
    }
    this.addAuditLog('USER_CREATED', `Administrator created new account for ${newUser.name} (${newUser.email}, role: ${newUser.role})`);
    notifyListeners();
  },

  deleteUser(userId: string) {
    state.users = state.users.filter(u => u.id !== userId);
    safeSave(STORAGE_KEYS.USERS, state.users);
    if (cloudWritable()) {
      markSelfPush();
      cloud.deleteUser(userId);
    }
    this.addAuditLog('USER_DELETED', `Administrator removed user ID: ${userId}`);
    notifyListeners();
  },

  /** Update an existing user's profile fields (e.g. avatarUrl). */
  updateUser(userId: string, changes: Partial<UserProfile>) {
    state.users = state.users.map(u => u.id === userId ? { ...u, ...changes } : u);
    safeSave(STORAGE_KEYS.USERS, state.users);
    // Keep the signed-in session fresh if this is the current user.
    if (state.currentUser.id === userId) {
      state.currentUser = { ...state.currentUser, ...changes };
      safeSave(STORAGE_KEYS.CURRENT_USER, state.currentUser);
    }
    // Always try to push to cloud (avatar may have been set while offline).
    if (cloud.enabled) {
      const updated = state.users.find(u => u.id === userId);
      if (updated) { markSelfPush(); cloud.pushUsers([updated]); }
    }
    this.addAuditLog('USER_UPDATED', `Administrator updated profile for user ID: ${userId}`);
    notifyListeners();
  },

  addAuditLog(action: string, details: string, applicationRef?: string) {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actorId: state.currentUser.id,
      actorName: state.currentUser.name,
      actorRole: state.currentUser.role,
      action,
      details,
      applicationRef,
      ipAddress: '127.0.0.1 (Authenticated Session)'
    };
    state.auditLogs = [newLog, ...state.auditLogs];
    safeSave(STORAGE_KEYS.AUDIT_LOGS, state.auditLogs);
    if (cloudWritable()) {
      markSelfPush();
      cloud.pushAuditLog(newLog);
    }
    notifyListeners();
  },

  addNotification(notif: Omit<NotificationItem, 'id' | 'createdAt'>) {
    // Collapse identical unread alerts instead of stacking duplicates on every
    // repeated action (the same task advancing four times produced four alerts).
    const alreadyQueued = state.notifications.some(
      existing =>
        !existing.read &&
        existing.userId === notif.userId &&
        existing.title === notif.title &&
        existing.message === notif.message &&
        (existing.applicationRef || '') === (notif.applicationRef || '')
    );
    if (alreadyQueued) return;

    const newNotif: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    state.notifications = [newNotif, ...state.notifications];
    safeSave(STORAGE_KEYS.NOTIFICATIONS, state.notifications);
    if (cloudWritable()) {
      markSelfPush();
      cloud.pushNotification(newNotif);
    }
    notifyListeners();
  },

  markNotificationAsRead(id: string) {
    state.notifications = state.notifications.map(n => n.id === id ? { ...n, read: true } : n);
    safeSave(STORAGE_KEYS.NOTIFICATIONS, state.notifications);
    const updated = state.notifications.filter(n => n.id === id);
    if (cloudWritable() && updated.length) {
      markSelfPush();
      cloud.pushNotifications(updated);
    }
    notifyListeners();
  },

  markAllNotificationsAsRead(userId: string) {
    state.notifications = state.notifications.map(n => n.userId === userId ? { ...n, read: true } : n);
    safeSave(STORAGE_KEYS.NOTIFICATIONS, state.notifications);
    const updated = state.notifications.filter(n => n.userId === userId);
    if (cloudWritable() && updated.length) {
      markSelfPush();
      cloud.pushNotifications(updated);
    }
    notifyListeners();
  },

  /**
   * Creates a new application from submitted form data
   */
  async createApplication(params: {
    applicationTypeId: string;
    formData: Record<string, any>;
    uploadedDocuments: UploadedDocument[];
    paymentReceiptUrl?: string;
    /** Student-composed application: no catalog entry, explicit routing. */
    custom?: {
      title: string;
      key: string;
      stages: WorkflowStageDefinition[];
    };
  }): Promise<Application> {
    const catalogType = state.applicationTypes.find(t => t.id === params.applicationTypeId);
    if (!catalogType && !params.custom) {
      throw new Error('Application type not found');
    }

    // A student-composed application has no catalog entry, so build an
    // ephemeral definition; everything downstream then works unchanged.
    const appType: ApplicationType = catalogType ?? {
      id: `${CUSTOM_APPLICATION_ID_PREFIX}${Date.now()}`,
      key: params.custom!.key,
      title: params.custom!.title,
      description: 'Student-composed application',
      category: 'administrative',
      icon: 'file-text',
      estimatedDurationDays: Math.max(
        1,
        Math.ceil(params.custom!.stages.reduce((total, stage) => total + stage.slaHours, 0) / 8)
      ),
      active: true,
      publishedVersion: 1,
      formConfig: {
        version: 1,
        title: params.custom!.title,
        description: '',
        instructions: '',
        fields: [],
        requiredDocuments: [],
        declarations: [],
        feeRules: { required: false, amount: 0 }
      },
      documentTemplate: customDocumentTemplate(params.custom!.title),
      workflowDefinition: { id: `custom-wf-${Date.now()}`, version: 1, stages: params.custom!.stages }
    };

    const now = new Date();
    const nowIso = now.toISOString();

    // Generate unique reference number e.g. APP-2026-LV-3921
    const categoryCode = appType.key.substring(0, 2).toUpperCase();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const referenceNumber = `APP-2026-${categoryCode}-${randomSuffix}`;

    // Initialize workflow stages
    const workflowStages = appType.workflowDefinition.stages;
    const stageInstances = workflowStages.map((stg, idx) => {
      const isFirst = idx === 0;
      const startedAt = isFirst ? nowIso : undefined;
      const deadline = isFirst ? addBusinessHours(now, stg.slaHours).toISOString() : undefined;

      return {
        stageId: stg.id,
        name: stg.name,
        assignedDepartment: stg.assignedDepartment,
        assignedRole: stg.assignedRole,
        assignedStaffId: stg.assignedStaffId,
        assignedStaffName: INITIAL_USERS.find(u => u.id === stg.assignedStaffId)?.name,
        status: isFirst ? ('in_progress' as const) : ('pending' as const),
        startedAt,
        deadline,
        warningCount: 0,
        slaHours: stg.slaHours,
        requiresSignature: stg.requiresSignature,
        requiresStamp: stg.requiresStamp
      };
    });

    const targetDeadline = addBusinessHours(now, appType.estimatedDurationDays * 8).toISOString();

    const newApp: Application = {
      id: `app-${Date.now()}-${randomSuffix}`,
      referenceNumber,
      applicationTypeId: appType.id,
      applicationTypeTitle: appType.title,
      templateVersion: appType.publishedVersion,
      studentId: state.currentUser.id,
      studentSnapshot: {
        name: state.currentUser.name,
        registrationNumber: state.currentUser.registrationNumber || '2024-REG-000',
        email: state.currentUser.email,
        department: state.currentUser.department,
        phone: state.currentUser.phone
      },
      status: stageInstances[0]?.requiresSignature ? 'pending_signature' : 'under_verification',
      currentStageId: stageInstances[0].stageId,
      currentStageIndex: 0,
      formData: params.formData,
      uploadedDocuments: params.uploadedDocuments,
      paymentRecord: appType.formConfig.feeRules.required
        ? {
            required: true,
            amount: appType.formConfig.feeRules.amount,
            receiptUrl: params.paymentReceiptUrl,
            status: params.paymentReceiptUrl ? 'receipt_submitted' : 'pending'
          }
        : undefined,
      stageInstances,
      timeline: [
        {
          id: `tl-init-${Date.now()}`,
          timestamp: nowIso,
          stageName: 'Student Submission',
          title: 'Application Formally Submitted',
          description: `Application submitted by ${state.currentUser.name}. Unique Reference Number ${referenceNumber} assigned.`,
          actorName: state.currentUser.name,
          actorRole: 'student',
          type: 'submission'
        },
        {
          id: `tl-route-${Date.now()}`,
          timestamp: nowIso,
          stageName: stageInstances[0].name,
          title: `Assigned to ${stageInstances[0].name}`,
          description: `Initial review assigned to ${stageInstances[0].assignedRole} (${stageInstances[0].assignedDepartment}).`,
          actorName: 'Workflow Engine',
          actorRole: 'system',
          type: 'verification'
        }
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
      submissionDate: nowIso,
      estimatedCompletionDate: targetDeadline,
      targetDeadline
    };

    state.applications = [newApp, ...state.applications];
    safeSave(STORAGE_KEYS.APPLICATIONS, state.applications);
    syncApplication(newApp.id);

    // Audit log
    this.addAuditLog(
      'APPLICATION_SUBMISSION',
      `Student ${state.currentUser.name} submitted application ${referenceNumber} (${appType.title})`,
      referenceNumber
    );

    // Notify student
    this.addNotification({
      userId: state.currentUser.id,
      title: `Application Submitted: ${referenceNumber}`,
      message: `Your ${appType.title} has been assigned reference number ${referenceNumber} and forwarded to ${stageInstances[0].name}.`,
      type: 'info',
      read: false,
      applicationRef: referenceNumber
    });

    // Notify assigned staff
    if (stageInstances[0].assignedStaffId) {
      this.addNotification({
        userId: stageInstances[0].assignedStaffId,
        title: `New Task Assignment: ${referenceNumber}`,
        message: `${state.currentUser.name} submitted a new ${appType.title} requiring your review.`,
        type: 'info',
        read: false,
        applicationRef: referenceNumber
      });
    }

    notifyListeners();
    return newApp;
  },

  /**
   * Review / verify uploaded document
   */
  reviewDocument(params: {
    applicationId: string;
    documentId: string;
    status: 'verified' | 'rejected';
    rejectionReason?: string;
  }) {
    const app = state.applications.find(a => a.id === params.applicationId);
    if (!app) return;

    const existingDoc = app.uploadedDocuments.find(d => d.id === params.documentId);
    if (!existingDoc) return;
    // Re-clicking "Verify" on an already-verified document used to append a new
    // timeline event, audit entry and notification every time.
    if (
      existingDoc.status === params.status &&
      (params.status === 'verified' || (existingDoc.rejectionReason || '') === (params.rejectionReason || ''))
    ) {
      return;
    }

    const nowIso = new Date().toISOString();
    const updatedDocs = app.uploadedDocuments.map(doc => {
      if (doc.id === params.documentId) {
        return {
          ...doc,
          status: params.status,
          rejectionReason: params.rejectionReason,
          verifiedBy: state.currentUser.name,
          verifiedAt: nowIso
        };
      }
      return doc;
    });

    const targetDoc = app.uploadedDocuments.find(d => d.id === params.documentId);
    const docName = targetDoc ? targetDoc.requirementName : 'Supporting Document';

    const timelineEvent = {
      id: `tl-doc-${Date.now()}`,
      timestamp: nowIso,
      stageName: app.stageInstances[app.currentStageIndex]?.name || 'Verification',
      title: params.status === 'verified' ? `Document Verified: ${docName}` : `Document Rejected: ${docName}`,
      description: params.status === 'verified'
        ? `Verified by ${state.currentUser.name} (${state.currentUser.designation || state.currentUser.role}).`
        : `Rejected with reason: "${params.rejectionReason}". Student notification sent.`,
      actorName: state.currentUser.name,
      actorRole: state.currentUser.role,
      type: (params.status === 'verified' ? 'verification' : 'rejection') as any
    };

    const updatedApp: Application = {
      ...app,
      uploadedDocuments: updatedDocs,
      timeline: [...app.timeline, timelineEvent],
      updatedAt: nowIso
    };

    state.applications = state.applications.map(a => a.id === params.applicationId ? updatedApp : a);
    safeSave(STORAGE_KEYS.APPLICATIONS, state.applications);
    syncApplication(params.applicationId);

    this.addAuditLog(
      params.status === 'verified' ? 'DOCUMENT_VERIFIED' : 'DOCUMENT_REJECTED',
      `${state.currentUser.name} ${params.status} document "${docName}" for application ${app.referenceNumber}`,
      app.referenceNumber
    );

    notifyListeners();
  },

  /**
   * Process a stage decision (Approve, Reject, Request Correction)
   */
  async processStageDecision(params: {
    applicationId: string;
    action: 'approve' | 'reject' | 'request_correction';
    decisionNotes: string;
    signatureAssetId?: string;
    stampAssetId?: string;
  }): Promise<Application> {
    const app = state.applications.find(a => a.id === params.applicationId);
    if (!app) throw new Error('Application not found');

    const appType = state.applicationTypes.find(t => t.id === app.applicationTypeId);
    if (!appType && !isCustomApplication(app)) throw new Error('Application type definition missing');

    const now = new Date();
    const nowIso = now.toISOString();

    const currentStage = { ...app.stageInstances[app.currentStageIndex] };

    // Authority checks: students never decide, and signature/seal stages belong
    // to the head of the stage's department — never the administrator.
    if (state.currentUser.role === 'student') {
      throw new Error('Students cannot record workflow decisions.');
    }
    const stageNeedsSeal = Boolean(currentStage.requiresSignature || currentStage.requiresStamp);
    if (params.action === 'approve' && stageNeedsSeal) {
      if (!canSignStage(state.currentUser, currentStage)) {
        throw new Error(
          `Stage "${currentStage.name}" requires the signature and seal of the Head of ${currentStage.assignedDepartment}.`
        );
      }
      if (currentStage.requiresSignature && !params.signatureAssetId) {
        throw new Error('An electronic signature asset is required to approve this stage.');
      }
      if (currentStage.requiresStamp && !params.stampAssetId) {
        throw new Error('The official department seal is required to approve this stage.');
      }
      const signatureAsset = state.signatures.find(s => s.id === params.signatureAssetId);
      if (
        params.signatureAssetId &&
        signatureAsset &&
        signatureAsset.department !== currentStage.assignedDepartment &&
        signatureAsset.department !== state.currentUser.department
      ) {
        throw new Error('The selected signature belongs to another department.');
      }
    }
    const updatedStages = [...app.stageInstances];
    const updatedTimeline = [...app.timeline];

    // Find applied signature and stamp assets if requested
    let appliedSignature = state.signatures.find(s => s.id === params.signatureAssetId);
    let appliedStamp = state.stamps.find(s => s.id === params.stampAssetId);

    if (params.action === 'approve') {
      currentStage.status = 'completed';
      currentStage.completedAt = nowIso;
      currentStage.decisionNotes = params.decisionNotes;
      currentStage.actionTakenBy = state.currentUser.name;

      if (appliedSignature) {
        currentStage.signatureApplied = true;
        currentStage.signatureAssetUrl = appliedSignature.imageUrl;
      }
      if (appliedStamp) {
        currentStage.stampApplied = true;
        currentStage.stampAssetUrl = appliedStamp.imageUrl;
      }

      updatedStages[app.currentStageIndex] = currentStage;

      // Add timeline event
      updatedTimeline.push({
        id: `tl-appr-${Date.now()}`,
        timestamp: nowIso,
        stageName: currentStage.name,
        title: `Stage Approved: ${currentStage.name}`,
        description: `Approved by ${state.currentUser.name}. Notes: "${params.decisionNotes || 'Approved without caveat'}".${appliedSignature ? ' [Electronic Signature Applied]' : ''}${appliedStamp ? ' [Official Seal Affixed]' : ''}`,
        actorName: state.currentUser.name,
        actorRole: state.currentUser.designation || state.currentUser.role,
        type: appliedSignature ? 'signature' : 'approval'
      });

      const nextStageIndex = app.currentStageIndex + 1;
      const isFinalStage = nextStageIndex >= updatedStages.length;

      if (!isFinalStage) {
        // Advance to next stage
        const nextStage = { ...updatedStages[nextStageIndex] };
        nextStage.status = 'in_progress';
        nextStage.startedAt = nowIso;
        nextStage.deadline = addBusinessHours(now, nextStage.slaHours).toISOString();
        updatedStages[nextStageIndex] = nextStage;

        const nextStatus = nextStage.requiresSignature
          ? 'pending_signature'
          : 'pending_approval';

        const updatedApp: Application = {
          ...app,
          status: nextStatus,
          currentStageId: nextStage.stageId,
          currentStageIndex: nextStageIndex,
          stageInstances: updatedStages,
          timeline: updatedTimeline,
          updatedAt: nowIso
        };

        state.applications = state.applications.map(a => a.id === app.id ? updatedApp : a);
        safeSave(STORAGE_KEYS.APPLICATIONS, state.applications);
        syncApplication(app.id);

        this.addAuditLog(
          'STAGE_APPROVED',
          `${state.currentUser.name} approved stage "${currentStage.name}" for ${app.referenceNumber}. Advanced to "${nextStage.name}".`,
          app.referenceNumber
        );

        // Notify next assignee
        if (nextStage.assignedStaffId) {
          this.addNotification({
            userId: nextStage.assignedStaffId,
            title: `Task Awaiting Your Approval: ${app.referenceNumber}`,
            message: `Application ${app.referenceNumber} has advanced to stage "${nextStage.name}".`,
            type: 'info',
            read: false,
            applicationRef: app.referenceNumber
          });
        }

        notifyListeners();
        return updatedApp;
      } else {
        // FINAL STAGE COMPLETE: Generate official issued document!
        const docTemplate = appType?.documentTemplate ?? customDocumentTemplate(app.applicationTypeTitle);
        const verificationCode = `ASU-VRF-${Math.floor(100000 + Math.random() * 900000)}-${app.referenceNumber.split('-')[2]}`;
        const documentNumber = `SANCTION-2026-${app.studentSnapshot.department.substring(0, 3).toUpperCase()}-${app.referenceNumber.split('-')[3]}`;
        const rawContentToHash = `${app.referenceNumber}-${documentNumber}-${verificationCode}-${nowIso}-${state.currentUser.id}`;
        const documentHash = await calculateDocumentHash(rawContentToHash);

        // Aggregate all applied signatures and stamps from stages
        const appliedSignatures = updatedStages
          .filter(s => s.signatureApplied && s.signatureAssetUrl)
          .map(s => ({
            slotId: s.stageId,
            staffName: s.actionTakenBy || 'Authorized Officer',
            roleTitle: s.assignedRole,
            timestamp: s.completedAt || nowIso,
            signatureUrl: s.signatureAssetUrl!
          }));

        // If the current stage had a signature selected, ensure it's recorded
        if (appliedSignature && !appliedSignatures.some(sig => sig.signatureUrl === appliedSignature!.imageUrl)) {
          appliedSignatures.push({
            slotId: 'final-sig',
            staffName: state.currentUser.name,
            roleTitle: state.currentUser.designation || currentStage.assignedRole,
            timestamp: nowIso,
            signatureUrl: appliedSignature.imageUrl
          });
        }

        const appliedStamps = updatedStages
          .filter(s => s.stampApplied && s.stampAssetUrl)
          .map(s => ({
            slotId: s.stageId,
            stampName: s.name + ' Official Seal',
            timestamp: s.completedAt || nowIso,
            stampUrl: s.stampAssetUrl!
          }));

        if (appliedStamp && !appliedStamps.some(st => st.stampUrl === appliedStamp!.imageUrl)) {
          appliedStamps.push({
            slotId: 'final-stamp',
            stampName: appliedStamp.name,
            timestamp: nowIso,
            stampUrl: appliedStamp.imageUrl
          });
        }

        const issuedDoc: IssuedDocument = {
          id: `doc-${Date.now()}`,
          documentNumber,
          referenceNumber: app.referenceNumber,
          generatedAt: nowIso,
          verificationCode,
          documentHash,
          appliedSignatures,
          appliedStamps
        };

        // Pre-render the exact PDF once, so every authorised party downloads
        // the same sealed file rather than re-rendering HTML per device.
        const issuedType = state.applicationTypes.find(t => t.id === app.applicationTypeId);
        const issuedPdf = await buildIssuedDocumentPdf(
          { ...app, issuedDocument: issuedDoc },
          issuedType?.documentTemplate ??
            (isCustomApplication(app) ? customDocumentTemplate(app.applicationTypeTitle) : undefined)
        );
        if (issuedPdf) {
          issuedDoc.pdfDataUrl = issuedPdf;
          issuedDoc.pdfVersion = PDF_RENDER_VERSION;
        }

        updatedTimeline.push({
          id: `tl-iss-${Date.now()}`,
          timestamp: nowIso,
          stageName: 'Official Document Issuance',
          title: 'Document Approved & Formally Issued',
          description: `All workflow approval requirements satisfied. Official Certificate #${documentNumber} generated with cryptographic verification hash.`,
          actorName: 'Issuance Engine',
          actorRole: 'system',
          type: 'issuance'
        });

        const completedApp: Application = {
          ...app,
          status: 'completed',
          stageInstances: updatedStages,
          timeline: updatedTimeline,
          issuedDocument: issuedDoc,
          updatedAt: nowIso
        };

        state.applications = state.applications.map(a => a.id === app.id ? completedApp : a);
        safeSave(STORAGE_KEYS.APPLICATIONS, state.applications);
        syncApplication(app.id);

        this.addAuditLog(
          'DOCUMENT_ISSUANCE',
          `Final clearance issued for ${app.referenceNumber}. Document Number: ${documentNumber}. Hash: ${documentHash.substring(0, 16)}...`,
          app.referenceNumber
        );

        // Notify Student
        this.addNotification({
          userId: app.studentId,
          title: `Application Completed & Document Ready: ${app.referenceNumber}`,
          message: `Your ${app.applicationTypeTitle} has concluded successfully. You may now download your authentic official signed document.`,
          type: 'success',
          read: false,
          applicationRef: app.referenceNumber
        });

        notifyListeners();
        return completedApp;
      }
    } else if (params.action === 'request_correction') {
      currentStage.decisionNotes = params.decisionNotes;
      updatedStages[app.currentStageIndex] = currentStage;

      updatedTimeline.push({
        id: `tl-corr-${Date.now()}`,
        timestamp: nowIso,
        stageName: currentStage.name,
        title: 'Correction Requested from Student',
        description: `Officer note: "${params.decisionNotes}". Application paused awaiting student revision.`,
        actorName: state.currentUser.name,
        actorRole: state.currentUser.designation || state.currentUser.role,
        type: 'correction_request'
      });

      const pausedApp: Application = {
        ...app,
        status: 'awaiting_student_action',
        correctionRequestNote: params.decisionNotes,
        stageInstances: updatedStages,
        timeline: updatedTimeline,
        updatedAt: nowIso
      };

      state.applications = state.applications.map(a => a.id === app.id ? pausedApp : a);
      safeSave(STORAGE_KEYS.APPLICATIONS, state.applications);
      syncApplication(app.id);

      this.addAuditLog(
        'CORRECTION_REQUESTED',
        `${state.currentUser.name} requested correction on ${app.referenceNumber}: "${params.decisionNotes}"`,
        app.referenceNumber
      );

      this.addNotification({
        userId: app.studentId,
        title: `Action Required on Application: ${app.referenceNumber}`,
        message: `A reviewer requested clarification/correction: "${params.decisionNotes}". Please open the application to update your response.`,
        type: 'warning',
        read: false,
        applicationRef: app.referenceNumber
      });

      notifyListeners();
      return pausedApp;
    } else {
      // Rejection
      currentStage.status = 'rejected';
      currentStage.completedAt = nowIso;
      currentStage.decisionNotes = params.decisionNotes;
      currentStage.actionTakenBy = state.currentUser.name;
      updatedStages[app.currentStageIndex] = currentStage;

      updatedTimeline.push({
        id: `tl-rej-${Date.now()}`,
        timestamp: nowIso,
        stageName: currentStage.name,
        title: 'Application Formally Rejected',
        description: `Decision by ${state.currentUser.name}. Mandatory explanation: "${params.decisionNotes}".`,
        actorName: state.currentUser.name,
        actorRole: state.currentUser.designation || state.currentUser.role,
        type: 'rejection'
      });

      const rejectedApp: Application = {
        ...app,
        status: 'rejected',
        stageInstances: updatedStages,
        timeline: updatedTimeline,
        updatedAt: nowIso
      };

      state.applications = state.applications.map(a => a.id === app.id ? rejectedApp : a);
      safeSave(STORAGE_KEYS.APPLICATIONS, state.applications);
      syncApplication(app.id);

      this.addAuditLog(
        'APPLICATION_REJECTED',
        `${state.currentUser.name} rejected ${app.referenceNumber} in stage "${currentStage.name}": "${params.decisionNotes}"`,
        app.referenceNumber
      );

      this.addNotification({
        userId: app.studentId,
        title: `Application Not Approved: ${app.referenceNumber}`,
        message: `Your ${app.applicationTypeTitle} was not approved by ${currentStage.name}. Reason: "${params.decisionNotes}".`,
        type: 'alert',
        read: false,
        applicationRef: app.referenceNumber
      });

      notifyListeners();
      return rejectedApp;
    }
  },

  /**
   * Resubmit application after addressing a correction request
   */
  resubmitCorrection(params: {
    applicationId: string;
    updatedFormData: Record<string, any>;
    replacementDocuments?: UploadedDocument[];
  }) {
    const app = state.applications.find(a => a.id === params.applicationId);
    if (!app) return;

    const nowIso = new Date().toISOString();
    const currentStage = app.stageInstances[app.currentStageIndex];

    const timelineEvent = {
      id: `tl-resub-${Date.now()}`,
      timestamp: nowIso,
      stageName: currentStage?.name || 'Review',
      title: 'Correction Submitted by Student',
      description: 'Student updated form details and provided required supplementary clarification.',
      actorName: state.currentUser.name,
      actorRole: 'student',
      type: 'submission' as const
    };

    const updatedApp: Application = {
      ...app,
      status: 'under_verification',
      formData: { ...app.formData, ...params.updatedFormData },
      uploadedDocuments: params.replacementDocuments || app.uploadedDocuments,
      correctionRequestNote: undefined,
      timeline: [...app.timeline, timelineEvent],
      updatedAt: nowIso
    };

    state.applications = state.applications.map(a => a.id === params.applicationId ? updatedApp : a);
    safeSave(STORAGE_KEYS.APPLICATIONS, state.applications);
    syncApplication(params.applicationId);

    this.addAuditLog(
      'CORRECTION_RESUBMITTED',
      `Student ${state.currentUser.name} resubmitted corrected information on ${app.referenceNumber}`,
      app.referenceNumber
    );

    if (currentStage?.assignedStaffId) {
      this.addNotification({
        userId: currentStage.assignedStaffId,
        title: `Correction Received: ${app.referenceNumber}`,
        message: `${state.currentUser.name} has provided updated details for ${app.referenceNumber}. Stage review resumed.`,
        type: 'info',
        read: false,
        applicationRef: app.referenceNumber
      });
    }

    notifyListeners();
  },

  /**
   * Administrator Form Builder: Save draft configuration
   */
  saveFormTemplateDraft(typeId: string, draftConfig: FormTemplate) {
    state.applicationTypes = state.applicationTypes.map(t => {
      if (t.id === typeId) {
        return {
          ...t,
          draftFormConfig: draftConfig,
          hasUnpublishedDraft: true
        };
      }
      return t;
    });
    safeSave(STORAGE_KEYS.APPLICATION_TYPES, state.applicationTypes);
    syncApplicationType(typeId);
    this.addAuditLog('FORM_TEMPLATE_DRAFT_SAVED', `Administrator updated draft form definition for ${typeId}`);
    notifyListeners();
  },

  /**
   * Administrator Form Builder: Publish new version
   * Preserves historical version number so past applications stay on their submitted version!
   */
  publishFormTemplate(typeId: string, newConfig: FormTemplate) {
    state.applicationTypes = state.applicationTypes.map(t => {
      if (t.id === typeId) {
        const nextVersion = t.publishedVersion + 1;
        return {
          ...t,
          publishedVersion: nextVersion,
          formConfig: { ...newConfig, version: nextVersion },
          draftFormConfig: undefined,
          hasUnpublishedDraft: false
        };
      }
      return t;
    });
    safeSave(STORAGE_KEYS.APPLICATION_TYPES, state.applicationTypes);
    syncApplicationType(typeId);
    this.addAuditLog('FORM_TEMPLATE_PUBLISHED', `Published new Version for Application Type ${typeId}`);
    notifyListeners();
  },

  /**
   * Administrator Document Designer: Update Official Document Template
   */
  saveDocumentTemplate(typeId: string, template: OfficialDocumentTemplate) {
    state.applicationTypes = state.applicationTypes.map(t => {
      if (t.id === typeId) {
        return {
          ...t,
          documentTemplate: { ...template, version: t.documentTemplate.version + 1 }
        };
      }
      return t;
    });
    safeSave(STORAGE_KEYS.APPLICATION_TYPES, state.applicationTypes);
    syncApplicationType(typeId);
    this.addAuditLog('DOCUMENT_TEMPLATE_UPDATED', `Updated official document layout & signature coordinates for ${typeId}`);
    notifyListeners();
  },

  /**
   * Administrator Workflow Builder: Update workflow definition
   */
  saveWorkflowDefinition(typeId: string, workflow: WorkflowDefinition) {
    state.applicationTypes = state.applicationTypes.map(t => {
      if (t.id === typeId) {
        return {
          ...t,
          workflowDefinition: { ...workflow, version: t.workflowDefinition.version + 1 }
        };
      }
      return t;
    });
    safeSave(STORAGE_KEYS.APPLICATION_TYPES, state.applicationTypes);
    syncApplicationType(typeId);
    this.addAuditLog('WORKFLOW_DEFINITION_UPDATED', `Configured workflow stages & SLA escalation policies for ${typeId}`);
    notifyListeners();
  },

  /**
   * Administrator: Create a new custom application type
   */
  createApplicationType(newType: ApplicationType) {
    state.applicationTypes = [...state.applicationTypes, newType];
    safeSave(STORAGE_KEYS.APPLICATION_TYPES, state.applicationTypes);
    if (cloudWritable()) {
      markSelfPush();
      cloud.pushApplicationType(newType);
    }
    this.addAuditLog('APPLICATION_TYPE_CREATED', `Administrator created new application category: "${newType.title}"`);
    notifyListeners();
  },

  /**
   * Save an authorized transparent signature asset
   */
  addSignatureAsset(asset: SignatureAsset) {
    state.signatures = [asset, ...state.signatures];
    safeSave(STORAGE_KEYS.SIGNATURES, state.signatures);
    if (cloudWritable()) {
      markSelfPush();
      cloud.pushSignature(asset);
    }
    this.addAuditLog('SIGNATURE_ASSET_REGISTERED', `Registered authorized transparent signature for ${asset.ownerName} (${asset.ownerRole})`);
    notifyListeners();
  },

  /** Replace an existing signature asset in-place (admin edit). */
  updateSignatureAsset(id: string, changes: Partial<SignatureAsset>) {
    state.signatures = state.signatures.map(s => s.id === id ? { ...s, ...changes } : s);
    safeSave(STORAGE_KEYS.SIGNATURES, state.signatures);
    if (cloudWritable()) {
      const updated = state.signatures.find(s => s.id === id);
      if (updated) { markSelfPush(); cloud.pushSignature(updated); }
    }
    this.addAuditLog('SIGNATURE_ASSET_UPDATED', `Administrator updated signature asset ${id}`);
    notifyListeners();
  },

  /** Permanently delete a signature asset. */
  deleteSignatureAsset(id: string) {
    state.signatures = state.signatures.filter(s => s.id !== id);
    safeSave(STORAGE_KEYS.SIGNATURES, state.signatures);
    this.addAuditLog('SIGNATURE_ASSET_DELETED', `Administrator deleted signature asset ${id}`);
    notifyListeners();
  },

  /**
   * Save an authorized transparent official stamp asset
   */
  addStampAsset(asset: StampAsset) {
    state.stamps = [asset, ...state.stamps];
    safeSave(STORAGE_KEYS.STAMPS, state.stamps);
    if (cloudWritable()) {
      markSelfPush();
      cloud.pushStamp(asset);
    }
    this.addAuditLog('STAMP_ASSET_REGISTERED', `Registered official seal asset "${asset.name}" (${asset.department})`);
    notifyListeners();
  },

  /** Replace an existing stamp asset in-place (admin edit). */
  updateStampAsset(id: string, changes: Partial<StampAsset>) {
    state.stamps = state.stamps.map(s => s.id === id ? { ...s, ...changes } : s);
    safeSave(STORAGE_KEYS.STAMPS, state.stamps);
    if (cloudWritable()) {
      const updated = state.stamps.find(s => s.id === id);
      if (updated) { markSelfPush(); cloud.pushStamp(updated); }
    }
    this.addAuditLog('STAMP_ASSET_UPDATED', `Administrator updated stamp asset ${id}`);
    notifyListeners();
  },

  /** Permanently delete a stamp asset. */
  deleteStampAsset(id: string) {
    state.stamps = state.stamps.filter(s => s.id !== id);
    safeSave(STORAGE_KEYS.STAMPS, state.stamps);
    this.addAuditLog('STAMP_ASSET_DELETED', `Administrator deleted stamp asset ${id}`);
    notifyListeners();
  },

  /**
   * Toggle activation/revocation of signature or stamp without deleting history
   */
  toggleAssetActive(id: string, type: 'signature' | 'stamp', active: boolean) {
    if (type === 'signature') {
      state.signatures = state.signatures.map(s => s.id === id ? { ...s, active } : s);
      safeSave(STORAGE_KEYS.SIGNATURES, state.signatures);
      if (cloudWritable()) {
        const updated = state.signatures.find(s => s.id === id);
        if (updated) {
          markSelfPush();
          cloud.pushSignature(updated);
        }
      }
    } else {
      state.stamps = state.stamps.map(s => s.id === id ? { ...s, active } : s);
      safeSave(STORAGE_KEYS.STAMPS, state.stamps);
      if (cloudWritable()) {
        const updated = state.stamps.find(s => s.id === id);
        if (updated) {
          markSelfPush();
          cloud.pushStamp(updated);
        }
      }
    }
    this.addAuditLog(
      active ? 'ASSET_ACTIVATED' : 'ASSET_REVOKED',
      `${type.toUpperCase()} asset ${id} status set to ${active ? 'ACTIVE' : 'REVOKED'}`
    );
    notifyListeners();
  },

  /**
   * Trigger SLA engine scheduler pass
   */
  triggerSLACheck() {
    const result = runSLASchedulerCheck(
      state.applications,
      (updatedApp) => {
        state.applications = state.applications.map(a => a.id === updatedApp.id ? updatedApp : a);
        safeSave(STORAGE_KEYS.APPLICATIONS, state.applications);
        syncApplication(updatedApp.id);
      },
      (notif) => {
        this.addNotification(notif);
      }
    );
    notifyListeners();
    return result;
  },

  /**
   * Reset data to initial seeded state (local + cloud when connected)
   */
  resetToDefaults() {
    // Clear only ApplyEase's own keys — the runtime Supabase credentials are a
    // connection setting, not demo data, and must survive a data reset.
    Object.values(STORAGE_KEYS).forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    });
    state = {
      isAuthenticated: false,
      currentUser: INITIAL_USERS[0],
      users: INITIAL_USERS,
      applicationTypes: INITIAL_APPLICATION_TYPES,
      applications: INITIAL_APPLICATIONS,
      signatures: INITIAL_SIGNATURES,
      stamps: INITIAL_STAMPS,
      auditLogs: INITIAL_AUDIT_LOGS,
      notifications: INITIAL_NOTIFICATIONS,
      cloudStatus: state.cloudStatus,
      cloudIssue: state.cloudIssue,
      isHydrating: false
    };
    safeSave(STORAGE_KEYS.IS_AUTHENTICATED, false);
    safeSave(STORAGE_KEYS.CURRENT_USER, state.currentUser);
    safeSave(STORAGE_KEYS.USERS, state.users);
    safeSave(STORAGE_KEYS.APPLICATION_TYPES, state.applicationTypes);
    safeSave(STORAGE_KEYS.APPLICATIONS, state.applications);
    safeSave(STORAGE_KEYS.SIGNATURES, state.signatures);
    safeSave(STORAGE_KEYS.STAMPS, state.stamps);
    safeSave(STORAGE_KEYS.AUDIT_LOGS, state.auditLogs);
    safeSave(STORAGE_KEYS.NOTIFICATIONS, state.notifications);
    notifyListeners();

    // Mirror the factory reset into the cloud database when it is connected.
    if (cloudWritable()) {
      void (async () => {
        try {
          await wipeCloud();
          await pushAll({
            users: INITIAL_USERS,
            applicationTypes: INITIAL_APPLICATION_TYPES,
            applications: INITIAL_APPLICATIONS,
            signatures: INITIAL_SIGNATURES,
            stamps: INITIAL_STAMPS,
            auditLogs: INITIAL_AUDIT_LOGS,
            notifications: INITIAL_NOTIFICATIONS
          });
          markSelfPush();
          toast('info', 'Cloud database reset', 'Supabase has been restored to the initial seeded state.');
        } catch {
          toast('warning', 'Cloud reset failed', 'Local data was reset, but the cloud database could not be reached.');
        }
      })();
    }
  }
};

/**
 * Store actions, bound once at module load.
 * Components receive stable references, so effects that depend on an action
 * (e.g. the boot-time cloud sync) cannot re-fire on every render.
 */
const boundActions = {
  login: ApplyEaseStore.login.bind(ApplyEaseStore),
  logout: ApplyEaseStore.logout.bind(ApplyEaseStore),
  authenticate: ApplyEaseStore.authenticate.bind(ApplyEaseStore),
  initCloudSync: ApplyEaseStore.initCloudSync.bind(ApplyEaseStore),
  connectCloud: ApplyEaseStore.connectCloud.bind(ApplyEaseStore),
  disconnectCloud: ApplyEaseStore.disconnectCloud.bind(ApplyEaseStore),
  resyncCloud: ApplyEaseStore.resyncCloud.bind(ApplyEaseStore),
  pushLocalToCloud: ApplyEaseStore.pushLocalToCloud.bind(ApplyEaseStore),
  setCurrentUser: ApplyEaseStore.setCurrentUser.bind(ApplyEaseStore),
  createApplication: ApplyEaseStore.createApplication.bind(ApplyEaseStore),
  reviewDocument: ApplyEaseStore.reviewDocument.bind(ApplyEaseStore),
  processStageDecision: ApplyEaseStore.processStageDecision.bind(ApplyEaseStore),
  resubmitCorrection: ApplyEaseStore.resubmitCorrection.bind(ApplyEaseStore),
  saveFormTemplateDraft: ApplyEaseStore.saveFormTemplateDraft.bind(ApplyEaseStore),
  publishFormTemplate: ApplyEaseStore.publishFormTemplate.bind(ApplyEaseStore),
  saveDocumentTemplate: ApplyEaseStore.saveDocumentTemplate.bind(ApplyEaseStore),
  saveWorkflowDefinition: ApplyEaseStore.saveWorkflowDefinition.bind(ApplyEaseStore),
  createApplicationType: ApplyEaseStore.createApplicationType.bind(ApplyEaseStore),
  addSignatureAsset: ApplyEaseStore.addSignatureAsset.bind(ApplyEaseStore),
  updateSignatureAsset: ApplyEaseStore.updateSignatureAsset.bind(ApplyEaseStore),
  deleteSignatureAsset: ApplyEaseStore.deleteSignatureAsset.bind(ApplyEaseStore),
  addStampAsset: ApplyEaseStore.addStampAsset.bind(ApplyEaseStore),
  updateStampAsset: ApplyEaseStore.updateStampAsset.bind(ApplyEaseStore),
  deleteStampAsset: ApplyEaseStore.deleteStampAsset.bind(ApplyEaseStore),
  toggleAssetActive: ApplyEaseStore.toggleAssetActive.bind(ApplyEaseStore),
  triggerSLACheck: ApplyEaseStore.triggerSLACheck.bind(ApplyEaseStore),
  markNotificationAsRead: ApplyEaseStore.markNotificationAsRead.bind(ApplyEaseStore),
  markAllNotificationsAsRead: ApplyEaseStore.markAllNotificationsAsRead.bind(ApplyEaseStore),
  addNotification: ApplyEaseStore.addNotification.bind(ApplyEaseStore),
  addAuditLog: ApplyEaseStore.addAuditLog.bind(ApplyEaseStore),
  addUser: ApplyEaseStore.addUser.bind(ApplyEaseStore),
  deleteUser: ApplyEaseStore.deleteUser.bind(ApplyEaseStore),
  updateUser: ApplyEaseStore.updateUser.bind(ApplyEaseStore),
  resetToDefaults: ApplyEaseStore.resetToDefaults.bind(ApplyEaseStore)
};

/**
 * React Hook to subscribe to ApplyEase store updates
 */
export function useApplyEaseStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick(t => t + 1);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return { ...state, ...boundActions };
}
