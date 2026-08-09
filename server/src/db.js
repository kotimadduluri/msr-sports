import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

export const DB_PATH = path.join(DATA_DIR, 'msr.db');
export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',            -- admin | staff | coach | student
  student_id INTEGER,                             -- set when role = 'student'
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,                             -- e.g. AP Police Constable (PET + Written)
  category TEXT NOT NULL DEFAULT 'govt-job',      -- govt-job | sport | fitness
  description TEXT,
  duration_months INTEGER DEFAULT 6,
  fee_amount REAL NOT NULL DEFAULT 0,
  fee_cycle TEXT NOT NULL DEFAULT 'monthly',      -- monthly | quarterly | one-time
  admission_fee REAL NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,                             -- Morning Ground A
  course_id INTEGER REFERENCES courses(id),
  coach_id INTEGER REFERENCES users(id),
  days TEXT NOT NULL DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat',
  start_time TEXT NOT NULL DEFAULT '05:30',
  end_time TEXT NOT NULL DEFAULT '08:00',
  venue TEXT DEFAULT 'MSR Ground, Chirala',
  capacity INTEGER DEFAULT 60,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admission_no TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  gender TEXT NOT NULL DEFAULT 'M',               -- M | F
  dob TEXT,
  phone TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  address TEXT,
  village TEXT,
  aadhaar_last4 TEXT,
  photo_url TEXT,
  course_id INTEGER REFERENCES courses(id),
  batch_id INTEGER REFERENCES batches(id),
  join_date TEXT NOT NULL DEFAULT (date('now')),
  status TEXT NOT NULL DEFAULT 'active',          -- active | on-hold | dropped | passed-out
  height_cm REAL,
  chest_cm REAL,
  chest_expanded_cm REAL,
  weight_kg REAL,
  target_exam TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  batch_id INTEGER REFERENCES batches(id),
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'present',         -- present | absent | leave | late
  marked_by INTEGER REFERENCES users(id),
  UNIQUE(student_id, date)
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  period TEXT NOT NULL,                           -- 2026-08  or  ADMISSION
  description TEXT,
  amount REAL NOT NULL,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unpaid',          -- unpaid | partial | paid | waived
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(student_id, period)
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  invoice_id INTEGER REFERENCES invoices(id),
  receipt_no TEXT UNIQUE NOT NULL,
  amount REAL NOT NULL,
  mode TEXT NOT NULL DEFAULT 'cash',              -- cash | upi | card | bank
  reference TEXT,
  paid_on TEXT NOT NULL DEFAULT (date('now')),
  collected_by INTEGER REFERENCES users(id),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS enquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  village TEXT,
  interest TEXT,                                  -- course name / exam
  message TEXT,
  source TEXT DEFAULT 'website',                  -- website | walk-in | phone | referral
  status TEXT NOT NULL DEFAULT 'new',             -- new | contacted | visited | joined | lost
  followup_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Physical performance tracking: the core of govt-job PET coaching
CREATE TABLE IF NOT EXISTS test_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date TEXT NOT NULL DEFAULT (date('now')),
  event TEXT NOT NULL,                            -- 1600m Run, 800m Run, Long Jump, Shot Put, 100m Sprint, High Jump, Pull-ups
  value REAL NOT NULL,                            -- seconds or metres or count
  unit TEXT NOT NULL DEFAULT 'sec',               -- sec | m | count
  remarks TEXT,
  recorded_by INTEGER REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Official PET cut-offs per exam/event/gender. Seeded with editable defaults;
-- the office must verify them against the current notification (Academy page).
CREATE TABLE IF NOT EXISTS benchmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam TEXT NOT NULL,                             -- AP Police Constable, Indian Army GD ...
  event TEXT NOT NULL,                            -- matches test_records.event
  gender TEXT NOT NULL DEFAULT 'M',               -- M | F
  value REAL NOT NULL,                            -- qualifying mark
  unit TEXT NOT NULL DEFAULT 'sec',               -- sec (lower is better) | m | count (higher)
  note TEXT,
  UNIQUE(exam, event, gender)
);

-- Money going out — the other half of the ledger
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL DEFAULT (date('now')),
  category TEXT NOT NULL DEFAULT 'other',         -- rent | salaries | equipment | electricity | maintenance | transport | other
  description TEXT,
  amount REAL NOT NULL,
  recorded_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Students who cleared a recruitment — the academy's public success wall
CREATE TABLE IF NOT EXISTS selections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  exam TEXT NOT NULL,                             -- AP Police Constable, Indian Army GD ...
  year INTEGER NOT NULL,
  village TEXT,
  photo_url TEXT,
  notes TEXT,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Recruitment notification updates shown on the public site
CREATE TABLE IF NOT EXISTS notices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT,
  exam TEXT,
  link TEXT,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One line per batch per day: what the session actually was
CREATE TABLE IF NOT EXISTS session_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  note TEXT NOT NULL,
  coach_id INTEGER REFERENCES users(id),
  UNIQUE(batch_id, date)
);

CREATE INDEX IF NOT EXISTS idx_att_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_att_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_inv_student ON invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_students_batch ON students(batch_id);
CREATE INDEX IF NOT EXISTS idx_test_student ON test_records(student_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
`);

/* Column migrations for databases created before these fields existed. */
const cols = table => db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
const addColumn = (table, name, ddl) => {
  if (!cols(table).includes(name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
};
addColumn('students', 'fee_override', 'fee_override REAL');                          // negotiated monthly fee
addColumn('students', 'preferred_lang', "preferred_lang TEXT NOT NULL DEFAULT 'te'"); // WhatsApp message language
addColumn('students', 'availability_note', 'availability_note TEXT');                 // "knee — no running this week"
addColumn('students', 'leave_reason', 'leave_reason TEXT');                           // why they went on-hold/dropped

/* Default cut-offs, inserted once. These are training targets to edit against
   the current official notification — not authoritative recruitment data. */
if (db.prepare('SELECT COUNT(*) n FROM benchmarks').get().n === 0) {
  const ins = db.prepare('INSERT INTO benchmarks (exam, event, gender, value, unit, note) VALUES (?,?,?,?,?,?)');
  const NOTE = 'Default target — verify against the current notification';
  db.transaction(() => {
    ins.run('AP Police Constable', '1600m Run', 'M', 360, 'sec', NOTE);
    ins.run('AP Police Constable', '100m Sprint', 'M', 15, 'sec', NOTE);
    ins.run('AP Police Constable', 'Long Jump', 'M', 3.8, 'm', NOTE);
    ins.run('AP Police Constable', 'Shot Put (7.26kg)', 'M', 5.6, 'm', NOTE);
    ins.run('AP Police Constable', '800m Run', 'F', 240, 'sec', NOTE);
    ins.run('AP Police Constable', '100m Sprint', 'F', 18, 'sec', NOTE);
    ins.run('AP Police Constable', 'Long Jump', 'F', 2.7, 'm', NOTE);
    ins.run('AP Police Constable', 'Shot Put (4kg)', 'F', 4.5, 'm', NOTE);
    ins.run('Indian Army GD', '1600m Run', 'M', 330, 'sec', NOTE);
    ins.run('Indian Army GD', 'Pull-ups', 'M', 10, 'count', NOTE);
    ins.run('SSC GD Constable', '1600m Run', 'F', 510, 'sec', NOTE);
    ins.run('SSC GD Constable', '1600m Run', 'M', 380, 'sec', NOTE);
  })();
}

export default db;
