import React from 'react';
import { useUI } from '../../store/uiStore';

export const ConfirmModal: React.FC = () => {
  const { confirm, closeConfirm } = useUI();
  if (!confirm) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="card w-full max-w-sm bg-white shadow-pop overflow-hidden animate-pop-in">
        <div className="p-5">
          <div className="flex items-center gap-3">
            <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${confirm.danger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-brand'}`}>
              {confirm.danger ? (
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>
                </svg>
              ) : (
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/>
                </svg>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-ink text-base">{confirm.title}</h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">{confirm.message}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-slate-50 border-t border-line">
          <button
            type="button"
            onClick={() => closeConfirm(false)}
            className="btn btn-secondary btn-sm"
          >
            {confirm.cancelLabel || 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => closeConfirm(true)}
            className={`btn btn-sm ${confirm.danger ? 'btn-danger' : 'btn-primary'}`}
          >
            {confirm.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useUI();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 pointer-events-none sm:bottom-24 sm:right-5">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismissToast(t.id)}
          className={`pointer-events-auto cursor-pointer shadow-card rounded-lg px-4 py-3 text-sm font-medium flex items-center gap-2.5 transition-all animate-pop-in ${
            t.tone === 'error'
              ? 'bg-red-600 text-white'
              : t.tone === 'info'
              ? 'bg-slate-800 text-white'
              : 'bg-emerald-600 text-white'
          }`}
        >
          {t.tone === 'success' && (
            <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          )}
          {t.tone === 'error' && (
            <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/>
            </svg>
          )}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
};
