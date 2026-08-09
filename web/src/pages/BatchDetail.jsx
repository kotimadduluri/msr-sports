import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, rupees } from '../api';
import { Loading, Modal, useToast, Stat } from '../components.jsx';
import { IconChevronLeft, IconChevronRight, IconCheck, IconTimer, IconSettings, IconPhone } from '../icons.jsx';
import { BatchChips, BatchFormFields, batchPayload } from './Batches.jsx';

/* One batch, in full: who is in it, how healthy it is, and the two things a
   coach does with it every day — roll call and test entry. Students can be
   moved to another batch from here in two taps. */
export default function BatchDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [batches, setBatches] = useState(null);
  const [roster, setRoster] = useState(null);
  const [courses, setCourses] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [edit, setEdit] = useState(null);        // form state while the edit modal is open
  const [moving, setMoving] = useState(null);    // the student being moved

  const load = useCallback(() => {
    api.get('/batches').then(setBatches).catch(e => toast(e.message, 'error'));
    api.get(`/students?batch_id=${id}&status=active&limit=500`).then(r => setRoster(r.students)).catch(() => {});
    api.get('/courses').then(setCourses).catch(() => {});
    api.get('/coaches').then(setCoaches).catch(() => {});
  }, [id, toast]);
  useEffect(load, [load]);

  const b = batches?.find(x => String(x.id) === String(id));
  if (!batches || !roster) return <Loading rows={6} />;
  if (!b) return <p className="card p-6 text-sm text-ink-500">This batch does not exist any more.</p>;

  const others = batches.filter(x => x.id !== b.id && x.active !== 0);

  function openEdit() {
    setEdit({
      name: b.name, course_id: b.course_id ?? '', coach_id: b.coach_id ?? '',
      start_time: b.start_time, end_time: b.end_time, venue: b.venue,
      capacity: b.capacity, days: b.days, active: b.active !== 0
    });
  }

  async function saveEdit(e) {
    e.preventDefault();
    try {
      await api.patch(`/batches/${b.id}`, { ...batchPayload(edit), active: edit.active ? 1 : 0 });
      toast('Batch saved'); setEdit(null); load();
    } catch (err) { toast(err.message, 'error'); }
  }

  async function moveTo(targetId) {
    try {
      await api.patch(`/students/${moving.id}`, { batch_id: Number(targetId) });
      toast(`${moving.name} moved`);
      setMoving(null); load();
    } catch (err) { toast(err.message, 'error'); }
  }

  return (
    <div className="space-y-4">
      <Link to="/app/batches" className="inline-flex items-center gap-1 text-sm font-semibold text-msr-700 hover:text-msr-900">
        <IconChevronLeft className="h-4 w-4" /> All batches
      </Link>

      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[1.7rem] font-extrabold leading-tight text-ink-900 sm:text-3xl">
              {b.name}
              {b.active === 0 && <span className="pill ml-2 align-middle bg-ink-100 text-ink-500">Inactive</span>}
            </h1>
            <p className="mt-1 text-sm text-ink-500">{b.start_time}–{b.end_time}, {b.days}</p>
            <p className="text-sm text-ink-500">{b.venue}</p>
            <p className="mt-1 text-sm">{b.coach_name || 'No coach assigned'}{b.course_name ? `, ${b.course_name}` : ''}</p>
            <BatchChips b={b} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/app/attendance?batch=${b.id}`} className="btn-primary"><IconCheck className="h-[18px] w-[18px]" /> Roll call</Link>
            <Link to="/app/testday" className="btn-ghost"><IconTimer className="h-[18px] w-[18px]" /> Test day</Link>
            <button onClick={openEdit} className="btn-ghost"><IconSettings className="h-[18px] w-[18px]" /> Edit</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Students" value={`${b.student_count}/${b.capacity}`}
          tone={b.student_count >= b.capacity ? 'bad' : b.student_count >= 0.8 * b.capacity ? 'warn' : 'default'} />
        <Stat label="Attendance, 30 days" value={b.att30_pct != null ? `${b.att30_pct}%` : '–'}
          tone={b.att30_pct == null ? 'default' : b.att30_pct >= 85 ? 'good' : b.att30_pct >= 70 ? 'warn' : 'bad'} />
        <Stat label="Fees due" value={rupees(b.due_total || 0)} tone={b.due_total > 0 ? 'warn' : 'good'} />
      </div>

      <div className="card">
        <p className="border-b border-ink-100 px-4 py-3 text-2xs font-bold uppercase tracking-widest text-ink-500">
          Roster
        </p>
        {roster.length === 0 && <p className="px-4 py-6 text-sm text-ink-500">No active students in this batch yet.</p>}
        <div className="divide-y divide-ink-100">
          {roster.map(s => (
            <div key={s.id} className="flex items-center gap-3 px-4 py-3">
              <Link to={`/app/students/${s.id}`} className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink-900">{s.name}</p>
                <p className="text-xs text-ink-500">{s.admission_no}, {s.gender === 'F' ? 'Female' : 'Male'}</p>
              </Link>
              <a href={`tel:${s.phone}`} className="btn-ghost btn-sm" aria-label={`Call ${s.name}`}>
                <IconPhone className="h-4 w-4" />
              </a>
              <button onClick={() => setMoving(s)} className="btn-quiet btn-sm">Move</button>
              <Link to={`/app/students/${s.id}`} aria-hidden="true" tabIndex={-1}>
                <IconChevronRight className="h-4 w-4 text-ink-300" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title="Edit batch">
        {edit && (
          <form onSubmit={saveEdit} className="space-y-3">
            <BatchFormFields form={edit} setForm={setEdit} courses={courses} coaches={coaches} />
            <label className="flex items-center gap-2.5 rounded-xl bg-ink-50 px-3.5 py-3 text-sm font-semibold text-ink-700">
              <input type="checkbox" checked={edit.active} onChange={e => setEdit({ ...edit, active: e.target.checked })}
                className="h-4 w-4 rounded accent-msr-800" />
              Batch is running
              <span className="ml-auto text-xs font-normal text-ink-500">Untick to archive</span>
            </label>
            <button className="btn-primary w-full">Save changes</button>
          </form>
        )}
      </Modal>

      <Modal open={!!moving} onClose={() => setMoving(null)} title={moving ? `Move ${moving.name}` : ''}>
        {moving && (
          <div className="space-y-2">
            <p className="text-sm text-ink-600">Pick the new batch. Attendance and fees move with the student.</p>
            {others.length === 0 && <p className="text-sm text-ink-500">There is no other active batch to move to.</p>}
            {others.map(t => {
              const full = t.student_count >= t.capacity;
              return (
                <button key={t.id} onClick={() => moveTo(t.id)}
                  className="row-hover flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-left hairline">
                  <span>
                    <span className="block font-semibold text-ink-900">{t.name}</span>
                    <span className="block text-xs text-ink-500">{t.start_time}–{t.end_time}, {t.coach_name || 'no coach'}</span>
                  </span>
                  <span className={`pill shrink-0 ${full ? 'bg-rose-50 text-critical' : 'bg-msr-50 text-msr-700'}`}>
                    {t.student_count}/{t.capacity}{full ? ' full' : ''}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}
