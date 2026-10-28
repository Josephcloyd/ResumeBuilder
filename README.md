# ResumeFlow

ResumeFlow is a privacy-focused résumé builder with local browser storage, live preview, image support, and PDF export.

## Local development

```bash
npm install
npm run dev
```

Use `vercel dev` when testing the secure bug-report API locally.

## Production build

```bash
npm run build
```

## Vercel deployment

The frontend deploys as a Vite site and `api/bug-report.ts` deploys as a Vercel Function. Security headers are defined in `vercel.json`.

Before deploying, create an email API key and a verified sending address with Resend. Add these values under **Vercel → Project Settings → Environment Variables**:

- `RESEND_API_KEY` — mark this as sensitive.
- `BUG_REPORT_TO_EMAIL` — the private inbox that receives reports; mark this as sensitive.
- `BUG_REPORT_FROM_EMAIL` — a sender on your verified domain, such as `ResumeFlow Bugs <bugs@example.com>`.

If an email fails (missing settings, Resend error, network), the report is saved to the Postgres table `resumeflow.bug_reports` instead, with the failure reason in `email_error`. To enable this, set `DATABASE_URL` to your Supabase **Transaction pooler** connection string (Supabase → Connect, port 6543) and mark it sensitive. The `resumeflow` schema and table are created on first use and are kept out of the `public` schema so the Supabase REST API never exposes them.

Apply the variables to Production and Preview, then redeploy. Never put real values in `.env.example` or commit a local `.env` file.

For additional abuse protection, enable Vercel Bot Protection. If your plan supports custom firewall rate limits, limit `POST /api/bug-report`; the function also applies validation, a honeypot, submission timing checks, same-origin checks, and a small per-instance rate limit. When `DATABASE_URL` is set, it also enforces a site-wide cap of 30 reports per day (Philippine time), counted in `resumeflow.daily_report_counts`.

## Privacy model

Résumé content and uploaded résumé images stay in the user's browser. Only information deliberately entered in the bug-report form, optional diagnostics, and an optional screenshot are submitted to the bug-report API.
