import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, rupees, shortDate, secsToTime, waLink, todayISO, monthISO } from '../api';
import { Loading, Badge, Modal, Field, Stat, useToast, Segmented, PrintArea } from '../components.jsx';
import { HeatStrip } from '../charts.jsx';
import { IconChevronLeft, IconPhone, IconWhatsapp, IconRupee, IconPlus, IconSpark, IconSettings, IconShare } from '../icons.jsx';
import { EVENTS, unitFor, READINESS } from '../events.js';
import { msg, MsgLang } from '../waTemplates.jsx';
import { buildProgressCard, shareProgressCard } from '../progressCard.js';

const STATUSES = ['active', 'on-hold', 'dropped', 'passed-out'];

const fmtVal = (value, unit) => unit === 'sec' ? secsToTime(value) : unit === 'm' ? `${value} m` : value;
const fmtTarget = t => t.unit === 'sec' ? `≤ ${secsToTime(t.target)}` : `≥ ${t.target} ${t.unit === 'count' ? '' : t.unit}`;

export default function StudentDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [s, setS] = useState(null);
  const [upi, setUpi] = useState('');
  const [tab, setTab] = useState('overview');
  const [payOpen, setPayOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [card, setCard] = useState(null);
  const [built, setBuilt] = useState(null);   // { dataUrl, blob, filename } from progressCard.js
  const [pay, setPay] = useState({ amount: '', mode: 'cash', invoice_id: '', reference: '' });
  const [test, setTest] = useState({ event: EVENTS[0], value: '', unit: 'sec', date: todayISO() });
  const [edit, setEdit] = useState({});
  const [batchList, setBatchList] = useState([]);

  const load = useCallback(() => api.get(`/students/${id}`).then(setS).catch(e => toast(e.message, 'error')), [id, toast]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/settings').then(a => setUpi(a.upi_id || '')).catch(() => {}); }, []);

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

  function openEdit() {
    setEdit({
      status: s.status, leave_reason: s.leave_reason || '',
      availability_note: s.availability_note || '',
      fee_override: s.fee_override ?? '', hostel_fee: s.hostel_fee ?? '',
      target_exam: s.target_exam || '',
      preferred_lang: s.preferred_lang || 'te', batch_id: s.batch_id ?? ''
    });
    if (!batchList.length) api.get('/batches').then(setBatchList).catch(() => {});
    setEditOpen(true);
  }

  async function saveEdit(e) {
    e.preventDefault();
    try {
      await api.patch(`/students/${s.id}`, {
        status: edit.status,
        leave_reason: edit.leave_reason || null,
        availability_note: edit.availability_note || null,
        fee_override: edit.fee_override === '' ? null : Number(edit.fee_override),
        hostel_fee: edit.hostel_fee === '' ? null : Number(edit.hostel_fee),
        target_exam: edit.target_exam || null,
        preferred_lang: edit.preferred_lang,
        batch_id: edit.batch_id ? Number(edit.batch_id) : null
      });
      toast('Saved');
      setEditOpen(false); load();
    } catch (err) { toast(err.message, 'error'); }
  }

  async function openCard() {
    setCard(null); setBuilt(null); setCardOpen(true);
    try {
      const data = await api.get(`/students/${s.id}/progress-card?month=${monthISO()}`);
      setCard(data);
      setBuilt(await buildProgressCard(data));   // canvas → preview image + real PDF
    } catch (err) { toast(err.message, 'error'); setCardOpen(false); }
  }

  async function sharePdf() {
    if (!built) return;
    const how = await shareProgressCard(built);
    if (how === 'downloaded') toast('PDF saved — attach it on WhatsApp or anywhere');
  }

  const reminder = () => msg('feeReminder', s, s.balance, null, upi);

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
            {s.availability_note && (
              <p className="mt-1.5 inline-block rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                {s.availability_note}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge status={s.status} />
            {s.phone && <a href={`tel:${s.phone}`} className="btn-ghost"><IconPhone className="h-[18px] w-[18px]" /> Call</a>}
            {s.balance > 0 && (
              <a href={waLink(s.guardian_phone || s.phone, reminder())} target="_blank" rel="noreferrer" className="btn-ghost">
                <IconWhatsapp className="h-[18px] w-[18px] text-emerald-600" /> Remind
              </a>
            )}
            <button onClick={openCard} className="btn-ghost"><IconSpark className="h-[18px] w-[18px]" /> Progress card</button>
            <button onClick={openEdit} className="btn-ghost" aria-label="Edit student"><IconSettings className="h-[18px] w-[18px]" /></button>
            <button onClick={() => setPayOpen(true)} className="btn-primary"><IconRupee className="h-[18px] w-[18px]" /> Record payment</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Attendance" value={s.attendance_pct === null ? '—' : s.attendance_pct + '%'}
          tone={s.attendance_pct >= 80 ? 'good' : s.attendance_pct >= 60 ? 'warn' : 'bad'} sub="all time" />
        <Stat label="Fee balance" value={rupees(s.balance)} tone={s.balance > 0 ? 'bad' : 'good'}
          sub={due.length ? `${due.length} bills pending` : s.fee_override ? `concession ${rupees(s.fee_override)}/mo` : 'all clear'} />
        <Stat label="Height" value={s.height_cm ? `${s.height_cm} cm` : '—'} sub={s.weight_kg ? `${s.weight_kg} kg` : ''} />
        <Stat label="Chest" value={s.chest_cm ? `${s.chest_cm} cm` : '—'}
          sub={s.chest_expanded_cm ? `${s.chest_expanded_cm} cm expanded` : ''} />
      </div>

      {s.readiness?.length > 0 && (
        <div className="card p-4">
          <p className="mb-3 font-bold text-ink-900">Where they stand{s.target_exam ? ` — ${s.target_exam}` : ''}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {s.readiness.map(r => {
              const t = r.targets[0];
              return (
                <div key={r.event} className="flex items-center justify-between gap-2 rounded-xl bg-ink-50 px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900">{r.event}</p>
                    <p className="text-xs text-ink-500">
                      {fmtVal(r.value, r.unit)} · target {fmtTarget(t)} ({t.exam})
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-lg px-2 py-1 text-2xs font-bold ${READINESS[t.status].cls}`}>
                    {READINESS[t.status].label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Segmented value={tab} onChange={setTab}
        options={[['overview', 'Overview'], ['attendance', 'Attendance'], ['fees', 'Fees'], ['performance', 'Performance']]} />

      {tab === 'overview' && (
        <div className="card grid gap-4 p-5 sm:grid-cols-2">
          {[
            ['Phone', s.phone], ['Date of birth', s.dob ? shortDate(s.dob) : null],
            ['Guardian', s.guardian_name], ['Guardian phone', s.guardian_phone],
            ['Village', s.village], ['Address', s.address],
            ['Batch timing', s.start_time ? `${s.start_time} – ${s.end_time}` : null],
            ['Target exam', s.target_exam],
            ['Monthly fee', s.fee_override ? `${rupees(s.fee_override)} (concession)` : null],
            ['Hostel', s.hostel_fee ? `${rupees(s.hostel_fee)} per month` : 'Day scholar'],
            ['Message language', { te: 'తెలుగు', en: 'English', hi: 'हिन्दी' }[s.preferred_lang] || 'తెలుగు'],
            ...(s.status !== 'active' && s.leave_reason ? [['Left because', s.leave_reason]] : []),
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
                      <p className="font-semibold">
                        {i.period}{i.type === 'hostel' && <span className="font-bold text-saffron-700"> · Hostel</span>}
                      </p>
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
              {due.map(i => (
                <option key={i.id} value={i.id}>
                  {i.period}{i.type === 'hostel' ? ' hostel' : ''}, {rupees(i.amount)} ({i.status})
                </option>
              ))}
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
              onChange={e => setTest({ ...test, event: e.target.value, unit: unitFor(e.target.value) })}>
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

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit student">
        <form onSubmit={saveEdit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Status">
              <select className="input capitalize" value={edit.status}
                onChange={e => setEdit({ ...edit, status: e.target.value })}>
                {STATUSES.map(x => <option key={x} value={x}>{x}</option>)}
              </select>
            </Field>
            <Field label="Message language">
              <select className="input" value={edit.preferred_lang}
                onChange={e => setEdit({ ...edit, preferred_lang: e.target.value })}>
                <option value="te">తెలుగు</option><option value="en">English</option><option value="hi">हिन्दी</option>
              </select>
            </Field>
          </div>
          {edit.status !== 'active' && (
            <Field label="Why are they leaving / pausing?">
              <input className="input" required={s.status === 'active'} placeholder="Moved for college; exam cleared; fees…"
                value={edit.leave_reason} onChange={e => setEdit({ ...edit, leave_reason: e.target.value })} />
            </Field>
          )}
          <Field label="Batch">
            <select className="input" value={edit.batch_id ?? ''}
              onChange={e => setEdit({ ...edit, batch_id: e.target.value })}>
              <option value="">No batch</option>
              {batchList.filter(b => b.active !== 0 || b.id === s.batch_id).map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.student_count}/{b.capacity}{b.student_count >= b.capacity ? ', full' : ''})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Availability note (shows on roll call and test day)">
            <input className="input" placeholder="Knee strain, no running this week"
              value={edit.availability_note} onChange={e => setEdit({ ...edit, availability_note: e.target.value })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Monthly fee concession (₹, blank = course fee)">
              <input className="input" inputMode="decimal" value={edit.fee_override}
                onChange={e => setEdit({ ...edit, fee_override: e.target.value })} />
            </Field>
            <Field label="Hostel fee (₹ per month, blank = day scholar)">
              <input className="input" inputMode="decimal" value={edit.hostel_fee}
                onChange={e => setEdit({ ...edit, hostel_fee: e.target.value })} />
            </Field>
          </div>
          <Field label="Target exam">
            <input className="input" placeholder="AP Police Constable" value={edit.target_exam}
              onChange={e => setEdit({ ...edit, target_exam: e.target.value })} />
          </Field>
          <button className="btn-primary w-full">Save changes</button>
        </form>
      </Modal>

      <Modal open={cardOpen} onClose={() => setCardOpen(false)} title="Monthly progress card">
        {!card || !built ? <Loading rows={6} /> : (
          <div className="space-y-3">
            <img src={built.dataUrl} alt={`Progress card for ${card.student.name}`}
              className="w-full rounded-xl border border-ink-200 shadow-card" />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <MsgLang />
              <div className="flex flex-wrap gap-2">
                <a className="btn-ghost" target="_blank" rel="noreferrer"
                  href={waLink(card.student.guardian_phone || card.student.phone, msg('progressCard', card))}>
                  <IconWhatsapp className="h-[18px] w-[18px] text-emerald-600" /> Message
                </a>
                <button onClick={() => window.print()} className="btn-ghost">Print</button>
                <button onClick={sharePdf} className="btn-accent">
                  <IconShare className="h-[18px] w-[18px]" /> Share PDF
                </button>
              </div>
            </div>
            <p className="text-center text-xs text-ink-500">
              Share PDF opens your phone's share sheet — send the card to WhatsApp, or anywhere else.
            </p>
          </div>
        )}
      </Modal>
      {cardOpen && built && (
        <PrintArea><img src={built.dataUrl} alt="" style={{ width: '100%' }} /></PrintArea>
      )}
    </div>
  );
}
