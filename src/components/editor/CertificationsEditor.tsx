import React, { useState } from 'react';
import { useResumeStore, useSection } from '../../store/resumeStore';
import type {
  CertDisplayMode,
  CertificationItem,
  CertificationsSection,
  CertImagePosition,
  CertImageSize,
} from '../../types/resume';
import { newCertification } from '../../lib/defaults';
import { RichTextEditor } from '../common/RichTextEditor';
import { ImageUploadModal } from '../common/ImageUploadModal';

interface CertificationsEditorProps {
  sectionId: string;
}

export const CertificationsEditor: React.FC<CertificationsEditorProps> = ({ sectionId }) => {
  const section = useSection<CertificationsSection>(sectionId);
  const { updateSection } = useResumeStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeImageCertId, setActiveImageCertId] = useState<string | null>(null);

  if (!section) return null;

  const items = section.items || [];

  const handleAddItem = () => {
    const item = newCertification({
      name: 'AWS Certified Cloud Practitioner',
      organization: 'Amazon Web Services',
      issueDate: '2026-06',
    });
    updateSection(sectionId, (s) => {
      (s as CertificationsSection).items.push(item);
    });
    setExpandedId(item.id);
  };

  const handleUpdateItem = (itemId: string, patch: Partial<CertificationItem>) => {
    updateSection(sectionId, (s) => {
      const idx = (s as CertificationsSection).items.findIndex((i) => i.id === itemId);
      if (idx >= 0) {
        Object.assign((s as CertificationsSection).items[idx], patch);
      }
    }, `cert.${itemId}`);
  };

  const handleDeleteItem = (itemId: string) => {
    updateSection(sectionId, (s) => {
      (s as CertificationsSection).items = (s as CertificationsSection).items.filter((i) => i.id !== itemId);
    });
  };

  const handleMoveItem = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= items.length) return;
    updateSection(sectionId, (s) => {
      const list = (s as CertificationsSection).items;
      const [it] = list.splice(fromIdx, 1);
      list.splice(toIdx, 0, it);
    });
  };

  const currentModalItem = items.find((i) => i.id === activeImageCertId);

  return (
    <div className="space-y-4">
      {/* Section Header Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div>
          <label className="field-label">Section Title</label>
          <input
            type="text"
            value={section.title}
            onChange={(e) => updateSection(sectionId, (s) => { s.title = e.target.value; })}
            className="input text-xs font-semibold"
          />
        </div>

        <div>
          <label className="field-label">Display Mode</label>
          <select
            value={section.displayMode}
            onChange={(e) => updateSection(sectionId, (s) => { (s as CertificationsSection).displayMode = e.target.value as CertDisplayMode; })}
            className="input text-xs"
          >
            <option value="imageText">Image + Details</option>
            <option value="text">Text Only</option>
            <option value="gallery">Image Gallery Grid</option>
          </select>
        </div>

        {section.displayMode === 'gallery' && (
          <div>
            <label className="field-label">Gallery Grid Columns</label>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {([1, 2, 3] as const).map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => updateSection(sectionId, (s) => { (s as CertificationsSection).galleryColumns = col; })}
                  className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${
                    section.galleryColumns === col
                      ? 'bg-white text-brand shadow-soft font-semibold'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {col} Col
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Items List */}
      {items.length === 0 ? (
        <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <p className="text-xs text-muted mb-3">No certificates added yet.</p>
          <button type="button" onClick={handleAddItem} className="btn btn-secondary btn-sm">
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14"/><path d="M5 12h14"/>
            </svg>
            Add Certificate
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => {
            const isExpanded = expandedId === item.id || (items.length === 1 && expandedId === null);
            return (
              <div key={item.id} className="border border-line rounded-xl bg-white overflow-hidden shadow-soft transition-all">
                {/* Header row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-100/70 cursor-pointer flex items-center justify-between select-none"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="size-5 rounded-full bg-blue-100 text-brand text-[11px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-xs text-ink truncate">
                      {item.name || item.certificationName || 'Certificate Name'}
                    </span>
                    {item.organization && (
                      <span className="text-xs text-muted truncate">
                        · {item.organization}
                      </span>
                    )}
                    {item.image && (
                      <span className="size-2 rounded-full bg-emerald-500" title="Image attached" />
                    )}
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveItem(idx, idx - 1)}
                      className="icon-btn size-7 text-xs disabled:opacity-30"
                      title="Move Up"
                    >
                      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m18 15-6-6-6 6"/>
                      </svg>
                    </button>
                    <button
                      type="button"
                      disabled={idx === items.length - 1}
                      onClick={() => handleMoveItem(idx, idx + 1)}
                      className="icon-btn size-7 text-xs disabled:opacity-30"
                      title="Move Down"
                    >
                      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="icon-btn size-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Delete Certificate"
                    >
                      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Form fields */}
                {isExpanded && (
                  <div className="p-4 space-y-3.5 border-t border-line animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="field-label">Certificate Name *</label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                          placeholder="e.g. AWS Certified Cloud Practitioner"
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="field-label">Issuing Organization</label>
                        <input
                          type="text"
                          value={item.organization}
                          onChange={(e) => handleUpdateItem(item.id, { organization: e.target.value })}
                          placeholder="e.g. Amazon Web Services, Coursera"
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="field-label">Issue Date</label>
                        <input
                          type="text"
                          value={item.issueDate}
                          onChange={(e) => handleUpdateItem(item.id, { issueDate: e.target.value })}
                          placeholder="e.g. 2026-06"
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="field-label">Expiration Date (Optional)</label>
                        <input
                          type="text"
                          value={item.expirationDate}
                          onChange={(e) => handleUpdateItem(item.id, { expirationDate: e.target.value })}
                          placeholder="e.g. 2029-06 or No Expiration"
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="field-label">Credential ID</label>
                        <input
                          type="text"
                          value={item.credentialId}
                          onChange={(e) => handleUpdateItem(item.id, { credentialId: e.target.value })}
                          placeholder="e.g. AWS-CCP-0193"
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="field-label">Credential URL (Clickable link in PDF)</label>
                        <input
                          type="text"
                          value={item.credentialUrl}
                          onChange={(e) => handleUpdateItem(item.id, { credentialUrl: e.target.value })}
                          placeholder="e.g. https://aws.amazon.com/verification/..."
                          className="input"
                        />
                      </div>
                    </div>

                    {/* Certificate Image Upload & Position Controls */}
                    <div className="bg-slate-50 border border-line rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Certificate Image / Proof
                        </span>
                        {item.image && (
                          <button
                            type="button"
                            onClick={() => handleUpdateItem(item.id, { image: null })}
                            className="text-xs text-red-600 hover:text-red-700 font-medium"
                          >
                            Remove Image
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img
                            src={item.image.src}
                            alt="Certificate preview"
                            className="h-14 w-20 object-cover rounded border border-slate-300 shadow-xs"
                          />
                        ) : (
                          <div className="h-14 w-20 rounded border border-dashed border-slate-300 bg-slate-100 flex items-center justify-center text-slate-400">
                            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                              <circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                            </svg>
                          </div>
                        )}

                        <div className="flex-1 space-y-2">
                          <button
                            type="button"
                            onClick={() => setActiveImageCertId(item.id)}
                            className="btn btn-secondary btn-sm"
                          >
                            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
                            </svg>
                            {item.image ? 'Replace / Crop Image' : 'Upload Certificate Scanned Image'}
                          </button>
                        </div>
                      </div>

                      {/* Display Size & Position Options */}
                      {item.image && (
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                          <div>
                            <label className="text-[11px] font-medium text-slate-600 mb-1 block">Image Size</label>
                            <select
                              value={item.imageSize}
                              onChange={(e) => handleUpdateItem(item.id, { imageSize: e.target.value as CertImageSize })}
                              className="input h-8 text-xs"
                            >
                              <option value="hidden">Hide Certificate Image</option>
                              <option value="small">Small Thumbnail (90px)</option>
                              <option value="medium">Medium Thumbnail (170px)</option>
                              <option value="large">Large Image (280px)</option>
                              <option value="full">Full Width</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-slate-600 mb-1 block">Image Placement</label>
                            <select
                              value={item.imagePosition}
                              onChange={(e) => handleUpdateItem(item.id, { imagePosition: e.target.value as CertImagePosition })}
                              className="input h-8 text-xs"
                            >
                              <option value="below">Below Information</option>
                              <option value="above">Above Information</option>
                              <option value="left">Left of Information</option>
                              <option value="right">Right of Information</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="field-label">Description / Summary of Certification</label>
                      <RichTextEditor
                        value={item.description}
                        onChange={(val) => handleUpdateItem(item.id, { description: val })}
                        placeholder="Key skills validated, modules completed..."
                        minHeight={60}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Button */}
      {items.length > 0 && (
        <button
          type="button"
          onClick={handleAddItem}
          className="btn btn-secondary btn-sm w-full"
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14"/><path d="M5 12h14"/>
          </svg>
          Add Another Certificate
        </button>
      )}

      {/* Modal for cropping and uploading certificate image */}
      {activeImageCertId && currentModalItem && (
        <ImageUploadModal
          isOpen={Boolean(activeImageCertId)}
          onClose={() => setActiveImageCertId(null)}
          initialAsset={currentModalItem.image}
          allowAspectChange={true}
          title="Upload Certificate Image"
          onSave={(asset) => {
            handleUpdateItem(activeImageCertId, {
              image: asset,
              imageSize: currentModalItem.imageSize === 'hidden' ? 'medium' : currentModalItem.imageSize,
            });
          }}
        />
      )}
    </div>
  );
};
