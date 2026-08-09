# MSR Sports Academy — Chirala

Web app for MSR Sports Academy, Chirala: physical (PET/PMT) and written exam
training for Police, Army, SSC and Railway government jobs. Manages students,
batches, attendance, fees, enquiries and performance reports, with a public
enquiry page and an installable PWA shell for staff.

## What's in this repo

This repo contains the **production build output** (Vite `dist/`) of the app:

```
index.html           app shell (SPA entry)
404.html             SPA fallback (copy of index.html)
assets/              hashed JS/CSS bundles (includes a mock API for demo mode)
manifest.webmanifest PWA manifest
sw.js                service worker (offline shell; API calls always hit network)
icon.svg             app icon
_redirects           SPA rewrite rule for Netlify / Cloudflare Pages
```

## Run locally

Any static file server works; the app expects to be served from the domain root:

```sh
npx serve -s .
# or
python3 -m http.server 8080
```

Then open http://localhost:8080 (with `python3 -m http.server`, deep links such
as `/app` won't rewrite to `index.html` — start from `/`).

## Deploy

The build assumes **root-path hosting** (absolute `/assets/...` URLs and SPA
routes like `/app`). Recommended targets:

- **Netlify** — drag-and-drop this folder or `netlify deploy`; `_redirects` is
  already configured.
- **Cloudflare Pages** — same, `_redirects` is honored.
- **GitHub Pages** — works only at a root domain (a `<user>.github.io` repo or
  a custom domain). A project page under `/msr-sports/` will 404 on assets and
  routes unless the app is rebuilt with `base: '/msr-sports/'`.
