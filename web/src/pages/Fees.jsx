import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api, rupees, shortDate, monthISO, todayISO, waLink } from '../api';
import { Loading, Empty, Badge, Modal, Field, useToast, Stat, PageHead, Segmented, PrintArea, PrintDoc } from '../components.jsx';
import { IconDownload, IconWhatsapp, IconRupee, IconPlus, IconCircleCheck } from '../icons.jsx';
import { msg, MsgLang } from '../waTemplates.jsx';

/* 30/60/90 dues ageing: how long past due, bucketed the way the owner chases */
const ageDays = due => Math.max(0, Math.round((new Date(todayISO()) - new Date(due)) / 86400000));
const AGE_BUCKETS = [
  { key: '90', label: 'Over 90 days', min: 91 },
  { key: '60', label: '31–90 days', min: 31 },
  { key: '30', label: 'Up to 30 days', min: 0 }
];
const bucketOf = i => AGE_BUCKETS.find(b => ageDays(i.due_date) >= b.min);

/* Rendered in the modal (preview) and again inside <PrintArea> for printing. */
function ReceiptBody({ receipt }) {
  return (
    <div className="rounded-xl border border-ink-300 p-5">
      <PrintDoc academy={receipt.academy} title="Fee receipt">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <p className="text-ink-500">Receipt no</p><p className="text-right font-mono">{receipt.receipt_no}</p>
          <p className="text-ink-500">Date</p><p className="text-right">{shortDate(receipt.paid_on)}</p>
          <p className="text-ink-500">Student</p><p className="text-right font-semibold">{receipt.student_name}</p>
          <p className="text-ink-500">Admission no</p><p className="text-right font-mono">{receipt.admission_no}</p>
          <p className="text-ink-500">Programme</p><p className="text-right">{receipt.course_name || 'General'}</p>
          <p className="text-ink-500">For</p><p className="text-right">{receipt.period || 'General'}</p>
          <p className="text-ink-500">Mode</p><p className="text-right uppercase">{receipt.mode}</p>
        </div>
        <hr className="my-3" />
        <div className="flex justify-between text-base font-bold">
          <span>Amount paid</span><span>{rupees(receipt.amount)}</span>
        </div>
      </PrintDoc>
    </div>
  );
}

export default function Fees() {
  const toast = useToast();
  const [tab, setTab] = useState('due');
  const [invoices, setInvoices] = useState(null);
  const [payments, setPayments] = useState(null);
  const [q, setQ] = useState('');
  const [genOpen, setGenOpen] = useState(false);
  const [period, setPeriod] = useState(monthISO());
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [remindOpen, setRemindOpen] = useState(false);
  const [reminded, setReminded] = useState(() => new Set());
  const [upi, setUpi] = useState('');

  useEffect(() => { api.get('/settings').then(a => setUpi(a.upi_id || '')).catch(() => {}); }, []);

  const loadInvoices = useCallback(() => {
    const p = new URLSearchParams();
    if (tab === 'due') p.set('overdue', '1');
    if (tab === 'month') p.set('period', monthISO());
    if (q) p.set('q', q);
    setInvoices(null);
    api.get(`/fees/invoices?${p}`).then(setInvoices).catch(e => toast(e.message, 'error'));
  }, [tab, q, toast]);

  useEffect(() => {
    if (tab === 'payments') {
      setPayments(null);
      api.get('/fees/payments').then(setPayments).catch(e => toast(e.message, 'error'));
    } else {
      const t = setTimeout(loadInvoices, q ? 300 : 0);
      return () => clearTimeout(t);
    }
  }, [tab, loadInvoices, q, toast]);

  async function generate() {
    setBusy(true);
    try {
      const res = await api.post('/fees/generate', { period });
      toast(res.created ? `${res.created} bills created for ${period}` : `All bills for ${period} already exist`);
      setGenOpen(false); setTab('month');
    } catch (e) { toast(e.message, 'error'); }
    finally { setBusy(false); }
  }

  const totals = invoices ? {
    billed: invoices.reduce((a, i) => a + i.amount, 0),
    paid: invoices.reduce((a, i) => a + i.paid, 0),
    balance: invoices.reduce((a, i) => a + i.balance, 0)
  } : null;

  return (
    <div className="space-y-4">
      <PageHead title="Fees" sub="Bill the month in one click, then record what comes in"
        actions={<>
          <button onClick={() => api.download('/reports/export/payments', 'msr-payments.csv')} className="btn-ghost">
            <IconDownload className="h-[18px] w-[18px]" /><span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={() => setGenOpen(true)} className="btn-primary">
            <IconPlus className="h-[18px] w-[18px]" /> Generate bills
          </button>
        </>} />

      <Segmented value={tab} onChange={setTab}
        options={[['due', 'Overdue'], ['month', 'This month'], ['payments', 'Payments']]} />

      {tab !== 'payments' && (
        <>
          <input className="input" placeholder="Search student name, phone or admission no"
            value={q} onChange={e => setQ(e.target.value)} />

          {totals && (
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Billed" value={rupees(totals.billed)} />
              <Stat label="Received" value={rupees(totals.paid)} tone="good" />
              <Stat label="Balance" value={rupees(totals.balance)} tone={totals.balance > 0 ? 'bad' : 'good'} />
            </div>
          )}

          {tab === 'due' && invoices?.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {AGE_BUCKETS.map(b => {
                const list = invoices.filter(i => bucketOf(i) === b);
                if (!list.length) return null;
                return (
                  <span key={b.key} className={`rounded-lg px-2.5 py-1 text-2xs font-bold ${
                    b.key === '90' ? 'bg-rose-50 text-rose-700' : b.key === '60' ? 'bg-amber-50 text-amber-700' : 'bg-ink-100 text-ink-600'}`}>
                    {b.label} · {list.length} bills · {rupees(list.reduce((a, i) => a + i.balance, 0))}
                  </span>
                );
              })}
              <button onClick={() => { setReminded(new Set()); setRemindOpen(true); }} className="btn-primary btn-sm ml-auto">
                <IconWhatsapp className="h-4 w-4" /> Remind all
              </button>
            </div>
          )}

          {!invoices ? <Loading rows={6} /> : invoices.length === 0 ? (
            <Empty title={tab === 'due' ? 'No overdue fees' : 'No bills for this month yet'}
              hint={tab === 'due' ? 'Everyone is up to date.' : 'Use "Generate monthly bills" to create them.'} />
          ) : (
            <div className="card divide-y divide-ink-100">
              {invoices.map(i => (
                <div key={i.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <Link to={`/app/students/${i.student_id}`} className="truncate font-semibold text-msr-700 hover:underline">
                      {i.student_name}
                    </Link>
                    <p className="truncate text-xs text-ink-500">
                      {i.period} · {i.batch_name || 'No batch'} · due {shortDate(i.due_date)}
                      {tab === 'due' && ageDays(i.due_date) > 0 && (
                        <span className={ageDays(i.due_date) > 90 ? ' font-semibold text-rose-600' : ageDays(i.due_date) > 30 ? ' font-semibold text-amber-600' : ''}>
                          {' '}· {ageDays(i.due_date)}d late
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="text-right">
                      <p className="font-semibold">{rupees(i.balance)}</p>
                      <Badge status={i.status} />
                    </div>
                    <a className="btn-ghost btn-sm hidden sm:inline-flex" target="_blank" rel="noreferrer"
                      href={waLink(i.guardian_phone || i.phone,
                        msg('feeReminder', { name: i.student_name, admission_no: i.admission_no }, i.balance, i.period, upi))}>
                      <IconWhatsapp className="h-4 w-4 text-emerald-600" /> Remind
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'payments' && (!payments ? <Loading rows={6} /> : payments.length === 0 ? (
        <Empty title="No payments recorded yet" />
      ) : (
        <div className="card divide-y divide-ink-100">
          {payments.map(p => (
            <button key={p.id} onClick={() => api.get(`/fees/payments/${p.id}/receipt`).then(setReceipt)}
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-ink-50">
              <div>
                <p className="font-semibold">{p.student_name}</p>
                <p className="text-xs text-ink-500">{p.receipt_no} · {shortDate(p.paid_on)} · {p.mode}</p>
              </div>
              <p className="font-semibold text-emerald-700">{rupees(p.amount)}</p>
            </button>
          ))}
        </div>
      ))}

      <Modal open={remindOpen} onClose={() => setRemindOpen(false)} title="Remind every overdue family">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-ink-600">Tap each family — WhatsApp opens with the message ready to send.</p>
            <MsgLang />
          </div>
          <div className="max-h-80 space-y-1.5 overflow-y-auto">
            {(invoices || []).filter(i => i.balance > 0).map(i => (
              <div key={i.id} className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 ${
                reminded.has(i.id) ? 'bg-emerald-50' : 'bg-ink-50'}`}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900">{i.student_name}</p>
                  <p className="text-2xs text-ink-500">{rupees(i.balance)} · {ageDays(i.due_date)}d late</p>
                </div>
                {reminded.has(i.id) ? (
                  <span className="flex items-center gap-1 text-2xs font-bold text-emerald-700">
                    <IconCircleCheck className="h-4 w-4" /> Sent
                  </span>
                ) : (
                  <a className="btn-ghost btn-sm shrink-0" target="_blank" rel="noreferrer"
                    onClick={() => setReminded(prev => new Set(prev).add(i.id))}
                    href={waLink(i.guardian_phone || i.phone,
                      msg('feeReminder', { name: i.student_name, admission_no: i.admission_no }, i.balance, i.period, upi))}>
                    <IconWhatsapp className="h-4 w-4 text-emerald-600" /> Open
                  </a>
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-ink-500">
            {reminded.size} of {(invoices || []).filter(i => i.balance > 0).length} reminded
          </p>
        </div>
      </Modal>

      <Modal open={genOpen} onClose={() => setGenOpen(false)} title="Generate monthly fee bills">
        <div className="space-y-3">
          <p className="text-sm text-ink-600">
            This creates one bill per active student based on their programme fee. Students who already
            have a bill for the month are skipped, so it is safe to run more than once.
          </p>
          <Field label="Month">
            <input type="month" className="input" value={period} onChange={e => setPeriod(e.target.value)} />
          </Field>
          <button onClick={generate} disabled={busy} className="btn-primary w-full">
            {busy ? 'Generating…' : 'Generate bills'}
          </button>
        </div>
      </Modal>

      <Modal open={!!receipt} onClose={() => setReceipt(null)} title="Receipt">
        {receipt && (
          <div className="space-y-3">
            <ReceiptBody receipt={receipt} />
            <button onClick={() => window.print()} className="btn-primary w-full">Print / save as PDF</button>
          </div>
        )}
      </Modal>
      {receipt && <PrintArea><ReceiptBody receipt={receipt} /></PrintArea>}
    </div>
  );
}
