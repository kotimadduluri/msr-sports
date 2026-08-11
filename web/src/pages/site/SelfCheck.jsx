import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, isDemo, rupees, shortDate, secsToTime } from '../../api';
import { Spinner } from '../../components.jsx';
import { Logo, IconChevronLeft, IconUser, IconCalendar, IconCircleCheck, IconTimer, IconRupee } from '../../icons.jsx';
import { LocaleProvider, useT } from '../../i18n/index.jsx';

/* "My progress": a student or parent enters the admission number from any
   receipt plus the date of birth, and sees their own attendance, timings
   against the cut-off, dues and receipts — no password to forget. */

const STATUS_KEY = { ready: 'ready', borderline: 'close', 'at-risk': 'needsWork' };
const STATUS_CLS = {
  ready: 'bg-emerald-50 text-emerald-700',
  borderline: 'bg-amber-50 text-amber-700',
  'at-risk': 'bg-rose-50 text-rose-700'
};

function CheckPage() {
  const L = useT();
  /* the demo pre-fills a sample student so reviewers can see the page work */
  const [form, setForm] = useState(isDemo
    ? { admission_no: 'MSR20260119', dob: '2003-09-06' }
    : { admission_no: '', dob: '' });
  const [state, setState] = useState({ busy: false, error: '', data: null });

  async function submit(e) {
    e.preventDefault();
    setState({ busy: true, error: '', data: null });
    try {
      const data = await api.post('/public/self-check', form);
      setState({ busy: false, error: '', data });
    } catch (err) {
      setState({ busy: false, error: err.message, data: null });
    }
  }

  const d = state.data;
  const fmtVal = (v, u) => u === 'sec' ? secsToTime(v) : u === 'm' ? `${v} m` : v;
  const fmtTarget = t => t.unit === 'sec' ? `≤ ${secsToTime(t.target)}` : `≥ ${t.target} ${t.unit === 'count' ? '' : t.unit}`;
  const upiHref = d?.upi_id && d.balance > 0
    ? `upi://pay?pa=${encodeURIComponent(d.upi_id)}&pn=${encodeURIComponent('MSR Sports Academy')}&am=${d.balance}&cu=INR&tn=${encodeURIComponent(d.admission_no)}`
    : null;

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="border-b border-ink-200/70 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo className="h-9 w-9" />
            <span className="text-[15px] font-extrabold text-ink-900">MSR Sports Academy</span>
          </Link>
          <Link to="/" className="flex items-center gap-1 text-sm font-semibold text-msr-700 hover:text-msr-900">
            <IconChevronLeft className="h-4 w-4" /> {L.check.back}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-4xl font-bold uppercase leading-none text-ink-900 sm:text-5xl">{L.check.title}</h1>
        <p className="mt-3 max-w-lg leading-relaxed text-ink-600">{L.check.sub}</p>

        <form onSubmit={submit} className="card mt-6 grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="label" htmlFor="adm">{L.check.admission}</label>
            <div className="relative">
              <IconUser className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-400" />
              <input id="adm" className="input pl-11 uppercase" required placeholder={L.check.admissionPh}
                value={form.admission_no} onChange={e => setForm({ ...form, admission_no: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="dob">{L.check.dob}</label>
            <div className="relative">
              <IconCalendar className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-400" />
              <input id="dob" type="date" className="input pl-11 tnum" required
                value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
            </div>
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full sm:w-auto" disabled={state.busy}>
              {state.busy ? <Spinner className="h-5 w-5" /> : L.check.submit}
            </button>
          </div>
        </form>

        {isDemo && (
          <p className="mt-3 rounded-xl bg-saffron-50 px-4 py-2.5 text-center text-xs font-semibold text-saffron-800">
            Demo student: <span className="font-mono">MSR20260119</span> · 06 Sep 2003 (pre-filled, just press the button)
          </p>
        )}

        {state.error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p>}

        {d && (
          <div className="mt-6 space-y-4">
            <div className="card p-5">
              <h2 className="text-xl font-extrabold text-ink-900">{d.name}</h2>
              <p className="text-sm text-ink-500">
                {d.admission_no}{d.course_name ? ` · ${d.course_name}` : ''}
                {d.batch_name ? ` · ${L.check.batch}: ${d.batch_name}${d.start_time ? ` (${d.start_time})` : ''}` : ''}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="card p-4">
                <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">{L.check.attendance}, {L.check.thisMonth}</p>
                <p className="mt-1 font-display text-3xl font-bold text-msr-800">
                  {d.attendance.month_pct === null ? '—' : `${d.attendance.month_pct}%`}
                </p>
              </div>
              <div className="card p-4">
                <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">{L.check.attendance}, {L.check.overall}</p>
                <p className="mt-1 font-display text-3xl font-bold text-msr-800">
                  {d.attendance.all_pct === null ? '—' : `${d.attendance.all_pct}%`}
                </p>
              </div>
            </div>

            {d.tests.length > 0 && (
              <div className="card overflow-hidden">
                <p className="flex items-center gap-2 border-b border-ink-200 px-4 py-3 font-bold text-ink-900">
                  <IconTimer className="h-4 w-4 text-msr-700" /> {L.check.timings}
                </p>
                <div className="divide-y divide-ink-100">
                  {d.tests.map(t => {
                    const b = t.readiness[0];
                    return (
                      <div key={t.event} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-ink-900">{t.event}</p>
                          <p className="text-xs text-ink-500">
                            {shortDate(t.date)}{b ? ` · ${L.check.target} ${fmtTarget(b)} (${b.exam})` : ''}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {b && (
                            <span className={`rounded-lg px-2 py-1 text-2xs font-bold ${STATUS_CLS[b.status]}`}>
                              {L.check[STATUS_KEY[b.status]]}
                            </span>
                          )}
                          <p className="font-bold tabular-nums">{fmtVal(t.value, t.unit)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">{L.check.feeDue}</p>
                  <p className={`mt-0.5 font-display text-3xl font-bold ${d.balance > 0 ? 'text-critical' : 'text-good'}`}>
                    {d.balance > 0 ? rupees(d.balance) : L.check.allClear}
                  </p>
                </div>
                {upiHref && (
                  <a href={upiHref} className="btn-accent">
                    <IconRupee className="h-[18px] w-[18px]" /> {L.check.payUpi}
                  </a>
                )}
              </div>
              {d.receipts.length > 0 && (
                <div className="mt-4 border-t border-ink-100 pt-3">
                  <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">{L.check.receipts}</p>
                  <ul className="mt-2 space-y-1.5">
                    {d.receipts.map(r => (
                      <li key={r.receipt_no} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-ink-600">
                          <IconCircleCheck className="h-4 w-4 text-good" />
                          <span className="font-mono text-xs">{r.receipt_no}</span> · {shortDate(r.paid_on)} · {r.mode}
                        </span>
                        <span className="font-semibold text-ink-900">{rupees(r.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SelfCheck() {
  return (
    <LocaleProvider>
      <CheckPage />
    </LocaleProvider>
  );
}
