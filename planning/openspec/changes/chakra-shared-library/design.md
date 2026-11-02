# Design: chakra-shared-library

## 1. Overview

**Purpose:** realize `proposal.md`: Chakra as a library whose backend logic is a Python CLI.
**Scope:** `backend/` CLI, `frontend/` library, removals, docs/knowledge.
**Principles:** apps configure only the CLI path; backend owns data and secrets; smallest contract; no daemon until measured need.

## 2. Context and Constraints

### Current State (observed)
- Main-process services (`frontend/src/main/services/`) implement employee store, Sheets reads/sync, config sheet, email (AgentMail), startup checks; DB via drizzle/sql.js (`src/main/db/`).
- `src/main/index.ts` (~1300 lines) registers `chakra:*` and `plugin:*` IPC handlers including app install, webview launch, drive layout.
- Renderer features: boot, splash-override, authentication, dashboard/home, app-install, app-runner, virtual-drive; routes and Prana guards in `src/renderer/src/main.tsx`.
- Preload: `src/preload/index.ts` (+ ~2000-line `index.d.ts`).

### Constraints
Security: no secrets in argv/logs. Compatibility: breaking for the current app. Operational: CLI built per OS.

### Existing Decisions
None recorded. Knowledge is thin: [product](../../../../knowledge/product/overview.md), [frontend architecture](../../../../frontend/knowledge/architecture/electron-and-dependencies.md), [backend architecture](../../../../backend/knowledge/architecture/python-service.md); see tasks for new concepts.

## 3. Requirements and Traceability

REQ-001 -> `library-packaging`; REQ-002 -> `splash-and-boot`; REQ-003 -> `cli-configuration`; REQ-004 -> `authentication-flow`; REQ-005 -> `backend-cli`; REQ-006 -> `library-packaging` (removal).

## 4. Architecture and Design

### Approach
Renderer -> preload (`window.chakra`) -> main `CliClient` -> spawn `<cli> <group> <cmd>` (no shell), JSON stdin/stdout -> Python CLI -> SQLite / Sheets / email.

### Components
- **Python (`backend/src/chakra_backend/`)**: `cli` (arg parse, envelope), `commands/{meta,auth,sync,app,content}`, `registry` (content registry: content id, sheet, table, feature), `db` (stdlib `sqlite3`, cache tables + `sync_meta` + `pending_updates`), `sheets` (google-api-python-client, service account), `email`, `auth` (bcrypt, OTP). Stdlib and few dependencies keep the PyInstaller binary small and cross-platform. Port logic from the TS services with characterization tests first.
- **Electron main**: `CliClient` (spawn, timeout, envelope validation, redaction), `CliConfigStore` (path + last verified in userData JSON), `registerChakra`.
- **Preload**: typed `window.chakra`, replacing the 2000-line `index.d.ts` with a small contract.
- **Renderer**: `ChakraProvider`, splash/boot, login, forgot/reset, CLI config; consumer supplies home route and branding.

### Key Workflows
Boot: read path -> `meta version` -> check `apiVersion` -> `meta doctor` -> `sync status` (offer manual sync if empty) -> `app info` (block if not enabled) -> route. Login: form -> `auth login` -> session state in renderer memory -> consumer home. Config: set path -> verify (version+doctor) -> save.

## 5. Data and State
SQLite exclusively behind the CLI as a rebuildable cache of Sheets content (employees, departments, designations, apps, app users/teams, attendance keys, holidays, leaves, config, plus the app-availability/feature data). Metadata tables: `sync_meta` (per content: last sync, row count, error) and `pending_updates` (local changes to push). No other state of record; deleting the file is safe and loses only unpushed updates. Data directory default: per-user app-data directory (Windows `%APPDATA%\chakra`, Linux XDG data dir), overridable by CLI config. Electron persists only `{cliPath, verifiedAt, version}`. Session is renderer memory only.

## 6. Error Handling
Timeout per call (default 30s; sync longer). Non-JSON/oversized stdout -> `internal`. Spawn failure -> `cli_unavailable` surfaced as boot failure. Errors mapped to localized messages by code.

## 7. Security and Privacy
Passwords/OTP on stdin only; CLI path validated, no shell; envelope redaction; credentials and password hashes never leave the CLI; renderer cannot choose arbitrary commands (fixed command map in main).

## 8. Quality Attributes
No thresholds agreed yet; measure per-call latency of login and record before deciding on a daemon (open question, not a requirement).

## 9. Testing and Verification
- Python: pytest unit tests per command; contract tests asserting envelope shapes against `api-contract.md`; Sheets/email behind fakes.
- Electron: vitest for `CliClient` against a stub CLI script; component tests for splash/boot/login/config.
- Integration: reference consumer app + stub and real built CLI.
- Removal: grep-based check plus typecheck/build.

## 10. Implementation and Migration
Order: (1) inventory + characterization of TS behavior, (2) CLI contract + stub, (3) client/config/boot, (4) auth flow, (5) port sheets/cache/sync/email into CLI, (6) app features, (7) removals incl. Prana, (8) packaging, docs, knowledge. No data migration: users resync from Sheets.

## 11. Architecture Decision Checkpoint
New decision required; see `adr.md`.

## 12. Risks, Trade-offs, Open Questions
Per-call spawn cost vs simplicity (Windows process start and antivirus scanning of PyInstaller one-file binaries can be slow; prefer one-folder build if measured slow); bcrypt hash compatibility; replacing Prana's guards/session/branding inside the library. Open questions: see proposal.

## 13. Traceability
Change `chakra-shared-library`; proposal, specs, api-contract, adr, tasks.

## 14. Readiness
**Status:** Ready for ADR and tasks
