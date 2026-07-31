# frontend — Next.js (App Router)

Own git repo (`origin`: `faidzagustiawan-netizen/frontend-tolongin`). Push straight to `main`.
Deployed on Vercel.

Layout: `app/` (route groups `(auth)`, `(dashboard)`, plus `api`, `challenges`, `companies`,
`leaderboard`, `legal`, `privacy`, `talents`, `terms`), `components/`, `contexts/`, `hooks/`,
`lib/`, `services/`, `store/`, `types/`, `utils/`, `e2e/` (Playwright specs).

## Commands

- dev server: prefer the `frontend` entry in `../.claude/launch.json` (port 3000), not a raw shell
- typecheck: `npx tsc --noEmit`
- unit tests: `npm test` (vitest) · e2e: Playwright specs in `e2e/`
- lint: `npm run lint` · build: `npm run build`

## Verifying UI work

The backend runs on port 3001; start it too when a change depends on live data. After a UI change,
verify it in the preview yourself — read the page, check the console, take a screenshot — and show
the result. Never hand the user a change and ask them to look at it manually.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
