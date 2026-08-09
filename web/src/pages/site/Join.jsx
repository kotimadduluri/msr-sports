import React, { useState } from 'react';
import { api } from '../../api';
import { Spinner } from '../../components.jsx';
import { Reveal } from '../../motion.jsx';
import {
  IconPin, IconPhone, IconWhatsapp, IconMail, IconCircleCheck, IconUser,
  IconMessage, IconTrophy, IconDirections, IconArrowRight, IconClipboardCheck
} from '../../icons.jsx';
import { Lanes } from './Decor.jsx';
import { ACADEMY } from './content.js';

/* Input with a leading icon. `top` aligns the icon for multi-line fields. */
function Field({ icon: Icon, label, htmlFor, top = false, children }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>{label}</label>
      <div className="relative">
        <Icon className={`pointer-events-none absolute left-3.5 h-[18px] w-[18px] text-ink-400 ${top ? 'top-3.5' : 'top-1/2 -translate-y-1/2'}`} />
        {children}
      </div>
    </div>
  );
}

const CONTACTS = [
  { icon: IconPhone, label: 'Call the office', value: ACADEMY.phone, href: `tel:${ACADEMY.phoneHref}` },
  { icon: IconWhatsapp, label: 'WhatsApp', value: 'Message us any time', href: `https://wa.me/${ACADEMY.whatsapp}`, external: true },
  { icon: IconMail, label: 'Email', value: ACADEMY.email, href: `mailto:${ACADEMY.email}` }
];

export default function Join({ courses }) {
  const [form, setForm] = useState({ name: '', phone: '', village: '', interest: '', message: '' });
  const [state, setState] = useState({ busy: false, done: false, error: '' });

  async function submit(e) {
    e.preventDefault();
    setState({ busy: true, done: false, error: '' });
    try {
      await api.post('/enquiries/public', form);
      setState({ busy: false, done: true, error: '' });
      setForm({ name: '', phone: '', village: '', interest: '', message: '' });
    } catch (err) {
      setState({ busy: false, done: false, error: err.message });
    }
  }

  const set = k => e => setForm({ ...form, [k]: e.target.value });

  return (
    <section id="join" className="relative scroll-mt-20 overflow-hidden bg-msr-950 py-16 md:py-20">
      <Lanes />
      <div className="pointer-events-none absolute -left-28 top-0 h-80 w-80 rounded-full bg-msr-700/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-saffron-500/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-2 md:gap-14">
        <Reveal>
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Join MSR Sports Academy</h2>
          <p className="mt-4 max-w-md leading-relaxed text-msr-100">
            Leave your number and our office will call you the same day with fees, batch
            timings and what to bring on your first morning.
          </p>

          <div className="mt-8 space-y-3">
            {CONTACTS.map(({ icon: Icon, label, value, href, external }) => (
              <a key={label} href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
                className="group flex items-center gap-4 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-inset ring-white/10 transition hover:bg-white/[0.12]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-saffron-400/15 text-saffron-400">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-2xs font-semibold uppercase tracking-wider text-msr-200">{label}</span>
                  <span className="block truncate font-semibold text-white">{value}</span>
                </span>
                <IconArrowRight className="ml-auto h-4 w-4 shrink-0 text-msr-300 transition group-hover:translate-x-0.5 group-hover:text-saffron-400" />
              </a>
            ))}

            <div className="flex items-start gap-4 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-inset ring-white/10">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-saffron-400/15 text-saffron-400">
                <IconPin className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-2xs font-semibold uppercase tracking-wider text-msr-200">The ground</span>
                <span className="block font-semibold leading-snug text-white">{ACADEMY.address}</span>
                <a href={ACADEMY.mapsUrl} target="_blank" rel="noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-saffron-400 underline-offset-4 hover:underline">
                  <IconDirections className="h-4 w-4" /> Get directions
                </a>
              </span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="card overflow-hidden rounded-3xl">
            <div className="flex items-center gap-3.5 border-b border-ink-100 bg-ink-50/70 px-6 py-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-msr-800 text-saffron-300 shadow-card">
                <IconClipboardCheck className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold leading-tight text-ink-900">Admission enquiry</h3>
                <p className="text-[13px] text-ink-500">Takes 30 seconds — we call back the same day</p>
              </div>
            </div>

            {state.done ? (
              <div className="animate-fade-up px-6 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-good">
                  <IconCircleCheck className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-ink-900">Enquiry received</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm text-ink-600">
                  Our office will call you shortly. For a faster reply, message us on WhatsApp.
                </p>
                <button onClick={() => setState({ busy: false, done: false, error: '' })} className="btn-ghost mt-6">
                  Send another enquiry
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4 p-6">
                <Field icon={IconUser} label="Your name" htmlFor="n">
                  <input id="n" className="input pl-11" required enterKeyHint="next"
                    placeholder="Full name" value={form.name} onChange={set('name')} />
                </Field>
                <Field icon={IconPhone} label="Mobile number" htmlFor="ph">
                  <input id="ph" className="input pl-11" inputMode="numeric" required pattern="[0-9+\-\s]{10,15}"
                    placeholder="9XXXXXXXXX" enterKeyHint="next" value={form.phone} onChange={set('phone')} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field icon={IconPin} label="Village or town" htmlFor="v">
                    <input id="v" className="input pl-11" enterKeyHint="next"
                      placeholder="Chirala" value={form.village} onChange={set('village')} />
                  </Field>
                  <Field icon={IconTrophy} label="Which programme?" htmlFor="i">
                    <select id="i" className="input pl-11" value={form.interest} onChange={set('interest')}>
                      <option value="">Not sure yet</option>
                      {courses.map(c => <option key={c.name}>{c.name}</option>)}
                    </select>
                  </Field>
                </div>
                <Field icon={IconMessage} label="Message (optional)" htmlFor="m" top>
                  <textarea id="m" className="input pl-11" rows="2" placeholder="Best time to call you"
                    value={form.message} onChange={set('message')} />
                </Field>

                {state.error && <p className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{state.error}</p>}
                <button className="btn-accent w-full" disabled={state.busy}>
                  {state.busy ? <Spinner className="h-5 w-5" /> : <>Request a call back <IconArrowRight className="h-[18px] w-[18px]" /></>}
                </button>
                <p className="text-center text-xs text-ink-500">We only use your number to call you about admission.</p>
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
