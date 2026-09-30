# Dates and Time

- API `create_date` values are calendar dates in `YYYY-MM-DD`, not timestamps. Bucket them using the string's `YYYY-MM` prefix; do not parse them with `new Date(iso)` and local `getMonth()`.
- Add a regression fixture on the first day of a month when changing month grouping, and run it in at least one non-UTC timezone.
- Backend test dates must be derived from `/api/metrics/facets` or returned data because the generated dataset covers the last 12 months relative to today. Do not hard-code a historical year and accidentally test an all-zero period.
