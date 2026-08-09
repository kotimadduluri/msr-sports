import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Logo, IconPhone, IconMenu, IconClose, IconMail, IconPin } from '../icons.jsx';
import Hero from './site/Hero.jsx';
import ScrollLink from './site/ScrollLink.jsx';
import { Programmes, WhyMsr, TrainingDay, Steps } from './site/Sections.jsx';
import Join from './site/Join.jsx';
import { ACADEMY, FALLBACK } from './site/content.js';

const NAV_LINKS = [
  ['programmes', 'Programmes'],
  ['why', 'Why MSR'],
  ['timings', 'Timings'],
  ['join', 'Contact']
];

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-msr-950 text-msr-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1.3fr] md:gap-8">
        <div>
          <div className="flex items-center gap-2.5">
            <Logo className="h-10 w-10" />
            <span className="leading-tight">
              <span className="block text-[15px] font-extrabold text-white">MSR Sports Academy</span>
              <span className="block text-2xs text-msr-300">Chirala · Andhra Pradesh</span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-msr-200">
            Ground training and written-exam coaching for police, army, SSC and
            railway recruitment — one campus, one preparation.
          </p>
        </div>

        <nav aria-label="Footer">
          <p className="text-2xs font-bold uppercase tracking-widest text-msr-300">Explore</p>
          <ul className="mt-3 space-y-2.5 text-sm font-medium">
            {NAV_LINKS.map(([id, label]) => (
              <li key={id}><ScrollLink to={id} className="transition hover:text-white">{label}</ScrollLink></li>
            ))}
            <li><Link to="/login" className="transition hover:text-white">Staff login</Link></li>
          </ul>
        </nav>

        <div>
          <p className="text-2xs font-bold uppercase tracking-widest text-msr-300">Contact</p>
          <ul className="mt-3 space-y-2.5 text-sm font-medium">
            <li>
              <a href={`tel:${ACADEMY.phoneHref}`} className="flex items-center gap-2.5 transition hover:text-white">
                <IconPhone className="h-4 w-4 text-saffron-400" /> {ACADEMY.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${ACADEMY.email}`} className="flex items-center gap-2.5 transition hover:text-white">
                <IconMail className="h-4 w-4 text-saffron-400" /> {ACADEMY.email}
              </a>
            </li>
            <li>
              <a href={ACADEMY.mapsUrl} target="_blank" rel="noreferrer" className="flex items-start gap-2.5 transition hover:text-white">
                <IconPin className="mt-0.5 h-4 w-4 shrink-0 text-saffron-400" /> {ACADEMY.address}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-sm text-msr-300">
        © {new Date().getFullYear()} MSR Sports Academy
      </div>
    </footer>
  );
}

export default function Site() {
  const [courses, setCourses] = useState([]);
  const [menu, setMenu] = useState(false);

  useEffect(() => { api.get('/enquiries/public/courses').then(setCourses).catch(() => {}); }, []);
  const list = courses.length ? courses : FALLBACK;

  const link = 'text-sm font-medium text-ink-600 transition hover:text-msr-800';

  return (
    <div className="bg-white">
      <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <ScrollLink to="top" className="flex items-center gap-2.5">
            <Logo className="h-9 w-9" />
            <span className="leading-tight">
              <span className="block text-[15px] font-extrabold text-ink-900">MSR Sports Academy</span>
              <span className="block text-2xs text-ink-500">Chirala, Andhra Pradesh</span>
            </span>
          </ScrollLink>

          <nav className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map(([id, label]) => <ScrollLink key={id} to={id} className={link}>{label}</ScrollLink>)}
          </nav>

          <div className="flex items-center gap-2">
            <ScrollLink to="join" className="btn-primary btn-sm hidden sm:inline-flex">Join now</ScrollLink>
            <Link to="/login" className="hidden text-sm font-semibold text-ink-500 hover:text-msr-800 lg:block">Staff login</Link>
            <button onClick={() => setMenu(v => !v)} className="rounded-xl p-2 text-ink-600 md:hidden" aria-label="Menu" aria-expanded={menu}>
              {menu ? <IconClose /> : <IconMenu />}
            </button>
          </div>
        </div>
        {menu && (
          <div className="animate-fade-up border-t border-ink-200 bg-white px-4 py-3 md:hidden">
            {NAV_LINKS.map(([id, label]) => (
              <ScrollLink key={id} to={id} onClick={() => setMenu(false)}
                className="block rounded-lg px-2 py-3 text-sm font-semibold text-ink-700 hover:bg-ink-50">{label}</ScrollLink>
            ))}
            <Link to="/login" className="block rounded-lg px-2 py-3 text-sm font-semibold text-ink-500">Staff login</Link>
          </div>
        )}
      </header>

      <Hero />
      <Programmes list={list} />
      <WhyMsr />
      <TrainingDay />
      <Steps />
      <Join courses={list} />
      <Footer />

      {/* sticky call bar on phones */}
      <div className="sticky bottom-0 z-30 flex gap-2 border-t border-ink-200 bg-white/95 p-3 backdrop-blur-md md:hidden"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}>
        <a href={`tel:${ACADEMY.phoneHref}`} className="btn-ghost flex-1"><IconPhone className="h-[18px] w-[18px]" /> Call</a>
        <ScrollLink to="join" className="btn-primary flex-1">Join now</ScrollLink>
      </div>
    </div>
  );
}
