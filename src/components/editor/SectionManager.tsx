import React, { useState } from 'react';
import { useResumeStore } from '../../store/resumeStore';
import { useUI } from '../../store/uiStore';
import { GENERIC_TYPES, SECTION_META } from '../../lib/defaults';
import type { SectionType } from '../../types/resume';

export const SectionManager: React.FC = () => {
  const { resume, updateSection, removeSection, duplicateSection, moveSection, addSection } = useResumeStore();
  const { openSectionId, setOpenSection, ask, toast } = useUI();
  const [showAddMenu, setShowAddMenu] = useState(false);

  const sections = resume.sections;

  // Find generic types not yet added (or duplicable)
  const existingTypes = new Set(sections.map((s) => s.type));
  const availableTypes: SectionType[] = [
    'custom',
    ...GENERIC_TYPES.filter((t) => SECTION_META[t].duplicable || !existingTypes.has(t)),
  ];

  const handleAdd = (type: SectionType) => {
    const newId = addSection(type);
    setShowAddMenu(false);
    setOpenSection(newId);
    toast(`Added ${SECTION_META[type].label}`, 'success');
  };

  const handleDelete = async (id: string, title: string) => {
    const ok = await ask({
      title: 'Remove Section?',
      message: `Are you sure you want to remove "${title}"? Any entries in this section will be removed.`,
      confirmLabel: 'Remove',
      danger: true,
    });
    if (ok) {
      removeSection(id);
      if (openSectionId === id) setOpenSection('personal');
      toast(`Removed ${title}`, 'info');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-ink">Manage Sections</h4>
          <p className="text-xs text-muted">Reorder, hide, rename, or add custom sections</p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="btn btn-primary btn-sm flex items-center gap-1.5"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14"/><path d="M5 12h14"/>
            </svg>
            Add Section
          </button>

          {showAddMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-line rounded-xl shadow-pop p-1.5 z-30 max-h-80 overflow-y-auto divide-y divide-slate-100 animate-pop-in">
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => handleAdd('custom')}
                  className="w-full text-left px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand-50 rounded-lg flex items-center gap-2"
                >
                  <svg className="size-3.5 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14"/><path d="M5 12h14"/>
                  </svg>
                  + Custom Section
                </button>
              </div>

              <div className="py-1">
                <span className="block px-3 py-1 text-[10px] font-semibold text-muted uppercase tracking-wider">
                  Optional Sections
                </span>
                {availableTypes
                  .filter((t) => t !== 'custom')
                  .map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleAdd(type)}
                      className="w-full text-left px-3 py-1.5 text-xs text-ink hover:bg-slate-50 hover:text-brand rounded-lg flex items-center justify-between"
                    >
                      <span>{SECTION_META[type].label}</span>
                      <span className="text-[10px] text-muted">+ Add</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sections List with Reorder Controls */}
      <div className="space-y-1.5 bg-white border border-line rounded-xl p-2 shadow-soft">
        {/* Personal info is pinned at top */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="size-2 rounded-full bg-brand" />
            <span className="text-xs font-semibold text-ink">Personal Information (Header)</span>
          </div>
          <span className="text-[11px] font-medium text-muted bg-white px-2 py-0.5 rounded border border-slate-200">
            Pinned
          </span>
        </div>

        {/* Dynamic Sections */}
        {sections.map((sec, idx) => {
          const meta = SECTION_META[sec.type];
          return (
            <div
              key={sec.id}
              className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                sec.visible ? 'bg-white border-line shadow-xs' : 'bg-slate-50 border-dashed border-slate-300 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {/* Visible Toggle */}
                <button
                  type="button"
                  onClick={() => updateSection(sec.id, (s) => { s.visible = !s.visible; })}
                  className={`icon-btn size-7 text-xs ${sec.visible ? 'text-brand' : 'text-slate-400'}`}
                  title={sec.visible ? 'Hide section from resume' : 'Show section on resume'}
                >
                  {sec.visible ? (
                    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  ) : (
                    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>
                    </svg>
                  )}
                </button>

                <div className="min-w-0">
                  <span className="text-xs font-semibold text-ink block truncate">{sec.title}</span>
                  <span className="text-[10px] text-muted capitalize">{meta?.label || sec.type}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {/* Column placement selector for 2-column templates */}
                {resume.layout.columns === 2 && (
                  <button
                    type="button"
                    onClick={() => updateSection(sec.id, (s) => { s.column = s.column === 'main' ? 'side' : 'main'; })}
                    className="px-2 py-0.5 text-[10px] font-medium rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 capitalize"
                    title="Change column"
                  >
                    {sec.column} Col
                  </button>
                )}

                {/* Move up / down */}
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveSection(idx, idx - 1)}
                  className="icon-btn size-7 text-xs disabled:opacity-30"
                  title="Move Up"
                >
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m18 15-6-6-6 6"/>
                  </svg>
                </button>
                <button
                  type="button"
                  disabled={idx === sections.length - 1}
                  onClick={() => moveSection(idx, idx + 1)}
                  className="icon-btn size-7 text-xs disabled:opacity-30"
                  title="Move Down"
                >
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </button>

                {/* Duplicate */}
                <button
                  type="button"
                  onClick={() => duplicateSection(sec.id)}
                  className="icon-btn size-7 text-xs text-slate-500 hover:text-ink"
                  title="Duplicate Section"
                >
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                  </svg>
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDelete(sec.id, sec.title)}
                  className="icon-btn size-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                  title="Delete Section"
                >
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
