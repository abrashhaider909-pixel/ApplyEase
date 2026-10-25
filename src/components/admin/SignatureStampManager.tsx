import React, { useState } from 'react';
import { useApplyEaseStore } from '../../lib/store';
import { isSigningTitle } from '../../lib/access';
import { ImagePreparationModal } from './ImagePreparationModal';
import { SignatureAsset, StampAsset } from '../../types';
import { DEPARTMENTS } from '../../lib/constants';
import {
  PenTool,
  Shield,
  PlusCircle,
  Pencil,
  Trash2,
  X,
  CheckCircle2
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────── */
/* Inline metadata-edit modal (name, owner, role, department — no image swap) */
/* ─────────────────────────────────────────────────────────────────────────── */
interface EditSignatureModalProps {
  sig: SignatureAsset;
  onSave: (changes: Partial<SignatureAsset>) => void;
  onClose: () => void;
}
const EditSignatureModal: React.FC<EditSignatureModalProps> = ({ sig, onSave, onClose }) => {
  const [name, setName] = useState(sig.name);
  const [ownerName, setOwnerName] = useState(sig.ownerName);
  const [ownerRole, setOwnerRole] = useState(sig.ownerRole);
  const [department, setDepartment] = useState(sig.department);
  const [opacity, setOpacity] = useState(sig.opacity);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !ownerName.trim()) {
      alert('Name and signatory name are required.');
      return;
    }
    onSave({ name: name.trim(), ownerName: ownerName.trim(), ownerRole: ownerRole.trim(), department, opacity });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-[#172b50]" />
            <h3 className="text-sm font-bold text-slate-900">Edit Signature Asset</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        {/* Image preview (read-only — use "Upload new" to replace image) */}
        <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="w-28 h-14 rounded-lg border border-slate-200 bg-[linear-gradient(45deg,#f8fafc_25%,transparent_25%),linear-gradient(-45deg,#f8fafc_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f8fafc_75%),linear-gradient(-45deg,transparent_75%,#f8fafc_75%)] bg-[size:10px_10px] flex items-center justify-center p-1 shrink-0">
            <img src={sig.imageUrl} alt={sig.name} className="max-h-full max-w-full object-contain" />
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            To replace the image, delete this asset and upload a new one via "Upload & Prepare Transparent Asset".
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">Asset Name:</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Signatory Name:</label>
              <input type="text" required value={ownerName} onChange={e => setOwnerName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Official Role / Title:</label>
              <input type="text" value={ownerRole} onChange={e => setOwnerRole(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">Department:</label>
            <select value={department} onChange={e => setDepartment(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]">
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Ink Opacity:</span>
              <span className="font-mono font-bold">{Math.round(opacity * 100)}%</span>
            </div>
            <input type="range" min="0.5" max="1" step="0.05" value={opacity}
              onChange={e => setOpacity(Number(e.target.value))} className="w-full accent-[#172b50]" />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#172b50] hover:bg-[#1f3763] rounded-lg shadow-xs">
              <CheckCircle2 className="w-4 h-4" />Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* Same for Stamp                                                              */
/* ─────────────────────────────────────────────────────────────────────────── */
interface EditStampModalProps {
  stamp: StampAsset;
  onSave: (changes: Partial<StampAsset>) => void;
  onClose: () => void;
}
const EditStampModal: React.FC<EditStampModalProps> = ({ stamp, onSave, onClose }) => {
  const [name, setName] = useState(stamp.name);
  const [department, setDepartment] = useState(stamp.department);
  const [opacity, setOpacity] = useState(stamp.opacity);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { alert('Name is required.'); return; }
    onSave({ name: name.trim(), department, opacity });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-[#172b50]" />
            <h3 className="text-sm font-bold text-slate-900">Edit Stamp / Seal</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="w-16 h-16 rounded-lg border border-slate-200 bg-[linear-gradient(45deg,#f8fafc_25%,transparent_25%),linear-gradient(-45deg,#f8fafc_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f8fafc_75%),linear-gradient(-45deg,transparent_75%,#f8fafc_75%)] bg-[size:10px_10px] flex items-center justify-center p-1 shrink-0">
            <img src={stamp.imageUrl} alt={stamp.name} className="max-h-full max-w-full object-contain" />
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Delete and re-upload to replace the seal image.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">Seal Name:</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">Issuing Department:</label>
            <select value={department} onChange={e => setDepartment(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]">
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Opacity:</span>
              <span className="font-mono font-bold">{Math.round(opacity * 100)}%</span>
            </div>
            <input type="range" min="0.5" max="1" step="0.05" value={opacity}
              onChange={e => setOpacity(Number(e.target.value))} className="w-full accent-[#172b50]" />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#172b50] hover:bg-[#1f3763] rounded-lg shadow-xs">
              <CheckCircle2 className="w-4 h-4" />Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* Main manager                                                                */
/* ─────────────────────────────────────────────────────────────────────────── */
export const SignatureStampManager: React.FC = () => {
  const {
    signatures, stamps,
    addSignatureAsset, updateSignatureAsset, deleteSignatureAsset,
    addStampAsset, updateStampAsset, deleteStampAsset,
    toggleAssetActive
  } = useApplyEaseStore();

  const [activeTab, setActiveTab] = useState<'signatures' | 'stamps'>('signatures');
  const [isPrepModalOpen, setIsPrepModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<'signature' | 'stamp'>('signature');

  // Edit modals
  const [editingSig, setEditingSig] = useState<SignatureAsset | null>(null);
  const [editingStamp, setEditingStamp] = useState<StampAsset | null>(null);

  const handleOpenPrepModal = (type: 'signature' | 'stamp') => {
    setModalInitialType(type);
    setIsPrepModalOpen(true);
  };

  const handleSaveAsset = (asset: {
    name: string; type: 'signature' | 'stamp';
    imageUrl: string; originalImageUrl: string;
    ownerName?: string; ownerRole?: string;
    department: string; opacity: number;
  }) => {
    const randomHash = 'sha256-' + Math.random().toString(36).substring(2, 10) + Date.now().toString(16);
    if (asset.type === 'signature') {
      addSignatureAsset({
        id: `sig-${Date.now()}`, name: asset.name, type: 'signature',
        imageUrl: asset.imageUrl, originalImageUrl: asset.originalImageUrl,
        ownerName: asset.ownerName || 'Authorized Officer',
        ownerRole: asset.ownerRole || 'Staff Member',
        department: asset.department, isTransparent: true,
        opacity: asset.opacity, active: true,
        createdAt: new Date().toISOString(), auditHash: randomHash
      });
    } else {
      addStampAsset({
        id: `stamp-${Date.now()}`, name: asset.name, type: 'stamp',
        imageUrl: asset.imageUrl, originalImageUrl: asset.originalImageUrl,
        department: asset.department, isTransparent: true,
        opacity: asset.opacity, active: true,
        createdAt: new Date().toISOString(), auditHash: randomHash
      });
    }
  };

  const confirmDeleteSig = (sig: SignatureAsset) => {
    if (confirm(`Permanently delete signature "${sig.name}"? This cannot be undone.`)) {
      deleteSignatureAsset(sig.id);
    }
  };

  const confirmDeleteStamp = (stamp: StampAsset) => {
    if (confirm(`Permanently delete seal "${stamp.name}"? This cannot be undone.`)) {
      deleteStampAsset(stamp.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Institutional Signatures & Official Stamp Registry
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Upload, edit, and manage transparent digital signature and seal assets. Use the pencil icon to edit metadata or the bin to permanently remove an asset.
          </p>
        </div>
        <button
          onClick={() => handleOpenPrepModal(activeTab === 'signatures' ? 'signature' : 'stamp')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#172b50] hover:bg-[#1f3763] rounded-lg transition-colors shadow-xs shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Upload & Prepare Transparent Asset
        </button>
      </div>

      {/* Authority rule */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[11px] text-slate-600 leading-relaxed">
        <strong className="text-slate-800">Signing authority:</strong> signatures and seals are
        applied only by the head of the department that owns the stage. The administrator issues
        these assets here but cannot use them, and faculty cannot sign on a department's behalf.
        Assets whose owner is not a department head remain on record but cannot be applied.
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {(['signatures', 'stamps'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`pb-3 text-xs font-semibold transition-colors relative flex items-center gap-2 ${
              activeTab === tab ? 'text-slate-900 border-b-2 border-[#172b50]' : 'text-slate-500 hover:text-slate-800'
            }`}>
            {tab === 'signatures' ? <PenTool className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
            <span>{tab === 'signatures' ? `Authorized Signatures (${signatures.length})` : `Official University Seals (${stamps.length})`}</span>
          </button>
        ))}
      </div>

      {/* ── Signatures tab ── */}
      {activeTab === 'signatures' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {signatures.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">No signature assets yet. Upload one above.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {signatures.map((sig) => (
                <div key={sig.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* Transparent preview */}
                    <div className="w-32 h-16 rounded-lg border border-slate-200 bg-[linear-gradient(45deg,#f8fafc_25%,transparent_25%),linear-gradient(-45deg,#f8fafc_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f8fafc_75%),linear-gradient(-45deg,transparent_75%,#f8fafc_75%)] bg-[size:10px_10px] flex items-center justify-center p-1.5 shrink-0">
                      <img src={sig.imageUrl} alt={sig.name} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-slate-900">{sig.name}</h4>
                        {sig.active
                          ? <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">Active</span>
                          : <span className="text-[10px] font-semibold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded">Revoked</span>}
                      </div>
                      <p className="text-xs text-slate-600">
                        Signatory: <strong>{sig.ownerName}</strong> ({sig.ownerRole}) · {sig.department}
                      </p>
                      {!isSigningTitle(sig.ownerRole) && (
                        <p className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 inline-block mt-1">
                          Not a signing officer — cannot be applied
                        </p>
                      )}
                      <p className="text-[10px] font-mono text-slate-400 mt-1">
                        {sig.auditHash} · Added {new Date(sig.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => setEditingSig(sig)}
                      className="p-1.5 text-slate-500 hover:text-[#172b50] hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit signature metadata"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleAssetActive(sig.id, 'signature', !sig.active)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        sig.active
                          ? 'text-rose-700 border-rose-200 hover:bg-rose-50'
                          : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      {sig.active ? 'Revoke' : 'Restore'}
                    </button>
                    <button
                      onClick={() => confirmDeleteSig(sig)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Permanently delete this signature asset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Stamps tab ── */}
      {activeTab === 'stamps' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {stamps.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">No seal assets yet. Upload one above.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {stamps.map((stamp) => (
                <div key={stamp.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-lg border border-slate-200 bg-[linear-gradient(45deg,#f8fafc_25%,transparent_25%),linear-gradient(-45deg,#f8fafc_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f8fafc_75%),linear-gradient(-45deg,transparent_75%,#f8fafc_75%)] bg-[size:10px_10px] flex items-center justify-center p-1.5 shrink-0">
                      <img src={stamp.imageUrl} alt={stamp.name} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-slate-900">{stamp.name}</h4>
                        {stamp.active
                          ? <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">Active</span>
                          : <span className="text-[10px] font-semibold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded">Revoked</span>}
                      </div>
                      <p className="text-xs text-slate-600">
                        Issuing Authority: <strong>{stamp.department}</strong>
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">
                        {stamp.auditHash} · Added {new Date(stamp.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => setEditingStamp(stamp)}
                      className="p-1.5 text-slate-500 hover:text-[#172b50] hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit seal metadata"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleAssetActive(stamp.id, 'stamp', !stamp.active)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        stamp.active
                          ? 'text-rose-700 border-rose-200 hover:bg-rose-50'
                          : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      {stamp.active ? 'Revoke' : 'Restore'}
                    </button>
                    <button
                      onClick={() => confirmDeleteStamp(stamp)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Permanently delete this seal asset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload modal */}
      <ImagePreparationModal
        isOpen={isPrepModalOpen}
        onClose={() => setIsPrepModalOpen(false)}
        onSaveAsset={handleSaveAsset}
        initialType={modalInitialType}
      />

      {/* Edit modals */}
      {editingSig && (
        <EditSignatureModal
          sig={editingSig}
          onSave={(changes) => { updateSignatureAsset(editingSig.id, changes); setEditingSig(null); }}
          onClose={() => setEditingSig(null)}
        />
      )}
      {editingStamp && (
        <EditStampModal
          stamp={editingStamp}
          onSave={(changes) => { updateStampAsset(editingStamp.id, changes); setEditingStamp(null); }}
          onClose={() => setEditingStamp(null)}
        />
      )}
    </div>
  );
};
