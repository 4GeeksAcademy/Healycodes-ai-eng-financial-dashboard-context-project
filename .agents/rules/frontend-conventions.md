# Frontend Conventions

- Use the `@/` alias for `src/` imports. Put dashboard feature components in `frontend/src/components/dashboard/` with kebab-case filenames and named PascalCase exports; keep generic primitives in `components/ui/`.
- Keep pure calculations and formatters in `frontend/src/lib/` and colocate unit tests in `*.test.ts`. Components should render data rather than duplicate calculation logic.
- Follow the existing loading pattern: async UI owns `loading` and `error` state, and data-dependent components accept `loading` and render `Skeleton` placeholders.
- Use CSS variables from `frontend/src/index.css` for colors, including chart colors; do not introduce hard-coded component hex colors.
- Keep user-facing copy in English to match the current UI. Match the quote and semicolon style of the file being edited because the repository has no formatter configuration.
- Treat `frontend/src/lib/mock-data.ts` and the hard-coded 2024 header as stale prototype artifacts; do not make new code depend on them.
