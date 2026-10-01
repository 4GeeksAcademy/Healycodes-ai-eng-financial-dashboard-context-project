# Component Specifications

These are frontend requirements only. They describe component contracts and rendering; they do not authorize implementing components or API calls in this project.

## Feature 1: Home Dashboard Date Range

### `DateRangeFilter`

**Props**

| Prop | Type | Meaning |
|---|---|---|
| `value` | `DateRangeFilter` | Current optional inclusive `start_date` and `end_date` values. |
| `availableRange` | `Pick<FacetsResponse, "min_date" \| "max_date">` | Full-dataset lower and upper date bounds from facets. |
| `onChange` | `(value: DateRangeFilter) => void` | Emits the complete filter whenever either date changes; empty values are omitted. |
| `disabled` | `boolean` | Disables both date inputs while facets or dashboard data are initially loading. |
| `error` | `string \| null` | Validation message for an invalid range; otherwise `null`. |

Render two labeled native date inputs, Start date and End date. Display the reference text `Available dates: {min_date} to {max_date}` beside or directly below the inputs. Set the input minimum and maximum to the available bounds. An empty input means no bound and must not be serialized as an empty query parameter.

Changing either date immediately emits the new filter and reloads all home-dashboard data. With only `start_date`, include records on or after that date; with only `end_date`, include records on or before it. With both dates, both bounds are inclusive. If `start_date > end_date`, keep the last valid applied filter, show an inline validation error, and do not issue a request. When facets are loading, show a loading placeholder for the reference range; when facets fail, show the page's error state rather than inventing bounds.

The filter applies to the existing dashboard's `GET /api/metrics` data and to the anomaly query. Empty dates are omitted, preserving the unfiltered view. Date strings remain calendar dates in `YYYY-MM-DD`; do not parse them as local timestamps.

## Feature 2: Anomaly Alerts

### `AlertThresholdControl`

**Props**

| Prop | Type | Meaning |
|---|---|---|
| `value` | `number` | Current accepted threshold ratio. |
| `onChange` | `(threshold: number) => void` | Emits an accepted threshold and refreshes alerts. |
| `disabled` | `boolean` | Disables input while alerts are loading. |
| `error` | `string \| null` | Validation message for an unaccepted value. |

Render a labeled numeric input with `min=0.01`, `max=1`, and `step=0.01`; initialize to `0.3`. These are the requested UI bounds, not the API's full accepted range (the API only enforces `threshold >= 0`). Reject values below `0.01`, above `1.0`, non-finite values, and empty input; keep the last accepted value and show an inline message. Send only accepted values. The backend flags an increase only when `increase_ratio > threshold` (strictly greater than).

### `AnomalyAlertsTable`

**Props**

| Prop | Type | Meaning |
|---|---|---|
| `alerts` | `AlertsResponse` | Direct array of alert records from the API. |
| `loading` | `boolean` | Shows row-shaped skeletons instead of stale table contents. |
| `error` | `string \| null` | Shows an inline error and retry action when the request fails. |

Render a semantic table with these four columns:

| Column | Value | Display rule |
|---|---|---|
| Period | `period: string` | Render the API bucket label unchanged (`YYYY-MM-DD`, `YYYY-Www`, or `YYYY-MM`, depending on `group_by`). |
| Recorded outcome | `outcome_total: number` | Format as currency using the existing dashboard currency formatter. |
| Historical average | `baseline_average: number` | Format as currency. This is the average of all earlier buckets in the filtered summary, not a rolling average of exactly three buckets. |
| Increase | `increase_ratio: number` | Multiply by 100 and display as a percentage. |

The API does not currently satisfy the PM's “previous 3 periods” baseline wording. Do not label `baseline_average` as a three-period rolling average or silently recompute it. This spec uses the API's actual field and labels it “Historical average”; changing the algorithm to a three-period rolling baseline requires a backend contract change outside this frontend-spec task.

When `alerts` is empty and the request succeeded, render the explicit message `No spending anomalies found for this threshold and date range.` Keep the table section and heading visible. An empty array is not a loading or error state. Request alerts with the current date range and selected threshold; use `group_by=month` for the initial/default table. Preserve the same range on every threshold change.

## Feature 3: B2B vs B2C Comparison

### `BusinessLineComparisonPage`

**Props**

| Prop | Type | Meaning |
|---|---|---|
| `dateRange` | `DateRangeFilter` | Optional inclusive range shared by both business-line panels and the chart. |
| `facets` | `FacetsResponse` | Global category and date-range facets. |
| `b2bCategories` | `CategoryTableRow[]` | B2B top income category rows with derived group percentages. |
| `b2cCategories` | `CategoryTableRow[]` | B2C top income category rows with derived group percentages. |
| `incomeTotals` | `IncomeComparisonPoint[]` | Exactly one total-income datum per business line, including a zero total when there are no matching movements. |
| `loading` | `boolean` | Shows loading placeholders for both panels and chart. |
| `error` | `string \| null` | Shows a page-level error if a required request fails. |
| `onDateRangeChange` | `(value: DateRangeFilter) => void` | Updates the shared range and refreshes all comparison data. |

Lay out two equal-width sections side by side at wide viewports, B2B on the left and B2C on the right; stack them on narrow viewports. Include one shared date-range control whose available-range hint uses `facets.min_date` and `facets.max_date`. Both date bounds are optional and inclusive.

### `BusinessLineTopCategoriesTable`

**Props**

| Prop | Type | Meaning |
|---|---|---|
| `businessType` | `BusinessType` | The section identity: `B2B` or `B2C`. |
| `rows` | `CategoryTableRow[]` | Up to five income categories, sorted by `total_amount` descending. |
| `availableCategories` | `FacetsResponse["categories"]` | Global category vocabulary from facets; facets does not return categories partitioned by business type. |
| `loading` | `boolean` | Shows table skeleton rows. |

Each panel heading names its business line. Render columns Category, Total income, and % of group total. Format amounts as currency and percentages as percentages. The denominator is that business line's sum of all income movements in the selected date range, not merely the sum of the returned top-five rows. Derive each row's percentage as `total_amount / group_total * 100`. If `group_total` is zero, show `0%` for each row rather than `NaN` or infinity. If a panel's top-category list is empty, keep its heading and table region visible and show `No income categories found for B2B in this date range.` or the equivalent `B2C` message.

The facets endpoint supplies global categories only. Use it as the category vocabulary/reference, but use each business-filtered top-category response to determine which categories actually appear in that panel; do not claim facets provides per-business-line lists.

### `BusinessLineIncomeComparisonChart`

**Props**

| Prop | Type | Meaning |
|---|---|---|
| `data` | `IncomeComparisonPoint[]` | Two points: total income for `B2B` and total income for `B2C` over the shared date range. |
| `loading` | `boolean` | Shows the chart loading placeholder. |

Render one comparison chart with two labeled values/bars, one for each business line. Each point represents the sum of `amount` for movements where `operation_type` is `income` and `business_type` matches the point, after applying the selected date range. Obtain denominator and chart totals from the date-filtered `/api/metrics` movement response; top-five totals alone are not the group total. Always represent both lines, using zero when a line has no income in range. If all data is zero, render the chart with both zero values and a visible zero baseline, not an empty state.