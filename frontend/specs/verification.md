# Phase 1: API Exploration & Verification Trail

## Verification Source and Limitation

- Inspected the route handlers and Pydantic response models in `backend/app/routes.py`, plus existing frontend use of `GET /api/metrics` in `frontend/src/App.tsx`.
- Live `http://localhost:8000/docs` and `/openapi.json` were unavailable: `docker compose up -d backend` failed because the container runtime reported an existing container ID, and native `python -m uvicorn` failed because Uvicorn is not installed in the environment. Claims below are verified against checked-in route source, not a live OpenAPI fetch.

## 1. Feature 1: Date Range Filter on Home Dashboard
- **Target Endpoints**:
  - `GET /api/metrics/facets`
  - `GET /api/metrics`
- **Query Parameters**:
  - `start_date` (`date | null`, format `YYYY-MM-DD`, optional)
  - `end_date` (`date | null`, format `YYYY-MM-DD`, optional)
- **Response Schema (`MetricsFacets`)**:
  - `operation_types`: `("income" | "outcome")[]`
  - `business_types`: `("B2B" | "B2C")[]`
  - `categories`: `("suppliers" | "sales" | "operational" | "administrative" | "others")[]`
  - `min_date`: `string` (`YYYY-MM-DD`)
  - `max_date`: `string` (`YYYY-MM-DD`)
- `categories` is a global list; the facets response does not associate categories with B2B or B2C.
- `/api/metrics` accepts optional inclusive `start_date` and `end_date`, and returns a direct array of movements.

## 2. Feature 2: Anomaly Alerts Table
- **Target Endpoint**: `GET /api/metrics/alerts`
- **Query Parameters**:
  - `threshold` (`float`, default `0.3`, `ge=0`; no API maximum)
  - `group_by` (`"day" | "week" | "month"`, default `"month"`)
  - `start_date` (`date | null`, optional)
  - `end_date` (`date | null`, optional)
  - `business_type` (`"B2B" | "B2C" | null`, optional)
- **Response Schema (`list[MetricsAlert]`)**:
  - Array of items containing:
    - `period`: `string`
    - `outcome_total`: `number` (float)
    - `baseline_average`: `number` (float; mean of all earlier buckets in the date-filtered summary, not a rolling mean of three buckets)
    - `increase_ratio`: `number` (float ratio, not percentage; alert condition is strictly greater than `threshold`)

## 3. Feature 3: B2B vs B2C Comparison View
- **Target Endpoints**:
  - `GET /api/metrics/facets`
  - `GET /api/metrics/categories/top`
  - `GET /api/metrics/comparison`
- **Query Parameters for Top Categories**:
  - `operation_type`: `"income" | "outcome"` (default `"outcome"`)
  - `limit`: `integer` (default `5`, min `1`, max `20`)
  - `start_date`: `date | null`, optional
  - `end_date`: `date | null`, optional
  - `business_type`: `"B2B" | "B2C" | null`, optional
- **Response Schema (`list[TopCategoryItem]`)**:
  - Array of items containing:
    - `category`: `string`
    - `operation_type`: `"income" | "outcome"`
    - `total_amount`: `number` (float)
  - For B2B/B2C, pass `business_type` separately for each request; `categories` in facets is not grouped by business type.
  - Neither top-category results nor facets return group percentage or total group income. Derive both from date-filtered `/api/metrics` movements grouped by `business_type` and filtered to `operation_type=income`.

## Discrepancies & Resolutions (PM vs. Actual Code)
1. **Alert Model Field Names**:
   - PM called fields "recorded outcome", "rolling average", and "percentage increase".
   - Verified backend fields in `MetricsAlert` are: `outcome_total`, `baseline_average`, and `increase_ratio`.
2. **Alerts Response Structure**:
   - Backend returns a direct list (`list[MetricsAlert]`), not a wrapped `{ alerts: [...] }` dictionary.
3. **Top Categories Response Structure**:
   - Backend returns a direct list (`list[TopCategoryItem]`), with amount labeled `total_amount`. Group total and percentage must be calculated on the client side or derived via facets/summary.
4. **Anomaly Baseline Algorithm**:
  - PM wording says previous 3 periods; backend uses the average of all earlier summary buckets after applying the date filter. The frontend spec labels this accurately as a historical average; a true rolling-three baseline requires a backend change.
5. **Facets Category Grouping**:
  - PM wording asks for available categories per group; the facets response contains one global `categories` list. Business-filtered category results come from `/api/metrics/categories/top`.
