# Running and Verifying

- Use `docker compose up --build` for the supported two-service workflow. It exposes the Vite frontend at `http://localhost:5173`, FastAPI at `http://localhost:8000`, and API docs at `http://localhost:8000/docs` because those ports are declared in `docker-compose.yml`.
- Check backend health at `http://localhost:8000/health`; `/health` is not proxied by Vite. Check the frontend with `http://localhost:5173/` and the proxied API with `http://localhost:5173/api/metrics`.
- For native frontend development, set `VITE_API_BASE_URL=http://localhost:8000`; the Vite proxy target `http://backend:8000` only resolves on the Compose network.
- Before finishing a backend change, run `cd backend && python -m pytest`.
- Before finishing a frontend change, run `cd frontend && npm run lint && npm test && npm run build`.
- Date behavior needs explicit timezone checks: run `cd frontend && TZ=UTC npm test` and `TZ=America/Toronto npm test`.
