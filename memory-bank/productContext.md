# Product context

## What it is

A single-page **financial overview dashboard** ("Financial Overview — Executive metrics dashboard", `frontend/src/components/dashboard/dashboard-header.tsx`) backed by a small **Financial Metrics API** (`FastAPI(title="Financial Metrics API")`, `backend/app/main.py`).

The repository is a 4Geeks Academy teaching project: `README.md` describes an exercise (make the repo "agent-ready"), not a product roadmap. There is no stated customer, business, or release plan in the repo, so none is assumed here.

## What the user sees (verified by running it)

- **Four KPI cards** — Total Income, Total Outcome, Profit, Profit Margin (`kpi-row.tsx`), computed in the browser by `computeKPIs` (`src/lib/financial-utils.ts`).
- **Income vs. Outcome** line chart by month (`income-outcome-chart.tsx`).
- **Profit Margin %** line chart by month (`profit-percent-chart.tsx`).
- Skeleton placeholders while loading and an error banner if the API call fails (`App.tsx`).
- No filters, date pickers, navigation, login, or other pages.

## Data

- A **financial movement** has `create_date`, `amount`, `operation_type` (`income` | `outcome`), `category` (`suppliers`, `sales`, `operational`, `administrative`, `others`) and `business_type` (`B2B` | `B2C`) — `FinancialMovement` in `backend/app/routes.py` and `frontend/src/lib/financial-types.ts`.
- **All data is generated**, not real: `generate_mock_movements(seed=42)` creates 360 movements (30 per month) covering the **last 12 months relative to today**. It is the same on every request.
- Income is mostly `sales`; outcomes are spread over the other categories (`_build_movement`).

## API capabilities beyond what the UI uses

The UI only calls `GET /api/metrics`. The API also offers, unused by the UI today: `/api/metrics/facets` (filter options + date range), `/summary` (income/outcome/net by day, week or month), `/categories/top`, `/comparison` (period vs previous period), `/alerts` (outcome spikes above a threshold), and `/b2b`, `/b2c` subsets. See `http://localhost:8000/docs`.

## Not claimed

No evidence in the repo for: real data sources, users/roles, currencies other than USD formatting (`formatCurrency`), deployment targets, or planned features. Don't add these to documentation without a source.
