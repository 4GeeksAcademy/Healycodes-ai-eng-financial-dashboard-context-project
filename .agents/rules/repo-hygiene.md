# Repository Hygiene

- Keep commits focused on one stewardship phase or one behavior change. Use a short imperative subject, consistent with the existing history, and explain verification or corrections in the body when useful.
- Never commit `.env` files, credentials, or generated dependency/build output; `.env.example` is the only environment file intended for version control.
- When behavior or a known gap changes, update `memory-bank/progress.md` in the same commit. Keep product and stack claims tied to code, configuration, or a recorded verification check.
- Treat `README.md` as the course handover instructions, not as evidence for product behavior when code or configuration provides stronger evidence.
