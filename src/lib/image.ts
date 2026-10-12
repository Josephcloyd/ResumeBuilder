import type { ImageAsset } from '../types/resume';
import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from './constants';

export class ImageError extends Error {}

export async function validateImageFile(file: File): Promise<void> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new ImageError('Unsupported format. Please use PNG, JPG, JPEG or WEBP.');
  }
  if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
    throw new ImageError('Image must be smaller than 5 MB.');
  }

  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isPng = bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, i) => bytes[i] === byte);
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isWebp = bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  const signatureMatches =
    (file.type === 'image/png' && isPng) ||
    ((file.type === 'image/jpeg' || file.type === 'image/jpg') && isJpeg) ||
    (file.type === 'image/webp' && isWebp);

  if (!signatureMatches) {
    throw new ImageError('The file contents do not match the selected image format.');
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new ImageError('Could not read this image.'));
    img.src = src;
  });
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new ImageError('Could not read this file.'));
    r.readAsDataURL(file);
  });
}

/** Detects whether an image has transparent pixels (keep PNG then). */
function hasAlpha(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const sw = Math.min(w, 64);
  const sh = Math.min(h, 64);
  const data = ctx.getImageData(0, 0, sw, sh).data;
  for (let i = 3; i < data.length; i += 4) if (data[i] < 250) return true;
  return false;
}

/**
 * Validate + compress an uploaded file. Large images are downscaled to
 * `maxDim` and re-encoded so they look sharp in print without bloating PDFs.
 */
export async function processUpload(file: File, maxDim = 2000): Promise<ImageAsset> {
  await validateImageFile(file);
  const dataUrl = await readFile(file);
  const img = await loadImage(dataUrl);
  if (!img.naturalWidth || !img.naturalHeight || img.naturalWidth * img.naturalHeight > 40_000_000) {
    throw new ImageError('Image dimensions are too large. Please choose a smaller image.');
  }
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  const transparent = file.type !== 'image/jpeg' && hasAlpha(ctx, w, h);
  const original = transparent ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.88);
  return {
    original,
    src: original,
    naturalWidth: w,
    naturalHeight: h,
    crop: { aspect: 0, zoom: 1, cx: 0.5, cy: 0.5 },
  };
}

/** Frame size (in source px) shown at zoom 1 for a given aspect ("cover" fit). */
export function cropFrame(iw: number, ih: number, aspect: number) {
  const a = aspect || iw / ih;
  // largest rectangle with ratio a that fits the image
  let fw = iw;
  let fh = iw / a;
  if (fh > ih) {
    fh = ih;
    fw = ih * a;
  }
  return { fw, fh, a };
}

/** Clamp crop centre so the crop window stays inside the image. */
export function clampCrop(iw: number, ih: number, crop: ImageAsset['crop']) {
  const { fw, fh } = cropFrame(iw, ih, crop.aspect);
  const sw = fw / crop.zoom;
  const sh = fh / crop.zoom;
  const minX = sw / 2 / iw;
  const minY = sh / 2 / ih;
  return {
    ...crop,
    cx: Math.min(1 - minX, Math.max(minX, crop.cx)),
    cy: Math.min(1 - minY, Math.max(minY, crop.cy)),
  };
}

/** Render the crop to a new data URL (max output width `maxOut`). */
export async function renderCrop(asset: ImageAsset, crop: ImageAsset['crop'], maxOut = 1400): Promise<string> {
  const img = await loadImage(asset.original);
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const c = clampCrop(iw, ih, crop);
  const { fw, fh } = cropFrame(iw, ih, c.aspect);
  const sw = fw / c.zoom;
  const sh = fh / c.zoom;
  const sx = c.cx * iw - sw / 2;
  const sy = c.cy * ih - sh / 2;
  // full image, no crop → keep original
  if (c.aspect === 0 && c.zoom === 1) return asset.original;
  const outScale = Math.min(1, maxOut / Math.max(sw, sh));
  const ow = Math.max(1, Math.round(sw * outScale));
  const oh = Math.max(1, Math.round(sh * outScale));
  const canvas = document.createElement('canvas');
  canvas.width = ow;
  canvas.height = oh;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, ow, oh);
  const png = asset.original.startsWith('data:image/png');
  return png ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.9);
}
