import { jsPDF } from 'jspdf';
import { domToPng } from 'modern-screenshot';
import type { Resume } from '../types/resume';
import { pageSizeById } from './constants';
import { safeFileName } from './format';

export interface PDFExportOptions {
  fileName?: string;
  onProgress?: (current: number, total: number, status: string) => void;
}

/**
 * High-fidelity PDF exporter using modern-screenshot + jsPDF.
 * Preserves exact page dimensions (A4, Letter, Short Bond, Long Bond, Legal),
 * sharp multi-page layouts, profile images, certificate images and clickable hyperlinks.
 */
export async function exportResumeToPDF(
  resume: Resume,
  options: PDFExportOptions = {}
): Promise<void> {
  const { onProgress } = options;
  const sizeDef = pageSizeById(resume.layout.pageSize);
  const widthMm = sizeDef.widthMm;
  const heightMm = sizeDef.heightMm;

  // Find all page elements in the DOM
  const pageEls = Array.from(document.querySelectorAll<HTMLElement>('.rf-page'));
  if (pageEls.length === 0) {
    throw new Error('No resume pages found in preview to export.');
  }

  const totalPages = pageEls.length;
  onProgress?.(0, totalPages, 'Preparing document...');

  // Initialize jsPDF with exact physical dimensions in mm
  const orientation = heightMm > widthMm ? 'portrait' : 'landscape';
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: [widthMm, heightMm],
    compress: true,
  });

  for (let i = 0; i < pageEls.length; i++) {
    const pageEl = pageEls[i];
    onProgress?.(i + 1, totalPages, `Rendering page ${i + 1} of ${totalPages}...`);

    // High-resolution capture at 2.5x scale (sharp text, compact file size)
    const dataUrl = await domToPng(pageEl, {
      scale: 2.5,
      backgroundColor: '#ffffff',
      quality: 0.95,
      filter: (node) => {
        // Exclude elements marked as no-print or edit handles
        if (node instanceof HTMLElement) {
          if (node.hasAttribute('data-no-pdf')) return false;
        }
        return true;
      },
    });

    if (i > 0) {
      pdf.addPage([widthMm, heightMm], orientation);
    }

    pdf.addImage(dataUrl, 'PNG', 0, 0, widthMm, heightMm, undefined, 'FAST');

    // Extract clickable hyperlinks on this page and embed into PDF
    const links = pageEl.querySelectorAll<HTMLAnchorElement>('a[href]');
    const pageRect = pageEl.getBoundingClientRect();
    const scaleX = widthMm / pageRect.width;
    const scaleY = heightMm / pageRect.height;

    links.forEach((a) => {
      const href = a.getAttribute('href');
      if (href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:'))) {
        const r = a.getBoundingClientRect();
        const x = (r.left - pageRect.left) * scaleX;
        const y = (r.top - pageRect.top) * scaleY;
        const w = r.width * scaleX;
        const h = r.height * scaleY;
        if (w > 0 && h > 0) {
          pdf.link(x, y, w, h, { url: href });
        }
      }
    });
  }

  onProgress?.(totalPages, totalPages, 'Saving PDF...');

  const finalName = options.fileName
    ? options.fileName.endsWith('.pdf') ? options.fileName : `${options.fileName}.pdf`
    : `${safeFileName(resume.personal.fullName || resume.title || 'Resume')}.pdf`;

  pdf.save(finalName);
  onProgress?.(totalPages, totalPages, 'Done');
}

/**
 * Triggers standard browser Print dialog.
 */
export function printResume(): void {
  window.print();
}
