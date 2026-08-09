# MSR Sports Academy — project context

Read this before changing anything. It is the handover from the session that
built the project: what it is, why it is shaped this way, and the traps that
already cost time once.

---

## 1. What this is

A management system for **MSR Sports Academy, Chirala, Bapatla District, Andhra
Pradesh**. It is *not* a general sports academy — it coaches candidates for
**Indian government job recruitment**: the physical tests (PET/PMT) and the
written exams, together.

Programmes: AP Police Constable, AP Police SI, Indian Army GD / Agniveer,
SSC GD, Railway RPF/RRB, plus a general fitness batch.

Who uses it:

| Part | Users | Route |
|---|---|---|
| Public website | Students and parents in and around Chirala | `/` |
| Admin app | The owner and office staff | `/app` |
| API | Both | `/api` |

Scale to design for: **200+ students**, one location, morning and evening
batches, monthly cash/UPI fees. Owner is not technical. The office runs on a
phone as much as a desktop.

### The thing that makes it worth building
Generic academy software tracks attendance and fees. It does **not** track
1600m timings, long jump and shot put month over month. For a PET academy that
record *is* the product — it tells a student how far they are from the cut-off.
`test_records` and the Performance screen are the differentiator. Do not treat
them as a side feature.

---

## 2. Stack, and why

- **Backend** — Node 18+, Express, **SQLite via better-sqlite3**, JWT auth.
  SQLite because the whole academy fits in one file that can be copied to Google
  Drive nightly. For a 200-student academy on a ₹500/month VPS, Postgres would
  be operational burden with no benefit. Revisit only at multi-branch.
- **Frontend** — React 18, Vite, React Router, Tailwind. No component library,
  no chart library (see §5).
- **Delivery** — a PWA, installable from Chrome with *Add to Home screen*. This
  is deliberately not a native app: no Play Store review, no second codebase,
  no build tooling for Android. Capacitor can wrap the same build later if a
  store listing is ever wanted.

Everything is plain JavaScript, ESM (`"type": "module"`). No TypeScript — a
decision to keep the project approachable for whoever maintains it next. If you
add TS, do it in one deliberate pass, not file by file.

---

## 3. Layout

```
server/
  src/db.js            schema + connection (schema is inline SQL, no migration tool yet)
  src/auth.js          JWT signing, `auth` middleware, `allow(...roles)` gate
  src/routes/
    auth.js            login, change password, staff/coach account management
    students.js        CRUD, detail aggregate, physical test records
    catalog.js         courses, batches, weekly timetable
    attendance.js      roll-call sheet, bulk mark, monthly grid, absentee list
    fees.js            invoice generation, payments, receipts
    enquiries.js       PUBLIC website form + admin pipeline
    reports.js         dashboard aggregate, performance leaderboard, CSV export
  src/seed.js          deterministic demo data generator
web/
  src/api.js           API client, demo switch, ₹/date formatting helpers
  src/mockApi.js       in-memory backend for the demo build (see §6)
  src/icons.jsx        the icon set + logo
  src/components.jsx   Toast, Loading, Empty, Stat, Badge, Segmented, Modal, Field, PageHead
  src/charts.jsx       TrendLine, Columns, Spark, HeatStrip
  src/pages/           Site (public), Login, Layout, and one file per admin screen
```

---

## 4. Data model notes

Tables: `users, courses, batches, students, attendance, invoices, payments,
enquiries, test_records, settings`.

- `students.admission_no` is generated as `MSR<year><4-digit seq>`, e.g.
  `MSR20260001`. Users read this out over the phone — never change the format.
- `attendance` has `UNIQUE(student_id, date)`. Marking is an upsert
  (`ON CONFLICT ... DO UPDATE`), so re-saving a roll call is safe.
- `invoices` has `UNIQUE(student_id, period)`. `POST /api/fees/generate` uses
  `INSERT OR IGNORE`, so clicking "generate bills" twice cannot double-bill.
  That property is load-bearing — keep it.
- Invoice status is **derived** from payments by `refreshInvoiceStatus()`, never
  set by hand except for `waived`.
- Money is stored as `REAL` rupees. Fine at this scale; if it ever grows, move
  to integer paise in one migration rather than patching rounding.

### Roles
`admin`, `staff`, `coach`, `student` all exist in the schema and are enforced on
every route via `allow(...)`. Only admin/staff logins are created today. Opening
the app to coaches (mark attendance on their own phone) or parents (see
attendance and fee balance) is **new screens, not a rewrite**. `OFFICE` =
admin+staff, `TRAINING` = admin+staff+coach.

---

## 5. Front-end conventions

Follow these; they are why the UI looks like one product.

- **Colour** — `msr` (navy brand), `saffron` (accent, used sparingly), `ink`
  (warm neutral text/surfaces). Chart colours are separate (`series`, `good`,
  `warn`, `critical`) and were validated for colour-blindness and contrast.
  Never use a raw Tailwind `slate-*`/`blue-*` — it will look off.
- **Components before markup.** Reach for `PageHead`, `Stat`, `Badge`,
  `Segmented`, `Modal`, `Field`, `Loading`, `Empty` rather than hand-rolling.
  New page = `PageHead` + `Segmented` (if tabbed) + cards.
- **Icons** are inline SVG in `icons.jsx`, one stroke weight, 24px grid.
  No emoji in the UI.
- **Touch** — `.btn` is min 44px tall. Keep it. This app is used outdoors at
  5:30 AM on a phone.
- **Loading** — skeletons (`<Loading rows={n} />`), not spinners.
- **Charts are hand-built SVG** in `charts.jsx`. Recharts was removed: it cost
  ~100KB gzipped and fought the design spec. Rules if you add one — 2px lines,
  hairline solid grid, ≥8px end markers ringed in the surface colour, bars
  capped at 28px with a 4px rounded cap, no legend for a single series, text in
  ink tokens (never the series colour), hover tooltip by default.
- **Status is never colour alone** — `Badge` pairs a dot with the word.

---

## 6. Demo mode — read before touching `api.js`

`VITE_DEMO=1` makes `api.js` swap the live fetch client for `mockApi.js`, an
in-memory backend over `demoData.json` (a snapshot of the seeded database). The
**same React app** then runs as a static site with no server. That is what gets
published for review — it is the product, not a mock-up.

Two mechanisms make this clean, and both are easy to break:

1. `api.js` uses **top-level `await import('./mockApi.js')` inside
   `if (isDemo)`**. Rollup dead-code-eliminates it in the live build, so the
   demo backend and its ~880KB of JSON are **completely absent** from
   production. `vite.config.js` sets `build.target: 'esnext'` for this. If you
   convert it to a static import, the live bundle balloons.
2. The demo uses **HashRouter** (`main.jsx`) so deep links work on any static
   host without server rewrites. Live build uses BrowserRouter.

`mockApi.js` also synthesises today's attendance for the first two batches on
load, so a reviewer lands on a realistic half-finished morning instead of an
empty one. It is seeded arithmetically, not with `Math.random`, so the demo
looks the same for everyone.

Regenerate `web/src/demoData.json` from the live DB with the export snippet in
the git history, or just re-run `npm run seed -- --reset` and re-export.

---

## 7. Commands

```bash
# API
cd server && npm install
npm run seed -- --reset        # 220 students, 6 weeks attendance, 4 months fees
npm start                      # :4000  (also serves web/dist if built)

# Web (dev, proxies /api to :4000)
cd web && npm install && npm run dev      # :5173

# Builds
npm run build                  # live app        → web/dist
VITE_DEMO=1 npm run build:demo # static demo     → web/dist-demo
npm run build:single           # one .html file  → web/dist-single/index.html
```

Demo logins: `9000000001` / `msr@2026` (admin), `9000000002` / `office@2026`.
**Change both and set a real `JWT_SECRET` before going live.**

---

## 8. Traps already hit — do not rediscover these

1. **Router mounting order swallows public routes.** `catalog.js` is mounted at
   `/api`. It originally used `r.use(auth)`, which ran for *every* `/api/*`
   request that passed through it — including `/api/enquiries/public`, breaking
   the website's enquiry form with "Not signed in". Fixed by attaching `auth`
   per-route in that router. **Never put `r.use(auth)` in a router mounted at a
   broad prefix.**

2. **better-sqlite3 will not mix positional and named parameters.**
   `.all(month, { batch_id })` throws. Pick one style per statement.

3. **GitHub Pages serves a project site from `/repo-name/`, not `/`.** Absolute
   asset paths 404 and you get a blank white page. `vite.config.js` sets
   `base: './'` when `VITE_DEMO=1`. Verify any deploy by serving the build from
   a sub-path, not just from root — that is how the bug hides.

4. **The service worker must stay out of the demo build.** An offline cache is
   right for the installed app and wrong for a review link — reviewers keep
   seeing stale screens after an update. Registration lives in `main.jsx`
   guarded by `!isDemo`.

5. **The dashboard "overdue" count must span all periods**, not just the current
   month, or long-unpaid bills silently vanish from the number that matters.

6. **Seed data must be deterministic.** `seed.js` uses a seeded LCG, not
   `Math.random`, so screenshots and demos are reproducible.

7. **This sandbox could not push to GitHub.** A proxy blocked repos not attached
   to the session at creation time; a valid PAT made no difference. Deploy from
   your own machine (`./deploy-demo.sh`) or via the GitHub web UI. Do not burn
   time on tokens from inside a Claude cloud session.

---

## 9. Still placeholder — replace with real values

- **Phone, WhatsApp number, email, address** — `web/src/pages/Site.jsx`
  (`ACADEMY`) and `server/src/seed.js` (`settings`).
- **Fee amounts** (₹800–₹2,000/month) — my estimate for Chirala, not real.
  In `server/src/seed.js` `courses`, and editable in the app afterwards.
- **Proof numbers** on the website — "450+ students trained", "120+ selected",
  "8 years". Confirm these before publishing; they are marketing claims.
- **Batch names, timings, coach names** — plausible, not actual.
- All student data is generated. No real person is in this repo.

---

## 10. Roadmap, in the order I would do it

1. **Razorpay / UPI payment links** in the fee reminder, so parents pay from the
   WhatsApp message instead of walking to the office. Biggest real-world win.
2. **Coach logins** — a coach sees only their own batches. Roles already exist;
   this is a `WHERE batch.coach_id = ?` filter plus a trimmed nav.
3. **Parent view** — attendance and fee balance by phone number + OTP.
4. **PET readiness flags** — store the qualifying cut-off per programme and
   event, then mark students above/below it. This turns `test_records` from a
   log into advice, and is the feature the academy would actually brag about.
5. **Photo at admission**, printed on an ID card.
6. **Automated backups** of `msr.db` to Drive, plus a restore drill. Untested
   backups are not backups.

---

## 11. Working agreements

- Deployment is one box: `npm run build` in `web/`, then `npm start` in
  `server/` — Express serves `web/dist` when it exists. Nginx/Caddy in front for
  HTTPS. The whole database is `server/data/msr.db`; back that file up.
- Never commit `.env`, `*.db`, or `dist*/`. `.gitignore` covers this.
- The public demo repo is fine to be public — generated data, demo passwords
  only. **The live instance with real student records must never be.**
- Keep copy plain and specific. The users are in Chirala; write "Village or
  town", not "Locality". Prefer "Roll call" over "Attendance capture".
