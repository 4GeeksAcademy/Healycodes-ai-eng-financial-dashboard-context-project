# Frontend Feature Data Contract

This document is the implementation contract for the date filter, anomaly table, and B2B/B2C comparison view. It describes frontend behavior only; this task does not add components, fetch code, or backend changes.

## Verified API Source

The route and Pydantic model definitions were inspected in `backend/app/routes.py`. The live `/docs` and `/openapi.json` could not be reached in this environment: Docker Compose failed to start the backend because of an existing container ID, and native Uvicorn is unavailable (`No module named uvicorn`). Therefore, contract fields below are verified against the checked-in route source, not a live OpenAPI response.

All dates are calendar dates serialized as `YYYY-MM-DD`. `start_date` and `end_date` filters are inclusive and independently optional. The API uses Pydantic `date` query parameters and responds with JSON dates in ISO format. Omit unset query keys; do not send empty strings.

## Feature 1: Dashboard Date Range

### Endpoints

| Method and path | Use |
|---|---|
| `GET /api/metrics/facets` | Read the full dataset's global reference range from `min_date` and `max_date`. |
| `GET /api/metrics` | Read the home dashboard's movement data with optional `start_date` and `end_date`; the response is a direct `FinancialMovement[]`. |

### Types

`FacetsResponse` in `api-types.ts` matches the `MetricsFacets` model:

| Field | Type | Meaning |
|---|---|---|
| `operation_types` | `OperationType[]` | Dataset values from `income`, `outcome`. |
| `business_types` | `BusinessType[]` | Dataset values from `B2B`, `B2C`. |
| `categories` | `Category[]` | Global dataset category values: `suppliers`, `sales`, `operational`, `administrative`, `others`. |
| `min_date` | `string` | Earliest dataset date, `YYYY-MM-DD`. |
| `max_date` | `string` | Latest dataset date, `YYYY-MM-DD`. |

`FinancialMovement` is the existing frontend type in `src/lib/financial-types.ts` and matches the response fields `create_date`, `amount`, `operation_type`, `category`, and `business_type`.

`DateRangeFilter` contains optional `start_date?: string` and `end_date?: string`; both strings use `YYYY-MM-DD`. The filter uses inclusive bounds. Feature 1's metrics query only accepts these date fields plus optional `category` and `operation_type`; do not invent a business-type query parameter for `/api/metrics`.

### Edge Cases

- Neither date is set: omit both query parameters and show all available data.
- Only `start_date` is set: include that date and later records; only `end_date` is set: include that date and earlier records.
- `start_date` is later than `end_date`: prevent applying the range, retain the last valid filter, and show inline validation.
- The reference hint always describes the full dataset range, not the currently filtered range. If facets cannot load, show the page error state instead of placeholder dates.

## Feature 2: Anomaly Alerts

### Endpoint

`GET /api/metrics/alerts` returns a direct JSON array (`MetricsAlert[]`), not an `{ alerts: [...] }` wrapper.

| Parameter | Type and valid values | API behavior |
|---|---|---|
| `threshold` | `number`, `>= 0` | Optional; defaults to `0.3`. An alert is added only when `increase_ratio > threshold`. There is no API maximum. The requested UI restricts input to `0.01` through `1.0`, step `0.01`. |
| `group_by` | `day \| week \| month` | Optional; defaults to `month`. |
| `start_date` | Optional `YYYY-MM-DD` | Inclusive lower date bound. |
| `end_date` | Optional `YYYY-MM-DD` | Inclusive upper date bound. |
| `business_type` | `B2B \| B2C` | Optional filter; not part of the PM-requested UI. |

`AlertsParams` extends `DateRangeFilter` and models the optional query values. `AlertEntry` matches `MetricsAlert`; `AlertsResponse` is `AlertEntry[]`.

| Response field | Type | Meaning |
|---|---|---|
| `period` | `string` | Bucket label: day `YYYY-MM-DD`, week `YYYY-Www`, month `YYYY-MM`. |
| `outcome_total` | `number` | Sum of outcome amounts for the bucket. |
| `baseline_average` | `number` | Average outcome across all earlier buckets in the already date-filtered summary. |
| `increase_ratio` | `number` | `(outcome_total - baseline_average) / baseline_average`; multiply by 100 for a percent display. |

**Verified requirement mismatch:** the PM asks for an average of the previous three periods, but `detect_outcome_alerts` in `backend/app/routes.py` averages all earlier buckets, not only the previous three. This frontend contract does not mislabel the response: use the column label **Historical average** and explain that a true three-period rolling baseline requires a separate backend change. The alerts endpoint also applies the date filter before calculating its baseline, so periods preceding the selected `start_date` are excluded from that baseline.

### Edge Cases

- The response is `[]`: keep the anomaly section visible and show `No spending anomalies found for this threshold and date range.`
- The UI threshold is empty, non-finite, below `0.01`, or above `1.0`: reject it, retain the last valid value, and show a validation message; do not send the rejected value.
- The first bucket in a filtered range has no earlier bucket in that filtered summary, so it cannot produce an alert. A date range with fewer than two buckets therefore returns no anomalies.
- `increase_ratio` is a ratio, not an already-scaled percentage; `0.3` displays as `30%`, not `0.3%`.

## Feature 3: B2B vs B2C Comparison

### Endpoints

| Method and path | Use |
|---|---|
| `GET /api/metrics/facets` | Global category vocabulary (`categories`) and available dataset bounds (`min_date`, `max_date`). The endpoint does not partition categories by business line. |
| `GET /api/metrics/categories/top` | Fetch one top-income-category list per business line. |
| `GET /api/metrics` | Fetch date-filtered movements once, then derive each business line's total income and percentage denominator from `income` movements. |

Call `/api/metrics/categories/top` twice with `operation_type=income`, `limit=5`, and `business_type=B2B` then `business_type=B2C`. Include the same optional date range on both calls and on `/api/metrics`. Top results are ordered by `total_amount` descending by the backend. The endpoint's default operation is `outcome`, so the comparison view must send `income` explicitly.

### Types

`TopCategoriesParams` extends `DateRangeFilter` and has optional `operation_type?: OperationType`, `limit?: number`, and `business_type?: BusinessType`. For this view, send `income`, `5`, and one business type per request. The API permits operation type `income` or `outcome`, integer `limit` from `1` through `20` (default `5`), and business type `B2B` or `B2C`.

`CategoryEntry` matches the backend `TopCategoryItem` model:

| Field | Type | Meaning |
|---|---|---|
| `category` | `Category` | Category identifier. |
| `operation_type` | `OperationType` | Requested operation type. |
| `total_amount` | `number` | Total amount for this category after filters. |

`TopCategoriesResponse` is a direct `CategoryEntry[]`. The API does not return group percentage. `CategoryTableRow` is a derived UI type with `category`, `total_amount`, and `group_percentage` (percentage from 0 through 100). Compute `group_percentage = total_amount / group_total * 100`, where `group_total` is the sum of `amount` for all date-filtered movements with `operation_type === "income"` and the matching `business_type`. Do not use the sum of top-five entries as the denominator.

`IncomeComparisonPoint` is a derived UI type containing `business_type` and `total_income`. The chart must have one point for each of `B2B` and `B2C`; derive each total from the same filtered movements and use zero if that group has no income records.

`FacetsResponse.categories` is one global list. It is the category vocabulary, not a B2B/B2C mapping; group-specific results come from the two filtered top-category requests.

### Edge Cases

- A top-category response is empty: retain the panel heading and table structure and show `No income categories found for {businessType} in this date range.`
- A business line has no income in the selected date range: use a zero total and show `0%` for any category rows; never divide by zero or render `NaN`/infinity.
- One line has no movements while the other has data: keep both chart points, assigning zero to the empty line.
- The selected range is unset: omit date query parameters consistently from both top-category calls and the movement request.

## TypeScript Files

- `api-types.ts`: API response types plus explicitly marked UI-derived row/chart types.
- `param-types.ts`: optional date filters and typed alert/top-category query parameters.
- `src/lib/financial-types.ts`: shared primitive unions and existing `FinancialMovement` type; this spec does not duplicate their definitions.

All properties in the new type files have JSDoc describing meaning, valid values, or format. `tsconfig.app.json` includes `specs/` so these contracts are checked by the frontend TypeScript compiler. There is no `any` or `object` in the spec types.