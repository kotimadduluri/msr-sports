import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api, todayISO, secsToTime } from '../api';
import { Loading, Empty, useToast, PageHead } from '../components.jsx';
import { IconCheck, IconTimer, IconAlert } from '../icons.jsx';
import { EVENTS, unitFor, unitLabel, READINESS } from '../events.js';

/* Test day: one event, one batch, results entered straight down the roster —
   the roll-call pattern applied to timings. A stopwatch rides along for track
   events so the coach can capture each finisher with one tap. */

function useStopwatch() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(0);
  const rafRef = useRef();

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      setElapsed((performance.now() - startRef.current) / 1000);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running]);

  return {
    running, elapsed,
    start: () => { startRef.current = performance.now() - elapsed * 1000; setRunning(true); },
    stop: () => setRunning(false),
    reset: () => { setRunning(false); setElapsed(0); }
  };
}

export default function TestDay() {
  const toast = useToast();
  const [batches, setBatches] = useState([]);
  const [benchmarks, setBenchmarks] = useState([]);
  const [batchId, setBatchId] = useState('');
  const [event, setEvent] = useState(EVENTS[0]);
  const [date, setDate] = useState(todayISO());
  const [rows, setRows] = useState(null);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const watch = useStopwatch();
  const unit = unitFor(event);

  useEffect(() => {
    api.get('/batches').then(bs => {
      setBatches(bs);
      if (bs.length) setBatchId(String(bs[0].id));
    }).catch(e => toast(e.message, 'error'));
    api.get('/benchmarks').then(setBenchmarks).catch(() => {});
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!batchId) return;
    setRows(null); setValues({});
    api.get(`/attendance/sheet?batch_id=${batchId}&date=${date}`)
      .then(d => setRows(d.rows))
      .catch(e => toast(e.message, 'error'));
  }, [batchId, date]); // eslint-disable-line

  /* strictest applicable cut-off per gender for the chosen event */
  const targetFor = useMemo(() => {
    const per = {};
    for (const g of ['M', 'F']) {
      const list = benchmarks
        .filter(b => b.event === event && b.gender === g && b.unit === unit)
        .sort((a, b) => unit === 'sec' ? a.value - b.value : b.value - a.value);
      per[g] = list[0] || null;
    }
    return per;
  }, [benchmarks, event, unit]);

  const statusOf = (value, target) => {
    if (!target || !isFinite(value) || value <= 0) return null;
    if (unit === 'sec' ? value <= target.value : value >= target.value) return 'ready';
    return (unit === 'sec' ? value <= target.value * 1.1 : value >= target.value * 0.9) ? 'borderline' : 'at-risk';
  };

  const entries = rows ? rows
    .map(r => ({ student_id: r.student_id, value: Number(values[r.student_id]) }))
    .filter(e => isFinite(e.value) && e.value > 0) : [];

  async function save() {
    setSaving(true);
    try {
      const res = await api.post('/students/tests/bulk', { event, unit, date, entries });
      toast(`Saved ${res.saved} results for ${event}`);
      setValues({});
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  }

  const fmtTarget = t => t ? (unit === 'sec' ? `≤ ${secsToTime(t.value)}` : `≥ ${t.value} ${unit}`) : null;

  return (
    <div className="space-y-4">
      <PageHead title="Test day" sub="Pick the event, run the trial, enter every result down one list" />

      <div className="card grid gap-2 p-3 sm:grid-cols-3">
        <select className="input" value={event} aria-label="Event" onChange={e => { setEvent(e.target.value); setValues({}); }}>
          {EVENTS.map(e => <option key={e}>{e}</option>)}
        </select>
        <select className="input" value={batchId} aria-label="Batch" onChange={e => setBatchId(e.target.value)}>
          {batches.map(b => <option key={b.id} value={b.id}>{b.name} — {b.start_time} ({b.student_count})</option>)}
        </select>
        <input type="date" className="input tnum" value={date} max={todayISO()} aria-label="Date"
          onChange={e => setDate(e.target.value)} />
      </div>

      {(targetFor.M || targetFor.F) && (
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-msr-50 px-4 py-2.5 text-sm text-msr-800">
          <span className="font-semibold">Cut-off for {event}:</span>
          {targetFor.M && <span>Men {fmtTarget(targetFor.M)} <span className="text-msr-500">({targetFor.M.exam})</span></span>}
          {targetFor.F && <span>Women {fmtTarget(targetFor.F)} <span className="text-msr-500">({targetFor.F.exam})</span></span>}
        </p>
      )}

      {unit === 'sec' && (
        <div className="card flex items-center justify-between gap-3 p-3">
          <p className="flex items-center gap-2.5 font-display text-3xl font-bold tabular-nums text-ink-900">
            <IconTimer className="h-5 w-5 text-msr-700" /> {secsToTime(watch.elapsed)}
          </p>
          <div className="flex gap-2">
            {!watch.running
              ? <button onClick={watch.start} className="btn-primary btn-sm">{watch.elapsed ? 'Resume' : 'Start'}</button>
              : <button onClick={watch.stop} className="btn-accent btn-sm">Stop</button>}
            <button onClick={watch.reset} className="btn-ghost btn-sm">Reset</button>
          </div>
        </div>
      )}

      {!rows ? <Loading rows={7} /> : rows.length === 0 ? (
        <Empty title="No students in this batch" hint="Assign students to the batch from the Students screen." />
      ) : (
        <>
          <ul className="card divide-y divide-ink-100">
            {rows.map((r, i) => {
              const target = targetFor[r.gender] || null;
              const st = statusOf(Number(values[r.student_id]), target);
              return (
                <li key={r.student_id} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-ink-900">
                      <span className="mr-1.5 text-2xs font-medium tabular-nums text-ink-400">{i + 1}</span>{r.name}
                    </p>
                    <p className="flex items-center gap-2 text-2xs text-ink-400">
                      <span className="font-mono">{r.admission_no}</span>
                      {target && <span>target {fmtTarget(target)}</span>}
                      {r.availability_note && (
                        <span className="flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 font-semibold text-amber-700">
                          <IconAlert className="h-3 w-3" /> {r.availability_note}
                        </span>
                      )}
                    </p>
                  </div>
                  {st && (
                    <span className={`rounded-lg px-2 py-1 text-2xs font-bold ${READINESS[st].cls}`}>
                      {READINESS[st].label}
                    </span>
                  )}
                  {unit === 'sec' && watch.running && (
                    <button onClick={() => setValues(v => ({ ...v, [r.student_id]: watch.elapsed.toFixed(1) }))}
                      className="btn-ghost btn-sm shrink-0" aria-label={`Capture time for ${r.name}`}>
                      <IconTimer className="h-4 w-4" />
                    </button>
                  )}
                  <input className="input h-11 w-24 shrink-0 text-right tnum" inputMode="decimal"
                    placeholder={unitLabel(unit)} aria-label={`${event} result for ${r.name}`}
                    value={values[r.student_id] || ''}
                    onChange={e => setValues(v => ({ ...v, [r.student_id]: e.target.value }))} />
                </li>
              );
            })}
          </ul>

          <button onClick={save} disabled={saving || !entries.length} className="btn-primary w-full">
            <IconCheck className="h-[18px] w-[18px]" />
            {saving ? 'Saving…' : entries.length ? `Save ${entries.length} result${entries.length > 1 ? 's' : ''} — ${event}` : 'Enter results to save'}
          </button>
        </>
      )}
    </div>
  );
}
