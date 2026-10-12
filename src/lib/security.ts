import { sanitizeHtml } from './format';

const MAX_IMPORT_BYTES = 15 * 1024 * 1024;
const MAX_DATA_IMAGE_LENGTH = 8 * 1024 * 1024;
const MAX_TEXT_LENGTH = 100_000;
const MAX_DEPTH = 14;
const MAX_NODES = 25_000;
const MAX_ARRAY_ITEMS = 500;

const SECTION_TYPES = new Set([
  'summary',
  'experience',
  'education',
  'projects',
  'skills',
  'certifications',
  'custom',
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
]);

const RICH_TEXT_FIELDS = new Set(['content', 'description', 'accomplishments']);
const PLAIN_TEXT_FIELDS = new Set([
  'id', 'title', 'fullName', 'professionalTitle', 'email', 'phone', 'location',
  'linkedIn', 'github', 'portfolio', 'website', 'jobTitle', 'company', 'startDate',
  'endDate', 'degree', 'program', 'school', 'startYear', 'endYear', 'name', 'role',
  'technologies', 'url', 'githubUrl', 'certificationName', 'organization', 'issueDate',
  'expirationDate', 'credentialId', 'credentialUrl', 'subtitle', 'date', 'headingFont',
  'bodyFont', 'align', 'column', 'type', 'photoShape', 'imageSize', 'imagePosition',
  'display', 'displayMode', 'template', 'accentColor', 'pageSize', 'marginPreset',
  'marginUnit', 'spacingPreset', 'headingAlignment', 'bodyAlignment', 'density', 'sectionGap',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeText(value: string, maxLength = 10_000) {
  let clean = '';
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    if (code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127)) clean += character;
    if (clean.length >= maxLength) break;
  }
  return clean;
}

function sanitizeImageAsset(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  const original = typeof value.original === 'string' ? value.original : '';
  const src = typeof value.src === 'string' ? value.src : '';
  const isSafeDataImage = (item: string) =>
    /^data:image\/(?:png|jpeg|webp);base64,/i.test(item) && item.length <= MAX_DATA_IMAGE_LENGTH;
  const isBundledSampleImage = (item: string) =>
    /^\/sample-profile-(?:maya|adrian)\.png$/.test(item);
  const isSafeImage = (item: string) => isSafeDataImage(item) || isBundledSampleImage(item);
  if (!isSafeImage(original) || !isSafeImage(src)) return null;

  const crop = isRecord(value.crop) ? value.crop : {};
  const finite = (candidate: unknown, fallback: number) =>
    typeof candidate === 'number' && Number.isFinite(candidate) ? candidate : fallback;

  return {
    original,
    src,
    naturalWidth: Math.max(1, Math.min(10_000, finite(value.naturalWidth, 1))),
    naturalHeight: Math.max(1, Math.min(10_000, finite(value.naturalHeight, 1))),
    crop: {
      aspect: Math.max(0, Math.min(10, finite(crop.aspect, 0))),
      zoom: Math.max(1, Math.min(5, finite(crop.zoom, 1))),
      cx: Math.max(0, Math.min(1, finite(crop.cx, 0.5))),
      cy: Math.max(0, Math.min(1, finite(crop.cy, 0.5))),
    },
  };
}

/** Removes active markup, unsafe object keys, oversized values, and invalid embedded images. */
export function sanitizeUntrustedResumeData(value: unknown, key = '', depth = 0): unknown {
  if (depth > MAX_DEPTH) return null;
  if (key === 'image' || key === 'profileImage') return sanitizeImageAsset(value);

  if (typeof value === 'string') {
    if (value.startsWith('data:')) return '';
    const clean = sanitizeText(value, RICH_TEXT_FIELDS.has(key) ? 50_000 : 10_000);
    if (RICH_TEXT_FIELDS.has(key)) {
      return sanitizeHtml(clean);
    }
    return clean;
  }

  if (PLAIN_TEXT_FIELDS.has(key) || RICH_TEXT_FIELDS.has(key)) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'boolean' || value === null) return value;
  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_ITEMS).map((item) => sanitizeUntrustedResumeData(item, key, depth + 1));
  }
  if (isRecord(value)) {
    const clean: Record<string, unknown> = {};
    for (const [childKey, child] of Object.entries(value)) {
      if (childKey === '__proto__' || childKey === 'prototype' || childKey === 'constructor') continue;
      clean[childKey] = sanitizeUntrustedResumeData(child, childKey, depth + 1);
    }
    return clean;
  }
  return null;
}

function inspectValue(value: unknown, depth: number, state: { nodes: number }) {
  if (depth > MAX_DEPTH) throw new Error('The resume file is nested too deeply.');
  state.nodes += 1;
  if (state.nodes > MAX_NODES) throw new Error('The resume file contains too much data.');

  if (typeof value === 'string') {
    if (value.startsWith('data:')) {
      if (!/^data:image\/(?:png|jpeg|webp);base64,/i.test(value)) {
        throw new Error('The resume contains an unsupported embedded file.');
      }
      if (value.length > MAX_DATA_IMAGE_LENGTH) {
        throw new Error('An embedded image is too large.');
      }
    } else if (value.length > MAX_TEXT_LENGTH) {
      throw new Error('A text field in the resume is too large.');
    }
    return;
  }

  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_ITEMS) throw new Error('The resume contains too many entries.');
    value.forEach((item) => inspectValue(item, depth + 1, state));
    return;
  }

  if (isRecord(value)) {
    for (const [key, child] of Object.entries(value)) {
      if (key === '__proto__' || key === 'prototype' || key === 'constructor') {
        throw new Error('The resume contains an unsafe property.');
      }
      inspectValue(child, depth + 1, state);
    }
  }
}

export function validateResumeImportFile(file: File) {
  const hasJsonExtension = file.name.toLowerCase().endsWith('.json');
  const hasJsonType = !file.type || file.type === 'application/json' || file.type === 'text/json';
  if (!hasJsonExtension || !hasJsonType) {
    throw new Error('Choose a valid ResumeFlow JSON file.');
  }
  if (file.size === 0) throw new Error('The selected file is empty.');
  if (file.size > MAX_IMPORT_BYTES) throw new Error('Resume files must be smaller than 15 MB.');
}

export function validateResumeImportData(value: unknown) {
  if (!isRecord(value)) throw new Error('The resume file must contain a JSON object.');
  if (!isRecord(value.personal)) throw new Error('The resume file is missing personal information.');
  if (!Array.isArray(value.sections)) throw new Error('The resume file is missing its sections.');
  if (value.sections.length === 0 || value.sections.length > 40) {
    throw new Error('The resume must contain between 1 and 40 sections.');
  }

  for (const section of value.sections) {
    if (!isRecord(section) || typeof section.type !== 'string' || !SECTION_TYPES.has(section.type)) {
      throw new Error('The resume contains an unsupported section.');
    }
    if ('items' in section && !Array.isArray(section.items)) {
      throw new Error('A resume section has an invalid item list.');
    }
    if (Array.isArray(section.items) && (section.items.length > 100 || section.items.some((item) => !isRecord(item)))) {
      throw new Error('A resume section contains invalid or excessive entries.');
    }
    if ('groups' in section && !Array.isArray(section.groups)) {
      throw new Error('The skills section has an invalid group list.');
    }
    if (Array.isArray(section.groups) && (section.groups.length > 50 || section.groups.some((group) => !isRecord(group)))) {
      throw new Error('The skills section contains invalid or excessive groups.');
    }
  }

  inspectValue(value, 0, { nodes: 0 });
}
