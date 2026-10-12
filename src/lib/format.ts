import DOMPurify from 'dompurify';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2024-06" -> "Jun 2024"; other strings returned as-is. */
export function formatMonth(v: string): string {
  if (!v) return '';
  const m = /^(\d{4})-(\d{2})$/.exec(v.trim());
  if (m) {
    const idx = parseInt(m[2], 10) - 1;
    return idx >= 0 && idx < 12 ? `${MONTHS[idx]} ${m[1]}` : v;
  }
  return v;
}

export function dateRange(start: string, end: string, current = false, presentLabel = 'Present') {
  const s = formatMonth(start);
  const e = current ? presentLabel : formatMonth(end);
  if (s && e) return `${s} – ${e}`;
  return s || e || '';
}

export function formatLongDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export function ensureUrl(v: string): string {
  const t = v.trim();
  if (!t) return '';
  if (/^(https?:|mailto:|tel:)/i.test(t)) return t;
  return `https://${t}`;
}

export function displayUrl(v: string): string {
  return v.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '');
}

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'p', 'br', 'div', 'span', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    SANITIZE_NAMED_PROPS: true,
  });
}

/** True when rich-text html has no visible text. */
export function isHtmlEmpty(html: string | undefined | null): boolean {
  if (!html) return true;
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length === 0;
}

export function htmlToText(html: string): string {
  if (!html) return '';
  const d = document.createElement('div');
  d.innerHTML = sanitizeHtml(html);
  return (d.textContent || '').replace(/\s+/g, ' ').trim();
}

export function safeFileName(name: string) {
  return (name || 'Resume').trim().replace(/[^\w-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'Resume';
}
