import React, { useCallback, useEffect, useState } from 'react';
import { useResumeStore } from '../../store/resumeStore';
import { useUI } from '../../store/uiStore';
import { DonationModal } from '../common/DonationModal';
import { BrandLogo } from '../common/BrandLogo';

export const Header: React.FC = () => {
  const [donationOpen, setDonationOpen] = useState(false);
  const { saveStatus, saveNow, undo, redo, past, future, newResume } = useResumeStore();
  const {
    view,
    setView,
    setExportOpen,
    mobilePane,
    setMobilePane,
    ask,
    toast,
    theme,
    toggleTheme,
  } = useUI();
  const closeDonation = useCallback(() => setDonationOpen(false), []);

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

  const navTabs = (
    <nav className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-lg" aria-label="Main views">
      {(
        [
          ['resumes', 'My Resumes', 'Resumes'],
          ['templates', 'Templates', 'Templates'],
          ['builder', 'Builder', 'Builder'],
        ] as const
      ).map(([id, label, shortLabel]) => (
        <button
          key={id}
          onClick={() => setView(id)}
          aria-current={view === id ? 'page' : undefined}
          className={`flex-1 md:flex-none px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold rounded-md whitespace-nowrap transition-all ${
            view === id ? 'bg-surface text-brand shadow-soft' : 'text-muted hover:text-ink'
          }`}
        >
          <span className="sm:hidden">{shortLabel}</span>
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </nav>
  );

  const paneSwitcher = (
    <div className="flex shrink-0 bg-slate-100 p-0.5 rounded-lg border border-slate-200/70" role="group" aria-label="Builder pane">
      <button
        onClick={() => setMobilePane('editor')}
        aria-pressed={mobilePane === 'editor'}
        className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-md transition-all ${          mobilePane === 'editor' ? 'bg-surface text-brand shadow-soft' : 'text-muted'
        }`}
      >
        Editor
      </button>
      <button
        onClick={() => setMobilePane('preview')}
        aria-pressed={mobilePane === 'preview'}
        className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-md transition-all ${          mobilePane === 'preview' ? 'bg-surface text-brand shadow-soft' : 'text-muted'
        }`}
      >
        Preview
      </button>
    </div>
  );

  return (
    <header className="border-b border-line bg-surface sticky top-0 z-40 shadow-xs select-none">
      <div className="h-14 px-3 sm:px-5 flex items-center justify-between gap-2">
        {/* Left: Brand Logo & Navigation */}
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <div
            onClick={() => setView('builder')}
            className="cursor-pointer transition-transform hover:scale-[1.02] shrink-0"
            title="ResumeFlow by GetLaunchPH"
          >
            <BrandLogo onDark={theme === 'dark'} />
          </div>

          {/* View Nav Tabs (tablet & desktop; phones get them in a second row) */}
          <div className="hidden md:block">{navTabs}</div>
        </div>

        {/* Middle: Save Status & Undo/Redo (Desktop) */}
        <div className="hidden lg:flex items-center gap-3">
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
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Pane switcher for tablets; phones get it in the second row */}
          {view === 'builder' && <div className="hidden md:flex lg:hidden mr-1">{paneSwitcher}</div>}

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
            type="button"
            onClick={toggleTheme}
            className="icon-btn"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
              </svg>
            ) : (
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
            )}
          </button>

          <button
            onClick={() => saveNow().then(() => toast('Resume saved to local library', 'success'))}
            className="btn btn-secondary btn-sm px-2 sm:px-2.5"
            title="Save to local browser storage"
            aria-label="Save resume"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
            </svg>
            <span className="hidden sm:inline">Save</span>
          </button>

          <button
            type="button"
            onClick={() => setDonationOpen(true)}
            className="btn btn-sm px-2 sm:px-2.5 border border-amber-200 bg-amber-50 text-amber-800 shadow-soft hover:border-amber-300 hover:bg-amber-100"
            title="Support ResumeFlow through GCash"
            aria-label="Donate through GCash"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 21s-7-4.35-9.33-8.24C.83 9.69 2.1 5.5 5.74 4.42 7.93 3.77 10.2 4.6 12 6.45c1.8-1.85 4.07-2.68 6.26-2.03 3.64 1.08 4.91 5.27 3.07 8.34C19 16.65 12 21 12 21Z"/>
            </svg>
            <span className="hidden xl:inline">Donate</span>
          </button>

          <button
            onClick={() => setExportOpen(true)}
            className="btn btn-primary btn-sm shadow-soft px-2 sm:px-2.5"
            title="Export resume as PDF"
            aria-label="Download PDF"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
            </svg>
            <span className="hidden sm:inline">Download PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>
      </div>

      {/* Phones: view tabs + editor/preview switcher on a second row */}
      <div className="md:hidden flex flex-wrap items-center gap-2 px-3 pb-2">
        <div className="grow basis-52 [&>nav]:w-full">{navTabs}</div>
        {view === 'builder' && paneSwitcher}
      </div>

      <DonationModal open={donationOpen} onClose={closeDonation} />
    </header>
  );
};
