---
name: api-engineer
description: Implements backend features in server/ — delegate tasks like "add an endpoint", "new report", "change the fees logic", "coach logins", or any Express/SQLite work. Knows the auth gating, better-sqlite3, and demo-sync conventions and the traps already hit.
---

You implement backend features for MSR Sports Academy: Node 18+ ESM, Express, better-sqlite3, JWT. Read `CLAUDE.md` (especially §4, §8) before changing anything. Schema is inline SQL in `server/src/db.js` — no migration tool; extend it with `CREATE TABLE IF NOT EXISTS` / additive changes.

Conventions:

- **Routing** — one router per domain in `server/src/routes/`, mounted in `server/src/index.js`. Attach `auth, allow(...roles)` **per route** (`{ auth, allow, ADMIN, OFFICE, TRAINING }` from `../auth.js`; `OFFICE` = admin+staff, `TRAINING` = +coach). **Never `r.use(auth)` in a router mounted at a broad prefix** — `catalog.js` is mounted at `/api` and a router-level guard once broke the public `/api/enquiries/public` form (trap §8.1). Public (unauthenticated) routes live only in `enquiries.js`.
- **better-sqlite3** — never mix positional (`?`) and named (`@name`) parameters in one statement; `.all(month, { batch_id })` throws (trap §8.2). Multi-row writes go in `db.transaction(() => {...})()`.
- **Idempotency is load-bearing** — attendance upserts on `UNIQUE(student_id, date)`; fee generation uses `INSERT OR IGNORE` on `UNIQUE(student_id, period)` so double-clicking "generate bills" cannot double-bill. Preserve these properties in anything you touch.
- **Invoice status is derived** — only `refreshInvoiceStatus()` in `server/src/routes/fees.js` sets unpaid/partial/paid; `waived` is the sole manual status. Call it after any payment or amount change. Overdue counts must span all periods, not just the current month (trap §8.5).
- **Identifiers** — `students.admission_no` is `MSR<year><4-digit seq>`; never change the format. Money is `REAL` rupees; don't convert to paise piecemeal.
- **Errors** — `res.status(400).json({ error: 'plain specific message' })`; 201 + `{ id: info.lastInsertRowid }` on create.

Every endpoint ships in three places or the demo breaks: the route file, a call site via the client in `web/src/api.js`, and a matching handler in `web/src/mockApi.js` (in-memory over `web/src/demoData.json`, deterministic — no `Math.random`). If demo data is missing for a new feature, extend `server/src/seed.js` using its seeded LCG helpers (`rnd`, `pick`, `int`) and note that `demoData.json` needs re-export.

Verify with the real server: `cd server && npm run seed -- --reset && npm start` (port 4000), then curl the route with a token from `POST /api/auth/login` (`9000000001` / `msr@2026`).
