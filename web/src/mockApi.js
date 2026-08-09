/**
 * Demo backend.
 *
 * Built for VITE_DEMO=1 only. It answers the same routes as the Express API
 * against a snapshot of seeded data held in memory, so the exact same React app
 * can be published as a static site with nothing behind it. Writes are applied
 * to the in-memory copy and disappear on reload — which is what a review link
 * should do.
 */
import seed from './demoData.json';

const clone = o => JSON.parse(JSON.stringify(o));
const db = clone(seed);
const TODAY = db.today;
const month = TODAY.slice(0, 7);

const byId = arr => Object.fromEntries(arr.map(x => [x.id, x]));
let courses = byId(db.courses), batches = byId(db.batches);

/* The snapshot ends yesterday. Mark the first two batches for today so a
   visitor lands on a realistic half-finished morning rather than a blank one. */
(function seedToday() {
  db.attendance = db.attendance.filter(a => a.date !== TODAY);
  const done = db.batches.slice(0, 2).map(b => b.id);
  let n = 0;
  for (const s of db.students) {
    if (s.status !== 'active' || !done.includes(s.batch_id)) continue;
    const roll = (n++ * 7919) % 100;                       // stable, no Math.random
    db.attendance.push({
      student_id: s.id, batch_id: s.batch_id, date: TODAY,
      status: roll < 78 ? 'present' : roll < 87 ? 'late' : roll < 96 ? 'absent' : 'leave'
    });
  }
})();

const student = id => db.students.find(s => s.id === Number(id));
const invoicesOf = id => db.invoices.filter(i => i.student_id === Number(id));
const paymentsOf = id => db.payments.filter(p => p.student_id === Number(id));
const testsOf = id => db.tests.filter(t => t.student_id === Number(id));
const attOf = id => db.attendance.filter(a => a.student_id === Number(id)).sort((a, b) => b.date.localeCompare(a.date));

const paidOn = invId => db.payments.filter(p => p.invoice_id === invId).reduce((a, p) => a + p.amount, 0);
const balanceOf = id => {
  const billed = invoicesOf(id).filter(i => i.status !== 'waived').reduce((a, i) => a + i.amount, 0);
  return Math.round((billed - paymentsOf(id).reduce((a, p) => a + p.amount, 0)) * 100) / 100;
};
const pctOf = id => {
  const a = attOf(id);
  return a.length ? Math.round(a.filter(x => x.status === 'present' || x.status === 'late').length / a.length * 100) : null;
};
const decorate = s => ({
  ...s,
  course_name: courses[s.course_id]?.name || null,
  batch_name: batches[s.batch_id]?.name || null,
  start_time: batches[s.batch_id]?.start_time || null,
  end_time: batches[s.batch_id]?.end_time || null
});

const qs = path => Object.fromEntries(new URLSearchParams(path.split('?')[1] || ''));
const base = path => path.split('?')[0];
const delay = (v, ms = 160) => new Promise(r => setTimeout(() => r(clone(v)), ms));

/* ------------------------------------------------------------------ */
const GET = {
  '/reports/dashboard'() {
    const active = db.students.filter(s => s.status === 'active');
    const marked = db.attendance.filter(a => a.date === TODAY);
    const collectedMonth = db.payments.filter(p => p.paid_on.slice(0, 7) === month).reduce((a, p) => a + p.amount, 0);

    const byDate = {};
    for (const a of db.attendance) {
      (byDate[a.date] ||= { date: a.date, present: 0, marked: 0 });
      byDate[a.date].marked++;
      if (a.status === 'present' || a.status === 'late') byDate[a.date].present++;
    }
    const collection = {};
    for (const p of db.payments) (collection[p.paid_on.slice(0, 7)] ||= 0), (collection[p.paid_on.slice(0, 7)] += p.amount);

    return {
      date: TODAY, month,
      students: {
        total: db.students.length, active: active.length,
        men: active.filter(s => s.gender === 'M').length,
        women: active.filter(s => s.gender === 'F').length,
        joined_30d: db.students.filter(s => s.join_date >= addDays(TODAY, -30)).length
      },
      attendance_today: {
        present: marked.filter(a => a.status === 'present' || a.status === 'late').length,
        absent: marked.filter(a => a.status === 'absent').length,
        marked: marked.length,
        pct: marked.length ? Math.round(marked.filter(a => a.status === 'present' || a.status === 'late').length / marked.length * 100) : null
      },
      fees: {
        billed_this_month: db.invoices.filter(i => i.period === month).reduce((a, i) => a + i.amount, 0),
        collected_this_month: collectedMonth,
        collected_today: db.payments.filter(p => p.paid_on === TODAY).reduce((a, p) => a + p.amount, 0),
        overdue_count: db.invoices.filter(i => i.status !== 'paid' && i.status !== 'waived' && i.due_date < TODAY).length,
        total_outstanding: db.students.reduce((a, s) => a + Math.max(0, balanceOf(s.id)), 0)
      },
      enquiries: {
        new: db.enquiries.filter(e => e.status === 'new').length,
        total: db.enquiries.length,
        week: db.enquiries.filter(e => e.created_at.slice(0, 10) >= addDays(TODAY, -7)).length
      },
      batches: db.batches.map(b => ({
        id: b.id, name: b.name, start_time: b.start_time, end_time: b.end_time,
        students: db.students.filter(s => s.batch_id === b.id && s.status === 'active').length,
        marked: db.attendance.filter(a => a.date === TODAY && a.batch_id === b.id).length
      })),
      trend: Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)).slice(-14),
      collection: Object.entries(collection).sort().slice(-6).map(([period, amount]) => ({ period, amount }))
    };
  },

  '/students'(path) {
    const { q = '', batch_id, status, limit = 500 } = qs(path);
    const rows = db.students.filter(s =>
      (!batch_id || String(s.batch_id) === batch_id) &&
      (!status || s.status === status) &&
      (!q || `${s.name} ${s.phone} ${s.admission_no} ${s.village}`.toLowerCase().includes(q.toLowerCase()))
    ).sort((a, b) => a.name.localeCompare(b.name));
    return { total: rows.length, students: rows.slice(0, Number(limit)).map(decorate) };
  },

  '/batches': () => db.batches.map(b => ({
    ...b, course_name: courses[b.course_id]?.name || null,
    student_count: db.students.filter(s => s.batch_id === b.id && s.status === 'active').length
  })),

  '/courses': () => db.courses.map(c => ({
    ...c, student_count: db.students.filter(s => s.course_id === c.id && s.status === 'active').length
  })),

  '/timetable'() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const week = Object.fromEntries(days.map(d => [d, []]));
    for (const b of db.batches) {
      const rich = { ...b, course_name: courses[b.course_id]?.name, student_count: db.students.filter(s => s.batch_id === b.id).length };
      for (const d of (b.days || '').split(',').map(x => x.trim())) if (week[d]) week[d].push(rich);
    }
    for (const d of days) week[d].sort((a, b) => a.start_time.localeCompare(b.start_time));
    return week;
  },

  '/attendance/sheet'(path) {
    const { batch_id, date = TODAY } = qs(path);
    const rows = db.students
      .filter(s => String(s.batch_id) === String(batch_id) && s.status === 'active')
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(s => {
        const a = db.attendance.find(x => x.student_id === s.id && x.date === date);
        return { student_id: s.id, admission_no: s.admission_no, name: s.name, gender: s.gender, phone: s.phone, status: a?.status || null };
      });
    return { date, batch_id: Number(batch_id), rows };
  },

  '/attendance/monthly'(path) {
    const { batch_id, month: m = month } = qs(path);
    const students = db.students
      .filter(s => s.status === 'active' && (!batch_id || String(s.batch_id) === String(batch_id)))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(s => {
        const list = db.attendance.filter(a => a.student_id === s.id && a.date.slice(0, 7) === m);
        const present = list.filter(a => a.status === 'present' || a.status === 'late').length;
        return {
          student_id: s.id, name: s.name, admission_no: s.admission_no,
          total: list.length, present, pct: list.length ? Math.round(present / list.length * 100) : null
        };
      });
    return { month: m, students };
  },

  '/attendance/absentees'(path) {
    const { days = 7, min = 3 } = qs(path);
    const since = addDays(TODAY, -Number(days));
    return db.students.filter(s => s.status === 'active').map(s => {
      const absents = db.attendance.filter(a => a.student_id === s.id && a.status === 'absent' && a.date >= since).length;
      return { id: s.id, name: s.name, admission_no: s.admission_no, phone: s.phone, guardian_phone: s.guardian_phone, batch_name: batches[s.batch_id]?.name, absents };
    }).filter(x => x.absents >= Number(min)).sort((a, b) => b.absents - a.absents);
  },

  '/fees/invoices'(path) {
    const { status, period, q, overdue } = qs(path);
    return db.invoices.map(i => {
      const s = student(i.student_id);
      const paid = paidOn(i.id);
      return s ? { ...i, paid, balance: Math.round((i.amount - paid) * 100) / 100, student_name: s.name, admission_no: s.admission_no, phone: s.phone, guardian_phone: s.guardian_phone, batch_name: batches[s.batch_id]?.name } : null;
    }).filter(Boolean)
      .filter(i => (!status || i.status === status) && (!period || i.period === period)
        && (overdue !== '1' || (i.status !== 'paid' && i.status !== 'waived' && i.due_date < TODAY))
        && (!q || `${i.student_name} ${i.admission_no} ${i.phone}`.toLowerCase().includes(q.toLowerCase())))
      .sort((a, b) => b.due_date.localeCompare(a.due_date));
  },

  '/fees/payments': () => db.payments.map(p => {
    const s = student(p.student_id);
    return { ...p, student_name: s?.name, admission_no: s?.admission_no };
  }).sort((a, b) => b.paid_on.localeCompare(a.paid_on)),

  '/reports/events': () => [...new Set(db.tests.map(t => t.event))].sort(),

  '/reports/performance'(path) {
    const { event = '1600m Run' } = qs(path);
    const lower = /run|sprint/i.test(event);
    const latest = {};
    for (const t of db.tests) {
      if (t.event !== event) continue;
      if (!latest[t.student_id] || t.date > latest[t.student_id].date) latest[t.student_id] = t;
    }
    const rows = Object.values(latest).map(t => {
      const s = student(t.student_id);
      return s ? { id: s.id, name: s.name, admission_no: s.admission_no, gender: s.gender, batch_name: batches[s.batch_id]?.name, value: t.value, unit: t.unit, date: t.date } : null;
    }).filter(Boolean).sort((a, b) => lower ? a.value - b.value : b.value - a.value);
    return { event, lower_is_better: lower, rows: rows.slice(0, 100) };
  },

  '/enquiries'(path) {
    const { status } = qs(path);
    return db.enquiries.filter(e => !status || e.status === status)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  '/enquiries/public/courses': () => db.courses,
  '/auth/users': () => db.users,
  '/auth/me': () => ({ user: DEMO_USER })
};

const DEMO_USER = { id: 1, name: 'MSR Admin', role: 'admin', phone: '9000000001' };

function addDays(iso, n) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
function get(path) {
  if (base(path).startsWith('/students/') && !base(path).includes('/tests')) {
    const s = student(base(path).split('/')[2]);
    if (!s) throw new Error('Student not found');
    return {
      ...decorate(s),
      attendance: attOf(s.id).slice(0, 60),
      attendance_pct: pctOf(s.id),
      invoices: invoicesOf(s.id).sort((a, b) => b.period.localeCompare(a.period)),
      payments: paymentsOf(s.id).sort((a, b) => b.paid_on.localeCompare(a.paid_on)),
      tests: testsOf(s.id).sort((a, b) => b.date.localeCompare(a.date)),
      balance: balanceOf(s.id)
    };
  }
  if (base(path).startsWith('/fees/payments/')) {
    const p = db.payments.find(x => x.id === Number(base(path).split('/')[3]));
    const s = p && student(p.student_id);
    const inv = p && db.invoices.find(i => i.id === p.invoice_id);
    return { ...p, student_name: s?.name, admission_no: s?.admission_no, course_name: courses[s?.course_id]?.name, period: inv?.period, academy: db.academy };
  }
  const fn = GET[base(path)];
  if (!fn) throw new Error(`This is a demo — "${base(path)}" is not wired up here.`);
  return fn(path);
}

function post(path, body = {}) {
  if (path === '/auth/login') {
    if (body.password !== 'msr@2026' && body.password !== 'office@2026') throw new Error('Wrong username or password');
    return { token: 'demo-token', user: DEMO_USER };
  }
  if (path === '/enquiries/public' || path === '/enquiries') {
    if (!body.name || !body.phone) throw new Error('Please enter your name and phone number');
    db.enquiries.unshift({
      id: Date.now(), name: body.name, phone: body.phone, village: body.village || null,
      interest: body.interest || null, message: body.message || null,
      source: path.includes('public') ? 'website' : (body.source || 'walk-in'),
      status: 'new', created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    });
    return { ok: true, message: 'Thank you. Our team will call you shortly.' };
  }
  if (path === '/attendance/mark') {
    for (const e of body.entries || []) {
      const found = db.attendance.find(a => a.student_id === e.student_id && a.date === (body.date || TODAY));
      if (found) found.status = e.status;
      else db.attendance.push({ student_id: e.student_id, batch_id: body.batch_id, date: body.date || TODAY, status: e.status });
    }
    return { ok: true, saved: (body.entries || []).length, date: body.date || TODAY };
  }
  if (path === '/fees/payments') {
    const receipt_no = 'R' + new Date().getFullYear() + String(db.payments.length + 1).padStart(5, '0');
    const rec = {
      id: Date.now(), student_id: body.student_id, invoice_id: body.invoice_id || null, receipt_no,
      amount: Number(body.amount), mode: body.mode || 'cash', reference: body.reference || null, paid_on: body.paid_on || TODAY
    };
    db.payments.push(rec);
    if (rec.invoice_id) {
      const inv = db.invoices.find(i => i.id === rec.invoice_id);
      if (inv) inv.status = paidOn(inv.id) + 0.001 >= inv.amount ? 'paid' : 'partial';
    }
    return { id: rec.id, receipt_no };
  }
  if (path === '/fees/generate') {
    const period = body.period || month;
    let created = 0;
    for (const s of db.students.filter(x => x.status === 'active')) {
      const fee = courses[s.course_id]?.fee_amount;
      if (!fee || db.invoices.some(i => i.student_id === s.id && i.period === period)) continue;
      db.invoices.push({ id: Date.now() + created, student_id: s.id, period, description: `${courses[s.course_id].name} fee — ${period}`, amount: fee, due_date: `${period}-10`, status: 'unpaid' });
      created++;
    }
    return { ok: true, period, created };
  }
  if (path === '/students') {
    const id = Math.max(0, ...db.students.map(s => s.id)) + 1;
    const admission_no = `MSR${new Date().getFullYear()}${String(id).padStart(4, '0')}`;
    db.students.push({ ...body, id, admission_no, status: 'active', join_date: TODAY });
    return { id, admission_no };
  }
  if (path.startsWith('/students/') && path.endsWith('/tests')) {
    db.tests.push({ student_id: Number(path.split('/')[2]), date: body.date || TODAY, event: body.event, value: Number(body.value), unit: body.unit || 'sec' });
    return { ok: true };
  }
  if (path === '/batches') { const id = Math.max(0, ...db.batches.map(b => b.id)) + 1; db.batches.push({ ...body, id }); batches = byId(db.batches); return { id }; }
  if (path === '/courses') { const id = Math.max(0, ...db.courses.map(c => c.id)) + 1; db.courses.push({ ...body, id, active: 1 }); courses = byId(db.courses); return { id }; }
  if (path === '/auth/change-password') return { ok: true };
  if (path === '/auth/users') { db.users.push({ ...body, id: Date.now(), active: 1 }); return { ok: true }; }
  throw new Error('This action is disabled in the demo.');
}

function patch(path, body = {}) {
  if (path.startsWith('/enquiries/')) {
    const e = db.enquiries.find(x => x.id === Number(path.split('/')[2]));
    if (e) Object.assign(e, body);
    return { ok: true };
  }
  if (path.startsWith('/students/')) {
    const s = student(path.split('/')[2]);
    if (s) Object.assign(s, body);
    return { ok: true };
  }
  return { ok: true };
}

export const mock = {
  get: p => delay(get(p)),
  post: (p, b) => delay(post(p, b)),
  patch: (p, b) => delay(patch(p, b)),
  del: () => delay({ ok: true }),
  download: () => {
    throw new Error('CSV export needs the live app — it is switched off in this demo.');
  }
};
