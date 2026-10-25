import React, { useEffect, useState } from 'react';
import { subscribeToToasts, dismissToast, Toast } from '../../lib/toast';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const TOAST_STYLES: Record<Toast['type'], { border: string; bg: string; icon: string; Icon: typeof Info }> = {
  success: { border: 'border-emerald-200', bg: 'bg-emerald-50', icon: 'text-emerald-600', Icon: CheckCircle2 },
  error: { border: 'border-rose-200', bg: 'bg-rose-50', icon: 'text-rose-600', Icon: AlertCircle },
  warning: { border: 'border-amber-200', bg: 'bg-amber-50', icon: 'text-amber-600', Icon: AlertTriangle },
  info: { border: 'border-sky-200', bg: 'bg-sky-50', icon: 'text-sky-600', Icon: Info }
};

const TOAST_TITLES: Record<Toast['type'], string> = {
  success: 'Success',
  error: 'Error',
  warning: 'Attention',
  info: 'Notice'
};

export const Toaster: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => subscribeToToasts(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]">
      {toasts.map(t => {
        const style = TOAST_STYLES[t.type];
        return (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-xl border ${style.border} ${style.bg} shadow-lg shadow-slate-900/5 backdrop-blur-sm animate-[toast-in_.22s_ease-out]`}
          >
            <style>{`@keyframes toast-in { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
            <style.Icon className={`w-5 h-5 ${style.icon} shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {t.title || TOAST_TITLES[t.type]}
              </p>
              {t.message && (
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed break-words">{t.message}</p>
              )}
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="p-0.5 text-slate-400 hover:text-slate-700 rounded transition-colors shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
