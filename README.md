# Chakra

Reusable base for desktop apps: **Chakra UI** (Electron library: splash, authentication, CLI configuration) and the **Chakra CLI** (Python: SQLite cache, Google Sheets sync, authentication, email).

- `frontend/` Chakra UI package and a reference consumer app. See [docs/library.md](docs/library.md).
- `backend/` Chakra CLI (`pytest`, PyInstaller build).
- `planning/` shared OpenSpec store; `knowledge/`, `backend/knowledge/`, `frontend/knowledge/` OKF bundles. See `AGENTS.md`.

```bash
cd backend && python -m venv .venv && .venv/bin/pip install -e .[dev] && .venv/bin/pytest
cd frontend && npm install && npm test && npm run dev
```
