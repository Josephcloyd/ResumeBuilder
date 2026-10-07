import type {
  CertificationItem,
  EducationItem,
  ExperienceItem,
  GenericItem,
  GenericSectionType,
  ProjectItem,
  Resume,
  Section,
  SectionType,
  SkillGroup,
} from '../types/resume';
import { marginsFromPreset } from './constants';

export const uid = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
  ).slice(0, 12);

export const SCHEMA_VERSION = 1;

type GenericField = 'title' | 'subtitle' | 'location' | 'date' | 'endDate' | 'url' | 'description';

export interface SectionMeta {
  label: string;
  /** Standard ATS-friendly heading */
  standardTitle: string;
  description: string;
  optional: boolean;
  duplicable: boolean;
  defaultColumn: 'main' | 'side';
  fields?: Partial<Record<GenericField, string>>;
  images?: boolean;
  /** render as compact inline list (e.g. languages, interests) */
  inline?: boolean;
  emptyText: string;
  addLabel: string;
}

export const SECTION_META: Record<SectionType, SectionMeta> = {
  summary: {
    label: 'Professional Summary',
    standardTitle: 'Summary',
    description: 'A short overview of who you are.',
    optional: false,
    duplicable: false,
    defaultColumn: 'main',
    emptyText: 'No summary written yet.',
    addLabel: 'Write summary',
  },
  experience: {
    label: 'Work Experience',
    standardTitle: 'Work Experience',
    description: 'Jobs, internships and freelance work.',
    optional: false,
    duplicable: true,
    defaultColumn: 'main',
    emptyText: 'No work experience added yet.',
    addLabel: 'Add Experience',
  },
  education: {
    label: 'Education',
    standardTitle: 'Education',
    description: 'Schools, degrees and programs.',
    optional: false,
    duplicable: false,
    defaultColumn: 'main',
    emptyText: 'No education added yet.',
    addLabel: 'Add Education',
  },
  projects: {
    label: 'Projects',
    standardTitle: 'Projects',
    description: 'Personal, academic or professional projects.',
    optional: false,
    duplicable: true,
    defaultColumn: 'main',
    emptyText: 'No projects added yet.',
    addLabel: 'Add Project',
  },
  skills: {
    label: 'Skills',
    standardTitle: 'Skills',
    description: 'Technical and soft skills grouped by category.',
    optional: false,
    duplicable: false,
    defaultColumn: 'side',
    emptyText: 'No skills added yet.',
    addLabel: 'Add Skill Category',
  },
  certifications: {
    label: 'Certifications',
    standardTitle: 'Certifications',
    description: 'Licenses, certificates and credentials.',
    optional: false,
    duplicable: false,
    defaultColumn: 'main',
    emptyText: 'No certificates added yet.',
    addLabel: 'Add Certificate',
  },
  custom: {
    label: 'Custom Section',
    standardTitle: 'Additional Information',
    description: 'Your own title and content.',
    optional: true,
    duplicable: true,
    defaultColumn: 'main',
    emptyText: 'This section is empty.',
    addLabel: 'Add Content',
  },
  awards: {
    label: 'Awards',
    standardTitle: 'Awards',
    description: 'Honors and recognitions.',
    optional: true,
    duplicable: true,
    defaultColumn: 'main',
    fields: { title: 'Award Name', subtitle: 'Awarding Organization', date: 'Date', url: 'Link', description: 'Description' },
    images: true,
    emptyText: 'No awards added yet.',
    addLabel: 'Add Award',
  },
  achievements: {
    label: 'Achievements',
    standardTitle: 'Achievements',
    description: 'Notable accomplishments.',
    optional: true,
    duplicable: true,
    defaultColumn: 'main',
    fields: { title: 'Achievement', subtitle: 'Organization / Context', date: 'Date', description: 'Description' },
    images: true,
    emptyText: 'No achievements added yet.',
    addLabel: 'Add Achievement',
  },
  languages: {
    label: 'Languages',
    standardTitle: 'Languages',
    description: 'Languages and proficiency.',
    optional: true,
    duplicable: false,
    defaultColumn: 'side',
    fields: { title: 'Language', subtitle: 'Proficiency (e.g. Native, Fluent)' },
    inline: true,
    emptyText: 'No languages added yet.',
    addLabel: 'Add Language',
  },
  volunteer: {
    label: 'Volunteer Experience',
    standardTitle: 'Volunteer Experience',
    description: 'Community and volunteer work.',
    optional: true,
    duplicable: true,
    defaultColumn: 'main',
    fields: { title: 'Role', subtitle: 'Organization', location: 'Location', date: 'Start', endDate: 'End', description: 'Description' },
    emptyText: 'No volunteer experience added yet.',
    addLabel: 'Add Volunteer Work',
  },
  organizations: {
    label: 'Organizations',
    standardTitle: 'Organizations',
    description: 'Clubs, societies and memberships.',
    optional: true,
    duplicable: true,
    defaultColumn: 'main',
    fields: { title: 'Organization', subtitle: 'Position / Role', date: 'Start', endDate: 'End', description: 'Description' },
    emptyText: 'No organizations added yet.',
    addLabel: 'Add Organization',
  },
  seminars: {
    label: 'Seminars',
    standardTitle: 'Seminars Attended',
    description: 'Seminars, webinars and conferences.',
    optional: true,
    duplicable: true,
    defaultColumn: 'main',
    fields: { title: 'Seminar Title', subtitle: 'Organizer', location: 'Venue / Location', date: 'Date', description: 'Description' },
    images: true,
    emptyText: 'No seminars added yet.',
    addLabel: 'Add Seminar',
  },
  training: {
    label: 'Training',
    standardTitle: 'Training',
    description: 'Courses, bootcamps and workshops.',
    optional: true,
    duplicable: true,
    defaultColumn: 'main',
    fields: { title: 'Training / Course', subtitle: 'Provider', location: 'Location', date: 'Start', endDate: 'End', description: 'Description' },
    images: true,
    emptyText: 'No training added yet.',
    addLabel: 'Add Training',
  },
  references: {
    label: 'References',
    standardTitle: 'References',
    description: 'People who can vouch for you.',
    optional: true,
    duplicable: false,
    defaultColumn: 'main',
    fields: { title: 'Full Name', subtitle: 'Position & Company', location: 'Email / Phone', description: 'Notes' },
    emptyText: 'No references added yet.',
    addLabel: 'Add Reference',
  },
  publications: {
    label: 'Publications',
    standardTitle: 'Publications',
    description: 'Papers, articles and books.',
    optional: true,
    duplicable: false,
    defaultColumn: 'main',
    fields: { title: 'Title', subtitle: 'Publisher / Journal', date: 'Date', url: 'Link / DOI', description: 'Description' },
    emptyText: 'No publications added yet.',
    addLabel: 'Add Publication',
  },
  interests: {
    label: 'Interests',
    standardTitle: 'Interests',
    description: 'Hobbies and interests.',
    optional: true,
    duplicable: false,
    defaultColumn: 'side',
    fields: { title: 'Interest' },
    inline: true,
    emptyText: 'No interests added yet.',
    addLabel: 'Add Interest',
  },
};

export const GENERIC_TYPES: GenericSectionType[] = [
  'awards',
  'achievements',
  'languages',
  'volunteer',
  'organizations',
  'seminars',
  'training',
  'references',
  'publications',
  'interests',
];

export const isGenericType = (t: SectionType): t is GenericSectionType =>
  (GENERIC_TYPES as string[]).includes(t);

/* ---------- item factories ---------- */

export const newExperience = (p: Partial<ExperienceItem> = {}): ExperienceItem => ({
  id: uid(),
  jobTitle: '',
  company: '',
  location: '',
  startDate: '',
  endDate: '',
  current: false,
  description: '',
  accomplishments: '',
  align: 'inherit',
  ...p,
});

export const newEducation = (p: Partial<EducationItem> = {}): EducationItem => ({
  id: uid(),
  degree: '',
  program: '',
  school: '',
  location: '',
  startYear: '',
  endYear: '',
  description: '',
  align: 'inherit',
  ...p,
});

export const newProject = (p: Partial<ProjectItem> = {}): ProjectItem => ({
  id: uid(),
  name: '',
  role: '',
  description: '',
  technologies: '',
  url: '',
  githubUrl: '',
  startDate: '',
  endDate: '',
  align: 'inherit',
  ...p,
});

export const newCertification = (p: Partial<CertificationItem> = {}): CertificationItem => ({
  id: uid(),
  name: '',
  certificationName: '',
  organization: '',
  issueDate: '',
  expirationDate: '',
  credentialId: '',
  credentialUrl: '',
  description: '',
  image: null,
  imageSize: 'medium',
  imagePosition: 'below',
  align: 'inherit',
  ...p,
});

export const newGeneric = (p: Partial<GenericItem> = {}): GenericItem => ({
  id: uid(),
  title: '',
  subtitle: '',
  location: '',
  date: '',
  endDate: '',
  url: '',
  description: '',
  image: null,
  imageSize: 'small',
  imagePosition: 'right',
  align: 'inherit',
  ...p,
});

export const newSkillGroup = (p: Partial<SkillGroup> = {}): SkillGroup => ({
  id: uid(),
  name: '',
  skills: [],
  ...p,
});

export function createSection(type: SectionType, title?: string): Section {
  const meta = SECTION_META[type];
  const base = {
    id: uid(),
    title: title ?? meta.label,
    visible: true,
    align: 'inherit' as const,
    column: meta.defaultColumn,
  };
  switch (type) {
    case 'summary':
      return { ...base, type, content: '' };
    case 'custom':
      return { ...base, type, content: '' };
    case 'experience':
      return { ...base, type, items: [] };
    case 'education':
      return { ...base, type, items: [] };
    case 'projects':
      return { ...base, type, items: [] };
    case 'skills':
      return { ...base, type, display: 'categories', groups: [] };
    case 'certifications':
      return { ...base, type, displayMode: 'imageText', galleryColumns: 2, items: [] };
    default:
      return { ...base, type, items: [] };
  }
}

/** Deep clone a section with fresh IDs (for duplicating). */
export function cloneSection(s: Section): Section {
  const copy = JSON.parse(JSON.stringify(s)) as Section;
  copy.id = uid();
  copy.title = `${s.title} (Copy)`;
  if ('items' in copy) copy.items.forEach((i) => (i.id = uid()));
  if (copy.type === 'skills') copy.groups.forEach((g) => (g.id = uid()));
  return copy;
}

/* ---------- resume factories ---------- */

const baseSettings = (): Pick<Resume, 'design' | 'fonts' | 'layout'> => ({
  design: { template: 'blue-minimal', accentColor: '#2563EB', atsMode: false },
  fonts: {
    headingFont: 'Inter',
    nameSize: 28,
    headingSize: 13,
    headingWeight: 700,
    bodyFont: 'Inter',
    bodySize: 11,
    bodyWeight: 400,
    lineHeight: 1.4,
  },
  layout: {
    pageSize: 'short',
    marginPreset: 'normal',
    margins: marginsFromPreset('normal'),
    marginUnit: 'mm',
    spacingPreset: 'normal',
    columns: 1,
    headingAlignment: 'left',
    bodyAlignment: 'left',
    density: 'normal',
    sectionGap: 'medium',
  },
});

export function createBlankResume(title = 'Untitled Resume'): Resume {
  const now = Date.now();
  return {
    id: uid(),
    title,
    personal: {
      fullName: '',
      professionalTitle: '',
      email: '',
      phone: '',
      location: '',
      linkedIn: '',
      github: '',
      portfolio: '',
      website: '',
      profileImage: null,
      photoShape: 'circle',
      photoSize: 96,
    },
    sections: [
      createSection('summary'),
      createSection('experience'),
      createSection('projects'),
      createSection('education'),
      createSection('skills'),
      createSection('certifications'),
    ],
    ...baseSettings(),
    pageCount: 1,
    createdAt: now,
    updatedAt: now,
    version: SCHEMA_VERSION,
  };
}

const ul = (items: string[]) => `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;

export function createSampleResume(): Resume {
  const r = createBlankResume('General Resume');
  r.personal = {
    ...r.personal,
    fullName: 'Joseph Dano',
    professionalTitle: 'Computer Engineering Student · Software Developer',
    email: 'joseph.dano@email.com',
    phone: '+63 912 345 6789',
    location: 'Cebu City, Philippines',
    linkedIn: 'linkedin.com/in/josephdano',
    github: 'github.com/josephdano',
    portfolio: 'josephdano.dev',
  };
  const [summary, experience, projects, education, skills, certs] = r.sections as [
    Extract<Section, { type: 'summary' }>,
    Extract<Section, { type: 'experience' }>,
    Extract<Section, { type: 'projects' }>,
    Extract<Section, { type: 'education' }>,
    Extract<Section, { type: 'skills' }>,
    Extract<Section, { type: 'certifications' }>,
  ];
  summary.content =
    'Computer Engineering student specializing in software development, embedded systems, cloud technologies, and system development. Passionate about building reliable, user-focused applications and turning hardware and software ideas into working products.';
  experience.items = [
    newExperience({
      jobTitle: 'Software Developer Intern',
      company: 'Nimbus Tech Solutions',
      location: 'Cebu City',
      startDate: '2026-03',
      endDate: '',
      current: true,
      description: 'Develop internal tools and customer-facing features for a cloud-based inventory platform.',
      accomplishments: ul([
        'Built a React + TypeScript dashboard used by <b>40+ staff</b>, reducing report preparation time by 35%.',
        'Implemented REST endpoints and automated tests, increasing API test coverage from 48% to 82%.',
        'Collaborated in two-week sprints with designers and senior engineers.',
      ]),
    }),
    newExperience({
      jobTitle: 'IT Support Assistant',
      company: 'University Computer Center',
      location: 'Cebu City',
      startDate: '2025-06',
      endDate: '2026-02',
      description: ul([
        'Maintained 120+ laboratory workstations and campus network equipment.',
        'Resolved an average of 25 support tickets per week with a 96% satisfaction rating.',
      ]),
    }),
  ];
  projects.items = [
    newProject({
      name: 'RFID Smart Attendance System',
      role: 'Lead Developer',
      technologies: 'ESP32, RFID, Firebase, React',
      githubUrl: 'github.com/josephdano/rfid-attendance',
      startDate: '2025-08',
      endDate: '2025-12',
      description:
        'Designed an IoT attendance system that logs RFID taps to a real-time cloud database and displays analytics on a web dashboard for 300+ students.',
    }),
    newProject({
      name: 'ResumeFlow',
      role: 'Full-stack Developer',
      technologies: 'React, TypeScript, Tailwind CSS',
      url: 'resumeflow.app',
      startDate: '2026-09',
      description: 'A professional online resume builder with live preview, templates and print-accurate PDF export.',
    }),
  ];
  education.items = [
    newEducation({
      degree: 'Bachelor of Science',
      program: 'Computer Engineering',
      school: 'University of San Carlos',
      location: 'Cebu City',
      startYear: '2023',
      endYear: '2027',
      description: "Dean's Lister (2023–2026) · Member, Institute of Computer Engineers of the Philippines",
    }),
  ];
  skills.groups = [
    newSkillGroup({ name: 'Programming', skills: ['Python', 'JavaScript', 'TypeScript', 'C/C++'] }),
    newSkillGroup({ name: 'Web Development', skills: ['React', 'Next.js', 'HTML', 'CSS', 'Tailwind CSS'] }),
    newSkillGroup({ name: 'Hardware', skills: ['ESP32', 'Arduino', 'RFID', 'Raspberry Pi'] }),
    newSkillGroup({ name: 'Cloud & Tools', skills: ['AWS', 'Firebase', 'Git', 'Docker'] }),
  ];
  certs.items = [
    newCertification({
      name: 'AWS Certified Cloud Practitioner',
      organization: 'Amazon Web Services',
      issueDate: '2026-06',
      credentialId: 'AWS-CCP-0193',
      credentialUrl: 'https://aws.amazon.com/verification',
    }),
  ];
  const langs = createSection('languages');
  if ('items' in langs) {
    (langs.items as GenericItem[]).push(
      newGeneric({ title: 'English', subtitle: 'Fluent' }),
      newGeneric({ title: 'Filipino', subtitle: 'Native' }),
      newGeneric({ title: 'Cebuano', subtitle: 'Native' }),
    );
  }
  r.sections.push(langs);
  return r;
}

/** Fill missing fields from imported / older data so the app never crashes. */
export function normalizeResume(input: unknown): Resume {
  const blank = createBlankResume();
  const r = (input ?? {}) as Partial<Resume>;
  const out: Resume = {
    ...blank,
    ...r,
    personal: { ...blank.personal, ...(r.personal ?? {}) },
    design: { ...blank.design, ...(r.design ?? {}) },
    fonts: { ...blank.fonts, ...(r.fonts ?? {}) },
    layout: {
      ...blank.layout,
      ...(r.layout ?? {}),
      margins: { ...blank.layout.margins, ...(r.layout?.margins ?? {}) },
    },
    sections: Array.isArray(r.sections) ? r.sections : blank.sections,
  };
  out.sections = out.sections
    .filter((s) => s && typeof s === 'object' && 'type' in s && s.type in SECTION_META)
    .map((s) => {
      const def = createSection(s.type);
      const merged = { ...def, ...s, id: s.id || uid() } as Section;
      if ('items' in merged && !Array.isArray(merged.items)) (merged as { items: unknown[] }).items = [];
      if (merged.type === 'skills' && !Array.isArray(merged.groups)) merged.groups = [];
      return merged;
    });
  out.version = SCHEMA_VERSION;
  return out;
}
