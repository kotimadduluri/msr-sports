# MSR Sports Academy — management system

Web + mobile app for **MSR Sports Academy, Chirala** — a government-job physical (PET/PMT)
and written-exam training academy.

One codebase gives you three things:

| Part | Who uses it | Where |
|---|---|---|
| **Public website** | Students & parents in Chirala | `/` |
| **Admin app** | Your brother + office staff | `/app` (installable on a phone) |
| **API** | Both of the above | `/api` |

---

## What it does today

**Students** — admission with auto-generated admission numbers (MSR20260001…), full profile
with guardian details, village, height/chest/weight for PMT, batch and programme.
Search by name, phone, admission number or village.

**Attendance** — pick a batch, tap P / A / L / Lv against each name, one Save. Built for a
phone held at the ground at 5:30 AM. Also gives a monthly percentage grid and a
"missing students" list with one-tap WhatsApp to the parent.

**Fees** — one click generates the month's bills for every active student from their
programme fee. Record cash/UPI payments, get an auto-numbered receipt you can print or
save as PDF, and send WhatsApp reminders for overdue bills.

**Schedules** — programmes (Police Constable, SI, Army Agniveer, SSC GD, Railway, Fitness),
batches with timings/days/coach/venue, and a weekly timetable view.

**Performance** — record 1600m, 800m, 100m, long jump, shot put and pull-up results per
student and see a leaderboard of who is actually ready for the PET. This is the part
generic academy software does not have.

**Enquiries** — the website form drops straight into the admin app. Track each enquiry
through new → contacted → visited → joined, with call and WhatsApp buttons.

**Backups** — CSV export of students, bills, payments and enquiries.

### Built to extend
Roles `admin`, `staff`, `coach` and `student` already exist in the database and are
enforced on every API route. Right now you only use admin/staff logins; opening the app
to coaches (mark attendance on their own phone) or parents (see attendance and fees) is
a matter of creating those logins and adding screens — not a rewrite.

---

## Design

The interface is built on one small system rather than page-by-page styling:

- **Palette** — a navy brand ramp with a saffron accent, on a warm neutral plane.
  Chart colours are separate and were run through a colour-blindness / contrast
  validator before use, so the charts stay readable for everyone.
- **Icons** — one stroke weight, one 24px grid, drawn inline as SVG. No emoji.
- **Touch** — every control is at least 44px tall, the phone layout has a bottom
  tab bar with the five screens a coach actually needs, and the roll-call tally
  sticks to the top while you scroll the list.
- **States** — skeletons instead of spinners, illustrated empty states, toasts
  with an icon, and a visible keyboard focus ring on every control.
- **Charts** — hand-built SVG (2px lines, hairline grid, hover crosshair and
  tooltip, no legend for a single series). Dropping the chart library cut the
  app bundle from 177KB to 78KB gzipped.

---

## The review demo

`VITE_DEMO=1` swaps the API client for an in-memory backend holding a snapshot of
the seeded data, so **the exact same app** runs as a static site with nothing
behind it. It is the product, not a mock-up — the demo backend is excluded from
the live bundle entirely.

```bash
cd web
VITE_DEMO=1 npm run build:demo   # → web/dist-demo  (drop this folder on any static host)
npm run build:single             # → web/dist-single/index.html (one shareable file)
```

Publish it in whichever way suits:

- **Netlify Drop** — go to <https://app.netlify.com/drop> and drag the `dist-demo`
  folder in. A link appears in about half a minute.
- **GitHub Pages** — `export GITHUB_TOKEN=… GITHUB_USER=…` then `./deploy-demo.sh`.
- **The single file** — `dist-single/index.html` works from WhatsApp, email or a
  pen drive with no internet at all.

Writes in the demo apply to memory and vanish on reload, which is what a review
link should do.

---

## Running it

Requirements: Node.js 18 or newer.

```bash
# 1. API
cd server
npm install
npm run seed -- --reset     # demo data: 220 students, attendance, fees
npm start                   # http://localhost:4000

# 2. Web app (separate terminal, for development)
cd web
npm install
npm run dev                 # http://localhost:5173
```

**Demo logins**

| Role | Username | Password |
|---|---|---|
| Admin | `9000000001` | `msr@2026` |
| Office staff | `9000000002` | `office@2026` |

> Change both passwords from **Settings → Change my password** before going live, and set
> a real `JWT_SECRET` (see below).

### Production (single server)

```bash
cd web && npm run build     # produces web/dist
cd ../server && npm start   # serves the site, the app and the API on one port
```

The API automatically serves `web/dist` when it exists, so everything runs on port 4000
behind Nginx or Caddy.

### Environment variables (`server/.env`)

```
PORT=4000
JWT_SECRET=<a long random string — change this>
DATA_DIR=/var/lib/msr          # where msr.db lives; back this file up
```

---

## Making it a mobile app

The web app is already a **PWA**: on an Android phone, open the site in Chrome →
menu → *Add to Home screen*. It gets an icon, opens full screen with no browser bar, and
the shell is cached so it opens even on a weak connection. That covers phones for free,
with no Play Store review and no separate codebase.

If you later want a real Play Store listing, wrap the same build with
[Capacitor](https://capacitorjs.com) (`npx cap add android`) — no rewrite needed.

---

## Deployment options (India, small budget)

| Option | Cost | Notes |
|---|---|---|
| Hostinger / DigitalOcean VPS | ~₹400–700 / month | Full control, SQLite file on disk, easiest to back up |
| Railway / Render | free tier → ~$5 | Fastest to get online; attach a persistent volume for `msr.db` |
| Any Node shared host | varies | Needs Node 18+ and a writable folder |

Point a domain such as `msrsports.in` at it and add HTTPS with Caddy or Certbot.

**Backups matter more than hosting.** The whole academy is one file — `server/data/msr.db`.
Copy it to Google Drive nightly:

```bash
0 22 * * * cp /var/lib/msr/msr.db /root/backups/msr-$(date +\%F).db
```

---

## Project layout

```
server/
  src/db.js              schema + SQLite connection
  src/auth.js            JWT + role gates
  src/routes/            auth, students, catalog, attendance, fees, enquiries, reports
  src/seed.js            demo data generator
web/
  src/pages/Site.jsx     public website
  src/pages/*.jsx        admin screens
  src/api.js             API client + ₹/date helpers
  public/                PWA manifest, icon, service worker
```

## Things worth adding next

1. **Razorpay / UPI payment links** so parents pay from the fee reminder instead of at the office.
2. **Coach logins** — a coach only sees their own batches (roles are already in place).
3. **Parent view** — attendance and fee balance by phone number + OTP.
4. **Photo capture** at admission, printed on the ID card.
5. **PET readiness targets** — flag students whose 1600m timing is above the qualifying cut-off.
