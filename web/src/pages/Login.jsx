import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setSession, getToken, isDemo } from '../api';
import { Spinner } from '../components.jsx';
import { Logo, IconAlert } from '../icons.jsx';

export default function Login() {
  const nav = useNavigate();
  const [form, setForm] = useState(isDemo ? { username: '9000000001', password: 'msr@2026' } : { username: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (getToken()) { nav('/app', { replace: true }); return null; }

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const { token, user } = await api.post('/auth/login', form);
      setSession(token, user);
      nav('/app', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-msr-950 p-4">
      {/* quiet depth, no stock imagery */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-msr-700/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-saffron-500/20 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="mb-7 text-center">
          <Logo className="mx-auto h-16 w-16" />
          <h1 className="mt-4 text-2xl font-extrabold text-white">MSR Sports Academy</h1>
          <p className="mt-1 text-sm text-msr-200">Chirala · Andhra Pradesh</p>
        </div>

        <form onSubmit={submit} className="card space-y-4 p-6">
          <div>
            <label className="label" htmlFor="u">Phone or email</label>
            <input id="u" className="input" autoComplete="username" inputMode="text" enterKeyHint="next"
              value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
              placeholder="9000000001" required autoFocus />
          </div>
          <div>
            <label className="label" htmlFor="p">Password</label>
            <input id="p" className="input" type="password" autoComplete="current-password" enterKeyHint="go"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••" required />
          </div>

          {error && (
            <p className="flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
              <IconAlert className="mt-px h-4 w-4 shrink-0" />{error}
            </p>
          )}

          <button className="btn-primary w-full" disabled={busy}>
            {busy ? <Spinner className="h-5 w-5" /> : 'Sign in'}
          </button>

          <p className="rounded-xl bg-ink-50 px-3 py-2.5 text-center text-xs text-ink-500">
            Demo login — <span className="font-semibold text-ink-700">9000000001</span> / <span className="font-semibold text-ink-700">msr@2026</span>
          </p>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link to="/" className="font-medium text-msr-200 underline-offset-4 hover:text-white hover:underline">
            ← Back to the website
          </Link>
        </p>
      </div>
    </div>
  );
}
