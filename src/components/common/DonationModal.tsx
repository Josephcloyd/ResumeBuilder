import React, { useEffect, useRef } from 'react';

interface DonationModalProps {
  open: boolean;
  onClose: () => void;
}

export const DonationModal: React.FC<DonationModalProps> = ({ open, onClose }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-fade-in"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      data-no-pdf
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="donation-title"
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-pop animate-pop-in"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 px-6 pb-6 pt-7 text-white sm:px-8">
          <div className="absolute -right-10 -top-10 size-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -left-8 size-28 rounded-full bg-cyan-300/10" />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full text-blue-100 transition-colors hover:bg-white/15 hover:text-white"
            aria-label="Close donation window"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>

          <div className="relative">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <svg className="size-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 21s-7-4.35-9.33-8.24C.83 9.69 2.1 5.5 5.74 4.42 7.93 3.77 10.2 4.6 12 6.45c1.8-1.85 4.07-2.68 6.26-2.03 3.64 1.08 4.91 5.27 3.07 8.34C19 16.65 12 21 12 21Z"/>
              </svg>
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">Support ResumeFlow</p>
            <h2 id="donation-title" className="mt-1 text-xl font-bold tracking-tight">Donate through GCash</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-blue-100">
              Choose any amount you’re comfortable with. Every contribution helps keep the resume builder available.
            </p>
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] md:items-start">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-500">Official GCash QR</p>
            <div className="relative mx-auto mt-3 aspect-square w-full max-w-[20rem] overflow-hidden rounded-xl border-4 border-white bg-white shadow-card">
              <img
                src="/gcash-donation-qr.jpg"
                alt="Official GCash QR code for ResumeFlow donations"
                draggable={false}
                className="pointer-events-none absolute left-1/2 top-[-46%] w-[160%] max-w-none -translate-x-1/2 select-none"
              />
            </div>
            <p className="mx-auto mt-3 max-w-[20rem] text-xs leading-relaxed text-slate-600">
              Scan this code with GCash. Recipient details remain hidden here and appear only during confirmation in the GCash app.
            </p>
            <a
              href="/gcash-donation-qr.jpg"
              download="ResumeFlow-GCash-QR.jpg"
              className="btn btn-secondary btn-sm mt-3"
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>
              </svg>
              Save QR to scan
            </a>
          </div>

          <div>
            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
              <svg className="mt-0.5 size-4 shrink-0 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3z"/><path d="m9 12 2 2 4-4"/>
              </svg>
              <p>
                Complete the transfer only in the official GCash app. ResumeFlow will never ask for your MPIN, OTP, password, or verification code.
              </p>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <h3 className="text-sm font-semibold text-slate-800">How to donate</h3>
              <ol className="mt-4 space-y-4 text-xs leading-relaxed text-slate-600">
                <li className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-brand">1</span><span className="pt-1">Open GCash, tap <strong className="text-slate-700">QR</strong>, then scan the code.</span></li>
                <li className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-brand">2</span><span className="pt-1">On the same phone, save the QR first and upload it in the GCash scanner.</span></li>
                <li className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-brand">3</span><span className="pt-1">Choose any amount, verify the recipient inside GCash, then confirm.</span></li>
              </ol>
            </div>

            <p className="mt-4 text-center text-[10px] leading-relaxed text-slate-400 md:text-left">
              Please confirm the recipient name in GCash before sending.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
