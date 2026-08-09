import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { IconClose, IconAlert, IconCheck, IconInbox } from './icons.jsx';

/* ---------------- toasts ---------------- */
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, kind = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setItems(x => [...x.slice(-2), { id, message, kind }]);
    setTimeout(() => setItems(x => x.filter(i => i.id !== id)), 4000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 pb-[calc(env(safe-area-inset-bottom,0px)+5rem)] sm:pb-6"
        role="status" aria-live="polite">
        {items.map(t => (
          <div key={t.id}
            className={`animate-fade-up flex w-full max-w-sm items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-medium shadow-pop ${
              t.kind === 'error' ? 'bg-critical text-white' : 'bg-ink-900 text-white'}`}>
            <span className="mt-px shrink-0">
              {t.kind === 'error' ? <IconAlert className="h-4 w-4" /> : <IconCheck className="h-4 w-4" />}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------------- loading ---------------- */
export const Spinner = ({ className = 'h-5 w-5' }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".2" strokeWidth="3" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/* skeletons beat spinners — the page keeps its shape while it loads */
export function Loading({ rows = 5, kind = 'list' }) {
  if (kind === 'stats') {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4"><div className="skeleton h-3 w-20" /><div className="skeleton mt-3 h-7 w-24" /></div>
        ))}
      </div>
    );
  }
  return (
    <div className="card divide-y divide-ink-100" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          <div className="skeleton h-9 w-9 rounded-full" />
          <div className="flex-1"><div className="skeleton h-3.5 w-1/3" /><div className="skeleton mt-2 h-3 w-1/5" /></div>
          <div className="skeleton h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function Empty({ title, hint, action, icon }) {
  return (
    <div className="card animate-fade-up px-6 py-14 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-100 text-ink-500">
        {icon || <IconInbox className="h-6 w-6" />}
      </div>
      <p className="font-semibold text-ink-800">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------------- stat tile ----------------
   label · value · sub, with an optional sparkline. Value uses proportional
   figures (tabular-nums makes big numbers look loose). */
export function Stat({ label, value, sub, tone = 'default', icon, spark }) {
  const tones = {
    default: 'text-ink-900', good: 'text-good', warn: 'text-saffron-600', bad: 'text-critical'
  };
  return (
    <div className="card card-hover p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">{label}</p>
        {icon && <span className="shrink-0 text-ink-400">{icon}</span>}
      </div>
      <p className={`mt-2 text-[1.6rem] font-bold leading-none sm:text-[1.75rem] ${tones[tone]}`}>{value}</p>
      {sub && <p className="mt-2 text-xs text-ink-500">{sub}</p>}
      {spark && <div className="mt-3">{spark}</div>}
    </div>
  );
}

/* ---------------- status chips ---------------- */
const CHIP = {
  active: 'bg-emerald-50 text-emerald-700', present: 'bg-emerald-50 text-emerald-700',
  paid: 'bg-emerald-50 text-emerald-700', joined: 'bg-emerald-50 text-emerald-700',
  late: 'bg-amber-50 text-amber-700', partial: 'bg-amber-50 text-amber-700',
  'on-hold': 'bg-amber-50 text-amber-700', contacted: 'bg-amber-50 text-amber-700',
  absent: 'bg-rose-50 text-rose-700', unpaid: 'bg-rose-50 text-rose-700',
  dropped: 'bg-rose-50 text-rose-700', lost: 'bg-rose-50 text-rose-700',
  leave: 'bg-sky-50 text-sky-700', new: 'bg-sky-50 text-sky-700',
  visited: 'bg-violet-50 text-violet-700', 'passed-out': 'bg-violet-50 text-violet-700',
  waived: 'bg-ink-100 text-ink-600'
};
/* a dot carries the state alongside the word, so colour is never the only cue */
const DOT = {
  active: 'bg-emerald-500', present: 'bg-emerald-500', paid: 'bg-emerald-500', joined: 'bg-emerald-500',
  late: 'bg-amber-500', partial: 'bg-amber-500', 'on-hold': 'bg-amber-500', contacted: 'bg-amber-500',
  absent: 'bg-rose-500', unpaid: 'bg-rose-500', dropped: 'bg-rose-500', lost: 'bg-rose-500',
  leave: 'bg-sky-500', new: 'bg-sky-500', visited: 'bg-violet-500', 'passed-out': 'bg-violet-500'
};
export function Badge({ status }) {
  return (
    <span className={`pill ${CHIP[status] || 'bg-ink-100 text-ink-600'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[status] || 'bg-ink-400'}`} />
      {status || '—'}
    </span>
  );
}

/* ---------------- segmented control ---------------- */
export function Segmented({ value, onChange, options }) {
  return (
    <div className="seg no-scrollbar overflow-x-auto" role="tablist">
      {options.map(([k, l]) => (
        <button key={k} role="tab" aria-selected={value === k} onClick={() => onChange(k)}
          className={`seg-item ${value === k ? 'seg-item-on' : ''}`}>{l}</button>
      ))}
    </div>
  );
}

/* ---------------- page header ---------------- */
export function PageHead({ title, sub, actions }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[1.7rem] font-extrabold leading-tight text-ink-900 sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-ink-500">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/* ---------------- modal: sheet on phones, dialog on desktop ---------------- */
export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return;
    const onKey = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/40 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div onMouseDown={e => e.stopPropagation()}
        className={`animate-fade-up w-full ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'} max-h-[92vh] overflow-y-auto
                    rounded-t-3xl bg-white p-5 pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] shadow-pop sm:rounded-2xl sm:pb-5`}>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink-200 sm:hidden" />
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold text-ink-900">{title}</h3>
          <button onClick={onClose} aria-label="Close"
            className="-mr-1 -mt-1 rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700">
            <IconClose className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children, className = '', hint }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}
