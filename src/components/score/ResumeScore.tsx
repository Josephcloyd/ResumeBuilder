import { useResumeStore } from '../../store/resumeStore';

interface CheckItem {
  id: string;
  label: string;
  status: 'passed' | 'warning' | 'missing';
  tip?: string;
  weight: number;
}

export const ResumeScore: React.FC = () => {
  const { resume } = useResumeStore();
  const { personal, sections } = resume;

  const checks: CheckItem[] = [];

  // 1. Personal Contact Info
  const hasName = Boolean(personal.fullName.trim());
  const hasEmail = Boolean(personal.email.trim());
  const hasPhone = Boolean(personal.phone.trim());
  const hasLocation = Boolean(personal.location.trim());
  const contactScore = (hasName ? 1 : 0) + (hasEmail ? 1 : 0) + (hasPhone ? 1 : 0) + (hasLocation ? 1 : 0);

  checks.push({
    id: 'contact',
    label: 'Contact Information',
    status: contactScore >= 3 ? 'passed' : contactScore >= 1 ? 'warning' : 'missing',
    tip: !hasEmail ? 'Add your email address so recruiters can reach you.' : !hasPhone ? 'Add a phone number.' : undefined,
    weight: 20,
  });

  // 2. Online Profiles (LinkedIn / GitHub / Portfolio)
  const hasWeb = personal.linkedIn || personal.github || personal.portfolio || personal.website;
  checks.push({
    id: 'links',
    label: 'Professional Links',
    status: hasWeb ? 'passed' : 'warning',
    tip: !hasWeb ? 'Add your LinkedIn or GitHub profile to showcase your work.' : undefined,
    weight: 10,
  });

  // 3. Summary
  const summarySec = sections.find((s) => s.type === 'summary');
  const summaryContent = summarySec && 'content' in summarySec ? summarySec.content : '';
  const summaryLen = summaryContent.replace(/<[^>]*>/g, '').trim().length;

  checks.push({
    id: 'summary',
    label: 'Professional Summary',
    status: summaryLen > 50 && summaryLen < 600 ? 'passed' : summaryLen > 0 ? 'warning' : 'missing',
    tip: summaryLen === 0
      ? 'Add a short 2-3 sentence career summary.'
      : summaryLen > 500
      ? 'Your professional summary may be too long; aim for 3-4 concise lines.'
      : undefined,
    weight: 15,
  });

  // 4. Experience
  const expSec = sections.find((s) => s.type === 'experience');
  const expItems = expSec && 'items' in expSec ? expSec.items : [];
  const hasMetrics = expItems.some((e: any) => /\b\d+[%+kKmM]?\b/.test(e.accomplishments || e.description || ''));

  checks.push({
    id: 'experience',
    label: 'Work Experience',
    status: expItems.length >= 2 ? 'passed' : expItems.length === 1 ? 'warning' : 'missing',
    tip: expItems.length === 0
      ? 'Add your job or internship experience.'
      : !hasMetrics
      ? 'Add measurable achievements (numbers, percentages, or metrics) to your work experience.'
      : undefined,
    weight: 20,
  });

  // 5. Education
  const eduSec = sections.find((s) => s.type === 'education');
  const eduItems = eduSec && 'items' in eduSec ? eduSec.items : [];
  checks.push({
    id: 'education',
    label: 'Education',
    status: eduItems.length >= 1 ? 'passed' : 'missing',
    tip: eduItems.length === 0 ? 'Add your school, degree, or program.' : undefined,
    weight: 15,
  });

  // 6. Skills
  const skillSec = sections.find((s) => s.type === 'skills');
  const totalSkills = skillSec && 'groups' in skillSec
    ? skillSec.groups.reduce((acc: number, g: any) => acc + g.skills.length, 0)
    : 0;

  checks.push({
    id: 'skills',
    label: 'Skills',
    status: totalSkills >= 5 ? 'passed' : totalSkills >= 1 ? 'warning' : 'missing',
    tip: totalSkills < 5 ? 'Add at least 5 relevant technical or industry skills.' : undefined,
    weight: 10,
  });

  // 7. Projects or Certifications
  const projSec = sections.find((s) => s.type === 'projects');
  const projCount = projSec && 'items' in projSec ? projSec.items.length : 0;
  const certSec = sections.find((s) => s.type === 'certifications');
  const certCount = certSec && 'items' in certSec ? certSec.items.length : 0;

  checks.push({
    id: 'projects_certs',
    label: 'Projects & Certifications',
    status: projCount + certCount >= 2 ? 'passed' : projCount + certCount >= 1 ? 'warning' : 'missing',
    tip: projCount === 0 && certCount === 0
      ? 'Include portfolio projects or relevant certifications to stand out.'
      : undefined,
    weight: 10,
  });

  // Calculate score percentage
  let earned = 0;
  checks.forEach((c) => {
    if (c.status === 'passed') earned += c.weight;
    else if (c.status === 'warning') earned += Math.round(c.weight * 0.5);
  });
  const scorePercent = Math.min(100, Math.max(0, earned));

  const recommendations = checks.filter((c) => c.tip);

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
