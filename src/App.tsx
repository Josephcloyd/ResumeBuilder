import React, { useEffect } from 'react';
import { useResumeStore } from './store/resumeStore';
import { useUI } from './store/uiStore';
import { Header } from './components/layout/Header';
import { ResumeEditor } from './components/editor/ResumeEditor';
import { ResumePreview } from './components/preview/ResumePreview';
import { MyResumesView } from './components/views/MyResumesView';
import { TemplatesView } from './components/views/TemplatesView';
import { ExportModal } from './components/pdf/ExportModal';
import { ConfirmModal, ToastContainer } from './components/common/ConfirmModal';

export const App: React.FC = () => {
  const { init, loaded } = useResumeStore();
  const { view, mobilePane } = useUI();

  useEffect(() => {
    init();
  }, [init]);

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
          <div className="h-full w-full flex overflow-hidden">
            {/* Left Panel: Resume Editor */}
            <div
              className={`h-full w-full lg:w-[38%] xl:w-[36%] shrink-0 ${
                mobilePane === 'editor' ? 'flex' : 'hidden lg:flex'
              } flex-col`}
            >
              <ResumeEditor />
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
    </div>
  );
};

export default App;
