import React, { useRef, useState } from 'react';
import type { ImageAsset } from '../../types/resume';
import { processUpload, renderCrop } from '../../lib/image';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (asset: ImageAsset) => void;
  initialAsset?: ImageAsset | null;
  title?: string;
  fixedAspect?: number; // e.g. 1 for circle/square profile photo
  allowAspectChange?: boolean;
}

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialAsset,
  title = 'Upload & Crop Image',
  fixedAspect = 0,
  allowAspectChange = true,
}) => {
  const [asset, setAsset] = useState<ImageAsset | null>(initialAsset || null);
  const [zoom, setZoom] = useState(initialAsset?.crop?.zoom || 1);
  const [aspect, setAspect] = useState(fixedAspect || initialAsset?.crop?.aspect || 0);
  const [cx, setCx] = useState(initialAsset?.crop?.cx ?? 0.5);
  const [cy, setCy] = useState(initialAsset?.crop?.cy ?? 0.5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; startCx: number; startCy: number } | null>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setError(null);
    setIsProcessing(true);
    try {
      const processed = await processUpload(file);
      setAsset(processed);
      setZoom(1);
      setCx(0.5);
      setCy(0.5);
    } catch (err: any) {
      setError(err?.message || 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!asset) return;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startCx: cx,
      startCy: cy,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStartRef.current || !asset) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    // Map drag pixels to normalized coordinates
    const sens = 0.0015 / zoom;
    setCx(Math.min(0.9, Math.max(0.1, dragStartRef.current.startCx - dx * sens)));
    setCy(Math.min(0.9, Math.max(0.1, dragStartRef.current.startCy - dy * sens)));
  };

  const handleMouseUp = () => {
    dragStartRef.current = null;
  };

  const handleConfirm = async () => {
    if (!asset) return;
    setIsProcessing(true);
    try {
      const crop = { aspect, zoom, cx, cy };
      const croppedSrc = await renderCrop(asset, crop);
      onSave({
        ...asset,
        src: croppedSrc,
        crop,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error saving cropped image');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="card w-full max-w-lg bg-white shadow-pop overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="font-semibold text-ink text-base flex items-center gap-2">
            <svg className="size-4.5 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
            {title}
          </h3>
          <button onClick={onClose} className="icon-btn" title="Close">
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-2">
              <svg className="size-4 shrink-0 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {!asset ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-brand rounded-xl p-8 text-center cursor-pointer bg-slate-50/60 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center gap-3"
            >
              <div className="size-12 rounded-full bg-blue-100/80 text-brand flex items-center justify-center">
                <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Click or drag image here</p>
                <p className="text-xs text-muted mt-1">PNG, JPG, JPEG or WEBP (Max 5 MB)</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview Crop Viewport */}
              <div
                className="relative w-full h-64 bg-slate-900 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing select-none flex items-center justify-center"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img
                  src={asset.original}
                  alt="Crop preview"
                  draggable={false}
                  className="max-none transition-transform pointer-events-none"
                  style={{
                    transform: `scale(${zoom}) translate(${(0.5 - cx) * 100}%, ${(0.5 - cy) * 100}%)`,
                    maxHeight: '100%',
                    maxWidth: '100%',
                  }}
                />
                <div className="absolute inset-0 pointer-events-none border-2 border-white/40 shadow-[0_0_0_9999px_rgba(15,23,42,0.6)]" style={{ margin: '16px' }} />
                <span className="absolute bottom-2 right-2 text-[10px] text-white/80 bg-slate-900/70 px-2 py-0.5 rounded backdrop-blur-xs">
                  Drag to reposition
                </span>
              </div>

              {/* Controls */}
              <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-line">
                {/* Zoom */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-700 w-12">Zoom</span>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="flex-1 accent-brand h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs text-muted w-10 text-right">{Math.round(zoom * 100)}%</span>
                </div>

                {/* Aspect ratio */}
                {allowAspectChange && (
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                    <span className="text-xs font-medium text-slate-700 mr-2">Aspect:</span>
                    {[
                      { label: 'Free', val: 0 },
                      { label: '1:1 Square', val: 1 },
                      { label: '4:3', val: 4 / 3 },
                      { label: '16:9', val: 16 / 9 },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setAspect(opt.val)}
                        className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${aspect === opt.val ? 'bg-brand text-white shadow-soft' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Replace Image Button */}
              <div className="flex justify-between items-center pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-secondary btn-sm"
                >
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><line x1="16" x2="22" y1="5" y2="5"/><line x1="19" x2="19" y1="2" y2="8"/>
                  </svg>
                  Replace Image
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-slate-50 border-t border-line">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            disabled={!asset || isProcessing}
            onClick={handleConfirm}
            className="btn btn-primary"
          >
            {isProcessing ? 'Processing...' : 'Apply Image'}
          </button>
        </div>
      </div>
    </div>
  );
};
