# Change Proposal: chakra-shared-library

## 1. Problem and Motivation

### Current Situation
Chakra is an Electron app that installs other apps from git into an encrypted virtual drive, with SSH governance, a vault, an app runner, and TypeScript-side SQLite (drizzle/sql.js) and Google Sheets services (`frontend/src/main/services/`). Splash, boot and authentication are embedded in that app.

### Problem
Future apps need the same splash, authentication, SQLite cache and Google Sheets data, but each would have to re-implement or fork Chakra and manage the database, credentials and Sheets access itself.

### Evidence
- Services in `frontend/src/main/services/` (`employeeStoreService`, `googleSheetsService`, `sheetsSyncService`, `chakraConfigSheetService`, `chakraEmailService`) hold the data and auth logic in Electron main.
- `docs/feature/{virtual-drive,installation,uninstallation,governance,governance-roles,listing}.md` describe features that are not wanted in the library.
- Knowledge bundles contain no CLI or library concepts yet ([product](../../../../knowledge/product/overview.md), [frontend architecture](../../../../frontend/knowledge/architecture/electron-and-dependencies.md), [backend architecture](../../../../backend/knowledge/architecture/python-service.md)).

## 2. Desired Outcome

Chakra becomes a **reusable library**: a consuming app gets splash, authentication and a CLI-configuration screen, and never touches the database, Google Sheets, credentials or email. All backend logic lives in a Python CLI built from `backend/`.

### Goals
- [ ] Python CLI (`backend/`) owns SQLite, Google Sheets sync, authentication, OTP/reset email and config.
- [ ] Electron library (`frontend/`) provides splash/boot, login, forgot/reset password, and a CLI configuration screen, and talks to the CLI over a defined JSON contract.
- [ ] Consuming apps install the library from git and configure only the CLI location through the UI.
- [ ] Virtual drive, vault, app install/uninstall/runner/listing and SSH governance are removed.

### Success Criteria
- [ ] A minimal consumer app can mount the library, set the CLI path in the config screen, verify it, log in, and reach its own home route without any database or Sheets code of its own.
- [ ] No TypeScript code in the library opens SQLite, calls Google APIs, hashes passwords or sends email.
- [ ] Removed features no longer appear in code, IPC channels, routes, preload API, docs or dependencies.

## 3. Scope

### In Scope
- Python CLI (`chakra`): holds all logic. Google Sheets is the source of content; SQLite is only a cache of it. Sync (all content, manual trigger, status), auth (login, email validation, OTP send/verify, password reset), per-app feature access, `doctor`/`--version`; PyInstaller build for Windows (primary) and Linux.
- Chakra UI (Electron library): packaging as a git-installable npm package (no Prana dependency); splash/boot; auth screens; CLI config screen (set path, verify, show status); main-process CLI client; preload bridge; generic cache/sheets read API proxied to the CLI.
- Removal of virtual drive, vault, app install/runner/listing, SSH governance, plugin SQLite bridge, drive-letter/layout services, related deps and docs.
- Knowledge and docs updates.

### Out of Scope
- A hosted/remote backend; non-stdio transports.
- Auto-download or auto-update of the CLI; bundling the CLI in the npm package.
- Redesigning splash/auth visuals; new auth methods; role-based authorization.
- Migrating data from the old TypeScript SQLite file (not needed; start fresh).
- Durable local state: the cache holds no state of record; unsynced local updates may be lost.
- Tracking and updating the Sheets-side business logic (deferred; later change).

### Constraints
- Passwords and OTPs never appear in process arguments, logs or errors.
- Per `AGENTS.md`, shared defects are fixed in Prana/Astra, not worked around here.
- No change to backend/frontend knowledge independence rules.

## 4. Stakeholders and Impact

- **Primary stakeholders:** developers of future apps that consume the library; Chakra maintainers.
- **Affected components or capabilities:** `frontend/` (large removal, packaging), `backend/` (new CLI), `docs/`, knowledge bundles.
- **Dependencies:** Python >= 3.12, PyInstaller, Google service-account credentials (held by the CLI), `astra` for UI theming/state. `prana` is removed entirely; its guards, session store and branding used by the splash/auth screens are replaced inside the library.
- **Compatibility considerations:** breaking for the current Chakra app; its installer role ends.

## 5. Proposed Direction

Python CLI with a uniform JSON-over-stdio contract; Electron main spawns it per call (no daemon) via a path stored in library config; renderer never sees the path or secrets beyond the config screen. Library exports a main-process `registerChakra(app, options)`, a preload bridge, and React components/routes. See `design.md`, `api-contract.md`, `adr.md`.

Alternatives (daemon/HTTP, TS auth with CLI only for storage, bundled CLI) are compared in `adr.md`.

## 6. Requirements Overview

| ID | Requirement | Expected Outcome | Priority |
|---|---|---|---|
| REQ-001 | Library packaging | Apps depend on library from git and mount it | Must |
| REQ-002 | Splash and boot | Splash then dependency/CLI check precede auth | Must |
| REQ-003 | CLI configuration | User sets and verifies CLI path in UI | Must |
| REQ-004 | Authentication flow | Login, OTP, reset all via CLI | Must |
| REQ-005 | Backend CLI | CLI owns SQLite, Sheets, auth, email with JSON contract | Must |
| REQ-006 | Removal | Listed features and code gone | Must |
| REQ-007 | Cache and sync | Content is cached from Sheets; apps can check sync status and sync manually | Must |
| REQ-008 | Per-app features | An app can use only the features the sheet grants it; app availability comes from the sheet | Must |

## 7. Risks and Open Questions

### Risks
| Risk | Impact | Mitigation or Investigation |
|---|---|---|
| Per-call process spawn latency | Slow login/sync | Measure; add long-lived mode later if needed |
| Porting bcrypt/Sheets/email logic changes behavior | Auth regressions | Contract tests on both sides; port with characterization tests |
| CLI binary per-OS builds | Distribution burden | Build matrix in CI; out of scope to auto-distribute |
| Removing Prana-dependent code breaks boot | Library fails to start | Inventory Prana imports first (task 1) and replace guards/session/branding locally |
| Lost unsynced updates when sync fails or cache is deleted | User change silently lost | Accepted by decision; expose pending count in `sync status` so apps can warn |

### Assumptions
- Email delivery (currently AgentMail in `chakraEmailService.ts`) moves to the CLI with the same provider.
- Google credentials and sheet IDs are configured in the CLI's own config, not in Electron.
- Existing sheet column layouts stay as-is for employees, config and apps.
- Names: Chakra UI = the npm library, Chakra CLI = the executable `chakra`. The npm name `chakra-ui` collides with the well-known `@chakra-ui/*` library, so the package is scoped (`@nikhilvijayakumar/chakra-ui`).
- Windows is the primary target; Linux supported; macOS not targeted. Python code stays platform-independent; only the built binaries differ.
- The cache holds no state of record. A local update (e.g. password reset) is written to the cache with a pending flag and pushed at the next sync; if the push fails or the cache is deleted, the update is not recovered. Pending updates survive a failed sync until the next successful one.

### Open Questions
- [ ] Final sheet shape for app availability and features (new `AppFeature`-style sheet? columns?). Current sheets: App, App Team, APP User.
- [ ] Meaning of "additional data that this system is available in this app": assumed an `enabled`/availability flag per app in the sheet, checked at boot. Confirm.
- [ ] How a locally changed password (reset) is pushed to the sheet; assumed pushed at next sync.

## 8. Acceptance Summary
- [ ] Specs in `specs/` pass against a reference consumer app and a CLI contract test suite.
- [ ] Removal verified by search (no references) and a clean typecheck/build.

## 9. Traceability

- **OpenSpec Change ID:** `chakra-shared-library`
- **Proposed branch:** `feature/chakra-shared-library`
- **Related existing specifications:** None
- **Related ADRs:** `adr.md`

## 10. Readiness Review
- [x] Problem, goals, scope and non-goals explicit.
- [x] Assumptions and open questions visible.

**Status:** Ready for specification and design
