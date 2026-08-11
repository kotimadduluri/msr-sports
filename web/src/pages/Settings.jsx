import React, { useEffect, useState, useCallback } from 'react';
import { api, getUser } from '../api';
import { Loading, Modal, Field, Badge, useToast, PageHead } from '../components.jsx';
import { IconDownload, IconPlus } from '../icons.jsx';

export default function Settings() {
  const toast = useToast();
  const me = getUser();
  const [users, setUsers] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', role: 'staff' });
  const [pw, setPw] = useState({ current: '', next: '' });
  const [academy, setAcademy] = useState(null);
  const [savingAcademy, setSavingAcademy] = useState(false);

  const load = useCallback(() => {
    api.get('/auth/users').then(setUsers).catch(() => setUsers([]));
    api.get('/settings').then(setAcademy).catch(() => setAcademy({}));
  }, []);
  useEffect(load, [load]);

  async function saveAcademy(e) {
    e.preventDefault();
    setSavingAcademy(true);
    try { await api.patch('/settings', academy); toast('Academy details saved'); }
    catch (err) { toast(err.message, 'error'); }
    finally { setSavingAcademy(false); }
  }

  async function addUser(e) {
    e.preventDefault();
    try {
      await api.post('/auth/users', form);
      toast(`${form.name} can now sign in`);
      setOpen(false); setForm({ name: '', phone: '', email: '', password: '', role: 'staff' }); load();
    } catch (err) { toast(err.message, 'error'); }
  }

  async function changePw(e) {
    e.preventDefault();
    try {
      await api.post('/auth/change-password', pw);
      toast('Password updated'); setPw({ current: '', next: '' });
    } catch (err) { toast(err.message, 'error'); }
  }

  async function toggle(u) {
    try { await api.patch(`/auth/users/${u.id}`, { active: u.active ? 0 : 1 }); load(); }
    catch (e) { toast(e.message, 'error'); }
  }

  return (
    <div className="space-y-4">
      <PageHead title="Settings" sub="Academy details, logins, passwords and backups" />

      {me?.role === 'admin' && academy && (
        <div className="card p-5">
          <h2 className="font-bold">Academy details</h2>
          <p className="mt-1 text-sm text-ink-500">
            Printed on every receipt and progress card. The UPI ID goes into fee reminders and the
            student self-check page so families can pay from their phone.
          </p>
          <form onSubmit={saveAcademy} className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Academy name">
              <input className="input" value={academy.academy_name || ''}
                onChange={e => setAcademy({ ...academy, academy_name: e.target.value })} />
            </Field>
            <Field label="Office phone">
              <input className="input" inputMode="tel" value={academy.phone || ''}
                onChange={e => setAcademy({ ...academy, phone: e.target.value })} />
            </Field>
            <Field label="Address">
              <input className="input" value={academy.address || ''}
                onChange={e => setAcademy({ ...academy, address: e.target.value })} />
            </Field>
            <Field label="UPI ID (for fee payments)">
              <input className="input" placeholder="academy@upi" value={academy.upi_id || ''}
                onChange={e => setAcademy({ ...academy, upi_id: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <button className="btn-primary" disabled={savingAcademy}>{savingAcademy ? 'Saving…' : 'Save details'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card p-5">
        <h2 className="font-bold">Change my password</h2>
        <form onSubmit={changePw} className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label="Current password">
            <input type="password" className="input" required value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} />
          </Field>
          <Field label="New password">
            <input type="password" className="input" required minLength={6} value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} />
          </Field>
          <div className="flex items-end"><button className="btn-primary w-full">Update</button></div>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3">
          <div>
            <h2 className="font-bold">Staff & coach logins</h2>
            <p className="text-xs text-ink-500">Coaches see students, attendance and performance, not fee edits.</p>
          </div>
          {me?.role === 'admin' && <button onClick={() => setOpen(true)} className="btn-primary btn-sm"><IconPlus className="h-4 w-4" /> Add</button>}
        </div>
        {!users ? <Loading rows={4} /> : users.length === 0 ? (
          <p className="p-4 text-sm text-ink-500">Only admin accounts exist. You can add staff and coach logins here.</p>
        ) : (
          <div className="divide-y divide-ink-100">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-xs text-ink-500">{u.phone} · {u.email || 'no email'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="pill bg-ink-100 capitalize text-ink-600">{u.role}</span>
                  <Badge status={u.active ? 'active' : 'dropped'} />
                  {me?.role === 'admin' && u.id !== me.id && (
                    <button onClick={() => toggle(u)} className="text-xs font-semibold text-ink-500 underline">
                      {u.active ? 'Disable' : 'Enable'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-5">
        <h2 className="font-bold">Data backup</h2>
        <p className="mt-1 text-sm text-ink-500">
          The server keeps its own nightly backups. Download a full copy of the database once a week
          and keep it somewhere safe, plus spreadsheet copies for the accountant.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {me?.role === 'admin' && (
            <button onClick={() => api.download('/admin/backup', `msr-backup-${new Date().toISOString().slice(0, 10)}.db`)}
              className="btn-primary"><IconDownload className="h-4 w-4" /> Full database backup</button>
          )}
          {['students', 'invoices', 'payments', 'enquiries', 'expenses', 'selections'].map(k => (
            <button key={k} onClick={() => api.download(`/reports/export/${k}`, `msr-${k}.csv`)} className="btn-ghost capitalize"><IconDownload className="h-4 w-4" />{k}</button>
          ))}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add a login">
        <form onSubmit={addUser} className="space-y-3">
          <Field label="Name"><input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Phone (used to sign in)"><input className="input" inputMode="tel" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Email (optional)"><input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Password"><input className="input" required minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></Field>
          <Field label="Role">
            <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="staff">Office staff</option>
              <option value="coach">Coach</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          <button className="btn-primary w-full">Create login</button>
        </form>
      </Modal>
    </div>
  );
}
