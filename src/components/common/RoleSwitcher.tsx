import React, { useState } from 'react';
import { useApplyEaseStore } from '../../lib/store';
import { UserCheck, ChevronDown, Shield } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { currentUser, users, setCurrentUser, logout } = useApplyEaseStore();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-xs"
        title="Switch simulated authenticated identity"
      >
        {/* Current user avatar */}
        {currentUser.avatarUrl ? (
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            className="w-6 h-6 rounded-full object-cover shrink-0"
          />
        ) : (
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
              currentUser.role === 'admin'
                ? 'bg-purple-100 text-purple-700'
                : currentUser.role === 'staff'
                ? 'bg-slate-100 text-slate-800'
                : 'bg-orange-100 text-orange-700'
            }`}
          >
            {currentUser.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
          </span>
        )}

        <div className="text-left hidden sm:block">
          <div className="font-semibold text-slate-900 leading-tight truncate max-w-[140px]">
            {currentUser.name}
          </div>
          <div className="text-[10px] text-slate-500 capitalize">
            {currentUser.designation || currentUser.role}
          </div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#172b50]" />
                Switch Test Role & Identity
              </span>
              <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                Multi-Role
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto py-1 divide-y divide-slate-50">
              {/* Use live store users so avatar updates are immediately reflected */}
              {users.map((user) => {
                const isSelected = user.id === currentUser.id;
                const initials = user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      setCurrentUser(user);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-start gap-2.5 transition-colors ${
                      isSelected
                        ? 'bg-orange-50/70 text-slate-900'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {/* Avatar: photo if available, else coloured initials */}
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-7 h-7 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : user.role === 'staff'
                            ? 'bg-slate-100 text-slate-800'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {initials}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {user.name}
                        </span>
                        {isSelected && (
                          <UserCheck className="w-3.5 h-3.5 text-[#f4772e] shrink-0" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {user.designation || user.department}
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize mt-0.5">
                        Role: <span className="font-medium text-slate-600">{user.role}</span>
                        {user.registrationNumber ? ` • ${user.registrationNumber}` : ''}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-2 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="w-full py-1.5 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg transition-colors text-center block"
              >
                Sign Out to Login Screen
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
