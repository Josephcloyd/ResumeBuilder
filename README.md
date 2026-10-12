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

Apply the variables to Production and Preview, then redeploy. Never put real values in `.env.example` or commit a local `.env` file.

For additional abuse protection, enable Vercel Bot Protection. If your plan supports custom firewall rate limits, limit `POST /api/bug-report`; the function also applies validation, a honeypot, submission timing checks, same-origin checks, and a small per-instance rate limit.

## Privacy model

Résumé content and uploaded résumé images stay in the user's browser. Only information deliberately entered in the bug-report form, optional diagnostics, and an optional screenshot are submitted to the bug-report API.
