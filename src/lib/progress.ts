import type { Resume, Section } from '../types/resume';
import { isHtmlEmpty } from './format';

export interface SectionProgress {
  filled: boolean;
  /** Short badge text shown next to the section title in the editor */
  label: string;
}

const plural = (n: number, word: string, words = `${word}s`) => `${n} ${n === 1 ? word : words}`;

export function sectionProgress(section: Section): SectionProgress {
  if ('items' in section) {
    const n = section.items.length;
    return { filled: n > 0, label: n ? plural(n, 'entry', 'entries') : 'Empty' };
  }
  if ('groups' in section) {
    const n = section.groups.reduce((sum, g) => sum + g.skills.filter((s) => s.trim()).length, 0);
    return { filled: n > 0, label: n ? plural(n, 'skill') : 'Empty' };
  }
  const filled = !isHtmlEmpty(section.content);
  return { filled, label: filled ? 'Done' : 'Empty' };
}

export function personalProgress(resume: Resume): SectionProgress {
  const { fullName, email, phone } = resume.personal;
  const filled = [fullName, email, phone].every((v) => v.trim());
  return { filled, label: filled ? 'Done' : 'Incomplete' };
}
