import type {
  BusinessType,
  Category,
  OperationType,
} from "../src/lib/financial-types";

/** Response body returned by `GET /api/metrics/facets`. */
export interface FacetsResponse {
  /** Distinct operation types in the full dataset: `income` and/or `outcome`. */
  operation_types: OperationType[];
  /** Distinct business lines in the full dataset: `B2B` and/or `B2C`. */
  business_types: BusinessType[];
  /** Distinct categories across the full dataset; this list is not split by business line. */
  categories: Category[];
  /** Earliest `create_date` in the full dataset, serialized as `YYYY-MM-DD`. */
  min_date: string;
  /** Latest `create_date` in the full dataset, serialized as `YYYY-MM-DD`. */
  max_date: string;
}

/** One anomaly returned by `GET /api/metrics/alerts`. */
export interface AlertEntry {
  /** Bucket label: `YYYY-MM-DD` for day, `YYYY-Www` for week, or `YYYY-MM` for month. */
  period: string;
  /** Total outcome amount in this period, in the dataset's currency units. */
  outcome_total: number;
  /** Average outcome amount of all earlier periods in the filtered response, not a three-period rolling average. */
  baseline_average: number;
  /** Increase ratio relative to `baseline_average`; multiply by 100 to display a percentage. */
  increase_ratio: number;
}

/** Direct array response body returned by `GET /api/metrics/alerts` (not an object wrapper). */
export type AlertsResponse = AlertEntry[];

/** One category total returned by `GET /api/metrics/categories/top`. */
export interface CategoryEntry {
  /** Category identifier from the API category union. */
  category: Category;
  /** Operation type requested from the endpoint: `income` or `outcome`. */
  operation_type: OperationType;
  /** Sum of `amount` for this category after endpoint filters, in currency units. */
  total_amount: number;
}

/** Direct array response body returned by `GET /api/metrics/categories/top` (not an object wrapper). */
export type TopCategoriesResponse = CategoryEntry[];

/** UI row derived from a category result and its business-line total; not an API response shape. */
export interface CategoryTableRow {
  /** Category identifier shown in the top-categories table. */
  category: Category;
  /** Category income amount in currency units. */
  total_amount: number;
  /** Share of the business-line income total, expressed from 0 through 100. */
  group_percentage: number;
}

/** UI chart datum derived by summing income category totals for one business line. */
export interface IncomeComparisonPoint {
  /** Business line represented by this chart datum. */
  business_type: BusinessType;
  /** Total income for this business line and selected date range, in currency units. */
  total_income: number;
}