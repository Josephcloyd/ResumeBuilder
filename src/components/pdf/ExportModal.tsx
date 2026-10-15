import React, { useState } from 'react';
import { useResumeStore } from '../../store/resumeStore';
import { useUI } from '../../store/uiStore';
import { pageSizeById } from '../../lib/constants';
import { safeFileName } from '../../lib/format';
import { exportResumeToPDF, printResume } from '../../lib/pdf';

export const ExportModal: React.FC = () => {
  const { resume } = useResumeStore();
  const { exportOpen, setExportOpen, toast } = useUI();

  const defaultFileName = `${safeFileName(resume.personal.fullName || resume.title || 'Resume')}_Resume.pdf`;
  const [fileName, setFileName] = useState(defaultFileName);
  const [isExporting, setIsExporting] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  if (!exportOpen) return null;

  const pageSizeDef = pageSizeById(resume.layout.pageSize);

  const handleDownload = async () => {
    setIsExporting(true);
    setProgressMsg('Initializing PDF renderer...');
    try {
      await exportResumeToPDF(resume, {
        fileName,
        onProgress: (_curr, _tot, status) => {
          setProgressMsg(status);
        },
      });
      toast('Resume downloaded successfully!', 'success');
      setExportOpen(false);
    } catch (err: any) {
      console.error(err);
      toast(err?.message || 'Failed to generate PDF. You can also try Print to PDF.', 'error');
    } finally {
      setIsExporting(false);
      setProgressMsg('');
    }
  };

  const handlePrint = () => {
    setExportOpen(false);
    setTimeout(() => {
      printResume();
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="card w-full max-w-md bg-white shadow-pop overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-gradient-to-r from-brand-50/50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-brand-100 text-brand flex items-center justify-center font-bold">
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-ink text-base">Export Resume</h3>
              <p className="text-xs text-muted">Generate a print-ready, high-resolution PDF</p>
            </div>
          </div>
          <button onClick={() => !isExporting && setExportOpen(false)} className="icon-btn" disabled={isExporting}>
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-sm">
          {/* Summary Details */}
          <div className="bg-slate-50 border border-line rounded-lg p-3.5 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted">Page Size:</span>
              <span className="font-medium text-ink bg-white px-2 py-0.5 rounded border border-slate-200">
                {pageSizeDef.label} ({pageSizeDef.dims})
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted">Total Pages:</span>
              <span className="font-medium text-ink">{resume.pageCount || 1} page{resume.pageCount > 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted">Design Template:</span>
              <span className="font-medium text-ink capitalize">{resume.design.template.replace(/-/g, ' ')}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted">Target Resolution:</span>
              <span className="font-medium text-emerald-600 font-semibold">300 DPI (Print Ready)</span>
            </div>
          </div>

          {/* File Name Input */}
          <div>
            <label className="field-label">File Name</label>
            <div className="relative">
              <input
                type="text"
                value={fileName}
                disabled={isExporting}
                onChange={(e) => setFileName(e.target.value)}
                className="input pr-12 text-sm font-medium"
              />
              <span className="absolute right-3 top-2 text-xs text-muted select-none">.pdf</span>
            </div>
          </div>

          {/* Progress message */}
          {isExporting && (
            <div className="p-3 bg-brand-50 border border-brand-200 rounded-lg flex items-center gap-3 text-xs text-brand font-medium">
              <div className="size-4 border-2 border-brand border-t-transparent rounded-full animate-spin shrink-0" />
              <span>{progressMsg || 'Generating PDF document...'}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-t border-line">
          <button
            type="button"
            onClick={handlePrint}
            disabled={isExporting}
            className="btn btn-ghost btn-sm text-slate-600 hover:text-ink flex items-center gap-1.5"
            title="Alternative print options via browser dialog"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>
            </svg>
            Print / System PDF
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isExporting}
              onClick={() => setExportOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isExporting}
              onClick={handleDownload}
              className="btn btn-primary shadow-md hover:shadow-lg"
            >
              {isExporting ? 'Generating...' : 'Download PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
