import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api, shortDate, rupees } from '../api';
import { Loading, Empty, Badge, Modal, Field, useToast, PageHead } from '../components.jsx';
import { IconSearch, IconPlus, IconDownload, IconStudents, IconChevronRight } from '../icons.jsx';

const blank = {
  name: '', gender: 'M', phone: '', guardian_name: '', guardian_phone: '', village: '',
  dob: '', course_id: '', batch_id: '', height_cm: '', weight_kg: '', address: '', notes: ''
};

const initials = n => n.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

export default function Students() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState({ batch_id: '', status: 'active' });
  const [meta, setMeta] = useState({ batches: [], courses: [] });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const search = useRef(null);

  useEffect(() => {
    Promise.all([api.get('/batches'), api.get('/courses')])
      .then(([batches, courses]) => setMeta({ batches, courses })).catch(() => {});
  }, []);

  const load = useCallback(() => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    for (const [k, v] of Object.entries(filters)) if (v) p.set(k, v);
    setData(null);
    api.get(`/students?${p}`).then(setData).catch(e => toast(e.message, 'error'));
  }, [q, filters, toast]);

  useEffect(() => {
    const t = setTimeout(load, q ? 280 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      for (const k of ['course_id', 'batch_id', 'height_cm', 'weight_kg']) payload[k] = payload[k] ? Number(payload[k]) : null;
      const res = await api.post('/students', payload);
      toast(`${form.name} admitted — ${res.admission_no}`);
      setOpen(false); setForm(blank); load();
    } catch (err) { toast(err.message, 'error'); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <PageHead title="Students" sub={data ? `${data.total} matching` : 'Loading…'}
        actions={<>
          <button onClick={() => api.download('/reports/export/students', 'msr-students.csv')} className="btn-ghost">
            <IconDownload className="h-[18px] w-[18px]" /><span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={() => setOpen(true)} className="btn-primary">
            <IconPlus className="h-[18px] w-[18px]" /> New admission
          </button>
        </>} />

      <div className="card grid gap-2 p-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-400" />
          <input ref={search} className="input pl-11" type="search" enterKeyHint="search"
            placeholder="Search name, phone, admission no, village"
            value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select className="input sm:w-52" value={filters.batch_id} aria-label="Filter by batch"
          onChange={e => setFilters({ ...filters, batch_id: e.target.value })}>
          <option value="">All batches</option>
          {meta.batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className="input sm:w-40" value={filters.status} aria-label="Filter by status"
          onChange={e => setFilters({ ...filters, status: e.target.value })}>
          <option value="">Any status</option>
          {['active', 'on-hold', 'dropped', 'passed-out'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {!data ? <Loading rows={6} /> : data.students.length === 0 ? (
        <Empty icon={<IconStudents className="h-6 w-6" />} title="No students match"
          hint="Try a shorter search, or clear the batch and status filters."
          action={<button className="btn-ghost" onClick={() => { setQ(''); setFilters({ batch_id: '', status: '' }); }}>Clear filters</button>} />
      ) : (
        <>
          {/* phones: a tappable card per student */}
          <ul className="space-y-2 lg:hidden">
            {data.students.map(s => (
              <li key={s.id}>
                <Link to={`/app/students/${s.id}`} className="card card-hover flex items-center gap-3 p-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-msr-50 text-sm font-bold text-msr-700">
                    {initials(s.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-ink-900">{s.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-ink-500">
                      {s.admission_no} · {s.batch_name || 'No batch'}
                    </span>
                  </span>
                  <Badge status={s.status} />
                  <IconChevronRight className="h-4 w-4 shrink-0 text-ink-300" />
                </Link>
              </li>
            ))}
          </ul>

          {/* desktop: the full table */}
          <div className="card hidden overflow-hidden lg:block">
            <table className="w-full">
              <thead className="border-b border-ink-100 bg-ink-50/70">
                <tr>
                  <th className="th">Student</th><th className="th">Batch</th><th className="th">Phone</th>
                  <th className="th">Village</th><th className="th">Joined</th><th className="th">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {data.students.map(s => (
                  <tr key={s.id} className="row-hover">
                    <td className="td">
                      <Link to={`/app/students/${s.id}`} className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-msr-50 text-2xs font-bold text-msr-700">
                          {initials(s.name)}
                        </span>
                        <span>
                          <span className="block font-semibold text-ink-900 hover:text-msr-700">{s.name}</span>
                          <span className="block font-mono text-2xs text-ink-400">{s.admission_no}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="td text-ink-600">{s.batch_name || '—'}</td>
                    <td className="td tnum text-ink-600">{s.phone || '—'}</td>
                    <td className="td text-ink-600">{s.village || '—'}</td>
                    <td className="td tnum text-ink-600">{shortDate(s.join_date)}</td>
                    <td className="td"><Badge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New admission" wide>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" className="sm:col-span-2">
            <input className="input" required autoFocus value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Gender">
            <select className="input" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
              <option value="M">Male</option><option value="F">Female</option>
            </select>
          </Field>
          <Field label="Date of birth">
            <input type="date" className="input" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
          </Field>
          <Field label="Phone">
            <input className="input" inputMode="numeric" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Village or town">
            <input className="input" value={form.village} onChange={e => setForm({ ...form, village: e.target.value })} />
          </Field>
          <Field label="Parent / guardian name">
            <input className="input" value={form.guardian_name} onChange={e => setForm({ ...form, guardian_name: e.target.value })} />
          </Field>
          <Field label="Guardian phone">
            <input className="input" inputMode="numeric" value={form.guardian_phone} onChange={e => setForm({ ...form, guardian_phone: e.target.value })} />
          </Field>
          <Field label="Programme">
            <select className="input" value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value })}>
              <option value="">Select</option>
              {meta.courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Batch">
            <select className="input" value={form.batch_id} onChange={e => setForm({ ...form, batch_id: e.target.value })}>
              <option value="">Select</option>
              {meta.batches.filter(b => b.active !== 0).map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.start_time}, {b.student_count}/{b.capacity}{b.student_count >= b.capacity ? ', full' : ''})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Height (cm)" hint="Needed for the PMT check">
            <input className="input" inputMode="decimal" value={form.height_cm} onChange={e => setForm({ ...form, height_cm: e.target.value })} />
          </Field>
          <Field label="Weight (kg)">
            <input className="input" inputMode="decimal" value={form.weight_kg} onChange={e => setForm({ ...form, weight_kg: e.target.value })} />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <input className="input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          </Field>
          <div className="flex gap-2 pt-1 sm:col-span-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1">Cancel</button>
            <button className="btn-primary flex-1" disabled={saving}>{saving ? 'Saving…' : 'Admit student'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
