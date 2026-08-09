import { Router } from 'express';
import db from '../db.js';
import { judge } from '../readiness.js';

/* Everything the public website may read without signing in, mounted at
   /api/public — the one sanctioned home for unauthenticated routes besides
   the enquiry form. Nothing here returns phone numbers or money except the
   self-check, which requires admission number + date of birth. */
const r = Router();

r.get('/selections', (_req, res) => {
  res.json(db.prepare(`
    SELECT name, exam, year, village FROM selections
    WHERE published = 1 ORDER BY year DESC, id DESC LIMIT 60`).all());
});

r.get('/notices', (_req, res) => {
  res.json(db.prepare(`
    SELECT title, body, exam, link, created_at FROM notices
    WHERE published = 1 ORDER BY id DESC LIMIT 6`).all());
});

/* Self-check: a student (or parent) enters admission number + date of birth —
   both printed on every receipt — and sees their own record. Rate-limited so
   the pair can't be enumerated. */
const attempts = new Map(); // ip -> { count, since }
const LIMIT = 30, WINDOW_MS = 60 * 60 * 1000;

function limited(ip) {
  const now = Date.now();
  const a = attempts.get(ip);
  if (!a || now - a.since > WINDOW_MS) { attempts.set(ip, { count: 1, since: now }); return false; }
  a.count += 1;
  return a.count > LIMIT;
}

r.post('/self-check', (req, res) => {
  if (limited(req.ip)) return res.status(429).json({ error: 'Too many attempts — please try again later' });
  const admission_no = String(req.body?.admission_no || '').trim().toUpperCase();
  const dob = String(req.body?.dob || '').trim();
  if (!admission_no || !dob) return res.status(400).json({ error: 'Enter your admission number and date of birth' });

  const s = db.prepare(`
    SELECT s.*, c.name AS course_name, b.name AS batch_name, b.start_time
    FROM students s
    LEFT JOIN courses c ON c.id = s.course_id
    LEFT JOIN batches b ON b.id = s.batch_id
    WHERE UPPER(s.admission_no) = ? AND s.dob = ?`).get(admission_no, dob);
  if (!s) return res.status(404).json({ error: 'No match — check the admission number (on your receipt) and date of birth' });

  const month = new Date().toISOString().slice(0, 7);
  const att = db.prepare(`
    SELECT COUNT(*) total, SUM(status IN ('present','late')) present
    FROM attendance WHERE student_id = ? AND substr(date,1,7) = ?`).get(s.id, month);
  const attAll = db.prepare(`
    SELECT COUNT(*) total, SUM(status IN ('present','late')) present
    FROM attendance WHERE student_id = ?`).get(s.id);

  const latest = db.prepare(`
    SELECT event, value, unit, date FROM test_records
    WHERE student_id = ? AND id IN (SELECT MAX(id) FROM test_records WHERE student_id = ? GROUP BY event)
    ORDER BY date DESC`).all(s.id, s.id);
  const tests = latest.map(t => ({
    ...t,
    readiness: judge({ event: t.event, gender: s.gender, exam: s.target_exam || undefined, value: t.value, unit: t.unit })
  }));

  const billed = db.prepare(
    "SELECT COALESCE(SUM(amount),0) v FROM invoices WHERE student_id = ? AND status != 'waived'").get(s.id).v;
  const paid = db.prepare('SELECT COALESCE(SUM(amount),0) v FROM payments WHERE student_id = ?').get(s.id).v;
  const receipts = db.prepare(
    'SELECT receipt_no, amount, mode, paid_on FROM payments WHERE student_id = ? ORDER BY paid_on DESC LIMIT 6').all(s.id);
  const upi = db.prepare("SELECT value FROM settings WHERE key = 'upi_id'").get()?.value || null;

  res.json({
    name: s.name,
    admission_no: s.admission_no,
    course_name: s.course_name,
    batch_name: s.batch_name,
    start_time: s.start_time,
    target_exam: s.target_exam,
    attendance: {
      month, month_pct: att.total ? Math.round(att.present / att.total * 100) : null,
      all_pct: attAll.total ? Math.round(attAll.present / attAll.total * 100) : null
    },
    tests,
    balance: Math.round((billed - paid) * 100) / 100,
    receipts,
    upi_id: upi
  });
});

export default r;
