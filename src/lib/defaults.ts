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
import { PAGE_SIZES, PHOTO_SIZE, TEMPLATES, clampPhotoSize, marginsFromPreset } from './constants';
import { sanitizeUntrustedResumeData } from './security';

export const uid = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
  ).slice(0, 12);

export const SCHEMA_VERSION = 2;

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
    label: 'Organizations & Affiliations',
    standardTitle: 'Organizations & Affiliations',
    description: 'Leadership roles, clubs, societies and professional affiliations.',
    optional: true,
    duplicable: true,
    defaultColumn: 'main',
    fields: { title: 'Position / Role', subtitle: 'Organization / Affiliation', date: 'Start', endDate: 'End', description: 'Description' },
    emptyText: 'No organizations or affiliations added yet.',
    addLabel: 'Add Organization or Affiliation',
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
      photoSize: PHOTO_SIZE.default,
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

const sampleProfileImage = (src: string) => ({
  original: src,
  src,
  naturalWidth: 1254,
  naturalHeight: 1254,
  crop: { aspect: 1, zoom: 1, cx: 0.5, cy: 0.5 },
});

function createMayaSample(): Resume {
  const r = createBlankResume('UX Designer Sample');
  r.id = 'sample-maya-santos';
  r.personal = {
    ...r.personal,
    fullName: 'Maya Santos',
    professionalTitle: 'Product & UX Designer',
    email: 'maya.santos@example.com',
    location: 'Makati City, Philippines',
    linkedIn: 'linkedin.com/in/maya-santos-sample',
    portfolio: 'mayasantos.example.com',
    profileImage: sampleProfileImage('/sample-profile-maya.png'),
    photoShape: 'rounded',
  };
  r.design.template = 'two-column-modern';
  r.design.accentColor = '#7C3AED';
  r.layout.columns = 2;

  const [summary, experience, projects, education, skills] = r.sections as [
    Extract<Section, { type: 'summary' }>,
    Extract<Section, { type: 'experience' }>,
    Extract<Section, { type: 'projects' }>,
    Extract<Section, { type: 'education' }>,
    Extract<Section, { type: 'skills' }>,
  ];
  summary.content =
    '<p>Product designer who turns complex workflows into clear, accessible experiences. Skilled in user research, prototyping, design systems, and cross-functional collaboration.</p>';
  experience.items = [
    newExperience({
      jobTitle: 'UX Designer',
      company: 'Northstar Digital Studio',
      location: 'Makati City',
      startDate: '2023',
      endDate: 'Present',
      current: true,
      accomplishments: ul([
        'Redesigned a customer onboarding flow and improved completion by 24%.',
        'Built a reusable component library with product and engineering teams.',
        'Planned usability studies and translated findings into prioritized improvements.',
      ]),
    }),
    newExperience({
      jobTitle: 'Junior UI Designer',
      company: 'Pixel Harbor Creative',
      location: 'Remote',
      startDate: '2021',
      endDate: '2023',
      accomplishments: ul([
        'Created responsive interfaces for web and mobile products.',
        'Prepared developer-ready specifications and accessibility annotations.',
      ]),
    }),
  ];
  projects.items = [
    newProject({
      name: 'Community Care Portal',
      role: 'Lead Product Designer',
      technologies: 'Figma, FigJam, Maze',
      description: 'Designed a mobile-first service portal for appointment booking and case updates.',
    }),
  ];
  education.items = [
    newEducation({
      degree: 'Bachelor of Fine Arts',
      program: 'Information Design',
      school: 'Sample Metropolitan College',
      startYear: '2017',
      endYear: '2021',
    }),
  ];
  skills.groups = [
    newSkillGroup({ name: 'Design', skills: ['User Research', 'Interaction Design', 'Prototyping', 'Design Systems'] }),
    newSkillGroup({ name: 'Tools', skills: ['Figma', 'FigJam', 'Maze', 'Adobe Creative Cloud'] }),
  ];
  r.sections = r.sections.filter((section) => section.type !== 'certifications');
  return r;
}

function createAdrianSample(): Resume {
  const r = createBlankResume('Software Engineer Sample');
  r.id = 'sample-adrian-reyes';
  r.personal = {
    ...r.personal,
    fullName: 'Adrian Reyes',
    professionalTitle: 'Full-Stack Software Engineer',
    email: 'adrian.reyes@example.com',
    location: 'Cebu City, Philippines',
    github: 'github.com/adrian-reyes-sample',
    website: 'adrianreyes.example.com',
    profileImage: sampleProfileImage('/sample-profile-adrian.png'),
  };
  r.design.template = 'developer';
  r.design.accentColor = '#0F766E';

  const [summary, experience, projects, education, skills, certifications] = r.sections as [
    Extract<Section, { type: 'summary' }>,
    Extract<Section, { type: 'experience' }>,
    Extract<Section, { type: 'projects' }>,
    Extract<Section, { type: 'education' }>,
    Extract<Section, { type: 'skills' }>,
    Extract<Section, { type: 'certifications' }>,
  ];
  summary.content =
    '<p>Full-stack engineer focused on reliable web applications, practical automation, and maintainable APIs. Comfortable owning features from technical planning through deployment.</p>';
  experience.items = [
    newExperience({
      jobTitle: 'Software Engineer',
      company: 'Harborline Systems',
      location: 'Cebu City',
      startDate: '2022',
      endDate: 'Present',
      current: true,
      accomplishments: ul([
        'Delivered internal workflow tools that reduced manual processing time by 35%.',
        'Designed REST APIs and background jobs for high-volume business operations.',
        'Improved release confidence with automated tests and deployment checks.',
      ]),
    }),
    newExperience({
      jobTitle: 'Web Development Intern',
      company: 'Brightbyte Labs',
      location: 'Remote',
      startDate: '2021',
      endDate: '2022',
      accomplishments: ul([
        'Implemented accessible React components and responsive dashboards.',
        'Resolved defects across frontend, API, and database layers.',
      ]),
    }),
  ];
  projects.items = [
    newProject({
      name: 'Inventory Forecasting Dashboard',
      role: 'Full-Stack Developer',
      technologies: 'TypeScript, React, Node.js, PostgreSQL',
      description: 'Built a planning dashboard with role-based access, reporting, and automated alerts.',
    }),
    newProject({
      name: 'Open Source Form Toolkit',
      technologies: 'React, Vitest, Storybook',
      description: 'Created reusable accessible form components with validation and test coverage.',
    }),
  ];
  education.items = [
    newEducation({
      degree: 'Bachelor of Science',
      program: 'Computer Science',
      school: 'Sample Institute of Technology',
      startYear: '2017',
      endYear: '2021',
    }),
  ];
  skills.groups = [
    newSkillGroup({ name: 'Languages', skills: ['TypeScript', 'JavaScript', 'Python', 'SQL'] }),
    newSkillGroup({ name: 'Web', skills: ['React', 'Node.js', 'REST APIs', 'HTML', 'CSS'] }),
    newSkillGroup({ name: 'Data & Delivery', skills: ['PostgreSQL', 'Git', 'Docker', 'CI/CD'] }),
  ];
  certifications.items = [
    newCertification({
      name: 'Cloud Fundamentals',
      certificationName: 'Cloud Fundamentals',
      organization: 'Example Learning Academy',
      issueDate: '2024',
    }),
  ];
  return r;
}

/** Fictional examples shown to new users. No real contact details are used. */
export function createSampleResumes(): Resume[] {
  return [createMayaSample(), createAdrianSample()];
}

/** Identifies the old personal demo by its bundled content, without retaining its contact details. */
export function isLegacyBundledResume(resume: Resume): boolean {
  const hasLegacyRole = resume.sections.some(
    (section) =>
      section.type === 'experience' &&
      section.items.some((item) => item.company === 'Lifewood Data Technology'),
  );
  const hasLegacyProject = resume.sections.some(
    (section) =>
      section.type === 'projects' &&
      section.items.some((item) => item.name.includes('LifePlan')),
  );
  return hasLegacyRole && hasLegacyProject;
}

/** Fill missing fields from imported / older data so the app never crashes. */
export function normalizeResume(input: unknown): Resume {
  const blank = createBlankResume();
  const r = sanitizeUntrustedResumeData(input ?? {}) as Partial<Resume>;
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
  const finite = (value: unknown, fallback: number, min: number, max: number) =>
    typeof value === 'number' && Number.isFinite(value)
      ? Math.min(max, Math.max(min, value))
      : fallback;
  const allowed = <T extends string>(value: unknown, options: readonly T[], fallback: T): T =>
    typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;

  out.personal.photoSize = clampPhotoSize(out.personal.photoSize);
  out.personal.photoShape = allowed(out.personal.photoShape, ['circle', 'rounded', 'square', 'none'], blank.personal.photoShape);
  out.design.template = allowed(out.design.template, TEMPLATES.map((template) => template.id), blank.design.template);
  out.design.atsMode = typeof out.design.atsMode === 'boolean' ? out.design.atsMode : blank.design.atsMode;
  out.fonts.nameSize = finite(out.fonts.nameSize, blank.fonts.nameSize, 14, 72);
  out.fonts.headingSize = finite(out.fonts.headingSize, blank.fonts.headingSize, 8, 32);
  out.fonts.headingWeight = finite(out.fonts.headingWeight, blank.fonts.headingWeight, 100, 900);
  out.fonts.bodySize = finite(out.fonts.bodySize, blank.fonts.bodySize, 7, 24);
  out.fonts.bodyWeight = finite(out.fonts.bodyWeight, blank.fonts.bodyWeight, 100, 900);
  out.fonts.lineHeight = finite(out.fonts.lineHeight, blank.fonts.lineHeight, 0.9, 3);
  out.layout.pageSize = allowed(out.layout.pageSize, PAGE_SIZES.map((size) => size.id), blank.layout.pageSize);
  out.layout.marginPreset = allowed(out.layout.marginPreset, ['xnarrow', 'narrow', 'normal', 'wide', 'custom'], blank.layout.marginPreset);
  out.layout.marginUnit = allowed(out.layout.marginUnit, ['mm', 'cm', 'in'], blank.layout.marginUnit);
  out.layout.spacingPreset = allowed(out.layout.spacingPreset, ['compact', 'normal', 'relaxed', 'custom'], blank.layout.spacingPreset);
  out.layout.columns = out.layout.columns === 2 ? 2 : 1;
  out.layout.headingAlignment = allowed(out.layout.headingAlignment, ['left', 'center', 'right'], blank.layout.headingAlignment);
  out.layout.bodyAlignment = allowed(out.layout.bodyAlignment, ['left', 'center', 'right', 'justify'], blank.layout.bodyAlignment);
  out.layout.density = allowed(out.layout.density, ['compact', 'normal', 'spacious'], blank.layout.density);
  out.layout.sectionGap = allowed(out.layout.sectionGap, ['small', 'medium', 'large'], blank.layout.sectionGap);
  out.layout.margins.top = finite(out.layout.margins.top, blank.layout.margins.top, 0, 60);
  out.layout.margins.bottom = finite(out.layout.margins.bottom, blank.layout.margins.bottom, 0, 60);
  out.layout.margins.left = finite(out.layout.margins.left, blank.layout.margins.left, 0, 60);
  out.layout.margins.right = finite(out.layout.margins.right, blank.layout.margins.right, 0, 60);
  out.pageCount = Math.round(finite(out.pageCount, 1, 1, 100));
  out.sections = out.sections
    .filter(
      (s) =>
        s &&
        typeof s === 'object' &&
        'type' in s &&
        typeof s.type === 'string' &&
        Object.prototype.hasOwnProperty.call(SECTION_META, s.type),
    )
    .slice(0, 40)
    .map((s) => {
      const def = createSection(s.type);
      const merged = { ...def, ...s, id: s.id || uid() } as Section;
      if ('items' in merged) {
        (merged as { items: unknown[] }).items = Array.isArray(merged.items)
          ? merged.items.filter((item) => item && typeof item === 'object').slice(0, 100)
          : [];
      }
      if (merged.type === 'skills') {
        merged.groups = Array.isArray(merged.groups)
          ? merged.groups.filter((group) => group && typeof group === 'object').slice(0, 50)
          : [];
      }
      return merged;
    });
  if (out.sections.length === 0) out.sections = blank.sections;
  if (!/^#[0-9a-f]{6}$/i.test(out.design.accentColor)) out.design.accentColor = blank.design.accentColor;
  out.version = SCHEMA_VERSION;

  return out;
}
