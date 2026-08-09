import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Logo, IconPhone, IconMenu, IconClose } from '../icons.jsx';
import Hero from './site/Hero.jsx';
import { Programmes, WhyMsr, TrainingDay, Steps } from './site/Sections.jsx';
import Join from './site/Join.jsx';
import { ACADEMY, FALLBACK } from './site/content.js';

const NAV_LINKS = [
  ['#programmes', 'Programmes'],
  ['#why', 'Why MSR'],
  ['#timings', 'Timings'],
  ['#join', 'Contact']
];

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
          <a href="#top" className="flex items-center gap-2.5">
            <Logo className="h-9 w-9" />
            <span className="leading-tight">
              <span className="block text-[15px] font-extrabold text-ink-900">MSR Sports Academy</span>
              <span className="block text-2xs text-ink-500">Chirala, Andhra Pradesh</span>
            </span>
          </a>

          <nav className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map(([h, l]) => <a key={h} href={h} className={link}>{l}</a>)}
          </nav>

          <div className="flex items-center gap-2">
            <a href="#join" className="btn-primary btn-sm hidden sm:inline-flex">Join now</a>
            <Link to="/login" className="hidden text-sm font-semibold text-ink-500 hover:text-msr-800 lg:block">Staff login</Link>
            <button onClick={() => setMenu(v => !v)} className="rounded-xl p-2 text-ink-600 md:hidden" aria-label="Menu" aria-expanded={menu}>
              {menu ? <IconClose /> : <IconMenu />}
            </button>
          </div>
        </div>
        {menu && (
          <div className="animate-fade-up border-t border-ink-200 bg-white px-4 py-3 md:hidden">
            {NAV_LINKS.map(([h, l]) => (
              <a key={h} href={h} onClick={() => setMenu(false)}
                className="block rounded-lg px-2 py-3 text-sm font-semibold text-ink-700 hover:bg-ink-50">{l}</a>
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

      <footer className="border-t border-ink-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-ink-500 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} MSR Sports Academy · {ACADEMY.address}</p>
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
