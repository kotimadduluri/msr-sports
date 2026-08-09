import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { Reveal } from '../../motion.jsx';
import { IconMedal, IconArrowRight } from '../../icons.jsx';
import { useT } from '../../i18n/index.jsx';

/* The success wall: real selections recorded in the portal, shown to every
   visitor — the one section that sells the academy better than any copy.
   Renders nothing until the office has published at least one selection. */
export default function Wall() {
  const L = useT();
  const [selections, setSelections] = useState([]);
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    api.get('/public/selections').then(setSelections).catch(() => {});
    api.get('/public/notices').then(setNotices).catch(() => {});
  }, []);

  if (!selections.length && !notices.length) return null;

  return (
    <section className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 md:py-20">
      {selections.length > 0 && (
        <>
          <Reveal className="max-w-2xl">
            <p className="flex items-center gap-2.5 text-2xs font-bold uppercase tracking-widest text-saffron-600">
              <span className="h-px w-6 bg-saffron-500" aria-hidden="true" /> {L.wall.kicker}
            </p>
            <h2 className="mt-2 font-display text-4xl font-bold uppercase leading-none text-ink-900 sm:text-5xl">{L.wall.title}</h2>
            <p className="mt-3 leading-relaxed text-ink-600">{L.wall.sub}</p>
          </Reveal>

          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {selections.map((s, i) => (
              <Reveal key={`${s.name}-${s.year}-${i}`} delay={(i % 3) * 70}>
                <div className="card flex items-center gap-3.5 p-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-saffron-50 text-saffron-600">
                    <IconMedal className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink-900">{s.name}
                      {s.village && <span className="font-normal text-ink-500"> · {s.village}</span>}
                    </p>
                    <p className="truncate text-sm text-ink-600">{s.exam} — <span className="font-semibold tabular-nums">{s.year}</span></p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </>
      )}

      {notices.length > 0 && (
        <Reveal delay={120} className={selections.length ? 'mt-12' : ''}>
          <p className="flex items-center gap-2.5 text-2xs font-bold uppercase tracking-widest text-saffron-600">
            <span className="h-px w-6 bg-saffron-500" aria-hidden="true" /> {L.wall.updates}
          </p>
          <div className="mt-4 space-y-2.5">
            {notices.map((n, i) => (
              <div key={i} className="card p-4">
                <p className="font-bold text-ink-900">{n.title}</p>
                {n.body && <p className="mt-1 text-sm leading-relaxed text-ink-600">{n.body}</p>}
                {n.link && (
                  <a href={n.link} target="_blank" rel="noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-msr-700 underline-offset-4 hover:underline">
                    {n.exam || n.title} <IconArrowRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </Reveal>
      )}
    </section>
  );
}
