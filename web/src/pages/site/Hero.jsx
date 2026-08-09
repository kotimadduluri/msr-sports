import React from 'react';
import { Reveal, CountUp, Marquee } from '../../motion.jsx';
import { IconPin, IconPhone, IconTimer, IconCheck } from '../../icons.jsx';
import ScrollLink from './ScrollLink.jsx';
import { Lanes } from './Decor.jsx';
import { ACADEMY, PROOF, EVENTS } from './content.js';

/* Stadium track, drawn as SVG so it stays crisp at any size. One lane carries
   a saffron "runner" streak that laps continuously (animate-lap moves the dash
   by exactly pathLength=1320 per cycle, so the loop is seamless). */
function TrackScene() {
  const lane = r => `M 110 ${140 - r} H 310 A ${r} ${r} 0 0 1 310 ${140 + r} H 110 A ${r} ${r} 0 0 1 110 ${140 - r} Z`;
  return (
    <div className="relative mx-auto w-full max-w-md select-none">
      <svg viewBox="0 0 420 280" className="w-full" aria-hidden="true">
        <path d={lane(104)} fill="#182b50" />
        {[100, 84, 68, 52].map(r => (
          <path key={r} d={lane(r)} fill="none" stroke="#2a4c93" strokeOpacity="0.55" strokeWidth="2" />
        ))}
        <path d={lane(36)} fill="#223d76" fillOpacity="0.5" />
        {/* start line */}
        <path d="M 210 88 V 40" stroke="#8dabdd" strokeOpacity="0.6" strokeWidth="2" strokeDasharray="4 5" />
        {/* the runner streak */}
        <path d={lane(84)} pathLength="1320" fill="none" stroke="#f5a524" strokeWidth="5"
          strokeLinecap="round" strokeDasharray="70 1250" className="animate-lap" />
        <text x="210" y="148" textAnchor="middle" fill="#8dabdd" fillOpacity="0.5"
          fontSize="20" fontWeight="800" letterSpacing="4">MSR</text>
      </svg>

      {/* floating proof cards — real screens from the admin app */}
      <div className="absolute -left-2 top-4 animate-float rounded-2xl bg-white/95 p-3.5 shadow-pop backdrop-blur sm:-left-6">
        <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-ink-500">
          <IconTimer className="h-3.5 w-3.5 text-msr-700" /> 1600 m — season best
        </p>
        <p className="mt-1 text-xl font-extrabold text-ink-900">5 min 08 s</p>
        <p className="text-2xs font-semibold text-good">−12 s since June</p>
      </div>
      <div className="absolute -right-2 bottom-6 animate-float rounded-2xl bg-white/95 p-3.5 shadow-pop backdrop-blur sm:-right-6" style={{ animationDelay: '-3s' }}>
        <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-ink-500">
          <IconCheck className="h-3.5 w-3.5 text-msr-700" /> Morning roll call
        </p>
        <p className="mt-1 text-xl font-extrabold text-ink-900">94% present</p>
        <p className="text-2xs text-ink-500">Marked at the ground, 6:05 AM</p>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-msr-950">
      <Lanes />
      <div className="pointer-events-none absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-msr-700/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-saffron-500/15 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-10 pt-16 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-24">
        <div>
          <Reveal>
            <span className="pill bg-white/10 text-white ring-1 ring-inset ring-white/15">
              <IconPin className="h-3.5 w-3.5" /> Chirala · Bapatla District
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-5 text-[2.5rem] font-extrabold leading-[1.05] text-white sm:text-5xl lg:text-[3.4rem]">
              Your government job<br />starts at <span className="text-saffron-400">5:30 AM.</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-msr-100 sm:text-base">
              We coach candidates for Police, Army, SSC and Railway selection — the physical
              events on our ground, the written exam in our classroom, and every timing
              measured so you know exactly where you stand.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ScrollLink to="join" className="btn-accent">Book a free trial morning</ScrollLink>
              <a href={`tel:${ACADEMY.phoneHref}`} className="btn border border-white/25 text-white hover:bg-white/10">
                <IconPhone className="h-[18px] w-[18px]" /> {ACADEMY.phone}
              </a>
            </div>
          </Reveal>
        </div>

        <Reveal delay={200} className="pb-6 pt-2 md:py-0">
          <TrackScene />
        </Reveal>
      </div>

      {/* proof, counted up as it scrolls in */}
      <div className="relative mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 pb-12 sm:px-6 md:grid-cols-4">
        {PROOF.map(([n, l], i) => (
          <Reveal key={l} delay={i * 70} className="rounded-2xl bg-white/[0.07] p-5 ring-1 ring-inset ring-white/10">
            <p className="text-2xl font-extrabold text-saffron-400 sm:text-3xl"><CountUp value={n} /></p>
            <p className="mt-1.5 text-[13px] leading-snug text-msr-100">{l}</p>
          </Reveal>
        ))}
      </div>

      {/* every event the recruitments test */}
      <div className="relative border-t border-white/10 bg-msr-900/60 py-3.5">
        <Marquee>
          {EVENTS.map(([Icon, label]) => (
            <span key={label} className="flex items-center gap-2 text-[13px] font-semibold text-msr-100">
              <Icon className="h-4 w-4 text-saffron-400" /> {label}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
