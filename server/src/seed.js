/**
 * Seeds MSR Sports with a realistic starting dataset:
 * admin login, programmes, batches, ~220 students, 6 weeks of attendance,
 * fee bills + payments, physical test records and website enquiries.
 *
 *   npm run seed            (adds to existing data)
 *   npm run seed -- --reset (wipes and rebuilds)
 */
import bcrypt from 'bcryptjs';
import db from './db.js';

const reset = process.argv.includes('--reset');
if (reset) {
  db.exec(`DELETE FROM test_records; DELETE FROM payments; DELETE FROM invoices;
           DELETE FROM attendance; DELETE FROM students; DELETE FROM batches;
           DELETE FROM courses; DELETE FROM enquiries; DELETE FROM users; DELETE FROM settings;
           DELETE FROM sqlite_sequence;`);
}

/* deterministic pseudo-random so re-seeding gives the same demo data */
let s = 42;
const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
const pick = a => a[Math.floor(rnd() * a.length)];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const iso = d => d.toISOString().slice(0, 10);

/* ---------- settings ---------- */
const settings = {
  academy_name: 'MSR Sports Academy',
  tagline: 'Government job physical & written exam training',
  address: 'Chirala, Bapatla District, Andhra Pradesh 523155',
  phone: '+91 90000 00000',
  email: 'info@msrsports.in',
  upi_id: 'msrsports@upi'
};
const setStmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)');
for (const [k, v] of Object.entries(settings)) setStmt.run(k, v);

/* ---------- users ---------- */
const hash = p => bcrypt.hashSync(p, 10);
const mkUser = db.prepare('INSERT OR IGNORE INTO users (name, phone, email, password_hash, role) VALUES (?,?,?,?,?)');
mkUser.run('MSR Admin', '9000000001', 'admin@msrsports.in', hash('msr@2026'), 'admin');
mkUser.run('Office Staff', '9000000002', 'office@msrsports.in', hash('office@2026'), 'staff');
const coachNames = ['Ravi Kumar', 'Srinivas Rao', 'Naga Lakshmi', 'Praveen Babu'];
coachNames.forEach((n, i) => mkUser.run(n, `900000001${i}`, null, hash('coach@2026'), 'coach'));
const coaches = db.prepare("SELECT id FROM users WHERE role='coach'").all().map(c => c.id);

/* ---------- courses ---------- */
const courses = [
  { name: 'AP Police Constable (PET + Written)', category: 'govt-job', duration_months: 6, fee_amount: 1500, admission_fee: 1000,
    description: 'Ground training for the 100m, 800m/1600m run, long jump and shot put, plus daily written-exam classes for Arithmetic, Reasoning and General Studies.' },
  { name: 'AP Police SI (PET + Written)', category: 'govt-job', duration_months: 9, fee_amount: 2000, admission_fee: 1500,
    description: 'Intensive SI preparation covering physical measurement standards, all PET events and the full Paper I & II written syllabus.' },
  { name: 'Indian Army GD / Agniveer', category: 'govt-job', duration_months: 4, fee_amount: 1200, admission_fee: 800,
    description: '1.6 km timed run, pull-ups, 9-feet ditch and zig-zag balance practice with CEE written coaching.' },
  { name: 'SSC GD Constable', category: 'govt-job', duration_months: 5, fee_amount: 1200, admission_fee: 800,
    description: 'Running endurance training and complete SSC GD written preparation.' },
  { name: 'Railway RPF / RRB', category: 'govt-job', duration_months: 5, fee_amount: 1200, admission_fee: 800,
    description: 'PET and CBT coaching for RPF constable and RRB group posts.' },
  { name: 'General Fitness & Athletics', category: 'fitness', duration_months: 12, fee_amount: 800, admission_fee: 500,
    description: 'Strength, endurance and athletics training for school and college students.' }
];
const mkCourse = db.prepare(`INSERT INTO courses (name,category,description,duration_months,fee_amount,fee_cycle,admission_fee)
  VALUES (@name,@category,@description,@duration_months,@fee_amount,'monthly',@admission_fee)`);
for (const c of courses) {
  if (!db.prepare('SELECT 1 FROM courses WHERE name = ?').get(c.name)) mkCourse.run(c);
}
const courseIds = db.prepare('SELECT id, name FROM courses').all();

/* ---------- batches ---------- */
const batchDefs = [
  ['Morning Ground A (Police)', 0, '05:30', '08:00', 'MSR Ground, Chirala'],
  ['Morning Ground B (Police)', 1, '05:30', '08:00', 'MSR Ground, Chirala'],
  ['Morning Army/SSC', 2, '06:00', '08:30', 'MSR Ground, Chirala'],
  ['Evening Ground (Police)', 0, '16:30', '19:00', 'MSR Ground, Chirala'],
  ['Evening Railway/SSC', 4, '17:00', '19:30', 'MSR Ground, Chirala'],
  ['Women’s Batch', 0, '06:30', '08:30', 'MSR Ground, Chirala'],
  ['Morning Written Class', 0, '09:00', '11:00', 'MSR Study Hall, Chirala'],
  ['Fitness & Athletics (Evening)', 5, '17:30', '19:00', 'MSR Ground, Chirala']
];
const mkBatch = db.prepare(`INSERT INTO batches (name, course_id, coach_id, days, start_time, end_time, venue, capacity)
  VALUES (?,?,?,?,?,?,?,?)`);
if (db.prepare('SELECT COUNT(*) c FROM batches').get().c === 0) {
  batchDefs.forEach(([name, ci, st, et, venue], i) =>
    mkBatch.run(name, courseIds[ci].id, coaches[i % coaches.length],
      i === 6 ? 'Mon,Tue,Wed,Thu,Fri' : 'Mon,Tue,Wed,Thu,Fri,Sat', st, et, venue, 60));
}
const batches = db.prepare('SELECT id, course_id FROM batches').all();

/* ---------- students ---------- */
const maleFirst = ['Ravi','Suresh','Naveen','Anil','Kiran','Mahesh','Venkat','Sai','Rajesh','Prasad','Bhaskar','Chandu',
  'Dinesh','Gopi','Harish','Jagan','Karthik','Lokesh','Manoj','Nithin','Pavan','Ramu','Santhosh','Teja','Vamsi',
  'Yesu','Arun','Balu','Chaitanya','Eswar','Ganesh','Hemanth','Ishwar','Kalyan','Srinu','Nagendra','Rambabu'];
const femaleFirst = ['Jyothi','Lavanya','Madhavi','Nagamani','Padma','Rani','Sirisha','Swathi','Triveni','Usha',
  'Vijaya','Yamini','Sravani','Bhavani','Deepika','Anusha','Divya','Keerthi','Manasa','Pravallika','Ramya','Sandhya'];
const first = [...maleFirst, ...femaleFirst];
const last = ['Reddy','Naidu','Rao','Chowdary','Kumar','Prasad','Babu','Sekhar','Varma','Yadav','Goud','Sastry',
  'Murthy','Krishna','Mohan'];
const villages = ['Chirala','Vetapalem','Perala','Jandrapeta','Epurupalem','Ipurupalem','Karlapalem','Inkollu',
  'Parchur','Martur','Bapatla','Chinaganjam','Addanki','Ongole'];

const mkStudent = db.prepare(`INSERT INTO students
  (admission_no,name,gender,dob,phone,guardian_name,guardian_phone,address,village,course_id,batch_id,
   join_date,status,height_cm,chest_cm,chest_expanded_cm,weight_kg,target_exam)
  VALUES (@admission_no,@name,@gender,@dob,@phone,@guardian_name,@guardian_phone,@address,@village,@course_id,@batch_id,
   @join_date,@status,@height_cm,@chest_cm,@chest_expanded_cm,@weight_kg,@target_exam)`);

const TOTAL = 220;
const existing = db.prepare('SELECT COUNT(*) c FROM students').get().c;
if (existing === 0) {
  const year = new Date().getFullYear();
  db.transaction(() => {
    for (let i = 1; i <= TOTAL; i++) {
      const female = rnd() < 0.28;
      const name = `${pick(female ? femaleFirst : maleFirst)} ${pick(last)}`;
      const batch = female && rnd() < 0.7
        ? batches[5]
        : pick(batches.filter(b => b.id !== batches[5].id));
      const joinBack = int(0, 400);
      const jd = new Date(Date.now() - joinBack * 86400000);
      const status = rnd() < 0.86 ? 'active' : pick(['on-hold', 'dropped', 'passed-out']);
      mkStudent.run({
        admission_no: `MSR${year}${String(i).padStart(4, '0')}`,
        name, gender: female ? 'F' : 'M',
        dob: iso(new Date(Date.UTC(year - int(18, 26), int(0, 11), int(1, 28)))),
        phone: `9${int(100000000, 999999999)}`,
        guardian_name: `${pick(first)} ${pick(last)}`,
        guardian_phone: `8${int(100000000, 999999999)}`,
        address: `D.No ${int(1, 12)}-${int(1, 99)}, ${pick(['Gandhi Road','Bazar Street','Ramalayam Street','NH-216 Road','Church Street'])}`,
        village: pick(villages),
        course_id: batch.course_id,
        batch_id: batch.id,
        join_date: iso(jd),
        status,
        height_cm: female ? int(150, 172) : int(162, 186),
        chest_cm: female ? null : int(76, 92),
        chest_expanded_cm: female ? null : int(81, 98),
        weight_kg: female ? int(44, 68) : int(52, 84),
        target_exam: null
      });
    }
  })();
  /* about a quarter of the academy stays in the hostel — billed separately */
  db.prepare("UPDATE students SET hostel_fee = 1500 WHERE status = 'active' AND id % 4 = 0").run();
}

const students = db.prepare("SELECT id, batch_id, gender, join_date, status FROM students").all();
const activeStudents = students.filter(s => s.status === 'active');

/* ---------- attendance: last 42 days ---------- */
if (db.prepare('SELECT COUNT(*) c FROM attendance').get().c === 0) {
  const mkAtt = db.prepare(`INSERT OR IGNORE INTO attendance (student_id, batch_id, date, status, marked_by)
    VALUES (?,?,?,?,1)`);
  db.transaction(() => {
    for (let d = 42; d >= 1; d--) {
      const day = new Date(Date.now() - d * 86400000);
      if (day.getDay() === 0) continue;               // Sunday off
      const date = iso(day);
      for (const st of activeStudents) {
        if (st.join_date > date) continue;
        const roll = rnd();
        const status = roll < 0.78 ? 'present' : roll < 0.85 ? 'late' : roll < 0.94 ? 'absent' : 'leave';
        mkAtt.run(st.id, st.batch_id, date, status);
      }
    }
  })();
}

/* ---------- fee bills + payments for the last 4 months ---------- */
if (db.prepare('SELECT COUNT(*) c FROM invoices').get().c === 0) {
  const mkInv = db.prepare(`INSERT OR IGNORE INTO invoices (student_id, period, description, amount, due_date, status, type)
    VALUES (?,?,?,?,?,?,?)`);
  const mkPay = db.prepare(`INSERT INTO payments (student_id, invoice_id, receipt_no, amount, mode, paid_on, collected_by)
    VALUES (?,?,?,?,?,?,1)`);
  const feeOf = Object.fromEntries(db.prepare('SELECT id, fee_amount, name FROM courses').all().map(c => [c.id, c]));
  const stu = db.prepare('SELECT id, course_id, join_date, status, hostel_fee FROM students').all();
  let receipt = 1;
  const settle = (st, invId, amount, period, payProb) => {
    const roll = rnd();
    if (roll >= payProb) return;
    const partial = rnd() < 0.08;
    const amt = partial ? Math.round(amount / 2) : amount;
    mkPay.run(st.id, invId, `R${new Date().getFullYear()}${String(receipt++).padStart(5, '0')}`,
      amt, pick(['cash', 'upi', 'upi', 'bank']), `${period}-${String(int(1, 26)).padStart(2, '0')}`);
    db.prepare('UPDATE invoices SET status = ? WHERE id = ?').run(partial ? 'partial' : 'paid', invId);
  };
  db.transaction(() => {
    for (let back = 3; back >= 0; back--) {
      const d = new Date(); d.setMonth(d.getMonth() - back);
      const period = d.toISOString().slice(0, 7);
      const payProb = back === 0 ? 0.55 : back === 1 ? 0.86 : 0.95;
      for (const st of stu) {
        const course = feeOf[st.course_id];
        if (!course || !course.fee_amount) continue;
        if (st.join_date.slice(0, 7) > period) continue;
        if (st.status !== 'active' && back < 2) continue;
        mkInv.run(st.id, period, `${course.name} fee for ${period}`, course.fee_amount, `${period}-10`, 'unpaid', 'training');
        const inv = db.prepare("SELECT id, amount FROM invoices WHERE student_id=? AND period=? AND type='training'").get(st.id, period);
        settle(st, inv.id, inv.amount, period, payProb);
        if (st.hostel_fee) {
          mkInv.run(st.id, period, `Hostel fee for ${period}`, st.hostel_fee, `${period}-10`, 'unpaid', 'hostel');
          const hinv = db.prepare("SELECT id, amount FROM invoices WHERE student_id=? AND period=? AND type='hostel'").get(st.id, period);
          settle(st, hinv.id, hinv.amount, period, payProb);
        }
      }
    }
  })();
}

/* ---------- physical test records ---------- */
if (db.prepare('SELECT COUNT(*) c FROM test_records').get().c === 0) {
  const mkTest = db.prepare('INSERT INTO test_records (student_id, date, event, value, unit, recorded_by) VALUES (?,?,?,?,?,1)');
  db.transaction(() => {
    for (const st of activeStudents) {
      for (let round = 2; round >= 0; round--) {
        const date = iso(new Date(Date.now() - round * 30 * 86400000));
        const improve = (2 - round) * 0.04;           // students get faster over time
        if (st.gender === 'M') {
          mkTest.run(st.id, date, '1600m Run', +(int(330, 470) * (1 - improve)).toFixed(1), 'sec');
          mkTest.run(st.id, date, 'Long Jump', +(int(300, 480) / 100 * (1 + improve)).toFixed(2), 'm');
          mkTest.run(st.id, date, 'Shot Put (7.26kg)', +(int(500, 950) / 100 * (1 + improve)).toFixed(2), 'm');
        } else {
          mkTest.run(st.id, date, '800m Run', +(int(180, 300) * (1 - improve)).toFixed(1), 'sec');
          mkTest.run(st.id, date, 'Long Jump', +(int(200, 340) / 100 * (1 + improve)).toFixed(2), 'm');
          mkTest.run(st.id, date, 'Shot Put (4kg)', +(int(400, 750) / 100 * (1 + improve)).toFixed(2), 'm');
        }
        mkTest.run(st.id, date, '100m Sprint', +(int(120, 175) / 10 * (1 - improve)).toFixed(2), 'sec');
      }
    }
  })();
}

/* ---------- enquiries ---------- */
if (db.prepare('SELECT COUNT(*) c FROM enquiries').get().c === 0) {
  const mkEnq = db.prepare(`INSERT INTO enquiries (name, phone, village, interest, message, source, status, created_at)
    VALUES (?,?,?,?,?,?,?,?)`);
  db.transaction(() => {
    for (let i = 0; i < 40; i++) {
      const back = int(0, 45);
      mkEnq.run(`${pick(first)} ${pick(last)}`, `7${int(100000000, 999999999)}`, pick(villages),
        pick(courses).name, pick(['Please call me about fees and timings.', 'I want to join the morning batch.',
          'Is hostel facility available?', 'When does the next batch start?', null]),
        pick(['website', 'website', 'phone', 'walk-in', 'referral']),
        back < 5 ? 'new' : pick(['contacted', 'visited', 'joined', 'lost', 'contacted']),
        new Date(Date.now() - back * 86400000).toISOString().slice(0, 19).replace('T', ' '));
    }
  })();
}

const c = k => db.prepare(`SELECT COUNT(*) c FROM ${k}`).get().c;
console.log(`Seeded MSR Sports:
  users        ${c('users')}
  courses      ${c('courses')}
  batches      ${c('batches')}
  students     ${c('students')}
  attendance   ${c('attendance')}
  invoices     ${c('invoices')}
  payments     ${c('payments')}
  test records ${c('test_records')}
  enquiries    ${c('enquiries')}

Login:  9000000001 / msr@2026   (admin)
        9000000002 / office@2026 (staff)`);
