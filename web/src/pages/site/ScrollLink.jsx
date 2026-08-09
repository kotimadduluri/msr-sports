import React from 'react';

/* The demo build runs under HashRouter, so a plain href="#why" is read as a
   route change — and the catch-all route bounces it back to "/" without
   scrolling. Scroll in JS and leave the URL alone; works under both routers. */
export default function ScrollLink({ to, onClick, children, ...rest }) {
  const go = e => {
    e.preventDefault();
    onClick?.(e);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(to)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };
  return <a href={`#${to}`} onClick={go} {...rest}>{children}</a>;
}
