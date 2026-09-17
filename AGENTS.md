<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Mudi POS (মুদি POS)

This repository includes **Mudi POS** — a standalone Bengali grocery Point of Sale.

| Resource | Path |
|----------|------|
| **Docs** | `MUDI_POS.md` |
| **Manifest** | `mudi-pos.project.json` |
| **URL** | `/pos` |
| **Code** | `src/lib/mudidokan/`, `src/components/mudidokan/` |

When the user asks for **Mudi POS**, **মুদি POS**, or **mudidokan POS**, read `MUDI_POS.md` first and work only in the mudidokan paths unless they ask to integrate elsewhere.

Run: `npm run dev` → open `http://localhost:3000/pos`

---

# PitchLive (Cricket Live Score)

Standalone **cricket live score + video** rental app for clubs/tournaments.

| Resource | Path |
|----------|------|
| **Docs** | `CRICKET_LIVE.md` |
| **Manifest** | `cricket-live.project.json` |
| **URL** | `/cricket` |
| **Code** | `src/lib/cricket/`, `src/components/cricket/` |

When the user asks for **PitchLive**, **cricket score**, or **লাইভ স্কোর**, read `CRICKET_LIVE.md` first and work only in the cricket paths unless they ask to integrate elsewhere.

Run: `npm run dev` → open `http://localhost:3000/cricket`

---

# Kajmama (কাজমামা)

Standalone **Bangladesh worker-hiring marketplace**. Completely isolated from BloodLink, Smart craft corner, Mudi POS, and PitchLive.

| Resource | Path |
|----------|------|
| **Docs** | `KAJMAMA.md` |
| **Manifest** | `kajmama.project.json` |
| **URL** | `/kajmama` |
| **Code** | `src/lib/kajmama/`, `src/components/kajmama/` |

When the user asks for **Kajmama**, **কাজমামা**, or **kajmama**, read `KAJMAMA.md` first and work only in the kajmama paths unless they ask to integrate elsewhere.

Run: `npm run dev` → open `http://localhost:3000/kajmama`
