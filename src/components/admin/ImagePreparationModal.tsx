import React, { useState, useRef, useEffect } from 'react';
import { processTransparentAsset, ProcessImageOptions } from '../../lib/imageProcessor';
import { SignatureAsset, StampAsset } from '../../types';
import {
  Upload,
  Crop,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Sun,
  Eye,
  ShieldCheck,
  X
} from 'lucide-react';

interface ImagePreparationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAsset: (asset: {
    name: string;
    type: 'signature' | 'stamp';
    imageUrl: string;
    originalImageUrl: string;
    ownerName?: string;
    ownerRole?: string;
    department: string;
    opacity: number;
  }) => void;
  initialType?: 'signature' | 'stamp';
}

export const ImagePreparationModal: React.FC<ImagePreparationModalProps> = ({
  isOpen,
  onClose,
  onSaveAsset,
  initialType = 'signature'
}) => {
  if (!isOpen) return null;

  const [assetType, setAssetType] = useState<'signature' | 'stamp'>(initialType);
  const [assetName, setAssetName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerRole, setOwnerRole] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');

  // Original and processed image data
  const [originalDataUrl, setOriginalDataUrl] = useState<string>('');
  const [processedDataUrl, setProcessedDataUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Background preview mode
  const [previewBg, setPreviewBg] = useState<'checkerboard' | 'white' | 'parchment'>('checkerboard');

  // Options
  const [removeWhite, setRemoveWhite] = useState(true);
  const [whiteThreshold, setWhiteThreshold] = useState(235);
  const [smoothEdges, setSmoothEdges] = useState(true);
  const [cropMargins, setCropMargins] = useState(true);
  const [opacity, setOpacity] = useState(0.95);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Run processing whenever options change
  const applyProcessing = async (sourceUrl: string) => {
    if (!sourceUrl) return;
    setIsProcessing(true);
    try {
      const opts: ProcessImageOptions = {
        removeWhiteBackground: removeWhite,
        whiteThreshold,
        smoothEdges,
        cropMargins,
        opacity
      };
      const result = await processTransparentAsset(sourceUrl, opts);
      setProcessedDataUrl(result.processedDataUrl);
    } catch (e: any) {
      console.error('Processing error:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelected = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setOriginalDataUrl(dataUrl);
      if (!assetName) {
        setAssetName(file.name.replace(/\.[^/.]+$/, ''));
      }
      applyProcessing(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!processedDataUrl) {
      alert('Please upload an image asset first.');
      return;
    }
    if (!assetName.trim()) {
      alert('Please provide a name for this asset.');
      return;
    }

    onSaveAsset({
      name: assetName.trim(),
      type: assetType,
      imageUrl: processedDataUrl,
      originalImageUrl: originalDataUrl,
      ownerName: assetType === 'signature' ? ownerName.trim() || 'Authorized Officer' : undefined,
      ownerRole: assetType === 'signature' ? ownerRole.trim() || 'Staff Authority' : undefined,
      department,
      opacity
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Interactive Signature & Stamp Asset Preparation Tool
            </h2>
            <p className="text-xs text-slate-500">
              Extract transparent PNG assets with canvas-level background thresholding, edge antialiasing, and margin trimming.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Asset Configuration & Canvas Settings */}
          <div className="md:col-span-5 space-y-4">
            {/* Asset Type Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 block">
                Asset Classification:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAssetType('signature')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-colors ${
                    assetType === 'signature'
                      ? 'border-[#172b50] bg-blue-50/50 text-[#172b50]'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Electronic Signature
                </button>
                <button
                  type="button"
                  onClick={() => setAssetType('stamp')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-colors ${
                    assetType === 'stamp'
                      ? 'border-[#172b50] bg-blue-50/50 text-[#172b50]'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Official Seal / Stamp
                </button>
              </div>
            </div>

            {/* Asset Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-800 block">
                Asset Name / Description:
              </label>
              <input
                type="text"
                placeholder={assetType === 'signature' ? "Dean Wright's Signature" : 'Academic Registrar Seal'}
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]"
              />
            </div>

            {/* If Signature: Owner & Role */}
            {assetType === 'signature' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800 block">
                    Signatory Name:
                  </label>
                  <input
                    type="text"
                    placeholder="Prof. Eleanor Wright"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800 block">
                    Official Role / Title:
                  </label>
                  <input
                    type="text"
                    placeholder="Head of Department"
                    value={ownerRole}
                    onChange={(e) => setOwnerRole(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]"
                  />
                </div>
              </div>
            )}

            {/* Department */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-800 block">
                Authorized Department / Office:
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#172b50]"
              >
                <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                <option value="Office of the University Registrar">Office of the University Registrar</option>
                <option value="Student Affairs & Hostels">Student Affairs & Hostels</option>
                <option value="Finance & Accounts Office">Finance & Accounts Office</option>
                <option value="Academic Affairs Directorate">Academic Affairs Directorate</option>
              </select>
            </div>

            {/* Upload Area */}
            <div className="pt-2">
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Upload Scanned Source Image:
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-[#172b50] rounded-xl p-5 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-slate-100/60"
              >
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                <span className="text-xs font-semibold text-slate-700 block">
                  Click to select PNG or JPEG
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Accepts white-paper scans or pre-existing PNGs
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelected(file);
                  }}
                  className="hidden"
                />
              </div>
            </div>

            {/* Image Processing Controls */}
            {originalDataUrl && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 pt-3">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#172b50]" />
                  Transparency & Margin Filters
                </h4>

                {/* Remove White Background Toggle */}
                <div className="space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={removeWhite}
                      onChange={(e) => {
                        setRemoveWhite(e.target.checked);
                        applyProcessing(originalDataUrl);
                      }}
                      className="w-4 h-4 text-[#172b50] rounded"
                    />
                    <span>Remove Plain White Background</span>
                  </label>
                  <p className="text-[10px] text-slate-500 pl-6">
                    Scans pixels for near-white luminance and converts them to transparent alpha.
                  </p>
                </div>

                {/* White Threshold Slider */}
                {removeWhite && (
                  <div className="space-y-1 pl-6">
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>Luminance Threshold:</span>
                      <span className="font-mono font-bold">{whiteThreshold} / 255</span>
                    </div>
                    <input
                      type="range"
                      min="180"
                      max="254"
                      value={whiteThreshold}
                      onChange={(e) => {
                        setWhiteThreshold(Number(e.target.value));
                        applyProcessing(originalDataUrl);
                      }}
                      className="w-full accent-[#172b50]"
                    />
                  </div>
                )}

                {/* Margin Cropping */}
                <div className="space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={cropMargins}
                      onChange={(e) => {
                        setCropMargins(e.target.checked);
                        applyProcessing(originalDataUrl);
                      }}
                      className="w-4 h-4 text-[#172b50] rounded"
                    />
                    <span>Auto-Crop Unnecessary Margins</span>
                  </label>
                  <p className="text-[10px] text-slate-500 pl-6">
                    Trims surrounding empty canvas space while preserving aspect ratio.
                  </p>
                </div>

                {/* Opacity Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Document Ink Opacity:</span>
                    <span className="font-mono font-bold">{Math.round(opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.0"
                    step="0.05"
                    value={opacity}
                    onChange={(e) => {
                      setOpacity(Number(e.target.value));
                      applyProcessing(originalDataUrl);
                    }}
                    className="w-full accent-[#172b50]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Dual-Canvas Preview */}
          <div className="md:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Live Result Inspection
              </span>

              {/* Background switcher */}
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setPreviewBg('checkerboard')}
                  className={`px-2 py-1 rounded transition-colors ${
                    previewBg === 'checkerboard' ? 'bg-white shadow-xs font-semibold text-slate-900' : 'text-slate-600'
                  }`}
                >
                  Transparency Grid
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewBg('white')}
                  className={`px-2 py-1 rounded transition-colors ${
                    previewBg === 'white' ? 'bg-white shadow-xs font-semibold text-slate-900' : 'text-slate-600'
                  }`}
                >
                  White Paper
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewBg('parchment')}
                  className={`px-2 py-1 rounded transition-colors ${
                    previewBg === 'parchment' ? 'bg-white shadow-xs font-semibold text-slate-900' : 'text-slate-600'
                  }`}
                >
                  Parchment
                </button>
              </div>
            </div>

            {/* Preview Box */}
            <div
              className={`h-72 rounded-xl border border-slate-300 relative flex items-center justify-center p-6 overflow-hidden ${
                previewBg === 'checkerboard'
                  ? 'bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0]'
                  : previewBg === 'white'
                  ? 'bg-white'
                  : 'bg-amber-50/70 border-amber-200'
              }`}
            >
              {isProcessing && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex items-center justify-center z-20">
                  <span className="text-xs font-semibold text-slate-700 animate-pulse">
                    Processing canvas pixels...
                  </span>
                </div>
              )}

              {processedDataUrl ? (
                <img
                  src={processedDataUrl}
                  alt="Processed Transparent Preview"
                  className="max-h-full max-w-full object-contain filter drop-shadow-xs"
                />
              ) : (
                <div className="text-center text-slate-400 text-xs">
                  <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <span>Upload an image to inspect transparency output</span>
                </div>
              )}
            </div>

            {/* Core Requirement Policy Notice */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>Institutional Security Notice:</strong> Verify that intentional white crest lines or emblem text in official seals have not been erroneously stripped before approving.
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!processedDataUrl}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#172b50] hover:bg-[#1f3763] disabled:bg-slate-300 rounded-lg transition-colors shadow-xs"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Store Approved Transparent Asset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
