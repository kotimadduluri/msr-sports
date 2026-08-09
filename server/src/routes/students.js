import { Router } from 'express';
import db from '../db.js';
import { auth, allow, OFFICE, TRAINING } from '../auth.js';
import { judge } from '../readiness.js';

const r = Router();
r.use(auth);

function nextAdmissionNo() {
  const year = new Date().getFullYear();
  const row = db
    .prepare("SELECT admission_no FROM students WHERE admission_no LIKE ? ORDER BY id DESC LIMIT 1")
    .get(`MSR${year}%`);
  const seq = row ? parseInt(row.admission_no.slice(-4), 10) + 1 : 1;
  return `MSR${year}${String(seq).padStart(4, '0')}`;
}

const SELECT = `
  SELECT s.*, c.name AS course_name, c.fee_amount, b.name AS batch_name, b.start_time, b.end_time
  FROM students s
  LEFT JOIN courses c ON c.id = s.course_id
  LEFT JOIN batches b ON b.id = s.batch_id`;

r.get('/', allow(...TRAINING), (req, res) => {
  const { q, batch_id, course_id, status, gender, limit = 500, offset = 0 } = req.query;
  const where = [];
  const params = {};
  if (q) { where.push('(s.name LIKE @q OR s.phone LIKE @q OR s.admission_no LIKE @q OR s.village LIKE @q)'); params.q = `%${q}%`; }
  if (batch_id) { where.push('s.batch_id = @batch_id'); params.batch_id = batch_id; }
  if (course_id) { where.push('s.course_id = @course_id'); params.course_id = course_id; }
  if (status) { where.push('s.status = @status'); params.status = status; }
  if (gender) { where.push('s.gender = @gender'); params.gender = gender; }
  const sql = `${SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY s.name LIMIT @limit OFFSET @offset`;
  const rows = db.prepare(sql).all({ ...params, limit: Number(limit), offset: Number(offset) });
  const total = db.prepare(`SELECT COUNT(*) n FROM students s ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`).get(params).n;
  res.json({ total, students: rows });
});

r.get('/:id', allow(...TRAINING), (req, res) => {
  const s = db.prepare(`${SELECT} WHERE s.id = ?`).get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Student not found' });

  const attendance = db.prepare(
    `SELECT date, status FROM attendance WHERE student_id = ? ORDER BY date DESC LIMIT 60`
  ).all(s.id);
  const summary = db.prepare(
    `SELECT COUNT(*) total, SUM(status='present' OR status='late') present FROM attendance WHERE student_id = ?`
  ).get(s.id);
  const invoices = db.prepare('SELECT * FROM invoices WHERE student_id = ? ORDER BY period DESC').all(s.id);
  const payments = db.prepare('SELECT * FROM payments WHERE student_id = ? ORDER BY paid_on DESC').all(s.id);
  const tests = db.prepare('SELECT * FROM test_records WHERE student_id = ? ORDER BY date DESC').all(s.id);
  const billed = invoices.filter(i => i.status !== 'waived').reduce((a, i) => a + i.amount, 0);
  const paid = payments.reduce((a, p) => a + p.amount, 0);

  /* readiness: latest result per event judged against the cut-offs */
  const latestByEvent = {};
  for (const t of tests) if (!latestByEvent[t.event]) latestByEvent[t.event] = t; // tests already newest-first
  const readiness = Object.values(latestByEvent).map(t => ({
    event: t.event, value: t.value, unit: t.unit, date: t.date,
    targets: judge({ event: t.event, gender: s.gender, exam: s.target_exam || undefined, value: t.value, unit: t.unit })
  })).filter(x => x.targets.length);

  res.json({
    ...s,
    attendance,
    attendance_pct: summary.total ? Math.round((summary.present / summary.total) * 100) : null,
    invoices, payments, tests, readiness,
    balance: Math.round((billed - paid) * 100) / 100
  });
});

r.post('/', allow(...OFFICE), (req, res) => {
  const b = req.body || {};
  if (!b.name) return res.status(400).json({ error: 'Student name is required' });
  const admission_no = b.admission_no || nextAdmissionNo();
  const info = db.prepare(`INSERT INTO students
    (admission_no,name,gender,dob,phone,guardian_name,guardian_phone,address,village,aadhaar_last4,
     course_id,batch_id,join_date,status,height_cm,chest_cm,chest_expanded_cm,weight_kg,target_exam,notes)
    VALUES (@admission_no,@name,@gender,@dob,@phone,@guardian_name,@guardian_phone,@address,@village,@aadhaar_last4,
     @course_id,@batch_id,@join_date,@status,@height_cm,@chest_cm,@chest_expanded_cm,@weight_kg,@target_exam,@notes)`)
    .run({
      admission_no, name: b.name, gender: b.gender || 'M', dob: b.dob || null, phone: b.phone || null,
      guardian_name: b.guardian_name || null, guardian_phone: b.guardian_phone || null,
      address: b.address || null, village: b.village || null, aadhaar_last4: b.aadhaar_last4 || null,
      course_id: b.course_id || null, batch_id: b.batch_id || null,
      join_date: b.join_date || new Date().toISOString().slice(0, 10),
      status: b.status || 'active', height_cm: b.height_cm || null, chest_cm: b.chest_cm || null,
      chest_expanded_cm: b.chest_expanded_cm || null, weight_kg: b.weight_kg || null,
      target_exam: b.target_exam || null, notes: b.notes || null
    });
  res.status(201).json({ id: info.lastInsertRowid, admission_no });
});

r.patch('/:id', allow(...OFFICE), (req, res) => {
  const cur = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Student not found' });
  const fields = ['name','gender','dob','phone','guardian_name','guardian_phone','address','village',
    'aadhaar_last4','course_id','batch_id','join_date','status','height_cm','chest_cm',
    'chest_expanded_cm','weight_kg','target_exam','notes','photo_url',
    'fee_override','preferred_lang','availability_note','leave_reason'];
  if (req.body?.status && req.body.status !== 'active' && cur.status === 'active' && !req.body.leave_reason) {
    return res.status(400).json({ error: 'Add a short reason when moving a student out of active' });
  }
  const merged = {};
  for (const f of fields) merged[f] = req.body?.[f] !== undefined ? req.body[f] : cur[f];
  db.prepare(`UPDATE students SET ${fields.map(f => `${f} = @${f}`).join(', ')} WHERE id = @id`)
    .run({ ...merged, id: cur.id });
  res.json({ ok: true });
});

r.delete('/:id', allow('admin'), (req, res) => {
  db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

/* Test day: one event, one batch, every result in a single save.
   Registered before /:id/tests so Express never reads "tests" as an id. */
r.post('/tests/bulk', allow(...TRAINING), (req, res) => {
  const { event, unit = 'sec', date, entries } = req.body || {};
  if (!event || !Array.isArray(entries) || !entries.length) {
    return res.status(400).json({ error: 'Pick an event and enter at least one result' });
  }
  const clean = entries.filter(e => e.student_id && isFinite(Number(e.value)) && Number(e.value) > 0);
  if (!clean.length) return res.status(400).json({ error: 'No valid results to save' });
  const stmt = db.prepare(
    'INSERT INTO test_records (student_id, date, event, value, unit, recorded_by) VALUES (?,?,?,?,?,?)');
  const day = date || new Date().toISOString().slice(0, 10);
  db.transaction(() => {
    for (const e of clean) stmt.run(e.student_id, day, event, Number(e.value), unit, req.user.id);
  })();
  res.status(201).json({ ok: true, saved: clean.length, event, date: day });
});

/* Everything the monthly progress card needs, in one payload. */
r.get('/:id/progress-card', allow(...TRAINING), (req, res) => {
  const s = db.prepare(`${SELECT} WHERE s.id = ?`).get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Student not found' });
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const prev = new Date(`${month}-01T00:00:00Z`);
  prev.setUTCMonth(prev.getUTCMonth() - 1);
  const prevMonth = prev.toISOString().slice(0, 7);

  const att = db.prepare(`
    SELECT COUNT(*) total, SUM(status IN ('present','late')) present
    FROM attendance WHERE student_id = ? AND substr(date,1,7) = ?`).get(s.id, month);

  const bestIn = (m) => db.prepare(`
    SELECT event, unit,
      MIN(CASE WHEN unit = 'sec' THEN value END) best_low,
      MAX(CASE WHEN unit != 'sec' THEN value END) best_high
    FROM test_records WHERE student_id = ? AND substr(date,1,7) = ? GROUP BY event, unit`).all(s.id, m)
    .map(rw => ({ event: rw.event, unit: rw.unit, value: rw.unit === 'sec' ? rw.best_low : rw.best_high }));

  const thisM = bestIn(month), prevM = bestIn(prevMonth);
  const events = thisM.map(t => {
    const before = prevM.find(p => p.event === t.event);
    return {
      ...t,
      prev: before?.value ?? null,
      delta: before ? Math.round((t.value - before.value) * 100) / 100 : null,
      targets: judge({ event: t.event, gender: s.gender, exam: s.target_exam || undefined, value: t.value, unit: t.unit })
    };
  });

  const billed = db.prepare(
    "SELECT COALESCE(SUM(amount),0) v FROM invoices WHERE student_id = ? AND status != 'waived'").get(s.id).v;
  const paid = db.prepare('SELECT COALESCE(SUM(amount),0) v FROM payments WHERE student_id = ?').get(s.id).v;
  const academy = Object.fromEntries(db.prepare('SELECT key, value FROM settings').all().map(x => [x.key, x.value]));

  res.json({
    month,
    student: { id: s.id, name: s.name, admission_no: s.admission_no, gender: s.gender,
      course_name: s.course_name, batch_name: s.batch_name, target_exam: s.target_exam,
      guardian_phone: s.guardian_phone, phone: s.phone, preferred_lang: s.preferred_lang || 'te' },
    attendance: { total: att.total, present: att.present || 0,
      pct: att.total ? Math.round(att.present / att.total * 100) : null },
    events,
    balance: Math.round((billed - paid) * 100) / 100,
    academy
  });
});

// Physical performance records (1600m, long jump, shot put ...)
r.post('/:id/tests', allow(...TRAINING), (req, res) => {
  const { event, value, unit = 'sec', date, remarks } = req.body || {};
  if (!event || value === undefined) return res.status(400).json({ error: 'Event and value are required' });
  const info = db.prepare(
    'INSERT INTO test_records (student_id, date, event, value, unit, remarks, recorded_by) VALUES (?,?,?,?,?,?,?)'
  ).run(req.params.id, date || new Date().toISOString().slice(0, 10), event, value, unit, remarks || null, req.user.id);
  res.status(201).json({ id: info.lastInsertRowid });
});

export default r;
