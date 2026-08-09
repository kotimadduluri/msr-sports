import { Router } from 'express';
import db from '../db.js';
import { auth, allow, OFFICE, TRAINING } from '../auth.js';

const r = Router();

// PUBLIC — the website enquiry form posts here, no login needed.
const recent = new Map(); // tiny in-memory rate limit against form spam
r.post('/public', (req, res) => {
  const { name, phone, village, interest, message } = req.body || {};
  if (!name || !phone) return res.status(400).json({ error: 'Please enter your name and phone number' });
  if (!/^[0-9+\-\s]{10,15}$/.test(String(phone))) return res.status(400).json({ error: 'Please enter a valid phone number' });
  const ip = req.ip;
  const now = Date.now();
  const hits = (recent.get(ip) || []).filter(t => now - t < 60_000);
  if (hits.length >= 5) return res.status(429).json({ error: 'Too many submissions, please try again in a minute' });
  recent.set(ip, [...hits, now]);

  db.prepare('INSERT INTO enquiries (name, phone, village, interest, message, source) VALUES (?,?,?,?,?,?)')
    .run(String(name).slice(0, 80), String(phone).slice(0, 15), village || null,
         interest || null, message ? String(message).slice(0, 500) : null, 'website');
  res.status(201).json({ ok: true, message: 'Thank you. Our team will call you shortly.' });
});

// PUBLIC — programme list for the website
r.get('/public/courses', (_req, res) => {
  res.json(db.prepare('SELECT id, name, category, description, duration_months, fee_amount, fee_cycle FROM courses WHERE active = 1 ORDER BY name').all());
});

r.use(auth);

r.get('/', allow(...TRAINING), (req, res) => {
  const { status } = req.query;
  res.json(db.prepare(`SELECT * FROM enquiries ${status ? 'WHERE status = @status' : ''} ORDER BY created_at DESC LIMIT 500`)
    .all({ status: status || null }));
});

r.post('/', allow(...OFFICE), (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.phone) return res.status(400).json({ error: 'Name and phone are required' });
  const info = db.prepare('INSERT INTO enquiries (name, phone, village, interest, message, source, followup_date) VALUES (?,?,?,?,?,?,?)')
    .run(b.name, b.phone, b.village || null, b.interest || null, b.message || null, b.source || 'walk-in', b.followup_date || null);
  res.status(201).json({ id: info.lastInsertRowid });
});

r.patch('/:id', allow(...OFFICE), (req, res) => {
  const cur = db.prepare('SELECT * FROM enquiries WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE enquiries SET status = ?, followup_date = ?, message = ? WHERE id = ?')
    .run(req.body?.status ?? cur.status, req.body?.followup_date ?? cur.followup_date,
         req.body?.message ?? cur.message, cur.id);
  res.json({ ok: true });
});

export default r;
