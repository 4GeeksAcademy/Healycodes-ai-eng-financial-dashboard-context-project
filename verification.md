# Verification trail

This file records what the coding agent claimed about this repository, how each claim was checked against the code, and what was corrected. Legend: ✅ verified in code · ❌ wrong (corrected below) · ❓ could not be verified.

Every check below was run on a fresh clone of `4GeeksAcademy/ai-eng-financial-dashboard-context-project` at commit `954f812`.

---

## Phase 1 — Understanding the handover

### How it was run

The repo's only documented setup is `docker compose up --build` (`README.md` → "How to run locally", `docker-compose.yml`).

- ❓ **`docker compose up --build`** — could not complete in the agent's sandbox: `pip install` inside the backend image failed with `CERTIFICATE_VERIFY_FAILED` because of the sandbox's TLS-intercepting proxy. This is an environment limitation, not a repo defect; it must be re-checked in Codespaces.
- ✅ **Workaround, same commands as the Dockerfiles** — ran each service with its Dockerfile `CMD`:
  - backend: `python -m debugpy --listen 0.0.0.0:5678 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload` (from `backend/Dockerfile`)
  - frontend: `npm run dev -- --host 0.0.0.0 --port 5173` (from `frontend/Dockerfile`)
  - added `127.0.0.1 backend` to `/etc/hosts` so the Vite proxy target resolves as it would on the Compose network.
- Health checks run: `GET :8000/health` → `{"status":"ok"}` · `GET :8000/docs` → 200 · `GET :5173/` → 200 · `GET :5173/api/metrics` → 200 with JSON.
- Test/quality commands: backend `python -m pytest` → **15 passed**; frontend `npm run lint` → clean, `npm test` → **5 passed**, `npm run build` → OK (warning: one chunk > 500 kB).

### Project summary (as verified)

| # | Claim | Status | Evidence |
|---|---|---|---|
| 1 | Two services: a React frontend and a FastAPI backend, wired by Docker Compose | ✅ | `docker-compose.yml` services `frontend`, `backend` |
| 2 | Ports: frontend 5173, backend 8000, debugger 5678 | ✅ | `docker-compose.yml` `ports`; `backend/Dockerfile` `EXPOSE 8000 5678` |
| 3 | Backend is FastAPI with all routes in one module | ✅ | `backend/app/main.py` includes `router` from `backend/app/routes.py` |
| 4 | Backend has no database — data is generated in memory | ✅ | `generate_mock_movements()` in `routes.py`; no DB dependency in `requirements.txt` |
| 5 | Generated data is deterministic | ✅ | every endpoint calls `generate_mock_movements(seed=42)`; 360 movements (12 months × 30) confirmed by test and by running it |
| 6 | Data covers calendar year 2024 | ❌ | see correction C2 |
| 7 | Endpoints: `/health`, `/api/metrics`, `/api/metrics/facets`, `/summary`, `/categories/top`, `/comparison`, `/alerts`, `/b2b`, `/b2c` | ✅ | `routes.py`; confirmed via `GET /openapi.json` paths list |
| 8 | Frontend is React 19 + Vite + TypeScript + Tailwind v4 + Recharts, with shadcn-style UI primitives | ✅ | `frontend/package.json`; `frontend/components.json`; `src/components/ui/card.tsx`, `skeleton.tsx` |
| 9 | Frontend calls several backend endpoints | ❌ | see correction C3 |
| 10 | KPIs and monthly chart data are computed in the browser | ✅ | `computeKPIs`, `computeMonthlyData` in `src/lib/financial-utils.ts`, called in `src/App.tsx` |
| 11 | The UI uses the static data in `src/lib/mock-data.ts` | ❌ | see correction C4 |
| 12 | `npm run dev` on its own gives a working dashboard | ❌ | see correction C1 |
| 13 | Monthly chart totals match the backend's monthly summary | ❌ | see correction C5 |
| 14 | `/health` is reachable through the frontend dev server | ❌ | `GET :5173/health` returns the SPA's `index.html`; only `/api` is proxied (`vite.config.ts`) |
| 15 | The repo already contains `.agents/rules`, `.agents/skills` and `memory-bank` | ❌ | `AGENTS.md` points to them, but none existed at `954f812` (`ls -a`) |
| 16 | API validates query parameters | ✅ | `Literal` types in `routes.py`; `GET /api/metrics?category=bogus` → 422 |

### Corrections (wrong claim → what the code shows)

- **C1 — "Run the frontend with `npm run dev` and it talks to the backend."** Wrong outside Compose. `vite.config.ts` proxies `/api` to `http://backend:8000`, a hostname that exists only on the Compose network. Running natively gave `502` and `getaddrinfo ENOTFOUND backend` in the Vite log. Fix when running without Compose: set `VITE_API_BASE_URL=http://localhost:8000` (read in `App.tsx`; backend CORS allows `*`).
- **C2 — "The data is for 2024."** Suggested by `DashboardHeader period="2024 - Full Year"` in `App.tsx` and by `mock-data.ts`. Wrong: `_year_for_month()` in `routes.py` places each month in the last 12 months relative to `date.today()`. On 2026-09-29, `/api/metrics/facets` returned `min_date 2025-09-02`, `max_date 2026-08-28`. The "2024" header label is stale.
- **C3 — "The frontend uses the summary / top-categories / alerts endpoints."** Wrong: the only fetch is `GET ${API_BASE_URL}/api/metrics` in `App.tsx`. The other 7 API routes are currently used only by tests and `/docs`.
- **C4 — "`mock-data.ts` feeds the UI."** Wrong: `grep -rn "mock-data\|mockMovements" frontend/src` finds no importer. It is dead code (2024 data from the V0 prototype, commit `7661fa1`).
- **C5 — "The monthly chart matches the API."** Wrong for users west of UTC. `computeMonthlyData` does `new Date("YYYY-MM-DD")`, which JavaScript parses as UTC midnight, then reads `getMonth()` in local time. In `TZ=America/Toronto` a movement on `2025-03-01` lands in "Feb 2025". Against live API data the Toronto chart showed Oct 2025 income 112,375 vs the backend's `/summary` 106,910. The existing Vitest suite passes in every timezone because none of its fixtures fall on day 1.
- **C6 — "The comparison test checks the comparison logic."** Weak: `test_metrics_comparison_returns_delta_fields` uses fixed dates `2025-03-01..2025-03-31`, which are outside the rolling data window (C2), so the endpoint returns zeros and the test only checks key names.

### Not verified (❓)

- `docker compose up --build` end-to-end (sandbox TLS proxy — re-check in Codespaces).
- The debugger on port 5678 (debugpy starts — it is in the running command line — but no IDE was attached).

---

## Phase 2 — Findings checked before becoming rules

Full list with evidence: [`docs/engineering-findings.md`](docs/engineering-findings.md).

| Candidate finding | Status | How it was checked |
|---|---|---|
| "The frontend follows one formatting style" | ❌ | Counted quotes/semicolons per file: V0 components use `'…'` and no `;`, `App.tsx` and `financial-utils*.ts` use `"…"` and `;`. No Prettier config. Rule changed to "match the file you edit". |
| "The business-type filter is part of `filter_movements`" | ❌ | `grep "business_type is not None" routes.py` → 4 inline copies (lines 278, 296, 312, 351); `filter_movements` has no such parameter. |
| "There is CI" | ❌ | No `.github/` directory. |
| "Frontend and backend types are generated from one schema" | ❌ | Hand-written in both `routes.py` and `financial-types.ts`. |
| "`/health` works through the frontend port" | ❌ | Returns SPA HTML on :5173 (see Phase 1 #14). |
| "Tests cover the timezone edge case" | ❌ | No day-1 fixture; confirmed by a probe test that fails only in `TZ=America/Toronto`. |
| "Use a database / Redux / split routes.py" | dropped | Not supported by repo evidence or out of scope (see "Dropped" in findings). |

---

## Phase 3 — Rule validation on real tasks

Rules: [`.agents/rules/`](.agents/rules/README.md). Each was used to steer a real change in this repo; the result is checked below.

### Task 1 — Fix the monthly chart shifting day-1 movements (finding F8 / C5)

| Rule applied | What it made the work do | Checked |
|---|---|---|
| testing.md — "bug fix needs a regression test that fails before the fix" | Added `keeps first-of-month movements in their own month in any timezone` to `financial-utils.test.ts` **before** touching the code | ✅ `TZ=America/Toronto`: 1 failed / 5 passed · `TZ=UTC`: 6 passed |
| dates-and-time.md — "group by the `YYYY-MM` prefix, never `new Date(iso)` + local getters" | `toYearMonthKey` now takes the string and returns `isoDate.slice(0, 7)` | ✅ 6/6 in UTC, Toronto, Madrid, Honolulu, Tokyo |
| frontend-conventions.md — "logic in `lib/`, match the file's style" | Fix stayed in `financial-utils.ts` (double quotes + semicolons, like the file); no component changed | ✅ `npm run lint` clean, `npm run build` OK |
| running-and-verifying.md — commands to run before finishing | Ran lint, tests, build, and a live-data check | ✅ Toronto chart Oct 2025 income 112,375 → **106,910**, now equal to `/api/metrics/summary` |

**Rule iteration:** the first draft said "run `npm test` and `TZ=America/Toronto npm test`". During the task, plain `npm test` failed too — the sandbox's default timezone is EDT — while `TZ=UTC` passed. So "plain `npm test`" gives machine-dependent results. Rules updated to require two **explicit** timezones (`TZ=UTC` and `TZ=America/Toronto`).

### Task 2 — Make the comparison test check real data (finding T3 / C6)

| Rule applied | What it made the work do | Checked |
|---|---|---|
| dates-and-time.md — "derive test dates from the data (facets), never hard-code" | Test now takes `max_date` from `/api/metrics/facets` and compares that month to the one before | ✅ 15/15 pass |
| testing.md — "assert on values, not only keys" | Asserts both periods are non-zero and `delta_abs == current - previous` | ✅ old request (`2025-03`) returns all zeros, so the old test checked nothing |
| backend-api.md — "keep `seed=42`, don't change data to pass tests" | No change to `routes.py` | ✅ `git diff backend/app` empty |

**Robustness check:** with the data window shifted to 2028 (patching `_year_for_month`), the new test suite still passes 15/15; the old test's request returns all zeros in that window too.

### Rules not exercised by a code change

- `repo-hygiene.md` — applied to these commits (one concern per phase, what-was-wrong in the body, no env files). Its "update `memory-bank/progress.md`" step applies from Phase 4, when the memory bank exists; Task 1 and 2 are recorded there.

---

## Phase 4 — Memory bank checks

Files: [`memory-bank/`](memory-bank/README.md) — `productContext.md`, `techContext.md`, `progress.md`.

| Claim in the memory bank | Status | Check |
|---|---|---|
| API has 9 routes | ✅ | `/openapi.json` paths = 9 |
| UI makes one API call | ✅ | one `fetch(` in `App.tsx` |
| `mock-data.ts` is unused | ✅ | 0 importers |
| Backend 15 tests, frontend 6 tests (UTC + Toronto), lint, build pass | ✅ | re-run on the Phase 4 tree |
| Stack versions | ✅ | read from `node_modules/*/package.json` and `pip show`; Python image version from `backend/Dockerfile` |
| Data is 360 generated movements over the last 12 months | ✅ | test + `/facets` |

Rejected while drafting (no evidence in the repo):

- ❌ "Built for a specific company's executive team" — only the header text says "Executive metrics dashboard"; no customer is named. Kept as a UI label, not a product claim.
- ❌ A feature roadmap (filters, date pickers, auth). Nothing in the repo plans these. "Next priorities" in `progress.md` lists only fixes for verified gaps.
- ❌ "Runs in production" / deployment target. No deployment config exists; the backend container is dev-only (debugpy, `--reload`).
