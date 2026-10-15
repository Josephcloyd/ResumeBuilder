import React, { useState } from 'react';
import { useResumeStore, useSection } from '../../store/resumeStore';
import type { EducationItem, EducationSection } from '../../types/resume';
import { newEducation } from '../../lib/defaults';
import { RichTextEditor } from '../common/RichTextEditor';

interface EducationEditorProps {
  sectionId: string;
}

export const EducationEditor: React.FC<EducationEditorProps> = ({ sectionId }) => {
  const section = useSection<EducationSection>(sectionId);
  const { updateSection } = useResumeStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!section) return null;

  const items = section.items || [];

  const handleAddItem = () => {
    const item = newEducation({
      degree: 'Bachelor of Science',
      program: 'Computer Engineering',
      school: 'University Name',
      startYear: '2023',
      endYear: '2027',
    });
    updateSection(sectionId, (s) => {
      (s as EducationSection).items.push(item);
    });
    setExpandedId(item.id);
  };

  const handleUpdateItem = (itemId: string, patch: Partial<EducationItem>) => {
    updateSection(sectionId, (s) => {
      const idx = (s as EducationSection).items.findIndex((i) => i.id === itemId);
      if (idx >= 0) {
        Object.assign((s as EducationSection).items[idx], patch);
      }
    }, `edu.${itemId}`);
  };

  const handleDeleteItem = (itemId: string) => {
    updateSection(sectionId, (s) => {
      (s as EducationSection).items = (s as EducationSection).items.filter((i) => i.id !== itemId);
    });
  };

  const handleMoveItem = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= items.length) return;
    updateSection(sectionId, (s) => {
      const list = (s as EducationSection).items;
      const [it] = list.splice(fromIdx, 1);
      list.splice(toIdx, 0, it);
    });
  };

  return (
    <div className="space-y-3.5">
      {/* Section Title */}
      <div>
        <label className="field-label">Section Title</label>
        <input
          type="text"
          value={section.title}
          onChange={(e) => updateSection(sectionId, (s) => { s.title = e.target.value; })}
          className="input text-xs font-semibold"
        />
      </div>

      {/* Items List */}
      {items.length === 0 ? (
        <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <p className="text-xs text-muted mb-3">No education added yet.</p>
          <button type="button" onClick={handleAddItem} className="btn btn-secondary btn-sm">
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14"/><path d="M5 12h14"/>
            </svg>
            Add Education
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
                    <span className="size-5 rounded-full bg-brand-100 text-brand text-[11px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-xs text-ink truncate">
                      {item.degree || item.program ? `${item.degree} ${item.program}`.trim() : 'Degree / Program'}
                    </span>
                    {item.school && (
                      <span className="text-xs text-muted truncate">
                        · {item.school}
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
                  <div className="p-4 space-y-3.5 border-t border-line animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="field-label">Degree</label>
                        <input
                          type="text"
                          value={item.degree}
                          onChange={(e) => handleUpdateItem(item.id, { degree: e.target.value })}
                          placeholder="e.g. Bachelor of Science"
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="field-label">Course / Program</label>
                        <input
                          type="text"
                          value={item.program}
                          onChange={(e) => handleUpdateItem(item.id, { program: e.target.value })}
                          placeholder="e.g. Computer Engineering"
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="field-label">School / University *</label>
                        <input
                          type="text"
                          value={item.school}
                          onChange={(e) => handleUpdateItem(item.id, { school: e.target.value })}
                          placeholder="e.g. University of San Carlos"
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="field-label">Location</label>
                        <input
                          type="text"
                          value={item.location}
                          onChange={(e) => handleUpdateItem(item.id, { location: e.target.value })}
                          placeholder="e.g. Cebu City, Philippines"
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="field-label">Start Year</label>
                        <input
                          type="text"
                          value={item.startYear}
                          onChange={(e) => handleUpdateItem(item.id, { startYear: e.target.value })}
                          placeholder="e.g. 2023"
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="field-label">Graduation Year</label>
                        <input
                          type="text"
                          value={item.endYear}
                          onChange={(e) => handleUpdateItem(item.id, { endYear: e.target.value })}
                          placeholder="e.g. 2027 (or Expected)"
                          className="input"
                        />
                      </div>
                    </div>

                    {/* Honors / Description */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="field-label mb-0">Honors, GPA or Key Activities</label>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted">Align:</span>
                          {(['left', 'center', 'right', 'justify'] as const).map((a) => (
                            <button
                              key={a}
                              type="button"
                              onClick={() => handleUpdateItem(item.id, { align: a })}
                              className={`px-1.5 py-0.5 text-[10px] rounded capitalize ${
                                item.align === a
                                  ? 'bg-brand text-white font-semibold'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {a}
                            </button>
                          ))}
                        </div>
                      </div>
                      <RichTextEditor
                        value={item.description}
                        onChange={(val) => handleUpdateItem(item.id, { description: val })}
                        placeholder="e.g. Dean's Lister, Cum Laude, Relevant Coursework: Data Structures, Embedded Systems..."
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
          Add Another Education
        </button>
      )}
    </div>
  );
};
