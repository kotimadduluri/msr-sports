# Deploying MSR Sports to production

One service runs everything: the Express API serves the built React app
(public site + staff portal) and keeps its SQLite database on a persistent
disk with nightly on-disk backups.

## Option A — Render (recommended, ~10 minutes)

1. Push this repository to GitHub.
2. In Render: **New → Blueprint**, pick the repo. `render.yaml` provisions
   the service, a 1 GB disk mounted at `/data`, and a generated `JWT_SECRET`.
3. In the service's **Environment** tab set:
   - `ADMIN_PHONE` — the owner's mobile number (this is the login username)
   - `ADMIN_PASSWORD` — a first password (change it in Settings afterwards)
4. Deploy. The first boot creates the admin login and prints it in the logs.
5. Open the URL: the public site is at `/`, the portal at `/login`.

## Option B — any Docker host

```bash
docker build -t msr-sports .
docker run -d --name msr -p 4000:4000 \
  -v /srv/msr-data:/data \
  -e DATA_DIR=/data \
  -e JWT_SECRET="$(openssl rand -hex 32)" \
  -e ADMIN_PHONE=9XXXXXXXXX -e ADMIN_PASSWORD=change-me \
  msr-sports
```

Put a TLS proxy (Caddy / nginx / Cloudflare) in front for HTTPS.

## Data safety

- **Nightly backups** are automatic: the server writes a consistent snapshot
  to `$DATA_DIR/backups/msr-YYYY-MM-DD.db` every 24 h and keeps the last 14.
- **Off-machine copy**: an admin can download the full database any time from
  **Settings → Data backup → Full database backup**. Do this weekly and keep
  the file somewhere that is not the server.
- CSV exports (students, payments, invoices, enquiries, expenses, selections)
  are alongside it for the accountant.

## First-day checklist

1. Sign in, change the admin password (Settings).
2. Fill **Academy details** — name, address, phone, **UPI ID** (it goes into
   fee reminders and the student self-check page).
3. Check **Academy → Cut-offs** against the current official notifications —
   the seeded values are editable training targets, not authoritative data.
4. Replace the placeholder contact details in `web/src/pages/site/content.js`
   and redeploy so the public site shows the real phone/address.
5. Add staff and coach logins (Settings) — coaches get attendance, test day
   and performance, not fee edits.

## Before going live (also see CLAUDE.md §9)

- `JWT_SECRET` must be set — the dev fallback is public knowledge.
- The GitHub Pages demo (`deploy-demo.yml`) is independent of production; it
  ships fake data and stays up as a review link.
