import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, rupees, shortDate, getUser } from '../api';
import { Stat, Loading, PageHead } from '../components.jsx';
import { TrendLine, Columns, Spark } from '../charts.jsx';
import { IconStudents, IconCheck, IconRupee, IconAlert, IconChevronRight, IconClock } from '../icons.jsx';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export default function Dashboard() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const user = getUser();

  useEffect(() => { api.get('/reports/dashboard').then(setD).catch(e => setErr(e.message)); }, []);

  if (err) return <div className="card p-5 text-critical">{err}</div>;
  if (!d) return (
    <div className="space-y-4">
      <div className="skeleton h-9 w-64" />
      <Loading kind="stats" />
      <Loading rows={4} />
    </div>
  );

  const trend = d.trend.map(t => ({
    label: shortDate(t.date).slice(0, 6),
    full: new Date(t.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
    value: t.marked ? Math.round(t.present / t.marked * 100) : 0
  }));
  const collection = (d.collection || []).map(c => ({
    label: new Date(c.period + '-01').toLocaleDateString('en-IN', { month: 'short' }),
    value: c.amount
  }));

  const att = d.attendance_today;
  const pending = d.batches.filter(b => !b.marked).length;

  return (
    <div className="space-y-5">
      <PageHead
        title={`${greeting()}, ${(user?.name || 'there').split(' ')[0]}`}
        sub={new Date(d.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        actions={pending > 0 && (
          <Link to="/app/attendance" className="btn-accent">
            <IconCheck className="h-[18px] w-[18px]" />
            Mark attendance ({pending})
          </Link>
        )}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Active students" value={d.students.active} icon={<IconStudents />}
          sub={`${d.students.men} men · ${d.students.women} women`} />
        <Stat label="Attendance today" icon={<IconCheck />}
          value={att.pct === null ? '—' : att.pct + '%'}
          tone={att.pct === null ? 'warn' : att.pct >= 80 ? 'good' : 'warn'}
          sub={att.marked ? `${att.present} of ${att.marked} present` : 'Roll call not taken yet'}
          spark={trend.length > 3 && <Spark values={trend.map(t => t.value)} />} />
        <Stat label="Collected this month" value={rupees(d.fees.collected_this_month)} icon={<IconRupee />} tone="good"
          sub={`${rupees(d.fees.collected_today)} today`} />
        <Stat label="Fees outstanding" value={rupees(d.fees.total_outstanding)} icon={<IconAlert />}
          tone={d.fees.total_outstanding > 0 ? 'bad' : 'good'}
          sub={`${d.fees.overdue_count} bills past due`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="card p-4 sm:p-5">
          <header className="mb-1 flex items-baseline justify-between">
            <h2 className="font-bold text-ink-900">Attendance rate</h2>
            <span className="text-2xs font-semibold uppercase tracking-wider text-ink-500">last 14 days</span>
          </header>
          <p className="mb-3 text-sm text-ink-500">Share of marked students who turned up.</p>
          <TrendLine data={trend} />
        </section>

        <section className="card p-4 sm:p-5">
          <header className="mb-1 flex items-baseline justify-between">
            <h2 className="font-bold text-ink-900">Fee collection</h2>
            <span className="text-2xs font-semibold uppercase tracking-wider text-ink-500">
              last {collection.length} months
            </span>
          </header>
          <p className="mb-3 text-sm text-ink-500">Money actually received each month.</p>
          <Columns data={collection} format={rupees} />
          {(d.fees.collected_hostel > 0 || d.fees.due_hostel > 0) && (
            <p className="mt-3 border-t border-ink-100 pt-3 text-sm text-ink-600">
              Training <strong>{rupees(d.fees.collected_training || 0)}</strong> collected,{' '}
              <span className="font-semibold">{rupees(d.fees.due_training || 0)}</span> pending ·{' '}
              Hostel <strong>{rupees(d.fees.collected_hostel || 0)}</strong> collected,{' '}
              <span className="font-semibold">{rupees(d.fees.due_hostel || 0)}</span> pending
            </p>
          )}
          {d.fees.spent_this_month !== undefined && (
            <p className="mt-3 border-t border-ink-100 pt-3 text-sm text-ink-600">
              This month: collected <strong>{rupees(d.fees.collected_this_month)}</strong> · spent{' '}
              <Link to="/app/expenses" className="font-semibold text-msr-700 hover:underline">{rupees(d.fees.spent_this_month)}</Link> ·{' '}
              <span className={`font-bold ${d.fees.profit_this_month >= 0 ? 'text-good' : 'text-critical'}`}>
                {d.fees.profit_this_month >= 0 ? 'profit' : 'loss'} {rupees(Math.abs(d.fees.profit_this_month))}
              </span>
            </p>
          )}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card overflow-hidden lg:col-span-2">
          <header className="flex items-center justify-between border-b border-ink-100 px-4 py-3.5">
            <h2 className="font-bold text-ink-900">Today's batches</h2>
            <Link to="/app/attendance" className="flex items-center gap-1 text-sm font-semibold text-msr-700 hover:text-msr-900">
              Roll call <IconChevronRight className="h-4 w-4" />
            </Link>
          </header>
          <ul className="divide-y divide-ink-100">
            {d.batches.map(b => (
              <li key={b.id}>
                <Link to={`/app/attendance?batch=${b.id}`} className="row-hover flex items-center justify-between gap-3 px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink-900">{b.name}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-500">
                      <IconClock className="h-3.5 w-3.5" />{b.start_time}–{b.end_time} · {b.students} students
                    </p>
                  </div>
                  {b.marked > 0
                    ? <span className="pill bg-emerald-50 text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Marked</span>
                    : <span className="pill bg-amber-50 text-amber-700"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />Pending</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card flex flex-col p-5">
          <h2 className="font-bold text-ink-900">New enquiries</h2>
          <p className="mt-4 text-5xl font-extrabold leading-none text-msr-800">{d.enquiries.new || 0}</p>
          <p className="mt-2 text-sm text-ink-500">{d.enquiries.week || 0} came in this week</p>
          <Link to="/app/enquiries" className="btn-ghost mt-4">Follow up</Link>
          <div className="mt-auto border-t border-ink-100 pt-4">
            <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">Joined in last 30 days</p>
            <p className="mt-1 text-2xl font-bold text-ink-900">{d.students.joined_30d}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
