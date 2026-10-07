import React, { useEffect, useRef } from 'react';
import { useResumeStore } from '../../store/resumeStore';
import { useUI } from '../../store/uiStore';
import { ZOOM_PRESETS } from '../../lib/constants';
import { pageGeometry } from '../../lib/units';
import { ResumeDoc } from '../resume/ResumeDoc';

export const ResumePreview: React.FC = () => {
  const { resume, setPageCount } = useResumeStore();
  const { zoom, setZoom, zoomMode, setZoomMode } = useUI();
  const containerRef = useRef<HTMLDivElement>(null);

  const geom = pageGeometry(resume);

  // Auto calculate Fit Width and Fit Page
  useEffect(() => {
    const handleFit = () => {
      if (!containerRef.current) return;
      const cWidth = containerRef.current.clientWidth - 48; // padding
      const cHeight = containerRef.current.clientHeight - 80;

      if (zoomMode === 'fitWidth') {
        const calculated = Math.round((cWidth / geom.width) * 100);
        setZoom(calculated, 'fitWidth');
      } else if (zoomMode === 'fitPage') {
        const calculated = Math.round(
          Math.min(cWidth / geom.width, cHeight / geom.height) * 100
        );
        setZoom(calculated, 'fitPage');
      }
    };

    handleFit();
    window.addEventListener('resize', handleFit);
    return () => window.removeEventListener('resize', handleFit);
  }, [zoomMode, geom.width, geom.height, setZoom]);

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
      <div className="h-11 border-b border-line bg-white/90 backdrop-blur-xs px-4 flex items-center justify-between z-20 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 tracking-wide">
            Live Preview
          </span>
          <span className="text-[11px] text-muted bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
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
            className="input h-7 text-xs font-medium px-1.5 py-0 w-16 text-center"
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
                const cWidth = containerRef.current.clientWidth - 48;
                setZoom(Math.round((cWidth / geom.width) * 100), 'fitWidth');
              }
            }}
            className={`px-2 py-1 text-[11px] rounded font-medium transition-all ${
              zoomMode === 'fitWidth' ? 'bg-blue-100 text-brand font-semibold' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Fit Width
          </button>
          <button
            type="button"
            onClick={() => {
              setZoomMode('fitPage');
              if (containerRef.current) {
                const cWidth = containerRef.current.clientWidth - 48;
                const cHeight = containerRef.current.clientHeight - 80;
                setZoom(Math.round(Math.min(cWidth / geom.width, cHeight / geom.height) * 100), 'fitPage');
              }
            }}
            className={`px-2 py-1 text-[11px] rounded font-medium transition-all ${
              zoomMode === 'fitPage' ? 'bg-blue-100 text-brand font-semibold' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Fit Page
          </button>
        </div>
      </div>

      {/* Viewport Scroll Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-6 flex justify-center items-start scroll-thin cursor-default"
      >
        <div
          className="transition-transform origin-top select-text"
          style={{
            transform: `scale(${scale})`,
            marginBottom: '4rem',
          }}
        >
          <ResumeDoc
            resume={resume}
            onPageCountChange={(count) => setPageCount(count)}
          />
        </div>
      </div>
    </div>
  );
};
