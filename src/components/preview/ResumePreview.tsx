import React, { useEffect, useRef, useState } from 'react';
import { useResumeStore } from '../../store/resumeStore';
import { useUI } from '../../store/uiStore';
import { ZOOM_PRESETS } from '../../lib/constants';
import { pageGeometry } from '../../lib/units';
import { ResumeDoc } from '../resume/ResumeDoc';

/** Horizontal padding of the scroll canvas (p-3 on phones, sm:p-6 otherwise). */
const canvasPaddingX = () => (window.matchMedia('(min-width: 640px)').matches ? 48 : 24);

export const ResumePreview: React.FC = () => {
  const { resume, setPageCount } = useResumeStore();
  const { zoom, setZoom, zoomMode, setZoomMode, setEditorTab, setOpenSection, setMobilePane } = useUI();
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  const geom = pageGeometry(resume);

  // Track the unscaled document height (changes with page count) to size the scaled box
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setContentHeight(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Phones/tablets: a zoom saved on a wider screen would overflow, so start from Fit Width
  useEffect(() => {
    if (window.matchMedia('(max-width: 1023px)').matches && useUI.getState().zoomMode === 'custom') {
      setZoomMode('fitWidth');
    }
  }, [setZoomMode]);

  // Auto calculate Fit Width and Fit Page
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleFit = () => {
      // 0 while the preview pane is hidden (phones in Editor mode); refit once it is shown
      if (container.clientWidth === 0) return;
      const cWidth = container.clientWidth - canvasPaddingX(); // padding
      const cHeight = container.clientHeight - 80;

      // floor so the page never ends up a pixel wider than the panel (no sideways scroll)
      if (zoomMode === 'fitWidth') {
        setZoom(Math.floor((cWidth / geom.width) * 100), 'fitWidth');
      } else if (zoomMode === 'fitPage') {
        setZoom(Math.floor(Math.min(cWidth / geom.width, cHeight / geom.height) * 100), 'fitPage');
      }
    };

    handleFit();
    // Observes the panel itself, so it also refits when the pane appears or the divider is dragged
    const observer = new ResizeObserver(handleFit);
    observer.observe(container);
    return () => observer.disconnect();
  }, [zoomMode, geom.width, geom.height, setZoom]);

  /** Clicking part of the resume opens that section in the editor (ignored while selecting text or on links). */
  const jumpToSection = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest('a') || !window.getSelection()?.isCollapsed) return;
    const sectionId = target.closest<HTMLElement>('[data-section]')?.dataset.section;
    if (!sectionId) return;

    setEditorTab('content');
    setOpenSection(sectionId);
    setMobilePane('editor');
    requestAnimationFrame(() =>
      document.getElementById(`editor-section-${sectionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  };

  const handleZoomIn = () => {
    const next = ZOOM_PRESETS.find((z) => z > zoom) ?? Math.min(200, zoom + 10);
    setZoom(next, 'custom');
  };

  const handleZoomOut = () => {
    const next = [...ZOOM_PRESETS].reverse().find((z) => z < zoom) ?? Math.max(30, zoom - 10);
    setZoom(next, 'custom');
  };

  const scale = zoom / 100;

  return (
    <div className="flex flex-col h-full bg-slate-100/80 relative overflow-hidden select-none">
      {/* Zoom and Preview Toolbar */}
      <div className="min-h-14 border-b border-line bg-surface/90 backdrop-blur-xs px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-4 z-20 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-sm font-semibold text-slate-800 tracking-tight">
            Live Preview
          </span>
          <span className="hidden xl:inline text-[11px] text-muted bg-slate-100 px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap">
            {geom.size.label} · {geom.size.dims}
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleZoomOut}
            className="icon-btn size-7 text-xs"
            title="Zoom Out"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" x2="19" y1="12" y2="12"/>
            </svg>
          </button>

          {/* Preset Selector */}
          <select
            value={ZOOM_PRESETS.includes(zoom) ? zoom : ''}
            onChange={(e) => {
              if (e.target.value) {
                setZoom(parseInt(e.target.value, 10), 'custom');
              }
            }}
            className="input h-7 text-xs font-medium pl-2 pr-6 py-0 w-20 text-center"
          >
            {!ZOOM_PRESETS.includes(zoom) && (
              <option value="">{zoom}%</option>
            )}
            {ZOOM_PRESETS.map((z) => (
              <option key={z} value={z}>
                {z}%
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleZoomIn}
            className="icon-btn size-7 text-xs"
            title="Zoom In"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/>
            </svg>
          </button>

          <div className="w-px h-4 bg-slate-200 mx-1" />

          {/* Fit Page & Fit Width */}
          <button
            type="button"
            onClick={() => {
              setZoomMode('fitWidth');
              if (containerRef.current) {
                const cWidth = containerRef.current.clientWidth - canvasPaddingX();
                setZoom(Math.floor((cWidth / geom.width) * 100), 'fitWidth');
              }
            }}
            className={`px-2 py-1 text-[11px] rounded font-medium transition-all ${
              zoomMode === 'fitWidth' ? 'bg-brand-100 text-brand font-semibold' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Fit Width
          </button>
          <button
            type="button"
            onClick={() => {
              setZoomMode('fitPage');
              if (containerRef.current) {
                const cWidth = containerRef.current.clientWidth - canvasPaddingX();
                const cHeight = containerRef.current.clientHeight - 80;
                setZoom(Math.floor(Math.min(cWidth / geom.width, cHeight / geom.height) * 100), 'fitPage');
              }
            }}
            className={`px-2 py-1 text-[11px] rounded font-medium transition-all ${
              zoomMode === 'fitPage' ? 'bg-brand-100 text-brand font-semibold' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Fit Page
          </button>
        </div>
      </div>

      {/* Viewport Scroll Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-3 sm:p-6 flex items-start scroll-thin cursor-default"
      >
        {/* Occupies the *scaled* size so the panel can shrink and Fit Width measures the real space;
            mx-auto centres it without clipping the left edge when zoomed past the panel width. */}
        <div
          className="rf-scale-box mx-auto shrink-0"
          style={{
            width: geom.width * scale,
            height: contentHeight ? contentHeight * scale : undefined,
            marginBottom: '4rem',
          }}
        >
          <div
            ref={contentRef}
            onClick={jumpToSection}
            title="Click any part of the resume to edit it"
            className="rf-click-to-edit transition-transform origin-top-left select-text"
            style={{
              width: geom.width,
              transform: `scale(${scale})`,
            }}
          >
            <ResumeDoc
              resume={resume}
              onPageCountChange={(count) => setPageCount(count)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
