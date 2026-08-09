import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, secsToTime, shortDate } from '../api';
import { Loading, Empty, useToast, PageHead } from '../components.jsx';
import { IconTrophy } from '../icons.jsx';

export default function Performance() {
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [event, setEvent] = useState('');
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
    api.get(`/reports/performance?event=${encodeURIComponent(event)}`).then(setData).catch(e => toast(e.message, 'error'));
  }, [event, toast]);

  return (
    <div className="space-y-4">
      <PageHead title="Performance" sub="Latest recorded result per student — who is ready for the physical test" />

      {events.length === 0 ? (
        <Empty icon={<IconTrophy className="h-6 w-6" />} title="No test records yet"
          hint="Open a student and use the Performance tab to record a timing or distance." />
      ) : (
        <>
          <select className="input" value={event} onChange={e => setEvent(e.target.value)}>
            {events.map(e => <option key={e}>{e}</option>)}
          </select>

          {!data ? <Loading rows={8} /> : (
            <div className="card overflow-hidden">
              <p className="border-b border-ink-200 px-4 py-3 text-sm text-ink-500">
                {data.lower_is_better ? 'Fastest first' : 'Longest first'} · {data.rows.length} students
              </p>
              <div className="divide-y divide-ink-100">
                {data.rows.map((r, i) => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                      i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-ink-100 text-ink-500'}`}>{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <Link to={`/app/students/${r.id}`} className="truncate font-semibold text-msr-700 hover:underline">{r.name}</Link>
                      <p className="truncate text-xs text-ink-500">{r.batch_name || 'No batch'} · {shortDate(r.date)}</p>
                    </div>
                    <p className="shrink-0 font-bold">
                      {r.unit === 'sec' ? secsToTime(r.value) : `${r.value} ${r.unit}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
