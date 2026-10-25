import React, { useRef, useState } from 'react';
import { useApplyEaseStore } from '../../lib/store';
import { UserProfile, UserRole } from '../../types';
import { DEPARTMENTS } from '../../lib/constants';
import {
  UserPlus,
  Trash2,
  GraduationCap,
  Briefcase,
  Shield,
  Search,
  CheckCircle2,
  X,
  Camera,
  ImagePlus,
  Pencil,
} from 'lucide-react';

/* ─── tiny helpers ─────────────────────────────────────────────────────────── */

/** Compress a raw File to a data-URL ≤ 200 KB at the given max width. */
async function compressImageToDataUrl(
  file: File,
  maxWidthPx = 256,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidthPx / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = ev.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Round avatar shown in the table rows and the modal. */
const Avatar: React.FC<{ src?: string; name: string; size?: number }> = ({
  src,
  name,
  size = 36,
}) => {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.35,
        fontWeight: 700,
        flexShrink: 0,
        background: '#e8ecf5',
        color: '#172b50',
        userSelect: 'none',
      }}
    >
      {initials}
    </div>
  );
};

/* ─── AvatarUploadButton ────────────────────────────────────────────────────── */
interface AvatarUploadButtonProps {
  currentUrl?: string;
  name: string;
  size?: number;
  onChange: (dataUrl: string) => void;
}

const AvatarUploadButton: React.FC<AvatarUploadButtonProps> = ({
  currentUrl,
  name,
  size = 72,
  onChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, WebP, etc.).');
      return;
    }
    setLoading(true);
    try {
      const dataUrl = await compressImageToDataUrl(file, 256, 0.82);
      onChange(dataUrl);
    } catch {
      alert('Could not read the selected image. Please try another file.');
    } finally {
      setLoading(false);
      // Reset so the same file can be re-selected
      e.target.value = '';
    }
  };

  return (
    <div style={{ position: 'relative', width: size, height: size, cursor: 'pointer' }}
         onClick={() => inputRef.current?.click()}>
      <Avatar src={currentUrl} name={name || 'New User'} size={size} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'rgba(23,43,80,0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0,
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0'; }}
      >
        {loading
          ? <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>…</span>
          : <Camera style={{ color: '#fff', width: size * 0.3, height: size * 0.3 }} />
        }
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </div>
  );
};

/* ─── Main component ─────────────────────────────────────────────────────────── */

export const UserManager: React.FC = () => {
  const { users, addUser, deleteUser, updateUser, currentUser } = useApplyEaseStore();

  const [roleFilter, setRoleFilter] = useState<'all' | 'staff' | 'student'>('all');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Edit existing user
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editDepartment, setEditDepartment] = useState(DEPARTMENTS[0]);
  const [editDesignation, setEditDesignation] = useState('');
  const [editRegNo, setEditRegNo] = useState('');
  const [editSemester, setEditSemester] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | undefined>(undefined);

  const openEditModal = (u: UserProfile) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditPassword(u.password || '');
    setEditDepartment(u.department || DEPARTMENTS[0]);
    setEditDesignation(u.designation || '');
    setEditRegNo(u.registrationNumber || '');
    setEditSemester(u.semester || '');
    setEditPhone(u.phone || '');
    setEditAvatarUrl(u.avatarUrl);
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editName.trim() || !editEmail.trim()) {
      alert('Name and email are required.');
      return;
    }
    // Email uniqueness check (excluding the user being edited)
    const duplicate = users.find(
      u => u.id !== editingUser.id && u.email.toLowerCase() === editEmail.trim().toLowerCase()
    );
    if (duplicate) { alert(`Email ${editEmail} is already used by another account.`); return; }

    updateUser(editingUser.id, {
      name: editName.trim(),
      email: editEmail.trim().toLowerCase(),
      password: editPassword.trim() || editingUser.password,
      department: editDepartment,
      designation: editingUser.role === 'staff' ? editDesignation.trim() || undefined : editingUser.designation,
      registrationNumber: editingUser.role === 'student' ? editRegNo.trim() || undefined : editingUser.registrationNumber,
      semester: editingUser.role === 'student' ? editSemester.trim() || undefined : editingUser.semester,
      phone: editPhone.trim() || editingUser.phone,
      avatarUrl: editAvatarUrl,
    });
    setNotification(`Account updated for ${editName}.`);
    setTimeout(() => setNotification(null), 4000);
    setEditingUser(null);
  };

  // Form state for creating a new user
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('Apex2026!');
  const [newRole, setNewRole] = useState<UserRole>('student');
  const [newDepartment, setNewDepartment] = useState(DEPARTMENTS[0]);
  const [newRegNo, setNewRegNo] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [newPhone, setNewPhone] = useState('+1 (555) 000-0000');
  const [newSemester, setNewSemester] = useState('1st Semester (B.Tech)');
  const [newAvatarUrl, setNewAvatarUrl] = useState<string | undefined>(undefined);

  // State for the inline avatar-edit popover
  const [editingAvatarUserId, setEditingAvatarUserId] = useState<string | null>(null);

  const resetForm = () => {
    setNewName('');
    setNewEmail('');
    setNewPassword('Apex2026!');
    setNewRegNo('');
    setNewDesignation('');
    setNewAvatarUrl(undefined);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      alert('Please fill all required account fields.');
      return;
    }
    if (users.some((u) => u.email.toLowerCase() === newEmail.trim().toLowerCase())) {
      alert(`An account with email ${newEmail} already exists.`);
      return;
    }

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      password: newPassword.trim(),
      role: newRole,
      department: newDepartment,
      phone: newPhone.trim(),
      registrationNumber:
        newRole === 'student'
          ? newRegNo.trim() || `2026-UG-${Math.floor(100 + Math.random() * 900)}`
          : undefined,
      designation:
        newRole === 'staff' ? newDesignation.trim() || 'Staff Reviewer' : undefined,
      semester: newRole === 'student' ? newSemester : undefined,
      avatarUrl: newAvatarUrl,
      active: true,
    };

    addUser(newUser);
    setIsModalOpen(false);
    setNotification(
      `Successfully provisioned account for ${newUser.name} (${newUser.email}). They can now log in using password "${newPassword}".`
    );
    setTimeout(() => setNotification(null), 6000);
    resetForm();
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (
      search &&
      !u.name.toLowerCase().includes(search.toLowerCase()) &&
      !u.email.toLowerCase().includes(search.toLowerCase()) &&
      !(u.registrationNumber &&
        u.registrationNumber.toLowerCase().includes(search.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            User Credential & Account Provisioning
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create and manage student and staff accounts. Click any avatar to upload a profile photo.
          </p>
        </div>

        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#172b50] hover:bg-[#1f3763] rounded-lg transition-colors shadow-xs shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision New Account</span>
        </button>
      </div>

      {/* ── Success notification ── */}
      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs px-4 py-3 rounded-xl flex items-center justify-between">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-emerald-700 hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* ── Filter + Search ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
          {(['all', 'student', 'staff'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setRoleFilter(f)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                roleFilter === f
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              {f === 'all'
                ? `All Accounts (${users.length})`
                : f === 'student'
                ? `Students (${users.filter((u) => u.role === 'student').length})`
                : `Staff & Faculty (${users.filter((u) => u.role === 'staff').length})`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, email, or reg #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50] focus:bg-white"
          />
        </div>
      </div>

      {/* ── Users Table ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Login Email</th>
                <th className="py-3 px-4">Password</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const isAdmin = u.role === 'admin';
                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {/* Clickable avatar — opens upload for any user */}
                        <div className="relative group" style={{ cursor: 'pointer' }}
                             onClick={() => setEditingAvatarUserId(u.id === editingAvatarUserId ? null : u.id)}
                             title="Click to change profile photo">
                          <Avatar src={u.avatarUrl} name={u.name} size={34} />
                          <span
                            className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Camera style={{ color: '#fff', width: 13, height: 13 }} />
                          </span>
                        </div>

                        <div>
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {u.registrationNumber || u.designation || 'Administrator'}
                          </div>
                        </div>
                      </div>

                      {/* Inline avatar upload panel */}
                      {editingAvatarUserId === u.id && (
                        <AvatarEditPanel
                          user={u}
                          onSave={(dataUrl) => {
                            updateUser(u.id, { avatarUrl: dataUrl });
                            setEditingAvatarUserId(null);
                            setNotification(`Profile photo updated for ${u.name}.`);
                            setTimeout(() => setNotification(null), 4000);
                          }}
                          onRemove={() => {
                            updateUser(u.id, { avatarUrl: undefined });
                            setEditingAvatarUserId(null);
                          }}
                          onClose={() => setEditingAvatarUserId(null)}
                        />
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded capitalize ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'staff'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {u.role === 'admin' ? (
                          <Shield className="w-3 h-3" />
                        ) : u.role === 'staff' ? (
                          <Briefcase className="w-3 h-3" />
                        ) : (
                          <GraduationCap className="w-3 h-3" />
                        )}
                        <span>{u.role}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-800">{u.email}</td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded">{u.password || '123'}</span>
                    </td>

                    <td className="py-3 px-4 text-slate-600">{u.department}</td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(u)}
                          className="p-1 text-slate-400 hover:text-[#172b50] transition-colors"
                          title="Edit account details"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {!isAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Remove account for ${u.name}?`)) deleteUser(u.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create User Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#172b50]" />
                <h3 className="text-base font-bold text-slate-900">Provision New User Account</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              {/* ── Profile Photo ── */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">Profile Photo (optional):</label>
                <div className="flex items-center gap-4">
                  <AvatarUploadButton
                    currentUrl={newAvatarUrl}
                    name={newName || 'New User'}
                    size={72}
                    onChange={setNewAvatarUrl}
                  />
                  <div className="text-[11px] text-slate-500 leading-relaxed">
                    Click the circle to upload a photo.<br />
                    JPEG · PNG · WebP — auto-compressed to 256 px.
                    {newAvatarUrl && (
                      <button
                        type="button"
                        onClick={() => setNewAvatarUrl(undefined)}
                        className="block mt-1.5 text-rose-500 hover:text-rose-700 font-medium"
                      >
                        Remove photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Role Selector ── */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">Select Account Role:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setNewRole('student'); }}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-colors flex items-center justify-center gap-1.5 ${
                      newRole === 'student'
                        ? 'border-[#f4772e] bg-orange-50 text-orange-950 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 text-[#f4772e]" />
                    Student Account
                  </button>
                  <button
                    type="button"
                    onClick={() => { setNewRole('staff'); }}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-colors flex items-center justify-center gap-1.5 ${
                      newRole === 'staff'
                        ? 'border-[#172b50] bg-blue-50 text-blue-950 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 text-[#172b50]" />
                    Staff / Reviewer
                  </button>
                </div>
              </div>

              {/* ── Full Name ── */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Full Name:</label>
                <input
                  type="text"
                  required
                  placeholder={newRole === 'student' ? 'e.g. John Doe' : 'e.g. Prof. David Miller'}
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (e.target.value) {
                      setNewEmail(
                        `${e.target.value.toLowerCase().replace(/\s+/g, '.')}@university.edu`
                      );
                    }
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]"
                />
              </div>

              {/* ── Email & Password ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Login Email:</label>
                  <input
                    type="email"
                    required
                    placeholder="user@university.edu"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50] font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Initial Password:</label>
                  <input
                    type="text"
                    required
                    placeholder="Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50] font-mono"
                  />
                </div>
              </div>

              {/* ── Department ── */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Department / Office:</label>
                <select
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* ── Role-specific fields ── */}
              {newRole === 'student' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Registration / Roll No:</label>
                    <input
                      type="text"
                      placeholder="e.g. 2026-CS-201"
                      value={newRegNo}
                      onChange={(e) => setNewRegNo(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Semester:</label>
                    <input
                      type="text"
                      placeholder="e.g. 2nd Semester"
                      value={newSemester}
                      onChange={(e) => setNewSemester(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Staff Designation / Title:</label>
                  <input
                    type="text"
                    placeholder="e.g. Assistant Professor, Warden, Accounts Officer"
                    value={newDesignation}
                    onChange={(e) => setNewDesignation(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    "Head of Department", "Chief Hostel Warden", "University Registrar" or "Senior
                    Accounts Officer" carry signing authority. Other titles review and forward only.
                  </p>
                </div>
              )}

              {/* ── Actions ── */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#172b50] hover:bg-[#1f3763] rounded-lg shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit User Modal ── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#172b50]" />
                <h3 className="text-base font-bold text-slate-900">Edit Account — {editingUser.name}</h3>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSave} className="space-y-4">
              {/* Profile photo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">Profile Photo:</label>
                <div className="flex items-center gap-4">
                  <AvatarUploadButton
                    currentUrl={editAvatarUrl}
                    name={editName || editingUser.name}
                    size={64}
                    onChange={setEditAvatarUrl}
                  />
                  <div className="text-[11px] text-slate-500 leading-relaxed">
                    Click the circle to change the photo.
                    {editAvatarUrl && (
                      <button type="button" onClick={() => setEditAvatarUrl(undefined)}
                        className="block mt-1.5 text-rose-500 hover:text-rose-700 font-medium">
                        Remove photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Full Name:</label>
                <input type="text" required value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]" />
              </div>

              {/* Email & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Login Email:</label>
                  <input type="email" required value={editEmail} onChange={e => setEditEmail(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50] font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Password: <span className="font-normal text-slate-400">(leave blank to keep current)</span>
                  </label>
                  <input type="text" value={editPassword} onChange={e => setEditPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50] font-mono" />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Phone:</label>
                <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]" />
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Department / Office:</label>
                <select value={editDepartment} onChange={e => setEditDepartment(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]">
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Role-specific */}
              {editingUser.role === 'student' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Registration No:</label>
                    <input type="text" value={editRegNo} onChange={e => setEditRegNo(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Semester:</label>
                    <input type="text" value={editSemester} onChange={e => setEditSemester(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg" />
                  </div>
                </div>
              ) : editingUser.role === 'staff' ? (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Designation / Title:</label>
                  <input type="text" value={editDesignation} onChange={e => setEditDesignation(e.target.value)}
                    placeholder="e.g. Head of Department"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg" />
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    "Head of Department", "Chief Hostel Warden", "University Registrar" or "Senior Accounts Officer" carry signing authority.
                  </p>
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg">
                  Cancel
                </button>
                <button type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#172b50] hover:bg-[#1f3763] rounded-lg shadow-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── AvatarEditPanel ────────────────────────────────────────────────────────── */
interface AvatarEditPanelProps {
  user: UserProfile;
  onSave: (dataUrl: string) => void;
  onRemove: () => void;
  onClose: () => void;
}

const AvatarEditPanel: React.FC<AvatarEditPanelProps> = ({ user, onSave, onRemove, onClose }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | undefined>(user.avatarUrl);
  const [loading, setLoading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    setLoading(true);
    try {
      const dataUrl = await compressImageToDataUrl(file, 256, 0.82);
      setPreview(dataUrl);
    } catch {
      alert('Could not read that image. Please try another file.');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-3 animate-in fade-in duration-150">
      <div className="flex items-center gap-3">
        <Avatar src={preview} name={user.name} size={56} />
        <div className="flex-1 space-y-1.5">
          <p className="text-[11px] font-semibold text-slate-700">
            Update photo for <span className="text-[#172b50]">{user.name}</span>
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-white bg-[#172b50] hover:bg-[#1f3763] rounded-lg transition-colors"
          >
            <ImagePlus className="w-3 h-3" />
            {loading ? 'Processing…' : 'Choose Photo'}
          </button>
          <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {preview && (
          <button
            type="button"
            onClick={() => {
              onSave(preview);
            }}
            className="flex-1 py-1.5 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
          >
            Save Photo
          </button>
        )}
        {user.avatarUrl && (
          <button
            type="button"
            onClick={onRemove}
            className="flex-1 py-1.5 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
          >
            Remove Photo
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="py-1.5 px-3 text-[11px] font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
