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

export const App: React.FC = () => {
  const { init, loaded } = useResumeStore();
  const { view, mobilePane } = useUI();
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [editorWidth, setEditorWidth] = useState(() => {
    const saved = Number(localStorage.getItem('resumeflow:editorWidth'));
    return saved >= 34 && saved <= 58 ? saved : 44;
  });
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

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

  if (!loaded) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <div className="size-10 border-3 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-600 tracking-wide">
          Loading ResumeFlow...
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50 font-sans">
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
              className={`h-full flex-1 ${
                mobilePane === 'preview' ? 'flex' : 'hidden lg:flex'
              } flex-col`}
            >
              <ResumePreview />
            </div>
          </div>
        )}
      </main>

      {/* Global Modals & Notifications */}
      <ExportModal />
      <ConfirmModal />
      <ToastContainer />
      <BugReportBubble />
    </div>
  );
};

export default App;
