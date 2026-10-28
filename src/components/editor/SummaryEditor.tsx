import React from 'react';
import { useResumeStore, useSection } from '../../store/resumeStore';
import type { AlignOrInherit, SummarySection } from '../../types/resume';
import { RichTextEditor } from '../common/RichTextEditor';

interface SummaryEditorProps {
  sectionId: string;
}

export const SummaryEditor: React.FC<SummaryEditorProps> = ({ sectionId }) => {
  const section = useSection<SummarySection>(sectionId);
  const { updateSection } = useResumeStore();

  if (!section) return null;

  const rawText = (section.content || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
  const charCount = rawText.length;
  const wordCount = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;

  const handleContentChange = (content: string) => {
    updateSection(sectionId, (s) => {
      (s as SummarySection).content = content;
    }, 'summary.content');
  };

  const handleAlignChange = (align: AlignOrInherit) => {
    updateSection(sectionId, (s) => {
      s.align = align;
    }, 'summary.align');
  };

  const handleTitleChange = (title: string) => {
    updateSection(sectionId, (s) => {
      s.title = title;
    }, 'summary.title');
  };

  return (
    <div className="space-y-3.5">
      {/* Optional Title customization */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <label className="field-label">Section Title</label>
          <input
            type="text"
            value={section.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="input text-xs font-semibold"
          />
        </div>

        {/* Text Alignment */}
        <div>
          <label className="field-label">Alignment</label>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {(['left', 'center', 'right', 'justify'] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => handleAlignChange(a)}
                className={`size-7 rounded flex items-center justify-center transition-all ${
                  section.align === a
                    ? 'bg-surface text-brand shadow-soft font-bold'
                    : 'text-muted hover:text-ink'
                }`}
                title={`Align ${a}`}
              >
                {a === 'left' && (
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="21" x2="3" y1="6" y2="6"/><line x1="15" x2="3" y1="12" y2="12"/><line x1="17" x2="3" y1="18" y2="18"/>
                  </svg>
                )}
                {a === 'center' && (
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" x2="6" y1="6" y2="6"/><line x1="21" x2="3" y1="12" y2="12"/><line x1="18" x2="6" y1="18" y2="18"/>
                  </svg>
                )}
                {a === 'right' && (
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="21" x2="3" y1="6" y2="6"/><line x1="21" x2="9" y1="12" y2="12"/><line x1="21" x2="7" y1="18" y2="18"/>
                  </svg>
                )}
                {a === 'justify' && (
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rich Text Editor */}
      <div>
        <label className="field-label">Summary / Objective</label>
        <RichTextEditor
          value={section.content}
          onChange={handleContentChange}
          placeholder="e.g. Computer Engineering student specializing in software development, embedded systems, cloud technologies..."
          minHeight={100}
        />
        {/* Character & Word counter */}
        <div className="flex justify-between items-center text-[11px] text-muted mt-1.5 px-1">
          <span>Recommended: 200–500 characters</span>
          <span>{wordCount} words · {charCount} characters</span>
        </div>
      </div>
    </div>
  );
};
