# Verification Record: chakra-shared-library

## 1.3 Frontend baseline (2026-11-05, after `npm install`)
- `npm run typecheck`: pass (node + web)
- `npm run lint`: FAIL to run. ESLint 9 finds only a legacy `.eslintrc.*` ("Oops! Something went wrong"). Needs a flat `eslint.config.*`; pre-existing, not a code-lint result.
- `npm test`: pass, 3 files / 23 tests. Coverage: stmts 71.2%, branches 57.14%, funcs 55.35%, lines 77.87%.

## 1.5 Characterization tests (backend, `.venv/bin/python -m pytest`)
28 passed. Covers login (case-insensitive email, shared failure error), bcryptjs `$2a$` hash vector, OTP send/verify/expiry, reset + pending push, sync partial failure / keep-previous / deleted-cache rebuild (`tests/test_auth.py`, `tests/test_sync.py`).

## 3.8 PyInstaller (Linux only so far, 2026-11-05)
- Built onedir and onefile via `backend/build_cli.py`; both answer `meta version` with the envelope (apiVersion 1).
- Start time (Linux, one run): onedir 0.20s, onefile 0.60s.
- NOT done: Windows build and Windows one-file vs one-folder timing. Task 3.8 stays open.

## 7.2 Reference consumer e2e (2026-11-05, Linux)
- Consumer: `frontend/src/{main,preload,renderer}` (mounts `registerChakra`, preload bridge, `ChakraGate`; no DB/Sheets/credential code).
- Stub-CLI path: covered by `src/lib/main/cliClient.test.ts` and `ChakraGate.test.tsx` (node stub scripts).
- Built-CLI path: `frontend/e2e/consumer.mjs` (Playwright Electron under xvfb) against `backend/dist/chakra` (onefile) with a cache seeded by `backend/tests/seed_demo.py`. Flow: splash/boot -> CLI config (verify, save) -> boot health/sync/app checks -> login -> "Hello Asha", features listed. Result: `E2E OK`.
- Run: `python backend/tests/seed_demo.py <dir>`; `cd frontend && npx electron-vite build && xvfb-run -a node e2e/consumer.mjs <cli> <dir>`.

## 7.3 Latency (partial)
- `auth login` via onefile CLI, local cache: 0.64-0.68s per call (5 runs; includes process start + bcrypt). Below a level that triggers the ADR daemon review.
- Sync latency NOT measured: needs live Google Sheets credentials. Task 7.3 stays open.

## 8.2 Scenario traceability (2026-11-05)
Evidence runs: backend `pytest` 29 passed; frontend `vitest` 23 passed (before this section); Electron e2e OK (7.2); built binary answers `meta version`.

| Spec | Scenario | Evidence |
|---|---|---|
| backend-cli | Version, Malformed request | `test_contract.py` (version, invalid_request) |
| backend-cli | Cache deleted, Partial failure, Failed sync keeps cache, Never synced | `test_sync.py` |
| backend-cli | Push failure | `test_auth.py::test_push_failure_keeps_pending` |
| backend-cli | Missing credentials | `test_contract.py::test_doctor_reports_missing_credentials` |
| backend-cli | Built binary | PyInstaller Linux onedir+onefile `meta version` (3.8); Windows pending |
| authentication-flow | Login ok / invalid / full reset / wrong or expired OTP | `test_auth.py`; UI: `ChakraGate.test.tsx` login + lockout |
| authentication-flow | Failed call | `cliClient.test.ts` (spawn failure, timeout, bad JSON) |
| app-features | Enabled, Unknown/disabled, Not synced, Allowed, Denied | `test_app_features.py` |
| app-features | Manual sync from UI | `ChakraGate.test.tsx` "offers sync when content is not synced"; SyncPanel code. Per-content result rendering not asserted |
| cli-configuration | Valid, Missing path, Incompatible API | `cliClient.test.ts` validateCliPath/verifyCli; e2e verify screen |
| cli-configuration | Windows path | no-shell spawn tested; `.exe` / win32 branch NOT run on Windows |
| cli-configuration | Restart | `register.test.ts` (save then status/get); e2e not restarted. Partly verified |
| splash-and-boot | Configured+healthy, Not configured, Unhealthy, Saved CLI unreachable, App enabled check | `ChakraGate.test.tsx` |
| splash-and-boot | App checks connection later, App boot stage fails, App replaces login | `ChakraGate.test.tsx` (CliStatusBadge, custom stage, screen override) |
| splash-and-boot | Reduced motion | `Splash.test.tsx` (reduced motion completes faster) |
| library-packaging | Consumer mounts | e2e (7.2) |
| library-packaging | No Prana; Removed features absent | grep of `frontend/package.json` and `frontend/src` for prana/vault/virtualDrive/ssh: no hits; typecheck + build pass |

Gaps: Windows run (cli path + binary), restart persistence in e2e, SyncPanel per-content rendering.

## 8.4 Code review (2026-11-05) + graph
`graphify update .` run. Reviewed: this session's uncommitted diff (settings.py env handling + test, seed_demo.py, e2e/consumer.mjs, Splash.test.tsx, docs/knowledge). Not re-reviewed: the earlier committed library/CLI code.
- Must-fix: none.
- Suggestions: (1) the mirror case (POSIX `/path` in `CHAKRA_HOME` on Windows) is not handled; (2) `test_foreign_os_home_is_ignored` asserts nothing on Windows (guarded); (3) e2e is manual, not in npm scripts/CI and needs xvfb; (4) `lint` is still broken at baseline (flat config missing), so new files are unlinted; (5) the e2e script copies `c.sqlite` to `chakra.sqlite` because the test `Env` names its db `c.sqlite`.
- Open: 3.8 Windows build/timing and 7.3 sync latency remain unverified.
