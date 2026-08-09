const BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'msr_token';
const USER_KEY = 'msr_user';

/* Demo builds ship the same UI with an in-memory backend, so the review link
   is the real app rather than a mock-up of it. */
export const isDemo = import.meta.env.VITE_DEMO === '1';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getUser = () => {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
};
export const setSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};
export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

async function request(path, { method = 'GET', body, raw } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (res.status === 401 && !path.startsWith('/auth/login')) {
    clearSession();
    if (location.pathname.startsWith('/app')) location.href = '/login';
    throw new Error('Session expired, please sign in again');
  }
  if (raw) return res;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

const live = {
  get: p => request(p),
  post: (p, body) => request(p, { method: 'POST', body }),
  patch: (p, body) => request(p, { method: 'PATCH', body }),
  del: p => request(p, { method: 'DELETE' }),
  download: async (p, filename) => {
    const res = await request(p, { raw: true });
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }
};

/* the demo backend is only pulled into the bundle when VITE_DEMO=1 */
let impl = live;
if (isDemo) {
  const { mock } = await import('./mockApi.js');
  impl = mock;
}
export const api = impl;

/* ---------- shared formatting ---------- */
export const rupees = n =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export const shortDate = d =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';

export const todayISO = () => new Date().toISOString().slice(0, 10);
export const monthISO = () => new Date().toISOString().slice(0, 7);

export const secsToTime = s => {
  const n = Number(s);
  if (!isFinite(n)) return '—';
  const m = Math.floor(n / 60);
  return m ? `${m}:${(n % 60).toFixed(1).padStart(4, '0')}` : `${n.toFixed(2)}s`;
};

export const waLink = (phone, text) =>
  `https://wa.me/91${String(phone || '').replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(text)}`;
