# ResumeFlow security and privacy

## Data handling

ResumeFlow stores resumes and uploaded resume images locally in the user's browser. The application does not send resume data to a server. Bug reports are sent only after the user submits the form and may include the entered description, optional diagnostics, and an optional screenshot. Résumé content is never added automatically.

Browser storage is not encrypted. Anyone with access to the same browser profile may be able to read locally stored resumes. Users on shared devices should export anything they need, then use **My Resumes → Privacy and local data → Delete local data**.

## Donation safety

ResumeFlow displays an official GCash QR while keeping the recipient's full name and mobile number out of the interface. Payments must be completed inside the official GCash app. ResumeFlow never requests an MPIN, OTP, password, verification code, card number, or other authentication credential.

Donors should verify the recipient name before confirming a transfer. Donation screenshots are not proof of payment; only the recipient's GCash transaction history should be used to confirm receipt.

## Deployment requirements

- Serve the production build exclusively over HTTPS.
- Use a host that applies the response headers in `public/_headers`, or reproduce those headers in the hosting configuration.
- Do not weaken the Content Security Policy to allow third-party scripts without reviewing them.
- Keep the lockfile committed and run `npm audit` during dependency updates.
- Never commit credentials, API keys, payment secrets, or private environment files.
- Store `RESEND_API_KEY` and `BUG_REPORT_TO_EMAIL` as sensitive Vercel environment variables.
- Enable Vercel Bot Protection and add a firewall rate-limit rule for `POST /api/bug-report` when available.

## Reporting a vulnerability

Use the in-app **Report a bug** control. The destination email address is kept server-side and is not included in the browser bundle. Do not include passwords, MPINs, OTPs, government IDs, or unnecessary résumé data in a report.
