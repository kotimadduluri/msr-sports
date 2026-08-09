import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, rupees } from '../api';
import { Spinner } from '../components.jsx';
import { Logo, IconPhone, IconWhatsapp, IconPin, IconMail, IconClock, IconTrophy, IconChevronRight, IconMenu, IconClose } from '../icons.jsx';

const ACADEMY = {
  phone: '+91 90000 00000',
  whatsapp: '919000000000',
  email: 'info@msrsports.in',
  address: 'MSR Ground, Chirala, Bapatla District, Andhra Pradesh 523155'
};

const PROOF = [
  ['450+', 'Students trained'],
  ['120+', 'Selected in govt jobs'],
  ['5:30 AM', 'Ground opens daily'],
  ['8 yrs', 'Coaching in Chirala']
];

const WHY = [
  ['Ground and classroom, same day', 'Physical training at dawn, written-exam class by 9 AM. No running between two institutes, no second fee.'],
  ['Every timing measured', 'Your 1600m, long jump and shot put results are recorded month on month, so you know exactly how far you are from the cut-off.'],
  ['Coaches who cleared it themselves', 'Trainers who have been through police and army selection guide the technique — not theory from a book.'],
  ['A women’s batch that runs', 'A dedicated 6:30 AM batch with women trainers for the 800m, long jump and shot put standards.'],
  ['Fees month by month', 'No large lump sum. Cash or UPI, with a printed receipt every single time.'],
  ['Parents kept in the loop', 'If a student stops turning up, the family hears from us that week.']
];

const TIMINGS = [
  ['Morning ground', '5:30 – 8:00 AM', 'Running, jumps, shot put, circuit training. Monday to Saturday.'],
  ['Written class', '9:00 – 11:00 AM', 'Arithmetic, Reasoning, General Studies, current affairs. Monday to Friday.'],
  ['Evening ground', '4:30 – 7:00 PM', 'For working and college students. Monday to Saturday.']
];

export default function Site() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', village: '', interest: '', message: '' });
  const [state, setState] = useState({ busy: false, done: false, error: '' });
  const [menu, setMenu] = useState(false);

  useEffect(() => { api.get('/enquiries/public/courses').then(setCourses).catch(() => {}); }, []);

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

  const list = courses.length ? courses : FALLBACK;
  const link = 'text-sm font-medium text-ink-600 transition hover:text-msr-800';

  return (
    <div className="bg-white">
      {/* ---------------- header ---------------- */}
      <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a href="#top" className="flex items-center gap-2.5">
            <Logo className="h-9 w-9" />
            <span className="leading-tight">
              <span className="block text-[15px] font-extrabold text-ink-900">MSR Sports Academy</span>
              <span className="block text-2xs text-ink-500">Chirala, Andhra Pradesh</span>
            </span>
          </a>

          <nav className="hidden items-center gap-7 md:flex">
            <a href="#programmes" className={link}>Programmes</a>
            <a href="#why" className={link}>Why MSR</a>
            <a href="#timings" className={link}>Timings</a>
            <a href="#join" className={link}>Contact</a>
          </nav>

          <div className="flex items-center gap-2">
            <a href="#join" className="btn-primary btn-sm hidden sm:inline-flex">Join now</a>
            <Link to="/login" className="hidden text-sm font-semibold text-ink-500 hover:text-msr-800 lg:block">Staff login</Link>
            <button onClick={() => setMenu(v => !v)} className="rounded-xl p-2 text-ink-600 md:hidden" aria-label="Menu">
              {menu ? <IconClose /> : <IconMenu />}
            </button>
          </div>
        </div>
        {menu && (
          <div className="animate-fade-up border-t border-ink-200 bg-white px-4 py-3 md:hidden">
            {[['#programmes', 'Programmes'], ['#why', 'Why MSR'], ['#timings', 'Timings'], ['#join', 'Contact']].map(([h, l]) => (
              <a key={h} href={h} onClick={() => setMenu(false)}
                className="block rounded-lg px-2 py-3 text-sm font-semibold text-ink-700 hover:bg-ink-50">{l}</a>
            ))}
            <Link to="/login" className="block rounded-lg px-2 py-3 text-sm font-semibold text-ink-500">Staff login</Link>
          </div>
        )}
      </header>

      {/* ---------------- hero ---------------- */}
      <section id="top" className="relative overflow-hidden bg-msr-950">
        <div className="pointer-events-none absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-msr-700/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-saffron-500/15 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.15fr_1fr] md:py-24">
          <div>
            <span className="pill bg-white/10 text-white ring-1 ring-inset ring-white/15">
              <IconPin className="h-3.5 w-3.5" /> Chirala · Bapatla District
            </span>
            <h1 className="mt-5 text-[2.5rem] font-extrabold leading-[1.05] text-white sm:text-5xl lg:text-[3.5rem]">
              Train for your<br /><span className="text-saffron-400">government job</span><br />— body and books.
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-msr-100 sm:text-base">
              Physical (PET &amp; PMT) and written-exam coaching for Police Constable, SI, Army Agniveer,
              SSC GD and Railway recruitment. The ground opens at 5:30 AM, six days a week.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#join" className="btn-accent">Book a free trial</a>
              <a href={`tel:${ACADEMY.phone}`} className="btn border border-white/25 text-white hover:bg-white/10">
                <IconPhone className="h-[18px] w-[18px]" /> {ACADEMY.phone}
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 self-center">
            {PROOF.map(([n, l]) => (
              <div key={l} className="rounded-2xl bg-white/[0.07] p-5 ring-1 ring-inset ring-white/10">
                <p className="text-2xl font-extrabold text-saffron-400 sm:text-3xl">{n}</p>
                <p className="mt-1.5 text-[13px] leading-snug text-msr-100">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- programmes ---------------- */}
      <section id="programmes" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 md:py-20">
        <div className="max-w-2xl">
          <p className="text-2xs font-bold uppercase tracking-widest text-saffron-600">What we coach</p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink-900 sm:text-4xl">Programmes</h2>
          <p className="mt-3 text-ink-600">Pick the recruitment you are preparing for. Every programme includes ground training and written classes.</p>
        </div>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map(c => (
            <article key={c.name} className="card card-hover flex flex-col p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-msr-50 text-msr-700">
                <IconTrophy className="h-[18px] w-[18px]" />
              </div>
              <h3 className="text-[17px] font-bold leading-snug text-ink-900">{c.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">{c.description}</p>
              <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-4">
                <p className="font-bold text-ink-900">{rupees(c.fee_amount)}<span className="text-sm font-medium text-ink-500">/month</span></p>
                <a href="#join" className="flex items-center gap-0.5 text-sm font-semibold text-msr-700 hover:text-msr-900">
                  Enquire <IconChevronRight className="h-4 w-4" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------- why ---------------- */}
      <section id="why" className="scroll-mt-20 bg-ink-50 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-2xs font-bold uppercase tracking-widest text-saffron-600">The difference</p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink-900 sm:text-4xl">Why students choose MSR</h2>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WHY.map(([t, d], i) => (
              <div key={t} className="card p-5">
                <span className="text-2xs font-bold tabular-nums text-saffron-500">0{i + 1}</span>
                <h3 className="mt-2 font-bold text-ink-900">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- timings ---------------- */}
      <section id="timings" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 md:py-20">
        <h2 className="text-3xl font-extrabold text-ink-900 sm:text-4xl">Daily timings</h2>
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {TIMINGS.map(([t, time, d]) => (
            <div key={t} className="card p-5">
              <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-ink-500">
                <IconClock className="h-3.5 w-3.5" />{t}
              </p>
              <p className="mt-2 text-2xl font-extrabold text-msr-800">{time}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- join ---------------- */}
      <section id="join" className="scroll-mt-20 bg-msr-950 py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-2 md:gap-14">
          <div>
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Join MSR Sports Academy</h2>
            <p className="mt-4 max-w-md leading-relaxed text-msr-100">
              Leave your number and our team will call you the same day with fees, batch timings
              and what to bring on your first morning.
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
          </div>

          <div className="card p-6">
            {state.done ? (
              <div className="py-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-3xl">🙏</div>
                <h3 className="mt-4 text-xl font-bold text-ink-900">Thank you</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm text-ink-600">
                  Our team will call you shortly. You can also WhatsApp us for a faster reply.
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
                    {list.map(c => <option key={c.name}>{c.name}</option>)}
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
        </div>
      </section>

      <footer className="border-t border-ink-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-ink-500 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} MSR Sports Academy, Chirala.</p>
          <Link to="/login" className="font-semibold hover:text-msr-800">Staff login →</Link>
        </div>
      </footer>

      {/* sticky call bar on phones */}
      <div className="sticky bottom-0 z-30 flex gap-2 border-t border-ink-200 bg-white/95 p-3 backdrop-blur-md md:hidden"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}>
        <a href={`tel:${ACADEMY.phone}`} className="btn-ghost flex-1"><IconPhone className="h-[18px] w-[18px]" /> Call</a>
        <a href="#join" className="btn-primary flex-1">Join now</a>
      </div>
    </div>
  );
}

const FALLBACK = [
  { name: 'AP Police Constable — PET + Written', description: 'Ground training for the 100m, 800m/1600m run, long jump and shot put, plus daily written-exam classes.', fee_amount: 1500 },
  { name: 'AP Police SI — PET + Written', description: 'Intensive SI preparation covering physical measurement standards, all PET events and Paper I & II.', fee_amount: 2000 },
  { name: 'Indian Army GD / Agniveer', description: '1.6 km timed run, pull-ups, 9-feet ditch and zig-zag balance practice with CEE written coaching.', fee_amount: 1200 },
  { name: 'SSC GD Constable', description: 'Running endurance training and complete SSC GD written preparation.', fee_amount: 1200 },
  { name: 'Railway RPF / RRB', description: 'PET and CBT coaching for RPF constable and RRB group posts.', fee_amount: 1200 },
  { name: 'General Fitness & Athletics', description: 'Strength, endurance and athletics training for school and college students.', fee_amount: 800 }
];
