import { Router } from 'express';
import path from 'node:path';
import db, { DB_PATH } from '../db.js';
import { auth, allow, ADMIN, OFFICE, TRAINING } from '../auth.js';

/* Academy administration: cut-off benchmarks, the expense book, the success
   wall, recruitment notices, per-batch session logs, academy settings and the
   database backup download. Mounted at /api — auth is per-route (CLAUDE.md §8.1). */
const r = Router();

/* ---------------- benchmarks (official PET cut-offs) ---------------- */
r.get('/benchmarks', auth, allow(...TRAINING), (_req, res) => {
  res.json(db.prepare('SELECT * FROM benchmarks ORDER BY exam, event, gender').all());
});

r.post('/benchmarks', auth, allow(...OFFICE), (req, res) => {
  const { exam, event, gender = 'M', value, unit = 'sec', note } = req.body || {};
  if (!exam || !event || value === undefined) return res.status(400).json({ error: 'Exam, event and value are required' });
  const info = db.prepare(`
    INSERT INTO benchmarks (exam, event, gender, value, unit, note) VALUES (@exam,@event,@gender,@value,@unit,@note)
    ON CONFLICT(exam, event, gender) DO UPDATE SET value = excluded.value, unit = excluded.unit, note = excluded.note`)
    .run({ exam, event, gender, value: Number(value), unit, note: note || null });
  res.status(201).json({ id: info.lastInsertRowid });
});

r.delete('/benchmarks/:id', auth, allow(...ADMIN), (req, res) => {
  db.prepare('DELETE FROM benchmarks WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

/* ---------------- expense book ---------------- */
r.get('/expenses', auth, allow(...OFFICE), (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const rows = db.prepare(`
    SELECT e.*, u.name AS recorded_by_name FROM expenses e
    LEFT JOIN users u ON u.id = e.recorded_by
    WHERE substr(e.date,1,7) = ? ORDER BY e.date DESC, e.id DESC`).all(month);
  const byCategory = db.prepare(`
    SELECT category, SUM(amount) total FROM expenses
    WHERE substr(date,1,7) = ? GROUP BY category ORDER BY total DESC`).all(month);
  const collected = db.prepare(
    'SELECT COALESCE(SUM(amount),0) v FROM payments WHERE substr(paid_on,1,7) = ?').get(month).v;
  const total = rows.reduce((a, e) => a + e.amount, 0);
  res.json({ month, rows, total, byCategory, collected, profit: Math.round((collected - total) * 100) / 100 });
});

r.post('/expenses', auth, allow(...OFFICE), (req, res) => {
  const { date, category = 'other', description, amount } = req.body || {};
  if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'Enter the amount spent' });
  const info = db.prepare(
    'INSERT INTO expenses (date, category, description, amount, recorded_by) VALUES (?,?,?,?,?)')
    .run(date || new Date().toISOString().slice(0, 10), category, description || null, Number(amount), req.user.id);
  res.status(201).json({ id: info.lastInsertRowid });
});

r.delete('/expenses/:id', auth, allow(...ADMIN), (req, res) => {
  db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

/* ---------------- success wall (selections) ---------------- */
r.get('/selections', auth, allow(...TRAINING), (_req, res) => {
  res.json(db.prepare('SELECT * FROM selections ORDER BY year DESC, id DESC').all());
});

r.post('/selections', auth, allow(...OFFICE), (req, res) => {
  const { student_id, name, exam, year, village, photo_url, notes, published = 1 } = req.body || {};
  if (!name || !exam || !year) return res.status(400).json({ error: 'Name, exam and year are required' });
  const info = db.prepare(`INSERT INTO selections (student_id, name, exam, year, village, photo_url, notes, published)
    VALUES (?,?,?,?,?,?,?,?)`)
    .run(student_id || null, name, exam, Number(year), village || null, photo_url || null, notes || null, published ? 1 : 0);
  res.status(201).json({ id: info.lastInsertRowid });
});

r.patch('/selections/:id', auth, allow(...OFFICE), (req, res) => {
  const cur = db.prepare('SELECT * FROM selections WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Not found' });
  const b = req.body || {};
  db.prepare(`UPDATE selections SET name=?, exam=?, year=?, village=?, notes=?, published=? WHERE id=?`)
    .run(b.name ?? cur.name, b.exam ?? cur.exam, b.year ?? cur.year, b.village ?? cur.village,
         b.notes ?? cur.notes, b.published !== undefined ? (b.published ? 1 : 0) : cur.published, cur.id);
  res.json({ ok: true });
});

r.delete('/selections/:id', auth, allow(...ADMIN), (req, res) => {
  db.prepare('DELETE FROM selections WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

/* ---------------- recruitment notices ---------------- */
r.get('/notices', auth, allow(...TRAINING), (_req, res) => {
  res.json(db.prepare('SELECT * FROM notices ORDER BY id DESC').all());
});

r.post('/notices', auth, allow(...OFFICE), (req, res) => {
  const { title, body, exam, link, published = 1 } = req.body || {};
  if (!title) return res.status(400).json({ error: 'Give the notice a title' });
  const info = db.prepare('INSERT INTO notices (title, body, exam, link, published) VALUES (?,?,?,?,?)')
    .run(title, body || null, exam || null, link || null, published ? 1 : 0);
  res.status(201).json({ id: info.lastInsertRowid });
});

r.patch('/notices/:id', auth, allow(...OFFICE), (req, res) => {
  const cur = db.prepare('SELECT * FROM notices WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Not found' });
  const b = req.body || {};
  db.prepare('UPDATE notices SET title=?, body=?, exam=?, link=?, published=? WHERE id=?')
    .run(b.title ?? cur.title, b.body ?? cur.body, b.exam ?? cur.exam, b.link ?? cur.link,
         b.published !== undefined ? (b.published ? 1 : 0) : cur.published, cur.id);
  res.json({ ok: true });
});

r.delete('/notices/:id', auth, allow(...ADMIN), (req, res) => {
  db.prepare('DELETE FROM notices WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

/* ---------------- session log (one line per batch per day) ---------------- */
r.get('/sessions', auth, allow(...TRAINING), (req, res) => {
  const { batch_id, date } = req.query;
  if (!batch_id || !date) return res.status(400).json({ error: 'Batch and date are required' });
  res.json(db.prepare('SELECT * FROM session_logs WHERE batch_id = ? AND date = ?').get(batch_id, date) || null);
});

r.post('/sessions', auth, allow(...TRAINING), (req, res) => {
  const { batch_id, date, note } = req.body || {};
  if (!batch_id || !date || !note?.trim()) return res.status(400).json({ error: 'Write what the session was' });
  db.prepare(`INSERT INTO session_logs (batch_id, date, note, coach_id) VALUES (@batch_id,@date,@note,@coach_id)
    ON CONFLICT(batch_id, date) DO UPDATE SET note = excluded.note, coach_id = excluded.coach_id`)
    .run({ batch_id, date, note: note.trim(), coach_id: req.user.id });
  res.json({ ok: true });
});

/* ---------------- academy settings ---------------- */
const SETTING_KEYS = ['academy_name', 'address', 'phone', 'upi_id', 'whatsapp'];

r.get('/settings', auth, allow(...TRAINING), (_req, res) => {
  res.json(Object.fromEntries(db.prepare('SELECT key, value FROM settings').all().map(s => [s.key, s.value])));
});

r.patch('/settings', auth, allow(...ADMIN), (req, res) => {
  const stmt = db.prepare('INSERT INTO settings (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  db.transaction(() => {
    for (const k of SETTING_KEYS) if (req.body?.[k] !== undefined) stmt.run(k, String(req.body[k]));
  })();
  res.json({ ok: true });
});

/* ---------------- backup download (owner's safety net) ---------------- */
r.get('/admin/backup', auth, allow(...ADMIN), (_req, res) => {
  db.pragma('wal_checkpoint(TRUNCATE)');
  res.setHeader('Content-Disposition',
    `attachment; filename="msr-backup-${new Date().toISOString().slice(0, 10)}.db"`);
  res.sendFile(path.resolve(DB_PATH));
});

export default r;
