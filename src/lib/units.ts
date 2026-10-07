import type { LengthUnit, Resume } from '../types/resume';
import { PX_PER_MM, pageSizeById } from './constants';

export const mmToPx = (mm: number) => mm * PX_PER_MM;
export const mmToPt = (mm: number) => (mm / 25.4) * 72;

export const fromMm = (mm: number, unit: LengthUnit) =>
  unit === 'mm' ? mm : unit === 'cm' ? mm / 10 : mm / 25.4;
export const toMm = (v: number, unit: LengthUnit) =>
  unit === 'mm' ? v : unit === 'cm' ? v * 10 : v * 25.4;

export const roundTo = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

/** Page geometry in CSS px (96 dpi). */
export function pageGeometry(resume: Resume) {
  const size = pageSizeById(resume.layout.pageSize);
  const m = resume.layout.margins;
  const width = mmToPx(size.widthMm);
  const height = mmToPx(size.heightMm);
  const margins = {
    top: mmToPx(m.top),
    bottom: mmToPx(m.bottom),
    left: mmToPx(m.left),
    right: mmToPx(m.right),
  };
  return {
    size,
    width,
    height,
    margins,
    contentWidth: width - margins.left - margins.right,
    contentHeight: height - margins.top - margins.bottom,
  };
}
export type PageGeometry = ReturnType<typeof pageGeometry>;
