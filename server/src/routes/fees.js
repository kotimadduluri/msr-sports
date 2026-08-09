import { Router } from 'express';
import db from '../db.js';
import { auth, allow, OFFICE, TRAINING } from '../auth.js';

const r = Router();
r.use(auth);

const today = () => new Date().toISOString().slice(0, 10);

function refreshInvoiceStatus(invoiceId) {
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
  if (!inv || inv.status === 'waived') return;
  const paid = db.prepare('SELECT COALESCE(SUM(amount),0) p FROM payments WHERE invoice_id = ?').get(invoiceId).p;
  const status = paid <= 0 ? 'unpaid' : paid + 0.001 >= inv.amount ? 'paid' : 'partial';
  db.prepare('UPDATE invoices SET status = ? WHERE id = ?').run(status, invoiceId);
}

/* Generate the month's fee bills for every active student in one click */
r.post('/generate', allow(...OFFICE), (req, res) => {
  const period = req.body?.period || today().slice(0, 7);
  const dueDay = String(req.body?.due_day || 10).padStart(2, '0');
  const due_date = `${period}-${dueDay}`;
  /* fee_override is the negotiated per-student fee (concession / scholarship) */
  const students = db.prepare(`
    SELECT s.id, s.name, COALESCE(s.fee_override, c.fee_amount) AS fee_amount, c.fee_cycle, c.name AS course_name
    FROM students s JOIN courses c ON c.id = s.course_id
    WHERE s.status = 'active' AND COALESCE(s.fee_override, c.fee_amount) > 0`).all();
  const stmt = db.prepare(`INSERT OR IGNORE INTO invoices (student_id, period, description, amount, due_date)
    VALUES (?,?,?,?,?)`);
  let created = 0;
  db.transaction(() => {
    for (const s of students) {
      const info = stmt.run(s.id, period, `${s.course_name} fee for ${period}`, s.fee_amount, due_date);
      created += info.changes;
    }
  })();
  res.json({ ok: true, period, due_date, considered: students.length, created });
});

r.get('/invoices', allow(...TRAINING), (req, res) => {
  const { status, period, q, overdue } = req.query;
  const where = [], p = {};
  if (status) { where.push('i.status = @status'); p.status = status; }
  if (period) { where.push('i.period = @period'); p.period = period; }
  if (overdue === '1') where.push("i.status IN ('unpaid','partial') AND i.due_date < date('now')");
  if (q) { where.push('(s.name LIKE @q OR s.admission_no LIKE @q OR s.phone LIKE @q)'); p.q = `%${q}%`; }
  const rows = db.prepare(`
    SELECT i.*, s.name AS student_name, s.admission_no, s.phone, s.guardian_phone, b.name AS batch_name,
      COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id = i.id),0) AS paid
    FROM invoices i
    JOIN students s ON s.id = i.student_id
    LEFT JOIN batches b ON b.id = s.batch_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY i.due_date DESC, s.name LIMIT 1000`).all(p);
  res.json(rows.map(x => ({ ...x, balance: Math.round((x.amount - x.paid) * 100) / 100 })));
});

r.post('/invoices', allow(...OFFICE), (req, res) => {
  const { student_id, period, amount, description, due_date } = req.body || {};
  if (!student_id || !period || !amount) return res.status(400).json({ error: 'Student, period and amount are required' });
  try {
    const info = db.prepare('INSERT INTO invoices (student_id, period, description, amount, due_date) VALUES (?,?,?,?,?)')
      .run(student_id, period, description || null, amount, due_date || `${period}-10`);
    res.status(201).json({ id: info.lastInsertRowid });
  } catch {
    res.status(400).json({ error: 'A bill for this student and period already exists' });
  }
});

r.patch('/invoices/:id', allow(...OFFICE), (req, res) => {
  const cur = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE invoices SET amount = ?, due_date = ?, description = ?, status = ? WHERE id = ?')
    .run(req.body?.amount ?? cur.amount, req.body?.due_date ?? cur.due_date,
         req.body?.description ?? cur.description, req.body?.status ?? cur.status, cur.id);
  if ((req.body?.status ?? cur.status) !== 'waived') refreshInvoiceStatus(cur.id);
  res.json({ ok: true });
});

/* Record a payment and get a receipt number back */
r.post('/payments', allow(...OFFICE), (req, res) => {
  const { student_id, invoice_id, amount, mode = 'cash', reference, paid_on, notes } = req.body || {};
  if (!student_id || !amount) return res.status(400).json({ error: 'Student and amount are required' });
  const year = new Date().getFullYear();
  const last = db.prepare("SELECT receipt_no FROM payments WHERE receipt_no LIKE ? ORDER BY id DESC LIMIT 1").get(`R${year}%`);
  const receipt_no = `R${year}${String(last ? parseInt(last.receipt_no.slice(-5), 10) + 1 : 1).padStart(5, '0')}`;
  const info = db.prepare(`INSERT INTO payments (student_id, invoice_id, receipt_no, amount, mode, reference, paid_on, collected_by, notes)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(student_id, invoice_id || null, receipt_no, amount, mode,
      reference || null, paid_on || today(), req.user.id, notes || null);
  if (invoice_id) refreshInvoiceStatus(invoice_id);
  res.status(201).json({ id: info.lastInsertRowid, receipt_no });
});

r.get('/payments', allow(...TRAINING), (req, res) => {
  const { from, to } = req.query;
  const rows = db.prepare(`
    SELECT p.*, s.name AS student_name, s.admission_no, u.name AS collected_by_name
    FROM payments p JOIN students s ON s.id = p.student_id
    LEFT JOIN users u ON u.id = p.collected_by
    WHERE (@from IS NULL OR p.paid_on >= @from) AND (@to IS NULL OR p.paid_on <= @to)
    ORDER BY p.paid_on DESC, p.id DESC LIMIT 1000`).all({ from: from || null, to: to || null });
  res.json(rows);
});

/* Receipt payload for printing / WhatsApp */
r.get('/payments/:id/receipt', allow(...TRAINING), (req, res) => {
  const p = db.prepare(`
    SELECT p.*, s.name AS student_name, s.admission_no, s.phone, s.guardian_name,
           c.name AS course_name, i.period, i.description
    FROM payments p JOIN students s ON s.id = p.student_id
    LEFT JOIN courses c ON c.id = s.course_id
    LEFT JOIN invoices i ON i.id = p.invoice_id
    WHERE p.id = ?`).get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Receipt not found' });
  const academy = Object.fromEntries(db.prepare('SELECT key, value FROM settings').all().map(s => [s.key, s.value]));
  res.json({ ...p, academy });
});

export default r;
