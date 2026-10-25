import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Accessible confirmation modal used for irreversible or high-impact actions.
 * Replaces window.confirm so the platform keeps one consistent visual language.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  busy = false,
  onConfirm,
  onCancel
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm animate-[overlay-in_120ms_ease-out]"
        onClick={() => !busy && onCancel()}
      />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 animate-[palette-in_140ms_ease-out]">
        <button
          onClick={onCancel}
          disabled={busy}
          className="absolute right-3 top-3 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 disabled:opacity-50"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
              tone === 'danger'
                ? 'bg-rose-50 border border-rose-100 text-rose-600'
                : 'bg-blue-50 border border-blue-100 text-[#172b50]'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>

          <h2 id="confirm-dialog-title" className="text-base font-bold text-slate-900">
            {title}
          </h2>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{description}</p>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`px-3.5 py-2 text-xs font-bold text-white rounded-lg transition-colors disabled:opacity-60 inline-flex items-center gap-1.5 ${
              tone === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#172b50] hover:bg-[#1f3763]'
            }`}
          >
            {busy && <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
