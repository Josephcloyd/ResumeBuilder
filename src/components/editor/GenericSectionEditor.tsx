import React, { useState } from 'react';
import { useResumeStore, useSection } from '../../store/resumeStore';
import type {
  CertImagePosition,
  CertImageSize,
  CustomSection,
  GenericItem,
  GenericSection,
  Section,
} from '../../types/resume';
import { SECTION_META, newGeneric } from '../../lib/defaults';
import { RichTextEditor } from '../common/RichTextEditor';
import { ImageUploadModal } from '../common/ImageUploadModal';

interface GenericSectionEditorProps {
  sectionId: string;
}

export const GenericSectionEditor: React.FC<GenericSectionEditorProps> = ({ sectionId }) => {
  const section = useSection<Section>(sectionId);
  const { updateSection } = useResumeStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeImageItemId, setActiveImageItemId] = useState<string | null>(null);

  if (!section) return null;

  const isCustom = section.type === 'custom';
  const meta = SECTION_META[section.type];

  // Custom section handler
  if (isCustom) {
    const custSec = section as CustomSection;
    return (
      <div className="space-y-3.5">
        <div>
          <label className="field-label">Section Title</label>
          <input
            type="text"
            value={custSec.title}
            onChange={(e) => updateSection(sectionId, (s) => { s.title = e.target.value; })}
            className="input text-xs font-semibold"
          />
        </div>
        <div>
          <label className="field-label">Content</label>
          <RichTextEditor
            value={custSec.content}
            onChange={(val) => updateSection(sectionId, (s) => { (s as CustomSection).content = val; })}
            placeholder="Write your custom section content here..."
            minHeight={120}
            showAlignControls={true}
            align={custSec.align === 'inherit' ? 'left' : custSec.align}
            onAlignChange={(a) => updateSection(sectionId, (s) => { s.align = a; })}
          />
        </div>
      </div>
    );
  }

  const genSec = section as GenericSection;
  const items = genSec.items || [];
  const fields = meta?.fields || { title: 'Title', subtitle: 'Subtitle' };

  const handleAddItem = () => {
    const item = newGeneric({
      title: section.type === 'languages' ? 'Language' : 'Title',
      subtitle: section.type === 'languages' ? 'Fluent' : '',
    });
    updateSection(sectionId, (s) => {
      (s as GenericSection).items.push(item);
    });
    setExpandedId(item.id);
  };

  const handleUpdateItem = (itemId: string, patch: Partial<GenericItem>) => {
    updateSection(sectionId, (s) => {
      const idx = (s as GenericSection).items.findIndex((i) => i.id === itemId);
      if (idx >= 0) {
        Object.assign((s as GenericSection).items[idx], patch);
      }
    }, `gen.${itemId}`);
  };

  const handleDeleteItem = (itemId: string) => {
    updateSection(sectionId, (s) => {
      (s as GenericSection).items = (s as GenericSection).items.filter((i) => i.id !== itemId);
    });
  };

  const handleMoveItem = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= items.length) return;
    updateSection(sectionId, (s) => {
      const list = (s as GenericSection).items;
      const [it] = list.splice(fromIdx, 1);
      list.splice(toIdx, 0, it);
    });
  };

  const currentModalItem = items.find((i) => i.id === activeImageItemId);

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="field-label">Section Title</label>
        <input
          type="text"
          value={section.title}
          onChange={(e) => updateSection(sectionId, (s) => { s.title = e.target.value; })}
          className="input text-xs font-semibold"
        />
      </div>

      {/* Items list */}
      {items.length === 0 ? (
        <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <p className="text-xs text-muted mb-3">{meta?.emptyText || 'No items added yet.'}</p>
          <button type="button" onClick={handleAddItem} className="btn btn-secondary btn-sm">
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14"/><path d="M5 12h14"/>
            </svg>
            {meta?.addLabel || 'Add Item'}
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
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
                      {item.title || fields.title || 'Untitled'}
                    </span>
                    {item.subtitle && (
                      <span className="text-xs text-muted truncate">
                        · {item.subtitle}
                      </span>
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
                      title="Delete Entry"
                    >
                      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Form fields */}
                {isExpanded && (
                  <div className="p-4 space-y-3 border-t border-line animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="field-label">{fields.title || 'Title'} *</label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleUpdateItem(item.id, { title: e.target.value })}
                          className="input"
                        />
                      </div>

                      {fields.subtitle && (
                        <div>
                          <label className="field-label">{fields.subtitle}</label>
                          <input
                            type="text"
                            value={item.subtitle}
                            onChange={(e) => handleUpdateItem(item.id, { subtitle: e.target.value })}
                            className="input"
                          />
                        </div>
                      )}

                      {fields.location && (
                        <div>
                          <label className="field-label">{fields.location}</label>
                          <input
                            type="text"
                            value={item.location}
                            onChange={(e) => handleUpdateItem(item.id, { location: e.target.value })}
                            className="input"
                          />
                        </div>
                      )}

                      {fields.date && (
                        <div>
                          <label className="field-label">{fields.date}</label>
                          <input
                            type="text"
                            value={item.date}
                            onChange={(e) => handleUpdateItem(item.id, { date: e.target.value })}
                            className="input"
                          />
                        </div>
                      )}

                      {fields.url && (
                        <div>
                          <label className="field-label">{fields.url}</label>
                          <input
                            type="text"
                            value={item.url}
                            onChange={(e) => handleUpdateItem(item.id, { url: e.target.value })}
                            className="input"
                          />
                        </div>
                      )}
                    </div>

                    {/* Image support for Awards, Training, Seminars, Achievements */}
                    {meta?.images && (
                      <div className="bg-slate-50 border border-line rounded-lg p-3 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Supporting Image / Certificate / Badge
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
                              alt="Proof preview"
                              className="h-12 w-16 object-cover rounded border border-slate-300"
                            />
                          ) : (
                            <div className="h-12 w-16 rounded border border-dashed border-slate-300 bg-slate-100 flex items-center justify-center text-slate-400">
                              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                                <circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                              </svg>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => setActiveImageItemId(item.id)}
                            className="btn btn-secondary btn-sm"
                          >
                            {item.image ? 'Replace / Crop Image' : 'Upload Image / Proof'}
                          </button>
                        </div>

                        {item.image && (
                          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                            <div>
                              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Image Size</label>
                              <select
                                value={item.imageSize}
                                onChange={(e) => handleUpdateItem(item.id, { imageSize: e.target.value as CertImageSize })}
                                className="input h-8 text-xs"
                              >
                                <option value="small">Small Thumbnail</option>
                                <option value="medium">Medium</option>
                                <option value="large">Large</option>
                                <option value="full">Full Width</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Placement</label>
                              <select
                                value={item.imagePosition}
                                onChange={(e) => handleUpdateItem(item.id, { imagePosition: e.target.value as CertImagePosition })}
                                className="input h-8 text-xs"
                              >
                                <option value="right">Right</option>
                                <option value="left">Left</option>
                                <option value="below">Below</option>
                                <option value="above">Above</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Description if field exists and not inline */}
                    {fields.description && (
                      <div>
                        <label className="field-label">{fields.description}</label>
                        <RichTextEditor
                          value={item.description}
                          onChange={(val) => handleUpdateItem(item.id, { description: val })}
                          placeholder="Details or notes..."
                          minHeight={56}
                        />
                      </div>
                    )}
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
          {meta?.addLabel || 'Add Entry'}
        </button>
      )}

      {/* Image Modal */}
      {activeImageItemId && currentModalItem && (
        <ImageUploadModal
          isOpen={Boolean(activeImageItemId)}
          onClose={() => setActiveImageItemId(null)}
          initialAsset={currentModalItem.image}
          allowAspectChange={true}
          title="Upload Supporting Image"
          onSave={(asset) => {
            handleUpdateItem(activeImageItemId, {
              image: asset,
              imageSize: currentModalItem.imageSize === 'hidden' ? 'small' : currentModalItem.imageSize,
            });
          }}
        />
      )}
    </div>
  );
};
