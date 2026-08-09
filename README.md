# MSR Sports Academy

Management platform for MSR Sports Academy, Chirala (Andhra Pradesh) — a
training academy that prepares candidates for Indian government job
recruitment: the physical tests (PET/PMT) and the written exams.

**Live demo:** https://kotimadduluri.github.io/msr-sports/
(sample data, resets on reload — logins below)

| Component | Audience | Route |
|---|---|---|
| Public website | Prospective students and parents | `/` |
| Admin app (PWA) | Academy owner and office staff | `/app` |
| REST API | Website and admin app | `/api` |

## Features

- **Students** — admissions with auto-generated admission numbers
  (`MSR20260001…`), guardian details, PMT measurements, batch and programme
  assignment. Search by name, phone, admission number or village.
- **Attendance** — batch roll call designed for a phone at the ground:
  tap P/A/L/Lv per student, one save. Monthly percentage grid, absentee
  follow-up list with one-tap WhatsApp to the guardian.
- **Fees** — monthly invoice generation per programme fee, cash/UPI payment
  recording, printable auto-numbered receipts, WhatsApp reminders for overdue
  bills. Invoice generation is idempotent; double-billing is impossible by
  design.
- **Performance tracking** — 1600 m, 800 m, 100 m, long jump, shot put and
  pull-up results recorded per student over time, with a leaderboard. This is
  the core differentiator: students see their distance from the qualifying
  cut-off.
- **Scheduling** — programmes, batches (timings, days, coach, venue) and a
  weekly timetable.
- **Enquiries** — the public website form feeds an admin pipeline
  (new → contacted → visited → joined) with call and WhatsApp actions.
- **Reports** — dashboard aggregates and CSV export of students, bills,
  payments and enquiries.

Role-based access control (`admin`, `staff`, `coach`, `student`) is enforced
on every API route.

## Architecture

```
server/                     Node 18+ · Express · SQLite (better-sqlite3) · JWT
  src/db.js                 schema and connection
  src/auth.js               JWT signing, auth middleware, role gates
  src/routes/               auth, students, catalog, attendance, fees,
                            enquiries, reports
  src/seed.js               deterministic demo-data generator

web/                        React 18 · Vite · React Router · Tailwind CSS
  src/pages/Site.jsx        public website (sections in src/pages/site/)
  src/pages/*.jsx           admin screens
  src/components.jsx        design-system components
  src/icons.jsx             icon set — official Lucide icons (lucide.dev)
  src/charts.jsx            hand-built SVG charts
  src/motion.jsx            scroll-reveal, count-up and marquee primitives
  src/api.js                API client and formatting helpers
```

Design decisions worth knowing:

- **SQLite over Postgres** — the entire academy fits in one file
  (`server/data/msr.db`), which makes backup a file copy. Appropriate for a
  single-location academy; revisit only for multi-branch.
- **No component or chart library** — the UI is built on a small internal
  design system (navy/saffron/ink tokens, shared components, hand-drawn SVG
  charts). Replacing the chart library with ~150 lines of SVG cut the bundle
  from 177 KB to under 90 KB gzipped.
- **PWA, not native** — installable from Chrome (*Add to Home screen*), offline
  shell via a service worker. Capacitor can wrap the same build if a Play
  Store listing is ever needed.

## Demo mode

`VITE_DEMO=1` swaps the API client for an in-memory backend seeded with a
snapshot of realistic data, so the identical React app runs as a static site.
The demo backend is excluded from the production bundle entirely (dynamic
import, dead-code-eliminated). Writes apply in memory and reset on reload.

## Getting started

Requires Node.js 18+.

```bash
# API
cd server
npm install
npm run seed -- --reset      # sample data: 220 students, attendance, fees
npm start                    # http://localhost:4000

# Web app (second terminal)
cd web
npm install
npm run dev                  # http://localhost:5173, proxies /api to :4000
```

Demo logins — change these and set a real `JWT_SECRET` before production use:

| Role | Username | Password |
|---|---|---|
| Admin | `9000000001` | `msr@2026` |
| Office staff | `9000000002` | `office@2026` |

## Builds and deployment

```bash
cd web
npm run build                    # production app → web/dist
VITE_DEMO=1 npm run build:demo   # static demo → web/dist-demo
npm run build:single             # self-contained single file → web/dist-single/index.html
```

- **Demo** — every push to `main` triggers
  [`deploy-demo.yml`](.github/workflows/deploy-demo.yml), which builds the
  demo and publishes it to GitHub Pages.
- **Production** — `npm start` in `server/` serves the API and `web/dist` on
  one port; put Nginx or Caddy in front for HTTPS. Configure via
  `server/.env`:

  ```
  PORT=4000
  JWT_SECRET=<long random string>
  DATA_DIR=/var/lib/msr
  ```

- **Backups** — the database is the single file `msr.db` in `DATA_DIR`.
  Schedule a nightly copy off the machine.

## Roadmap

1. UPI/Razorpay payment links in fee reminders
2. Coach logins scoped to their own batches
3. Parent view (attendance and fee balance) via phone number + OTP
4. PET readiness flags against per-programme qualifying cut-offs
5. Student photo capture at admission, printed on ID cards

## License

Private project. All student data in this repository is generated sample data;
no real personal information is included.
