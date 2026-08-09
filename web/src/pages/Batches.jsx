import React, { useEffect, useState, useCallback } from 'react';
import { api, rupees } from '../api';
import { Loading, Modal, Field, useToast, PageHead, Segmented } from '../components.jsx';
import { IconPlus } from '../icons.jsx';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Batches() {
  const toast = useToast();
  const [tab, setTab] = useState('timetable');
  const [week, setWeek] = useState(null);
  const [batches, setBatches] = useState(null);
  const [courses, setCourses] = useState(null);
  const [open, setOpen] = useState(null);      // 'batch' | 'course'
  const [batchForm, setBatchForm] = useState({ name: '', course_id: '', start_time: '05:30', end_time: '08:00', venue: 'MSR Ground, Chirala', capacity: 60, days: 'Mon,Tue,Wed,Thu,Fri,Sat' });
  const [courseForm, setCourseForm] = useState({ name: '', description: '', fee_amount: '', admission_fee: '', duration_months: 6 });

  const load = useCallback(() => {
    api.get('/timetable').then(setWeek).catch(e => toast(e.message, 'error'));
    api.get('/batches').then(setBatches).catch(() => {});
    api.get('/courses').then(setCourses).catch(() => {});
  }, [toast]);
  useEffect(load, [load]);

  async function saveBatch(e) {
    e.preventDefault();
    try {
      await api.post('/batches', { ...batchForm, course_id: batchForm.course_id ? Number(batchForm.course_id) : null, capacity: Number(batchForm.capacity) });
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

  const toggleDay = d => {
    const set = new Set(batchForm.days.split(',').filter(Boolean));
    set.has(d) ? set.delete(d) : set.add(d);
    setBatchForm({ ...batchForm, days: DAYS.filter(x => set.has(x)).join(',') });
  };

  return (
    <div className="space-y-4">
      <PageHead title="Batches" sub="Timings, coaches and the programmes they run"
        actions={<>
          <button onClick={() => setOpen('course')} className="btn-ghost">
            <IconPlus className="h-[18px] w-[18px]" /> Programme
          </button>
          <button onClick={() => setOpen('batch')} className="btn-primary">
            <IconPlus className="h-[18px] w-[18px]" /> Batch
          </button>
        </>} />

      <Segmented value={tab} onChange={setTab}
        options={[['timetable', 'Timetable'], ['batches', 'Batches'], ['courses', 'Programmes']]} />

      {tab === 'timetable' && (!week ? <Loading rows={5} /> : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {DAYS.map(d => (
            <div key={d} className="card p-3">
              <p className="mb-2 font-bold">{d}</p>
              {week[d]?.length ? week[d].map(b => (
                <div key={b.id} className="mb-2 rounded-xl bg-msr-50 p-2.5">
                  <p className="text-sm font-semibold">{b.name}</p>
                  <p className="text-xs text-ink-600">{b.start_time}–{b.end_time}</p>
                  <p className="text-xs text-ink-500">{b.coach_name || 'No coach'} · {b.student_count} students</p>
                </div>
              )) : <p className="text-xs text-ink-400">Rest day</p>}
            </div>
          ))}
        </div>
      ))}

      {tab === 'batches' && (!batches ? <Loading rows={5} /> : (
        <div className="card divide-y divide-ink-100">
          {batches.map(b => (
            <div key={b.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-semibold">{b.name}</p>
                <p className="text-xs text-ink-500">{b.course_name || 'No programme'} · {b.days}</p>
                <p className="text-xs text-ink-500">{b.start_time}–{b.end_time} · {b.venue}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{b.student_count}<span className="text-xs font-normal text-ink-500">/{b.capacity}</span></p>
                <p className="text-xs text-ink-500">{b.coach_name || 'No coach'}</p>
              </div>
            </div>
          ))}
        </div>
      ))}

      {tab === 'courses' && (!courses ? <Loading rows={5} /> : (
        <div className="grid gap-3 sm:grid-cols-2">
          {courses.map(c => (
            <div key={c.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold">{c.name}</p>
                <span className="pill bg-msr-50 text-msr-700">{c.student_count} students</span>
              </div>
              <p className="mt-2 text-sm text-ink-600">{c.description}</p>
              <p className="mt-3 text-sm font-semibold">
                {rupees(c.fee_amount)}/month
                {c.admission_fee > 0 && <span className="font-normal text-ink-500"> · {rupees(c.admission_fee)} admission</span>}
              </p>
            </div>
          ))}
        </div>
      ))}

      <Modal open={open === 'batch'} onClose={() => setOpen(null)} title="New batch">
        <form onSubmit={saveBatch} className="space-y-3">
          <Field label="Batch name"><input className="input" required value={batchForm.name} onChange={e => setBatchForm({ ...batchForm, name: e.target.value })} /></Field>
          <Field label="Programme">
            <select className="input" value={batchForm.course_id} onChange={e => setBatchForm({ ...batchForm, course_id: e.target.value })}>
              <option value="">Select</option>
              {courses?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start"><input type="time" className="input" value={batchForm.start_time} onChange={e => setBatchForm({ ...batchForm, start_time: e.target.value })} /></Field>
            <Field label="End"><input type="time" className="input" value={batchForm.end_time} onChange={e => setBatchForm({ ...batchForm, end_time: e.target.value })} /></Field>
          </div>
          <Field label="Days">
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map(d => (
                <button type="button" key={d} onClick={() => toggleDay(d)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    batchForm.days.includes(d) ? 'bg-msr-800 text-white' : 'bg-ink-100 text-ink-600'}`}>{d}</button>
              ))}
            </div>
          </Field>
          <Field label="Venue"><input className="input" value={batchForm.venue} onChange={e => setBatchForm({ ...batchForm, venue: e.target.value })} /></Field>
          <Field label="Capacity"><input className="input" inputMode="numeric" value={batchForm.capacity} onChange={e => setBatchForm({ ...batchForm, capacity: e.target.value })} /></Field>
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
