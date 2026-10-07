import React, { useEffect } from 'react';
import { useResumeStore } from '../../store/resumeStore';
import { useUI } from '../../store/uiStore';

export const Header: React.FC = () => {
  const { saveStatus, saveNow, undo, redo, past, future, newResume } = useResumeStore();
  const {
    view,
    setView,
    setExportOpen,
    mobilePane,
    setMobilePane,
    ask,
    toast,
  } = useUI();

  // Keyboard shortcuts for Undo and Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept inside input / textarea / contenteditable unless Ctrl
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          redo();
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          saveNow().then(() => toast('Resume saved!', 'success'));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, saveNow, toast]);

  const handleNewResume = async () => {
    const ok = await ask({
      title: 'Create New Resume?',
      message: 'Starting a new resume will clear the current editor. Make sure your current resume is saved.',
      confirmLabel: 'Create New Resume',
      danger: true,
    });
    if (ok) {
      await newResume('Untitled Resume');
      toast('Created new blank resume', 'info');
    }
  };

  return (
    <header className="h-14 border-b border-line bg-white sticky top-0 z-40 px-3 sm:px-5 flex items-center justify-between shadow-xs select-none">
      {/* Left: Brand Logo & Navigation */}
      <div className="flex items-center gap-3 sm:gap-6">
        <div
          onClick={() => setView('builder')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="size-8 rounded-lg bg-brand flex items-center justify-center text-white shadow-soft transition-transform group-hover:scale-105">
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
              <path d="m9 15 2 2 4-4"/>
            </svg>
          </div>
          <span className="font-bold text-ink text-base tracking-tight hidden xs:inline-block">
            Resume<span className="text-brand">Flow</span>
          </span>
        </div>

        {/* View Nav Tabs */}
        <nav className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-lg">
          <button
            onClick={() => setView('builder')}
            className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              view === 'builder'
                ? 'bg-white text-brand shadow-soft'
                : 'text-muted hover:text-ink'
            }`}
          >
            Builder
          </button>
          <button
            onClick={() => setView('resumes')}
            className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              view === 'resumes'
                ? 'bg-white text-brand shadow-soft'
                : 'text-muted hover:text-ink'
            }`}
          >
            My Resumes
          </button>
          <button
            onClick={() => setView('templates')}
            className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              view === 'templates'
                ? 'bg-white text-brand shadow-soft'
                : 'text-muted hover:text-ink'
            }`}
          >
            Templates
          </button>
        </nav>
      </div>

      {/* Middle: Save Status & Undo/Redo (Desktop) */}
      <div className="hidden md:flex items-center gap-3">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200/70">
          <button
            onClick={undo}
            disabled={past.length === 0}
            className="icon-btn size-7 text-xs disabled:opacity-30"
            title="Undo (Ctrl+Z)"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
            </svg>
          </button>
          <button
            onClick={redo}
            disabled={future.length === 0}
            className="icon-btn size-7 text-xs disabled:opacity-30"
            title="Redo (Ctrl+Y)"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>
            </svg>
          </button>
        </div>

        {/* Save Status Indicator */}
        <div className="flex items-center gap-1.5 text-xs text-muted font-medium px-2 py-1 rounded bg-slate-50 border border-slate-200/50">
          {saveStatus === 'saving' ? (
            <>
              <div className="size-2 rounded-full bg-amber-400 animate-ping" />
              <span>Saving...</span>
            </>
          ) : saveStatus === 'saved' ? (
            <>
              <div className="size-2 rounded-full bg-emerald-500" />
              <span>All changes saved</span>
            </>
          ) : (
            <>
              <div className="size-2 rounded-full bg-slate-400" />
              <span>Ready</span>
            </>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Mobile Pane Switcher (only in Builder view on small screens) */}
        {view === 'builder' && (
          <div className="flex lg:hidden bg-slate-100 p-0.5 rounded-lg border border-slate-200/70 mr-1">
            <button
              onClick={() => setMobilePane('editor')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${
                mobilePane === 'editor' ? 'bg-white text-brand shadow-soft' : 'text-muted'
              }`}
            >
              Editor
            </button>
            <button
              onClick={() => setMobilePane('preview')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${
                mobilePane === 'preview' ? 'bg-white text-brand shadow-soft' : 'text-muted'
              }`}
            >
              Preview
            </button>
          </div>
        )}

        <button
          onClick={handleNewResume}
          className="btn btn-ghost btn-sm hidden sm:inline-flex"
          title="New blank resume"
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14"/><path d="M5 12h14"/>
          </svg>
          New
        </button>

        <button
          onClick={() => saveNow().then(() => toast('Resume saved to local library', 'success'))}
          className="btn btn-secondary btn-sm"
          title="Save to local browser storage"
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
          </svg>
          <span className="hidden xs:inline">Save</span>
        </button>

        <button
          onClick={() => setExportOpen(true)}
          className="btn btn-primary btn-sm shadow-soft"
          title="Export resume as PDF"
        >
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
          </svg>
          <span>Download PDF</span>
        </button>
      </div>
    </header>
  );
};
