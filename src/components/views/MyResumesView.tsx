import React, { useRef, useState } from 'react';
import { useResumeStore } from '../../store/resumeStore';
import { useUI } from '../../store/uiStore';
import { pageSizeById } from '../../lib/constants';
import { downloadBlob } from '../../lib/storage';
import { formatLongDate, safeFileName } from '../../lib/format';
import { exportResumeToPDF } from '../../lib/pdf';
import { validateResumeImportData, validateResumeImportFile } from '../../lib/security';

export const MyResumesView: React.FC = () => {
  const {
    resume,
    library,
    openResume,
    deleteFromLibrary,
    duplicateInLibrary,
    renameInLibrary,
    newResume,
    importResume,
    clearAllLocalData,
  } = useResumeStore();
  const { setView, ask, toast } = useUI();

  const [search, setSearch] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const jsonInputRef = useRef<HTMLInputElement>(null);

  const filtered = library.filter((r) =>
    (r.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.personal.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.personal.professionalTitle || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateNew = async () => {
    const ok = await ask({
      title: 'Create New Resume?',
      message: 'Start a fresh resume. Make sure your current changes are saved.',
      confirmLabel: 'Create',
    });
    if (ok) {
      await newResume('Untitled Resume');
      setView('builder');
      toast('Created new blank resume', 'info');
    }
  };

  const handleEdit = async (id: string) => {
    await openResume(id);
    setView('builder');
  };

  const handleDelete = async (id: string, title: string) => {
    const ok = await ask({
      title: 'Delete Resume?',
      message: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      confirmLabel: 'Delete Resume',
      danger: true,
    });
    if (ok) {
      await deleteFromLibrary(id);
      toast(`Deleted "${title}"`, 'info');
    }
  };

  const handleExportJSON = (r: typeof resume) => {
    const data = JSON.stringify(r, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    downloadBlob(blob, `${safeFileName(r.title || 'Resume')}_data.json`);
    toast('Resume data exported as JSON', 'success');
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      validateResumeImportFile(file);
      const parsed: unknown = JSON.parse(await file.text());
      validateResumeImportData(parsed);
      await importResume(parsed);
      setView('builder');
      toast('Resume imported successfully!', 'success');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Invalid ResumeFlow JSON file.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleQuickDownload = async (r: typeof resume) => {
    try {
      toast('Generating PDF...', 'info');
      await exportResumeToPDF(r, {
        fileName: `${safeFileName(r.personal.fullName || r.title)}_Resume.pdf`,
      });
      toast('PDF Downloaded!', 'success');
    } catch {
      // If it's not active in DOM, open it first then export
      await openResume(r.id);
      setView('builder');
      toast('Opened resume. Please click Download PDF.', 'info');
    }
  };

  const handleClearLocalData = async () => {
    const confirmed = await ask({
      title: 'Delete your local résumé data?',
      message: 'This permanently removes your saved résumés and uploaded images from this browser. The two built-in sample résumés will remain available. Export anything you want to keep first.',
      confirmLabel: 'Delete My Data',
      danger: true,
    });
    if (!confirmed) return;

    await clearAllLocalData();
    setView('resumes');
    toast('Your local résumé data was deleted. The samples were kept.', 'info');
  };

  const startRename = (id: string, currentTitle: string) => {
    setRenamingId(id);
    setNewTitle(currentTitle);
  };

  const commitRename = async (id: string) => {
    if (newTitle.trim()) {
      await renameInLibrary(id, newTitle.trim());
      toast('Resume renamed', 'success');
    }
    setRenamingId(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">My Resumes</h1>
          <p className="text-sm text-muted mt-1">
            Start with a sample or create and manage your own resumes
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <input
            ref={jsonInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleImportJSON}
          />
          <button
            type="button"
            onClick={() => jsonInputRef.current?.click()}
            className="btn btn-secondary btn-sm"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
            </svg>
            Import JSON Data
          </button>

          <button
            type="button"
            onClick={handleCreateNew}
            className="btn btn-primary btn-sm shadow-soft"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14"/><path d="M5 12h14"/>
            </svg>
            New Resume
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <svg className="size-4 text-slate-400 absolute left-3 top-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved resumes by title or name..."
            className="input pl-9 text-xs"
          />
        </div>
        <span className="text-xs text-muted">
          Showing {filtered.length} resume{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Resume Cards Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-surface shadow-soft">
          <div className="size-14 rounded-full bg-brand-50 text-brand flex items-center justify-center mx-auto mb-3">
            <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <h4 className="text-base font-semibold text-ink">No resumes found</h4>
          <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
            {search ? 'No resumes matched your search query.' : 'Create your first professional resume to get started.'}
          </p>
          <button
            type="button"
            onClick={handleCreateNew}
            className="btn btn-primary btn-sm mt-4 shadow-soft"
          >
            Create New Resume
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => {
            const isCurrent = item.id === resume.id;
            const pageSizeDef = pageSizeById(item.layout.pageSize);
            const isEditing = renamingId === item.id;

            return (
              <div
                key={item.id}
                className={`card bg-surface overflow-hidden transition-all duration-200 flex flex-col justify-between hover:shadow-card hover:border-slate-300 ${
                  isCurrent ? 'ring-2 ring-brand/40 border-brand' : ''
                }`}
              >
                {/* Header */}
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    {item.personal.profileImage && (
                      <img
                        src={item.personal.profileImage.src}
                        alt=""
                        className="size-11 shrink-0 rounded-xl border border-slate-200 object-cover shadow-sm"
                      />
                    )}
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={newTitle}
                          autoFocus
                          onChange={(e) => setNewTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && commitRename(item.id)}
                          className="input h-8 text-xs font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => commitRename(item.id)}
                          className="btn btn-primary btn-sm h-8 px-2"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-ink truncate flex items-center gap-1.5">
                          <span>{item.title || 'Untitled Resume'}</span>
                          {item.id.startsWith('sample-') && (
                            <span className="text-[10px] bg-violet-100 text-violet-700 font-semibold px-1.5 py-0.5 rounded">
                              Sample
                            </span>
                          )}
                          {isCurrent && (
                            <span className="text-[10px] bg-brand-100 text-brand font-semibold px-1.5 py-0.5 rounded">
                              Active
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-600 truncate mt-0.5 font-medium">
                          {item.personal.fullName || 'No name entered'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="mt-3 space-y-1 text-[11px] text-muted border-t border-slate-100 pt-3">
                    <div className="flex justify-between items-center">
                      <span>Last edited:</span>
                      <span className="font-medium text-slate-700">{formatLongDate(item.updatedAt)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Document Size:</span>
                      <span className="font-medium text-slate-700">{pageSizeDef.label}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Template:</span>
                      <span className="font-medium text-slate-700 capitalize">{item.design.template.replace(/-/g, ' ')}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-3 bg-slate-50 border-t border-line flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(item.id)}
                      className="btn btn-primary btn-sm text-xs font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDownload(item)}
                      className="btn btn-secondary btn-sm text-xs"
                      title="Download PDF"
                    >
                      PDF
                    </button>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => duplicateInLibrary(item.id)}
                      className="icon-btn size-7 text-xs text-slate-500 hover:text-ink"
                      title="Duplicate Resume"
                    >
                      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => startRename(item.id, item.title)}
                      className="icon-btn size-7 text-xs text-slate-500 hover:text-ink"
                      title="Rename Resume"
                    >
                      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExportJSON(item)}
                      className="icon-btn size-7 text-xs text-slate-500 hover:text-ink"
                      title="Export Data as JSON"
                    >
                      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.title)}
                      className="icon-btn size-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Delete Resume"
                    >
                      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-surface p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink">Privacy and local data</h3>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted">
              Your résumés are stored only in this browser. On a shared device, export your data and remove it when you are finished.
            </p>
          </div>
        </div>
        <button type="button" onClick={handleClearLocalData} className="btn btn-sm shrink-0 border border-red-200 bg-surface text-red-600 hover:bg-red-50">
          Delete my local data
        </button>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 pb-16 text-xs text-muted">
        <span>
          ResumeFlow is a free resume builder by{' '}
          <a href="https://www.getlaunchph.com/" rel="noopener" className="font-medium text-ink underline-offset-2 hover:underline">GetLaunch PH</a>.
        </span>
        <a href="/about" className="font-semibold text-brand underline-offset-2 hover:underline">
          About ResumeFlow &amp; FAQ →
        </a>
      </footer>
    </div>
  );
};
