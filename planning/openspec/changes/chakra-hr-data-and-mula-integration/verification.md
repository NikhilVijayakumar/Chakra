# Verification Record: chakra-hr-data-and-mula-integration

## Backend (Chakra), 2026-11-05
- `backend/.venv/bin/python -m pytest`: 72 passed (was 29). New: `test_write.py` (11), `test_twoway.py` (13), `test_quarantine.py` (10), `test_registry.py` (5), contract additions (3).
- Built CLI (`build_cli.py --onefile`): `meta version` -> 0.3.0, `apiVersion` 2; `content create`, `quarantine count`, `sync status` answer against a seeded cache.
- Not yet verified: new `sheets.py` calls (update/append/delete rows) against the real Google API. Needs a scratch spreadsheet (task 8.3).
- Not applicable here: Mula baseline (task 1.4) and all Mula work (section 7).

## Library (Chakra), 2026-11-05
- `npm run typecheck`: clean. `npx vitest run`: 32 passed (was 24): whitelist/`appId` injection for all 11 new ops, passwords not in argv, long timeout only for `sync.run` and `quarantine.scan`, v1 CLI rejected as `cli_incompatible`, hooks (`useContent`, `useContentMutations`, `useQuarantine`) incl. error mapping. `npx eslint .`: 0 errors (196 formatting warnings, as before). `npm run build:lib`: ok.
- `npm pack` (0.3.0) installed into a blank app with peers: `useContent`, `useContentMutations`, `useQuarantine`, `useQuarantineCount`, `chakraCall` exported; `SUPPORTED_API_VERSION` 2; `/main` exports `registerChakra`.
- Electron e2e (`frontend/e2e/consumer.mjs`, xvfb, built 0.3.0 CLI, seeded cache): boot -> CLI config -> login -> add a department (listed), empty name shows "name is required", delete -> gone. `E2E OK`.
- `docs/library.md` updated (reading and writing content).
