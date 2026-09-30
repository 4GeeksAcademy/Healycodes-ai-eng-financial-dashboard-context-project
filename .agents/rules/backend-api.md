# Backend API

- Keep FastAPI models, helpers, and route handlers in `backend/app/routes.py`; `backend/app/main.py` owns app setup, CORS, and router inclusion.
- Preserve `generate_mock_movements(seed=42)` unless a task explicitly changes the mock-data contract. Every endpoint currently generates the same deterministic, in-memory dataset; there is no database.
- Add filtering through `filter_movements` and reuse shared helpers. Do not copy the existing inline business-type filter into another endpoint.
- Use the existing `Literal` types and `Query` constraints for API validation. If a response or accepted value changes, update the matching hand-written TypeScript types in `frontend/src/lib/financial-types.ts` in the same change.
- Keep API date behavior rolling and relative to `date.today()` unless the task explicitly changes that contract.
