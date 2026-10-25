/**
 * ApplyEase Access Rules
 * ---------------------------------------------------------------------------
 * The workflow model has three kinds of authority:
 *
 *   Administrator   provisions services, accounts and assets; never signs.
 *   Head of Department (or officer-in-charge of a department) applies the
 *   electronic signature and official seal for their own department only.
 *   Faculty/other staff review and forward, but do not sign, and lose access to
 *   finished student records.
 *
 * These helpers are the single source of truth for those rules; both the UI and
 * the store call them, so the rules cannot drift apart.
 */

import { Application, SignatureAsset, StampAsset, UserProfile } from '../types';

/** Titles that carry signing authority for their department. */
const SIGNING_TITLES = /head of department|department head|chief hostel warden|university registrar|senior accounts officer|dean of|director of/i;

/** Does this designation carry signature/seal authority? */
export function isSigningTitle(title?: string): boolean {
  return SIGNING_TITLES.test(title || '');
}

/** True when the account may apply a signature or seal for its department. */
export function isSigningOfficer(user?: UserProfile | null): boolean {
  if (!user || user.role !== 'staff') return false;
  return isSigningTitle(user.designation);
}

/**
 * Completed/rejected records are held by the registrar (admin) and by the head
 * of the student's own department. Everyone else loses access once the file is
 * closed, even if they handled a stage earlier.
 */
export function canReviewRecord(user: UserProfile | null | undefined, application: Application): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (!isSigningOfficer(user)) return false;

  const studentDepartment = application.studentSnapshot?.department;
  if (studentDepartment && studentDepartment === user.department) return true;

  // A record signed by this officer's department stays visible to that office.
  return application.stageInstances.some(
    stage => stage.signatureApplied && stage.assignedDepartment === user.department
  );
}

/** Signature/seal authority is strictly departmental and never the admin. */
export function canApplySignature(user: UserProfile | null | undefined, department: string): boolean {
  if (!user || !department) return false;
  if (user.role === 'admin') return false;
  return isSigningOfficer(user) && user.department === department;
}

/**
 * Signature assets usable by this officer: active, from their department, and
 * their own (a head never signs with a colleague's signature).
 */
export function availableSignatures(user: UserProfile | null | undefined, assets: SignatureAsset[]): SignatureAsset[] {
  if (!user || !canApplySignature(user, user.department)) return [];
  return assets.filter(
    asset =>
      asset.active &&
      asset.department === user.department &&
      asset.ownerName.trim().toLowerCase() === user.name.trim().toLowerCase()
  );
}

/** Department seals usable by this officer. */
export function availableStamps(user: UserProfile | null | undefined, stamps: StampAsset[]): StampAsset[] {
  if (!user || !canApplySignature(user, user.department)) return [];
  return stamps.filter(stamp => stamp.active && stamp.department === user.department);
}

/** Who may act on a live stage: the assignee, or their department's officers. */
export function canWorkStage(user: UserProfile | null | undefined, application: Application): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const stage = application.stageInstances[application.currentStageIndex];
  if (!stage) return false;
  if (stage.assignedStaffId && stage.assignedStaffId === user.id) return true;
  return stage.assignedDepartment === user.department;
}
