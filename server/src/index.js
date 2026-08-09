import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import db from './db.js';
import { scheduleBackups } from './backup.js';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import catalogRoutes from './routes/catalog.js';
import attendanceRoutes from './routes/attendance.js';
import feeRoutes from './routes/fees.js';
import enquiryRoutes from './routes/enquiries.js';
import reportRoutes from './routes/reports.js';
import academyRoutes from './routes/academy.js';
import publicRoutes from './routes/public.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* First boot on a fresh database: create the admin login so the owner can
   sign in. Set ADMIN_PHONE / ADMIN_PASSWORD in the environment; otherwise a
   one-time password is generated and printed once in the logs. */
if (db.prepare('SELECT COUNT(*) n FROM users').get().n === 0) {
  const phone = process.env.ADMIN_PHONE || '9000000001';
  const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(5).toString('hex');
  db.prepare('INSERT INTO users (name, phone, password_hash, role) VALUES (?,?,?,?)')
    .run('MSR Admin', phone, bcrypt.hashSync(password, 10), 'admin');
  console.log(`[bootstrap] admin login created — phone ${phone}` +
    (process.env.ADMIN_PASSWORD ? '' : `, one-time password: ${password} (change it in Settings)`));
}

const app = express();

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'MSR Sports API', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api', catalogRoutes);              // /courses /batches /timetable
app.use('/api/attendance', attendanceRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api', academyRoutes);              // /benchmarks /expenses /selections /notices /sessions /settings /admin/backup
app.use('/api/public', publicRoutes);        // website: /selections /notices /self-check

// Serve the built web app (public site + admin) from the same server in production
const webDist = path.join(__dirname, '..', '..', 'web', 'dist');
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(webDist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  const n = db.prepare('SELECT COUNT(*) c FROM students').get().c;
  console.log(`MSR Sports API running on http://localhost:${PORT}  (${n} students in database)`);
  if (process.env.DISABLE_BACKUPS !== '1') scheduleBackups();
});
