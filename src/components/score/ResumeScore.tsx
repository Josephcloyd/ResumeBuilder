import { useResumeStore } from '../../store/resumeStore';
import { scoreResume } from '../../lib/score';

export const ResumeScore: React.FC = () => {
  const { resume } = useResumeStore();
  const { checks, scorePercent, recommendations } = scoreResume(resume);

  return (
    <div className="p-4 space-y-5 animate-fade-in">
      {/* Header meter */}
      <div className="bg-gradient-to-br from-brand-50 to-brand-50/40 border border-brand-100 rounded-xl p-4.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-brand uppercase tracking-wider">Quality Check</span>
            <h4 className="text-base font-bold text-ink mt-0.5">Resume Completeness</h4>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-brand tracking-tight">{scorePercent}%</span>
            <span className="block text-[11px] text-muted font-medium">
              {scorePercent >= 85 ? 'Strong Resume' : scorePercent >= 60 ? 'Good Progress' : 'Needs Details'}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-200/80 rounded-full h-2 mt-3.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              scorePercent >= 85
                ? 'bg-emerald-500'
                : scorePercent >= 60
                ? 'bg-brand-600'
                : 'bg-amber-500'
            }`}
            style={{ width: `${scorePercent}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-1">Content Evaluation</h5>
        <div className="bg-surface border border-line rounded-xl divide-y divide-line overflow-hidden shadow-soft">
          {checks.map((chk) => (
            <div key={chk.id} className="p-3 flex items-start justify-between gap-3 text-sm">
              <div className="flex items-center gap-2.5">
                {chk.status === 'passed' && (
                  <div className="size-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                )}
                {chk.status === 'warning' && (
                  <div className="size-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
                    </svg>
                  </div>
                )}
                {chk.status === 'missing' && (
                  <div className="size-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                    </svg>
                  </div>
                )}
                <span className="text-xs font-medium text-slate-800">{chk.label}</span>
              </div>
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${
                chk.status === 'passed' ? 'text-emerald-600' : chk.status === 'warning' ? 'text-amber-600' : 'text-slate-400'
              }`}>
                {chk.status === 'passed' ? 'Complete' : chk.status === 'warning' ? 'Improve' : 'Missing'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-1">Recommendations</h5>
          <div className="space-y-2">
            {recommendations.map((r) => (
              <div key={r.id} className="p-3 bg-brand-50/60 border border-brand-200/70 rounded-lg text-xs text-slate-700 flex items-start gap-2.5">
                <svg className="size-4 text-brand shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/>
                </svg>
                <span className="leading-relaxed">{r.tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
