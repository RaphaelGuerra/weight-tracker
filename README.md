# Peso Coach

Last updated: 2025-11-25

## Table of Contents

<!-- TOC start -->
- [What It Does](#what-it-does)
- [How To Use](#how-to-use)
- [How It Works](#how-it-works)
- [Run Locally](#run-locally)
- [Deploy (optional)](#deploy-optional)
- [Tech Stack](#tech-stack)
- [Status & Learnings](#status-learnings)
- [License](#license)
<!-- TOC end -->

Simple PWA to log body weight and visualize progress with goal projections.

This is a small portfolio side project for learning — lean UI, quick charts, local‑first state, and an optional month‑scoped sync flow. It is not a medical app or a production system.

## What It Does
- Daily weight logs (morning/night) and optional body‑fat percentage
- Today and Week views with averages and highlights
- Non‑linear projection based on TDEE, phases, and checkpoints
- Trend, weight projection, and body‑fat charts (Chart.js)
- Export/Import JSON for portability
- Optional month sync via Pages Functions (Base URL + Sync ID)

## How To Use
- Add daily weigh‑ins; edit checkpoints to track progress bands
- Adjust projection parameters (BMR, PAL, per‑phase intake) and recalc
- Export a JSON backup; optionally configure Sync to save/load the current month

## How It Works
- Local data: full app state in `localStorage`; per‑month data under `coach.v1.data.YYYY-MM`
- Optional sync:
  - API `GET/PUT /api/storage/:syncId/:YYYY-MM` (Cloudflare Pages Functions)
  - Sync ID acts as a path token — choose a strong value
- PWA: `manifest.webmanifest` + `sw.js` for an installable experience

## Run Locally
Prerequisites: Node 18+

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Deploy (optional)
- Cloudflare Pages: build `npm run build` → `dist/` and Functions in `functions/`
- Worker (alternative): `worker/` with KV and `BEARER_TOKEN` for Backup/Restore

## Tech Stack
- Vite + React + TypeScript
- Pico.css (CDN), Chart.js, date‑fns
- ESLint + Prettier

## Status & Learnings
- Functional prototype to study projections, lean UI, and PWA
- Next ideas: weekly targets, reminders, and progress sharing

## License
All rights reserved. Personal portfolio project — not for production use.
