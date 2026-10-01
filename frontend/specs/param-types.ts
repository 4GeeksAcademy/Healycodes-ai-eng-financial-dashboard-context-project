import type { BusinessType, OperationType } from "../src/lib/financial-types";

/** Optional inclusive calendar-date filters accepted by the metrics endpoints. */
export interface DateRangeFilter {
  /** Inclusive lower date bound, formatted as `YYYY-MM-DD`; omit to include the earliest available date. */
  start_date?: string;
  /** Inclusive upper date bound, formatted as `YYYY-MM-DD`; omit to include the latest available date. */
  end_date?: string;
}

/** Query parameters accepted by `GET /api/metrics/alerts`. */
export interface AlertsParams extends DateRangeFilter {
  /** Minimum increase ratio; API accepts any number greater than or equal to 0 and defaults to 0.3. */
  threshold?: number;
  /** Alert bucket size; API values are `day`, `week`, or `month`, defaulting to `month`. */
  group_by?: "day" | "week" | "month";
  /** Optional business-line filter; API values are `B2B` or `B2C`. */
  business_type?: BusinessType;
}

/** Query parameters accepted by `GET /api/metrics/categories/top`. */
export interface TopCategoriesParams extends DateRangeFilter {
  /** Operation filter; this comparison view must send `income` (API default is `outcome`). */
  operation_type?: OperationType;
  /** Maximum result count; integer from 1 through 20, defaulting to 5. */
  limit?: number;
  /** Business-line filter; send one request with `B2B` and one with `B2C`. */
  business_type?: BusinessType;
}