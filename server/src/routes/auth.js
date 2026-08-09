import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { sign, auth, allow, ADMIN } from '../auth.js';

const r = Router();

/* Brute-force guard: 10 failed logins per IP per 15 minutes. */
const failures = new Map(); // ip -> { count, since }
const FAIL_LIMIT = 10, FAIL_WINDOW_MS = 15 * 60 * 1000;
function throttled(ip) {
  const a = failures.get(ip);
  if (!a || Date.now() - a.since > FAIL_WINDOW_MS) return false;
  return a.count >= FAIL_LIMIT;
}
function recordFailure(ip) {
  const a = failures.get(ip);
  if (!a || Date.now() - a.since > FAIL_WINDOW_MS) failures.set(ip, { count: 1, since: Date.now() });
  else a.count += 1;
}

r.post('/login', (req, res) => {
  if (throttled(req.ip)) return res.status(429).json({ error: 'Too many attempts — wait a few minutes and try again' });
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Enter username and password' });
  const user = db
    .prepare('SELECT * FROM users WHERE (phone = ? OR email = ?) AND active = 1')
    .get(String(username).trim(), String(username).trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    recordFailure(req.ip);
    return res.status(401).json({ error: 'Wrong username or password' });
  }
  failures.delete(req.ip);
  res.json({
    token: sign(user),
    user: { id: user.id, name: user.name, role: user.role, phone: user.phone, email: user.email }
  });
});

r.get('/me', auth, (req, res) => res.json({ user: req.user }));

r.post('/change-password', auth, (req, res) => {
  const { current, next } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user || !bcrypt.compareSync(current || '', user.password_hash)) {
    return res.status(400).json({ error: 'Current password is wrong' });
  }
  if (!next || next.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(next, 10), user.id);
  res.json({ ok: true });
});

// Staff / coach account management — the hook for extending beyond admin-only
r.get('/users', auth, allow(...ADMIN), (_req, res) => {
  res.json(db.prepare('SELECT id, name, phone, email, role, active, created_at FROM users ORDER BY id').all());
});

r.post('/users', auth, allow(...ADMIN), (req, res) => {
  const { name, phone, email, password, role = 'staff', student_id = null } = req.body || {};
  if (!name || !phone || !password) return res.status(400).json({ error: 'Name, phone and password are required' });
  if (!['admin', 'staff', 'coach', 'student'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  try {
    const info = db
      .prepare('INSERT INTO users (name, phone, email, password_hash, role, student_id) VALUES (?,?,?,?,?,?)')
      .run(name, phone, email || null, bcrypt.hashSync(password, 10), role, student_id);
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: 'Phone or email already in use' });
  }
});

r.patch('/users/:id', auth, allow(...ADMIN), (req, res) => {
  const { name, role, active, password } = req.body || {};
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!u) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE users SET name = ?, role = ?, active = ? WHERE id = ?').run(
    name ?? u.name, role ?? u.role, active ?? u.active, u.id
  );
  if (password) db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(password, 10), u.id);
  res.json({ ok: true });
});

export default r;
