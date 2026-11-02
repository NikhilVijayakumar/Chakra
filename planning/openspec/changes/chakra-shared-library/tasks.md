# Implementation Tasks: chakra-shared-library

- **OpenSpec Change ID:** `chakra-shared-library`
- **Status:** In Progress
- **Related artifacts:** `proposal.md`, `specs/`, `api-contract.md`, `design.md`, `adr.md`

Use test-first where applicable. Do not mark tasks complete without verification evidence.

## 1. Preparation and Baseline
- [x] 1.1 Resolve remaining open questions (sheet shape for app availability/features, content registry, password push); update artifacts. Sheet layout and app-availability/feature sheets deferred by the user; the registry file is provisional.
- [x] 1.2 Create branch `feature/chakra-shared-library` from `develop`.
- [ ] 1.3 `npm install`; record baseline `typecheck`, `lint`, `test` results in the verification record.
- [x] 1.4 Inventory Prana/Astra imports used by splash, boot, auth, and `main.tsx`; list what the library keeps.
- [ ] 1.5 Write characterization tests/fixtures for existing login (bcrypt hash compat), OTP/reset, and sheets-to-SQLite sync behavior.
- [x] 1.6 Add knowledge concepts first (knowledge-first): CLI contract (backend), library boundary (frontend), library/consumer concept (common); run `scripts/verify_knowledge.py` on all bundles.

## 2. Backend CLI skeleton and contract (`backend-cli`)
**Traceability:** REQ-005, `api-contract.md`
- [x] 2.1 Tests: envelope shape, `invalid_request`, exit codes, `meta version`.
- [x] 2.2 Implement CLI entrypoint, envelope, `meta version`.
- [x] 2.3 Contract test suite generated from `api-contract.md` (reused by Electron stub). Hand-written contract tests, not generated.
- [x] 2.4 `meta doctor` with fakes for each check.

## 3. Backend data, Sheets, auth, email
- [x] 3.1 SQLite layer + migrations from `db/schema.ts`; first-run creation test.
- [x] 3.2 Content registry and cache tables, `sync_meta`, `pending_updates`; deleted-cache test.
- [x] 3.3 Sheets client + `sync run` for all contents with partial-failure and keep-previous-cache behavior; `sync status` without network; fake-based tests.
- [x] 3.4 `auth login`, `validate-email`, bcrypt compatibility with fixtures from 1.5.
- [x] 3.5 OTP send/verify/expiry, `reset-password` (including password write-back behavior as in `updateEmployeePasswordInSheet`), email provider behind an interface. The AgentMail send is not verified against a live account.
- [x] 3.6 Pending-update push on sync (password reset), failure keeps pending.
- [x] 3.7 `app info`, `app can`, `content get` with feature checks (`app-features`).
- [ ] 3.8 PyInstaller build config for Windows (primary) and Linux; verify built binary answers `meta version`; compare one-file vs one-folder start time on Windows.

## 4. Electron library core (`cli-configuration`, `splash-and-boot`)
**Traceability:** REQ-002, REQ-003
- [x] 4.1 Tests with a stub CLI script: `CliClient` timeout, bad JSON, spawn failure, redaction, no-shell.
- [x] 4.2 Implement `CliClient`, `CliConfigStore`, path validation.
- [x] 4.3 `registerChakra` and the small typed preload bridge (`window.chakra`).
- [x] 4.4 Component tests then implement CLI config screen (set, verify, version/apiVersion check, doctor results, save).
- [x] 4.5 Boot sequence: version -> apiVersion -> doctor -> sync status (manual sync prompt) -> app info -> route; splash reduced-motion test.
- [x] 4.6 Sync panel in the config screen (status, per-content state, manual sync, pending count).

## 5. Authentication flow (`authentication-flow`)
**Traceability:** REQ-004
- [x] 5.1 Tests then implement login, forgot-password (email, OTP, reset) against the CLI client; error code -> message mapping.
- [x] 5.2 Verify secrets are absent from argv/logs/errors (test with stub CLI recording argv).
- [x] 5.3 Library API `sync.run/status`, `app.info/can`, `content.get` (REQ-007, REQ-008); replace Prana guards/session/branding with local equivalents.

## 6. Removal (`library-packaging`)
**Traceability:** REQ-006
- [x] 6.1 Delete renderer features: app-install, app-runner, virtual-drive, dashboard parts not needed; routes and guards.
- [x] 6.2 Delete main services: appInstall, driveLayout, driveLetter, mulaPluginBridge, TS employee/sheets/config/email services, db/, plugin IPC handlers, SSH/governance code.
- [x] 6.3 Remove `prana` and dependencies no longer used (drizzle-orm, sql.js, bcryptjs, google-auth-library, @x402/fetch, etc.) after confirming by search.
- [x] 6.4 Remove or rewrite docs in `docs/feature/` and `docs/architecture/` for removed features.
- [x] 6.5 Verification search shows no references to removed channels/routes/services.

## 7. Packaging and reference consumer
- [x] 7.1 Rename package to scoped `@nikhilvijayakumar/chakra-ui`; entry points and `exports`/`files`; consumable via git dependency. Not yet tested by installing from git into another app.
- [ ] 7.2 Minimal reference consumer app that mounts the library; end-to-end run with stub then built CLI.
- [ ] 7.3 Measure login and sync latency; record result against the ADR review trigger.

## 8. Integration and Final Verification
- [x] 8.1 Run backend pytest and frontend `typecheck`, `lint`, `test`, `build`.
- [ ] 8.2 Verify each scenario in `specs/` and record evidence.
- [ ] 8.3 Update README, `AGENTS.md`, knowledge (accept ADR into `backend/knowledge/decisions/`), log files.
- [ ] 8.4 `code-reviewer` review; run `graphify update .`.

## 9. Review, Merge, Archive
- [ ] 9.1 PR with change ID; merge to `develop` after gates; archive the change.

## Verification Record
| Check | Command or Evidence | Result | Notes |
|---|---|---|---|
| Backend tests | `backend/.venv/bin/python -m pytest -q` | Passed | 27 tests, Linux |
| Frontend tests | `npm test` in frontend/ | Passed | 17 tests: CLI client, IPC registration, gate/login/lockout |
| Frontend typecheck, lib build, demo build | `npm run typecheck`, `npm run build:lib`, `npx electron-vite build` | Passed | `npm run lint` not run: the repo has no ESLint config |
| Real CLI integration | one-off vitest against the PyInstaller binary (not committed) | Passed | Linux one-folder build; version, doctor, login error, sync status |
| Removal search | grep for prana, drive, governance, ssh, vault, drizzle, sql.js, astra in src and package.json | Passed | no matches |
| Knowledge bundles | `scripts/verify_knowledge.py` x3 | Passed | |
| Windows build and run | | Not Run | primary target; needs a Windows machine |
| Live Google Sheets and AgentMail | | Not Run | no credentials used |
| Install as git dependency in another app | | Not Run | |
| Login/sync latency (7.3), one-file vs one-folder (3.8) | | Not Run | |
| Characterization of old TS behavior (1.5) | | Not Run | old code removed; only a bcrypt `$2a$` vector test exists |
| Specification coverage | scenario-to-evidence map | Not Verified | |

## Completion Summary
- **Implementation status:** In Progress (sheet-specific schema and Windows verification outstanding)
- **Archive status:** Not Archived
