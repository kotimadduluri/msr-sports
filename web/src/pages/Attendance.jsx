import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api, todayISO, monthISO, waLink } from '../api';
import { Loading, Empty, useToast, PageHead, Segmented } from '../components.jsx';
import { IconCheck, IconWhatsapp, IconAlert } from '../icons.jsx';
import { msg, MsgLang } from '../waTemplates.jsx';

/* Offline tolerance: the 5:30 AM ground has patchy signal. A roll call that
   fails to reach the server is queued on the phone and replayed the moment
   the network returns (or next time the screen opens). */
const QUEUE_KEY = 'msr.pendingAttendance';
const readQueue = () => { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; } };
const writeQueue = list => localStorage.setItem(QUEUE_KEY, JSON.stringify(list));
const isNetworkError = e => e instanceof TypeError || /fetch|network|load failed/i.test(e?.message || '');

async function flushQueue() {
  const queue = readQueue();
  if (!queue.length) return 0;
  let sent = 0;
  const remaining = [];
  for (const item of queue) {
    try { await api.post('/attendance/mark', item); sent++; }
    catch (e) { if (isNetworkError(e)) remaining.push(item); /* real errors: drop, they'd never succeed */ }
  }
  writeQueue(remaining);
  return sent;
}

/* Four states, always in the same order, always the same colour.
   Buttons are 44px so they work with a thumb on a cold morning. */
const STATUSES = [
  { key: 'present', label: 'P', full: 'Present', on: 'bg-emerald-600 text-white shadow-card' },
  { key: 'absent', label: 'A', full: 'Absent', on: 'bg-rose-600 text-white shadow-card' },
  { key: 'late', label: 'L', full: 'Late', on: 'bg-amber-500 text-white shadow-card' },
  { key: 'leave', label: 'Lv', full: 'Leave', on: 'bg-sky-600 text-white shadow-card' }
];

export default function Attendance() {
  const toast = useToast();
  const [params] = useSearchParams();
  const [batches, setBatches] = useState([]);
  const [batchId, setBatchId] = useState(params.get('batch') || '');
  const [date, setDate] = useState(todayISO());
  const [rows, setRows] = useState(null);
  const [marks, setMarks] = useState({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('rollcall');
  const [monthly, setMonthly] = useState(null);
  const [absentees, setAbsentees] = useState(null);
  const [pending, setPending] = useState(() => readQueue().length);
  const [session, setSession] = useState('');
  const [sessionSaved, setSessionSaved] = useState(false);

  /* replay any queued roll calls when we come back online */
  useEffect(() => {
    const flush = () => flushQueue().then(n => {
      setPending(readQueue().length);
      if (n) toast(`Synced ${n} saved roll call${n > 1 ? 's' : ''} from this phone`);
    });
    flush();
    window.addEventListener('online', flush);
    return () => window.removeEventListener('online', flush);
  }, [toast]);

  useEffect(() => {
    api.get('/batches').then(bs => {
      setBatches(bs);
      if (!batchId && bs.length) setBatchId(String(bs[0].id));
    }).catch(e => toast(e.message, 'error'));
  }, []); // eslint-disable-line

  const loadSheet = useCallback(() => {
    if (!batchId) return;
    setRows(null); setDirty(false);
    api.get(`/attendance/sheet?batch_id=${batchId}&date=${date}`)
      .then(d => {
        setRows(d.rows);
        setMarks(Object.fromEntries(d.rows.map(r => [r.student_id, r.status || 'present'])));
      })
      .catch(e => toast(e.message, 'error'));
    setSession(''); setSessionSaved(false);
    api.get(`/sessions?batch_id=${batchId}&date=${date}`)
      .then(sn => { if (sn?.note) { setSession(sn.note); setSessionSaved(true); } })
      .catch(() => {});
  }, [batchId, date, toast]);

  useEffect(() => { if (view === 'rollcall') loadSheet(); }, [view, loadSheet]);
  useEffect(() => {
    if (view === 'monthly' && batchId) {
      setMonthly(null);
      api.get(`/attendance/monthly?batch_id=${batchId}&month=${monthISO()}`).then(setMonthly).catch(() => {});
    }
    if (view === 'absentees') {
      setAbsentees(null);
      api.get('/attendance/absentees?days=7&min=3').then(setAbsentees).catch(() => {});
    }
  }, [view, batchId]);

  async function save() {
    setSaving(true);
    const payload = {
      batch_id: Number(batchId), date,
      entries: Object.entries(marks).map(([student_id, status]) => ({ student_id: Number(student_id), status }))
    };
    try {
      const res = await api.post('/attendance/mark', payload);
      toast(`Saved — ${res.saved} students marked`);
      setDirty(false);
    } catch (e) {
      if (isNetworkError(e)) {
        writeQueue([...readQueue().filter(x => !(x.batch_id === payload.batch_id && x.date === payload.date)), payload]);
        setPending(readQueue().length);
        setDirty(false);
        toast('No signal — saved on this phone, will sync when the network returns');
      } else toast(e.message, 'error');
    }
    finally { setSaving(false); }
  }

  async function saveSession() {
    try {
      await api.post('/sessions', { batch_id: Number(batchId), date, note: session });
      setSessionSaved(true);
      toast('Session note saved');
    } catch (e) { toast(e.message, 'error'); }
  }

  const mark = (id, k) => { setMarks(m => ({ ...m, [id]: k })); setDirty(true); };
  const setAll = k => { setMarks(Object.fromEntries(rows.map(r => [r.student_id, k]))); setDirty(true); };
  const counts = rows ? STATUSES.map(s => ({ ...s, n: rows.filter(r => marks[r.student_id] === s.key).length })) : [];
  const batch = batches.find(b => String(b.id) === String(batchId));

  return (
    <div className="space-y-4">
      <PageHead title="Attendance" sub="Tap a status against each name, then save once for the whole ground" />

      {pending > 0 && (
        <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800">
          <IconAlert className="h-4 w-4 shrink-0" />
          {pending} roll call{pending > 1 ? 's' : ''} saved on this phone — will sync when the network returns
        </p>
      )}

      <Segmented value={view} onChange={setView}
        options={[['rollcall', 'Roll call'], ['monthly', 'Month view'], ['absentees', 'Missing students']]} />

      {view !== 'absentees' && (
        <div className="card grid gap-2 p-3 sm:grid-cols-2">
          <select className="input" value={batchId} aria-label="Batch" onChange={e => setBatchId(e.target.value)}>
            {batches.map(b => <option key={b.id} value={b.id}>{b.name} — {b.start_time} ({b.student_count})</option>)}
          </select>
          {view === 'rollcall' && (
            <input type="date" className="input tnum" value={date} max={todayISO()} aria-label="Date"
              onChange={e => setDate(e.target.value)} />
          )}
        </div>
      )}

      {view === 'rollcall' && (!rows ? <Loading rows={7} /> : rows.length === 0 ? (
        <Empty title="No students in this batch yet"
          hint={`Assign students to ${batch?.name || 'this batch'} from the Students screen.`}
          action={<Link to="/app/students" className="btn-ghost">Open students</Link>} />
      ) : (
        <>
          {/* the tally + save stay in view while you scroll the list */}
          <div className="card sticky top-[57px] z-20 flex flex-wrap items-center justify-between gap-2 p-3 lg:top-3">
            <div className="flex flex-wrap gap-1.5">
              {counts.map(c => (
                <span key={c.key} className={`rounded-lg px-2.5 py-1 text-2xs font-bold ${c.on}`}>
                  {c.label} {c.n}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAll('present')} className="btn-ghost btn-sm">All present</button>
              <button onClick={save} disabled={saving || !dirty}
                className={dirty || saving ? 'btn-primary btn-sm' : 'btn-quiet btn-sm'}>
                {saving ? 'Saving…' : dirty ? 'Save' : 'Saved ✓'}
              </button>
            </div>
          </div>

          <ul className="card divide-y divide-ink-100">
            {rows.map((r, i) => (
              <li key={r.student_id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-ink-900">
                    <span className="mr-1.5 text-2xs font-medium tabular-nums text-ink-400">{i + 1}</span>{r.name}
                  </p>
                  <p className="flex items-center gap-1.5 text-2xs text-ink-400">
                    <span className="font-mono">{r.admission_no}</span>
                    {r.availability_note && (
                      <span className="truncate rounded-md bg-amber-50 px-1.5 py-0.5 font-semibold text-amber-700">
                        {r.availability_note}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1" role="group" aria-label={`Attendance for ${r.name}`}>
                  {STATUSES.map(s => (
                    <button key={s.key} onClick={() => mark(r.student_id, s.key)}
                      aria-label={s.full} aria-pressed={marks[r.student_id] === s.key}
                      className={`h-11 w-11 rounded-xl text-[13px] font-bold transition ${
                        marks[r.student_id] === s.key ? s.on : 'bg-ink-100 text-ink-500 hover:bg-ink-200'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>

          <button onClick={save} disabled={saving || !dirty} className="btn-primary w-full">
            <IconCheck className="h-[18px] w-[18px]" />
            {saving ? 'Saving…' : dirty ? `Save attendance for ${rows.length} students` : 'All changes saved'}
          </button>

          {/* what the session actually was — so a substitute coach can pick up tomorrow */}
          <div className="card flex gap-2 p-3">
            <input className="input flex-1" placeholder="Session note — e.g. 400m repeats ×6, shot put drills"
              value={session} onChange={e => { setSession(e.target.value); setSessionSaved(false); }} />
            <button onClick={saveSession} disabled={!session.trim() || sessionSaved}
              className={sessionSaved ? 'btn-quiet' : 'btn-ghost'}>
              {sessionSaved ? 'Noted ✓' : 'Save note'}
            </button>
          </div>
        </>
      ))}

      {view === 'monthly' && (!monthly ? <Loading rows={8} /> : (
        <div className="card overflow-hidden">
          <p className="border-b border-ink-100 px-4 py-3 text-sm text-ink-500">
            {new Date(monthly.month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} · {monthly.students.length} students
          </p>
          <ul className="divide-y divide-ink-100">
            {monthly.students.map(s => (
              <li key={s.student_id} className="flex items-center gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink-900">{s.name}</p>
                  <p className="text-xs text-ink-500">{s.present} present of {s.total} marked</p>
                </div>
                <div className="w-24 shrink-0">
                  <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
                    <div className={`h-full rounded-full ${s.pct >= 80 ? 'bg-emerald-500' : s.pct >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${s.pct || 0}%` }} />
                  </div>
                </div>
                <p className={`w-11 shrink-0 text-right font-bold tabular-nums ${
                  s.pct >= 80 ? 'text-emerald-600' : s.pct >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {s.pct === null ? '—' : s.pct + '%'}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {view === 'absentees' && (!absentees ? <Loading rows={5} /> : absentees.length === 0 ? (
        <Empty icon={<IconCheck className="h-6 w-6" />} title="Everyone is showing up"
          hint="No student has missed three or more sessions this week." />
      ) : (
        <>
          <div className="flex items-start justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3">
            <p className="flex items-start gap-2 text-sm text-amber-800">
              <IconAlert className="mt-px h-4 w-4 shrink-0" />
              These students missed three or more sessions this week. A message to the parent usually brings them back.
            </p>
            <MsgLang className="shrink-0" />
          </div>
          <ul className="card divide-y divide-ink-100">
            {absentees.map(a => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <Link to={`/app/students/${a.id}`} className="min-w-0">
                  <p className="truncate font-semibold text-ink-900">{a.name}</p>
                  <p className="truncate text-xs text-ink-500">{a.batch_name} · {a.absents} absents this week</p>
                </Link>
                <a className="btn-ghost btn-sm shrink-0" target="_blank" rel="noreferrer"
                  href={waLink(a.guardian_phone || a.phone, msg('absence', a, a.absents))}>
                  <IconWhatsapp className="h-4 w-4 text-emerald-600" /> Message
                </a>
              </li>
            ))}
          </ul>
        </>
      ))}
    </div>
  );
}
