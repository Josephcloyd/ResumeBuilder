/* ResumeFlow data model.
 * The resume is section-based: `sections` is an ordered array, which makes
 * reordering, duplicating, hiding, renaming and template switching lossless.
 */

export type Align = 'left' | 'center' | 'right' | 'justify';
export type AlignOrInherit = Align | 'inherit';
export type HeadingAlign = 'left' | 'center' | 'right';

export type PageSizeId = 'a4' | 'letter' | 'short' | 'long' | 'legal';
export type MarginPreset = 'xnarrow' | 'narrow' | 'normal' | 'wide' | 'custom';
export type LengthUnit = 'mm' | 'cm' | 'in';
export type Density = 'compact' | 'normal' | 'spacious';
export type GapSize = 'small' | 'medium' | 'large';
export type SpacingPreset = 'compact' | 'normal' | 'relaxed' | 'custom';

export type TemplateId =
  | 'blue-minimal'
  | 'modern-professional'
  | 'developer'
  | 'corporate'
  | 'simple-ats'
  | 'two-column-modern'
  | 'academic'
  | 'fresh-graduate';

export type PhotoShape = 'circle' | 'rounded' | 'square' | 'none';

/** Image with stored crop state so it can be re-cropped later. */
export interface ImageAsset {
  /** Compressed original (data URL). */
  original: string;
  /** Cropped output used for rendering (data URL). */
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  crop: {
    /** aspect ratio w/h; 0 = original image ratio */
    aspect: number;
    zoom: number;
    /** normalized centre in image space (0..1) */
    cx: number;
    cy: number;
  };
}

export interface PersonalInfo {
  fullName: string;
  professionalTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedIn: string;
  github: string;
  portfolio: string;
  website: string;
  profileImage: ImageAsset | null;
  photoShape: PhotoShape;
  photoSize: number; // px
}

export interface ExperienceItem {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string; // rich html
  accomplishments: string; // rich html
  align: AlignOrInherit;
}

export interface EducationItem {
  id: string;
  degree: string;
  program: string;
  school: string;
  location: string;
  startYear: string;
  endYear: string;
  description: string;
  align: AlignOrInherit;
}

export interface ProjectItem {
  id: string;
  name: string;
  role: string;
  description: string;
  technologies: string;
  url: string;
  githubUrl: string;
  startDate: string;
  endDate: string;
  align: AlignOrInherit;
}

export type CertImageSize = 'hidden' | 'small' | 'medium' | 'large' | 'full';
export type CertImagePosition = 'above' | 'below' | 'left' | 'right';

export interface CertificationItem {
  id: string;
  name: string; // certificate name
  certificationName: string; // certification / program name
  organization: string;
  issueDate: string;
  expirationDate: string;
  credentialId: string;
  credentialUrl: string;
  description: string;
  image: ImageAsset | null;
  imageSize: CertImageSize;
  imagePosition: CertImagePosition;
  align: AlignOrInherit;
}

export interface SkillGroup {
  id: string;
  name: string;
  skills: string[];
}

/** Generic entry used by awards, training, seminars, languages, references, etc. */
export interface GenericItem {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  date: string;
  endDate: string;
  url: string;
  description: string;
  image: ImageAsset | null;
  imageSize: CertImageSize;
  imagePosition: CertImagePosition;
  align: AlignOrInherit;
}

export type GenericSectionType =
  | 'awards'
  | 'achievements'
  | 'languages'
  | 'volunteer'
  | 'organizations'
  | 'seminars'
  | 'training'
  | 'references'
  | 'publications'
  | 'interests';

export type SectionType =
  | 'summary'
  | 'experience'
  | 'education'
  | 'projects'
  | 'skills'
  | 'certifications'
  | 'custom'
  | GenericSectionType;

interface SectionBase {
  id: string;
  title: string;
  visible: boolean;
  align: AlignOrInherit;
  /** Column for two-column layouts */
  column: 'main' | 'side';
}

export interface SummarySection extends SectionBase {
  type: 'summary';
  content: string;
}
export interface ExperienceSection extends SectionBase {
  type: 'experience';
  items: ExperienceItem[];
}
export interface EducationSection extends SectionBase {
  type: 'education';
  items: EducationItem[];
}
export interface ProjectsSection extends SectionBase {
  type: 'projects';
  items: ProjectItem[];
}
export type SkillsDisplay = 'text' | 'tags' | 'bullets' | 'categories';
export interface SkillsSection extends SectionBase {
  type: 'skills';
  display: SkillsDisplay;
  groups: SkillGroup[];
}
export type CertDisplayMode = 'text' | 'imageText' | 'gallery';
export interface CertificationsSection extends SectionBase {
  type: 'certifications';
  displayMode: CertDisplayMode;
  galleryColumns: 1 | 2 | 3;
  items: CertificationItem[];
}
export interface CustomSection extends SectionBase {
  type: 'custom';
  content: string;
}
export interface GenericSection extends SectionBase {
  type: GenericSectionType;
  items: GenericItem[];
}

export type Section =
  | SummarySection
  | ExperienceSection
  | EducationSection
  | ProjectsSection
  | SkillsSection
  | CertificationsSection
  | CustomSection
  | GenericSection;

export interface DesignSettings {
  template: TemplateId;
  accentColor: string;
  atsMode: boolean;
}

export interface FontSettings {
  headingFont: string;
  nameSize: number;
  headingSize: number;
  headingWeight: number;
  bodyFont: string;
  bodySize: number;
  bodyWeight: number;
  lineHeight: number;
}

export interface Margins {
  top: number; // mm
  bottom: number;
  left: number;
  right: number;
}

export interface LayoutSettings {
  pageSize: PageSizeId;
  marginPreset: MarginPreset;
  margins: Margins;
  marginUnit: LengthUnit;
  spacingPreset: SpacingPreset;
  columns: 1 | 2;
  headingAlignment: HeadingAlign;
  bodyAlignment: Align;
  density: Density;
  sectionGap: GapSize;
}

export interface Resume {
  id: string;
  title: string;
  personal: PersonalInfo;
  sections: Section[];
  design: DesignSettings;
  fonts: FontSettings;
  layout: LayoutSettings;
  /** last known page count (for library cards) */
  pageCount: number;
  createdAt: number;
  updatedAt: number;
  version: number;
}
