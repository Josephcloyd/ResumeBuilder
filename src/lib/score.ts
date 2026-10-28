import type { Resume } from '../types/resume';

export interface CheckItem {
  id: string;
  label: string;
  status: 'passed' | 'warning' | 'missing';
  tip?: string;
  weight: number;
}

/** Completeness checks and 0–100 score shown on the Review tab. */
export function scoreResume(resume: Resume) {
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

  return { checks, scorePercent, recommendations };
}
