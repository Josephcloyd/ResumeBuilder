import type {
  Density,
  GapSize,
  MarginPreset,
  Margins,
  PageSizeId,
  SpacingPreset,
  TemplateId,
  FontSettings,
} from '../types/resume';

/** CSS pixels per unit (96 dpi). */
export const PX_PER_IN = 96;
export const PX_PER_MM = 96 / 25.4;

export interface PageSizeDef {
  id: PageSizeId;
  label: string;
  dims: string;
  /** physical size in mm */
  widthMm: number;
  heightMm: number;
  note?: string;
}

export const PAGE_SIZES: PageSizeDef[] = [
  { id: 'a4', label: 'A4', dims: '210 × 297 mm', widthMm: 210, heightMm: 297, note: 'International standard' },
  { id: 'letter', label: 'Letter', dims: '8.5 × 11 in', widthMm: 215.9, heightMm: 279.4, note: 'US standard' },
  { id: 'short', label: 'Short Bond Paper', dims: '8.5 × 11 in', widthMm: 215.9, heightMm: 279.4, note: 'Common in the Philippines' },
  { id: 'long', label: 'Long Bond Paper', dims: '8.5 × 13 in', widthMm: 215.9, heightMm: 330.2, note: 'Common in the Philippines' },
  { id: 'legal', label: 'Legal', dims: '8.5 × 14 in', widthMm: 215.9, heightMm: 355.6 },
];

export const pageSizeById = (id: PageSizeId) => PAGE_SIZES.find((p) => p.id === id) ?? PAGE_SIZES[0];

export const MARGIN_PRESETS: Record<Exclude<MarginPreset, 'custom'>, { label: string; mm: number }> = {
  xnarrow: { label: 'Extra Narrow', mm: 6.35 },
  narrow: { label: 'Narrow', mm: 12.7 },
  normal: { label: 'Normal', mm: 19.05 },
  wide: { label: 'Wide', mm: 25.4 },
};

export const marginsFromPreset = (p: Exclude<MarginPreset, 'custom'>): Margins => {
  const v = MARGIN_PRESETS[p].mm;
  return { top: v, bottom: v, left: v, right: v };
};

export const SECTION_GAP_PX: Record<GapSize, number> = { small: 10, medium: 16, large: 24 };
export const DENSITY: Record<Density, { item: number; para: number; label: string }> = {
  compact: { item: 6, para: 2, label: 'Compact' },
  normal: { item: 10, para: 4, label: 'Normal' },
  spacious: { item: 15, para: 6, label: 'Spacious' },
};

export const SPACING_PRESETS: Record<Exclude<SpacingPreset, 'custom'>, { gap: GapSize; density: Density; lineHeight: number; label: string }> = {
  compact: { gap: 'small', density: 'compact', lineHeight: 1.15, label: 'Compact' },
  normal: { gap: 'medium', density: 'normal', lineHeight: 1.4, label: 'Normal' },
  relaxed: { gap: 'large', density: 'spacious', lineHeight: 1.6, label: 'Relaxed' },
};

export const LINE_SPACINGS = [1.0, 1.15, 1.4, 1.5, 2.0];

export const FONT_SIZES = [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 36];
export const FONT_WEIGHTS = [
  { value: 300, label: 'Light' },
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semibold' },
  { value: 700, label: 'Bold' },
  { value: 800, label: 'Extra Bold' },
];

export interface FontDef {
  label: string;
  stack: string;
  kind: 'sans' | 'serif' | 'mono';
}

export const FONTS: FontDef[] = [
  { label: 'Arial', stack: 'Arial, "Helvetica Neue", Helvetica, sans-serif', kind: 'sans' },
  { label: 'Helvetica', stack: '"Helvetica Neue", Helvetica, Arial, sans-serif', kind: 'sans' },
  { label: 'Inter', stack: '"Inter Variable", Inter, Arial, sans-serif', kind: 'sans' },
  { label: 'Roboto', stack: '"Roboto Variable", Roboto, Arial, sans-serif', kind: 'sans' },
  { label: 'Open Sans', stack: '"Open Sans Variable", "Open Sans", Arial, sans-serif', kind: 'sans' },
  { label: 'Lato', stack: 'Lato, Arial, sans-serif', kind: 'sans' },
  { label: 'Poppins', stack: 'Poppins, Arial, sans-serif', kind: 'sans' },
  { label: 'Montserrat', stack: '"Montserrat Variable", Montserrat, Arial, sans-serif', kind: 'sans' },
  { label: 'Georgia', stack: 'Georgia, "Times New Roman", serif', kind: 'serif' },
  { label: 'Times New Roman', stack: '"Times New Roman", Times, serif', kind: 'serif' },
  { label: 'Garamond', stack: '"EB Garamond Variable", Garamond, "Times New Roman", serif', kind: 'serif' },
  { label: 'JetBrains Mono', stack: '"JetBrains Mono Variable", "Courier New", monospace', kind: 'mono' },
];

export const fontStack = (label: string) => FONTS.find((f) => f.label === label)?.stack ?? FONTS[0].stack;

export const ACCENT_PRESETS = [
  { name: 'Professional Blue', value: '#2563EB' },
  { name: 'Navy', value: '#1E3A8A' },
  { name: 'Cyan', value: '#0891B2' },
  { name: 'Teal', value: '#0F766E' },
  { name: 'Green', value: '#15803D' },
  { name: 'Purple', value: '#7C3AED' },
  { name: 'Black', value: '#111827' },
];

export const ZOOM_PRESETS = [50, 60, 70, 80, 90, 100, 110, 120, 150];

export interface TemplateDef {
  id: TemplateId;
  name: string;
  description: string;
  columns: 1 | 2;
  fonts: Partial<FontSettings>;
  accent?: string;
  headingAlignment?: 'left' | 'center' | 'right';
  /** where the sidebar sits in two-column mode */
  sidebar: 'left' | 'right';
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: 'blue-minimal',
    name: 'Blue Minimal',
    description: 'Clean single column with a crisp blue accent.',
    columns: 1,
    sidebar: 'right',
    fonts: { headingFont: 'Inter', bodyFont: 'Inter', nameSize: 28, headingSize: 13, headingWeight: 700 },
    headingAlignment: 'left',
  },
  {
    id: 'modern-professional',
    name: 'Modern Professional',
    description: 'Bold header band with confident section markers.',
    columns: 1,
    sidebar: 'right',
    fonts: { headingFont: 'Montserrat', bodyFont: 'Open Sans', nameSize: 28, headingSize: 13, headingWeight: 700 },
    headingAlignment: 'left',
  },
  {
    id: 'developer',
    name: 'Developer',
    description: 'Technical look with code-style headings and skill tags.',
    columns: 1,
    sidebar: 'right',
    fonts: { headingFont: 'JetBrains Mono', bodyFont: 'Inter', nameSize: 26, headingSize: 13, headingWeight: 700 },
    headingAlignment: 'left',
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Centered, formal and timeless serif layout.',
    columns: 1,
    sidebar: 'right',
    accent: '#1E3A8A',
    fonts: { headingFont: 'Georgia', bodyFont: 'Georgia', nameSize: 28, headingSize: 13, headingWeight: 700 },
    headingAlignment: 'center',
  },
  {
    id: 'simple-ats',
    name: 'Simple ATS',
    description: 'Plain, parser-friendly formatting with no graphics.',
    columns: 1,
    sidebar: 'right',
    fonts: { headingFont: 'Arial', bodyFont: 'Arial', nameSize: 24, headingSize: 13, headingWeight: 700 },
    headingAlignment: 'left',
  },
  {
    id: 'two-column-modern',
    name: 'Two Column Modern',
    description: 'Tinted sidebar for contact, skills and languages.',
    columns: 2,
    sidebar: 'left',
    fonts: { headingFont: 'Poppins', bodyFont: 'Lato', nameSize: 28, headingSize: 13, headingWeight: 600 },
    headingAlignment: 'left',
  },
  {
    id: 'academic',
    name: 'Academic',
    description: 'Scholarly CV style with small-caps headings.',
    columns: 1,
    sidebar: 'right',
    accent: '#111827',
    fonts: { headingFont: 'Garamond', bodyFont: 'Garamond', nameSize: 28, headingSize: 14, headingWeight: 600 },
    headingAlignment: 'left',
  },
  {
    id: 'fresh-graduate',
    name: 'Fresh Graduate',
    description: 'Friendly and modern, great for students and interns.',
    columns: 1,
    sidebar: 'right',
    fonts: { headingFont: 'Poppins', bodyFont: 'Poppins', nameSize: 28, headingSize: 13, headingWeight: 600, bodyWeight: 400 },
    headingAlignment: 'left',
  },
];

export const templateById = (id: TemplateId) => TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
