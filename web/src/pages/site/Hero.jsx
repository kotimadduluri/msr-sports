import React, { useEffect, useId, useRef, useState } from 'react';
import { Reveal, CountUp, Marquee } from '../../motion.jsx';
import { IconPin, IconPhone, IconTimer, IconCheck } from '../../icons.jsx';
import ScrollLink from './ScrollLink.jsx';
import { Lanes } from './Decor.jsx';
import { ACADEMY, EVENT_ICONS } from './content.js';
import { useT } from '../../i18n/index.jsx';

/* ---------------------------------------------------------------- athletes
   Pictogram athletes built from thick round-capped strokes, animated as a
   skeleton: thighs and upper arms rotate at the hip/shoulder, shins at the
   knee, all on eased SMIL curves that stay in sync on the document timeline.
   Far-side limbs are drawn in a darker tone for depth. When the visitor
   prefers reduced motion we skip the <animateTransform> nodes entirely and
   the figures hold the static mid-stride pose. */

const T = 0.66; // seconds per full stride cycle

const EASE2 = { calcMode: 'spline', keySplines: '.42 0 .58 1;.42 0 .58 1', repeatCount: 'indefinite' };
const EASE4 = { calcMode: 'spline', keySplines: '.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1', repeatCount: 'indefinite' };

function Swing({ on, values, keyTimes = '0;.5;1', begin, ease = EASE2 }) {
  if (!on) return null;
  return (
    <animateTransform attributeName="transform" type="rotate" additive="sum"
      values={values} keyTimes={keyTimes} dur={`${T}s`} begin={begin} {...ease} />
  );
}

/* One leg: thigh from the hip, shin+foot from the knee. `phase` staggers the
   two legs half a cycle apart. `pose` is the frozen fallback angle pair. */
function Leg({ on, tone, w, begin, pose: [hipDeg, kneeDeg] }) {
  const s = { fill: 'none', stroke: tone, strokeWidth: w, strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <g transform={`rotate(${on ? 0 : hipDeg})`}>
      <Swing on={on} values="-52 0 0; 44 0 0; -52 0 0" begin={begin} />
      <path d="M0 0 L0 13.5" {...s} />
      <g transform={`translate(0 13.5) rotate(${on ? 0 : kneeDeg})`}>
        <Swing on={on} values="78 0 0; 26 0 0; 12 0 0; 108 0 0; 78 0 0" keyTimes="0;.28;.52;.8;1" ease={EASE4} begin={begin} />
        <path d="M0 0 L0 12 M0 12 L4.6 12.5" {...s} />
      </g>
    </g>
  );
}

/* One arm: pumps from the shoulder, elbow held bent like a sprinter. */
function Arm({ on, tone, w, begin, pose }) {
  const s = { fill: 'none', stroke: tone, strokeWidth: w, strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <g transform={`rotate(${on ? 0 : pose})`}>
      <Swing on={on} values="40 0 0; -36 0 0; 40 0 0" begin={begin} />
      <path d="M0 0 L0 10.5 M0 10.5 L7.6 8.2" {...s} />
    </g>
  );
}

function Athlete({ x, y, scale, tone, toneBack, phase = 0, drift, on }) {
  const t0 = `-${(phase).toFixed(2)}s`;
  const t1 = `-${(phase + T / 2).toFixed(2)}s`;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* soft grounded shadow — wide faint halo plus a darker core, squashing
         with each footstrike while the body bobs above it */}
      <ellipse cx="1" cy="1.8" rx="19" ry="4.2" fill="#000" opacity=".22">
        {on && <animate attributeName="rx" values="19;14;19" dur={`${T / 2}s`} begin={t0} repeatCount="indefinite" />}
      </ellipse>
      <ellipse cx="1" cy="1.5" rx="12" ry="2.6" fill="#000" opacity=".42">
        {on && <animate attributeName="rx" values="12;8.5;12" dur={`${T / 2}s`} begin={t0} repeatCount="indefinite" />}
        {on && <animate attributeName="opacity" values=".42;.26;.42" dur={`${T / 2}s`} begin={t0} repeatCount="indefinite" />}
      </ellipse>

      <g>
        {/* the whole body rides a small bounce, one per footstrike */}
        {on && (
          <animateTransform attributeName="transform" type="translate" additive="sum"
            values="0 0; 0 -2.6; 0 0" keyTimes="0;.5;1" dur={`${T / 2}s`} begin={t0} {...EASE2} />
        )}
        {/* drift forward and back inside the pack */}
        {on && drift && (
          <animateTransform attributeName="transform" type="translate" additive="sum"
            values="0 0; 7 0; 0 0; -6 0; 0 0" keyTimes="0;.25;.5;.75;1" dur={`${drift}s`}
            calcMode="spline" keySplines=".42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1" repeatCount="indefinite" />
        )}

        {/* far side, darker */}
        <g transform="translate(4.5 -31)"><Arm on={on} tone={toneBack} w={5} begin={t0} pose={34} /></g>
        <g transform="translate(0 -16.5)"><Leg on={on} tone={toneBack} w={5.4} begin={t1} pose={[38, 62]} /></g>

        {/* torso + head */}
        <path d="M0 -16.5 L4.5 -31" fill="none" stroke={tone} strokeWidth="8" strokeLinecap="round" />
        <circle cx="7.6" cy="-37" r="4.6" fill={tone} />

        {/* near side, full tone */}
        <g transform="translate(0 -16.5)"><Leg on={on} tone={tone} w={5.4} begin={t0} pose={[-44, 42]} /></g>
        <g transform="translate(4.5 -31)"><Arm on={on} tone={tone} w={5} begin={t1} pose={-32} /></g>
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ scene
   A 3/4 view of the stadium: the athletes lap a perspective oval. A small
   rAF driver moves each one along an ellipse — figures stay upright, shrink
   with distance on the back straight, narrow through the bends (turn
   foreshortening) and mirror when running the far side. Limb animation stays
   on the SMIL skeleton; painter-order is re-sorted as they overtake. */

const CX = 210, CY = 190;
const FIELD = [
  { rx: 130, ry: 37, lap: 9.6, th: 2.4, base: .72, tone: '#8dabdd', toneBack: '#5f7cab', phase: 0.11 },
  { rx: 157, ry: 45, lap: 8.5, th: 4.3, base: .84, tone: '#dbe6f6', toneBack: '#93a8cd', phase: 0.42 },
  { rx: 184, ry: 53, lap: 7.5, th: 1.1, base: .97, tone: '#f5a524', toneBack: '#b97b16', phase: 0.02, glow: true }
];

function placeRunner(el, r, th) {
  const depth = (Math.sin(th) + 1) / 2;                       // 0 = back straight, 1 = home straight
  const s = r.base * (0.55 + 0.45 * depth);
  const sin = Math.sin(th);
  /* through the bends the silhouette narrows, then mirrors — reads as the turn */
  const sx = s * (sin >= 0 ? 1 : -1) * Math.max(0.24, Math.min(1, Math.abs(sin) * 1.5));
  const x = CX + r.rx * Math.cos(th);
  const y = CY + r.ry * sin;
  el.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${sx.toFixed(3)} ${s.toFixed(3)})`);
  return y;
}

function LapPack({ on, glowId }) {
  const packRef = useRef(null);
  const runnerRefs = useRef([]);

  useEffect(() => {
    const els = runnerRefs.current.filter(Boolean);
    if (!els.length) return;
    if (!on) { els.forEach((el, i) => placeRunner(el, FIELD[i], FIELD[i].th)); return; }
    let raf;
    const t0 = performance.now();
    const tick = now => {
      const t = (now - t0) / 1000;
      const ys = els.map((el, i) => {
        const r = FIELD[i];
        return { el, y: placeRunner(el, r, r.th - (2 * Math.PI * t) / r.lap) };
      });
      /* keep the nearest athlete painted on top */
      const sorted = [...ys].sort((a, b) => a.y - b.y);
      if (sorted.some((s, i) => s.el !== packRef.current.children[i])) {
        sorted.forEach(s => packRef.current.appendChild(s.el));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on]);

  return (
    <g ref={packRef}>
      {FIELD.map((r, i) => (
        <g key={i} ref={el => { runnerRefs.current[i] = el; }}>
          {r.glow && <circle cy="-17" r="34" fill={`url(#${glowId})`} />}
          <Athlete x={0} y={0} scale={1} tone={r.tone} toneBack={r.toneBack} phase={r.phase} on={on} />
        </g>
      ))}
    </g>
  );
}

function RunScene() {
  const L = useT();
  const uid = useId();
  const [on] = useState(() => typeof window === 'undefined'
    || !window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  return (
    <div className="relative mx-auto w-full max-w-md select-none">
      <svg viewBox="0 58 420 200" className="w-full" aria-hidden="true">
        <defs>
          {/* red synthetic track, lit warm by the low sun */}
          <linearGradient id={`${uid}-track`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a84a30" />
            <stop offset=".5" stopColor="#8f3b27" />
            <stop offset="1" stopColor="#75301f" />
          </linearGradient>
          {/* grass infield */}
          <linearGradient id={`${uid}-field`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2f6f42" />
            <stop offset="1" stopColor="#1f4e2e" />
          </linearGradient>
          <radialGradient id={`${uid}-glow`}>
            <stop offset="0" stopColor="#f5a524" stopOpacity=".25" />
            <stop offset="1" stopColor="#f5a524" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}-sun`}>
            <stop offset="0" stopColor="#ffe9b8" />
            <stop offset=".65" stopColor="#fbc45c" />
            <stop offset="1" stopColor="#f5a524" />
          </radialGradient>
          <radialGradient id={`${uid}-dawn`}>
            <stop offset="0" stopColor="#f5a524" stopOpacity=".3" />
            <stop offset=".55" stopColor="#e2703a" stopOpacity=".12" />
            <stop offset="1" stopColor="#e2703a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 5:30 AM: the sun just clearing the far straight */}
        <ellipse cx="284" cy="114" rx="150" ry="62" fill={`url(#${uid}-dawn)`} />
        <circle cx="284" cy="111" r="11" fill={`url(#${uid}-sun)`} />

        {/* floodlight masts, still switched on at dawn */}
        {[58, 352].map(mx => (
          <g key={mx}>
            <path d={`M${mx} 131 V84 M${mx - 8} 84 H${mx + 8}`} stroke="#243d6f" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            <ellipse cx={mx} cy="78" rx="13" ry="5" fill="#f5a524" opacity=".14" />
            {[-6, 0, 6].map(dx => (
              <g key={dx}>
                <circle cx={mx + dx} cy="76" r="1.7" fill="#ffdf9e" />
                <circle cx={mx + dx} cy="80.5" r="1.7" fill="#ffdf9e" opacity=".85" />
              </g>
            ))}
          </g>
        ))}

        {/* the ground, seen from the stands */}
        <ellipse cx={CX} cy={CY + 6} rx="207" ry="63" fill="#000" opacity=".2" />
        <ellipse cx={CX} cy={CY} rx="200" ry="60" fill={`url(#${uid}-track)`} />
        {/* lane lines: solid white, brightest at the kerb */}
        <ellipse cx={CX} cy={CY} rx="198" ry="59" fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth="1.1" />
        {[[128, 34.9], [143, 40.1], [157, 45], [172, 50.2], [186, 55.1]].map(([rx, ry]) => (
          <ellipse key={rx} cx={CX} cy={CY} rx={rx} ry={ry} fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="1.1" />
        ))}
        <ellipse cx={CX} cy={CY} rx="114" ry="30" fill={`url(#${uid}-field)`} />
        <ellipse cx={CX} cy={CY} rx="114" ry="30" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="1.6" />
        {/* mowing rings on the grass */}
        {[92, 68, 44].map(r => (
          <ellipse key={r} cx={CX} cy={CY} rx={r} ry={r * 0.26} fill="none" stroke="#3d8050" strokeOpacity=".4" strokeWidth="9" />
        ))}
        {/* start / finish line, painted across the lanes */}
        <path d={`M${CX} ${CY + 30} L${CX} ${CY + 59}`} stroke="#fff" strokeOpacity=".75" strokeWidth="3" />
        {/* club letters painted on the infield */}
        <text x={CX} y={CY + 6} textAnchor="middle" fill="#fff" fillOpacity=".85"
          fontFamily="Barlow Condensed, Arial Narrow, sans-serif" fontWeight="700" fontSize="20" letterSpacing="6">
          MSR
        </text>

        <LapPack on={on} glowId={`${uid}-glow`} />
      </svg>

      {/* proof from the admin app, kept clear of the track */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 rounded-2xl bg-white/95 p-3.5 shadow-pop backdrop-blur">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-msr-50 text-msr-700">
            <IconTimer className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-2xs font-semibold uppercase tracking-wider text-ink-500">{L.hero.scene.bestLabel}</span>
            <span className="block font-display text-xl font-bold leading-tight text-ink-900">
              {L.hero.scene.bestValue} <span className="text-[13px] font-sans font-semibold text-good">−12 s</span>
            </span>
          </span>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-white/95 p-3.5 shadow-pop backdrop-blur">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-msr-50 text-msr-700">
            <IconCheck className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-2xs font-semibold uppercase tracking-wider text-ink-500">{L.hero.scene.rollLabel}</span>
            <span className="block font-display text-xl font-bold leading-tight text-ink-900">{L.hero.scene.rollValue}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const L = useT();
  return (
    <section id="top" className="relative overflow-hidden bg-msr-950">
      <Lanes />
      <div className="pointer-events-none absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-msr-700/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-saffron-500/15 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-10 pt-16 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-24">
        <div>
          <Reveal>
            <span className="pill bg-white/10 text-white ring-1 ring-inset ring-white/15">
              <IconPin className="h-3.5 w-3.5" /> {L.hero.badge}
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-5 max-w-xl font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-[4.25rem]">
              {L.hero.h1a} <span className="text-saffron-400">{L.hero.h1b}</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-msr-100 sm:text-base">{L.hero.sub}</p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ScrollLink to="join" className="btn-accent">{L.hero.ctaTrial}</ScrollLink>
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
        {L.hero.proof.map(([n, l], i) => (
          <Reveal key={l} delay={i * 70} className="rounded-2xl bg-white/[0.07] p-5 ring-1 ring-inset ring-white/10">
            <p className="font-display text-4xl font-bold text-saffron-400 sm:text-[2.75rem]"><CountUp value={n} /></p>
            <p className="mt-1.5 text-[13px] leading-snug text-msr-100">{l}</p>
          </Reveal>
        ))}
      </div>

      {/* every event the recruitments test */}
      <div className="relative border-t border-white/10 bg-msr-900/60 py-3.5">
        <Marquee>
          {L.hero.events.map((label, i) => {
            const Icon = EVENT_ICONS[i];
            return (
              <span key={label} className="flex items-center gap-2 text-[13px] font-semibold text-msr-100">
                <Icon className="h-4 w-4 text-saffron-400" /> {label}
              </span>
            );
          })}
        </Marquee>
      </div>
    </section>
  );
}
