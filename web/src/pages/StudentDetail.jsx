import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, rupees, shortDate, secsToTime, waLink, todayISO } from '../api';
import { Loading, Badge, Modal, Field, Stat, useToast, Segmented } from '../components.jsx';
import { HeatStrip } from '../charts.jsx';
import { IconChevronLeft, IconPhone, IconWhatsapp, IconRupee, IconPlus } from '../icons.jsx';

const EVENTS = ['1600m Run', '800m Run', '100m Sprint', 'Long Jump', 'Shot Put (7.26kg)', 'Shot Put (4kg)', 'High Jump', 'Pull-ups'];

export default function StudentDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [s, setS] = useState(null);
  const [tab, setTab] = useState('overview');
  const [payOpen, setPayOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [pay, setPay] = useState({ amount: '', mode: 'cash', invoice_id: '', reference: '' });
  const [test, setTest] = useState({ event: EVENTS[0], value: '', unit: 'sec', date: todayISO() });

  const load = useCallback(() => api.get(`/students/${id}`).then(setS).catch(e => toast(e.message, 'error')), [id, toast]);
  useEffect(() => { load(); }, [load]);

  if (!s) return <Loading rows={6} />;

  const due = s.invoices.filter(i => i.status === 'unpaid' || i.status === 'partial');

  async function savePayment(e) {
    e.preventDefault();
    try {
      const res = await api.post('/fees/payments', {
        student_id: s.id, amount: Number(pay.amount), mode: pay.mode,
        invoice_id: pay.invoice_id ? Number(pay.invoice_id) : null, reference: pay.reference || null
      });
      toast(`Receipt ${res.receipt_no} saved`);
      setPayOpen(false); setPay({ amount: '', mode: 'cash', invoice_id: '', reference: '' }); load();
    } catch (err) { toast(err.message, 'error'); }
  }

  async function saveTest(e) {
    e.preventDefault();
    try {
      await api.post(`/students/${s.id}/tests`, { ...test, value: Number(test.value) });
      toast('Performance recorded');
      setTestOpen(false); setTest({ ...test, value: '' }); load();
    } catch (err) { toast(err.message, 'error'); }
  }

  const reminder = `Namaste ${s.guardian_name || s.name}, this is MSR Sports Academy, Chirala. ` +
    `Fee balance for ${s.name} (${s.admission_no}) is ${rupees(s.balance)}. Kindly pay at the office or by UPI. Thank you.`;

  return (
    <div className="space-y-4">
      <Link to="/app/students" className="inline-flex items-center gap-1 text-sm font-semibold text-msr-700 hover:text-msr-900">
        <IconChevronLeft className="h-4 w-4" /> All students
      </Link>

      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[1.7rem] font-extrabold leading-tight text-ink-900 sm:text-3xl">{s.name}</h1>
            <p className="text-sm text-ink-500">
              {s.admission_no} · {s.gender === 'F' ? 'Female' : 'Male'} · Joined {shortDate(s.join_date)}
            </p>
            <p className="mt-1 text-sm">{s.course_name || 'No programme'} · {s.batch_name || 'No batch'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge status={s.status} />
            {s.phone && <a href={`tel:${s.phone}`} className="btn-ghost"><IconPhone className="h-[18px] w-[18px]" /> Call</a>}
            {s.balance > 0 && (
              <a href={waLink(s.guardian_phone || s.phone, reminder)} target="_blank" rel="noreferrer" className="btn-ghost">
                <IconWhatsapp className="h-[18px] w-[18px] text-emerald-600" /> Remind
              </a>
            )}
            <button onClick={() => setPayOpen(true)} className="btn-primary"><IconRupee className="h-[18px] w-[18px]" /> Record payment</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Attendance" value={s.attendance_pct === null ? '—' : s.attendance_pct + '%'}
          tone={s.attendance_pct >= 80 ? 'good' : s.attendance_pct >= 60 ? 'warn' : 'bad'} sub="all time" />
        <Stat label="Fee balance" value={rupees(s.balance)} tone={s.balance > 0 ? 'bad' : 'good'}
          sub={due.length ? `${due.length} bills pending` : 'all clear'} />
        <Stat label="Height" value={s.height_cm ? `${s.height_cm} cm` : '—'} sub={s.weight_kg ? `${s.weight_kg} kg` : ''} />
        <Stat label="Chest" value={s.chest_cm ? `${s.chest_cm} cm` : '—'}
          sub={s.chest_expanded_cm ? `${s.chest_expanded_cm} cm expanded` : ''} />
      </div>

      <Segmented value={tab} onChange={setTab}
        options={[['overview', 'Overview'], ['attendance', 'Attendance'], ['fees', 'Fees'], ['performance', 'Performance']]} />

      {tab === 'overview' && (
        <div className="card grid gap-4 p-5 sm:grid-cols-2">
          {[
            ['Phone', s.phone], ['Date of birth', s.dob ? shortDate(s.dob) : null],
            ['Guardian', s.guardian_name], ['Guardian phone', s.guardian_phone],
            ['Village', s.village], ['Address', s.address],
            ['Batch timing', s.start_time ? `${s.start_time} – ${s.end_time}` : null],
            ['Notes', s.notes]
          ].map(([k, v]) => (
            <div key={k}>
              <p className="label">{k}</p>
              <p className="text-sm">{v || '—'}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'attendance' && (
        <div className="card p-4">
          <h2 className="font-bold text-ink-900">Last 60 sessions</h2>
          <p className="mb-4 mt-1 text-sm text-ink-500">Green present · amber late · blue leave · red absent</p>
          {s.attendance.length === 0
            ? <p className="text-sm text-ink-500">Nothing recorded yet.</p>
            : <HeatStrip days={s.attendance} />}
        </div>
      )}

      {tab === 'fees' && (
        <div className="space-y-3">
          <div className="card overflow-hidden">
            <p className="border-b border-ink-200 px-4 py-3 font-bold">Bills</p>
            {s.invoices.length === 0 ? <p className="p-4 text-sm text-ink-500">No bills yet.</p> : (
              <div className="divide-y divide-ink-100">
                {s.invoices.map(i => (
                  <div key={i.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="font-semibold">{i.period}</p>
                      <p className="text-xs text-ink-500">{i.description} · due {shortDate(i.due_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{rupees(i.amount)}</p>
                      <Badge status={i.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card overflow-hidden">
            <p className="border-b border-ink-200 px-4 py-3 font-bold">Payments</p>
            {s.payments.length === 0 ? <p className="p-4 text-sm text-ink-500">No payments yet.</p> : (
              <div className="divide-y divide-ink-100">
                {s.payments.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="font-mono text-xs text-ink-500">{p.receipt_no}</p>
                      <p className="text-sm">{shortDate(p.paid_on)} · {p.mode}</p>
                    </div>
                    <p className="font-semibold text-emerald-700">{rupees(p.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'performance' && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3">
            <p className="font-bold">Physical test records</p>
            <button onClick={() => setTestOpen(true)} className="btn-primary btn-sm"><IconPlus className="h-4 w-4" /> Record</button>
          </div>
          {s.tests.length === 0 ? <p className="p-4 text-sm text-ink-500">No timings recorded yet.</p> : (
            <div className="divide-y divide-ink-100">
              {s.tests.map(t => (
                <div key={t.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-semibold">{t.event}</p>
                    <p className="text-xs text-ink-500">{shortDate(t.date)}</p>
                  </div>
                  <p className="font-semibold">{t.unit === 'sec' ? secsToTime(t.value) : `${t.value} ${t.unit}`}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Record payment">
        <form onSubmit={savePayment} className="space-y-3">
          <Field label="Apply to bill">
            <select className="input" value={pay.invoice_id}
              onChange={e => {
                const inv = s.invoices.find(i => String(i.id) === e.target.value);
                setPay({ ...pay, invoice_id: e.target.value, amount: inv ? String(inv.amount) : pay.amount });
              }}>
              <option value="">General payment (no bill)</option>
              {due.map(i => <option key={i.id} value={i.id}>{i.period} — {rupees(i.amount)} ({i.status})</option>)}
            </select>
          </Field>
          <Field label="Amount (₹)">
            <input className="input" inputMode="decimal" required value={pay.amount}
              onChange={e => setPay({ ...pay, amount: e.target.value })} />
          </Field>
          <Field label="Mode">
            <select className="input" value={pay.mode} onChange={e => setPay({ ...pay, mode: e.target.value })}>
              {['cash', 'upi', 'card', 'bank'].map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
            </select>
          </Field>
          <Field label="Reference / UPI txn (optional)">
            <input className="input" value={pay.reference} onChange={e => setPay({ ...pay, reference: e.target.value })} />
          </Field>
          <button className="btn-primary w-full">Save & generate receipt</button>
        </form>
      </Modal>

      <Modal open={testOpen} onClose={() => setTestOpen(false)} title="Record physical test">
        <form onSubmit={saveTest} className="space-y-3">
          <Field label="Event">
            <select className="input" value={test.event}
              onChange={e => setTest({ ...test, event: e.target.value, unit: /Run|Sprint/.test(e.target.value) ? 'sec' : /Pull/.test(e.target.value) ? 'count' : 'm' })}>
              {EVENTS.map(e => <option key={e}>{e}</option>)}
            </select>
          </Field>
          <Field label={`Result (${test.unit === 'sec' ? 'seconds' : test.unit === 'm' ? 'metres' : 'count'})`}>
            <input className="input" inputMode="decimal" required value={test.value}
              onChange={e => setTest({ ...test, value: e.target.value })} />
          </Field>
          <Field label="Date">
            <input type="date" className="input" value={test.date} onChange={e => setTest({ ...test, date: e.target.value })} />
          </Field>
          <button className="btn-primary w-full">Save record</button>
        </form>
      </Modal>
    </div>
  );
}
