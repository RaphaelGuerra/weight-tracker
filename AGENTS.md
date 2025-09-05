# Repository Guidelines

## Project Structure & Module Organization
- `peso-coach/`: Vite + React + TS app.
- `src/`: app code and UI components.
  - `components/`: `TodayCard`, `WeekCard`, `GoalsProjectionCard`, `ChartsCard`, `DataTableCard`, `BackupCard`, `CheckpointsModal`, `TopBar`.
  - `lib/`: `storage.ts`, `dates.ts`, `compute.ts`, `charts.ts`, `defaults.ts`.
  - `types.ts`: shared types.
- `public/`: PWA assets (`manifest.webmanifest`, `sw.js`, icons).
- `worker/`: Cloudflare Worker (`worker.ts`, `wrangler.toml`).
- `dist/`: production build output.

## Build, Test, and Development Commands
- `npm run dev`: start local dev server with HMR.
- `npm run build`: type-check and build to `dist/`.
- `npm run preview`: serve the production `dist/` locally.
- `npm run lint`: run ESLint on `src/`.
- `npm run format`: format with Prettier.

## Coding Style & Naming Conventions
- TypeScript strict; React 18 with automatic JSX.
- Indentation: 2 spaces; max line length ~100 cols.
- Names: `PascalCase` for components, `camelCase` for functions/vars, `kebab-case` for filenames.
- Tools: ESLint (`@typescript-eslint`, hooks) + Prettier. Fix lint before PRs.

## Testing Guidelines
- No tests included yet. If adding tests:
  - Use `vitest` + `@testing-library/react`.
  - Place as `src/**/*.test.ts(x)` and cover: rolling means/weekly variation, projection logic, storage (serialize/restore).
  - Example: `npm run test` (once configured).

## Commit & Pull Request Guidelines
- Commits: Conventional Commits, e.g. `feat: projeção não linear`, `fix: cálculo média 7d`.
- PRs: include description, reproduction/steps, screenshots (gráficos), and linked issues. Ensure build + lint pass.

## Security & Configuration Tips
- Do not commit secrets. Worker reads `BEARER_TOKEN` via Wrangler secrets.
- KV bound to `COACH`. Endpoints: `POST /backup`, `GET /restore` (requires `Authorization: Bearer <token>`).
- PWA stores user data only in `localStorage`; Export/Import JSON available in UI.

## Architecture Overview
- UI cards compose a simple dashboard; business logic in `src/lib/compute.ts` (includes `simulateProjection`).
- Charts via Chart.js; dates via date-fns; Pico.css from CDN.
- Deploy app to Cloudflare Pages (output `dist/`); deploy Worker from `worker/` with Wrangler.

## Agent Tasks Checklist
- Plan updates: keep `update_plan` in sync (scaffold → impl → validate).
- Changes: use `apply_patch`; keep diffs minimal and scoped.
- Preambles: group related shell actions; keep notes brief.
- Validate: `npm run build` and `npm run lint` before handoff.
- Storage: persist only to `localStorage`; never commit secrets.
- Worker: configure `wrangler.toml` KV id and `wrangler secret put BEARER_TOKEN` (no hardcoding).

## CI Notes
- Expected checks: build and lint (tests when added).
- Node 18+; install with `npm ci`; verify with `npm run build`.
- Pages deploy uses `dist/`; Worker deploy via `wrangler deploy` in `worker/`.
- PRs with UI changes should include screenshots of charts.
