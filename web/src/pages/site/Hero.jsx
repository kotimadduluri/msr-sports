import React, { useEffect, useId, useRef, useState } from 'react';
import { Reveal, CountUp, Marquee } from '../../motion.jsx';
import { IconPin, IconPhone, IconTimer, IconCheck } from '../../icons.jsx';
import ScrollLink from './ScrollLink.jsx';
import { Lanes } from './Decor.jsx';
import { ACADEMY, PROOF, EVENTS } from './content.js';

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
      {/* contact shadow */}
      <ellipse cx="1" cy="1.5" rx="13" ry="2.6" fill="#000" opacity=".3">
        {on && <animate attributeName="rx" values="13;9.5;13" dur={`${T / 2}s`} begin={t0} repeatCount="indefinite" />}
        {on && <animate attributeName="opacity" values=".3;.18;.3" dur={`${T / 2}s`} begin={t0} repeatCount="indefinite" />}
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
  const uid = useId();
  const [on] = useState(() => typeof window === 'undefined'
    || !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const crowd = Array.from({ length: 53 }, (_, i) => i);

  return (
    <div className="relative mx-auto w-full max-w-md select-none">
      <svg viewBox="0 40 420 220" className="w-full" aria-hidden="true">
        <defs>
          <linearGradient id={`${uid}-track`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#22407a" />
            <stop offset=".45" stopColor="#1b3059" />
            <stop offset="1" stopColor="#16264a" />
          </linearGradient>
          <linearGradient id={`${uid}-field`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#152a52" />
            <stop offset="1" stopColor="#101d3a" />
          </linearGradient>
          <radialGradient id={`${uid}-glow`}>
            <stop offset="0" stopColor="#f5a524" stopOpacity=".25" />
            <stop offset="1" stopColor="#f5a524" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* stands with a drifting crowd */}
        <rect x="0" y="42" width="420" height="46" fill="#0d1a33" />
        <g opacity=".85">
          {on && (
            <animateTransform attributeName="transform" type="translate"
              values="0 0; -54 0" dur="6.5s" repeatCount="indefinite" />
          )}
          {crowd.map(i => (
            <g key={i}>
              <circle cx={i * 9} cy={i % 2 ? 58 : 61} r="2" fill="#3a62b0" opacity={[.9, .45, .7][i % 3]} />
              <circle cx={i * 9 + 4} cy={i % 2 ? 72 : 75} r="2" fill="#2a4c93" opacity={[.6, .9, .4][i % 3]} />
            </g>
          ))}
        </g>

        {/* boundary wall with signage */}
        <rect x="0" y="88" width="420" height="38" fill="#13234a" />
        <text x="210" y="114" textAnchor="middle" fill="#2f54a0" fillOpacity=".95"
          fontFamily="Barlow Condensed, Arial Narrow, sans-serif" fontWeight="700" fontSize="22" letterSpacing="7">
          MSR SPORTS ACADEMY
        </text>
        <path d="M0 126 H420" stroke="#f5a524" strokeOpacity=".55" strokeWidth="2.5" />
        <rect x="0" y="126" width="420" height="134" fill="#131f3c" />

        {/* the circuit, seen from the stands */}
        <ellipse cx={CX} cy={CY} rx="200" ry="60" fill={`url(#${uid}-track)`} />
        <ellipse cx={CX} cy={CY} rx="143" ry="41" fill="none" stroke="#fff" strokeOpacity=".1" strokeWidth="1.5" strokeDasharray="10 12" />
        <ellipse cx={CX} cy={CY} rx="171" ry="49" fill="none" stroke="#fff" strokeOpacity=".1" strokeWidth="1.5" strokeDasharray="10 12" />
        <ellipse cx={CX} cy={CY} rx="114" ry="30" fill={`url(#${uid}-field)`} />
        <ellipse cx={CX} cy={CY} rx="114" ry="30" fill="none" stroke="#8dabdd" strokeOpacity=".2" strokeWidth="1.2" />
        {/* start / finish */}
        <path d={`M${CX} ${CY + 30} L${CX} ${CY + 59}`} stroke="#fff" strokeOpacity=".4" strokeWidth="2.5" strokeDasharray="4 3" />
        <text x={CX} y={CY + 6} textAnchor="middle" fill="#2f54a0" fillOpacity=".9"
          fontFamily="Barlow Condensed, Arial Narrow, sans-serif" fontWeight="700" fontSize="21" letterSpacing="6">
          MSR
        </text>

        <LapPack on={on} glowId={`${uid}-glow`} />
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
              Your government job starts at <span className="text-saffron-400">5:30 AM.</span>
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
