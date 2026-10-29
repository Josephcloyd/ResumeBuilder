import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useResumeStore } from './store/resumeStore';
import { useUI } from './store/uiStore';
import { Header } from './components/layout/Header';
import { ResumeEditor } from './components/editor/ResumeEditor';
import { ResumePreview } from './components/preview/ResumePreview';
import { MyResumesView } from './components/views/MyResumesView';
import { TemplatesView } from './components/views/TemplatesView';
import { ExportModal } from './components/pdf/ExportModal';
import { ConfirmModal, ToastContainer } from './components/common/ConfirmModal';
import { BugReportBubble } from './components/common/BugReportBubble';

/** Like getlaunchph.com: a short beat after the intro animation completes before fading out. */
const SPLASH_HOLD_AFTER_INTRO_MS = 200;
/** Never keep people waiting longer than this, even if animations stall (e.g. background tab). */
const SPLASH_MAX_WAIT_MS = 4000;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Resolves when every one-shot animation in the splash (emblem draw, letters, caption fade) has finished. */
function splashIntroFinished(splash: HTMLElement) {
  if (typeof splash.getAnimations !== 'function') return new Promise((r) => setTimeout(r, 2200));
  const oneShot = splash
    .getAnimations({ subtree: true })
    .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity);
  return Promise.all(oneShot.map((a) => a.finished.catch(() => undefined)));
}

/** Plays the #boot-splash intro in full, then fades it out and removes it. Returns a cleanup for useEffect. */
function dismissBootSplash() {
  const splash = document.getElementById('boot-splash');
  if (!splash) return undefined;

  if (prefersReducedMotion) {
    splash.remove();
    return undefined;
  }

  let cancelled = false;
  let leaveTimer: ReturnType<typeof setTimeout> | undefined;
  const maxWait = new Promise((r) => setTimeout(r, SPLASH_MAX_WAIT_MS));

  void Promise.race([splashIntroFinished(splash), maxWait]).then(() => {
    if (cancelled) return;
    leaveTimer = setTimeout(() => {
      splash.classList.add('is-leaving');
      splash.addEventListener('animationend', (e) => {
        if (e.target === splash) splash.remove();
      });
      setTimeout(() => splash.remove(), 900); // in case animationend never fires
    }, SPLASH_HOLD_AFTER_INTRO_MS);
  });

  return () => {
    cancelled = true;
    clearTimeout(leaveTimer);
  };
}

export const App: React.FC = () => {
  const { init, loaded } = useResumeStore();
  const { view, mobilePane, setMobilePane } = useUI();
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [editorWidth, setEditorWidth] = useState(() => {
    const saved = Number(localStorage.getItem('resumeflow:editorWidth'));
    return saved >= 34 && saved <= 58 ? saved : 44;
  });
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (loaded) return dismissBootSplash();
  }, [loaded]);

  const resizeEditor = useCallback((clientX: number) => {
    const workspace = workspaceRef.current;
    if (!workspace) return;

    const bounds = workspace.getBoundingClientRect();
    const nextWidth = ((clientX - bounds.left) / bounds.width) * 100;
    setEditorWidth(Math.min(58, Math.max(34, nextWidth)));
  }, []);

  const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    setIsResizing(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const finishResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setIsResizing(false);
    localStorage.setItem('resumeflow:editorWidth', String(Math.round(editorWidth)));
  };

  const handleDividerKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const direction = event.key === 'ArrowLeft' ? -2 : 2;
    setEditorWidth((width) => {
      const next = Math.min(58, Math.max(34, width + direction));
      localStorage.setItem('resumeflow:editorWidth', String(Math.round(next)));
      return next;
    });
  };

  // The boot splash in index.html covers the screen until resumes are loaded
  if (!loaded) return null;

  return (
    <div className="h-dvh w-full flex flex-col overflow-hidden bg-slate-50 font-sans">
      {/* Top Header */}
      <Header />

      {/* Main Viewport */}
      <main className="flex-1 overflow-hidden relative">
        {view === 'resumes' && (
          <div className="h-full overflow-y-auto scroll-thin">
            <MyResumesView />
          </div>
        )}

        {view === 'templates' && (
          <div className="h-full overflow-y-auto scroll-thin">
            <TemplatesView />
          </div>
        )}

        {view === 'builder' && <h1 className="sr-only">ResumeFlow resume builder</h1>}
        {view === 'builder' && (
          <div
            ref={workspaceRef}
            className={`h-full w-full flex overflow-hidden ${isResizing ? 'select-none cursor-col-resize' : ''}`}
          >
            {/* Left Panel: Resume Editor */}
            <div
              className={`h-full w-full shrink-0 ${
                mobilePane === 'editor' ? 'flex' : 'hidden lg:flex'
              } flex-col lg:w-[var(--editor-width)]`}
              style={{ '--editor-width': `${editorWidth}%` } as React.CSSProperties}
            >
              <ResumeEditor />
            </div>

            {/* Desktop resize handle */}
            <div
              role="separator"
              aria-label="Resize editor and preview panels"
              aria-orientation="vertical"
              aria-valuemin={34}
              aria-valuemax={58}
              aria-valuenow={Math.round(editorWidth)}
              tabIndex={0}
              onPointerDown={startResize}
              onPointerMove={(event) => isResizing && resizeEditor(event.clientX)}
              onPointerUp={finishResize}
              onPointerCancel={finishResize}
              onDoubleClick={() => {
                setEditorWidth(44);
                localStorage.setItem('resumeflow:editorWidth', '44');
              }}
              onKeyDown={handleDividerKeyDown}
              title="Drag to resize · Double-click to reset"
              className={`group relative hidden lg:flex w-3 shrink-0 cursor-col-resize items-center justify-center bg-slate-100 transition-colors hover:bg-blue-100 focus:bg-blue-100 focus:outline-none ${
                isResizing ? 'bg-blue-100' : ''
              }`}
            >
              <div className="h-12 w-1 rounded-full bg-slate-300 transition-all group-hover:h-16 group-hover:bg-brand group-focus:h-16 group-focus:bg-brand" />
            </div>

            {/* Right Panel: Live Preview */}
            <div
              className={`h-full flex-1 min-w-0 ${
                mobilePane === 'preview' ? 'flex' : 'hidden lg:flex'
              } flex-col`}
            >
              <ResumePreview />
            </div>
          </div>
        )}
      </main>

      {/* Phones/tablets: one-tap switch between editing and previewing */}
      {view === 'builder' && (
        <button
          type="button"
          onClick={() => setMobilePane(mobilePane === 'editor' ? 'preview' : 'editor')}
          className="btn btn-primary lg:hidden fixed bottom-4 left-1/2 z-30 h-11 -translate-x-1/2 rounded-full px-5 shadow-pop sm:bottom-5"
          data-no-pdf
        >
          {mobilePane === 'editor' ? (
            <>
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              Preview
            </>
          ) : (
            <>
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
              </svg>
              Edit
            </>
          )}
        </button>
      )}

      {/* Global Modals & Notifications */}
      <ExportModal />
      <ConfirmModal />
      <ToastContainer />
      <BugReportBubble />
    </div>
  );
};

export default App;
