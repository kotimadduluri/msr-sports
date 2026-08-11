import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Logo, IconPhone, IconMenu, IconClose, IconMail, IconPin, IconGlobe } from '../icons.jsx';
import { LocaleProvider, useLocale, useT, LANGS } from '../i18n/index.jsx';
import Hero from './site/Hero.jsx';
import ScrollLink from './site/ScrollLink.jsx';
import { Programmes, WhyMsr, TrainingDay, Steps } from './site/Sections.jsx';
import Wall from './site/Wall.jsx';
import Join from './site/Join.jsx';
import { ACADEMY, FALLBACK } from './site/content.js';

/* Section ids are fixed; only the labels translate. */
const NAV_IDS = ['programmes', 'why', 'timings', 'join'];
const navLabel = (L, id) => (id === 'join' ? L.nav.contact : L.nav[id]);

function LangPicker({ className = '' }) {
  const { lang, setLang } = useLocale();
  return (
    <label className={`relative inline-flex items-center ${className}`}>
      <span className="sr-only">Language</span>
      <IconGlobe className="pointer-events-none absolute left-2.5 h-4 w-4 text-ink-500" />
      <select value={lang} onChange={e => setLang(e.target.value)}
        className="cursor-pointer appearance-none rounded-xl border border-ink-200 bg-white py-2 pl-8 pr-3 text-sm font-semibold text-ink-700 outline-none transition hover:border-ink-300 focus:border-msr-500">
        {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
      </select>
    </label>
  );
}

function Footer() {
  const L = useT();
  return (
    <footer className="border-t border-white/10 bg-msr-950 text-msr-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1.3fr] md:gap-8">
        <div>
          <div className="flex items-center gap-2.5">
            <Logo className="h-10 w-10" />
            <span className="leading-tight">
              <span className="block text-[15px] font-extrabold text-white">MSR Sports Academy</span>
              <span className="block text-2xs text-msr-300">{L.footer.place}</span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-msr-200">{L.footer.blurb}</p>
        </div>

        <nav aria-label="Footer">
          <p className="text-2xs font-bold uppercase tracking-widest text-msr-300">{L.footer.explore}</p>
          <ul className="mt-3 space-y-2.5 text-[12.5px] font-bold uppercase tracking-wider">
            {NAV_IDS.map(id => (
              <li key={id}><ScrollLink to={id} className="transition hover:text-white">{navLabel(L, id)}</ScrollLink></li>
            ))}
            <li><Link to="/check" className="transition hover:text-white">{L.check.navLabel}</Link></li>
            <li><Link to="/login" className="transition hover:text-white">{L.actions.staffLogin}</Link></li>
          </ul>
        </nav>

        <div>
          <p className="text-2xs font-bold uppercase tracking-widest text-msr-300">{L.footer.contact}</p>
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

/* True once the page has scrolled past the very top. Watches a 1px sentinel
   with IntersectionObserver, so no scroll listener runs per frame. */
function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const el = document.createElement('div');
    el.style.cssText = 'position:absolute;top:0;height:1px;width:1px;pointer-events:none;';
    document.body.prepend(el);
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting));
    io.observe(el);
    return () => { io.disconnect(); el.remove(); };
  }, []);
  return scrolled;
}

function SitePage() {
  const L = useT();
  const [courses, setCourses] = useState([]);
  const [menu, setMenu] = useState(false);
  const scrolled = useScrolled();

  useEffect(() => { api.get('/enquiries/public/courses').then(setCourses).catch(() => {}); }, []);
  const list = courses.length ? courses : FALLBACK;

  const link = 'text-[12.5px] font-bold uppercase tracking-wider text-ink-600 transition hover:text-msr-800';

  return (
    <div className="bg-white">
      <header className={`sticky top-0 z-40 border-b border-ink-200/70 bg-white/90 backdrop-blur-md
        transition-shadow duration-200 ${scrolled ? 'shadow-lift' : ''}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <ScrollLink to="top" className="flex items-center gap-2.5">
            <Logo className="h-9 w-9" />
            <span className="leading-tight">
              <span className="block text-[15px] font-extrabold text-ink-900">MSR Sports Academy</span>
              <span className="block text-2xs text-ink-500">Chirala, Andhra Pradesh</span>
            </span>
          </ScrollLink>

          <nav className="hidden items-center gap-7 md:flex">
            {NAV_IDS.map(id => <ScrollLink key={id} to={id} className={link}>{navLabel(L, id)}</ScrollLink>)}
            <Link to="/check" className={link}>{L.check.navLabel}</Link>
          </nav>

          <div className="flex items-center gap-2">
            <LangPicker className="hidden md:inline-flex" />
            <ScrollLink to="join" className="btn-primary btn-sm hidden sm:inline-flex">{L.actions.joinNow}</ScrollLink>
            <Link to="/login" className="hidden text-sm font-semibold text-ink-500 hover:text-msr-800 lg:block">{L.actions.staffLogin}</Link>
            <button onClick={() => setMenu(v => !v)} aria-label="Menu" aria-expanded={menu}
              className="rounded-xl p-2 text-ink-600 transition duration-150 ease-swift hover:bg-ink-100 active:scale-95 md:hidden">
              {menu ? <IconClose /> : <IconMenu />}
            </button>
          </div>
        </div>
        {menu && (
          <div className="animate-fade-up border-t border-ink-200 bg-white px-4 py-3 md:hidden">
            {NAV_IDS.map(id => (
              <ScrollLink key={id} to={id} onClick={() => setMenu(false)}
                className="block rounded-lg px-2 py-3 text-[13px] font-bold uppercase tracking-wider text-ink-700 hover:bg-ink-50">{navLabel(L, id)}</ScrollLink>
            ))}
            <Link to="/check" className="block rounded-lg px-2 py-3 text-[13px] font-bold uppercase tracking-wider text-ink-700 hover:bg-ink-50">{L.check.navLabel}</Link>
            <Link to="/login" className="block rounded-lg px-2 py-3 text-sm font-semibold text-ink-500">{L.actions.staffLogin}</Link>
            <div className="px-2 pb-1 pt-2"><LangPicker /></div>
          </div>
        )}
      </header>

      <Hero />
      <Programmes list={list} />
      <WhyMsr />
      <Wall />
      <TrainingDay />
      <Steps />
      <Join courses={list} />
      <Footer />

      {/* sticky call bar on phones */}
      <div className="sticky bottom-0 z-30 flex gap-2 border-t border-ink-200 bg-white/95 p-3 backdrop-blur-md md:hidden"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}>
        <a href={`tel:${ACADEMY.phoneHref}`} className="btn-ghost flex-1"><IconPhone className="h-[18px] w-[18px]" /> {L.actions.call}</a>
        <ScrollLink to="join" className="btn-primary flex-1">{L.actions.joinNow}</ScrollLink>
      </div>
    </div>
  );
}

export default function Site() {
  return (
    <LocaleProvider>
      <SitePage />
    </LocaleProvider>
  );
}
