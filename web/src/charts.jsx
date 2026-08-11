import React, { useState, useRef, useId } from 'react';

/* Charts follow one spec: 2px line, hairline solid grid, ≥8px end marker with a
   2px surface ring, no legend for a single series (the title names it), text in
   ink tokens rather than the series colour, and a hover crosshair by default. */

const SERIES = '#2a78d6';
const GRID = '#e1e0d9';
const AXIS = '#c6c6bd';
const MUTED = '#83837a';
const SURFACE = '#ffffff';

/* ---------------- line: a rate over time ---------------- */
export function TrendLine({ data, height = 200, unit = '%', domain = [0, 100], format = v => `${v}${unit}` }) {
  const [hover, setHover] = useState(null);
  const wrap = useRef(null);
  const clip = useId().replace(/:/g, '');

  const W = 720, H = height, PL = 34, PR = 16, PT = 12, PB = 26;
  const n = data.length;
  if (!n) return <div className="flex h-40 items-center justify-center text-sm text-ink-500">No data yet.</div>;

  const x = i => PL + (n === 1 ? (W - PL - PR) / 2 : i * (W - PL - PR) / (n - 1));
  const y = v => PT + (1 - (v - domain[0]) / (domain[1] - domain[0])) * (H - PT - PB);
  const pts = data.map((d, i) => [x(i), y(d.value)]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${pts[n - 1][0].toFixed(1)} ${H - PB} L${pts[0][0].toFixed(1)} ${H - PB} Z`;
  const ticks = [domain[0], (domain[0] + domain[1]) / 2, domain[1]];
  const last = data[n - 1];

  const onMove = e => {
    const r = wrap.current.getBoundingClientRect();
    const px = ((e.touches ? e.touches[0].clientX : e.clientX) - r.left) / r.width * W;
    let best = 0;
    pts.forEach((p, i) => { if (Math.abs(p[0] - px) < Math.abs(pts[best][0] - px)) best = i; });
    setHover(best);
  };

  const h = hover === null ? null : { d: data[hover], p: pts[hover] };

  return (
    <div ref={wrap} className="relative select-none" onMouseMove={onMove} onMouseLeave={() => setHover(null)}
      onTouchStart={onMove} onTouchMove={onMove} onTouchEnd={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
        aria-label={`Trend chart, latest value ${format(last.value)}`}>
        <defs>
          <linearGradient id={`g${clip}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES} stopOpacity="0.14" />
            <stop offset="100%" stopColor={SERIES} stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map(t => (
          <g key={t}>
            <line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth="1" />
            <text x={PL - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill={MUTED}>{t}</text>
          </g>
        ))}
        <line x1={PL} x2={W - PR} y1={H - PB} y2={H - PB} stroke={AXIS} strokeWidth="1" />

        <path d={area} fill={`url(#g${clip})`} />
        <path d={line} fill="none" stroke={SERIES} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* end marker: 8px, ringed in the surface colour */}
        <circle cx={pts[n - 1][0]} cy={pts[n - 1][1]} r="5.5" fill={SURFACE} />
        <circle cx={pts[n - 1][0]} cy={pts[n - 1][1]} r="4" fill={SERIES} />

        {data.map((d, i) => (
          (i === 0 || i === n - 1 || i === Math.floor(n / 2)) &&
          <text key={i} x={x(i)} y={H - 8} fontSize="11" fill={MUTED}
            textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}>{d.label}</text>
        ))}

        {h && (
          <g>
            <line x1={h.p[0]} x2={h.p[0]} y1={PT} y2={H - PB} stroke={AXIS} strokeWidth="1" />
            <circle cx={h.p[0]} cy={h.p[1]} r="6" fill={SURFACE} />
            <circle cx={h.p[0]} cy={h.p[1]} r="4.5" fill={SERIES} />
          </g>
        )}
      </svg>

      {h && (
        <div className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-lg bg-ink-900 px-2.5 py-1.5 text-center shadow-pop"
          style={{ left: `${(h.p[0] / W) * 100}%` }}>
          <p className="text-2xs text-white/70">{h.d.full || h.d.label}</p>
          <p className="text-sm font-bold text-white tnum">{format(h.d.value)}</p>
        </div>
      )}
    </div>
  );
}

/* ---------------- columns: an amount per month ---------------- */
export function Columns({ data, height = 200, format = v => v }) {
  const [hover, setHover] = useState(null);
  const W = 720, H = height, PL = 46, PR = 12, PT = 14, PB = 26;
  const n = data.length;
  if (!n) return <div className="flex h-40 items-center justify-center text-sm text-ink-500">No data yet.</div>;

  const max = Math.max(...data.map(d => d.value)) || 1;
  const band = (W - PL - PR) / n;
  const bw = Math.min(28, band * 0.52);          /* cap the bar; the rest is air */
  const y = v => PT + (1 - v / max) * (H - PT - PB);
  const ticks = [0, max / 2, max];
  const short = v => v >= 1e5 ? `${(v / 1e5).toFixed(1)}L` : v >= 1000 ? `${Math.round(v / 1000)}k` : Math.round(v);

  return (
    <div className="relative select-none" onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Monthly totals">
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth="1" />
            <text x={PL - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill={MUTED}>{short(t)}</text>
          </g>
        ))}
        <line x1={PL} x2={W - PR} y1={H - PB} y2={H - PB} stroke={AXIS} strokeWidth="1" />

        {data.map((d, i) => {
          const cx = PL + band * i + band / 2;
          const top = y(d.value);
          const on = hover === i;
          return (
            <g key={i} onMouseEnter={() => setHover(i)}>
              <rect x={cx - band / 2} y={PT} width={band} height={H - PT - PB} fill="transparent" />
              {/* 4px rounded cap, square at the baseline */}
              <path d={`M${cx - bw / 2} ${H - PB} L${cx - bw / 2} ${top + 4} Q${cx - bw / 2} ${top} ${cx - bw / 2 + 4} ${top}
                        L${cx + bw / 2 - 4} ${top} Q${cx + bw / 2} ${top} ${cx + bw / 2} ${top + 4} L${cx + bw / 2} ${H - PB} Z`}
                fill={SERIES} opacity={hover === null || on ? 1 : 0.45} />
              <text x={cx} y={H - 8} fontSize="11" fill={MUTED} textAnchor="middle">{d.label}</text>
              {on && <text x={cx} y={top - 8} fontSize="12" fontWeight="700" fill="#1f1f1c" textAnchor="middle">{format(d.value)}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ---------------- sparkline for stat tiles ---------------- */
export function Spark({ values, className = 'h-8 w-full' }) {
  if (!values?.length) return null;
  const W = 100, H = 28;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [i * W / (values.length - 1 || 1), H - 3 - ((v - min) / span) * (H - 6)]);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={className} aria-hidden="true">
      <path d={pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')}
        fill="none" stroke={SERIES} strokeWidth="2" vectorEffect="non-scaling-stroke"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------------- attendance heat strip ---------------- */
export function HeatStrip({ days }) {
  const tone = s => s === 'present' ? 'bg-emerald-500' : s === 'late' ? 'bg-amber-400'
    : s === 'leave' ? 'bg-sky-400' : s === 'absent' ? 'bg-rose-500' : 'bg-ink-200';
  return (
    <div className="flex flex-wrap gap-1">
      {days.map(d => (
        <span key={d.date} title={`${d.date}: ${d.status}`}
          className={`h-6 w-6 rounded-md ${tone(d.status)} opacity-90 transition hover:opacity-100`} />
      ))}
    </div>
  );
}
