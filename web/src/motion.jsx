import React, { useEffect, useRef, useState } from 'react';

/* Motion primitives for the public website. All of them respect
   prefers-reduced-motion: the CSS side collapses transitions globally, and the
   JS side (CountUp) checks the media query itself and jumps straight to the
   final value. */

const reduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useInView({ threshold = 0.15, once = true } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) { setInView(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); if (once) io.disconnect(); }
      else if (!once) setInView(false);
    }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, once]);
  return [ref, inView];
}

/* Fades a block up as it scrolls into view. `delay` (ms) staggers siblings. */
export function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const [ref, inView] = useInView();
  return (
    <Tag ref={ref} className={`reveal ${inView ? 'is-in' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined} {...rest}>
      {children}
    </Tag>
  );
}

/* Counts from 0 to `value` when it enters the viewport. Non-numeric values
   ("5:30 AM") render as-is. */
export function CountUp({ value, duration = 1200, className = '' }) {
  const [ref, inView] = useInView({ threshold: 0.6 });
  const match = /^(\d+)(.*)$/.exec(String(value));
  const target = match ? parseInt(match[1], 10) : null;
  const suffix = match ? match[2] : '';
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView || target === null) return;
    if (reduced()) { setN(target); return; }
    let raf; const t0 = performance.now();
    const tick = now => {
      const p = Math.min(1, (now - t0) / duration);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);

  return <span ref={ref} className={`tnum ${className}`}>{target === null ? value : `${n}${suffix}`}</span>;
}

/* Endless horizontal ticker. Children are rendered twice; the track scrolls
   half its own width per loop, so the seam is invisible. */
export function Marquee({ className = '', children }) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="flex w-max animate-marquee gap-10 pr-10">
        {children}
        {children}
      </div>
    </div>
  );
}
