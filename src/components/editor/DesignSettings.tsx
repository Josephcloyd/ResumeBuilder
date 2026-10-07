import React from 'react';
import { useResumeStore } from '../../store/resumeStore';
import {
  ACCENT_PRESETS,
  FONTS,
  FONT_SIZES,
  FONT_WEIGHTS,
  LINE_SPACINGS,
  PAGE_SIZES,
  TEMPLATES,
  marginsFromPreset,
} from '../../lib/constants';
import type {
  Align,
  Density,
  HeadingAlign,
  LengthUnit,
  MarginPreset,
} from '../../types/resume';
import { fromMm, roundTo, toMm } from '../../lib/units';

export const DesignSettings: React.FC = () => {
  const { resume, update, applyTemplate } = useResumeStore();
  const { design, fonts, layout } = resume;

  const updateDesign = (patch: Partial<typeof design>) => {
    update((d) => {
      Object.assign(d.design, patch);
    });
  };

  const updateFonts = (patch: Partial<typeof fonts>) => {
    update((d) => {
      Object.assign(d.fonts, patch);
    });
  };

  const updateLayout = (patch: Partial<typeof layout>) => {
    update((d) => {
      Object.assign(d.layout, patch);
    });
  };

  const handleMarginPreset = (preset: MarginPreset) => {
    if (preset === 'custom') {
      updateLayout({ marginPreset: 'custom' });
    } else {
      updateLayout({
        marginPreset: preset,
        margins: marginsFromPreset(preset),
      });
    }
  };

  const handleCustomMargin = (side: keyof typeof layout.margins, valStr: string) => {
    const val = parseFloat(valStr) || 0;
    const mmVal = toMm(val, layout.marginUnit);
    update((d) => {
      d.layout.marginPreset = 'custom';
      d.layout.margins[side] = Math.max(0, mmVal);
    });
  };

  return (
    <div className="space-y-6">
      {/* ATS Friendly Mode Switch */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-200/80 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-brand uppercase tracking-wider">ATS Friendly Mode</span>
            <p className="text-xs text-slate-700">
              Simplifies layout, strips decorations, and optimizes formatting for Applicant Tracking Systems.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
            <input
              type="checkbox"
              checked={design.atsMode}
              onChange={(e) => updateDesign({ atsMode: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand" />
          </label>
        </div>
      </div>

      {/* Template Selector */}
      <div className="space-y-3">
        <label className="field-label font-bold text-xs uppercase tracking-wider text-slate-700">
          Resume Template
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTemplate(t.id)}
              className={`p-3 text-left rounded-xl border transition-all ${
                design.template === t.id
                  ? 'border-brand bg-blue-50/50 shadow-soft ring-2 ring-brand/15'
                  : 'border-line bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-ink">{t.name}</span>
                {design.template === t.id && (
                  <span className="size-2 rounded-full bg-brand" />
                )}
              </div>
              <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color Customization */}
      <div className="space-y-3">
        <label className="field-label font-bold text-xs uppercase tracking-wider text-slate-700">
          Accent Color
        </label>
        <div className="flex items-center flex-wrap gap-2">
          {ACCENT_PRESETS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => updateDesign({ accentColor: c.value })}
              className={`size-8 rounded-full transition-transform flex items-center justify-center shadow-soft ${
                design.accentColor.toLowerCase() === c.value.toLowerCase()
                  ? 'ring-2 ring-offset-2 ring-brand scale-110'
                  : 'hover:scale-105'
              }`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            >
              {design.accentColor.toLowerCase() === c.value.toLowerCase() && (
                <svg className="size-4 text-white drop-shadow-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          ))}

          {/* Custom color picker */}
          <label
            className="size-8 rounded-full border border-line flex items-center justify-center cursor-pointer hover:border-brand bg-white relative overflow-hidden"
            title="Custom Accent Color"
          >
            <input
              type="color"
              value={design.accentColor}
              onChange={(e) => updateDesign({ accentColor: e.target.value })}
              className="absolute inset-0 opacity-0 cursor-pointer size-full"
            />
            <svg className="size-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
            </svg>
          </label>

          <span className="text-xs font-mono text-muted uppercase ml-1">
            {design.accentColor}
          </span>
        </div>
      </div>

      {/* Typography Panel */}
      <div className="space-y-4 pt-2 border-t border-line">
        <label className="field-label font-bold text-xs uppercase tracking-wider text-slate-700">
          Typography Settings
        </label>

        {/* Headings Font Settings */}
        <div className="bg-slate-50 border border-line rounded-xl p-3.5 space-y-3">
          <span className="text-xs font-semibold text-ink block">Name & Section Headings</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="text-[11px] text-muted block mb-1">Font Family</label>
              <select
                value={fonts.headingFont}
                onChange={(e) => updateFonts({ headingFont: e.target.value })}
                className="input h-8 text-xs font-medium"
              >
                {FONTS.map((f) => (
                  <option key={f.label} value={f.label}>
                    {f.label} ({f.kind})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-muted block mb-1">Heading Size</label>
              <select
                value={fonts.headingSize}
                onChange={(e) => updateFonts({ headingSize: parseInt(e.target.value, 10) })}
                className="input h-8 text-xs font-medium"
              >
                {FONT_SIZES.map((s) => (
                  <option key={s} value={s}>{s}px</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-muted block mb-1">Font Weight</label>
              <select
                value={fonts.headingWeight}
                onChange={(e) => updateFonts({ headingWeight: parseInt(e.target.value, 10) })}
                className="input h-8 text-xs font-medium"
              >
                {FONT_WEIGHTS.map((w) => (
                  <option key={w.value} value={w.value}>{w.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Body Font Settings */}
        <div className="bg-slate-50 border border-line rounded-xl p-3.5 space-y-3">
          <span className="text-xs font-semibold text-ink block">Body Text</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="sm:col-span-2">
              <label className="text-[11px] text-muted block mb-1">Font Family</label>
              <select
                value={fonts.bodyFont}
                onChange={(e) => updateFonts({ bodyFont: e.target.value })}
                className="input h-8 text-xs font-medium"
              >
                {FONTS.map((f) => (
                  <option key={f.label} value={f.label}>
                    {f.label} ({f.kind})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-muted block mb-1">Body Size</label>
              <select
                value={fonts.bodySize}
                onChange={(e) => updateFonts({ bodySize: parseInt(e.target.value, 10) })}
                className="input h-8 text-xs font-medium"
              >
                {FONT_SIZES.filter((s) => s <= 16).map((s) => (
                  <option key={s} value={s}>{s}px</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-muted block mb-1">Line Height</label>
              <select
                value={fonts.lineHeight}
                onChange={(e) => updateFonts({ lineHeight: parseFloat(e.target.value) })}
                className="input h-8 text-xs font-medium"
              >
                {LINE_SPACINGS.map((lh) => (
                  <option key={lh} value={lh}>{lh.toFixed(2)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Page Size & Print Settings */}
      <div className="space-y-4 pt-2 border-t border-line">
        <label className="field-label font-bold text-xs uppercase tracking-wider text-slate-700">
          Page & Document Settings
        </label>

        {/* Page Size */}
        <div>
          <label className="text-xs text-muted block mb-1">Page Dimensions</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PAGE_SIZES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => updateLayout({ pageSize: p.id })}
                className={`p-2.5 text-left rounded-lg border transition-all ${
                  layout.pageSize === p.id
                    ? 'border-brand bg-blue-50/50 shadow-soft ring-1 ring-brand/30'
                    : 'border-line bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-xs text-ink">{p.label}</span>
                  <span className="text-[10px] text-muted">{p.dims}</span>
                </div>
                {p.note && (
                  <span className="text-[10px] text-brand/80 block mt-0.5">{p.note}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Margins */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted">Margins</span>
            <div className="flex items-center gap-1">
              {(['mm', 'cm', 'in'] as LengthUnit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => updateLayout({ marginUnit: u })}
                  className={`px-1.5 py-0.5 text-[10px] rounded font-mono ${
                    layout.marginUnit === u ? 'bg-brand text-white font-bold' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {(['xnarrow', 'narrow', 'normal', 'wide', 'custom'] as MarginPreset[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleMarginPreset(m)}
                className={`flex-1 py-1 text-[11px] font-medium rounded-md capitalize transition-all ${
                  layout.marginPreset === m
                    ? 'bg-white text-brand shadow-soft font-semibold'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {m === 'xnarrow' ? 'Ex-Narrow' : m}
              </button>
            ))}
          </div>

          {/* Custom Margins Inputs */}
          {layout.marginPreset === 'custom' && (
            <div className="grid grid-cols-4 gap-2 pt-1 animate-fade-in">
              {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
                <div key={side}>
                  <label className="text-[10px] text-muted capitalize block mb-0.5">{side}</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={roundTo(fromMm(layout.margins[side], layout.marginUnit))}
                    onChange={(e) => handleCustomMargin(side, e.target.value)}
                    className="input h-8 text-xs font-mono text-center px-1"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Layout Alignment & Column Structure */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Columns */}
          <div>
            <label className="text-xs text-muted block mb-1">Columns</label>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => updateLayout({ columns: 1 })}
                className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${
                  layout.columns === 1 ? 'bg-white text-brand shadow-soft font-semibold' : 'text-muted hover:text-ink'
                }`}
              >
                Single Column
              </button>
              <button
                type="button"
                onClick={() => updateLayout({ columns: 2 })}
                className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${
                  layout.columns === 2 ? 'bg-white text-brand shadow-soft font-semibold' : 'text-muted hover:text-ink'
                }`}
              >
                Two Column
              </button>
            </div>
          </div>

          {/* Spacing Density */}
          <div>
            <label className="text-xs text-muted block mb-1">Spacing Density</label>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {(['compact', 'normal', 'spacious'] as Density[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => updateLayout({ density: d })}
                  className={`flex-1 py-1 text-xs font-medium rounded-md capitalize transition-all ${
                    layout.density === d ? 'bg-white text-brand shadow-soft font-semibold' : 'text-muted hover:text-ink'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Heading Alignment */}
          <div>
            <label className="text-xs text-muted block mb-1">Heading Alignment</label>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {(['left', 'center', 'right'] as HeadingAlign[]).map((ha) => (
                <button
                  key={ha}
                  type="button"
                  onClick={() => updateLayout({ headingAlignment: ha })}
                  className={`flex-1 py-1 text-xs font-medium rounded-md capitalize transition-all ${
                    layout.headingAlignment === ha ? 'bg-white text-brand shadow-soft font-semibold' : 'text-muted hover:text-ink'
                  }`}
                >
                  {ha}
                </button>
              ))}
            </div>
          </div>

          {/* Default Body Alignment */}
          <div>
            <label className="text-xs text-muted block mb-1">Body Text Alignment</label>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {(['left', 'center', 'right', 'justify'] as Align[]).map((ba) => (
                <button
                  key={ba}
                  type="button"
                  onClick={() => updateLayout({ bodyAlignment: ba })}
                  className={`flex-1 py-1 text-xs font-medium rounded-md capitalize transition-all ${
                    layout.bodyAlignment === ba ? 'bg-white text-brand shadow-soft font-semibold' : 'text-muted hover:text-ink'
                  }`}
                >
                  {ba}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
