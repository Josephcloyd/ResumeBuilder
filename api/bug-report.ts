import { Buffer } from 'node:buffer';
import postgres from 'postgres';

const MAX_REQUEST_BYTES = 2_500_000;
const MAX_SCREENSHOT_BYTES = 2 * 1024 * 1024;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const DAILY_REPORT_LIMIT = 30; // site-wide, resets at midnight Philippine time

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

interface BugReport {
  submissionId: string;
  summary: string;
  details: string;
  appArea: string;
  browser: string;
  viewport: string;
  reportedAt: string;
}

interface Attachment {
  filename: string;
  type: string;
  content: string; // base64
}

/** Sends the report by email. Returns null on success, or a short reason it failed. */
async function sendEmail(report: BugReport, attachment?: Attachment): Promise<string | null> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.BUG_REPORT_TO_EMAIL;
  const from = process.env.BUG_REPORT_FROM_EMAIL;
  if (!apiKey || !to || !from) return 'Email environment variables are not configured.';

  const lines = [
    `Bug: ${report.summary}`,
    '',
    'What happened:',
    report.details,
  ];

  if (report.appArea || report.browser || report.viewport || report.reportedAt) {
    lines.push('', 'Technical details:');
    if (report.appArea) lines.push(`- App area: ${report.appArea}`);
    if (report.reportedAt) lines.push(`- Date: ${report.reportedAt}`);
    if (report.browser) lines.push(`- Browser: ${report.browser}`);
    if (report.viewport) lines.push(`- Screen: ${report.viewport}`);
  }

  if (attachment) lines.push('', 'A user-supplied screenshot is attached.');
  lines.push('', `Submission ID: ${report.submissionId}`);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `resumeflow-bug/${report.submissionId}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `[ResumeFlow Bug] ${report.summary}`,
        text: lines.join('\n'),
        ...(attachment ? { attachments: [{ filename: attachment.filename, content: attachment.content }] } : {}),
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (response.ok) return null;
    const body = await response.text().catch(() => '');
    return `Resend rejected the email (HTTP ${response.status}): ${body.slice(0, 300)}`;
  } catch (error) {
    return `Email request failed: ${error instanceof Error ? error.message : 'unknown error'}`;
  }
}

let db: postgres.Sql | undefined;
let tableReady: Promise<void> | undefined;

/**
 * Lives in its own `resumeflow` schema, not `public`: Supabase exposes `public` tables through its
 * REST API (reachable with the site's public anon key), so bug reports must stay out of it.
 */
async function ensureTable(sql: postgres.Sql) {
  // Only create the schema when missing, so a limited role (USAGE + CREATE on the schema only) also works
  const [schema] = await sql`SELECT 1 FROM pg_namespace WHERE nspname = 'resumeflow'`;
  if (!schema) await sql`CREATE SCHEMA resumeflow`;
  await sql`
    CREATE TABLE IF NOT EXISTS resumeflow.bug_reports (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      summary TEXT NOT NULL,
      details TEXT NOT NULL,
      app_area TEXT,
      browser TEXT,
      viewport TEXT,
      reported_at TEXT,
      screenshot_name TEXT,
      screenshot_data_url TEXT,
      email_error TEXT
    )
  `;
  // One row per day (Philippine time) counting accepted reports, shared by every function instance
  await sql`
    CREATE TABLE IF NOT EXISTS resumeflow.daily_report_counts (
      day DATE PRIMARY KEY,
      count INTEGER NOT NULL
    )
  `;
  // Defense in depth in case the schema is ever exposed; the table owner (this connection) bypasses RLS
  await sql`ALTER TABLE resumeflow.bug_reports ENABLE ROW LEVEL SECURITY`;
  await sql`ALTER TABLE resumeflow.daily_report_counts ENABLE ROW LEVEL SECURITY`;
}

/** Returns a connected client with tables in place, or undefined when no database is configured. */
async function readyDb() {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;

  // prepare: false is required by Supabase's transaction pooler (port 6543)
  db ??= postgres(url, { prepare: false, max: 1, ssl: 'require', connect_timeout: 5, idle_timeout: 20 });
  tableReady ??= ensureTable(db).catch((error: unknown) => {
    tableReady = undefined;
    throw error;
  });
  await tableReady;
  return db;
}

/**
 * Counts this report toward the site-wide daily cap. Returns false once the cap is exceeded.
 * Fails open if the database is unavailable, so a database outage never blocks real reports.
 */
async function withinDailyLimit() {
  try {
    const sql = await readyDb();
    if (!sql) return true;
    const [row] = await sql`
      INSERT INTO resumeflow.daily_report_counts (day, count)
      VALUES ((now() AT TIME ZONE 'Asia/Manila')::date, 1)
      ON CONFLICT (day) DO UPDATE SET count = resumeflow.daily_report_counts.count + 1
      RETURNING count
    `;
    return Number(row.count) <= DAILY_REPORT_LIMIT;
  } catch (error) {
    console.error('Daily bug report limit check failed.', error instanceof Error ? error.message : 'Unknown error');
    return true;
  }
}

/** Fallback when email fails: keeps the report in Postgres (Supabase) so it can be read later. */
async function saveToDatabase(report: BugReport, attachment: Attachment | undefined, emailError: string) {
  try {
    const sql = await readyDb();
    if (!sql) return false;

    // Stored as a data: URL so pasting it into a browser address bar shows the image
    const screenshotDataUrl = attachment ? `data:${attachment.type};base64,${attachment.content}` : null;
    await sql`
      INSERT INTO resumeflow.bug_reports (
        id, summary, details, app_area, browser, viewport, reported_at,
        screenshot_name, screenshot_data_url, email_error
      ) VALUES (
        ${report.submissionId}, ${report.summary}, ${report.details},
        ${report.appArea || null}, ${report.browser || null}, ${report.viewport || null}, ${report.reportedAt || null},
        ${attachment?.filename ?? null}, ${screenshotDataUrl}, ${emailError}
      )
      ON CONFLICT (id) DO NOTHING
    `;
    return true;
  } catch (error) {
    console.error('Bug report database fallback failed.', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
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

    // Time the form was open, measured on the client so device clock differences don't matter
    const elapsed = Number(textField(form, 'elapsedMs', 20));
    if (!Number.isFinite(elapsed) || elapsed < 1_500 || elapsed > 24 * 60 * 60 * 1000) {
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
    let attachment: Attachment | undefined;
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
        type: screenshot.type,
        content: Buffer.from(bytes).toString('base64'),
      };
    }

    if (!(await withinDailyLimit())) {
      return json(429, { error: 'Bug reporting has reached its limit for today. Please try again tomorrow.' });
    }

    const report: BugReport = { submissionId, summary, details, appArea, browser, viewport, reportedAt };

    const emailError = await sendEmail(report, attachment);
    if (!emailError) return json(200, { ok: true });

    console.error('Bug report email failed; saving to database instead.', emailError);
    if (await saveToDatabase(report, attachment, emailError)) {
      return json(200, { ok: true });
    }

    return json(502, { error: 'The report could not be delivered. Please try again later.' });
  },
};
