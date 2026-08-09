import React, { useEffect, useState, useCallback } from 'react';
import { api, rupees, shortDate, monthISO, todayISO, getUser } from '../api';
import { Loading, Empty, Modal, Field, useToast, Stat, PageHead } from '../components.jsx';
import { IconPlus, IconDownload, IconClose } from '../icons.jsx';

const CATEGORIES = ['rent', 'salaries', 'equipment', 'electricity', 'maintenance', 'transport', 'other'];
const blank = { date: todayISO(), category: 'rent', description: '', amount: '' };

/* The other half of the ledger: what the academy spends, and whether the
   month actually made money. */
export default function Expenses() {
  const toast = useToast();
  const me = getUser();
  const [month, setMonth] = useState(monthISO());
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setData(null);
    api.get(`/expenses?month=${month}`).then(setData).catch(e => toast(e.message, 'error'));
  }, [month, toast]);
  useEffect(load, [load]);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/expenses', { ...form, amount: Number(form.amount) });
      toast('Expense recorded');
      setOpen(false); setForm({ ...blank, date: form.date }); load();
    } catch (err) { toast(err.message, 'error'); }
    finally { setBusy(false); }
  }

  async function remove(id) {
    try { await api.del(`/expenses/${id}`); load(); }
    catch (e) { toast(e.message, 'error'); }
  }

  return (
    <div className="space-y-4">
      <PageHead title="Expenses" sub="Rent, salaries, equipment — so the month shows a real profit line"
        actions={<>
          <button onClick={() => api.download('/reports/export/expenses', 'msr-expenses.csv')} className="btn-ghost">
            <IconDownload className="h-[18px] w-[18px]" /><span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={() => setOpen(true)} className="btn-primary">
            <IconPlus className="h-[18px] w-[18px]" /> Add expense
          </button>
        </>} />

      <input type="month" className="input sm:w-56" value={month} aria-label="Month"
        onChange={e => setMonth(e.target.value)} />

      {!data ? <Loading kind="stats" /> : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Collected" value={rupees(data.collected)} tone="good" />
            <Stat label="Spent" value={rupees(data.total)} tone={data.total > data.collected ? 'bad' : undefined} />
            <Stat label="Profit" value={rupees(data.profit)} tone={data.profit >= 0 ? 'good' : 'bad'}
              sub={data.profit < 0 ? 'spending exceeded collections' : ''} />
          </div>

          {data.byCategory.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {data.byCategory.map(c => (
                <span key={c.category} className="pill bg-ink-100 capitalize text-ink-700">
                  {c.category} · {rupees(c.total)}
                </span>
              ))}
            </div>
          )}

          {data.rows.length === 0 ? (
            <Empty title="Nothing recorded this month"
              hint="Add rent, salaries and every other cost — the profit line above only means something when this list is complete." />
          ) : (
            <div className="card divide-y divide-ink-100">
              {data.rows.map(e => (
                <div key={e.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold capitalize text-ink-900">{e.category}
                      {e.description && <span className="font-normal text-ink-600"> — {e.description}</span>}
                    </p>
                    <p className="text-xs text-ink-500">{shortDate(e.date)}{e.recorded_by_name ? ` · ${e.recorded_by_name}` : ''}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <p className="font-semibold">{rupees(e.amount)}</p>
                    {me?.role === 'admin' && (
                      <button onClick={() => remove(e.id)} aria-label="Delete expense"
                        className="rounded-lg p-1.5 text-ink-400 transition hover:bg-rose-50 hover:text-critical">
                        <IconClose className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Record an expense">
        <form onSubmit={save} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Date">
              <input type="date" className="input" value={form.date} max={todayISO()}
                onChange={e => setForm({ ...form, date: e.target.value })} />
            </Field>
            <Field label="Category">
              <select className="input capitalize" value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <Field label="What was it for?">
            <input className="input" placeholder="Ground rent for the month" value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Amount (₹)">
            <input className="input" inputMode="decimal" required value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })} />
          </Field>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Save expense'}</button>
        </form>
      </Modal>
    </div>
  );
}
