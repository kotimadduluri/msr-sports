import React from 'react';
import { Reveal, CountUp, Marquee } from '../../motion.jsx';
import { IconPin, IconPhone, IconTimer, IconCheck } from '../../icons.jsx';
import ScrollLink from './ScrollLink.jsx';
import { Lanes } from './Decor.jsx';
import { ACADEMY, PROOF, EVENTS } from './content.js';

/* One athlete, drawn as a two-frame run cycle. Frame B plays the same stride
   animation delayed half a period, so the frames alternate; under reduced
   motion frame B is hidden and frame A stops on a clean pose. */
function Runner({ x, y, scale, color }) {
  const limb = { fill: 'none', stroke: color, strokeWidth: 3.2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className="animate-bob">
        {/* frame A — full stride */}
        <g className="animate-stride motion-reduce:animate-none">
          <circle cx="4" cy="-34" r="4.4" fill={color} />
          <path d="M5 -29 L-2 -14" {...limb} />
          <path d="M3 -26 L11 -21 L16 -27" {...limb} />
          <path d="M3 -25 L-5 -21 L-9 -13" {...limb} />
          <path d="M-2 -14 L7 -8 L11 0" {...limb} />
          <path d="M-2 -14 L-10 -7 L-17 -11" {...limb} />
        </g>
        {/* frame B — legs passing */}
        <g className="animate-stride motion-reduce:hidden" style={{ animationDelay: '-.23s' }}>
          <circle cx="4" cy="-35" r="4.4" fill={color} />
          <path d="M5 -30 L-2 -14" {...limb} />
          <path d="M3 -26 L9 -20 L13 -25" {...limb} />
          <path d="M3 -25 L-3 -19 L-6 -13" {...limb} />
          <path d="M-2 -14 L5 -8 L3 0" {...limb} />
          <path d="M-2 -14 L-5 -6 L-10 -2" {...limb} />
        </g>
      </g>
    </g>
  );
}

/* Side view of the track: three athletes mid-sprint, lane markings streaming
   past under their feet, wind streaks behind them. Everything is CSS-animated,
   so prefers-reduced-motion freezes it into a still illustration. */
function RunScene() {
  const dash = { stroke: '#fff', strokeOpacity: 0.16, strokeWidth: 2, strokeDasharray: '26 18' };
  return (
    <div className="relative mx-auto w-full max-w-md select-none">
      <svg viewBox="0 0 420 260" className="w-full" aria-hidden="true">
        {/* stadium wall */}
        <rect x="0" y="64" width="420" height="56" fill="#13234a" />
        <text x="210" y="103" textAnchor="middle" fill="#2a4c93" fillOpacity=".9"
          fontFamily="Barlow Condensed, Arial Narrow, sans-serif" fontWeight="700" fontSize="27" letterSpacing="6">
          MSR SPORTS ACADEMY
        </text>
        <path d="M0 120 H420" stroke="#f5a524" strokeOpacity=".5" strokeWidth="2.5" />

        {/* track surface + streaming lane lines */}
        <rect x="0" y="120" width="420" height="140" fill="#182b50" />
        <path d="M0 150 H420" className="animate-ground" {...dash} />
        <path d="M0 190 H420" className="animate-ground" {...dash} style={{ animationDelay: '-.3s' }} />
        <path d="M0 240 H420" className="animate-ground" {...dash} style={{ animationDelay: '-.6s' }} />

        {/* wind streaks */}
        {[[132, '-.2s'], [172, '-1.1s'], [216, '-1.7s']].map(([y, d]) => (
          <path key={y} d={`M340 ${y} h26`} stroke="#fff" strokeOpacity=".5" strokeWidth="2"
            strokeLinecap="round" className="animate-streak motion-reduce:hidden" style={{ animationDelay: d }} />
        ))}

        {/* the field — nearest athlete leads in saffron */}
        <Runner x={110} y={146} scale={0.5} color="#8dabdd" />
        <Runner x={200} y={186} scale={0.68} color="#dbe6f6" />
        <Runner x={282} y={234} scale={0.88} color="#f5a524" />
      </svg>

      {/* floating proof cards — real screens from the admin app */}
      <div className="absolute -right-2 -top-4 animate-float rounded-2xl bg-white/95 p-3.5 shadow-pop backdrop-blur sm:-right-6">
        <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-ink-500">
          <IconTimer className="h-3.5 w-3.5 text-msr-700" /> 1600 m — season best
        </p>
        <p className="mt-1 font-display text-2xl font-bold text-ink-900">5 min 08 s</p>
        <p className="text-2xs font-semibold text-good">−12 s since June</p>
      </div>
      <div className="absolute -left-2 -bottom-6 animate-float rounded-2xl bg-white/95 p-3.5 shadow-pop backdrop-blur sm:-left-6" style={{ animationDelay: '-3s' }}>
        <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-ink-500">
          <IconCheck className="h-3.5 w-3.5 text-msr-700" /> Morning roll call
        </p>
        <p className="mt-1 font-display text-2xl font-bold text-ink-900">94% present</p>
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
            <h1 className="mt-5 max-w-xl font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-[4.25rem]">
              Your government job starts at <span className="text-saffron-400">5:30{' '}AM.</span>
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

        <Reveal delay={200} className="pb-8 pt-6 md:py-0">
          <RunScene />
        </Reveal>
      </div>

      {/* proof, counted up as it scrolls in */}
      <div className="relative mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 pb-12 sm:px-6 md:grid-cols-4">
        {PROOF.map(([n, l], i) => (
          <Reveal key={l} delay={i * 70} className="rounded-2xl bg-white/[0.07] p-5 ring-1 ring-inset ring-white/10">
            <p className="font-display text-4xl font-bold text-saffron-400 sm:text-[2.75rem]"><CountUp value={n} /></p>
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
