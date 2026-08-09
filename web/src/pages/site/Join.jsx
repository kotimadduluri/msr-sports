import React, { useState } from 'react';
import { api } from '../../api';
import { Spinner } from '../../components.jsx';
import { Reveal } from '../../motion.jsx';
import { IconPin, IconPhone, IconWhatsapp, IconMail, IconCircleCheck } from '../../icons.jsx';
import { ACADEMY } from './content.js';

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

  return (
    <section id="join" className="relative scroll-mt-20 overflow-hidden bg-msr-950 py-16 md:py-20">
      <div className="pointer-events-none absolute -left-28 top-0 h-80 w-80 rounded-full bg-msr-700/40 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-2 md:gap-14">
        <Reveal>
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Join MSR Sports Academy</h2>
          <p className="mt-4 max-w-md leading-relaxed text-msr-100">
            Leave your number and our office will call you the same day with fees, batch
            timings and what to bring on your first morning.
          </p>
          <ul className="mt-8 space-y-4 text-sm text-msr-100">
            <li className="flex gap-3"><IconPin className="mt-0.5 h-5 w-5 shrink-0 text-saffron-400" />{ACADEMY.address}</li>
            <li className="flex gap-3"><IconPhone className="mt-0.5 h-5 w-5 shrink-0 text-saffron-400" />
              <a href={`tel:${ACADEMY.phone}`} className="underline-offset-4 hover:underline">{ACADEMY.phone}</a></li>
            <li className="flex gap-3"><IconWhatsapp className="mt-0.5 h-5 w-5 shrink-0 text-saffron-400" />
              <a href={`https://wa.me/${ACADEMY.whatsapp}`} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">WhatsApp us</a></li>
            <li className="flex gap-3"><IconMail className="mt-0.5 h-5 w-5 shrink-0 text-saffron-400" />
              <a href={`mailto:${ACADEMY.email}`} className="underline-offset-4 hover:underline">{ACADEMY.email}</a></li>
          </ul>
        </Reveal>

        <Reveal delay={120}>
          <div className="card p-6">
            {state.done ? (
              <div className="animate-fade-up py-10 text-center">
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
              <form onSubmit={submit} className="space-y-4">
                <h3 className="text-lg font-bold text-ink-900">Admission enquiry</h3>
                <div>
                  <label className="label" htmlFor="n">Your name</label>
                  <input id="n" className="input" required enterKeyHint="next"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="label" htmlFor="ph">Mobile number</label>
                  <input id="ph" className="input" inputMode="numeric" required pattern="[0-9+\-\s]{10,15}"
                    placeholder="9XXXXXXXXX" enterKeyHint="next"
                    value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="label" htmlFor="v">Village or town</label>
                  <input id="v" className="input" enterKeyHint="next"
                    value={form.village} onChange={e => setForm({ ...form, village: e.target.value })} />
                </div>
                <div>
                  <label className="label" htmlFor="i">Which programme?</label>
                  <select id="i" className="input" value={form.interest} onChange={e => setForm({ ...form, interest: e.target.value })}>
                    <option value="">Not sure yet</option>
                    {courses.map(c => <option key={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="m">Message</label>
                  <textarea id="m" className="input" rows="2" placeholder="Best time to call you"
                    value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
                </div>
                {state.error && <p className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{state.error}</p>}
                <button className="btn-primary w-full" disabled={state.busy}>
                  {state.busy ? <Spinner className="h-5 w-5" /> : 'Request a call back'}
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
