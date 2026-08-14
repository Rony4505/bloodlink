<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

This repo is a single Next.js 16 / React 19 app (npm, Node 22) that ships **two products from one codebase**, selected at runtime by `APP_MODE` + `NEXT_PUBLIC_APP_MODE`:

- `bloodlink` — BloodLink blood-donor platform (default). Public pages plus a hidden owner panel.
- `fashion` — Smart Craft Corner storefront. Store admin at `/store-admin/login` (`FASHION_ADMIN_USERNAME` / `FASHION_ADMIN_PASSWORD`).

Standard commands live in `package.json` (`npm run dev|build|start|lint`) and `README.md`. Notes that are non-obvious:

- A local `.env` is required (copy `.env.example`). `AUTH_SECRET` must be 32+ chars. Admin creds: bloodlink uses `ADMIN_USERNAME`/`ADMIN_PASSWORD`; fashion uses `FASHION_ADMIN_USERNAME`/`FASHION_ADMIN_PASSWORD`.
- **Storage auto-falls back to local JSON files** under `DATA_DIR` (set `DATA_DIR=./data` locally) when `DATABASE_URL` is unset — no Postgres is needed to run or test locally. `GET /api/health` reports the active `appMode` and storage backend.
- **Only one product runs per dev server**, and `next dev` refuses a second instance in the same directory. To switch products, stop the running server first (kill the PID `next dev` prints in its "Another next dev server is already running" message), then start the other mode:
  - BloodLink: `APP_MODE=bloodlink NEXT_PUBLIC_APP_MODE=bloodlink npm run dev`
  - Fashion: `APP_MODE=fashion NEXT_PUBLIC_APP_MODE=fashion npm run dev`
- Middleware blocks the *other* product's routes for the current mode (e.g. `/find` 404s in fashion mode). This is expected, not a bug.
- There is **no automated test suite**; "testing" means running the dev server and exercising flows. `npm run lint` currently reports pre-existing errors/warnings unrelated to environment setup.
