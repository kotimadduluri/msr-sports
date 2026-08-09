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

/* Demo rows for the features that arrived after the snapshot was exported.
   Static and arithmetic — every viewer sees the same academy. */
db.benchmarks = [
  { id: 1, exam: 'AP Police Constable', event: '1600m Run', gender: 'M', value: 360, unit: 'sec' },
  { id: 2, exam: 'AP Police Constable', event: '100m Sprint', gender: 'M', value: 15, unit: 'sec' },
  { id: 3, exam: 'AP Police Constable', event: 'Long Jump', gender: 'M', value: 3.8, unit: 'm' },
  { id: 4, exam: 'AP Police Constable', event: 'Shot Put (7.26kg)', gender: 'M', value: 5.6, unit: 'm' },
  { id: 5, exam: 'AP Police Constable', event: '800m Run', gender: 'F', value: 240, unit: 'sec' },
  { id: 6, exam: 'AP Police Constable', event: '100m Sprint', gender: 'F', value: 18, unit: 'sec' },
  { id: 7, exam: 'AP Police Constable', event: 'Long Jump', gender: 'F', value: 2.7, unit: 'm' },
  { id: 8, exam: 'AP Police Constable', event: 'Shot Put (4kg)', gender: 'F', value: 4.5, unit: 'm' },
  { id: 9, exam: 'Indian Army GD', event: '1600m Run', gender: 'M', value: 330, unit: 'sec' },
  { id: 10, exam: 'Indian Army GD', event: 'Pull-ups', gender: 'M', value: 10, unit: 'count' },
  { id: 11, exam: 'SSC GD Constable', event: '1600m Run', gender: 'M', value: 380, unit: 'sec' },
  { id: 12, exam: 'SSC GD Constable', event: '1600m Run', gender: 'F', value: 510, unit: 'sec' }
].map(b => ({ ...b, note: 'Default target — verify against the current notification' }));

db.expenses = [
  { id: 1, date: `${month}-01`, category: 'rent', description: 'Ground rent', amount: 8000 },
  { id: 2, date: `${month}-01`, category: 'salaries', description: 'Coach salaries for the month', amount: 42000 },
  { id: 3, date: `${month}-03`, category: 'equipment', description: 'Shot put 7.26kg x2, cones', amount: 5600 },
  { id: 4, date: `${month}-05`, category: 'electricity', description: 'Office + floodlight bill', amount: 2350 },
  { id: 5, date: `${month}-07`, category: 'maintenance', description: 'Track rolling and lane marking', amount: 1800 }
].map(e => ({ ...e, recorded_by_name: 'MSR Admin' }));

db.selections = [
  { id: 1, name: 'K. Ramesh', exam: 'AP Police Constable', year: 2025, village: 'Chirala' },
  { id: 2, name: 'P. Anusha', exam: 'AP Police Constable', year: 2025, village: 'Vetapalem' },
  { id: 3, name: 'B. Srinu', exam: 'Indian Army GD / Agniveer', year: 2025, village: 'Chinaganjam' },
  { id: 4, name: 'M. Kavya', exam: 'SSC GD Constable', year: 2024, village: 'Chirala' },
  { id: 5, name: 'D. Praveen', exam: 'Railway RPF', year: 2024, village: 'Karamchedu' },
  { id: 6, name: 'S. Nagaraju', exam: 'AP Police SI', year: 2024, village: 'Chirala' }
].map(s => ({ ...s, published: 1 }));

db.notices = [
  { id: 1, title: 'SSC GD Constable 2026 notification is out', exam: 'SSC GD Constable', body: 'Apply online before the last date. Bring your documents to the office and we will help you fill the form.', link: null, published: 1, created_at: `${TODAY} 09:00` },
  { id: 2, title: 'Agniveer rally: district dates announced', exam: 'Indian Army GD / Agniveer', body: 'Rally expected in the district next quarter. Focus batches start this month.', link: null, published: 1, created_at: `${TODAY} 08:00` }
];

db.sessions = [];
/* one injured athlete, in the first batch so the roll-call flag is visible */
const injured = db.students.find(s => s.status === 'active' && s.batch_id === db.batches[0].id);
if (injured) injured.availability_note = 'Knee strain, no running this week';

/* Owner's testing numbers: every call/WhatsApp action in the demo reaches
   these two phones instead of the snapshot's fake numbers — safe to tap. */
const TEST_PHONES = ['8179028750', '9247838306'];
db.students.forEach((s, i) => {
  s.phone = TEST_PHONES[i % 2];
  s.guardian_phone = TEST_PHONES[(i + 1) % 2];
});
db.enquiries.forEach((e, i) => { e.phone = TEST_PHONES[i % 2]; });
db.academy.phone = '+91 81790 28750';

/* --- cut-off arithmetic (mirror of server/src/readiness.js) --- */
const meets = (v, t, u) => u === 'sec' ? v <= t : v >= t;
const readyStatus = (v, t, u) => meets(v, t, u) ? 'ready' : (u === 'sec' ? v <= t * 1.1 : v >= t * 0.9) ? 'borderline' : 'at-risk';
const gapTo = (v, t, u) => Math.round((u === 'sec' ? v - t : t - v) * 100) / 100;
const judge = ({ event, gender, exam, value, unit }) =>
  db.benchmarks
    .filter(b => b.event === event && b.gender === (gender || 'M') && (!exam || b.exam === exam) && b.unit === unit)
    .map(b => ({ exam: b.exam, target: b.value, unit: b.unit, gap: gapTo(value, b.value, b.unit), status: readyStatus(value, b.value, b.unit) }))
    .sort((a, b) => unit === 'sec' ? a.target - b.target : b.target - a.target);

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
        total_outstanding: db.students.reduce((a, s) => a + Math.max(0, balanceOf(s.id)), 0),
        spent_this_month: db.expenses.filter(e => e.date.slice(0, 7) === month).reduce((a, e) => a + e.amount, 0),
        profit_this_month: Math.round((collectedMonth - db.expenses.filter(e => e.date.slice(0, 7) === month).reduce((a, e) => a + e.amount, 0)) * 100) / 100
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
        return { student_id: s.id, admission_no: s.admission_no, name: s.name, gender: s.gender, phone: s.phone, availability_note: s.availability_note || null, status: a?.status || null };
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
    const { event = '1600m Run', exam } = qs(path);
    const lower = /run|sprint/i.test(event);
    const latest = {};
    for (const t of db.tests) {
      if (t.event !== event) continue;
      if (!latest[t.student_id] || t.date > latest[t.student_id].date) latest[t.student_id] = t;
    }
    const rows = Object.values(latest).map(t => {
      const s = student(t.student_id);
      if (!s) return null;
      const targets = judge({ event, gender: s.gender, exam, value: t.value, unit: t.unit });
      return { id: s.id, name: s.name, admission_no: s.admission_no, gender: s.gender, batch_name: batches[s.batch_id]?.name, value: t.value, unit: t.unit, date: t.date, benchmark: targets[0] || null };
    }).filter(Boolean).sort((a, b) => lower ? a.value - b.value : b.value - a.value);
    const exams = [...new Set(db.benchmarks.filter(b => b.event === event).map(b => b.exam))].sort();
    return { event, exam: exam || null, exams, lower_is_better: lower, rows: rows.slice(0, 100) };
  },

  '/enquiries'(path) {
    const { status } = qs(path);
    return db.enquiries.filter(e => !status || e.status === status)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  '/enquiries/public/courses': () => db.courses,
  '/auth/users': () => db.users,
  '/auth/me': () => ({ user: DEMO_USER }),

  '/benchmarks': () => db.benchmarks,

  '/expenses'(path) {
    const { month: m = month } = qs(path);
    const rows = db.expenses.filter(e => e.date.slice(0, 7) === m).sort((a, b) => b.date.localeCompare(a.date));
    const total = rows.reduce((a, e) => a + e.amount, 0);
    const byCategory = Object.entries(rows.reduce((acc, e) => ((acc[e.category] = (acc[e.category] || 0) + e.amount), acc), {}))
      .map(([category, t]) => ({ category, total: t })).sort((a, b) => b.total - a.total);
    const collected = db.payments.filter(p => p.paid_on.slice(0, 7) === m).reduce((a, p) => a + p.amount, 0);
    return { month: m, rows, total, byCategory, collected, profit: Math.round((collected - total) * 100) / 100 };
  },

  '/selections': () => [...db.selections].sort((a, b) => b.year - a.year || b.id - a.id),
  '/public/selections': () => db.selections.filter(s => s.published).map(({ name, exam, year, village }) => ({ name, exam, year, village })),
  '/notices': () => [...db.notices].sort((a, b) => b.id - a.id),
  '/public/notices': () => db.notices.filter(n => n.published).map(({ title, body, exam, link, created_at }) => ({ title, body, exam, link, created_at })),

  '/sessions'(path) {
    const { batch_id, date } = qs(path);
    return db.sessions.find(s => String(s.batch_id) === String(batch_id) && s.date === date) || null;
  },

  '/settings': () => ({ ...db.academy })
};

const DEMO_USER = { id: 1, name: 'MSR Admin', role: 'admin', phone: '9000000001' };

function addDays(iso, n) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
function progressCard(id, m = month) {
  const s = student(id);
  if (!s) throw new Error('Student not found');
  const prev = addDays(`${m}-01`, -1).slice(0, 7);
  const bestIn = mm => {
    const byEvent = {};
    for (const t of testsOf(s.id).filter(t => t.date.slice(0, 7) === mm)) {
      const cur = byEvent[t.event];
      if (!cur || (t.unit === 'sec' ? t.value < cur.value : t.value > cur.value)) byEvent[t.event] = t;
    }
    return Object.values(byEvent);
  };
  const att = attOf(s.id).filter(a => a.date.slice(0, 7) === m);
  const present = att.filter(a => a.status === 'present' || a.status === 'late').length;
  const prevBest = bestIn(prev);
  const events = bestIn(m).map(t => {
    const before = prevBest.find(p => p.event === t.event);
    return {
      event: t.event, unit: t.unit, value: t.value,
      prev: before?.value ?? null,
      delta: before ? Math.round((t.value - before.value) * 100) / 100 : null,
      targets: judge({ event: t.event, gender: s.gender, exam: s.target_exam || undefined, value: t.value, unit: t.unit })
    };
  });
  return {
    month: m,
    student: { id: s.id, name: s.name, admission_no: s.admission_no, gender: s.gender,
      course_name: courses[s.course_id]?.name, batch_name: batches[s.batch_id]?.name,
      target_exam: s.target_exam || null, guardian_phone: s.guardian_phone, phone: s.phone,
      preferred_lang: s.preferred_lang || 'te' },
    attendance: { total: att.length, present, pct: att.length ? Math.round(present / att.length * 100) : null },
    events,
    balance: balanceOf(s.id),
    academy: db.academy
  };
}

function get(path) {
  if (base(path).endsWith('/progress-card') && base(path).startsWith('/students/')) {
    return progressCard(base(path).split('/')[2], qs(path).month);
  }
  if (base(path).startsWith('/students/') && !base(path).includes('/tests')) {
    const s = student(base(path).split('/')[2]);
    if (!s) throw new Error('Student not found');
    const tests = testsOf(s.id).sort((a, b) => b.date.localeCompare(a.date));
    const latestByEvent = {};
    for (const t of tests) if (!latestByEvent[t.event]) latestByEvent[t.event] = t;
    const readiness = Object.values(latestByEvent).map(t => ({
      event: t.event, value: t.value, unit: t.unit, date: t.date,
      targets: judge({ event: t.event, gender: s.gender, exam: s.target_exam || undefined, value: t.value, unit: t.unit })
    })).filter(x => x.targets.length);
    return {
      ...decorate(s),
      attendance: attOf(s.id).slice(0, 60),
      attendance_pct: pctOf(s.id),
      invoices: invoicesOf(s.id).sort((a, b) => b.period.localeCompare(a.period)),
      payments: paymentsOf(s.id).sort((a, b) => b.paid_on.localeCompare(a.paid_on)),
      tests, readiness,
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
    if (body.password !== 'msr@2026' && body.password !== 'office@2026') {
      throw new Error('Wrong password — the demo login is 9000000001 / msr@2026');
    }
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
  if (path === '/students/tests/bulk') {
    const clean = (body.entries || []).filter(e => e.student_id && isFinite(Number(e.value)) && Number(e.value) > 0);
    if (!body.event || !clean.length) throw new Error('Pick an event and enter at least one result');
    for (const e of clean) {
      db.tests.push({ student_id: e.student_id, date: body.date || TODAY, event: body.event, value: Number(e.value), unit: body.unit || 'sec' });
    }
    return { ok: true, saved: clean.length, event: body.event, date: body.date || TODAY };
  }
  if (path.startsWith('/students/') && path.endsWith('/tests')) {
    db.tests.push({ student_id: Number(path.split('/')[2]), date: body.date || TODAY, event: body.event, value: Number(body.value), unit: body.unit || 'sec' });
    return { ok: true };
  }
  if (path === '/expenses') {
    if (!body.amount || Number(body.amount) <= 0) throw new Error('Enter the amount spent');
    const id = Math.max(0, ...db.expenses.map(e => e.id)) + 1;
    db.expenses.unshift({ id, date: body.date || TODAY, category: body.category || 'other', description: body.description || null, amount: Number(body.amount), recorded_by_name: DEMO_USER.name });
    return { id };
  }
  if (path === '/selections') {
    if (!body.name || !body.exam || !body.year) throw new Error('Name, exam and year are required');
    const id = Math.max(0, ...db.selections.map(s => s.id)) + 1;
    db.selections.unshift({ id, name: body.name, exam: body.exam, year: Number(body.year), village: body.village || null, notes: body.notes || null, published: body.published === 0 ? 0 : 1 });
    return { id };
  }
  if (path === '/notices') {
    if (!body.title) throw new Error('Give the notice a title');
    const id = Math.max(0, ...db.notices.map(n => n.id)) + 1;
    db.notices.unshift({ id, title: body.title, body: body.body || null, exam: body.exam || null, link: body.link || null, published: body.published === 0 ? 0 : 1, created_at: `${TODAY} 12:00` });
    return { id };
  }
  if (path === '/benchmarks') {
    if (!body.exam || !body.event || body.value === undefined) throw new Error('Exam, event and value are required');
    const found = db.benchmarks.find(b => b.exam === body.exam && b.event === body.event && b.gender === (body.gender || 'M'));
    if (found) Object.assign(found, { value: Number(body.value), unit: body.unit || found.unit, note: body.note || found.note });
    else db.benchmarks.push({ id: Math.max(0, ...db.benchmarks.map(b => b.id)) + 1, exam: body.exam, event: body.event, gender: body.gender || 'M', value: Number(body.value), unit: body.unit || 'sec', note: body.note || null });
    return { ok: true };
  }
  if (path === '/sessions') {
    if (!body.note?.trim()) throw new Error('Write what the session was');
    const found = db.sessions.find(s => s.batch_id === body.batch_id && s.date === body.date);
    if (found) found.note = body.note.trim();
    else db.sessions.push({ id: db.sessions.length + 1, batch_id: body.batch_id, date: body.date, note: body.note.trim() });
    return { ok: true };
  }
  if (path === '/public/self-check') {
    const adm = String(body.admission_no || '').trim().toUpperCase();
    const s = db.students.find(x => x.admission_no.toUpperCase() === adm && x.dob === String(body.dob || '').trim());
    if (!s) throw new Error('No match — check the admission number (on your receipt) and date of birth');
    const att = attOf(s.id).filter(a => a.date.slice(0, 7) === month);
    const present = att.filter(a => a.status === 'present' || a.status === 'late').length;
    const latestByEvent = {};
    for (const t of testsOf(s.id).sort((a, b) => b.date.localeCompare(a.date))) if (!latestByEvent[t.event]) latestByEvent[t.event] = t;
    return {
      name: s.name, admission_no: s.admission_no,
      course_name: courses[s.course_id]?.name, batch_name: batches[s.batch_id]?.name,
      start_time: batches[s.batch_id]?.start_time, target_exam: s.target_exam || null,
      attendance: { month, month_pct: att.length ? Math.round(present / att.length * 100) : null, all_pct: pctOf(s.id) },
      tests: Object.values(latestByEvent).map(t => ({
        event: t.event, value: t.value, unit: t.unit, date: t.date,
        readiness: judge({ event: t.event, gender: s.gender, exam: s.target_exam || undefined, value: t.value, unit: t.unit })
      })),
      balance: balanceOf(s.id),
      receipts: paymentsOf(s.id).sort((a, b) => b.paid_on.localeCompare(a.paid_on)).slice(0, 6)
        .map(({ receipt_no, amount, mode, paid_on }) => ({ receipt_no, amount, mode, paid_on })),
      upi_id: db.academy.upi_id || null
    };
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
  if (path === '/settings') { Object.assign(db.academy, body); return { ok: true }; }
  if (path.startsWith('/selections/')) {
    const s = db.selections.find(x => x.id === Number(path.split('/')[2]));
    if (s) Object.assign(s, body);
    return { ok: true };
  }
  if (path.startsWith('/notices/')) {
    const n = db.notices.find(x => x.id === Number(path.split('/')[2]));
    if (n) Object.assign(n, body);
    return { ok: true };
  }
  if (path.startsWith('/students/')) {
    const s = student(path.split('/')[2]);
    if (!s) return { ok: true };
    if (body.status && body.status !== 'active' && s.status === 'active' && !body.leave_reason) {
      throw new Error('Add a short reason when moving a student out of active');
    }
    Object.assign(s, body);
    return { ok: true };
  }
  return { ok: true };
}

function del(path) {
  const [, kind, id] = path.split('/');
  const lists = { expenses: db.expenses, selections: db.selections, notices: db.notices, benchmarks: db.benchmarks };
  if (lists[kind]) {
    const i = lists[kind].findIndex(x => x.id === Number(id));
    if (i >= 0) lists[kind].splice(i, 1);
  }
  return { ok: true };
}

export const mock = {
  get: p => delay(get(p)),
  post: (p, b) => delay(post(p, b)),
  patch: (p, b) => delay(patch(p, b)),
  del: p => delay(del(p)),
  download: () => {
    throw new Error('Downloads need the live app — they are switched off in this demo.');
  }
};
