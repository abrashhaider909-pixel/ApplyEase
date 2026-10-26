/**
 * ApplyEase Default Seed Data & Configuration
 */

import {
  UserProfile,
  ApplicationType,
  Application,
  SignatureAsset,
  StampAsset,
  AuditLog,
  NotificationItem
} from '../types';
import { generateOfficialStampSvg, generateSampleSignatureSvg } from './imageProcessor';

export const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Student Affairs & Hostels',
  'Library & Information Services',
  'Finance & Accounts Office',
  'Office of the University Registrar',
  'Academic Affairs Directorate'
];

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'admin-registrar',
    name: 'University Administrator',
    email: 'admin@gmail.com',
    password: '123',
    role: 'admin',
    department: 'Office of the University Registrar',
    designation: 'University Chief Administrator & Registrar',
    phone: '+1 (555) 890-1234',
    active: true
  },
  {
    id: 'student-1',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@university.edu',
    password: '123',
    role: 'student',
    registrationNumber: '2024-CS-104',
    department: 'Computer Science & Engineering',
    phone: '+1 (555) 234-8901',
    semester: '4th Semester (B.Tech)',
    hostelRoom: 'Hall 4 - Room 212-B',
    active: true
  },
  {
    id: 'student-2',
    name: 'Alex Chen',
    email: 'alex.chen@university.edu',
    password: '123',
    role: 'student',
    registrationNumber: '2023-EE-089',
    department: 'Electrical Engineering',
    phone: '+1 (555) 345-6712',
    semester: '6th Semester (B.Tech)',
    hostelRoom: 'Day Scholar',
    active: true
  },
  {
    id: 'staff-faculty',
    name: 'Dr. Robert Vance',
    email: 'robert.vance@university.edu',
    password: '123',
    role: 'staff',
    department: 'Computer Science & Engineering',
    designation: 'Faculty Advisor & Associate Professor',
    phone: '+1 (555) 456-7890',
    active: true
  },
  {
    id: 'staff-hod',
    name: 'Prof. Eleanor Wright',
    email: 'eleanor.wright@university.edu',
    password: '123',
    role: 'staff',
    department: 'Computer Science & Engineering',
    designation: 'Head of Department',
    phone: '+1 (555) 567-8901',
    active: true
  },
  {
    id: 'staff-warden',
    name: 'Col. Arvind Sharma',
    email: 'arvind.sharma@university.edu',
    password: '123',
    role: 'staff',
    department: 'Student Affairs & Hostels',
    designation: 'Chief Hostel Warden',
    phone: '+1 (555) 678-9012',
    active: true
  },
  {
    id: 'staff-finance',
    name: 'Sarah Sterling',
    email: 'sarah.sterling@university.edu',
    password: '123',
    role: 'staff',
    department: 'Finance & Accounts Office',
    designation: 'Senior Accounts Officer',
    phone: '+1 (555) 789-0123',
    active: true
  },
  {
    id: 'staff-registrar',
    name: 'Dr. Arthur Pendelton',
    email: 'arthur.pendelton@university.edu',
    password: '123',
    role: 'staff',
    department: 'Office of the University Registrar',
    designation: 'University Registrar',
    phone: '+1 (555) 890-1234',
    active: true
  }
];

// Initial pre-configured transparent signatures
export const INITIAL_SIGNATURES: SignatureAsset[] = [
  {
    id: 'sig-vance',
    name: "Dr. Robert Vance's Signature",
    type: 'signature',
    imageUrl: generateSampleSignatureSvg('Dr. Robert Vance', 1, '#172b50'),
    originalImageUrl: generateSampleSignatureSvg('Dr. Robert Vance', 1, '#172b50'),
    ownerName: 'Dr. Robert Vance',
    ownerRole: 'Faculty Advisor',
    department: 'Computer Science & Engineering',
    isTransparent: true,
    opacity: 0.95,
    active: true,
    createdAt: '2026-01-15T09:00:00Z',
    auditHash: 'sha256-sig-992a8e104f77c'
  },
  {
    id: 'sig-wright',
    name: "Prof. Eleanor Wright's Signature",
    type: 'signature',
    imageUrl: generateSampleSignatureSvg('Prof. Eleanor Wright', 2, '#0f244a'),
    originalImageUrl: generateSampleSignatureSvg('Prof. Eleanor Wright', 2, '#0f244a'),
    ownerName: 'Prof. Eleanor Wright',
    ownerRole: 'Head of Department',
    department: 'Computer Science & Engineering',
    isTransparent: true,
    opacity: 0.95,
    active: true,
    createdAt: '2026-01-15T09:00:00Z',
    auditHash: 'sha256-sig-441b332d98aa1'
  },
  {
    id: 'sig-sharma',
    name: "Col. Arvind Sharma's Signature",
    type: 'signature',
    imageUrl: generateSampleSignatureSvg('Col. Arvind Sharma', 3, '#142952'),
    originalImageUrl: generateSampleSignatureSvg('Col. Arvind Sharma', 3, '#142952'),
    ownerName: 'Col. Arvind Sharma',
    ownerRole: 'Chief Hostel Warden',
    department: 'Student Affairs & Hostels',
    isTransparent: true,
    opacity: 0.95,
    active: true,
    createdAt: '2026-01-15T09:00:00Z',
    auditHash: 'sha256-sig-788c122f33e88'
  },
  {
    id: 'sig-pendelton',
    name: "Dr. Arthur Pendelton's Signature",
    type: 'signature',
    imageUrl: generateSampleSignatureSvg('Dr. Arthur Pendelton', 1, '#172b50'),
    originalImageUrl: generateSampleSignatureSvg('Dr. Arthur Pendelton', 1, '#172b50'),
    ownerName: 'Dr. Arthur Pendelton',
    ownerRole: 'University Registrar',
    department: 'Office of the University Registrar',
    isTransparent: true,
    opacity: 0.95,
    active: true,
    createdAt: '2026-01-15T09:00:00Z',
    auditHash: 'sha256-sig-001d8923a411e'
  },
  {
    id: 'sig-sterling',
    name: "Sarah Sterling's Signature",
    type: 'signature',
    imageUrl: generateSampleSignatureSvg('Sarah Sterling', 2, '#1f3763'),
    originalImageUrl: generateSampleSignatureSvg('Sarah Sterling', 2, '#1f3763'),
    ownerName: 'Sarah Sterling',
    ownerRole: 'Senior Accounts Officer',
    department: 'Finance & Accounts Office',
    isTransparent: true,
    opacity: 0.95,
    active: true,
    createdAt: '2026-01-15T09:00:00Z',
    auditHash: 'sha256-sig-772ac41b0e933'
  }
];

// Initial pre-configured transparent official stamps
export const INITIAL_STAMPS: StampAsset[] = [
  {
    id: 'stamp-academic-seal',
    name: 'University Academic Registrar Seal',
    type: 'stamp',
    imageUrl: generateOfficialStampSvg('MCS', 'Office of Academic Affairs', 'REG-2026-AUTH', '#172b50', 0.9),
    originalImageUrl: generateOfficialStampSvg('MCS', 'Office of Academic Affairs', 'REG-2026-AUTH', '#172b50', 0.9),
    department: 'Office of the University Registrar',
    isTransparent: true,
    opacity: 0.9,
    active: true,
    createdAt: '2026-01-10T10:00:00Z',
    auditHash: 'sha256-seal-8819ab3e89104'
  },
  {
    id: 'stamp-cs-dept',
    name: 'Department of Computer Science Seal',
    type: 'stamp',
    imageUrl: generateOfficialStampSvg('Department of Computer Science', 'Endorsed & Verified', 'CSE-SEAL-26', '#1e3a6f', 0.88),
    originalImageUrl: generateOfficialStampSvg('Department of Computer Science', 'Endorsed & Verified', 'CSE-SEAL-26', '#1e3a6f', 0.88),
    department: 'Computer Science & Engineering',
    isTransparent: true,
    opacity: 0.88,
    active: true,
    createdAt: '2026-01-10T10:00:00Z',
    auditHash: 'sha256-seal-491290ff88231'
  },
  {
    id: 'stamp-hostel-seal',
    name: 'Hostel Administration Clearance Seal',
    type: 'stamp',
    imageUrl: generateOfficialStampSvg('Hostel & Residential Board', 'Clearance Sanctioned', 'HOSTEL-CLR-26', '#142952', 0.85),
    originalImageUrl: generateOfficialStampSvg('Hostel & Residential Board', 'Clearance Sanctioned', 'HOSTEL-CLR-26', '#142952', 0.85),
    department: 'Student Affairs & Hostels',
    isTransparent: true,
    opacity: 0.85,
    active: true,
    createdAt: '2026-01-10T10:00:00Z',
    auditHash: 'sha256-seal-901455e712390'
  },
  {
    id: 'stamp-finance-seal',
    name: 'Finance & Accounts Office Seal',
    type: 'stamp',
    imageUrl: generateOfficialStampSvg('Finance & Accounts Office', 'Fee Sanctioned', 'FIN-SEAL-26', '#1e3a6f', 0.87),
    originalImageUrl: generateOfficialStampSvg('Finance & Accounts Office', 'Fee Sanctioned', 'FIN-SEAL-26', '#1e3a6f', 0.87),
    department: 'Finance & Accounts Office',
    isTransparent: true,
    opacity: 0.87,
    active: true,
    createdAt: '2026-01-10T10:00:00Z',
    auditHash: 'sha256-seal-660d21f4a8c11'
  }
];

// Initial 7 Application Types
export const INITIAL_APPLICATION_TYPES: ApplicationType[] = [
  // 1. Leave Application
  {
    id: 'app-type-leave',
    key: 'leave-application',
    title: 'Leave Application',
    description: 'Request formal academic leave of absence for personal, medical, or academic travel with automated faculty and hostel clearance.',
    category: 'academic',
    icon: 'CalendarDays',
    estimatedDurationDays: 2,
    active: true,
    publishedVersion: 1,
    formConfig: {
      version: 1,
      title: 'Student Leave of Absence Application',
      description: 'Fill in your requested absence dates, reason, and emergency contact information.',
      instructions: 'Please submit at least 48 hours prior to planned leave. Medical leaves require doctor note attachment.',
      fields: [
        {
          id: 'student_name',
          label: 'Student Full Name',
          type: 'profile_autofill',
          autoFillProfileKey: 'name',
          required: true
        },
        {
          id: 'reg_no',
          label: 'Registration Number',
          type: 'profile_autofill',
          autoFillProfileKey: 'registrationNumber',
          required: true
        },
        {
          id: 'leave_type',
          label: 'Category of Leave',
          type: 'select',
          required: true,
          options: ['Medical Leave', 'Family / Personal Emergency', 'Academic Conference / Hackathon', 'Placement / Interview Leave']
        },
        {
          id: 'start_date',
          label: 'Leave Commencing Date',
          type: 'date',
          required: true
        },
        {
          id: 'end_date',
          label: 'Leave Resumption Date',
          type: 'date',
          required: true
        },
        {
          id: 'destination',
          label: 'Travel Destination & Residence Address',
          type: 'text',
          placeholder: 'e.g. Home Address (San Francisco, CA) or Hotel',
          required: true
        },
        {
          id: 'reason',
          label: 'Detailed Reason for Absence',
          type: 'textarea',
          placeholder: 'Explain the reason for requesting leave and any missed coursework contingency plan...',
          required: true
        },
        {
          id: 'is_hostel_resident',
          label: 'Are you currently residing in a university hostel?',
          type: 'select',
          required: true,
          options: ['Yes', 'No']
        },
        {
          id: 'parent_phone',
          label: 'Emergency / Parent Contact Telephone',
          type: 'text',
          placeholder: '+1 (555) 000-0000',
          required: true
        }
      ],
      requiredDocuments: [
        {
          id: 'doc-medical-proof',
          name: 'Medical Certificate or Invitation Letter',
          description: 'Required for medical leave or official conference representation.',
          required: false,
          acceptedFormats: ['pdf', 'png', 'jpg'],
          maxSizeMB: 5
        }
      ],
      declarations: [
        'I confirm that the dates and travel information provided are genuine and verified.',
        'I undertake full responsibility to cover missed lectures and lab assessments upon return.'
      ],
      feeRules: {
        required: false,
        amount: 0
      }
    },
    documentTemplate: {
      id: 'doc-template-leave',
      version: 1,
      title: 'OFFICIAL LEAVE SANCTION ORDER',
      subtitle: 'Issued under University Administrative Regulations (Academic Affairs)',
      orientation: 'portrait',
      headerNotice: 'MCS • OFFICE OF ACADEMIC AFFAIRS',
      bodyParagraphs: [
        'This is to officially certify that the application for academic leave submitted by student {{student_name}} (Registration No: {{registration_number}}) of the Department of {{department}} has been thoroughly verified, assessed against attendance regulations, and granted formal sanction.',
        'Sanctioned Period: From {{start_date}} to {{end_date}}. Destination: {{destination}}.',
        'Stated Reason: "{{reason}}". All designated departmental coursework advisors and residential hall authorities have reviewed and confirmed clearance for this period.',
        'The student is hereby authorized to leave campus grounds and is instructed to report back to the department and residential hall immediately upon resumption date.'
      ],
      signatureSlots: [
        {
          id: 'sig-slot-hod',
          roleTitle: 'Head of Department',
          requiredStaffRole: 'hod',
          assignedStaffId: 'staff-hod',
          xPercent: 18,
          yPercent: 78,
          widthPx: 180,
          heightPx: 60,
          showDate: true,
          showPrintedName: true
        },
        {
          id: 'sig-slot-warden',
          roleTitle: 'Chief Hostel Warden',
          requiredStaffRole: 'warden',
          assignedStaffId: 'staff-warden',
          xPercent: 68,
          yPercent: 78,
          widthPx: 180,
          heightPx: 60,
          showDate: true,
          showPrintedName: true
        }
      ],
      stampSlots: [
        {
          id: 'stamp-slot-cs',
          title: 'Department Endorsement Seal',
          department: 'Computer Science & Engineering',
          xPercent: 24,
          yPercent: 72,
          sizePx: 110,
          rotationDeg: -5,
          opacity: 0.88
        },
        {
          id: 'stamp-slot-hostel',
          title: 'Hostel Sanction Seal',
          department: 'Student Affairs & Hostels',
          xPercent: 74,
          yPercent: 72,
          sizePx: 110,
          rotationDeg: 8,
          opacity: 0.85
        }
      ],
      footerNotice: 'This document is electronically verified and digitally registered with the University Student Records Portal. Any alteration renders this authorization void.',
      includeVerificationQR: true
    },
    workflowDefinition: {
      id: 'wf-leave',
      version: 1,
      stages: [
        {
          id: 'stage-faculty-review',
          order: 1,
          name: 'Faculty Advisor Verification',
          assignedDepartment: 'Computer Science & Engineering',
          assignedRole: 'Faculty Advisor',
          assignedStaffId: 'staff-faculty',
          allowedActions: ['verify', 'approve', 'reject', 'request_correction'],
          requiresSignature: false,
          requiresStamp: false,
          slaHours: 24,
          escalationPolicy: {
            warning1Hours: 18,
            warning2Hours: 24,
            warning3Hours: 36,
            escalateToAdmin: true
          }
        },
        {
          id: 'stage-hod-approval',
          order: 2,
          name: 'HOD Clearance & Signature',
          assignedDepartment: 'Computer Science & Engineering',
          assignedRole: 'Head of Department',
          assignedStaffId: 'staff-hod',
          allowedActions: ['approve', 'reject', 'sign', 'stamp', 'request_correction'],
          requiresSignature: true,
          signatureSlotId: 'sig-slot-hod',
          requiresStamp: true,
          stampSlotId: 'stamp-slot-cs',
          slaHours: 24,
          escalationPolicy: {
            warning1Hours: 20,
            warning2Hours: 28,
            warning3Hours: 40,
            escalateToAdmin: true
          }
        },
        {
          id: 'stage-warden-endorse',
          order: 3,
          name: 'Hostel Warden Sanction & Out-Pass',
          assignedDepartment: 'Student Affairs & Hostels',
          assignedRole: 'Chief Hostel Warden',
          assignedStaffId: 'staff-warden',
          allowedActions: ['approve', 'reject', 'sign', 'stamp'],
          requiresSignature: true,
          signatureSlotId: 'sig-slot-warden',
          requiresStamp: true,
          stampSlotId: 'stamp-slot-hostel',
          slaHours: 16,
          escalationPolicy: {
            warning1Hours: 12,
            warning2Hours: 16,
            warning3Hours: 24,
            escalateToAdmin: true
          }
        }
      ]
    }
  },

  // 2. Mess Out / Mess Exemption Application
  {
    id: 'app-type-mess',
    key: 'mess-exemption',
    title: 'Mess Out / Exemption Application',
    description: 'Apply for residential dining mess fee rebate or temporary diet exemption for approved absence intervals.',
    category: 'hostel',
    icon: 'UtensilsCrossed',
    estimatedDurationDays: 3,
    active: true,
    publishedVersion: 1,
    formConfig: {
      version: 1,
      title: 'Mess Exemption & Rebate Application',
      description: 'Minimum exemption duration is 5 consecutive calendar days as per University Hostel Bylaws.',
      instructions: 'Hostel dining dues must be cleared prior to exemption processing.',
      fields: [
        {
          id: 'student_name',
          label: 'Student Name',
          type: 'profile_autofill',
          autoFillProfileKey: 'name',
          required: true
        },
        {
          id: 'reg_no',
          label: 'Registration Number',
          type: 'profile_autofill',
          autoFillProfileKey: 'registrationNumber',
          required: true
        },
        {
          id: 'hostel_name',
          label: 'Hostel / Residential Hall',
          type: 'select',
          required: true,
          options: ['Hall 1 (Aryabhata)', 'Hall 2 (Babbage)', 'Hall 3 (Turing)', 'Hall 4 (Hopper)', 'Day Boarder Section']
        },
        {
          id: 'start_date',
          label: 'Exemption Start Date',
          type: 'date',
          required: true
        },
        {
          id: 'end_date',
          label: 'Exemption Resumption Date',
          type: 'date',
          required: true
        },
        {
          id: 'reason',
          label: 'Justification for Dining Exemption',
          type: 'textarea',
          placeholder: 'Approved internship, medical diet prescribed by physician, or extended project work...',
          required: true
        }
      ],
      requiredDocuments: [
        {
          id: 'doc-mess-proof',
          name: 'Supporting Clearance or Medical Note',
          description: 'Attach physician prescription or departmental internship letter.',
          required: true,
          acceptedFormats: ['pdf', 'png', 'jpg'],
          maxSizeMB: 5
        }
      ],
      declarations: [
        'I certify that I will not consume meals in the hostel dining hall during the requested exemption period.',
        'I understand that false declarations will attract disciplinary fines as per hostel guidelines.'
      ],
      feeRules: {
        required: false,
        amount: 0
      }
    },
    documentTemplate: {
      id: 'doc-template-mess',
      version: 1,
      title: 'HOSTEL MESS EXEMPTION & REBATE CERTIFICATE',
      subtitle: 'Board of Residential Student Facilities',
      orientation: 'portrait',
      headerNotice: 'MCS • DIVISION OF STUDENT WELFARE',
      bodyParagraphs: [
        'This certificate sanctions mess billing exemption for resident student {{student_name}} (Reg: {{registration_number}}) of {{hostel_name}}.',
        'Effective Period: {{start_date}} through {{end_date}}. Purpose: {{reason}}.',
        'The hostel caterer and accounts ledger have been instructed to credit daily dining charges for the specified approved days.'
      ],
      signatureSlots: [
        {
          id: 'sig-slot-warden-mess',
          roleTitle: 'Hostel Dining Warden',
          requiredStaffRole: 'warden',
          assignedStaffId: 'staff-warden',
          xPercent: 50,
          yPercent: 78,
          widthPx: 180,
          heightPx: 60,
          showDate: true,
          showPrintedName: true
        }
      ],
      stampSlots: [
        {
          id: 'stamp-slot-mess',
          title: 'Hostel Board Seal',
          department: 'Student Affairs & Hostels',
          xPercent: 52,
          yPercent: 70,
          sizePx: 110,
          rotationDeg: 4,
          opacity: 0.88
        }
      ],
      footerNotice: 'Presented to Mess Manager upon billing reconciliations.',
      includeVerificationQR: true
    },
    workflowDefinition: {
      id: 'wf-mess',
      version: 1,
      stages: [
        {
          id: 'stage-mess-verify',
          order: 1,
          name: 'Hostel Warden Review & Billing Sanction',
          assignedDepartment: 'Student Affairs & Hostels',
          assignedRole: 'Chief Hostel Warden',
          assignedStaffId: 'staff-warden',
          allowedActions: ['verify', 'approve', 'reject', 'sign', 'stamp', 'request_correction'],
          requiresSignature: true,
          signatureSlotId: 'sig-slot-warden-mess',
          requiresStamp: true,
          stampSlotId: 'stamp-slot-mess',
          slaHours: 24,
          escalationPolicy: {
            warning1Hours: 20,
            warning2Hours: 28,
            warning3Hours: 40,
            escalateToAdmin: true
          }
        }
      ]
    }
  },

  // 3. Document Withdrawal or Collection
  {
    id: 'app-type-doc-withdrawal',
    key: 'doc-withdrawal',
    title: 'Document Withdrawal or Collection',
    description: 'Request temporary or permanent withdrawal of original secondary school certificates, marksheets, or migration credentials deposited at admission.',
    category: 'administrative',
    icon: 'FolderArchive',
    estimatedDurationDays: 4,
    active: true,
    publishedVersion: 1,
    formConfig: {
      version: 1,
      title: 'Original Credential Withdrawal Application',
      description: 'Specify which certificates are required, purpose, and intended date of re-deposit.',
      instructions: 'All university library, lab, and fee dues must be cleared prior to issuance of original certificates.',
      fields: [
        {
          id: 'student_name',
          label: 'Student Name',
          type: 'profile_autofill',
          autoFillProfileKey: 'name',
          required: true
        },
        {
          id: 'reg_no',
          label: 'Registration Number',
          type: 'profile_autofill',
          autoFillProfileKey: 'registrationNumber',
          required: true
        },
        {
          id: 'document_requested',
          label: 'Document(s) Requested for Withdrawal',
          type: 'select',
          required: true,
          options: [
            'High School / 10th Original Certificate',
            'Senior Secondary / 12th Grade Marksheet',
            'Original Transfer & Migration Certificate',
            'Full Original Admission Dossier (Permanent Withdrawal)'
          ]
        },
        {
          id: 'withdrawal_mode',
          label: 'Type of Withdrawal',
          type: 'select',
          required: true,
          options: ['Temporary Withdrawal (Will Re-Deposit)', 'Permanent Withdrawal (Discontinuation / Graduation)']
        },
        {
          id: 'return_date',
          label: 'Expected Return / Re-Deposit Date (If Temporary)',
          type: 'date',
          required: false
        },
        {
          id: 'purpose',
          label: 'Purpose of Withdrawal',
          type: 'textarea',
          placeholder: 'e.g. Visa interview at Consulate, Passport verification, or Employment background verification...',
          required: true
        }
      ],
      requiredDocuments: [
        {
          id: 'doc-id-proof',
          name: 'Student University Identity Card Copy',
          description: 'Front & back scan of official student photo ID card.',
          required: true,
          acceptedFormats: ['pdf', 'png', 'jpg'],
          maxSizeMB: 4
        },
        {
          id: 'doc-purpose-proof',
          name: 'Verification Call Letter / Visa Appointment Slip',
          description: 'Proof of requirement from embassy, employer, or authority.',
          required: true,
          acceptedFormats: ['pdf', 'png', 'jpg'],
          maxSizeMB: 5
        }
      ],
      declarations: [
        'I hereby undertake to re-deposit the original credentials in the Registrar Office by the stated date if temporary.',
        'I confirm that no university property or library books are outstanding against my name.'
      ],
      feeRules: {
        required: false,
        amount: 0
      }
    },
    documentTemplate: {
      id: 'doc-template-withdrawal',
      version: 1,
      title: 'ORIGINAL CERTIFICATE RELEASE AUTHORIZATION',
      subtitle: 'Office of Academic Records & Registration',
      orientation: 'portrait',
      headerNotice: 'MCS • REGISTRATION DIVISION',
      bodyParagraphs: [
        'Authorization is hereby granted for the release of original educational credentials to student {{student_name}}, bearing Registration No: {{registration_number}}, Department of {{department}}.',
        'Document Released: {{document_requested}}. Nature of Withdrawal: {{withdrawal_mode}}.',
        'Purpose: {{purpose}}.',
        'Academic archive staff are directed to issue the stated documents against the physical signature of the student in the custody ledger.'
      ],
      signatureSlots: [
        {
          id: 'sig-slot-registrar',
          roleTitle: 'University Registrar',
          requiredStaffRole: 'registrar',
          assignedStaffId: 'staff-registrar',
          xPercent: 50,
          yPercent: 78,
          widthPx: 180,
          heightPx: 60,
          showDate: true,
          showPrintedName: true
        }
      ],
      stampSlots: [
        {
          id: 'stamp-slot-registrar',
          title: 'Registrar Official Seal',
          department: 'Office of the University Registrar',
          xPercent: 50,
          yPercent: 72,
          sizePx: 110,
          rotationDeg: -2,
          opacity: 0.9
        }
      ],
      footerNotice: 'Valid for 14 days from issue date. Requires photo identity presentation at Counter 3.',
      includeVerificationQR: true
    },
    workflowDefinition: {
      id: 'wf-withdrawal',
      version: 1,
      stages: [
        {
          id: 'stage-doc-dept-clear',
          order: 1,
          name: 'Department Head No-Dues Clearance',
          assignedDepartment: 'Computer Science & Engineering',
          assignedRole: 'Head of Department',
          assignedStaffId: 'staff-hod',
          allowedActions: ['verify', 'approve', 'reject', 'request_correction'],
          requiresSignature: false,
          requiresStamp: false,
          slaHours: 24,
          escalationPolicy: {
            warning1Hours: 20,
            warning2Hours: 26,
            warning3Hours: 36,
            escalateToAdmin: true
          }
        },
        {
          id: 'stage-doc-registrar-sanction',
          order: 2,
          name: 'Registrar Vault Authorization & Seal',
          assignedDepartment: 'Office of the University Registrar',
          assignedRole: 'University Registrar',
          assignedStaffId: 'staff-registrar',
          allowedActions: ['approve', 'reject', 'sign', 'stamp'],
          requiresSignature: true,
          signatureSlotId: 'sig-slot-registrar',
          requiresStamp: true,
          stampSlotId: 'stamp-slot-registrar',
          slaHours: 48,
          escalationPolicy: {
            warning1Hours: 36,
            warning2Hours: 48,
            warning3Hours: 60,
            escalateToAdmin: true
          }
        }
      ]
    }
  },

  // 4. Library Card Request
  {
    id: 'app-type-library',
    key: 'library-card',
    title: 'Library Card & Access Request',
    description: 'Apply for fresh issue or duplicate replacement of University Central Library RFID borrowing card.',
    category: 'administrative',
    icon: 'BookOpen',
    estimatedDurationDays: 2,
    active: true,
    publishedVersion: 1,
    formConfig: {
      version: 1,
      title: 'Central Library Card Registration',
      description: 'Enables 10 book borrows and online JSTOR / IEEE Xplore digital access.',
      instructions: 'If requesting replacement for lost card, police lost property reference or undertaking is required.',
      fields: [
        {
          id: 'student_name',
          label: 'Student Name',
          type: 'profile_autofill',
          autoFillProfileKey: 'name',
          required: true
        },
        {
          id: 'reg_no',
          label: 'Registration Number',
          type: 'profile_autofill',
          autoFillProfileKey: 'registrationNumber',
          required: true
        },
        {
          id: 'card_type',
          label: 'Application Type',
          type: 'select',
          required: true,
          options: ['New Student Issue', 'Replacement (Lost Card)', 'Replacement (Damaged RFID Chip)']
        },
        {
          id: 'specialization',
          label: 'Primary Research Domain',
          type: 'text',
          placeholder: 'e.g. Distributed Systems, Machine Learning, Power Grids',
          required: true
        }
      ],
      requiredDocuments: [
        {
          id: 'doc-student-photo',
          name: 'Passport Size Photograph',
          description: 'White background formal headshot for RFID card embossing.',
          required: true,
          acceptedFormats: ['png', 'jpg'],
          maxSizeMB: 2
        }
      ],
      declarations: [
        'I agree to abide by the Central Library lending regulations and return all borrowed items on time.',
        'I understand that loss of books requires full replacement or payment of assessed replacement cost.'
      ],
      feeRules: {
        required: true,
        amount: 15,
        feeType: 'RFID Card Issuance Fee',
        instructions: 'Payable via University Billing Portal or receipt upload.'
      }
    },
    documentTemplate: {
      id: 'doc-template-lib',
      version: 1,
      title: 'CENTRAL LIBRARY RFID MEMBERSHIP SANCTION',
      subtitle: 'Information & Digital Resource Services',
      orientation: 'portrait',
      headerNotice: 'MCS • CENTRAL LIBRARY SYSTEM',
      bodyParagraphs: [
        'Membership privileges are hereby activated for student {{student_name}} (Reg: {{registration_number}}), Department of {{department}}.',
        'Category: {{card_type}}. Primary Research Domain: {{specialization}}.',
        'Borrowing limit of 10 monographs and institutional access credentials have been provisioned in the KOHA Library Management System.'
      ],
      signatureSlots: [
        {
          id: 'sig-slot-registrar',
          roleTitle: 'University Registrar',
          requiredStaffRole: 'registrar',
          assignedStaffId: 'staff-registrar',
          xPercent: 50,
          yPercent: 78,
          widthPx: 180,
          heightPx: 60,
          showDate: true,
          showPrintedName: true
        }
      ],
      stampSlots: [
        {
          id: 'stamp-slot-registrar',
          title: 'Registrar Seal',
          department: 'Office of the University Registrar',
          xPercent: 50,
          yPercent: 72,
          sizePx: 110,
          rotationDeg: 5,
          opacity: 0.9
        }
      ],
      footerNotice: 'Collect physical RFID card at Library Helpdesk Counter within 5 working days.',
      includeVerificationQR: true
    },
    workflowDefinition: {
      id: 'wf-library',
      version: 1,
      stages: [
        {
          id: 'stage-lib-finance-verify',
          order: 1,
          name: 'Fee Receipt Verification',
          assignedDepartment: 'Finance & Accounts Office',
          assignedRole: 'Senior Accounts Officer',
          assignedStaffId: 'staff-finance',
          allowedActions: ['verify', 'approve', 'reject'],
          requiresSignature: false,
          requiresStamp: false,
          slaHours: 24,
          escalationPolicy: {
            warning1Hours: 18,
            warning2Hours: 24,
            warning3Hours: 36,
            escalateToAdmin: true
          }
        },
        {
          id: 'stage-lib-registrar',
          order: 2,
          name: 'Registrar Card Sanction & Seal',
          assignedDepartment: 'Office of the University Registrar',
          assignedRole: 'University Registrar',
          assignedStaffId: 'staff-registrar',
          allowedActions: ['approve', 'reject', 'sign', 'stamp'],
          requiresSignature: true,
          signatureSlotId: 'sig-slot-registrar',
          requiresStamp: true,
          stampSlotId: 'stamp-slot-registrar',
          slaHours: 24,
          escalationPolicy: {
            warning1Hours: 20,
            warning2Hours: 28,
            warning3Hours: 36,
            escalateToAdmin: true
          }
        }
      ]
    }
  },

  // 5. Bonafide or Student Status Certificate
  {
    id: 'app-type-bonafide',
    key: 'bonafide-certificate',
    title: 'Bonafide / Student Status Certificate',
    description: 'Procure official verified bonafide certificate for passport applications, education loan sanction, visa, or health insurance.',
    category: 'academic',
    icon: 'GraduationCap',
    estimatedDurationDays: 1,
    active: true,
    publishedVersion: 1,
    formConfig: {
      version: 1,
      title: 'Bonafide Student Certificate Request',
      description: 'Issued by the University Academic Section to attest genuine active student enrolment.',
      instructions: 'Processed within 24 hours. Valid for national and international governmental authorities.',
      fields: [
        {
          id: 'student_name',
          label: 'Student Full Name',
          type: 'profile_autofill',
          autoFillProfileKey: 'name',
          required: true
        },
        {
          id: 'reg_no',
          label: 'Registration Number',
          type: 'profile_autofill',
          autoFillProfileKey: 'registrationNumber',
          required: true
        },
        {
          id: 'purpose',
          label: 'Purpose of Certificate',
          type: 'select',
          required: true,
          options: [
            'National Passport & Visa Application',
            'Bank Education Loan Disbursement',
            'Government Scholarship Verification',
            'Internship / Employment Background Check',
            'Health Insurance Coverage'
          ]
        },
        {
          id: 'authority_name',
          label: 'Name of Requesting Authority / Organization',
          type: 'text',
          placeholder: 'e.g. Regional Passport Office, State Bank of India, or Tech Corp Inc.',
          required: true
        }
      ],
      requiredDocuments: [],
      declarations: [
        'I confirm that I am a bonafide regular student currently enrolled and attending prescribed academic sessions.',
        'I have no pending disciplinary proceedings against me.'
      ],
      feeRules: {
        required: false,
        amount: 0
      }
    },
    documentTemplate: {
      id: 'doc-template-bonafide',
      version: 1,
      title: 'CERTIFICATE OF BONAFIDE STUDENT STATUS',
      subtitle: 'Office of the Registrar • Academic Certification Unit',
      orientation: 'portrait',
      headerNotice: 'MCS • ESTABLISHED BY STATUTORY CHARTER',
      bodyParagraphs: [
        'TO WHOMSOEVER IT MAY CONCERN',
        'This is to certify that {{student_name}}, bearing University Registration Number {{registration_number}}, is a bonafide, full-time regular student of MCS, enrolled in the Department of {{department}}.',
        'According to university academic records, the student maintains good standing with satisfactory attendance and exemplary conduct.',
        'This certificate is formally issued at the request of the student for presentation to {{authority_name}} for the explicit purpose of {{purpose}}.'
      ],
      signatureSlots: [
        {
          id: 'sig-slot-registrar',
          roleTitle: 'University Registrar',
          requiredStaffRole: 'registrar',
          assignedStaffId: 'staff-registrar',
          xPercent: 50,
          yPercent: 78,
          widthPx: 180,
          heightPx: 60,
          showDate: true,
          showPrintedName: true
        }
      ],
      stampSlots: [
        {
          id: 'stamp-slot-registrar',
          title: 'Registrar Seal',
          department: 'Office of the University Registrar',
          xPercent: 50,
          yPercent: 72,
          sizePx: 110,
          rotationDeg: -3,
          opacity: 0.9
        }
      ],
      footerNotice: 'Digitally verified document. Authenticity can be confirmed online at university portal using the QR Code or Reference Number.',
      includeVerificationQR: true
    },
    workflowDefinition: {
      id: 'wf-bonafide',
      version: 1,
      stages: [
        {
          id: 'stage-bonafide-verify',
          order: 1,
          name: 'Academic Records Verification',
          assignedDepartment: 'Academic Affairs Directorate',
          assignedRole: 'Faculty Advisor',
          assignedStaffId: 'staff-faculty',
          allowedActions: ['verify', 'approve', 'reject'],
          requiresSignature: false,
          requiresStamp: false,
          slaHours: 12,
          escalationPolicy: {
            warning1Hours: 8,
            warning2Hours: 12,
            warning3Hours: 18,
            escalateToAdmin: true
          }
        },
        {
          id: 'stage-bonafide-registrar',
          order: 2,
          name: 'Registrar Signature & Seal Issuance',
          assignedDepartment: 'Office of the University Registrar',
          assignedRole: 'University Registrar',
          assignedStaffId: 'staff-registrar',
          allowedActions: ['approve', 'reject', 'sign', 'stamp'],
          requiresSignature: true,
          signatureSlotId: 'sig-slot-registrar',
          requiresStamp: true,
          stampSlotId: 'stamp-slot-registrar',
          slaHours: 12,
          escalationPolicy: {
            warning1Hours: 10,
            warning2Hours: 14,
            warning3Hours: 20,
            escalateToAdmin: true
          }
        }
      ]
    }
  },

  // 6. Fee-Related Request
  {
    id: 'app-type-fee',
    key: 'fee-request',
    title: 'Fee-Related Request & Installment Plan',
    description: 'Apply for semester fee installment payment, fine waiver review, or scholarship receipt adjustment.',
    category: 'financial',
    icon: 'ReceiptText',
    estimatedDurationDays: 4,
    active: true,
    publishedVersion: 1,
    formConfig: {
      version: 1,
      title: 'Fee Concession & Installment Plan Application',
      description: 'Submit formal appeal for staggered semester tuition payment or delayed penalty fee review.',
      instructions: 'Requires documentation of genuine financial hardship or pending scholarship disbursement.',
      fields: [
        {
          id: 'student_name',
          label: 'Student Name',
          type: 'profile_autofill',
          autoFillProfileKey: 'name',
          required: true
        },
        {
          id: 'reg_no',
          label: 'Registration Number',
          type: 'profile_autofill',
          autoFillProfileKey: 'registrationNumber',
          required: true
        },
        {
          id: 'request_type',
          label: 'Request Nature',
          type: 'select',
          required: true,
          options: ['Tuition Fee Installment (Split into 2 parts)', 'Late Fee Fine Waiver', 'External Scholarship Credit Adjustment']
        },
        {
          id: 'amount_involved',
          label: 'Total Fee Amount ($ USD)',
          type: 'number',
          placeholder: 'e.g. 4500',
          required: true
        },
        {
          id: 'reason',
          label: 'Financial Justification',
          type: 'textarea',
          placeholder: 'State the circumstances requiring staggered payment...',
          required: true
        }
      ],
      requiredDocuments: [
        {
          id: 'doc-income-proof',
          name: 'Supporting Financial Statement / Bank Slip',
          description: 'Document substantiating hardship or scholarship sanction letter.',
          required: true,
          acceptedFormats: ['pdf', 'png', 'jpg'],
          maxSizeMB: 5
        }
      ],
      declarations: [
        'I solemnly undertake to pay the agreed installments on or before the committed calendar deadlines.',
        'I understand that failure to pay will result in registration withholding for end-semester examinations.'
      ],
      feeRules: {
        required: false,
        amount: 0
      }
    },
    documentTemplate: {
      id: 'doc-template-fee',
      version: 1,
      title: 'FEE CONCESSION & INSTALLMENT APPROVAL ORDER',
      subtitle: 'Finance & Accounts Standing Committee',
      orientation: 'portrait',
      headerNotice: 'MCS • DIVISION OF FINANCE',
      bodyParagraphs: [
        'The Finance and Accounts Standing Committee has reviewed the application submitted by {{student_name}} (Reg: {{registration_number}}).',
        'Sanction is hereby accorded for: {{request_type}} in relation to the amount of ${{amount_involved}}.',
        'Justification provided: {{reason}}. The student billing ledger has been updated to reflect the restructured payment schedule.'
      ],
      signatureSlots: [
        {
          id: 'sig-slot-finance',
          roleTitle: 'Senior Accounts Officer',
          requiredStaffRole: 'finance',
          assignedStaffId: 'staff-finance',
          xPercent: 50,
          yPercent: 78,
          widthPx: 180,
          heightPx: 60,
          showDate: true,
          showPrintedName: true
        }
      ],
      stampSlots: [
        {
          id: 'stamp-slot-finance',
          title: 'Finance Office Seal',
          department: 'Finance & Accounts Office',
          xPercent: 50,
          yPercent: 72,
          sizePx: 110,
          rotationDeg: 0,
          opacity: 0.88
        }
      ],
      footerNotice: 'A copy has been transmitted to Central Cashier Desk.',
      includeVerificationQR: true
    },
    workflowDefinition: {
      id: 'wf-fee',
      version: 1,
      stages: [
        {
          id: 'stage-fee-hod',
          order: 1,
          name: 'Department Head Endorsement',
          assignedDepartment: 'Computer Science & Engineering',
          assignedRole: 'Head of Department',
          assignedStaffId: 'staff-hod',
          allowedActions: ['verify', 'approve', 'reject'],
          requiresSignature: false,
          requiresStamp: false,
          slaHours: 24,
          escalationPolicy: {
            warning1Hours: 18,
            warning2Hours: 24,
            warning3Hours: 36,
            escalateToAdmin: true
          }
        },
        {
          id: 'stage-fee-finance',
          order: 2,
          name: 'Finance Officer Sanction & Seal',
          assignedDepartment: 'Finance & Accounts Office',
          assignedRole: 'Senior Accounts Officer',
          assignedStaffId: 'staff-finance',
          allowedActions: ['approve', 'reject', 'sign', 'stamp'],
          requiresSignature: true,
          signatureSlotId: 'sig-slot-finance',
          requiresStamp: true,
          stampSlotId: 'stamp-slot-finance',
          slaHours: 48,
          escalationPolicy: {
            warning1Hours: 36,
            warning2Hours: 48,
            warning3Hours: 72,
            escalateToAdmin: true
          }
        }
      ]
    }
  },

  // 7. General Administrative Request
  {
    id: 'app-type-general',
    key: 'general-request',
    title: 'General Administrative Request',
    description: 'Submit custom university requests including elective course changes, lab equipment access, locker allocations, or special approvals.',
    category: 'administrative',
    icon: 'FileText',
    estimatedDurationDays: 3,
    active: true,
    publishedVersion: 1,
    formConfig: {
      version: 1,
      title: 'General Administrative Application',
      description: 'Used for miscellaneous university academic or facility authorizations.',
      instructions: 'Please be precise and upload relevant supporting documents.',
      fields: [
        {
          id: 'student_name',
          label: 'Student Name',
          type: 'profile_autofill',
          autoFillProfileKey: 'name',
          required: true
        },
        {
          id: 'reg_no',
          label: 'Registration Number',
          type: 'profile_autofill',
          autoFillProfileKey: 'registrationNumber',
          required: true
        },
        {
          id: 'subject',
          label: 'Application Subject / Request Title',
          type: 'text',
          placeholder: 'e.g. Permission for After-Hours Lab Access or Elective Change',
          required: true
        },
        {
          id: 'target_department',
          label: 'Concerned Department / Section',
          type: 'select',
          required: true,
          options: [
            'Computer Science & Engineering',
            'Electrical Engineering',
            'Student Affairs & Hostels',
            'Academic Affairs Directorate',
            'Office of the University Registrar'
          ]
        },
        {
          id: 'details',
          label: 'Full Details of Request',
          type: 'textarea',
          placeholder: 'Provide comprehensive description of the request and necessity...',
          required: true
        }
      ],
      requiredDocuments: [
        {
          id: 'doc-general-attachment',
          name: 'Supporting Attachment (Optional)',
          description: 'Any relevant letter, project proposal, or supervisor consent.',
          required: false,
          acceptedFormats: ['pdf', 'png', 'jpg'],
          maxSizeMB: 5
        }
      ],
      declarations: [
        'I declare that the details furnished are true and made in good faith.'
      ],
      feeRules: {
        required: false,
        amount: 0
      }
    },
    documentTemplate: {
      id: 'doc-template-general',
      version: 1,
      title: 'ADMINISTRATIVE SANCTION MEMORANDUM',
      subtitle: 'Office of Administrative Services',
      orientation: 'portrait',
      headerNotice: 'MCS • CENTRAL ADMINISTRATION',
      bodyParagraphs: [
        'Reference: {{reference_number}}.',
        'Student {{student_name}} (Reg: {{registration_number}}) from the Department of {{department}} has submitted a petition regarding: {{subject}}.',
        'Request Details: {{details}}.',
        'Upon administrative appraisal, sanction is hereby granted subject to compliance with institutional safety and academic codes.'
      ],
      signatureSlots: [
        {
          id: 'sig-slot-hod',
          roleTitle: 'Head of Department',
          requiredStaffRole: 'hod',
          assignedStaffId: 'staff-hod',
          xPercent: 50,
          yPercent: 78,
          widthPx: 180,
          heightPx: 60,
          showDate: true,
          showPrintedName: true
        }
      ],
      stampSlots: [
        {
          id: 'stamp-slot-cs',
          title: 'Department Stamp',
          department: 'Computer Science & Engineering',
          xPercent: 50,
          yPercent: 72,
          sizePx: 110,
          rotationDeg: -4,
          opacity: 0.88
        }
      ],
      footerNotice: 'University Records Office Archives copy.',
      includeVerificationQR: true
    },
    workflowDefinition: {
      id: 'wf-general',
      version: 1,
      stages: [
        {
          id: 'stage-gen-hod',
          order: 1,
          name: 'Department Review & Sanction',
          assignedDepartment: 'Computer Science & Engineering',
          assignedRole: 'Head of Department',
          assignedStaffId: 'staff-hod',
          allowedActions: ['verify', 'approve', 'reject', 'sign', 'stamp'],
          requiresSignature: true,
          signatureSlotId: 'sig-slot-hod',
          requiresStamp: true,
          stampSlotId: 'stamp-slot-cs',
          slaHours: 48,
          escalationPolicy: {
            warning1Hours: 36,
            warning2Hours: 48,
            warning3Hours: 72,
            escalateToAdmin: true
          }
        }
      ]
    }
  }
];

// Seed Applications demonstrating different realistic states:
// 1. Fully completed leave application with transparent signatures and official stamps
// 2. Currently under review by Faculty Advisor
// 3. Overdue application with SLA Warning
// 4. Bonafide certificate application ready for student download
export const INITIAL_APPLICATIONS: Application[] = [
  {
    id: 'app-001',
    referenceNumber: 'APP-2026-LV-0194',
    applicationTypeId: 'app-type-leave',
    applicationTypeTitle: 'Leave Application',
    templateVersion: 1,
    studentId: 'student-1',
    studentSnapshot: {
      name: 'Sarah Jenkins',
      registrationNumber: '2024-CS-104',
      email: 'sarah.jenkins@university.edu',
      department: 'Computer Science & Engineering',
      phone: '+1 (555) 234-8901'
    },
    status: 'completed',
    currentStageId: 'stage-warden-endorse',
    currentStageIndex: 2,
    formData: {
      student_name: 'Sarah Jenkins',
      reg_no: '2024-CS-104',
      leave_type: 'Family / Personal Emergency',
      start_date: '2026-10-28',
      end_date: '2026-11-02',
      destination: 'Family Residence, Seattle, WA',
      reason: 'Attending elder sister wedding ceremony and family reunion. Prior arrangements made with course coordinators.',
      is_hostel_resident: 'Yes',
      parent_phone: '+1 (555) 998-1122'
    },
    uploadedDocuments: [
      {
        id: 'doc-upload-1',
        requirementId: 'doc-medical-proof',
        requirementName: 'Medical Certificate or Invitation Letter',
        fileName: 'Wedding_Invitation_Card.pdf',
        fileDataUrl: 'data:application/pdf;base64,JVBERi0xLjMKJbrfrOAKMyAwIG9iago8PC9UeXBlIC9QYWdlCi9QYXJlbnQgMSAwIFIKL1Jlc291cmNlcyAyIDAgUgovTWVkaWFCb3ggWzAgMCA1OTUuMjc5OTk5OTk5OTk5OTcyNyA4NDEuODg5OTk5OTk5OTk5OTg2NF0KL0NvbnRlbnRzIDQgMCBSCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9MZW5ndGggOTIyCj4+CnN0cmVhbQowLjU2NzAwMDAwMDAwMDAwMDEgdwowIEcKQlQKL0YyIDE2IFRmCjE4LjM5OTk5OTk5OTk5OTk5ODYgVEwKMCBnCjU2LjY5MjkxMzM4NTgyNjc3NzUgNzYyLjUxOTkyMTI1OTg0MjQ3NjUgVGQKKEFQRVggU1RBVEUgVU5JVkVSU0lUWSkgVGoKRVQKQlQKL0YxIDExIFRmCjEyLjY0OTk5OTk5OTk5OTk5ODYgVEwKMCBnCjU2LjY5MjkxMzM4NTgyNjc3NzUgNzM0LjE3MzQ2NDU2NjkyOTE2OTUgVGQKKFN1cHBvcnRpbmcgZG9jdW1lbnQglyBzYW1wbGUgcmVjb3JkKSBUagpFVAowLjcxIEcKNTYuNjkyOTEzMzg1ODI2Nzc3NSA3MTcuMTY1NTkwNTUxMTgxMDI2MSBtCjUzOC41ODI2NzcxNjUzNTQ0MjU2IDcxNy4xNjU1OTA1NTExODEwMjYxIGwKUwpCVAovRjEgOSBUZgoxMC4zNDk5OTk5OTk5OTk5OTk2IFRMCjAgZwo1Ni42OTI5MTMzODU4MjY3Nzc1IDY4My4xNDk4NDI1MTk2ODUwODAzIFRkCihUaGlzIGRvY3VtZW50IGlzIHBhcnQgb2YgdGhlIGRlbW9uc3RyYXRpb24gZGF0YXNldC4pIFRqCkVUCkJUCi9GMSA5IFRmCjEwLjM0OTk5OTk5OTk5OTk5OTYgVEwKMCBnCjU2LjY5MjkxMzM4NTgyNjc3NzUgNjYwLjQ3MjY3NzE2NTM1NDI5ODMgVGQKKFN0dWRlbnQ6IFNhcmFoIEplbmtpbnMgICAgUmVnaXN0cmF0aW9uOiAyMDI0LUNTLTEwNCkgVGoKRVQKQlQKL0YxIDkgVGYKMTAuMzQ5OTk5OTk5OTk5OTk5NiBUTAowIGcKNTYuNjkyOTEzMzg1ODI2Nzc3NSA2MzcuNzk1NTExODExMDIzNTE2MiBUZAooVXBsb2FkZWQgd2l0aCBhbiBhcHBsaWNhdGlvbiBwcm9jZXNzZWQgYnkgdGhlIHJlY29yZHMgb2ZmaWNlLikgVGoKRVQKQlQKL0YxIDggVGYKOS4xOTk5OTk5OTk5OTk5OTkzIFRMCjAgZwo1Ni42OTI5MTMzODU4MjY3Nzc1IDM0LjAxNTk4NDI1MTk2ODQ2MTYgVGQKKFJlZjogc2FtcGxlLXN1cHBvcnRpbmctZG9jdW1lbnQpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKMSAwIG9iago8PC9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFIgXQovQ291bnQgMQo+PgplbmRvYmoKNSAwIG9iago8PAovVHlwZSAvRm9udAovQmFzZUZvbnQgL0hlbHZldGljYQovU3VidHlwZSAvVHlwZTEKL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcKL0ZpcnN0Q2hhciAzMgovTGFzdENoYXIgMjU1Cj4+CmVuZG9iago2IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9CYXNlRm9udCAvSGVsdmV0aWNhLUJvbGQKL1N1YnR5cGUgL1R5cGUxCi9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nCi9GaXJzdENoYXIgMzIKL0xhc3RDaGFyIDI1NQo+PgplbmRvYmoKNyAwIG9iago8PAovVHlwZSAvRm9udAovQmFzZUZvbnQgL0hlbHZldGljYS1PYmxpcXVlCi9TdWJ0eXBlIC9UeXBlMQovRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZwovRmlyc3RDaGFyIDMyCi9MYXN0Q2hhciAyNTUKPj4KZW5kb2JqCjggMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL0Jhc2VGb250IC9IZWx2ZXRpY2EtQm9sZE9ibGlxdWUKL1N1YnR5cGUgL1R5cGUxCi9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nCi9GaXJzdENoYXIgMzIKL0xhc3RDaGFyIDI1NQo+PgplbmRvYmoKOSAwIG9iago8PAovVHlwZSAvRm9udAovQmFzZUZvbnQgL0NvdXJpZXIKL1N1YnR5cGUgL1R5cGUxCi9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nCi9GaXJzdENoYXIgMzIKL0xhc3RDaGFyIDI1NQo+PgplbmRvYmoKMTAgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL0Jhc2VGb250IC9Db3VyaWVyLUJvbGQKL1N1YnR5cGUgL1R5cGUxCi9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nCi9GaXJzdENoYXIgMzIKL0xhc3RDaGFyIDI1NQo+PgplbmRvYmoKMTEgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL0Jhc2VGb250IC9Db3VyaWVyLU9ibGlxdWUKL1N1YnR5cGUgL1R5cGUxCi9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nCi9GaXJzdENoYXIgMzIKL0xhc3RDaGFyIDI1NQo+PgplbmRvYmoKMTIgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL0Jhc2VGb250IC9Db3VyaWVyLUJvbGRPYmxpcXVlCi9TdWJ0eXBlIC9UeXBlMQovRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZwovRmlyc3RDaGFyIDMyCi9MYXN0Q2hhciAyNTUKPj4KZW5kb2JqCjEzIDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9CYXNlRm9udCAvVGltZXMtUm9tYW4KL1N1YnR5cGUgL1R5cGUxCi9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nCi9GaXJzdENoYXIgMzIKL0xhc3RDaGFyIDI1NQo+PgplbmRvYmoKMTQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL0Jhc2VGb250IC9UaW1lcy1Cb2xkCi9TdWJ0eXBlIC9UeXBlMQovRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZwovRmlyc3RDaGFyIDMyCi9MYXN0Q2hhciAyNTUKPj4KZW5kb2JqCjE1IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9CYXNlRm9udCAvVGltZXMtSXRhbGljCi9TdWJ0eXBlIC9UeXBlMQovRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZwovRmlyc3RDaGFyIDMyCi9MYXN0Q2hhciAyNTUKPj4KZW5kb2JqCjE2IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9CYXNlRm9udCAvVGltZXMtQm9sZEl0YWxpYwovU3VidHlwZSAvVHlwZTEKL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcKL0ZpcnN0Q2hhciAzMgovTGFzdENoYXIgMjU1Cj4+CmVuZG9iagoxNyAwIG9iago8PAovVHlwZSAvRm9udAovQmFzZUZvbnQgL1phcGZEaW5nYmF0cwovU3VidHlwZSAvVHlwZTEKL0ZpcnN0Q2hhciAzMgovTGFzdENoYXIgMjU1Cj4+CmVuZG9iagoxOCAwIG9iago8PAovVHlwZSAvRm9udAovQmFzZUZvbnQgL1N5bWJvbAovU3VidHlwZSAvVHlwZTEKL0ZpcnN0Q2hhciAzMgovTGFzdENoYXIgMjU1Cj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9Qcm9jU2V0IFsvUERGIC9UZXh0IC9JbWFnZUIgL0ltYWdlQyAvSW1hZ2VJXQovRm9udCA8PAovRjEgNSAwIFIKL0YyIDYgMCBSCi9GMyA3IDAgUgovRjQgOCAwIFIKL0Y1IDkgMCBSCi9GNiAxMCAwIFIKL0Y3IDExIDAgUgovRjggMTIgMCBSCi9GOSAxMyAwIFIKL0YxMCAxNCAwIFIKL0YxMSAxNSAwIFIKL0YxMiAxNiAwIFIKL0YxMyAxNyAwIFIKL0YxNCAxOCAwIFIKPj4KL1hPYmplY3QgPDwKPj4KPj4KZW5kb2JqCjE5IDAgb2JqCjw8Ci9Qcm9kdWNlciAoanNQREYgNC4yLjEpCi9DcmVhdGlvbkRhdGUgKEQ6MjAyNjEwMjUxNDEzMjcrMDUnMDAnKQo+PgplbmRvYmoKMjAgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDEgMCBSCi9PcGVuQWN0aW9uIFszIDAgUiAvRml0SCBudWxsXQovUGFnZUxheW91dCAvT25lQ29sdW1uCj4+CmVuZG9iagp4cmVmCjAgMjEKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAxMTI1IDAwMDAwIG4gCjAwMDAwMDI5NDIgMDAwMDAgbiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMTUyIDAwMDAwIG4gCjAwMDAwMDExODIgMDAwMDAgbiAKMDAwMDAwMTMwNyAwMDAwMCBuIAowMDAwMDAxNDM3IDAwMDAwIG4gCjAwMDAwMDE1NzAgMDAwMDAgbiAKMDAwMDAwMTcwNyAwMDAwMCBuIAowMDAwMDAxODMwIDAwMDAwIG4gCjAwMDAwMDE5NTkgMDAwMDAgbiAKMDAwMDAwMjA5MSAwMDAwMCBuIAowMDAwMDAyMjI3IDAwMDAwIG4gCjAwMDAwMDIzNTUgMDAwMDAgbiAKMDAwMDAwMjQ4MiAwMDAwMCBuIAowMDAwMDAyNjExIDAwMDAwIG4gCjAwMDAwMDI3NDQgMDAwMDAgbiAKMDAwMDAwMjg0NiAwMDAwMCBuIAowMDAwMDAzMTkwIDAwMDAwIG4gCjAwMDAwMDMyNzYgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSAyMQovUm9vdCAyMCAwIFIKL0luZm8gMTkgMCBSCi9JRCBbIDw2MUM4Mjg1REREQjA2Q0NGNEI4NEU4QThENzVDMjU2Rj4gPDYxQzgyODVERERCMDZDQ0Y0Qjg0RThBOEQ3NUMyNTZGPiBdCj4+CnN0YXJ0eHJlZgozMzgwCiUlRU9G',
        fileSize: 420000,
        fileType: 'application/pdf',
        uploadedAt: '2026-10-22T09:15:00Z',
        status: 'verified',
        verifiedBy: 'Dr. Robert Vance',
        verifiedAt: '2026-10-22T11:30:00Z'
      }
    ],
    stageInstances: [
      {
        stageId: 'stage-faculty-review',
        name: 'Faculty Advisor Verification',
        assignedDepartment: 'Computer Science & Engineering',
        assignedRole: 'Faculty Advisor',
        assignedStaffId: 'staff-faculty',
        assignedStaffName: 'Dr. Robert Vance',
        status: 'completed',
        startedAt: '2026-10-22T09:15:00Z',
        completedAt: '2026-10-22T11:30:00Z',
        deadline: '2026-10-23T09:15:00Z',
        warningCount: 0,
        decisionNotes: 'Academic standing is strong (CGPA 3.84). Coursework coverage plan reviewed and satisfactory.',
        actionTakenBy: 'Dr. Robert Vance',
        slaHours: 24
      },
      {
        stageId: 'stage-hod-approval',
        name: 'HOD Clearance & Signature',
        assignedDepartment: 'Computer Science & Engineering',
        assignedRole: 'Head of Department',
        assignedStaffId: 'staff-hod',
        assignedStaffName: 'Prof. Eleanor Wright',
        status: 'completed',
        startedAt: '2026-10-22T11:30:00Z',
        completedAt: '2026-10-22T14:45:00Z',
        deadline: '2026-10-23T11:30:00Z',
        warningCount: 0,
        decisionNotes: 'Department clearance granted. Approved for 5 days of sanctioned leave.',
        actionTakenBy: 'Prof. Eleanor Wright',
        signatureApplied: true,
        signatureAssetUrl: INITIAL_SIGNATURES[1].imageUrl,
        stampApplied: true,
        stampAssetUrl: INITIAL_STAMPS[1].imageUrl,
        slaHours: 24
      },
      {
        stageId: 'stage-warden-endorse',
        name: 'Hostel Warden Sanction & Out-Pass',
        assignedDepartment: 'Student Affairs & Hostels',
        assignedRole: 'Chief Hostel Warden',
        assignedStaffId: 'staff-warden',
        assignedStaffName: 'Col. Arvind Sharma',
        status: 'completed',
        startedAt: '2026-10-22T14:45:00Z',
        completedAt: '2026-10-22T16:20:00Z',
        deadline: '2026-10-23T14:45:00Z',
        warningCount: 0,
        decisionNotes: 'Hostel out-pass registered in residential gate log. Parent telephone confirmation verified.',
        actionTakenBy: 'Col. Arvind Sharma',
        signatureApplied: true,
        signatureAssetUrl: INITIAL_SIGNATURES[2].imageUrl,
        stampApplied: true,
        stampAssetUrl: INITIAL_STAMPS[2].imageUrl,
        slaHours: 16
      }
    ],
    timeline: [
      {
        id: 'tl-1',
        timestamp: '2026-10-22T09:15:00Z',
        stageName: 'Student Submission',
        title: 'Application Formally Submitted',
        description: 'Student completed leave form, agreed to declarations, and uploaded supporting evidence.',
        actorName: 'Sarah Jenkins',
        actorRole: 'student',
        type: 'submission'
      },
      {
        id: 'tl-2',
        timestamp: '2026-10-22T11:30:00Z',
        stageName: 'Faculty Advisor Verification',
        title: 'Verified & Recommended',
        description: 'Dr. Robert Vance verified student academic record and recommended leave clearance.',
        actorName: 'Dr. Robert Vance',
        actorRole: 'Faculty Advisor',
        type: 'verification'
      },
      {
        id: 'tl-3',
        timestamp: '2026-10-22T14:45:00Z',
        stageName: 'HOD Clearance & Signature',
        title: 'Approved with Signature & Seal',
        description: 'Prof. Eleanor Wright applied authorized digital signature and department seal.',
        actorName: 'Prof. Eleanor Wright',
        actorRole: 'Head of Department',
        type: 'signature'
      },
      {
        id: 'tl-4',
        timestamp: '2026-10-22T16:20:00Z',
        stageName: 'Hostel Warden Sanction',
        title: 'Final Clearance Endorsed & Issued',
        description: 'Col. Arvind Sharma approved out-pass. Official Leave Sanction Order generated with verification QR code.',
        actorName: 'Col. Arvind Sharma',
        actorRole: 'Chief Hostel Warden',
        type: 'issuance'
      }
    ],
    issuedDocument: {
      id: 'doc-issue-001',
      documentNumber: 'SANCTION-2026-CSE-0194',
      referenceNumber: 'APP-2026-LV-0194',
      generatedAt: '2026-10-22T16:20:00Z',
      verificationCode: 'ASU-VRF-889104-LV',
      documentHash: 'c74fae98129bb8041d8e90145efb7720914619d8011234fa8892147bbcd88219',
      appliedSignatures: [
        {
          slotId: 'sig-slot-hod',
          staffName: 'Prof. Eleanor Wright',
          roleTitle: 'Head of Department',
          timestamp: '2026-10-22T14:45:00Z',
          signatureUrl: INITIAL_SIGNATURES[1].imageUrl
        },
        {
          slotId: 'sig-slot-warden',
          staffName: 'Col. Arvind Sharma',
          roleTitle: 'Chief Hostel Warden',
          timestamp: '2026-10-22T16:20:00Z',
          signatureUrl: INITIAL_SIGNATURES[2].imageUrl
        }
      ],
      appliedStamps: [
        {
          slotId: 'stamp-slot-cs',
          stampName: 'Department of Computer Science Seal',
          timestamp: '2026-10-22T14:45:00Z',
          stampUrl: INITIAL_STAMPS[1].imageUrl
        },
        {
          slotId: 'stamp-slot-hostel',
          stampName: 'Hostel Clearance Seal',
          timestamp: '2026-10-22T16:20:00Z',
          stampUrl: INITIAL_STAMPS[2].imageUrl
        }
      ]
    },
    createdAt: '2026-10-22T09:15:00Z',
    updatedAt: '2026-10-22T16:20:00Z',
    submissionDate: '2026-10-22T09:15:00Z',
    estimatedCompletionDate: '2026-10-24T17:00:00Z',
    targetDeadline: '2026-10-24T17:00:00Z'
  },

  // 2. Pending Application: Document Withdrawal (Under HOD Review)
  {
    id: 'app-002',
    referenceNumber: 'APP-2026-WD-0842',
    applicationTypeId: 'app-type-doc-withdrawal',
    applicationTypeTitle: 'Document Withdrawal or Collection',
    templateVersion: 1,
    studentId: 'student-1',
    studentSnapshot: {
      name: 'Sarah Jenkins',
      registrationNumber: '2024-CS-104',
      email: 'sarah.jenkins@university.edu',
      department: 'Computer Science & Engineering',
      phone: '+1 (555) 234-8901'
    },
    status: 'pending_approval',
    currentStageId: 'stage-doc-dept-clear',
    currentStageIndex: 0,
    formData: {
      student_name: 'Sarah Jenkins',
      reg_no: '2024-CS-104',
      document_requested: 'Senior Secondary / 12th Grade Marksheet',
      withdrawal_mode: 'Temporary Withdrawal (Will Re-Deposit)',
      return_date: '2026-11-15',
      purpose: 'Verification requirement for US Consulate F-1 visa appointment at Embassy in downtown.'
    },
    uploadedDocuments: [
      {
        id: 'doc-upload-id',
        requirementId: 'doc-id-proof',
        requirementName: 'Student University Identity Card Copy',
        fileName: 'Sarah_Jenkins_StudentID.png',
        fileDataUrl: 'data:image/png;base64,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VX6gtv7avZZY/PObDui7wvJLF0Vx0lHf3fX7IzYdsNZC3bt9YfHPnXni0P0OH9mta5eGhvpzTz64gzOuuvLy857x2EM/+KbXqcd874gTf3b+L68riuKsEw+oOmvD9Xs3NTXOnDWrdt6vb7b+yIuuaf3GWHvXL4qix0rLTZz0/GKfX/RD9wIAdERdqVQq5ofmxz/Imn59qlMDAOBTXRqd7iNCAID/NIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIKwzBtaTTz934PBT9j98xAHDT371tTc+5tU2336fyKr+3et0ZHzlmGeff+F3N44qPj1SNxYAPnmNRedz0hk/O/e0o7+41BJ33PPAuT+/4ifHH1Z0Aiuv+OWVV/zy/F4FAHQKnTGw3nx78sz3ZhVFselG6y+++Oeeff6FU8++ZMq707657cAhO29XfnYycJP+Dz82ca/ddhg3/snHJjy1247btL6143Zbjn/i6bqibsTRBy67zBfL15w8ZerICy574823Z81qOXTonr1X69E63ebb73PXHy+vet3edd548+0RZ1w8ffqM7t27nXDk0HcmT6lc25tvvXPKmT+f/O7U5Zddur15a8fUrqS9DVbditZLLfulpUY/MO72G341721usUm/Xj1W2vbrm1aNefudKaee9Yt3przb1Nh48rEHl+aUKve4xBcWaz130BYbtbd4APg0Kc0nD4x/ofzvk5/6xj/fOehb3xtxxs8efPTxUql02tmXPPLXie9MnrLVzt8vDxgwaMj4iZNefvX19Qfu8vgTT7/0ymv/762thvzljtGlUunmUfcc8eMzSqXSZoP3LpVKJ428ePzESaVS6eVXX//OfsMqpysPqHrd3nWOPeW8m0fd/f7xu4879fyqtf34tPP/dOs9pVLpznubBwwa0ua8tWPamL2dDX6E6VoN2GrImOZxbY45/icX3nL7faVS6Q9/vuO0sy+p2mPlufNYPAB8WkqjVCp1xidY22+9+WZf3eCu0c1nXXj5Fpv0O2T/Pf5y55h7739k6tRp5QF19XVr9Fql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IExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAECYwAIACBNYAAACCwBgweYJFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFACCwAAAWbJ5gAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAAILAGDB5gkWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAAAEFgDAgs0TLACAMIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAAILAGDB5gkWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIExgAQCENRbzW/PjL87vJQAAJHmCBQAQJrAAAMLqSqVS+poAAJ2aJ1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAIDAAgBYsHmCBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILACBMYAEAhAksAIAwgQUAECawAADCBBYAQJjAAgAIE1gAAGECCwAgTGABAIQJLACAMIEFABAmsAAAwgQWAECYwAIACBNYAABhAgsAIExgAQCECSwAgDCBBQAQJrAAAMIEFgBAmMACAAgTWAAAYQILAKDI+l82LAkxWPYT7gAAAABJRU5ErkJggg==',
        fileSize: 280000,
        fileType: 'image/png',
        uploadedAt: '2026-10-24T10:00:00Z',
        status: 'pending'
      },
      {
        id: 'doc-upload-embassy',
        requirementId: 'doc-purpose-proof',
        requirementName: 'Verification Call Letter / Visa Appointment Slip',
        fileName: 'US_Consulate_Visa_Appointment.pdf',
        fileDataUrl: 'data:application/pdf;base64,JVBERi0xLjMKJbrfrOAKMyAwIG9iago8PC9UeXBlIC9QYWdlCi9QYXJlbnQgMSAwIFIKL1Jlc291cmNlcyAyIDAgUgovTWVkaWFCb3ggWzAgMCA1OTUuMjc5OTk5OTk5OTk5OTcyNyA4NDEuODg5OTk5OTk5OTk5OTg2NF0KL0NvbnRlbnRzIDQgMCBSCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9MZW5ndGggOTIyCj4+CnN0cmVhbQowLjU2NzAwMDAwMDAwMDAwMDEgdwowIEcKQlQKL0YyIDE2IFRmCjE4LjM5OTk5OTk5OTk5OTk5ODYgVEwKMCBnCjU2LjY5MjkxMzM4NTgyNjc3NzUgNzYyLjUxOTkyMTI1OTg0MjQ3NjUgVGQKKEFQRVggU1RBVEUgVU5JVkVSU0lUWSkgVGoKRVQKQlQKL0YxIDExIFRmCjEyLjY0OTk5OTk5OTk5OTk5ODYgVEwKMCBnCjU2LjY5MjkxMzM4NTgyNjc3NzUgNzM0LjE3MzQ2NDU2NjkyOTE2OTUgVGQKKFN1cHBvcnRpbmcgZG9jdW1lbnQglyBzYW1wbGUgcmVjb3JkKSBUagpFVAowLjcxIEcKNTYuNjkyOTEzMzg1ODI2Nzc3NSA3MTcuMTY1NTkwNTUxMTgxMDI2MSBtCjUzOC41ODI2NzcxNjUzNTQ0MjU2IDcxNy4xNjU1OTA1NTExODEwMjYxIGwKUwpCVAovRjEgOSBUZgoxMC4zNDk5OTk5OTk5OTk5OTk2IFRMCjAgZwo1Ni42OTI5MTMzODU4MjY3Nzc1IDY4My4xNDk4NDI1MTk2ODUwODAzIFRkCihUaGlzIGRvY3VtZW50IGlzIHBhcnQgb2YgdGhlIGRlbW9uc3RyYXRpb24gZGF0YXNldC4pIFRqCkVUCkJUCi9GMSA5IFRmCjEwLjM0OTk5OTk5OTk5OTk5OTYgVEwKMCBnCjU2LjY5MjkxMzM4NTgyNjc3NzUgNjYwLjQ3MjY3NzE2NTM1NDI5ODMgVGQKKFN0dWRlbnQ6IFNhcmFoIEplbmtpbnMgICAgUmVnaXN0cmF0aW9uOiAyMDI0LUNTLTEwNCkgVGoKRVQKQlQKL0YxIDkgVGYKMTAuMzQ5OTk5OTk5OTk5OTk5NiBUTAowIGcKNTYuNjkyOTEzMzg1ODI2Nzc3NSA2MzcuNzk1NTExODExMDIzNTE2MiBUZAooVXBsb2FkZWQgd2l0aCBhbiBhcHBsaWNhdGlvbiBwcm9jZXNzZWQgYnkgdGhlIHJlY29yZHMgb2ZmaWNlLikgVGoKRVQKQlQKL0YxIDggVGYKOS4xOTk5OTk5OTk5OTk5OTkzIFRMCjAgZwo1Ni42OTI5MTMzODU4MjY3Nzc1IDM0LjAxNTk4NDI1MTk2ODQ2MTYgVGQKKFJlZjogc2FtcGxlLXN1cHBvcnRpbmctZG9jdW1lbnQpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKMSAwIG9iago8PC9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFIgXQovQ291bnQgMQo+PgplbmRvYmoKNSAwIG9iago8PAovVHlwZSAvRm9udAovQmFzZUZvbnQgL0hlbHZldGljYQovU3VidHlwZSAvVHlwZTEKL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcKL0ZpcnN0Q2hhciAzMgovTGFzdENoYXIgMjU1Cj4+CmVuZG9iago2IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9CYXNlRm9udCAvSGVsdmV0aWNhLUJvbGQKL1N1YnR5cGUgL1R5cGUxCi9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nCi9GaXJzdENoYXIgMzIKL0xhc3RDaGFyIDI1NQo+PgplbmRvYmoKNyAwIG9iago8PAovVHlwZSAvRm9udAovQmFzZUZvbnQgL0hlbHZldGljYS1PYmxpcXVlCi9TdWJ0eXBlIC9UeXBlMQovRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZwovRmlyc3RDaGFyIDMyCi9MYXN0Q2hhciAyNTUKPj4KZW5kb2JqCjggMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL0Jhc2VGb250IC9IZWx2ZXRpY2EtQm9sZE9ibGlxdWUKL1N1YnR5cGUgL1R5cGUxCi9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nCi9GaXJzdENoYXIgMzIKL0xhc3RDaGFyIDI1NQo+PgplbmRvYmoKOSAwIG9iago8PAovVHlwZSAvRm9udAovQmFzZUZvbnQgL0NvdXJpZXIKL1N1YnR5cGUgL1R5cGUxCi9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nCi9GaXJzdENoYXIgMzIKL0xhc3RDaGFyIDI1NQo+PgplbmRvYmoKMTAgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL0Jhc2VGb250IC9Db3VyaWVyLUJvbGQKL1N1YnR5cGUgL1R5cGUxCi9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nCi9GaXJzdENoYXIgMzIKL0xhc3RDaGFyIDI1NQo+PgplbmRvYmoKMTEgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL0Jhc2VGb250IC9Db3VyaWVyLU9ibGlxdWUKL1N1YnR5cGUgL1R5cGUxCi9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nCi9GaXJzdENoYXIgMzIKL0xhc3RDaGFyIDI1NQo+PgplbmRvYmoKMTIgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL0Jhc2VGb250IC9Db3VyaWVyLUJvbGRPYmxpcXVlCi9TdWJ0eXBlIC9UeXBlMQovRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZwovRmlyc3RDaGFyIDMyCi9MYXN0Q2hhciAyNTUKPj4KZW5kb2JqCjEzIDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9CYXNlRm9udCAvVGltZXMtUm9tYW4KL1N1YnR5cGUgL1R5cGUxCi9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nCi9GaXJzdENoYXIgMzIKL0xhc3RDaGFyIDI1NQo+PgplbmRvYmoKMTQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL0Jhc2VGb250IC9UaW1lcy1Cb2xkCi9TdWJ0eXBlIC9UeXBlMQovRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZwovRmlyc3RDaGFyIDMyCi9MYXN0Q2hhciAyNTUKPj4KZW5kb2JqCjE1IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9CYXNlRm9udCAvVGltZXMtSXRhbGljCi9TdWJ0eXBlIC9UeXBlMQovRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZwovRmlyc3RDaGFyIDMyCi9MYXN0Q2hhciAyNTUKPj4KZW5kb2JqCjE2IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9CYXNlRm9udCAvVGltZXMtQm9sZEl0YWxpYwovU3VidHlwZSAvVHlwZTEKL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcKL0ZpcnN0Q2hhciAzMgovTGFzdENoYXIgMjU1Cj4+CmVuZG9iagoxNyAwIG9iago8PAovVHlwZSAvRm9udAovQmFzZUZvbnQgL1phcGZEaW5nYmF0cwovU3VidHlwZSAvVHlwZTEKL0ZpcnN0Q2hhciAzMgovTGFzdENoYXIgMjU1Cj4+CmVuZG9iagoxOCAwIG9iago8PAovVHlwZSAvRm9udAovQmFzZUZvbnQgL1N5bWJvbAovU3VidHlwZSAvVHlwZTEKL0ZpcnN0Q2hhciAzMgovTGFzdENoYXIgMjU1Cj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9Qcm9jU2V0IFsvUERGIC9UZXh0IC9JbWFnZUIgL0ltYWdlQyAvSW1hZ2VJXQovRm9udCA8PAovRjEgNSAwIFIKL0YyIDYgMCBSCi9GMyA3IDAgUgovRjQgOCAwIFIKL0Y1IDkgMCBSCi9GNiAxMCAwIFIKL0Y3IDExIDAgUgovRjggMTIgMCBSCi9GOSAxMyAwIFIKL0YxMCAxNCAwIFIKL0YxMSAxNSAwIFIKL0YxMiAxNiAwIFIKL0YxMyAxNyAwIFIKL0YxNCAxOCAwIFIKPj4KL1hPYmplY3QgPDwKPj4KPj4KZW5kb2JqCjE5IDAgb2JqCjw8Ci9Qcm9kdWNlciAoanNQREYgNC4yLjEpCi9DcmVhdGlvbkRhdGUgKEQ6MjAyNjEwMjUxNDEzMjcrMDUnMDAnKQo+PgplbmRvYmoKMjAgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDEgMCBSCi9PcGVuQWN0aW9uIFszIDAgUiAvRml0SCBudWxsXQovUGFnZUxheW91dCAvT25lQ29sdW1uCj4+CmVuZG9iagp4cmVmCjAgMjEKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAxMTI1IDAwMDAwIG4gCjAwMDAwMDI5NDIgMDAwMDAgbiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMTUyIDAwMDAwIG4gCjAwMDAwMDExODIgMDAwMDAgbiAKMDAwMDAwMTMwNyAwMDAwMCBuIAowMDAwMDAxNDM3IDAwMDAwIG4gCjAwMDAwMDE1NzAgMDAwMDAgbiAKMDAwMDAwMTcwNyAwMDAwMCBuIAowMDAwMDAxODMwIDAwMDAwIG4gCjAwMDAwMDE5NTkgMDAwMDAgbiAKMDAwMDAwMjA5MSAwMDAwMCBuIAowMDAwMDAyMjI3IDAwMDAwIG4gCjAwMDAwMDIzNTUgMDAwMDAgbiAKMDAwMDAwMjQ4MiAwMDAwMCBuIAowMDAwMDAyNjExIDAwMDAwIG4gCjAwMDAwMDI3NDQgMDAwMDAgbiAKMDAwMDAwMjg0NiAwMDAwMCBuIAowMDAwMDAzMTkwIDAwMDAwIG4gCjAwMDAwMDMyNzYgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSAyMQovUm9vdCAyMCAwIFIKL0luZm8gMTkgMCBSCi9JRCBbIDw2MUM4Mjg1REREQjA2Q0NGNEI4NEU4QThENzVDMjU2Rj4gPDYxQzgyODVERERCMDZDQ0Y0Qjg0RThBOEQ3NUMyNTZGPiBdCj4+CnN0YXJ0eHJlZgozMzgwCiUlRU9G',
        fileSize: 520000,
        fileType: 'application/pdf',
        uploadedAt: '2026-10-24T10:00:00Z',
        status: 'pending'
      }
    ],
    stageInstances: [
      {
        stageId: 'stage-doc-dept-clear',
        name: 'Department Head No-Dues Clearance',
        assignedDepartment: 'Computer Science & Engineering',
        assignedRole: 'Head of Department',
        assignedStaffId: 'staff-hod',
        assignedStaffName: 'Prof. Eleanor Wright',
        status: 'in_progress',
        startedAt: '2026-10-24T10:05:00Z',
        deadline: '2026-10-26T10:05:00Z',
        warningCount: 0,
        slaHours: 24
      },
      {
        stageId: 'stage-doc-registrar-sanction',
        name: 'Registrar Vault Authorization & Seal',
        assignedDepartment: 'Office of the University Registrar',
        assignedRole: 'University Registrar',
        assignedStaffId: 'staff-registrar',
        assignedStaffName: 'Dr. Arthur Pendelton',
        status: 'pending',
        warningCount: 0,
        slaHours: 48
      }
    ],
    timeline: [
      {
        id: 'tl-wd-1',
        timestamp: '2026-10-24T10:00:00Z',
        stageName: 'Student Submission',
        title: 'Withdrawal Application Submitted',
        description: 'Original 12th Grade Marksheet withdrawal request filed for Visa interview.',
        actorName: 'Sarah Jenkins',
        actorRole: 'student',
        type: 'submission'
      },
      {
        id: 'tl-wd-2',
        timestamp: '2026-10-24T10:05:00Z',
        stageName: 'Department Head No-Dues Clearance',
        title: 'Assigned to HOD Review',
        description: 'Application queued for Prof. Eleanor Wright clearance review.',
        actorName: 'System Router',
        actorRole: 'system',
        type: 'verification'
      }
    ],
    createdAt: '2026-10-24T10:00:00Z',
    updatedAt: '2026-10-24T10:05:00Z',
    submissionDate: '2026-10-24T10:00:00Z',
    estimatedCompletionDate: '2026-10-28T17:00:00Z',
    targetDeadline: '2026-10-28T17:00:00Z'
  },

  // 3. Overdue Application: Mess Exemption (Simulated missed SLA for Alex Chen)
  {
    id: 'app-003',
    referenceNumber: 'APP-2026-MS-0511',
    applicationTypeId: 'app-type-mess',
    applicationTypeTitle: 'Mess Out / Exemption Application',
    templateVersion: 1,
    studentId: 'student-2',
    studentSnapshot: {
      name: 'Alex Chen',
      registrationNumber: '2023-EE-089',
      email: 'alex.chen@university.edu',
      department: 'Electrical Engineering',
      phone: '+1 (555) 345-6712'
    },
    status: 'overdue',
    currentStageId: 'stage-mess-verify',
    currentStageIndex: 0,
    formData: {
      student_name: 'Alex Chen',
      reg_no: '2023-EE-089',
      hostel_name: 'Hall 2 (Babbage)',
      start_date: '2026-10-15',
      end_date: '2026-10-25',
      reason: 'Off-campus academic internship in hardware prototyping lab.'
    },
    uploadedDocuments: [
      {
        id: 'doc-upload-intern',
        requirementId: 'doc-mess-proof',
        requirementName: 'Supporting Clearance or Medical Note',
        fileName: 'Lab_Internship_Offer_Letter.pdf',
        fileDataUrl: 'data:application/pdf;base64,JVBERi0xLjMKJbrfrOAKMyAwIG9iago8PC9UeXBlIC9QYWdlCi9QYXJlbnQgMSAwIFIKL1Jlc291cmNlcyAyIDAgUgovTWVkaWFCb3ggWzAgMCA1OTUuMjc5OTk5OTk5OTk5OTcyNyA4NDEuODg5OTk5OTk5OTk5OTg2NF0KL0NvbnRlbnRzIDQgMCBSCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9MZW5ndGggOTIyCj4+CnN0cmVhbQowLjU2NzAwMDAwMDAwMDAwMDEgdwowIEcKQlQKL0YyIDE2IFRmCjE4LjM5OTk5OTk5OTk5OTk5ODYgVEwKMCBnCjU2LjY5MjkxMzM4NTgyNjc3NzUgNzYyLjUxOTkyMTI1OTg0MjQ3NjUgVGQKKEFQRVggU1RBVEUgVU5JVkVSU0lUWSkgVGoKRVQKQlQKL0YxIDExIFRmCjEyLjY0OTk5OTk5OTk5OTk5ODYgVEwKMCBnCjU2LjY5MjkxMzM4NTgyNjc3NzUgNzM0LjE3MzQ2NDU2NjkyOTE2OTUgVGQKKFN1cHBvcnRpbmcgZG9jdW1lbnQglyBzYW1wbGUgcmVjb3JkKSBUagpFVAowLjcxIEcKNTYuNjkyOTEzMzg1ODI2Nzc3NSA3MTcuMTY1NTkwNTUxMTgxMDI2MSBtCjUzOC41ODI2NzcxNjUzNTQ0MjU2IDcxNy4xNjU1OTA1NTExODEwMjYxIGwKUwpCVAovRjEgOSBUZgoxMC4zNDk5OTk5OTk5OTk5OTk2IFRMCjAgZwo1Ni42OTI5MTMzODU4MjY3Nzc1IDY4My4xNDk4NDI1MTk2ODUwODAzIFRkCihUaGlzIGRvY3VtZW50IGlzIHBhcnQgb2YgdGhlIGRlbW9uc3RyYXRpb24gZGF0YXNldC4pIFRqCkVUCkJUCi9GMSA5IFRmCjEwLjM0OTk5OTk5OTk5OTk5OTYgVEwKMCBnCjU2LjY5MjkxMzM4NTgyNjc3NzUgNjYwLjQ3MjY3NzE2NTM1NDI5ODMgVGQKKFN0dWRlbnQ6IFNhcmFoIEplbmtpbnMgICAgUmVnaXN0cmF0aW9uOiAyMDI0LUNTLTEwNCkgVGoKRVQKQlQKL0YxIDkgVGYKMTAuMzQ5OTk5OTk5OTk5OTk5NiBUTAowIGcKNTYuNjkyOTEzMzg1ODI2Nzc3NSA2MzcuNzk1NTExODExMDIzNTE2MiBUZAooVXBsb2FkZWQgd2l0aCBhbiBhcHBsaWNhdGlvbiBwcm9jZXNzZWQgYnkgdGhlIHJlY29yZHMgb2ZmaWNlLikgVGoKRVQKQlQKL0YxIDggVGYKOS4xOTk5OTk5OTk5OTk5OTkzIFRMCjAgZwo1Ni42OTI5MTMzODU4MjY3Nzc1IDM0LjAxNTk4NDI1MTk2ODQ2MTYgVGQKKFJlZjogc2FtcGxlLXN1cHBvcnRpbmctZG9jdW1lbnQpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKMSAwIG9iago8PC9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFIgXQovQ291bnQgMQo+PgplbmRvYmoKNSAwIG9iago8PAovVHlwZSAvRm9udAovQmFzZUZvbnQgL0hlbHZldGljYQovU3VidHlwZSAvVHlwZTEKL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcKL0ZpcnN0Q2hhciAzMgovTGFzdENoYXIgMjU1Cj4+CmVuZG9iago2IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9CYXNlRm9udCAvSGVsdmV0aWNhLUJvbGQKL1N1YnR5cGUgL1R5cGUxCi9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nCi9GaXJzdENoYXIgMzIKL0xhc3RDaGFyIDI1NQo+PgplbmRvYmoKNyAwIG9iago8PAovVHlwZSAvRm9udAovQmFzZUZvbnQgL0hlbHZldGljYS1PYmxpcXVlCi9TdWJ0eXBlIC9UeXBlMQovRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZwovRmlyc3RDaGFyIDMyCi9MYXN0Q2hhciAyNTUKPj4KZW5kb2JqCjggMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL0Jhc2VGb250IC9IZWx2ZXRpY2EtQm9sZE9ibGlxdWUKL1N1YnR5cGUgL1R5cGUxCi9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nCi9GaXJzdENoYXIgMzIKL0xhc3RDaGFyIDI1NQo+PgplbmRvYmoKOSAwIG9iago8PAovVHlwZSAvRm9udAovQmFzZUZvbnQgL0NvdXJpZXIKL1N1YnR5cGUgL1R5cGUxCi9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nCi9GaXJzdENoYXIgMzIKL0xhc3RDaGFyIDI1NQo+PgplbmRvYmoKMTAgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL0Jhc2VGb250IC9Db3VyaWVyLUJvbGQKL1N1YnR5cGUgL1R5cGUxCi9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nCi9GaXJzdENoYXIgMzIKL0xhc3RDaGFyIDI1NQo+PgplbmRvYmoKMTEgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL0Jhc2VGb250IC9Db3VyaWVyLU9ibGlxdWUKL1N1YnR5cGUgL1R5cGUxCi9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nCi9GaXJzdENoYXIgMzIKL0xhc3RDaGFyIDI1NQo+PgplbmRvYmoKMTIgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL0Jhc2VGb250IC9Db3VyaWVyLUJvbGRPYmxpcXVlCi9TdWJ0eXBlIC9UeXBlMQovRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZwovRmlyc3RDaGFyIDMyCi9MYXN0Q2hhciAyNTUKPj4KZW5kb2JqCjEzIDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9CYXNlRm9udCAvVGltZXMtUm9tYW4KL1N1YnR5cGUgL1R5cGUxCi9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nCi9GaXJzdENoYXIgMzIKL0xhc3RDaGFyIDI1NQo+PgplbmRvYmoKMTQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL0Jhc2VGb250IC9UaW1lcy1Cb2xkCi9TdWJ0eXBlIC9UeXBlMQovRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZwovRmlyc3RDaGFyIDMyCi9MYXN0Q2hhciAyNTUKPj4KZW5kb2JqCjE1IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9CYXNlRm9udCAvVGltZXMtSXRhbGljCi9TdWJ0eXBlIC9UeXBlMQovRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZwovRmlyc3RDaGFyIDMyCi9MYXN0Q2hhciAyNTUKPj4KZW5kb2JqCjE2IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9CYXNlRm9udCAvVGltZXMtQm9sZEl0YWxpYwovU3VidHlwZSAvVHlwZTEKL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcKL0ZpcnN0Q2hhciAzMgovTGFzdENoYXIgMjU1Cj4+CmVuZG9iagoxNyAwIG9iago8PAovVHlwZSAvRm9udAovQmFzZUZvbnQgL1phcGZEaW5nYmF0cwovU3VidHlwZSAvVHlwZTEKL0ZpcnN0Q2hhciAzMgovTGFzdENoYXIgMjU1Cj4+CmVuZG9iagoxOCAwIG9iago8PAovVHlwZSAvRm9udAovQmFzZUZvbnQgL1N5bWJvbAovU3VidHlwZSAvVHlwZTEKL0ZpcnN0Q2hhciAzMgovTGFzdENoYXIgMjU1Cj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9Qcm9jU2V0IFsvUERGIC9UZXh0IC9JbWFnZUIgL0ltYWdlQyAvSW1hZ2VJXQovRm9udCA8PAovRjEgNSAwIFIKL0YyIDYgMCBSCi9GMyA3IDAgUgovRjQgOCAwIFIKL0Y1IDkgMCBSCi9GNiAxMCAwIFIKL0Y3IDExIDAgUgovRjggMTIgMCBSCi9GOSAxMyAwIFIKL0YxMCAxNCAwIFIKL0YxMSAxNSAwIFIKL0YxMiAxNiAwIFIKL0YxMyAxNyAwIFIKL0YxNCAxOCAwIFIKPj4KL1hPYmplY3QgPDwKPj4KPj4KZW5kb2JqCjE5IDAgb2JqCjw8Ci9Qcm9kdWNlciAoanNQREYgNC4yLjEpCi9DcmVhdGlvbkRhdGUgKEQ6MjAyNjEwMjUxNDEzMjcrMDUnMDAnKQo+PgplbmRvYmoKMjAgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDEgMCBSCi9PcGVuQWN0aW9uIFszIDAgUiAvRml0SCBudWxsXQovUGFnZUxheW91dCAvT25lQ29sdW1uCj4+CmVuZG9iagp4cmVmCjAgMjEKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAxMTI1IDAwMDAwIG4gCjAwMDAwMDI5NDIgMDAwMDAgbiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMTUyIDAwMDAwIG4gCjAwMDAwMDExODIgMDAwMDAgbiAKMDAwMDAwMTMwNyAwMDAwMCBuIAowMDAwMDAxNDM3IDAwMDAwIG4gCjAwMDAwMDE1NzAgMDAwMDAgbiAKMDAwMDAwMTcwNyAwMDAwMCBuIAowMDAwMDAxODMwIDAwMDAwIG4gCjAwMDAwMDE5NTkgMDAwMDAgbiAKMDAwMDAwMjA5MSAwMDAwMCBuIAowMDAwMDAyMjI3IDAwMDAwIG4gCjAwMDAwMDIzNTUgMDAwMDAgbiAKMDAwMDAwMjQ4MiAwMDAwMCBuIAowMDAwMDAyNjExIDAwMDAwIG4gCjAwMDAwMDI3NDQgMDAwMDAgbiAKMDAwMDAwMjg0NiAwMDAwMCBuIAowMDAwMDAzMTkwIDAwMDAwIG4gCjAwMDAwMDMyNzYgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSAyMQovUm9vdCAyMCAwIFIKL0luZm8gMTkgMCBSCi9JRCBbIDw2MUM4Mjg1REREQjA2Q0NGNEI4NEU4QThENzVDMjU2Rj4gPDYxQzgyODVERERCMDZDQ0Y0Qjg0RThBOEQ3NUMyNTZGPiBdCj4+CnN0YXJ0eHJlZgozMzgwCiUlRU9G',
        fileSize: 310000,
        fileType: 'application/pdf',
        uploadedAt: '2026-10-18T08:30:00Z',
        status: 'pending'
      }
    ],
    stageInstances: [
      {
        stageId: 'stage-mess-verify',
        name: 'Hostel Warden Review & Billing Sanction',
        assignedDepartment: 'Student Affairs & Hostels',
        assignedRole: 'Chief Hostel Warden',
        assignedStaffId: 'staff-warden',
        assignedStaffName: 'Col. Arvind Sharma',
        status: 'in_progress',
        startedAt: '2026-10-18T08:30:00Z',
        deadline: '2026-10-19T08:30:00Z', // Past deadline! Overdue
        warningCount: 2,
        slaHours: 24
      }
    ],
    timeline: [
      {
        id: 'tl-ms-1',
        timestamp: '2026-10-18T08:30:00Z',
        stageName: 'Student Submission',
        title: 'Mess Exemption Filed',
        description: 'Exemption requested for Hall 2 residence.',
        actorName: 'Alex Chen',
        actorRole: 'student',
        type: 'submission'
      },
      {
        id: 'tl-ms-warn1',
        timestamp: '2026-10-19T10:00:00Z',
        stageName: 'Hostel Warden Review',
        title: 'SLA Warning 1: Overdue Notice Dispatched',
        description: 'Stage exceeded 24h SLA. First warning notification sent to Col. Arvind Sharma.',
        actorName: 'SLA Scheduler Engine',
        actorRole: 'system',
        type: 'warning'
      },
      {
        id: 'tl-ms-warn2',
        timestamp: '2026-10-20T14:00:00Z',
        stageName: 'Hostel Warden Review',
        title: 'SLA Warning 2: Delay Escalation Pending',
        description: 'Persistent delay. Second warning issued. Final warning will trigger Administrator escalation.',
        actorName: 'SLA Scheduler Engine',
        actorRole: 'system',
        type: 'warning'
      }
    ],
    createdAt: '2026-10-18T08:30:00Z',
    updatedAt: '2026-10-20T14:00:00Z',
    submissionDate: '2026-10-18T08:30:00Z',
    estimatedCompletionDate: '2026-10-21T17:00:00Z',
    targetDeadline: '2026-10-19T08:30:00Z'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-001',
    timestamp: '2026-10-24T10:05:00Z',
    actorId: 'student-1',
    actorName: 'Sarah Jenkins',
    actorRole: 'student',
    action: 'APPLICATION_SUBMITTED',
    details: 'Submitted Document Withdrawal Application (APP-2026-WD-0842) with 2 attached files.',
    applicationRef: 'APP-2026-WD-0842'
  },
  {
    id: 'audit-002',
    timestamp: '2026-10-22T16:20:00Z',
    actorId: 'staff-warden',
    actorName: 'Col. Arvind Sharma',
    actorRole: 'staff',
    action: 'DOCUMENT_ISSUED_WITH_SIGNATURE_AND_STAMP',
    details: 'Signed and applied Hostel Sanction Seal to Leave Application APP-2026-LV-0194.',
    applicationRef: 'APP-2026-LV-0194'
  },
  {
    id: 'audit-003',
    timestamp: '2026-10-22T14:45:00Z',
    actorId: 'staff-hod',
    actorName: 'Prof. Eleanor Wright',
    actorRole: 'staff',
    action: 'STAGE_APPROVED_WITH_SIGNATURE',
    details: 'Authorized CS Department Clearance with electronic signature on APP-2026-LV-0194.',
    applicationRef: 'APP-2026-LV-0194'
  },
  {
    id: 'audit-004',
    timestamp: '2026-10-20T14:00:00Z',
    actorId: 'system',
    actorName: 'SLA Scheduler Engine',
    actorRole: 'system',
    action: 'SLA_WARNING_EMITTED',
    details: 'Warning Level 2 emitted for application APP-2026-MS-0511 (Hostel Warden stage overdue by 29 hours).',
    applicationRef: 'APP-2026-MS-0511'
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    userId: 'student-1',
    title: 'Official Leave Sanction Issued',
    message: 'Your Leave Application APP-2026-LV-0194 has been approved by all authorities and your official signed certificate is ready for download.',
    type: 'success',
    read: false,
    createdAt: '2026-10-22T16:20:00Z',
    applicationRef: 'APP-2026-LV-0194'
  },
  {
    id: 'notif-2',
    userId: 'staff-hod',
    title: 'New Task: Document Withdrawal Review',
    message: 'Sarah Jenkins has submitted APP-2026-WD-0842 requiring Department Head clearance.',
    type: 'info',
    read: false,
    createdAt: '2026-10-24T10:05:00Z',
    applicationRef: 'APP-2026-WD-0842'
  },
  {
    id: 'notif-3',
    userId: 'staff-warden',
    title: 'Overdue Task Warning: APP-2026-MS-0511',
    message: 'Mess Exemption Application for Alex Chen is 29 hours past SLA deadline.',
    type: 'warning',
    read: false,
    createdAt: '2026-10-20T14:00:00Z',
    applicationRef: 'APP-2026-MS-0511'
  }
];
