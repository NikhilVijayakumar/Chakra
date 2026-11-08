# Chakra

Reusable base for desktop apps: **Chakra UI** (Electron library: splash, authentication, CLI configuration) and the **Chakra CLI** (Python: SQLite cache, Google Sheets sync, authentication, email).

- `frontend/` Chakra UI package and a reference consumer app. See [docs/library.md](docs/library.md).
- `backend/` Chakra CLI (`pytest`, PyInstaller build).
- `planning/` shared OpenSpec store; `knowledge/`, `backend/knowledge/`, `frontend/knowledge/` OKF bundles. See `AGENTS.md`.

Build both parts for this machine (Windows, Linux, macOS) with one script. Outputs go to `dist/` and are never committed:
```bash
python scripts/build.py                  # release: CLI folder + npm tarball (+ installer on Windows)
python scripts/build.py --dev            # dev: CLI folder + frontend/dist-lib in place + run-ui launcher
python scripts/build.py --lib | --cli [--onefile] [--out DIR] [--no-installer]
```
A release writes `Chakra-CLI/` (with `chakra.cmd`), `Chakra-CLI-Setup-<version>.exe` on Windows, and `nikhilvijayakumar-chakra-ui-<version>.tgz`. `--dev` skips the installer and tarball and writes `run-ui.cmd`/`run-ui.sh` for the reference app. An app installs the tarball (`npm install dist/nikhilvijayakumar-chakra-ui-<version>.tgz`) and sets the CLI path in the library's configuration screen.

Output folders come from `.env` (`CHAKRA_BUILD_DIR`, or `CHAKRA_BUILD_LIB_DIR` / `CHAKRA_BUILD_CLI_DIR`; `CHAKRA_DEV_DIR` for `--dev`; see `.env.example`); a machine without those uses `./dist`.

```bash
cd backend && python -m venv .venv && .venv/bin/pip install -e .[dev] && .venv/bin/pytest
cd frontend && npm install && npm test && npm run dev
```

End-to-end check of the reference consumer against the built CLI (Linux, needs `xvfb-run`):
```bash
cd backend && .venv/bin/python build_cli.py --onefile && .venv/bin/python tests/seed_demo.py /tmp/chakra-e2e
cd ../frontend && npx electron-vite build && xvfb-run -a node e2e/consumer.mjs ../backend/dist/chakra /tmp/chakra-e2e
```

Configuration: copy `.env.example` to `.env`. Each machine keeps its own `.env`; `CHAKRA_HOME` is an absolute path in that machine's own format and is ignored if it is for another OS.
