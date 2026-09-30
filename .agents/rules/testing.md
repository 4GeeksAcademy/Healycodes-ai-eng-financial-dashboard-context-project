# Testing

- Backend tests belong in `backend/tests/` and use pytest with the FastAPI `TestClient`; frontend calculation tests belong next to the library under test in `frontend/src/lib/`.
- A bug fix must include a regression test that would fail against the old behavior. Assert meaningful values or behavior, not only response keys or status codes.
- For rolling-data behavior, derive dates from the API response or facets. For date grouping, run frontend tests in both `TZ=UTC` and `TZ=America/Toronto`.
- Run the complete focused suite from `running-and-verifying.md` before reporting the task complete.
