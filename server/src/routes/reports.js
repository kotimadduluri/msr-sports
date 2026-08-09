import { Router } from 'express';
import db from '../db.js';
import { auth, allow, TRAINING } from '../auth.js';

const r = Router();
r.use(auth);

const month = () => new Date().toISOString().slice(0, 7);

r.get('/dashboard', allow(...TRAINING), (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const m = month();

  const students = db.prepare(`SELECT
      COUNT(*) total,
      SUM(status='active') active,
      SUM(status='active' AND gender='M') men,
      SUM(status='active' AND gender='F') women,
      SUM(join_date >= date('now','-30 days')) joined_30d
    FROM students`).get();

  const attToday = db.prepare(`SELECT
      SUM(status IN ('present','late')) present, SUM(status='absent') absent, COUNT(*) marked
    FROM attendance WHERE date = ?`).get(today);

  const fees = db.prepare(`SELECT
      COALESCE(SUM(CASE WHEN status != 'waived' THEN amount END),0) billed,
      COALESCE(SUM(CASE WHEN status IN ('unpaid','partial') THEN amount END),0) outstanding_gross
    FROM invoices WHERE period = ?`).get(m);

  // overdue counts every past-due bill, not just this month's
  const overdue = db.prepare(
    `SELECT COUNT(*) n FROM invoices WHERE status IN ('unpaid','partial') AND due_date < date('now')`).get().n;

  const collected = db.prepare(
    `SELECT COALESCE(SUM(amount),0) v FROM payments WHERE substr(paid_on,1,7) = ?`).get(m).v;
  const collectedToday = db.prepare(
    `SELECT COALESCE(SUM(amount),0) v FROM payments WHERE paid_on = ?`).get(today).v;

  const totalBilled = db.prepare(`SELECT COALESCE(SUM(amount),0) v FROM invoices WHERE status != 'waived'`).get().v;
  const totalPaid = db.prepare(`SELECT COALESCE(SUM(amount),0) v FROM payments`).get().v;

  const enquiries = db.prepare(`SELECT
      SUM(status='new') new, COUNT(*) total,
      SUM(created_at >= datetime('now','-7 days')) week
    FROM enquiries`).get();

  const batches = db.prepare(`
    SELECT b.id, b.name, b.start_time, b.end_time,
      (SELECT COUNT(*) FROM students s WHERE s.batch_id=b.id AND s.status='active') students,
      (SELECT COUNT(*) FROM attendance a WHERE a.batch_id=b.id AND a.date=?) marked
    FROM batches b WHERE b.active=1 ORDER BY b.start_time`).all(today);

  const collection = db.prepare(`
    SELECT substr(paid_on,1,7) AS period, SUM(amount) AS amount
    FROM payments WHERE paid_on >= date('now','start of month','-5 months')
    GROUP BY period ORDER BY period`).all();

  const trend = db.prepare(`
    SELECT date, SUM(status IN ('present','late')) present, COUNT(*) marked
    FROM attendance WHERE date >= date('now','-14 days')
    GROUP BY date ORDER BY date`).all();

  res.json({
    date: today, month: m,
    students,
    attendance_today: { ...attToday, pct: attToday.marked ? Math.round(attToday.present / attToday.marked * 100) : null },
    fees: {
      billed_this_month: fees.billed,
      collected_this_month: collected,
      collected_today: collectedToday,
      overdue_count: overdue,
      total_outstanding: Math.round((totalBilled - totalPaid) * 100) / 100
    },
    enquiries, batches, trend, collection
  });
});

/* Performance leaderboard for a physical event — who is ready for the PET */
r.get('/performance', allow(...TRAINING), (req, res) => {
  const event = req.query.event || '1600m Run';
  const lowerIsBetter = /run|sprint|m\b/i.test(event) && /run|sprint/i.test(event);
  const rows = db.prepare(`
    SELECT s.id, s.name, s.admission_no, s.gender, b.name AS batch_name,
      t.value, t.unit, t.date
    FROM test_records t
    JOIN students s ON s.id = t.student_id
    LEFT JOIN batches b ON b.id = s.batch_id
    WHERE t.event = @event AND t.id IN (
      SELECT MAX(id) FROM test_records WHERE event = @event GROUP BY student_id
    )
    ORDER BY t.value ${lowerIsBetter ? 'ASC' : 'DESC'} LIMIT 100`).all({ event });
  res.json({ event, lower_is_better: lowerIsBetter, rows });
});

r.get('/events', allow(...TRAINING), (_req, res) => {
  res.json(db.prepare('SELECT DISTINCT event FROM test_records ORDER BY event').all().map(r => r.event));
});

/* CSV export — for accountant / backup */
r.get('/export/:kind', allow(...TRAINING), (req, res) => {
  const queries = {
    students: `SELECT s.admission_no, s.name, s.gender, s.phone, s.guardian_phone, s.village,
                 c.name course, b.name batch, s.join_date, s.status FROM students s
               LEFT JOIN courses c ON c.id=s.course_id LEFT JOIN batches b ON b.id=s.batch_id ORDER BY s.name`,
    payments: `SELECT p.receipt_no, p.paid_on, s.admission_no, s.name, p.amount, p.mode, p.reference
               FROM payments p JOIN students s ON s.id=p.student_id ORDER BY p.paid_on DESC`,
    invoices: `SELECT i.period, s.admission_no, s.name, i.amount, i.due_date, i.status
               FROM invoices i JOIN students s ON s.id=i.student_id ORDER BY i.period DESC`,
    enquiries: `SELECT created_at, name, phone, village, interest, source, status FROM enquiries ORDER BY created_at DESC`
  };
  const sql = queries[req.params.kind];
  if (!sql) return res.status(404).json({ error: 'Unknown export' });
  const rows = db.prepare(sql).all();
  if (!rows.length) return res.type('text/csv').send('');
  const esc = v => v === null || v === undefined ? '' : `"${String(v).replace(/"/g, '""')}"`;
  const csv = [Object.keys(rows[0]).join(','), ...rows.map(r => Object.values(r).map(esc).join(','))].join('\n');
  res.setHeader('Content-Disposition', `attachment; filename="msr-${req.params.kind}-${new Date().toISOString().slice(0,10)}.csv"`);
  res.type('text/csv').send(csv);
});

export default r;
