import React from 'react';
import { ApplicationStatus } from '../../types';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  FileEdit,
  PenTool,
  ShieldCheck,
  XCircle,
  PauseCircle
} from 'lucide-react';

interface StatusBadgeProps {
  status: ApplicationStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const configs: Record<
    ApplicationStatus,
    { label: string; bg: string; text: string; icon: React.ReactNode }
  > = {
    draft: {
      label: 'Draft',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      icon: <FileEdit className="w-3.5 h-3.5" />
    },
    submitted: {
      label: 'Submitted',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      icon: <Clock className="w-3.5 h-3.5" />
    },
    under_verification: {
      label: 'Under Verification',
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      icon: <ShieldCheck className="w-3.5 h-3.5" />
    },
    awaiting_payment: {
      label: 'Awaiting Fee Payment',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      icon: <Clock className="w-3.5 h-3.5" />
    },
    awaiting_student_action: {
      label: 'Action Required',
      bg: 'bg-orange-50',
      text: 'text-orange-800',
      icon: <PauseCircle className="w-3.5 h-3.5" />
    },
    pending_approval: {
      label: 'Pending Approval',
      bg: 'bg-sky-50',
      text: 'text-sky-800',
      icon: <Clock className="w-3.5 h-3.5" />
    },
    pending_signature: {
      label: 'Pending Signature',
      bg: 'bg-purple-50',
      text: 'text-purple-800',
      icon: <PenTool className="w-3.5 h-3.5" />
    },
    overdue: {
      label: 'Overdue / Escalated',
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      icon: <AlertTriangle className="w-3.5 h-3.5" />
    },
    completed: {
      label: 'Document Issued',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />
    },
    rejected: {
      label: 'Rejected',
      bg: 'bg-red-50',
      text: 'text-red-800',
      icon: <XCircle className="w-3.5 h-3.5" />
    },
    cancelled: {
      label: 'Cancelled',
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      icon: <AlertCircle className="w-3.5 h-3.5" />
    }
  };

  const current = configs[status] || configs.submitted;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded ${current.bg} ${current.text} ${padding} whitespace-nowrap`}
    >
      {current.icon}
      <span>{current.label}</span>
    </span>
  );
};
