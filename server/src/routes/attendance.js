import { Router } from 'express';
import db from '../db.js';
import { auth, allow, TRAINING } from '../auth.js';

const r = Router();
r.use(auth);

const today = () => new Date().toISOString().slice(0, 10);

// Roll-call sheet: every active student in a batch with whatever is already marked
r.get('/sheet', allow(...TRAINING), (req, res) => {
  const date = req.query.date || today();
  const batch_id = req.query.batch_id;
  if (!batch_id) return res.status(400).json({ error: 'Choose a batch' });
  const rows = db.prepare(`
    SELECT s.id AS student_id, s.admission_no, s.name, s.gender, s.phone,
           a.status, a.id AS attendance_id
    FROM students s
    LEFT JOIN attendance a ON a.student_id = s.id AND a.date = ?
    WHERE s.batch_id = ? AND s.status = 'active'
    ORDER BY s.name`).all(date, batch_id);
  res.json({ date, batch_id: Number(batch_id), rows });
});

// Bulk save — one tap saves the whole ground
r.post('/mark', allow(...TRAINING), (req, res) => {
  const { date = today(), batch_id, entries } = req.body || {};
  if (!Array.isArray(entries) || !entries.length) return res.status(400).json({ error: 'Nothing to save' });
  const stmt = db.prepare(`
    INSERT INTO attendance (student_id, batch_id, date, status, marked_by)
    VALUES (@student_id, @batch_id, @date, @status, @marked_by)
    ON CONFLICT(student_id, date) DO UPDATE SET status = excluded.status, marked_by = excluded.marked_by`);
  const run = db.transaction(list => {
    for (const e of list) {
      stmt.run({
        student_id: e.student_id, batch_id: batch_id || null, date,
        status: ['present', 'absent', 'leave', 'late'].includes(e.status) ? e.status : 'absent',
        marked_by: req.user.id
      });
    }
  });
  run(entries);
  res.json({ ok: true, saved: entries.length, date });
});

// Month grid for one batch
r.get('/monthly', allow(...TRAINING), (req, res) => {
  const month = req.query.month || today().slice(0, 7);   // YYYY-MM
  const { batch_id } = req.query;
  const rows = db.prepare(`
    SELECT s.id AS student_id, s.name, s.admission_no, a.date, a.status
    FROM students s
    LEFT JOIN attendance a ON a.student_id = s.id AND substr(a.date,1,7) = @month
    WHERE (@batch_id IS NULL OR s.batch_id = @batch_id) AND s.status='active'
    ORDER BY s.name, a.date`).all({ month, batch_id: batch_id || null });
  const byStudent = new Map();
  for (const row of rows) {
    if (!byStudent.has(row.student_id)) {
      byStudent.set(row.student_id, { student_id: row.student_id, name: row.name, admission_no: row.admission_no, days: {}, present: 0, total: 0 });
    }
    const s = byStudent.get(row.student_id);
    if (row.date) {
      s.days[row.date.slice(8)] = row.status;
      s.total++;
      if (row.status === 'present' || row.status === 'late') s.present++;
    }
  }
  const students = [...byStudent.values()].map(s => ({ ...s, pct: s.total ? Math.round(s.present / s.total * 100) : null }));
  res.json({ month, students });
});

// Who has been missing — the list worth calling parents about
r.get('/absentees', allow(...TRAINING), (req, res) => {
  const days = Number(req.query.days || 7);
  const rows = db.prepare(`
    SELECT s.id, s.name, s.admission_no, s.phone, s.guardian_phone, b.name AS batch_name,
      MAX(a.date) AS last_present,
      SUM(CASE WHEN a.status='absent' AND a.date >= date('now', ?) THEN 1 ELSE 0 END) AS absents
    FROM students s
    LEFT JOIN attendance a ON a.student_id = s.id
    LEFT JOIN batches b ON b.id = s.batch_id
    WHERE s.status='active'
    GROUP BY s.id
    HAVING absents >= ?
    ORDER BY absents DESC`).all(`-${days} days`, Number(req.query.min || 3));
  res.json(rows);
});

export default r;
