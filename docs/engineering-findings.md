# Engineering findings (Phase 2)

Conventions and risks the agent surfaced, kept only where they point to a concrete file, folder or observed behavior. Vague or taste-based suggestions were dropped (listed at the end). Each finding feeds at least one proposed rule; the rule IDs map to files created in Phase 3 under `.agents/rules/`.

## Architecture

| ID | Finding | Evidence |
|---|---|---|
| A1 | Backend is one FastAPI app; all models, helpers and endpoints live in `backend/app/routes.py`; `main.py` only builds the app, CORS and includes the router. | `backend/app/main.py`, `backend/app/routes.py` |
| A2 | No persistence. Every endpoint rebuilds the dataset with `generate_mock_movements(seed=42)`; tests assert on this data (e.g. 360 items). | `routes.py` (every `@router.get`), `backend/tests/test_routes.py::test_generate_mock_movements_returns_full_year_sorted_data` |
| A3 | Data dates are relative to `date.today()` (rolling last 12 months), not a fixed year. | `_year_for_month()` in `routes.py`; `/api/metrics/facets` → `2025-09-02..2026-08-28` on 2026-09-29 |
| A4 | The API contract is duplicated by hand: Pydantic `Literal` types in `routes.py` and TS unions in `frontend/src/lib/financial-types.ts` (`OperationType`, `Category`, `BusinessType`, `FinancialMovement`). Nothing checks they stay in sync. | both files |
| A5 | The frontend fetches only `GET /api/metrics` and aggregates in the browser; 7 other endpoints are unused by the UI. | `frontend/src/App.tsx` (`fetchFinancialData`) |
| A6 | The business-type filter is re-implemented inline in 4 endpoints instead of in `filter_movements`. | `routes.py` lines with `if business_type is not None:` (summary, top categories, comparison, alerts) |
| A7 | `generate_mock_movements` calls `random.seed(seed)`, resetting Python's global RNG on every request. | `routes.py::generate_mock_movements` |

## Frontend conventions

| ID | Finding | Evidence |
|---|---|---|
| F1 | Imports use the `@/` alias for `src/`. | `vite.config.ts` `resolve.alias`, `tsconfig.app.json` `paths`, all dashboard components |
| F2 | Feature components live in `src/components/dashboard/`, kebab-case filenames, PascalCase named exports; generic primitives in `src/components/ui/` (shadcn "new-york" config). | folder listing, `components.json` |
| F3 | Pure calculation and formatting live in `src/lib/financial-utils.ts` and are unit-tested next to it; components only render. | `financial-utils.ts`, `financial-utils.test.ts`, `kpi-row.tsx` uses `formatCurrency` |
| F4 | Async UI pattern: components take `loading?: boolean` and render `Skeleton` placeholders; `App.tsx` holds `loading`/`error` state. | `kpi-card.tsx`, `income-outcome-chart.tsx`, `profit-percent-chart.tsx`, `App.tsx` |
| F5 | Colors come from CSS variables defined in `src/index.css` (`--chart-income`, `--income-badge`, …), not hard-coded hex. | `index.css`, `kpi-card.tsx` `variantStyles`, chart `stroke="var(--chart-income)"` |
| F6 | Two formatting styles coexist with no formatter config: V0-generated components use single quotes/no semicolons; `App.tsx`, `financial-utils*.ts` use double quotes/semicolons. | quote/semicolon counts per file; no Prettier config in `frontend/` |
| F7 | UI copy is English except one Spanish error message. | `App.tsx` `setError("No se pudo cargar…")` vs English labels in `kpi-row.tsx` |
| F8 | ISO dates from the API are turned into months with `new Date(isoString)` + local `getMonth()`, which shifts day-1 movements into the previous month west of UTC. | `financial-utils.ts::computeMonthlyData`; reproduced in `TZ=America/Toronto` (verification.md C5) |
| F9 | Stale prototype leftovers: unused `src/lib/mock-data.ts` (2024 data) and a hard-coded `"2024 - Full Year"` header label. | grep shows no importer; `App.tsx` `DashboardHeader period=…` |

## Testing

| ID | Finding | Evidence |
|---|---|---|
| T1 | Backend tests: pytest + FastAPI `TestClient` in `backend/tests/test_routes.py`; `conftest.py` adds `backend/` to `sys.path`, so tests run from `backend/` with `python -m pytest`. | `backend/tests/` |
| T2 | Frontend tests: Vitest, colocated `*.test.ts`, only for `lib/`; no component tests. | `package.json` `"test": "vitest run"`, `financial-utils.test.ts` |
| T3 | A test with hard-coded calendar dates silently goes stale because data is relative to today. | `test_metrics_comparison_returns_delta_fields` uses `2025-03-01..31`, outside the window → zeros, only keys asserted |
| T4 | Date logic tests pass in every timezone because no fixture hits the day-1 edge case, so F8 went unnoticed. | `financial-utils.test.ts` fixtures (days 3–15) |
| T5 | No CI: nothing runs lint/tests on push. | no `.github/` directory |

## Developer experience / infrastructure

| ID | Finding | Evidence |
|---|---|---|
| D1 | Docker Compose is the supported way to run; the Vite `/api` proxy targets `http://backend:8000`, so plain `npm run dev` fails with `ENOTFOUND backend` unless `VITE_API_BASE_URL` is set. | `docker-compose.yml`, `vite.config.ts`, `frontend/.env.example` |
| D2 | `/health` is not under `/api`, so through port 5173 it returns the SPA HTML. Use `:8000/health`. | `routes.py` `@router.get("/health")`, `vite.config.ts` proxy key `"/api"` |
| D3 | Backend always starts under `debugpy` with `--reload` (dev-only setup), and CORS allows `*` with credentials. Fine for this mock, not for production. | `backend/Dockerfile` `CMD`, `main.py` `CORSMiddleware` |
| D4 | Python dependencies are unpinned; frontend is locked. | `backend/requirements.txt` (no versions) vs `frontend/package-lock.json` |
| D5 | Secrets/env files are ignored except `.env.example`. | root `.gitignore` (`.env`, `.env.*`, `!.env.example`) |

## Documentation / process

| ID | Finding | Evidence |
|---|---|---|
| P1 | `README.md` is the course assignment, not product documentation; the only run instructions are its "How to run locally" section. | `README.md` |
| P2 | `AGENTS.md` tells agents to read `.agents/rules`, `.agents/skills` and `memory-bank`, none of which existed. | `AGENTS.md`, `ls -a` at `954f812` |
| P3 | Commit history: short, one-concern commits, mostly imperative sentences ("Add top categories endpoint…"), a few with `feat:`/`chore:`/`docs:` prefixes. | `git log` |

## Proposed rules (each mapped to findings)

| Rule file | What it tells an agent | Based on |
|---|---|---|
| `running-and-verifying.md` | Run with Compose; the ports; how to run without Compose (`VITE_API_BASE_URL`); which health checks to use; exact test/lint/build commands to run before finishing. | D1, D2, T1, T2, P1 |
| `backend-api.md` | Where routes/models go; keep `seed=42`; reuse `filter_movements`; validation via `Literal`/`Query`; every API shape change must be mirrored in `financial-types.ts` in the same change. | A1, A2, A4, A6, A7 |
| `frontend-conventions.md` | Folder/naming/alias rules; calculations in `lib/` with tests; `loading` + `Skeleton` pattern; CSS variables for color; English copy; match the formatting of the file you edit. | F1–F7, F9 |
| `dates-and-time.md` | API dates are calendar dates: never bucket them with `new Date(iso)`; test the day-1 edge in a non-UTC timezone; backend tests must derive dates from the data (facets), never hard-code calendar dates. | A3, F8, T3, T4 |
| `testing.md` | Where tests go and how to run them; bug fixes need a regression test that fails before the fix. | T1–T5 |
| `repo-hygiene.md` | Commit style; never commit env files; update `memory-bank/progress.md` when behavior or known gaps change; don't treat `README.md` as product docs. | P1–P3, D5 |

## Dropped (not tied to repo evidence, or out of scope)

- "Add Redux/React Query" — no evidence the app needs it; one fetch in `App.tsx`.
- "Split `routes.py` into many modules" — a refactor, not required; A6 is addressed by a narrower rule.
- "Use a real database" — feature expansion; the mock is intentional (A2).
- "Code-split the bundle" — the build warning is real, but no user-facing issue was observed.
