---
name: deploy-demo
description: Use when building, publishing, or verifying the public review demo — trigger phrases like "deploy the demo", "publish the demo", "update the review link", "build:demo", "the demo page is blank", or anything about GitHub Pages for this project.
---

# Deploying the review demo

## Why demo mode exists
`VITE_DEMO=1` makes `web/src/api.js` swap the live fetch client for `web/src/mockApi.js`, an in-memory backend over `web/src/demoData.json` (~880KB snapshot of the seeded DB). The **same React app** then runs as a static site with no server — the review link is the product, not a mock-up.

Two fragile mechanisms (CLAUDE.md §6):
1. `api.js` uses top-level `await import('./mockApi.js')` inside `if (isDemo)`. Rollup dead-code-eliminates it in the live build (`vite.config.js` sets `build.target: 'esnext'` for this). **Never convert it to a static import** — the live bundle balloons by ~880KB.
2. Demo uses HashRouter (`web/src/main.jsx`) so deep links work on any static host; live uses BrowserRouter. Service-worker registration in `main.jsx` is guarded by `!isDemo` — keep it out of the demo build or reviewers see stale screens.

## Build locally
```bash
cd web
VITE_DEMO=1 npm run build:demo    # → web/dist-demo
```
(`build:demo` is `vite build --outDir dist-demo`; `vite.config.js` sets `base: './'` when `VITE_DEMO=1`.)

## What pushing to main does
`.github/workflows/deploy-demo.yml` runs on every push to `main` (and `workflow_dispatch`):
1. `npm ci` + `npm run build:demo` with `VITE_DEMO: '1'` in `web/`
2. Copies `dist-demo/index.html` → `404.html` and touches `.nojekyll`
3. Uploads `web/dist-demo` and deploys to GitHub Pages at **https://kotimadduluri.github.io/msr-sports/**

Concurrency group `pages` with `cancel-in-progress: true` — a newer push wins.

Note: a Claude cloud sandbox could not push to this repo (CLAUDE.md §8.7). Deploy from the user's machine (`./deploy-demo.sh`) or the GitHub web UI; do not burn time on PATs.

## Verify a deploy
- Serve the build **from a sub-path**, not root — that is how the Pages bug hides:
  ```bash
  cd web && mkdir -p /tmp/demo-check/msr-sports && cp -r dist-demo/* /tmp/demo-check/msr-sports/ && npx serve /tmp/demo-check
  ```
  then open `http://localhost:3000/msr-sports/`.
- Check: page is not blank, hash deep link works (e.g. `#/app/students`), login with demo creds `9000000001` / `msr@2026`, dashboard charts render.
- After a real deploy, check the Actions run went green and hard-refresh the Pages URL.

## Traps (CLAUDE.md §8)
- **Sub-path 404s** — GitHub Pages serves a project site from `/msr-sports/`, not `/`. Absolute asset paths give a blank white page. `base: './'` in `vite.config.js` fixes it; never remove it.
- **Jekyll** — Pages runs Jekyll by default, which drops files/dirs starting with `_` (Vite emits some). The workflow's `touch dist-demo/.nojekyll` disables Jekyll; keep that step.
- **404.html fallback** — copying `index.html` to `404.html` is what makes direct URLs work on Pages; keep that step too.
