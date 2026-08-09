import { Router } from 'express';
import db from '../db.js';
import { auth, allow, OFFICE, TRAINING } from '../auth.js';

const r = Router();
// auth is attached per-route rather than with r.use(): this router is mounted
// at /api, and a router-level guard would also swallow sibling public routes
// such as the website enquiry form.

/* ---------------- Courses / programmes ---------------- */
r.get('/courses', auth, allow(...TRAINING), (_req, res) => {
  res.json(db.prepare(`
    SELECT c.*, (SELECT COUNT(*) FROM students s WHERE s.course_id = c.id AND s.status='active') AS student_count
    FROM courses c ORDER BY c.active DESC, c.name`).all());
});

r.post('/courses', auth, allow(...OFFICE), (req, res) => {
  const b = req.body || {};
  if (!b.name) return res.status(400).json({ error: 'Course name is required' });
  const info = db.prepare(`INSERT INTO courses (name,category,description,duration_months,fee_amount,fee_cycle,admission_fee)
    VALUES (?,?,?,?,?,?,?)`).run(b.name, b.category || 'govt-job', b.description || null,
      b.duration_months || 6, b.fee_amount || 0, b.fee_cycle || 'monthly', b.admission_fee || 0);
  res.status(201).json({ id: info.lastInsertRowid });
});

r.patch('/courses/:id', auth, allow(...OFFICE), (req, res) => {
  const cur = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Not found' });
  const f = ['name','category','description','duration_months','fee_amount','fee_cycle','admission_fee','active'];
  const m = {}; for (const k of f) m[k] = req.body?.[k] !== undefined ? req.body[k] : cur[k];
  db.prepare(`UPDATE courses SET ${f.map(k => `${k}=@${k}`).join(',')} WHERE id=@id`).run({ ...m, id: cur.id });
  res.json({ ok: true });
});

/* ---------------- Batches ---------------- */
/* Each row carries its own health: active headcount, attendance over the
   last 30 days, and the fee balance still out — so the owner's "which batch
   is leaking?" question is answered on one screen. */
r.get('/batches', auth, allow(...TRAINING), (_req, res) => {
  res.json(db.prepare(`
    SELECT b.*, c.name AS course_name, u.name AS coach_name,
      (SELECT COUNT(*) FROM students s WHERE s.batch_id = b.id AND s.status='active') AS student_count,
      (SELECT ROUND(100.0 * SUM(CASE WHEN a.status IN ('present','late') THEN 1 ELSE 0 END) / COUNT(*))
         FROM attendance a JOIN students sa ON sa.id = a.student_id
         WHERE sa.batch_id = b.id AND a.date >= date('now','-30 day')) AS att30_pct,
      (SELECT COALESCE(SUM(i.amount - COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.id), 0)), 0)
         FROM invoices i JOIN students si ON si.id = i.student_id
         WHERE si.batch_id = b.id AND si.status = 'active' AND i.status IN ('unpaid','partial')) AS due_total
    FROM batches b
    LEFT JOIN courses c ON c.id = b.course_id
    LEFT JOIN users u ON u.id = b.coach_id
    ORDER BY b.active DESC, b.start_time`).all());
});

/* Coach names for the batch form — lighter than the admin-only users list. */
r.get('/coaches', auth, allow(...TRAINING), (_req, res) => {
  res.json(db.prepare(`SELECT id, name FROM users WHERE role = 'coach' AND active = 1 ORDER BY name`).all());
});

r.post('/batches', auth, allow(...OFFICE), (req, res) => {
  const b = req.body || {};
  if (!b.name) return res.status(400).json({ error: 'Batch name is required' });
  const info = db.prepare(`INSERT INTO batches (name,course_id,coach_id,days,start_time,end_time,venue,capacity)
    VALUES (?,?,?,?,?,?,?,?)`).run(b.name, b.course_id || null, b.coach_id || null,
      b.days || 'Mon,Tue,Wed,Thu,Fri,Sat', b.start_time || '05:30', b.end_time || '08:00',
      b.venue || 'MSR Ground, Chirala', b.capacity || 60);
  res.status(201).json({ id: info.lastInsertRowid });
});

r.patch('/batches/:id', auth, allow(...OFFICE), (req, res) => {
  const cur = db.prepare('SELECT * FROM batches WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Not found' });
  const f = ['name','course_id','coach_id','days','start_time','end_time','venue','capacity','active'];
  const m = {}; for (const k of f) m[k] = req.body?.[k] !== undefined ? req.body[k] : cur[k];
  db.prepare(`UPDATE batches SET ${f.map(k => `${k}=@${k}`).join(',')} WHERE id=@id`).run({ ...m, id: cur.id });
  res.json({ ok: true });
});

/* ---------------- Weekly timetable view ---------------- */
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
r.get('/timetable', auth, allow(...TRAINING), (_req, res) => {
  const batches = db.prepare(`
    SELECT b.*, c.name AS course_name, u.name AS coach_name,
      (SELECT COUNT(*) FROM students s WHERE s.batch_id = b.id AND s.status='active') AS student_count
    FROM batches b LEFT JOIN courses c ON c.id=b.course_id LEFT JOIN users u ON u.id=b.coach_id
    WHERE b.active = 1`).all();
  const week = Object.fromEntries(DAYS.map(d => [d, []]));
  for (const b of batches) {
    for (const d of (b.days || '').split(',').map(x => x.trim())) {
      if (week[d]) week[d].push(b);
    }
  }
  for (const d of DAYS) week[d].sort((a, b) => a.start_time.localeCompare(b.start_time));
  res.json(week);
});

export default r;
