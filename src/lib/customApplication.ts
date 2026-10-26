/**
 * Student-composed applications
 * ---------------------------------------------------------------------------
 * Not every request fits a pre-built service. A student can write their own
 * application, attach whatever supporting files they have, and choose exactly
 * whose signature it needs — that choice becomes the workflow routing, so the
 * file travels to those officers in the order the student picked.
 *
 * The helpers here translate those choices into the same WorkflowStageDefinition
 * shape the rest of the platform already understands, so no downstream code
 * (SLA engine, queue, signing pane, issuance) needs a special case.
 */

import {
  Application,
  OfficialDocumentTemplate,
  SignatureAsset,
  StampAsset,
  UserProfile,
  WorkflowStageDefinition
} from '../types';
import { isSigningOfficer } from './access';

export const CUSTOM_APPLICATION_ID_PREFIX = 'custom:';

/** Hours each chosen officer gets before the SLA engine flags the stage. */
const DEFAULT_CUSTOM_SLA_HOURS = 24;

export interface SignatoryOption {
  staffId: string;
  name: string;
  roleTitle: string;
  department: string;
  /** Officers without a signature on file cannot complete a signing stage. */
  hasSignature: boolean;
  hasStamp: boolean;
}

/**
 * Signing officers the student may route to.
 *
 * Only officers with an active signature on file are offered by default, because
 * a stage that requires a signature but has no asset can never be completed.
 */
export function listSignatoryOptions(
  users: UserProfile[],
  signatures: SignatureAsset[],
  stamps: StampAsset[]
): SignatoryOption[] {
  return users
    .filter(user => user.role === 'staff' && user.active && isSigningOfficer(user))
    .map(user => ({
      staffId: user.id,
      name: user.name,
      roleTitle: user.designation || 'Signing Officer',
      department: user.department,
      hasSignature: signatures.some(
        asset =>
          asset.active &&
          asset.department === user.department &&
          asset.ownerName.trim().toLowerCase() === user.name.trim().toLowerCase()
      ),
      hasStamp: stamps.some(stamp => stamp.active && stamp.department === user.department)
    }))
    .sort((a, b) => Number(b.hasSignature) - Number(a.hasSignature) || a.name.localeCompare(b.name));
}

/** Builds the ordered workflow from the officers the student chose. */
export function buildCustomStages(options: SignatoryOption[]): WorkflowStageDefinition[] {
  return options.map((option, index) => ({
    id: `custom-stage-${index + 1}`,
    order: index,
    name: `${option.roleTitle} Review & Signature`,
    assignedDepartment: option.department,
    assignedRole: option.roleTitle,
    assignedStaffId: option.staffId,
    allowedActions: ['verify', 'approve', 'reject', 'request_correction', 'sign', 'stamp'],
    requiresSignature: true,
    requiresStamp: option.hasStamp,
    slaHours: DEFAULT_CUSTOM_SLA_HOURS,
    escalationPolicy: {
      warning1Hours: 6,
      warning2Hours: 12,
      warning3Hours: 18,
      escalateToAdmin: true
    }
  }));
}

/** Document layout used when a student-composed application is issued. */
export function customDocumentTemplate(title: string): OfficialDocumentTemplate {
  return {
    id: 'custom-template',
    version: 1,
    title: title.toUpperCase().slice(0, 90),
    subtitle: 'MCS • OFFICE OF THE REGISTRAR',
    orientation: 'portrait',
    headerNotice: 'MCS • OFFICE OF THE REGISTRAR',
    bodyParagraphs: [
      'This is to certify that {{student_name}}, bearing University Registration Number {{registration_number}}, of the Department of {{department}}, submitted the application detailed below.',
      '{{custom_statement}}',
      'The request recorded under reference {{reference_number}} has completed every required review and signature, and is hereby sanctioned.'
    ],
    signatureSlots: [],
    stampSlots: [],
    footerNotice: 'Issued by the Office of the Registrar · MCS',
    includeVerificationQR: true
  };
}

export function isCustomApplication(application: Pick<Application, 'applicationTypeId'>): boolean {
  return application.applicationTypeId.startsWith(CUSTOM_APPLICATION_ID_PREFIX);
}

/** Route summary used in the tracker and review panes. */
export function describeRoute(application: Application): string {
  const signing = application.stageInstances.filter(stage => stage.requiresSignature);
  if (signing.length === 0) return 'No signature required';
  return signing.map(stage => stage.assignedStaffName || stage.assignedRole).join(' → ');
}
