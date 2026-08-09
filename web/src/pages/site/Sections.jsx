import React from 'react';
import { rupees } from '../../api';
import { Reveal } from '../../motion.jsx';
import { IconChevronRight } from '../../icons.jsx';
import { WHY, TIMINGS, STEPS, programmeIcon } from './content.js';

function SectionHead({ kicker, title, sub, light = false }) {
  return (
    <Reveal className="max-w-2xl">
      <p className="text-2xs font-bold uppercase tracking-widest text-saffron-600">{kicker}</p>
      <h2 className={`mt-2 text-3xl font-extrabold sm:text-4xl ${light ? 'text-white' : 'text-ink-900'}`}>{title}</h2>
      {sub && <p className={`mt-3 leading-relaxed ${light ? 'text-msr-100' : 'text-ink-600'}`}>{sub}</p>}
    </Reveal>
  );
}

export function Programmes({ list }) {
  return (
    <section id="programmes" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 md:py-20">
      <SectionHead kicker="What we coach" title="Choose your recruitment"
        sub="Every programme pairs ground training with written-exam classes. Fees are monthly, and a receipt is issued for every payment." />
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
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">{c.description}</p>
                <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-4">
                  <p className="font-bold text-ink-900">{rupees(c.fee_amount)}<span className="text-sm font-medium text-ink-500">/month</span></p>
                  <a href="#join" className="flex items-center gap-0.5 text-sm font-semibold text-msr-700 hover:text-msr-900">
                    Enquire <IconChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </a>
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
  return (
    <section id="why" className="scroll-mt-20 bg-ink-50 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHead kicker="The difference" title="Why students choose MSR"
          sub="Chirala has gyms and it has tuition centres. What it did not have is one place that treats the run and the written paper as a single preparation." />
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WHY.map(([t, d], i) => (
            <Reveal key={t} delay={(i % 3) * 80}>
              <div className="card h-full p-5">
                <span className="text-2xs font-bold tabular-nums text-saffron-500">0{i + 1}</span>
                <h3 className="mt-2 font-bold text-ink-900">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TrainingDay() {
  return (
    <section id="timings" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 md:py-20">
      <SectionHead kicker="A training day" title="The daily schedule"
        sub="Six days a week, in two shifts, so school, college and working candidates can all train." />
      <div className="relative mt-10 grid gap-4 md:grid-cols-3">
        <div className="absolute left-0 right-0 top-[26px] hidden border-t-2 border-dashed border-ink-200 md:block" aria-hidden="true" />
        {TIMINGS.map(([Icon, t, time, d], i) => (
          <Reveal key={t} delay={i * 110}>
            <div className="relative">
              <div className="relative z-10 mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-msr-800 text-saffron-300 shadow-card">
                <Icon className="h-6 w-6" />
              </div>
              <div className="card h-full p-5">
                <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">{t}</p>
                <p className="mt-1.5 text-2xl font-extrabold text-msr-800">{time}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{d}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function Steps() {
  return (
    <section className="bg-ink-50 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHead kicker="Getting started" title="Joining takes one morning" />
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {STEPS.map(([Icon, t, d], i) => (
            <Reveal key={t} delay={i * 110}>
              <div className="card h-full p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-saffron-50 text-saffron-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-2xs font-bold uppercase tracking-widest text-ink-400">Step {i + 1}</span>
                </div>
                <h3 className="mt-4 font-bold text-ink-900">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
