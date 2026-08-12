import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, secsToTime, shortDate } from '../api';
import { Loading, Empty, useToast, PageHead } from '../components.jsx';
import { IconTrophy } from '../icons.jsx';
import { READINESS } from '../events.js';

/* Leaderboard turned readiness board: latest result per student, judged
   against the exam cut-off so the coach sees who clears, who is close and
   who needs the work. */
export default function Performance() {
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [event, setEvent] = useState('');
  const [exam, setExam] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/reports/events').then(list => {
      setEvents(list);
      setEvent(list[0] || '');
    }).catch(e => toast(e.message, 'error'));
  }, [toast]);

  useEffect(() => {
    if (!event) return;
    setData(null);
    const p = new URLSearchParams({ event });
    if (exam) p.set('exam', exam);
    api.get(`/reports/performance?${p}`).then(setData).catch(e => toast(e.message, 'error'));
  }, [event, exam, toast]);

  const counts = data ? ['ready', 'borderline', 'at-risk'].map(k => ({
    key: k, ...READINESS[k], n: data.rows.filter(r => r.benchmark?.status === k).length
  })) : [];

  return (
    <div className="space-y-4">
      <PageHead title="Performance" sub="Latest result per student, judged against the exam cut-off" />

      {events.length === 0 ? (
        <Empty icon={<IconTrophy className="h-6 w-6" />} title="No test records yet"
          hint="Run a Test day: pick an event and a batch, and enter every result in one list." />
      ) : (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            <select className="input" value={event} aria-label="Event" onChange={e => setEvent(e.target.value)}>
              {events.map(e => <option key={e}>{e}</option>)}
            </select>
            <select className="input" value={exam} aria-label="Exam cut-off" onChange={e => setExam(e.target.value)}>
              <option value="">Cut-off: strictest for each student</option>
              {(data?.exams || []).map(x => <option key={x} value={x}>Cut-off: {x}</option>)}
            </select>
          </div>

          {!data ? <Loading rows={8} /> : (
            <>
              {data.rows.some(r => r.benchmark) && (
                <div className="flex flex-wrap gap-1.5">
                  {counts.filter(c => c.n > 0).map(c => (
                    <span key={c.key} className={`rounded-lg px-2.5 py-1 text-2xs font-bold ${c.cls}`}>{c.label} {c.n}</span>
                  ))}
                  <Link to="/app/academy" className="pill bg-ink-100 text-ink-600 hover:bg-ink-200">Edit cut-offs</Link>
                </div>
              )}

              <div className="card overflow-hidden">
                <p className="border-b border-ink-200 px-4 py-3 text-sm text-ink-500">
                  {data.lower_is_better ? 'Fastest first' : 'Longest first'} · {data.rows.length} students
                </p>
                <div className="divide-y divide-ink-100">
                  {data.rows.map((r, i) => (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                        i < 3 ? 'bg-warn-100 text-warn-700' : 'bg-ink-100 text-ink-500'}`}>{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <Link to={`/app/students/${r.id}`} className="truncate font-semibold text-msr-700 hover:underline">{r.name}</Link>
                        <p className="truncate text-xs text-ink-500">
                          {r.batch_name || 'No batch'} · {shortDate(r.date)}
                          {r.benchmark && <> · target {r.benchmark.unit === 'sec' ? `≤ ${secsToTime(r.benchmark.target)}` : `≥ ${r.benchmark.target} ${r.benchmark.unit === 'count' ? '' : r.benchmark.unit}`} ({r.benchmark.exam})</>}
                        </p>
                      </div>
                      {r.benchmark && (
                        <span className={`shrink-0 rounded-lg px-2 py-1 text-2xs font-bold ${READINESS[r.benchmark.status].cls}`}>
                          {READINESS[r.benchmark.status].label}
                        </span>
                      )}
                      <p className="shrink-0 font-bold tabular-nums">
                        {r.unit === 'sec' ? secsToTime(r.value) : `${r.value} ${r.unit}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
