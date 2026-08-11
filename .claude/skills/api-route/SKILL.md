---
name: api-route
description: Use when adding or changing a server endpoint — trigger phrases like "add an API", "new route", "new endpoint", "add a field to the API", or any edit under server/src/routes/. Covers auth/role gating, better-sqlite3 rules, invoice status, and keeping the demo build in sync.
---

# Adding a server route

## Router pattern
Routes live in `server/src/routes/*.js`, mounted in `server/src/index.js`:
```js
app.use('/api/students', studentRoutes);
app.use('/api', catalogRoutes);   // broad prefix — see the trap below
```
A route file exports an Express `Router`, imports `db` from `../db.js` and `{ auth, allow, OFFICE, TRAINING, ADMIN }` from `../auth.js`. Role sets: `OFFICE` = admin+staff, `TRAINING` = admin+staff+coach (`server/src/auth.js`).

## Auth — per-route, never on broad prefixes (trap §8.1)
Attach guards per route:
```js
r.get('/courses', auth, allow(...TRAINING), (req, res) => { ... });
r.post('/courses', auth, allow(...OFFICE), (req, res) => { ... });
```
**Never put `r.use(auth)` in a router mounted at a broad prefix.** `catalog.js` is mounted at `/api`; its original `r.use(auth)` ran for every `/api/*` request passing through and broke the public website form at `/api/enquiries/public` with "Not signed in". Routers mounted at their own narrow prefix (e.g. `fees.js` at `/api/fees`) may use `r.use(auth)` — but per-route is the house style for anything new.

Public endpoints (no `auth`) live only in `enquiries.js` (the enquiry form) and `routes/public.js` (mounted at `/api/public` — website success wall, notices, and the rate-limited student self-check). Any new unauthenticated route goes in `public.js`, never elsewhere, and must not leak phone numbers or money.

## better-sqlite3 rules
- **Never mix positional and named parameters in one statement** (trap §8.2): `.all(month, { batch_id })` throws. Pick `?` + `.run(a, b)` OR `@name` + `.run({ a, b })` per statement. See the `WHERE`-builder pattern in `fees.js` `GET /invoices` for the named style.
- Wrap multi-row writes in `db.transaction(() => { ... })()` (see `POST /fees/generate`).
- Idempotency is load-bearing: attendance is an upsert (`UNIQUE(student_id, date)` + `ON CONFLICT ... DO UPDATE`); invoices use `INSERT OR IGNORE` against `UNIQUE(student_id, period, type)` (`type` = `training` | `hostel`) so "generate bills" can never double-bill.

## Invoice status is derived
Never set `invoices.status` by hand except `'waived'`. After any payment insert/delete or invoice amount change, call `refreshInvoiceStatus(invoiceId)` (defined in `server/src/routes/fees.js`) — it recomputes unpaid/partial/paid from summed payments. Also: any "overdue" aggregate must span **all periods**, not just the current month (trap §8.5).

## Cut-off verdicts
Anything that judges a result against an exam cut-off (ready / borderline / at-risk) must use `server/src/readiness.js` (`judge()`); its demo mirror lives near the top of `web/src/mockApi.js`. Never re-implement the comparison — `sec` qualifies at-or-under, `m`/`count` at-or-over, borderline is within 10%.

## Errors and responses
Validate and return `res.status(400).json({ error: '...' })` with a plain, specific message; `404` `{ error: 'Not found' }`; created rows return `res.status(201).json({ id: info.lastInsertRowid })`.

## Keep demo mode in sync — mandatory
Every new endpoint needs three touches or the published demo silently breaks:
1. **`server/src/routes/<file>.js`** — the real route.
2. **`web/src/api.js`** — call it via the shared client (`api.get/post/patch/del/download`). Reuse the formatting helpers there (`rupees`, `shortDate`, `secsToTime`, `waLink`).
3. **`web/src/mockApi.js`** — add the matching path to the `mock` object so the same screen works with `VITE_DEMO=1`. Writes mutate the in-memory copy of `demoData.json`; anything demo can't do should throw a plain message (see the CSV export: "CSV export needs the live app — it is switched off in this demo."). Use arithmetic sequences, never `Math.random`, so the demo is identical for every viewer.

If the new data isn't in `web/src/demoData.json`, extend the seed and re-export — see the `seed-demo-data` skill.
