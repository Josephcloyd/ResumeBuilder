import { Buffer } from 'node:buffer';

const MAX_REQUEST_BYTES = 2_500_000;
const MAX_SCREENSHOT_BYTES = 2 * 1024 * 1024;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

const responseHeaders = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
};

function json(status: number, body: Record<string, unknown>, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...responseHeaders, ...extraHeaders },
  });
}

function textField(form: FormData, key: string, maxLength: number) {
  const value = form.get(key);
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function hasValidImageSignature(bytes: Uint8Array, type: string) {
  if (type === 'image/png') {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return signature.every((byte, index) => bytes[index] === byte);
  }
  if (type === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (type === 'image/webp') {
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
    );
  }
  return false;
}

function safeFileName(name: string, type: string) {
  const extension = type === 'image/png' ? '.png' : type === 'image/webp' ? '.webp' : '.jpg';
  const base = name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9_-]+/gi, '_').slice(0, 60) || 'screenshot';
  return `${base}${extension}`;
}

function clientKey(request: Request) {
  const forwarded = request.headers.get('x-vercel-forwarded-for') ?? request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'unknown-client';
}

function isRateLimited(request: Request) {
  const now = Date.now();
  const key = clientKey(request);
  const bucket = rateBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return 0;
  }

  bucket.count += 1;
  if (bucket.count <= RATE_LIMIT_MAX) return 0;
  return Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request) {
    if (request.method !== 'POST') {
      return json(405, { error: 'Method not allowed.' }, { Allow: 'POST' });
    }

    if (!isSameOrigin(request)) {
      return json(403, { error: 'This report must be submitted from ResumeFlow.' });
    }

    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
      return json(415, { error: 'Unsupported report format.' });
    }

    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > MAX_REQUEST_BYTES) {
      return json(413, { error: 'The report or screenshot is too large.' });
    }

    const retryAfter = isRateLimited(request);
    if (retryAfter) {
      return json(
        429,
        { error: 'Too many reports were submitted. Please wait and try again.' },
        { 'Retry-After': String(retryAfter) },
      );
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return json(400, { error: 'The report could not be read.' });
    }

    // Hidden honeypot field: real users never fill this in.
    if (textField(form, 'website', 200)) {
      return json(200, { ok: true });
    }

    const startedAt = Number(textField(form, 'startedAt', 20));
    const elapsed = Date.now() - startedAt;
    if (!Number.isFinite(startedAt) || elapsed < 1_500 || elapsed > 24 * 60 * 60 * 1000) {
      return json(400, { error: 'Please reopen the bug form and try again.' });
    }

    const summary = textField(form, 'summary', 100).replace(/[\r\n]+/g, ' ');
    const details = textField(form, 'details', 1_200);
    const appArea = textField(form, 'appArea', 100);
    const browser = textField(form, 'browser', 500);
    const viewport = textField(form, 'viewport', 50);
    const reportedAt = textField(form, 'reportedAt', 50);
    const submissionId = textField(form, 'submissionId', 80).replace(/[^a-z0-9-]/gi, '');

    if (summary.length < 3 || details.length < 10 || !submissionId) {
      return json(400, { error: 'Add a clear title and description before sending.' });
    }

    const screenshot = form.get('screenshot');
    let attachment: { filename: string; content: string } | undefined;
    if (screenshot instanceof File && screenshot.size > 0) {
      if (screenshot.size > MAX_SCREENSHOT_BYTES) {
        return json(413, { error: 'Screenshots must be 2 MB or smaller.' });
      }
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(screenshot.type)) {
        return json(415, { error: 'Use a PNG, JPG, or WEBP screenshot.' });
      }

      const bytes = new Uint8Array(await screenshot.arrayBuffer());
      if (!hasValidImageSignature(bytes, screenshot.type)) {
        return json(400, { error: 'The screenshot file is not a valid image.' });
      }

      attachment = {
        filename: safeFileName(screenshot.name, screenshot.type),
        content: Buffer.from(bytes).toString('base64'),
      };
    }

    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.BUG_REPORT_TO_EMAIL;
    const from = process.env.BUG_REPORT_FROM_EMAIL;
    if (!apiKey || !to || !from) {
      console.error('Bug report email environment variables are not configured.');
      return json(503, { error: 'Bug reporting is temporarily unavailable.' });
    }

    const lines = [
      `Bug: ${summary}`,
      '',
      'What happened:',
      details,
    ];

    if (appArea || browser || viewport || reportedAt) {
      lines.push('', 'Technical details:');
      if (appArea) lines.push(`- App area: ${appArea}`);
      if (reportedAt) lines.push(`- Date: ${reportedAt}`);
      if (browser) lines.push(`- Browser: ${browser}`);
      if (viewport) lines.push(`- Screen: ${viewport}`);
    }

    if (attachment) lines.push('', 'A user-supplied screenshot is attached.');
    lines.push('', `Submission ID: ${submissionId}`);

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `resumeflow-bug/${submissionId}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `[ResumeFlow Bug] ${summary}`,
        text: lines.join('\n'),
        ...(attachment ? { attachments: [attachment] } : {}),
      }),
      signal: AbortSignal.timeout(8_000),
    }).catch((error: unknown) => {
      console.error('Bug report delivery failed.', error instanceof Error ? error.message : 'Unknown error');
      return null;
    });

    if (!emailResponse?.ok) {
      console.error('Bug report email provider rejected the request.', emailResponse?.status ?? 'network-error');
      return json(502, { error: 'The report could not be delivered. Please try again later.' });
    }

    return json(200, { ok: true });
  },
};
