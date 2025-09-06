# Project Progress Snapshot

Updated: <today>

## Current State
- Stack: React 19, Vite 7, TypeScript 5, Chart.js 4, date-fns 3.
- App: PWA with Pico.css, service worker, charts, projection, checkpoints.
- Persistence (offline‑first):
  - LocalStorage keys: `coach.v1.syncId`, `coach.v1.baseUrl`, `coach.v1.logs.<YYYY-MM>`.
  - Remote API (Cloudflare Pages Functions): `GET/PUT /api/storage/:syncId/:YYYY-MM`.
  - Debounce: local 300ms, remote 800ms.
  - Sync flow: on month change/load → try remote if Sync ID + Base URL set; fallback to local. Edits always save locally; remote saves only if configured.
- Pages Functions: `functions/api/storage/[user]/[month].ts` (Edge runtime). KV binding name: `COACH`.
- Worker (optional): `worker/worker.ts` with KV `COACH` + Bearer token endpoints `/backup` and `/restore`.
- Naming cleanup: removed legacy `ledger`/`DATA`; standardized on `coach` + `COACH`.

## Cloudflare Pages Config
- Root directory: `peso-coach`
- Build command: `npm run build`
- Build output directory: `dist`
- Functions directory: auto-detected `functions/`
- KV binding: add `COACH` (create namespace and bind in Pages project)
- Custom domain: e.g., `coach.phaelix.com`

## How to Use Sync
- In app → Backup → “Sincronização (Cloudflare Pages Functions)”: set Base URL (e.g., `https://coach.phaelix.com`) and a high‑entropy Sync ID; Save. Use “Salvar mês remoto” / “Carregar mês remoto”.

## Open Items / Next Options
- Optional: auto-default Base URL to `window.location.origin` in production.
- Optional: retries/backoff + visible sync status indicator.
- Optional: hide/remove Worker backup if using Pages only.
- CI: add GitHub Actions for build + lint.
- Tests: add vitest + RTL for compute/storage.
