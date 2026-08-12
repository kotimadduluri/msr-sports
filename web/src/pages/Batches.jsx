import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api, rupees, getUser } from '../api';
import { Loading, Modal, Field, useToast, PageHead, Segmented, Avatar } from '../components.jsx';
import { IconPlus, IconSunrise, IconSunset, IconChevronRight, IconUser } from '../icons.jsx';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* "05:30" → ["5:30", "AM"] for the timeline's big clock figures. */
const t12 = t => {
  const [h, m] = (t || '0:0').split(':').map(Number);
  return [`${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')}`, h >= 12 ? 'PM' : 'AM'];
};

/* Is this batch on the ground right now? Real clock, batch's own days. */
export const liveNow = b => {
  const now = new Date();
  if (!(b.days || '').includes(DAYS[(now.getDay() + 6) % 7])) return false;
  const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return hm >= b.start_time && hm < b.end_time;
};

/* How full the batch is, as a bar: numbers say 48/60, the meter shows it. */
export function CapacityMeter({ b, className = 'mt-2.5' }) {
  const pct = Math.min(100, Math.round(100 * b.student_count / (b.capacity || 1)));
  const full = b.student_count >= b.capacity;
  const near = !full && b.student_count >= 0.8 * b.capacity;
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-ink-100 shadow-[inset_0_1px_1px_rgba(15,28,54,.05)] ${className}`}
      role="img" aria-label={`${b.student_count} of ${b.capacity} seats taken`}>
      <span className={`block h-full rounded-full ${full ? 'bg-critical' : near ? 'bg-warn' : 'bg-msr-500'}`}
        style={{ width: `${pct}%` }} />
    </div>
  );
}

/* The week at a glance: one lettered chip per day, lit when the batch runs. */
export function DayDots({ days = '', dark = false }) {
  return (
    <div className="flex gap-1" role="img" aria-label={`Runs ${days.split(',').join(', ')}`}>
      {DAYS.map(d => {
        const on = days.includes(d);
        return (
          <span key={d} title={d}
            className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold ${
              on
                ? dark ? 'bg-white/15 text-white' : 'bg-msr-100 text-msr-800'
                : dark ? 'bg-white/5 text-white/30' : 'bg-ink-100 text-ink-400'}`}>
            {d[0]}
          </span>
        );
      })}
    </div>
  );
}

/* One capacity/health chip row, shared by the timeline and the flat list. */
export function BatchChips({ b }) {
  const full = b.student_count >= b.capacity;
  const near = !full && b.student_count >= 0.8 * b.capacity;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      <span className={`pill ${full ? 'bg-critical-50 text-critical' : near ? 'bg-warn-50 text-warn-700' : 'bg-msr-50 text-msr-700'}`}>
        {b.student_count}/{b.capacity} students
      </span>
      {full && <span className="pill bg-critical-50 text-critical">Full</span>}
      {b.att30_pct != null && (
        <span className={`pill ${b.att30_pct >= 85 ? 'bg-good-50 text-good-700' : b.att30_pct >= 70 ? 'bg-warn-50 text-warn-700' : 'bg-critical-50 text-critical'}`}>
          {b.att30_pct}% attendance
        </span>
      )}
      {b.due_total > 0 && <span className="pill bg-ink-100 text-ink-700">{rupees(b.due_total)} due</span>}
    </div>
  );
}

/* The batch form body, shared by "new batch" here and "edit batch" on the
   detail page. `form`/`setForm` own the state; courses/coaches fill selects. */
export function BatchFormFields({ form, setForm, courses, coaches }) {
  const toggleDay = d => {
    const set = new Set(form.days.split(',').filter(Boolean));
    set.has(d) ? set.delete(d) : set.add(d);
    setForm({ ...form, days: DAYS.filter(x => set.has(x)).join(',') });
  };
  return (
    <>
      <Field label="Batch name"><input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Programme">
          <select className="input" value={form.course_id ?? ''} onChange={e => setForm({ ...form, course_id: e.target.value })}>
            <option value="">Select</option>
            {courses?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Coach">
          <select className="input" value={form.coach_id ?? ''} onChange={e => setForm({ ...form, coach_id: e.target.value })}>
            <option value="">No coach yet</option>
            {coaches?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start"><input type="time" className="input" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} /></Field>
        <Field label="End"><input type="time" className="input" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} /></Field>
      </div>
      <Field label="Days">
        <div className="flex flex-wrap gap-1.5">
          {DAYS.map(d => (
            <button type="button" key={d} onClick={() => toggleDay(d)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                form.days.includes(d) ? 'bg-msr-800 text-white' : 'bg-ink-100 text-ink-600'}`}>{d}</button>
          ))}
        </div>
      </Field>
      <Field label="Venue"><input className="input" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} /></Field>
      <Field label="Capacity"><input className="input" inputMode="numeric" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} /></Field>
    </>
  );
}

/* Serialize the shared form for POST/PATCH. */
export const batchPayload = f => ({
  ...f,
  course_id: f.course_id ? Number(f.course_id) : null,
  coach_id: f.coach_id ? Number(f.coach_id) : null,
  capacity: Number(f.capacity)
});

/* A day on the ground, morning to evening: each active batch pinned to the
   rail at its start time, with its health beside it. */
function Timeline({ batches }) {
  const active = batches.filter(b => b.active !== 0);
  /* A coach lands on their own batches first; the rest of the day follows. */
  const user = getUser();
  const mine = user?.role === 'coach' ? active.filter(b => b.coach_id === user.id) : [];
  const rest = mine.length ? active.filter(b => b.coach_id !== user.id) : active;
  const groups = [
    { label: 'Your batches', Icon: IconUser, list: mine },
    { label: 'Morning ground', Icon: IconSunrise, list: rest.filter(b => b.start_time < '12:00') },
    { label: 'Evening ground', Icon: IconSunset, list: rest.filter(b => b.start_time >= '12:00') }
  ].filter(g => g.list.length);

  if (!active.length) return <p className="card p-6 text-sm text-ink-500">No batches yet. Create the first one.</p>;

  return (
    <div className="space-y-6">
      {groups.map(({ label, Icon, list }) => (
        <div key={label}>
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-saffron-50 text-saffron-600">
              <Icon className="h-4 w-4" />
            </span>
            <p className="text-2xs font-bold uppercase tracking-widest text-ink-600">{label}</p>
            <p className="text-2xs font-semibold text-ink-400 tnum">
              {list.length} {list.length === 1 ? 'batch' : 'batches'} · {list.reduce((a, b) => a + b.student_count, 0)} students
            </p>
            <span className="h-px flex-1 bg-ink-200/70" aria-hidden="true" />
          </div>
          <div className="mt-3">
            {list.map(b => {
              const [time, ap] = t12(b.start_time);
              const [end, endAp] = t12(b.end_time);
              const live = liveNow(b);
              return (
                <Link key={b.id} to={`/app/batches/${b.id}`}
                  className="group grid grid-cols-[3.4rem_1.25rem_1fr] gap-x-1 sm:grid-cols-[4rem_1.5rem_1fr]">
                  <div className="pt-3.5 text-right">
                    <p className="font-display text-2xl font-bold leading-none text-msr-800">{time}</p>
                    <p className="text-2xs font-semibold text-ink-400">{ap}</p>
                  </div>
                  <div className="relative justify-self-center">
                    <span className="absolute bottom-0 top-0 w-px bg-ink-200" aria-hidden="true" />
                    <span className={`absolute left-1/2 top-[1.15rem] -translate-x-1/2 rounded-full ring-4 ring-ink-50 transition ${
                      live ? 'h-3 w-3 animate-pulse bg-good' : 'h-2.5 w-2.5 bg-saffron-400 group-hover:bg-saffron-500'}`} aria-hidden="true" />
                  </div>
                  <div className="pb-3">
                    <div className={`card card-hover p-4 ${live ? 'outline outline-2 outline-good/25' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2 font-bold text-ink-900">
                            <span className="truncate">{b.name}</span>
                            {live && (
                              <span className="pill bg-good-50 text-good-700">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-good" /> On ground
                              </span>
                            )}
                          </p>
                          <p className="mt-0.5 text-xs text-ink-500">
                            Till {end} {endAp} at {b.venue}
                          </p>
                          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-600">
                            {b.coach_name
                              ? <><Avatar name={b.coach_name} className="h-5 w-5 text-[9px]" /> {b.coach_name}</>
                              : <span className="text-ink-400">No coach assigned</span>}
                            {b.course_name && <span className="truncate text-ink-400">· {b.course_name}</span>}
                          </p>
                        </div>
                        <IconChevronRight className="mt-1 h-4 w-4 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-msr-700" />
                      </div>
                      <BatchChips b={b} />
                      <CapacityMeter b={b} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Batches() {
  const toast = useToast();
  const [tab, setTab] = useState('timeline');
  const [batches, setBatches] = useState(null);
  const [courses, setCourses] = useState(null);
  const [coaches, setCoaches] = useState([]);
  const [open, setOpen] = useState(null);      // 'batch' | 'course'
  const [batchForm, setBatchForm] = useState({ name: '', course_id: '', coach_id: '', start_time: '05:30', end_time: '08:00', venue: 'MSR Ground, Chirala', capacity: 60, days: 'Mon,Tue,Wed,Thu,Fri,Sat' });
  const [courseForm, setCourseForm] = useState({ name: '', description: '', fee_amount: '', admission_fee: '', duration_months: 6 });

  const load = useCallback(() => {
    api.get('/batches').then(setBatches).catch(e => toast(e.message, 'error'));
    api.get('/courses').then(setCourses).catch(() => {});
    api.get('/coaches').then(setCoaches).catch(() => {});
  }, [toast]);
  useEffect(load, [load]);

  async function saveBatch(e) {
    e.preventDefault();
    try {
      await api.post('/batches', batchPayload(batchForm));
      toast('Batch created'); setOpen(null); load();
    } catch (err) { toast(err.message, 'error'); }
  }

  async function saveCourse(e) {
    e.preventDefault();
    try {
      await api.post('/courses', { ...courseForm, fee_amount: Number(courseForm.fee_amount || 0), admission_fee: Number(courseForm.admission_fee || 0), duration_months: Number(courseForm.duration_months) });
      toast('Programme created'); setOpen(null); load();
    } catch (err) { toast(err.message, 'error'); }
  }

  return (
    <div className="space-y-4">
      <PageHead title="Batches" sub="The day on the ground, batch by batch"
        actions={<>
          <button onClick={() => setOpen('course')} className="btn-ghost">
            <IconPlus className="h-[18px] w-[18px]" /> Programme
          </button>
          <button onClick={() => setOpen('batch')} className="btn-primary">
            <IconPlus className="h-[18px] w-[18px]" /> Batch
          </button>
        </>} />

      <Segmented value={tab} onChange={setTab}
        options={[['timeline', 'Day timeline'], ['batches', 'All batches'], ['courses', 'Programmes']]} />

      {tab === 'timeline' && (!batches ? <Loading rows={5} /> : <Timeline batches={batches} />)}

      {tab === 'batches' && (!batches ? <Loading rows={5} /> : (
        <div className="card divide-y divide-ink-100">
          {batches.map(b => (
            <Link key={b.id} to={`/app/batches/${b.id}`}
              className={`row-hover flex items-center justify-between gap-3 px-4 py-3.5 ${b.active === 0 ? 'opacity-60' : ''}`}>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {b.name}
                  {b.active === 0 && <span className="pill ml-2 bg-ink-100 text-ink-500">Inactive</span>}
                </p>
                <p className="mt-0.5 text-xs text-ink-500 tnum">
                  {b.start_time}–{b.end_time} at {b.venue}{b.course_name ? `, ${b.course_name}` : ''}
                </p>
                <div className="mt-2"><DayDots days={b.days} /></div>
                <BatchChips b={b} />
                <CapacityMeter b={b} className="mt-2.5 max-w-sm" />
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {b.coach_name && (
                  <span className="hidden items-center gap-1.5 text-xs text-ink-600 sm:flex">
                    <Avatar name={b.coach_name} className="h-6 w-6 text-[10px]" /> {b.coach_name}
                  </span>
                )}
                <IconChevronRight className="h-4 w-4 text-ink-300" />
              </div>
            </Link>
          ))}
        </div>
      ))}

      {tab === 'courses' && (!courses ? <Loading rows={5} /> : (
        <div className="grid gap-3 sm:grid-cols-2">
          {courses.map(c => (
            <div key={c.id} className="card flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold">{c.name}</p>
                <span className="pill shrink-0 bg-msr-50 text-msr-700">{c.student_count} students</span>
              </div>
              <p className="mt-2 text-sm text-ink-600">{c.description}</p>
              <p className="mt-3 text-sm font-semibold tnum">
                {rupees(c.fee_amount)}/month
                {c.admission_fee > 0 && <span className="font-normal text-ink-500">, {rupees(c.admission_fee)} admission</span>}
                {c.duration_months > 0 && <span className="font-normal text-ink-500"> · {c.duration_months} months</span>}
              </p>
              {batches && (
                <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
                  {batches.filter(b => b.course_id === c.id && b.active !== 0).map(b => (
                    <Link key={b.id} to={`/app/batches/${b.id}`}
                      className="pill bg-ink-100 text-ink-700 transition hover:bg-msr-50 hover:text-msr-700">
                      {b.name}
                    </Link>
                  ))}
                  {!batches.some(b => b.course_id === c.id && b.active !== 0) && (
                    <span className="text-xs text-ink-400">No batches yet</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      <Modal open={open === 'batch'} onClose={() => setOpen(null)} title="New batch">
        <form onSubmit={saveBatch} className="space-y-3">
          <BatchFormFields form={batchForm} setForm={setBatchForm} courses={courses} coaches={coaches} />
          <button className="btn-primary w-full">Create batch</button>
        </form>
      </Modal>

      <Modal open={open === 'course'} onClose={() => setOpen(null)} title="New programme">
        <form onSubmit={saveCourse} className="space-y-3">
          <Field label="Programme name"><input className="input" required value={courseForm.name} onChange={e => setCourseForm({ ...courseForm, name: e.target.value })} /></Field>
          <Field label="Description"><textarea className="input" rows="3" value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Monthly fee (₹)"><input className="input" inputMode="numeric" value={courseForm.fee_amount} onChange={e => setCourseForm({ ...courseForm, fee_amount: e.target.value })} /></Field>
            <Field label="Admission fee (₹)"><input className="input" inputMode="numeric" value={courseForm.admission_fee} onChange={e => setCourseForm({ ...courseForm, admission_fee: e.target.value })} /></Field>
          </div>
          <Field label="Duration (months)"><input className="input" inputMode="numeric" value={courseForm.duration_months} onChange={e => setCourseForm({ ...courseForm, duration_months: e.target.value })} /></Field>
          <button className="btn-primary w-full">Create programme</button>
        </form>
      </Modal>
    </div>
  );
}
