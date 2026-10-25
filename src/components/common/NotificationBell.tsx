import React, { useState } from 'react';
import { useApplyEaseStore } from '../../lib/store';
import { Bell, CheckCheck, Clock, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface NotificationBellProps {
  onSelectApplication?: (ref: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onSelectApplication }) => {
  const { notifications, currentUser, markNotificationAsRead, markAllNotificationsAsRead } = useApplyEaseStore();
  const [isOpen, setIsOpen] = useState(false);

  // Only show notifications addressed to the signed-in user.
  const userNotifications = notifications.filter(
    (n) => n.userId === currentUser.id
  );
  const unreadCount = userNotifications.filter((n) => !n.read).length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
      case 'alert':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
      default:
        return <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#f4772e] text-white text-[10px] font-bold rounded-full flex items-center justify-center font-mono">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Notifications</h4>
                <p className="text-[11px] text-slate-500">
                  {unreadCount} unread update{unreadCount === 1 ? '' : 's'}
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllNotificationsAsRead(currentUser.id)}
                  className="text-[11px] text-[#f4772e] hover:text-[#d35f18] font-medium flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {userNotifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-400 text-xs">
                  No notifications yet. You're completely up to date!
                </div>
              ) : (
                userNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      markNotificationAsRead(notif.id);
                      if (notif.applicationRef && onSelectApplication) {
                        onSelectApplication(notif.applicationRef);
                        setIsOpen(false);
                      }
                    }}
                    className={`px-4 py-3 cursor-pointer transition-colors flex items-start gap-3 ${
                      notif.read ? 'bg-white hover:bg-slate-50/80' : 'bg-orange-50/40 hover:bg-orange-50/70'
                    }`}
                  >
                    <div className="mt-0.5">{getTypeIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {notif.title}
                        </span>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-[#f4772e] shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(notif.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {notif.applicationRef && (
                          <span className="font-mono text-slate-500 font-medium">
                            • {notif.applicationRef}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
