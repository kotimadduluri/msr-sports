import React from 'react';
import { rupees } from '../../api';
import { Reveal } from '../../motion.jsx';
import { IconChevronRight } from '../../icons.jsx';
import ScrollLink from './ScrollLink.jsx';
import { TIMING_ICONS, STEP_ICONS, WHY_ICONS, programmeIcon } from './content.js';
import { useT } from '../../i18n/index.jsx';

function SectionHead({ kicker, title, sub, light = false }) {
  return (
    <Reveal className="max-w-2xl">
      <p className="flex items-center gap-2.5 text-2xs font-bold uppercase tracking-widest text-saffron-600">
        <span className="h-px w-6 bg-saffron-500" aria-hidden="true" /> {kicker}
      </p>
      <h2 className={`mt-2 font-display text-4xl font-bold uppercase leading-none sm:text-5xl ${light ? 'text-white' : 'text-ink-900'}`}>{title}</h2>
      {sub && <p className={`mt-3 leading-relaxed ${light ? 'text-msr-100' : 'text-ink-600'}`}>{sub}</p>}
    </Reveal>
  );
}

export function Programmes({ list }) {
  const L = useT();
  return (
    <section id="programmes" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 md:py-20">
      <SectionHead kicker={L.programmes.kicker} title={L.programmes.title} sub={L.programmes.sub} />
      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c, i) => {
          const Icon = programmeIcon(c.name);
          return (
            <Reveal key={c.name} delay={(i % 3) * 80}>
              <article className="card card-hover group flex h-full flex-col p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-msr-50 text-msr-700 transition group-hover:bg-msr-800 group-hover:text-saffron-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-[17px] font-bold leading-snug text-ink-900">{c.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">{L.programmes.courses[c.name] || c.description}</p>
                <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-4">
                  <p className="font-bold text-ink-900">{rupees(c.fee_amount)}<span className="text-sm font-medium text-ink-500">{L.programmes.perMonth}</span></p>
                  <ScrollLink to="join" className="flex items-center gap-0.5 text-sm font-semibold text-msr-700 hover:text-msr-900">
                    {L.actions.enquire} <IconChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </ScrollLink>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

export function WhyMsr() {
  const L = useT();
  return (
    <section id="why" className="scroll-mt-20 bg-ink-50 py-16 md:py-20">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.45fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <SectionHead kicker={L.why.kicker} title={L.why.title} sub={L.why.sub} />
          <Reveal delay={120} className="card mt-8 hidden p-5 lg:block">
            <p className="font-bold text-ink-900">{L.why.visit.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{L.why.visit.body}</p>
            <ScrollLink to="join" className="btn-primary btn-sm mt-4">{L.actions.planVisit}</ScrollLink>
          </Reveal>
        </div>

        <div>
          {L.why.items.map(([t, d], i) => {
            const Icon = WHY_ICONS[i];
            return (
              <Reveal key={t} delay={(i % 2) * 60}>
                <div className="flex gap-4 border-b border-ink-200/70 py-5 first:pt-0 last:border-0 last:pb-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-saffron-50 text-saffron-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-ink-900">{t}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{d}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function TrainingDay() {
  const L = useT();
  return (
    <section id="timings" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 md:py-20">
      <SectionHead kicker={L.timings.kicker} title={L.timings.title} sub={L.timings.sub} />
      <div className="relative mt-10 grid gap-4 md:grid-cols-3">
        <div className="absolute left-0 right-0 top-[26px] hidden border-t-2 border-dashed border-ink-200 md:block" aria-hidden="true" />
        {L.timings.slots.map(([t, time, d], i) => {
          const Icon = TIMING_ICONS[i];
          return (
            <Reveal key={t} delay={i * 110}>
              <div className="relative">
                <div className="relative z-10 mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-msr-800 text-saffron-300 shadow-card">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="card h-full p-5">
                  <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">{t}</p>
                  <p className="mt-1.5 font-display text-3xl font-bold text-msr-800">{time}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">{d}</p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

export function Steps() {
  const L = useT();
  return (
    <section className="bg-ink-50 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHead kicker={L.steps.kicker} title={L.steps.title} />
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {L.steps.items.map(([t, d], i) => {
            const Icon = STEP_ICONS[i];
            return (
              <Reveal key={t} delay={i * 110}>
                <div className="card h-full p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-saffron-50 text-saffron-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-2xs font-bold uppercase tracking-widest text-ink-400">{L.steps.step} {i + 1}</span>
                  </div>
                  <h3 className="mt-4 font-bold text-ink-900">{t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">{d}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
