import { jsPDF } from 'jspdf';
import { domToPng } from 'modern-screenshot';
import type { Resume } from '../types/resume';
import { pageSizeById } from './constants';
import { safeFileName } from './format';
import { mmToPx } from './units';

export interface PDFExportOptions {
  fileName?: string;
  onProgress?: (current: number, total: number, status: string) => void;
}

/** Wait until cloned image assets are decoded before rasterizing the page. */
async function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll<HTMLImageElement>('img'));
  await Promise.all(
    images.map(async (img) => {
      if (!img.complete) {
        await new Promise<void>((resolve) => {
          const done = () => resolve();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
        });
      }
      if (img.naturalWidth > 0 && typeof img.decode === 'function') {
        await img.decode().catch(() => undefined);
      }
    }),
  );
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

  // 1. Ensure web fonts are completely loaded and rasterized
  if (document.fonts) {
    await document.fonts.ready;
  }

  // Initialize jsPDF with exact physical dimensions in mm
  const orientation = heightMm > widthMm ? 'portrait' : 'landscape';
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: [widthMm, heightMm],
    compress: true,
  });

  const exportHost = document.createElement('div');
  exportHost.setAttribute('aria-hidden', 'true');
  Object.assign(exportHost.style, {
    position: 'fixed',
    left: '-100000px',
    top: '0',
    width: `${mmToPx(widthMm)}px`,
    height: 'auto',
    overflow: 'visible',
    pointerEvents: 'none',
    background: '#ffffff',
  });
  document.body.appendChild(exportHost);

  try {
    for (let i = 0; i < pageEls.length; i++) {
      const sourcePage = pageEls[i];
      onProgress?.(i + 1, totalPages, `Rendering page ${i + 1} of ${totalPages}...`);

      // Capture a clean, unscaled DOM copy. Capturing the live preview directly can
      // make flex rows inherit transient zoom/layout state and wrap on top of the
      // following row in the generated PDF.
      const pageEl = sourcePage.cloneNode(true) as HTMLElement;
      pageEl.classList.add('rf-export-page');
      Object.assign(pageEl.style, {
        width: `${mmToPx(widthMm)}px`,
        height: `${mmToPx(heightMm)}px`,
        boxSizing: 'border-box',
        margin: '0',
      });
      exportHost.replaceChildren(pageEl);

      // A cloned page can paint before its data-URL images finish decoding.
      // Waiting here prevents blank, partially rendered, or stale-sized photos.
      await waitForImages(pageEl);

      // Give the detached export copy two paint frames so fonts and flex/grid
      // geometry settle before modern-screenshot reads computed styles.
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      );

      const targetWidth = mmToPx(widthMm);
      const targetHeight = mmToPx(heightMm);

      // High-resolution capture at 2.5x scale (300 DPI print quality)
      const dataUrl = await domToPng(pageEl, {
        width: targetWidth,
        height: targetHeight,
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
      const scaleX = widthMm / (pageRect.width || targetWidth);
      const scaleY = heightMm / (pageRect.height || targetHeight);

      links.forEach((a) => {
        const href = a.getAttribute('href');
        if (
          href &&
          (href.startsWith('http://') ||
            href.startsWith('https://') ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:'))
        ) {
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
      ? options.fileName.endsWith('.pdf')
        ? options.fileName
        : `${options.fileName}.pdf`
      : `${safeFileName(resume.personal.fullName || resume.title || 'Resume')}.pdf`;

    pdf.save(finalName);
    onProgress?.(totalPages, totalPages, 'Done');
  } finally {
    exportHost.remove();
  }
}

/**
 * Triggers standard browser Print dialog.
 */
export function printResume(): void {
  const scaledParent = document.querySelector<HTMLElement>('.rf-pages-container')?.parentElement;
  const originalTransform = scaledParent ? scaledParent.style.transform : '';
  const originalTransition = scaledParent ? scaledParent.style.transition : '';

  if (scaledParent) {
    scaledParent.style.transition = 'none';
    scaledParent.style.transform = 'none';
  }

  window.print();

  if (scaledParent) {
    scaledParent.style.transform = originalTransform;
    scaledParent.style.transition = originalTransition;
  }
}
