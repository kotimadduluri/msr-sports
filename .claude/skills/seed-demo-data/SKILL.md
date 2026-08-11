---
name: seed-demo-data
description: Use when regenerating or extending demo/seed data — trigger phrases like "reseed", "regenerate the demo data", "update demoData.json", "add demo students", "change the seed", or when a new feature needs sample rows in the demo build.
---

# Regenerating seed + demo data

## The two artifacts
1. **`server/src/seed.js`** — writes the live SQLite DB (`server/data/msr.db`): 220 students, 6 weeks attendance, 4 months fees, test records, enquiries.
2. **`web/src/demoData.json`** — a snapshot of that seeded DB (~880KB) consumed by `web/src/mockApi.js` for the static demo build. Top-level keys: `today, academy, users, courses, batches, students, attendance, invoices, payments, tests, enquiries`.

## Commands
```bash
cd server
npm run seed -- --reset   # wipes and rebuilds; without --reset it adds to existing data
```
Then re-export `web/src/demoData.json` from the fresh DB (the export snippet is in the git history — a small node script that reads each table via better-sqlite3 and writes the JSON with a `today` field). Keep the key names above exactly; `mockApi.js` destructures them.

## Determinism is non-negotiable (trap §8.6)
`seed.js` uses a seeded LCG, **not** `Math.random`:
```js
let s = 42;
const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
const pick = a => a[Math.floor(rnd() * a.length)];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
```
Any randomness you add to seed generation must go through `rnd()`/`pick()`/`int()`. Same rule in `mockApi.js` — e.g. its `seedToday()` uses `(n++ * 7919) % 100` to synthesise today's roll call for the first two batches.

**Why it matters:** re-seeding gives the same data every time, so screenshots are reproducible, the published demo at kotimadduluri.github.io/msr-sports looks identical for every reviewer, and a bug report against the demo can be reproduced locally. One `Math.random()` breaks all three.

## Constraints the generated data must respect
- `students.admission_no` format `MSR<year><4-digit seq>` (e.g. `MSR20260001`) — never change it; people read it out over the phone.
- `UNIQUE(student_id, date)` on attendance and `UNIQUE(student_id, period, type)` on invoices (`type` = `training` | `hostel`).
- Invoice `status` must be consistent with summed payments (unpaid/partial/paid; `waived` is manual).
- All data is generated — no real person may appear (CLAUDE.md §9). Demo logins stay `9000000001`/`msr@2026` and `9000000002`/`office@2026`.
- Placeholders that are knowingly fake (fees ₹800–₹2,000, phone `+91 90000 00000`, batch/coach names) live in `seed.js` — flag them, don't "fix" them with invented real values.
