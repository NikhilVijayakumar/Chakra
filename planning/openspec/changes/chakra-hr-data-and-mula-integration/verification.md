# Verification Record: chakra-hr-data-and-mula-integration

## Backend (Chakra), 2026-11-05
- `backend/.venv/bin/python -m pytest`: 72 passed (was 29). New: `test_write.py` (11), `test_twoway.py` (13), `test_quarantine.py` (10), `test_registry.py` (5), contract additions (3).
- Built CLI (`build_cli.py --onefile`): `meta version` -> 0.3.0, `apiVersion` 2; `content create`, `quarantine count`, `sync status` answer against a seeded cache.
- Not yet verified: new `sheets.py` calls (update/append/delete rows) against the real Google API. Needs a scratch spreadsheet (task 8.3).
- Not applicable to that run: Mula baseline (task 1.4) and Mula work (section 7); see the 2026-11-08 entries.

## Library (Chakra), 2026-11-05
- `npm run typecheck`: clean. `npx vitest run`: 32 passed (was 24): whitelist/`appId` injection for all 11 new ops, passwords not in argv, long timeout only for `sync.run` and `quarantine.scan`, v1 CLI rejected as `cli_incompatible`, hooks (`useContent`, `useContentMutations`, `useQuarantine`) incl. error mapping. `npx eslint .`: 0 errors (196 formatting warnings, as before). `npm run build:lib`: ok.
- `npm pack` (0.3.0) installed into a blank app with peers: `useContent`, `useContentMutations`, `useQuarantine`, `useQuarantineCount`, `chakraCall` exported; `SUPPORTED_API_VERSION` 2; `/main` exports `registerChakra`.
- Electron e2e (`frontend/e2e/consumer.mjs`, xvfb, built 0.3.0 CLI, seeded cache): boot -> CLI config -> login -> add a department (listed), empty name shows "name is required", delete -> gone. `E2E OK`.
- `docs/library.md` updated (reading and writing content).

## Build and distribution (Windows), 2026-11-08
- Release build python scripts/build.py (outputs in `E:\BAVANS\Build\Chakra`): `Chakra-CLI\` (`chakra.exe`, `_internal/`, `chakra.cmd`, `config/.env`, `build.json`), `Chakra-CLI-Setup-0.3.0.exe` (26,642,867 bytes) and `nikhilvijayakumar-chakra-ui-0.3.0.tgz` (18,150 bytes).
- `Chakra-CLI\chakra.cmd meta version` -> `{"ok": true, "data": {"version": "0.3.0", "apiVersion": 2}, "apiVersion": 2}`. The build's own smoke check runs the executable against a throwaway home.
- Installer NSIS script (`.chakra-build\chakra.nsi`) packages `chakra.exe`, `chakra.cmd`, `build.json` and `_internal` from `Chakra-CLI\` into a per-user install. Silent install/uninstall was verified in the earlier pass; it was not re-run in this one.
- Dev build `python scripts/build.py --dev --out E:\BAVANS\Build\Chakra-dev`: writes `Chakra-CLI\` and `run-ui.cmd`, builds `frontend/dist-lib` in place, and writes no installer or tarball.
- Not verified: Linux/macOS builds in this pass (the script is OS-neutral; the installer is Windows-only).

## Mula integration (Windows), 2026-11-08
- `npm run typecheck` and `npm run build` pass after removing Mula's boot screen and `mula:boot:*` IPC and embedding the library's `CliConfigScreen` in the Configuration page.
- Mula registers Chakra with `appId: 'APP008'`, loads the preload bridge, and wraps the router in `ChakraGate`; `/` now opens `/employee`. Splash, CLI/database health, sync status and login come from the gate.
- Mula's boot screen is gone; one silent `googleSheets.sync()` runs after login so the module screens keep their cache current until the data migration.
- Mula still reads its own SQLite cache from the module screens; tasks 7.3-7.5 (adapter migration and removal of the data stack) remain open.
