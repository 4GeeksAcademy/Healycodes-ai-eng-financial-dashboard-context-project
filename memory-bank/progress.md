# Progress and current status

_Last verified: 2026-09-29, on the commit that added this file._

## What works

- Backend: all 9 routes respond; invalid query values return 422 (`verification.md` Phase 1).
- Frontend: dashboard loads KPIs and two monthly charts from `GET /api/metrics`, with loading skeletons and an error banner.
- Checks: backend **15** tests pass; frontend **6** tests pass in UTC and America/Toronto; `npm run lint` clean; `npm run build` succeeds.

## Fixed during handover (Phase 3)

- **Monthly chart put 1st-of-month movements in the previous month** for users west of UTC (`new Date(iso)` parsed as UTC). `computeMonthlyData` now groups by the `YYYY-MM` prefix; regression test added. Live Toronto chart now matches `/api/metrics/summary`.
- **Comparison test checked nothing** — it used 2025-03 dates outside the rolling data window. It now derives dates from `/api/metrics/facets` and asserts real values.

## Known gaps (verified, not fixed)

| Gap | Evidence | Impact |
|---|---|---|
| Header says "2024 - Full Year" but data is the last 12 months | `App.tsx` `period=` vs `_year_for_month` | Misleading label |
| `src/lib/mock-data.ts` is unused 2024 prototype data | no importer (grep) | Dead code that suggests the wrong year |
| One Spanish error string in an English UI | `App.tsx` `setError(...)` | Inconsistent copy |
| Plain `npm run dev` can't reach the API outside Compose | proxy target `backend:8000` in `vite.config.ts` | Needs `VITE_API_BASE_URL` when not using Compose |
| `/health` not reachable via :5173 | only `/api` proxied | Use :8000/health |
| API types duplicated by hand in backend and frontend | `routes.py` vs `financial-types.ts` | Can drift silently |
| Business-type filter copied in 4 endpoints | `routes.py` | Risk of inconsistent fixes |
| No CI | no `.github/` | Tests only run if someone runs them |
| Python deps unpinned; debugpy + `--reload` always on; CORS `*` with credentials | `requirements.txt`, `backend/Dockerfile`, `main.py` | Fine for a mock, not production-ready |
| Build warns about a >500 kB chunk | `npm run build` | No observed user impact |

## Next priorities (derived from the gaps above, not a product roadmap)

1. ~~Confirm `docker compose up --build`~~ — done, verified in Codespaces.
2. Derive the header period from the data and delete `mock-data.ts`.
3. Translate the error banner to English.
4. Add a CI workflow running backend pytest and frontend lint/test (both timezones)/build.
5. Move the business-type filter into a shared helper used by all endpoints.

## Change log

| Date | Change |
|---|---|
| 2026-09-29 | Handover: verification trail, engineering findings, `.agents/rules`, two validated fixes, this memory bank |
