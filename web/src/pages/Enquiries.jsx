import React, { useEffect, useState, useCallback } from 'react';
import { api, shortDate, waLink } from '../api';
import { Loading, Empty, Badge, Modal, Field, useToast, PageHead, Segmented } from '../components.jsx';
import { IconDownload, IconPlus, IconPhone, IconWhatsapp, IconInbox } from '../icons.jsx';
import { msg, MsgLang } from '../waTemplates.jsx';

const STATUSES = ['new', 'contacted', 'visited', 'joined', 'lost'];

export default function Enquiries() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', village: '', interest: '', message: '', source: 'walk-in' });

  const load = useCallback(() => {
    setItems(null);
    api.get(`/enquiries${filter ? `?status=${filter}` : ''}`).then(setItems).catch(e => toast(e.message, 'error'));
  }, [filter, toast]);
  useEffect(load, [load]);

  async function setStatus(id, status) {
    try { await api.patch(`/enquiries/${id}`, { status }); load(); }
    catch (e) { toast(e.message, 'error'); }
  }

  async function save(e) {
    e.preventDefault();
    try {
      await api.post('/enquiries', form);
      toast('Enquiry added');
      setOpen(false);
      setForm({ name: '', phone: '', village: '', interest: '', message: '', source: 'walk-in' });
      load();
    } catch (err) { toast(err.message, 'error'); }
  }

  return (
    <div className="space-y-4">
      <PageHead title="Enquiries" sub="Website submissions and walk-ins, tracked through to admission"
        actions={<>
          <button onClick={() => api.download('/reports/export/enquiries', 'msr-enquiries.csv')} className="btn-ghost">
            <IconDownload className="h-[18px] w-[18px]" /><span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={() => setOpen(true)} className="btn-primary">
            <IconPlus className="h-[18px] w-[18px]" /> Add
          </button>
        </>} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmented value={filter} onChange={setFilter}
          options={[['', 'All'], ...STATUSES.map(s => [s, s[0].toUpperCase() + s.slice(1)])]} />
        <MsgLang />
      </div>

      {!items ? <Loading rows={5} /> : items.length === 0 ? (
        <Empty icon={<IconInbox className="h-6 w-6" />} title="Nothing here yet"
          hint="Enquiries submitted on the website land in this list automatically." />
      ) : (
        <ul className="space-y-2">
          {items.map(e => (
            <li key={e.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink-900">
                    {e.name} <span className="font-normal text-ink-500">· {e.village || 'village not given'}</span>
                  </p>
                  <p className="tnum text-sm text-ink-600">{e.phone}</p>
                  {e.interest && <p className="mt-1 text-sm text-ink-800">{e.interest}</p>}
                  {e.message && <p className="mt-1 text-sm italic text-ink-500">“{e.message}”</p>}
                  <p className="mt-1.5 text-2xs text-ink-400">{shortDate(e.created_at)} · via {e.source}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge status={e.status} />
                  <div className="flex gap-1.5">
                    <a href={`tel:${e.phone}`} className="btn-ghost btn-sm">
                      <IconPhone className="h-4 w-4" /> Call
                    </a>
                    <a target="_blank" rel="noreferrer" className="btn-ghost btn-sm"
                      href={waLink(e.phone, msg('enquiryReply', e.name, e.interest))}>
                      <IconWhatsapp className="h-4 w-4 text-good-600" /> WhatsApp
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-ink-100 pt-3">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => setStatus(e.id, s)}
                    className={`rounded-lg px-3 py-2 text-2xs font-semibold capitalize transition ${
                      e.status === s ? 'bg-msr-800 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add enquiry">
        <form onSubmit={save} className="space-y-4">
          <Field label="Name"><input className="input" required autoFocus value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Phone"><input className="input" inputMode="numeric" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Village or town"><input className="input" value={form.village} onChange={e => setForm({ ...form, village: e.target.value })} /></Field>
          <Field label="Interested in"><input className="input" placeholder="AP Police Constable" value={form.interest} onChange={e => setForm({ ...form, interest: e.target.value })} /></Field>
          <Field label="Notes"><textarea className="input" rows="2" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /></Field>
          <Field label="Source">
            <select className="input" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
              {['walk-in', 'phone', 'referral', 'website'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <button className="btn-primary w-full">Save enquiry</button>
        </form>
      </Modal>
    </div>
  );
}
