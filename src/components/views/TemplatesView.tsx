import React from 'react';
import { useResumeStore } from '../../store/resumeStore';
import { useUI } from '../../store/uiStore';
import { TEMPLATES } from '../../lib/constants';
import type { TemplateId } from '../../types/resume';

export const TemplatesView: React.FC = () => {
  const { resume, applyTemplate } = useResumeStore();
  const { setView, toast } = useUI();

  const handleSelectTemplate = (id: TemplateId, name: string) => {
    applyTemplate(id);
    setView('builder');
    toast(`Switched to "${name}" template`, 'success');
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="border-b border-line pb-6">
        <h2 className="text-2xl font-bold text-ink tracking-tight">Resume Templates</h2>
        <p className="text-sm text-muted mt-1 max-w-2xl">
          Choose a professionally crafted design. Switching templates preserves all of your entered information, sections, and images.
        </p>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {TEMPLATES.map((tpl) => {
          const isSelected = resume.design.template === tpl.id;

          return (
            <div
              key={tpl.id}
              className={`card bg-white overflow-hidden transition-all duration-200 flex flex-col justify-between hover:shadow-card hover:-translate-y-1 ${
                isSelected ? 'ring-2 ring-brand border-brand shadow-card' : 'border-line'
              }`}
            >
              {/* Visual Mockup Card */}
              <div
                onClick={() => handleSelectTemplate(tpl.id, tpl.name)}
                className="h-44 p-4 cursor-pointer bg-slate-50 flex flex-col justify-between border-b border-line select-none relative group overflow-hidden"
              >
                {/* Simulated resume document wireframe preview */}
                <div className="w-full h-full bg-white rounded shadow-xs p-2.5 flex flex-col gap-1.5 transition-transform group-hover:scale-102">
                  {/* Wireframe header */}
                  <div className={`flex items-center gap-2 ${tpl.id === 'modern-professional' ? 'bg-blue-600 p-1.5 rounded text-white' : ''}`}>
                    <div className={`size-5 rounded-full ${tpl.id === 'modern-professional' ? 'bg-white' : 'bg-blue-500'}`} />
                    <div className="space-y-1 flex-1">
                      <div className={`h-2 rounded w-2/3 ${tpl.id === 'modern-professional' ? 'bg-white' : 'bg-slate-800'}`} />
                      <div className={`h-1.5 rounded w-1/3 ${tpl.id === 'modern-professional' ? 'bg-blue-200' : 'bg-slate-400'}`} />
                    </div>
                  </div>

                  {/* Wireframe body columns */}
                  <div className="flex gap-2 flex-1 pt-1">
                    {tpl.columns === 2 && tpl.sidebar === 'left' && (
                      <div className="w-1/3 bg-blue-50/70 rounded p-1 space-y-1">
                        <div className="h-1 bg-blue-400 rounded w-3/4" />
                        <div className="h-1 bg-slate-300 rounded w-full" />
                        <div className="h-1 bg-slate-300 rounded w-2/3" />
                      </div>
                    )}
                    <div className="flex-1 space-y-1.5">
                      <div className="h-1.5 bg-blue-500 rounded w-1/2" />
                      <div className="h-1 bg-slate-300 rounded w-full" />
                      <div className="h-1 bg-slate-300 rounded w-5/6" />
                      <div className="h-1.5 bg-blue-500 rounded w-1/3 pt-1" />
                      <div className="h-1 bg-slate-300 rounded w-full" />
                    </div>
                    {tpl.columns === 2 && tpl.sidebar === 'right' && (
                      <div className="w-1/3 bg-blue-50/70 rounded p-1 space-y-1">
                        <div className="h-1 bg-blue-400 rounded w-3/4" />
                        <div className="h-1 bg-slate-300 rounded w-full" />
                      </div>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <span className="absolute top-2 right-2 bg-brand text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-soft">
                    Current
                  </span>
                )}
              </div>

              {/* Template details */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-ink">{tpl.name}</h4>
                  <p className="text-xs text-muted mt-1 leading-relaxed">{tpl.description}</p>
                  <div className="flex items-center gap-2 mt-2.5">
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {tpl.columns === 1 ? 'Single Column' : 'Two Column'}
                    </span>
                    <span className="text-[10px] text-muted">
                      {tpl.fonts.headingFont || 'Inter'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectTemplate(tpl.id, tpl.name)}
                  className={`btn btn-sm w-full mt-4 font-semibold ${
                    isSelected ? 'btn-secondary' : 'btn-primary'
                  }`}
                >
                  {isSelected ? 'Currently Selected' : 'Use Template'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
