## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:

- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)

## Layout

- `frontend/` — Electron app (run npm commands here). `backend/` — Python service (skeleton).
- `planning/` — shared OpenSpec store (specs, changes, `backend`/`frontend`/`fullstack` intent-driven schemas). See `planning/README.md`. Select the schema explicitly when creating a change; do not create component-local `openspec/specs` or `openspec/changes`.
- `knowledge/` (common), `backend/knowledge/`, `frontend/knowledge/` — three independent OKF v0.2 bundles. Consult common plus each affected component bundle before writing requirements or OpenSpec artifacts, and cite relevant concepts. Bundles never link to each other, to changes, or to code. Validate with `python3 scripts/verify_knowledge.py <bundle>`.
- `skills/` — canonical skills; `python3 scripts/sync_skills.py` links them into agent dirs (`--verify` to check).
- `docs/` — source material, not approved contracts.

Frontend runtime files (`config/`, `data/`, `.chakra/`) are relative to `frontend/`.
