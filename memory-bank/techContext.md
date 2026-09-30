# Tech context

## Stack

| Layer | Technology | Source |
|---|---|---|
| Backend language | Python — image `python:3.13-slim` | `backend/Dockerfile` |
| API framework | FastAPI + Pydantic v2 models, served by Uvicorn | `backend/requirements.txt`, `backend/app/main.py` |
| Backend debug | debugpy on port 5678, always on in the container | `backend/Dockerfile` `CMD` |
| Backend tests | pytest, pytest-cov, httpx (FastAPI `TestClient`) | `backend/requirements.txt`, `backend/tests/` |
| Frontend language | TypeScript (~6.0) | `frontend/package.json` |
| UI | React 19, built and served by Vite 8 | `frontend/package.json`, `vite.config.ts` |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), CSS variables in `src/index.css`, shadcn-style primitives (`components.json`, "new-york") | |
| Charts / icons | Recharts 3, lucide-react | `package.json` |
| Frontend tests / lint | Vitest 4; ESLint 9 with typescript-eslint, react-hooks, react-refresh | `package.json`, `eslint.config.js` |
| Runtime images | `node:24-alpine` (frontend), `python:3.13-slim` (backend) | Dockerfiles |
| Orchestration | Docker Compose, two services | `docker-compose.yml` |

Python packages are **unpinned** in `requirements.txt` (resolved on 2026-09-29 to fastapi 0.142.1, pydantic 2.13.3, uvicorn 0.46.0). The frontend is locked by `package-lock.json` (installed: react 19.2.5, vite 8.0.8, recharts 3.8.1, tailwindcss 4.2.2, vitest 4.1.4).

## How the pieces connect

```
browser ──► Vite dev server :5173 ──/api/*──► backend:8000 (FastAPI)
                 │                               └─ routes.py builds data with
                 └─ serves React app                generate_mock_movements(seed=42)
```

- `frontend/src/App.tsx` fetches `${VITE_API_BASE_URL ?? ""}/api/metrics` once on load, then computes KPIs and monthly series with `src/lib/financial-utils.ts`.
- With an empty `VITE_API_BASE_URL`, the request goes to the Vite proxy (`vite.config.ts` → `http://backend:8000`), which only resolves on the Compose network.
- Backend CORS allows all origins (`main.py`), so setting `VITE_API_BASE_URL=http://localhost:8000` also works.

## Layout

```
backend/app/main.py        app + CORS + router
backend/app/routes.py      models, data generator, helpers, all endpoints
backend/tests/             pytest (test_routes.py, conftest.py)
frontend/src/App.tsx       fetch + loading/error state + page layout
frontend/src/components/dashboard/   feature components (kebab-case files)
frontend/src/components/ui/          card, skeleton primitives
frontend/src/lib/          types, calculations (+ tests), cn() helper, unused mock-data.ts
.agents/rules/             rules for agents
docs/engineering-findings.md  evidence behind the rules
```

## Run and test

| Task | Command |
|---|---|
| Run everything | `docker compose up --build` → frontend http://localhost:5173, API http://localhost:8000, docs http://localhost:8000/docs |
| Backend tests | `cd backend && python -m pytest` |
| Frontend checks | `cd frontend && npm run lint && npm test && npm run build` |
| Date logic | `TZ=UTC npm test` and `TZ=America/Toronto npm test` |

Details and pitfalls: `.agents/rules/running-and-verifying.md`.
