import React from 'react';
import { useResumeStore } from '../../store/resumeStore';
import { useUI } from '../../store/uiStore';
import { isGenericType } from '../../lib/defaults';
import { PersonalInfoEditor } from './PersonalInfoEditor';
import { SummaryEditor } from './SummaryEditor';
import { ExperienceEditor } from './ExperienceEditor';
import { EducationEditor } from './EducationEditor';
import { SkillsEditor } from './SkillsEditor';
import { ProjectsEditor } from './ProjectsEditor';
import { CertificationsEditor } from './CertificationsEditor';
import { GenericSectionEditor } from './GenericSectionEditor';
import { DesignSettings } from './DesignSettings';
import { SectionManager } from './SectionManager';
import { ResumeScore } from '../score/ResumeScore';
import { scoreResume } from '../../lib/score';
import { personalProgress, sectionProgress, type SectionProgress } from '../../lib/progress';

/** Small status pill next to a section title: ✓ + count when filled, amber when still empty. */
const ProgressBadge: React.FC<{ progress: SectionProgress }> = ({ progress }) => (
  <span
    className={`inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${
      progress.filled ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
    }`}
  >
    {progress.filled && (
      <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 6 9 17l-5-5"/>
      </svg>
    )}
    {progress.label}
  </span>
);

export const ResumeEditor: React.FC = () => {
  const { resume, update, undo, redo, past, future } = useResumeStore();
  const { editorTab, setEditorTab, openSectionId, setOpenSection } = useUI();

  const sections = resume.sections;
  const { scorePercent } = scoreResume(resume);
  const personal = personalProgress(resume);

  const toggleSection = (id: string) => {
    setOpenSection(openSectionId === id ? null : id);
  };

  return (
    <div className="flex flex-col h-full bg-surface border-r border-line overflow-hidden">
      {/* Resume name (rename in place) + undo/redo for screens where the header hides them */}
      <div className="flex items-center gap-2 px-3 pt-3 bg-slate-50/80">
        <label className="group flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-100 focus-within:bg-slate-100">
          <svg className="size-3.5 shrink-0 text-slate-400 group-hover:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
          </svg>
          <span className="sr-only">Resume name</span>
          <input
            value={resume.title}
            onChange={(e) => update((d) => { d.title = e.target.value; }, 'title')}
            onBlur={(e) => {
              if (!e.target.value.trim()) update((d) => { d.title = 'Untitled Resume'; }, 'title');
            }}
            placeholder="Untitled Resume"
            maxLength={80}
            title="Click to rename this resume"
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-slate-400"
          />
        </label>
        <div className="flex shrink-0 items-center gap-0.5 lg:hidden">
          <button
            type="button"
            onClick={undo}
            disabled={past.length === 0}
            className="icon-btn"
            aria-label="Undo"
            title="Undo"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={future.length === 0}
            className="icon-btn"
            aria-label="Redo"
            title="Redo"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="p-3 border-b border-line bg-slate-50/80 select-none">
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-100/80 p-1">
        <button
          type="button"
          onClick={() => setEditorTab('content')}
          aria-selected={editorTab === 'content'}
          className={`min-h-10 rounded-lg px-2 text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
            editorTab === 'content'
              ? 'bg-surface text-brand shadow-soft'
              : 'text-muted hover:bg-surface/60 hover:text-ink'
          }`}
        >
          <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          Content
        </button>

        <button
          type="button"
          onClick={() => setEditorTab('design')}
          aria-selected={editorTab === 'design'}
          className={`min-h-10 rounded-lg px-2 text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
            editorTab === 'design'
              ? 'bg-surface text-brand shadow-soft'
              : 'text-muted hover:bg-surface/60 hover:text-ink'
          }`}
        >
          <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
          </svg>
          Design
        </button>

        <button
          type="button"
          onClick={() => setEditorTab('score')}
          aria-selected={editorTab === 'score'}
          className={`min-h-10 rounded-lg px-2 text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
            editorTab === 'score'
              ? 'bg-surface text-brand shadow-soft'
              : 'text-muted hover:bg-surface/60 hover:text-ink'
          }`}
        >
          <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20"/><path d="m17 5-5-3-5 3"/><path d="m17 19-5 3-5-3"/><path d="M2 12h20"/>
          </svg>
          Review
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
              scorePercent >= 80 ? 'bg-emerald-100 text-emerald-800' : scorePercent >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'
            }`}
            title="Resume completeness score"
          >
            {scorePercent}%
          </span>
        </button>
        </div>
      </div>

      {/* Editor Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 pb-24 lg:pb-5 space-y-4 scroll-thin">
        {editorTab === 'design' && <DesignSettings />}
        {editorTab === 'score' && <ResumeScore />}

        {editorTab === 'content' && (
          <div className="space-y-4">
            {/* Section 1: Personal Info (Always first) */}
            <div id="editor-section-personal" className="scroll-mt-3 border border-line rounded-xl bg-surface shadow-soft overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => toggleSection('personal')}
                className="w-full px-4 py-3.5 bg-slate-50/70 hover:bg-slate-100/70 flex items-center justify-between gap-2 select-none cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-8 rounded-lg bg-brand-100 text-brand flex items-center justify-center shrink-0">
                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <span className="font-semibold text-sm text-ink truncate">
                    Personal Information
                  </span>
                  <ProgressBadge progress={personal} />
                </div>
                <svg
                  className={`size-4 text-slate-400 transition-transform ${openSectionId === 'personal' ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
              {openSectionId === 'personal' && (
                <div className="p-4 border-t border-line animate-fade-in">
                  <PersonalInfoEditor />
                </div>
              )}
            </div>

            {/* Dynamic Sections */}
            {sections.map((sec) => {
              const isOpen = openSectionId === sec.id;

              return (
                <div
                  key={sec.id}
                  id={`editor-section-${sec.id}`}
                  className={`scroll-mt-3 border border-line rounded-xl bg-surface shadow-soft overflow-hidden transition-all ${
                    !sec.visible ? 'opacity-60' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSection(sec.id)}
                    className="w-full px-4 py-3.5 bg-slate-50/70 hover:bg-slate-100/70 flex items-center justify-between gap-2 select-none cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-8 rounded-lg bg-brand-50 text-brand flex items-center justify-center shrink-0">
                        {sec.type === 'summary' && (
                          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="21" x2="3" y1="6" y2="6"/><line x1="15" x2="3" y1="12" y2="12"/><line x1="17" x2="3" y1="18" y2="18"/>
                          </svg>
                        )}
                        {sec.type === 'experience' && (
                          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                          </svg>
                        )}
                        {sec.type === 'education' && (
                          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
                          </svg>
                        )}
                        {sec.type === 'skills' && (
                          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>
                          </svg>
                        )}
                        {sec.type === 'projects' && (
                          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
                          </svg>
                        )}
                        {sec.type === 'certifications' && (
                          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
                          </svg>
                        )}
                        {sec.type !== 'summary' &&
                          sec.type !== 'experience' &&
                          sec.type !== 'education' &&
                          sec.type !== 'skills' &&
                          sec.type !== 'projects' &&
                          sec.type !== 'certifications' && (
                            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
                            </svg>
                          )}
                      </div>
                      <span className="font-semibold text-sm text-ink truncate">
                        {sec.title}
                      </span>
                      {!sec.visible ? (
                        <span className="text-[10px] text-muted bg-slate-100 px-1.5 py-0.5 rounded shrink-0">Hidden</span>
                      ) : (
                        <ProgressBadge progress={sectionProgress(sec)} />
                      )}
                    </div>

                    <svg
                      className={`size-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </button>

                  {isOpen && (
                    <div className="p-4 border-t border-line animate-fade-in">
                      {sec.type === 'summary' && <SummaryEditor sectionId={sec.id} />}
                      {sec.type === 'experience' && <ExperienceEditor sectionId={sec.id} />}
                      {sec.type === 'education' && <EducationEditor sectionId={sec.id} />}
                      {sec.type === 'skills' && <SkillsEditor sectionId={sec.id} />}
                      {sec.type === 'projects' && <ProjectsEditor sectionId={sec.id} />}
                      {sec.type === 'certifications' && <CertificationsEditor sectionId={sec.id} />}
                      {(isGenericType(sec.type) || sec.type === 'custom') && (
                        <GenericSectionEditor sectionId={sec.id} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Section Management Accordion Box */}
            <div className="border border-line rounded-xl bg-slate-50/50 p-4 shadow-soft">
              <SectionManager />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
