import React, { useEffect, useRef, useState } from 'react';
import { useUI } from '../../store/uiStore';
import { validateImageFile } from '../../lib/image';

const MAX_BUG_SCREENSHOT_BYTES = 2 * 1024 * 1024;

export const BugReportBubble: React.FC = () => {
  const { view, editorTab, mobilePane, toast } = useUI();
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [isDraggingScreenshot, setIsDraggingScreenshot] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [website, setWebsite] = useState('');
  const summaryRef = useRef<HTMLInputElement>(null);
  const openedAtRef = useRef(0);

  useEffect(() => {
    if (!isOpen) return;
    openedAtRef.current = Date.now();
    summaryRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
    };
  }, [screenshotPreview]);

  const selectScreenshot = async (file?: File) => {
    setIsDraggingScreenshot(false);
    if (!file) return;

    try {
      await validateImageFile(file);
      if (file.size > MAX_BUG_SCREENSHOT_BYTES) {
        throw new Error('Bug report screenshots must be 2 MB or smaller.');
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Choose a valid screenshot.', 'error');
      return;
    }

    setScreenshot(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const createReport = () => {
    const report = [
      `Bug: ${summary.trim() || 'Untitled issue'}`,
      '',
      'What happened:',
      details.trim() || 'No additional details provided.',
    ];

    if (screenshot) {
      report.push(
        '',
        `Screenshot selected: ${screenshot.name} (${(screenshot.size / 1024 / 1024).toFixed(2)} MB)`,
        'The screenshot will be included with the secure report.',
      );
    }

    if (includeDiagnostics) {
      report.push(
        '',
        'Technical details:',
        `- App area: ${view}${view === 'builder' ? ` / ${editorTab} / ${mobilePane}` : ''}`,
        `- Date: ${new Date().toLocaleString()}`,
        `- Browser: ${navigator.userAgent}`,
        `- Screen: ${window.innerWidth} × ${window.innerHeight}`,
      );
    }

    return report.join('\n');
  };

  const copyReport = async () => {
    if (!summary.trim() || !details.trim()) {
      toast('Add a short title and description first.', 'error');
      return;
    }

    try {
      await navigator.clipboard.writeText(createReport());
      toast('Bug report copied to your clipboard.', 'success');
    } catch {
      toast('Could not copy the report. Please try the send option.', 'error');
    }
  };

  const submitReport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    const form = new FormData();
    form.set('summary', summary.trim());
    form.set('details', details.trim());
    form.set('startedAt', String(openedAtRef.current));
    form.set('submissionId', crypto.randomUUID());
    form.set('website', website);
    if (screenshot) form.set('screenshot', screenshot, screenshot.name);
    if (includeDiagnostics) {
      form.set('appArea', `${view}${view === 'builder' ? ` / ${editorTab} / ${mobilePane}` : ''}`);
      form.set('reportedAt', new Date().toISOString());
      form.set('browser', navigator.userAgent);
      form.set('viewport', `${window.innerWidth} × ${window.innerHeight}`);
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/bug-report', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: form,
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      // The /api endpoint only exists on Vercel (not under `npm run dev`)
      if (response.status === 404) throw new Error('Sending is only available on the live site. Use Copy instead.');
      if (!response.ok) throw new Error(result.error || 'The report could not be sent.');

      setSummary('');
      setDetails('');
      setScreenshot(null);
      setScreenshotPreview('');
      setIsOpen(false);
      toast('Bug report sent securely. Thank you!', 'success');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'The report could not be sent.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 sm:bottom-5 sm:right-5" data-no-pdf>
      {isOpen && (
        <section
          id="bug-report-panel"
          role="dialog"
          aria-labelledby="bug-report-title"
          className="absolute bottom-[4.5rem] right-0 max-h-[calc(100dvh-7rem)] w-[calc(100vw-2rem)] max-w-sm overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-surface shadow-pop animate-pop-in"
        >
          <div className="flex items-start justify-between gap-4 border-b border-line bg-slate-50/80 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3 3 0 0 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a6 6 0 0 1 12 0v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6 13H2"/><path d="M22 13h-4"/><path d="m4.93 4.93 2.83 2.83"/><path d="m16.24 7.76 2.83-2.83"/><path d="m4.93 21.07 2.83-2.83"/><path d="m16.24 18.24 2.83 2.83"/>
                </svg>
              </div>
              <div>
                <h2 id="bug-report-title" className="text-sm font-bold text-ink">Report a bug</h2>
                <p className="mt-0.5 text-xs text-muted">Tell us what went wrong.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="icon-btn -mr-1 -mt-1"
              aria-label="Close bug report"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <form onSubmit={submitReport} className="space-y-4 p-5">
            <div className="hidden" aria-hidden="true">
              <label htmlFor="bug-website">Website</label>
              <input
                id="bug-website"
                name="website"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="bug-summary" className="field-label">Short title</label>
              <input
                ref={summaryRef}
                id="bug-summary"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                className="input"
                placeholder="e.g. Preview stopped updating"
                maxLength={100}
                required
              />
            </div>

            <div>
              <label htmlFor="bug-details" className="field-label">What happened?</label>
              <textarea
                id="bug-details"
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                className="input min-h-28 resize-y"
                placeholder="What were you doing, and what did you expect to happen?"
                maxLength={1200}
                required
              />
              <p className="mt-1.5 text-right text-[10px] text-slate-400">{details.length}/1200</p>
            </div>

            <div>
              <span className="field-label">Screenshot <span className="font-normal text-slate-400">(optional)</span></span>
              {screenshot && screenshotPreview ? (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <div className="relative h-36 bg-slate-100">
                    <img
                      src={screenshotPreview}
                      alt="Selected bug screenshot preview"
                      className="h-full w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setScreenshot(null);
                        setScreenshotPreview('');
                      }}
                      className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-night/80 text-white shadow-soft transition-colors hover:bg-night"
                      aria-label="Remove screenshot"
                    >
                      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <path d="M18 6 6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-700">{screenshot.name}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">{(screenshot.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <label htmlFor="bug-screenshot" className="shrink-0 cursor-pointer text-xs font-semibold text-brand hover:text-brand-hover">
                      Replace
                    </label>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="bug-screenshot"
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setIsDraggingScreenshot(true);
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDragLeave={() => setIsDraggingScreenshot(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    selectScreenshot(event.dataTransfer.files[0]);
                  }}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors ${
                    isDraggingScreenshot
                      ? 'border-brand bg-brand-50'
                      : 'border-slate-200 bg-slate-50/70 hover:border-brand-300 hover:bg-brand-50/50'
                  }`}
                >
                  <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-surface text-brand shadow-soft">
                    <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-slate-700">Choose or drop a screenshot</span>
                  <span className="mt-1 text-[10px] text-slate-400">PNG, JPG, or WEBP · up to 2 MB</span>
                </label>
              )}
              <input
                id="bug-screenshot"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  selectScreenshot(event.target.files?.[0]);
                  event.target.value = '';
                }}
                className="sr-only"
              />
              {screenshot && (
                <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                  The screenshot is sent securely with this report. Avoid including passwords or sensitive résumé details.
                </p>
              )}
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={includeDiagnostics}
                onChange={(event) => setIncludeDiagnostics(event.target.checked)}
                className="mt-0.5 size-4 rounded border-slate-300 accent-brand-600"
              />
              <span>
                <span className="block font-semibold text-slate-700">Include technical details</span>
                <span className="mt-0.5 block leading-relaxed">Adds browser, screen size, and current app area—never your résumé content.</span>
              </span>
            </label>

            <p className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-[10px] leading-relaxed text-emerald-800">
              Your report is sent through a protected form. The developer’s private email address is never shared with your browser.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button type="button" onClick={copyReport} disabled={isSubmitting} className="btn btn-secondary flex-1">
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                </svg>
                Copy
              </button>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-[1.4] disabled:cursor-not-allowed disabled:opacity-60">
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
                </svg>
                {isSubmitting ? 'Sending…' : 'Send report'}
              </button>
            </div>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls="bug-report-panel"
        className={`group flex h-13 items-center justify-center rounded-full border px-4 shadow-pop transition-all duration-200 active:scale-95 ${
          isOpen
            ? 'border-night bg-night/90 text-white hover:bg-night'
            : 'border-red-200 bg-surface text-slate-700 hover:-translate-y-0.5 hover:border-red-300 hover:text-red-600'
        }`}
      >
        {isOpen ? (
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        ) : (
          <>
            <svg className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3 3 0 0 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a6 6 0 0 1 12 0v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6 13H2"/><path d="M22 13h-4"/>
            </svg>
            <span className="ml-2 hidden text-sm font-semibold sm:inline">Report a bug</span>
          </>
        )}
      </button>
    </div>
  );
};
