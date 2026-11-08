# Change Proposal: chakra-hr-data-and-mula-integration

**Standalone update:** The `chakra-standalone-consumer` change supersedes this document's Mūla-specific app-ID and external-only CLI assumptions. Scoped Chakra consumers retain the app-ID checks described below; Mūla bundles a compatible CLI, and Chakra must enforce whether the authenticated user has access to the registered app directly or through a team; the identity-free authorization bypass has been withdrawn. Historical evidence and completed task records remain unchanged.

## 1. Problem and Motivation

### Current Situation
Chakra (`backend/` CLI + `frontend/` Electron library, version 0.2.0) reads Google Sheets content into a SQLite cache, authenticates users, and gates content per app by sheet-granted features. It is read-only for business data: the only write is a password reset pushed back to the `Employee` sheet.

Mula (`/home/dell/PycharmProjects/mula`, a standalone Electron HR app) carries its own copy of the same stack in `src/main`: drizzle + better-sqlite3 (`db/schema.ts`), Google Sheets REST client (`services/googleSheetsService.ts`, 808 lines), two-way sync (`services/sheetsSyncService.ts`), bcryptjs login/OTP/reset, module CRUD IPC (`index.ts`, nine HR modules), and a quarantine workflow for bad or conflicting rows.

### Problem
Sheets, SQLite and authentication are now meant to be common across apps and owned by Chakra. Mula duplicates them, so every fix is made twice and Mula holds Google credentials and password hashing itself. Mula cannot simply consume Chakra today because the CLI has no create/update/delete, no push of local edits, no conflict handling and no quarantine.

### Evidence (verified by reading the code and the real sheet)
- Real sheet (read-only check): every tab has a trailing `sync` column; `EmployeeTeam` has its own `id`; headers vary in case and spacing (`short key`, `Holiday Name`, `carry forward`, `value `); `App` holds `APP008` = Mula (active); `AppEmployee` links employees to apps; carry-forward values are `TRUE`/`FALSE` text.
- Mula sheet rows carry a trailing `sync` epoch-seconds column (`sheetColumnMap` in `googleSheetsService.ts`), and local rows carry `sync`, `is_dirty`, `is_deleted` (`db/schema.ts`). Chakra's registry (`backend/src/chakra_backend/contents.json`) has no `sync` column and its cache tables have no dirty/deleted flags.
- Mula merge rules are written in comments above `saveDepartments`: insert if absent; take the sheet row if `sheets.sync > local.sync`; quarantine as `conflict` when the local row is also dirty; soft-delete local rows missing from the sheet unless dirty.
- Mula push rules (`pushDirtyRecordsToSheets`): delete phase for `is_deleted && is_dirty` rows, then upsert phase that skips a row already in the sheet unless `local.sync == 0` or `local.sync > sheets.sync`.
- Validation reasons recorded to quarantine: `missing_id`, `missing_required`, `invalid_relation` (employee department/designation, employee-team employee/team), `type_mismatch` (leave count), `conflict`.
- Quarantine actions in `index.ts`: `getAll`, `count`, `reject`, `accept-sheets`, `apply-local` (conflicts only), `fix`, `delete-record`, `scan`.
- Generated ids use a per-module prefix (`DEPT`, `DES`, `TEAM`, `EMP`, `EMT`, `ATT`, `HOL`, `LEA`, `CFG`) plus a zero-padded max+1 number; new employees get the default password `change@123` (bcrypt).
- Existing knowledge states the cache holds no state of record ([library and CLI split](../../../../knowledge/concepts/library-and-cli-split.md), [CLI contract](../../../../backend/knowledge/concepts/cli-contract.md)). This change deliberately relaxes that for pending local edits (see section 7).

## 2. Desired Outcome

Mula's data, Sheets and authentication code is replaced by Chakra. Mula keeps its UI and HR features; it reads and writes HR content only through the Chakra library, which calls the Chakra CLI.

### Goals
- [ ] The Chakra CLI supports create, update and delete for the nine HR contents, durable until pushed.
- [ ] `sync run` pushes local edits (Mula's push rules), then pulls (Mula's merge rules), with `sync` timestamps.
- [ ] Invalid or conflicting rows are quarantined and can be resolved through CLI commands.
- [ ] The library exposes the new operations (IPC, preload, hooks) with the same trust model as today.
- [ ] Mula consumes the library and CLI and has no database of its own: no SQLite, drizzle, google-spreadsheet/Sheets REST, bcryptjs or Google credential code.

### Success Criteria
- [ ] Every Mula module (employees, departments, designations, teams, employee-teams, attendance keys, holidays, leaves, configuration) lists, creates, edits and deletes via Chakra, and the edits appear in the real sheet after a sync.
- [ ] Mula's existing behaviors above are covered by Chakra backend tests (characterization of the merge, push and quarantine rules).
- [ ] Mula login, forgot-password, OTP and reset work through Chakra against the real sheet.
- [ ] `npm ls` in Mula shows none of: `better-sqlite3`, `drizzle-orm`, `google-spreadsheet`, `google-auth-library`, `bcryptjs`.

## 3. Scope

### In Scope
- Chakra backend: registry additions (`sync` column, writable flag, id prefix, required fields, relations, quarantine source name), cache columns `sync`/`is_dirty`/`is_deleted`, `content create|update|delete`, push-then-pull `sync run`, `quarantine *` commands, id generation, default-password hashing, CLI `apiVersion` 2.
- Chakra frontend library: contract/OPS additions, IPC whitelist, preload and renderer hooks for the new operations; version 0.3.0.
- Mula: remove its database entirely (the data is common, managed, synced and cached by Chakra); depend on the library by relative path (`file:../Chakra/frontend`) during development and on an `npm pack` tarball afterwards; replace `src/main` data/auth/sync code and renderer repos with library calls; reuse Chakra's boot, login and CLI-config screens.
- Knowledge and docs updates in Chakra; a note in Mula docs.

### Out of Scope
- Changing the sheet layout (beyond relying on the `sync` column that Mula already writes).
- Role-based authorization inside Mula.
- Shipping, installing or updating the CLI with Mula: the Chakra CLI is installed on the machine separately and Mula only points to it through the library's CLI configuration screen.
- A daemon or non-stdio transport (the ADR review trigger is not met).
- Windows build and verification (done separately by the owner).
- Migrating data out of Mula's existing local SQLite file: the sheet is the source and the new cache is rebuilt by sync. Unpushed local edits in an old Mula database are lost unless pushed first.
- Mula UI redesign.

### Constraints
- Passwords and OTPs stay on stdin only; secrets never in argv or errors.
- Electron never opens SQLite or Google APIs; only the library's main-process CLI client calls the CLI.
- Existing `meta`, `auth`, `sync status`, `app`, `content get` behavior stays compatible in meaning; only `apiVersion` moves.
- Mula's repo rules (`AGENTS.md`): no large updates without confirmation; this proposal is that confirmation request for the Mula side.

## 4. Stakeholders and Impact

- **Primary stakeholders:** Mula maintainer (the user); future Chakra consumer apps.
- **Affected components:** `backend/` (registry, db, sync, new commands), `frontend/src/library`, Chakra knowledge bundles, Mula `src/main`, `src/preload`, `src/renderer`, `package.json`.
- **Dependencies:** real Google Sheet with Mula's tab names and `sync` column; Chakra CLI binary available to Mula (configured by path in the CLI config screen); the Mula app id enabled with its features in the sheet's App tabs.
- **Compatibility:** `apiVersion` 1 to 2 (the library verifies equality, so library and CLI must be upgraded together). Chakra 0.2.0 consumers must upgrade both.

## 5. Proposed Direction

Extend the CLI generically rather than per module: the registry describes each writable content (tab, columns, key, id prefix, required fields, relations, sync column), and one set of commands (`content create|update|delete`, extended `sync run`, `quarantine *`) works for all of them. Local edits live in the cache as dirty/deleted rows, matching Mula's data model, so Mula's rules transfer one-to-one. The library gains matching operations; Mula swaps its IPC handlers and renderer repos for library calls.

Alternatives considered: (a) a per-module command set, rejected as nine copies of the same logic; (b) keeping Mula's TypeScript sync and only using Chakra for login, rejected because the goal is one owner for Sheets and SQLite; (c) a pending-update table (as used for passwords) for all edits, rejected because it cannot express create/delete and conflict stamps.

Design and ADR detail the model and the compatibility decision.

## 6. Requirements Overview

| ID | Requirement | Expected Outcome | Priority |
|---|---|---|---|
| REQ-001 | Registry marks HR contents writable with sync column, id prefix, required fields, relations | One generic write path | Must |
| REQ-002 | `content create/update/delete` | Dirty/deleted rows kept until pushed; generated ids; employee default password hashed | Must |
| REQ-003 | `sync run` pushes dirty rows then pulls using Mula's rules | Sheet updated; merge by `sync` stamp; absent-and-clean rows soft-deleted | Must |
| REQ-004 | Validation during pull | Bad rows quarantined with Mula's reasons, not loaded | Must |
| REQ-005 | `quarantine list/count/reject/accept-sheets/apply-local/fix/scan` | Same outcomes as Mula's handlers | Must |
| REQ-006 | Write permission follows the app | Writes allowed for an app active in the sheet, refused otherwise | Must |
| REQ-007 | Library operations for the above | Mula calls them via `window.chakra`; whitelist enforced in main | Must |
| REQ-008 | Mula uses library + CLI and drops its own stack | No SQLite/Sheets/bcrypt/credential code in Mula | Must |
| REQ-009 | `apiVersion` 2, versions 0.3.0 | Mismatched pair reported as `cli_incompatible` | Must |
| REQ-010 | Employee relation lookups (department/designation names) | Mula obtains names from the returned content, no server-side join | Should |

## 7. Risks and Open Questions

### Risks
| Risk | Impact | Mitigation or Investigation |
|---|---|---|
| Relaxing "cache has no state of record" | Unpushed edits are lost if the cache file is deleted | Document it; `sync status` shows pending count; Mula warns before destructive resets |
| Push order and partial failure | Half-pushed state, duplicated rows | Per-content isolation as in Mula; dirty cleared only for rows actually pushed; backend tests with a fake sheet |
| Mula's own tab-name defaults differ from the sheet (`Leave` vs `LeaveType`, `Configuration` vs `Config`) | Wrong tab | Decided: the sheet's names are authoritative and live in the registry (verified against the real sheet); Mula uses none of its own names |
| Concurrent writers (two Mula instances) | Last write wins | Same as today (sync stamp comparison); documented |
| Large refactor in Mula | Regressions | Characterization first; Mula changes in small steps behind passing typecheck/build |

### Assumptions
- Mula's app id is `APP008` (name `Mula`, active in the real sheet's `App` tab). Permission is given to the app in the sheet, so an enabled app may read and write the writable contents.
- The sheet keeps Mula's current column order, with `sync` as the last column of each tab.
- Mula identifies the signed-in user from the `auth login` result only; it needs no extra auth state.

### Open Questions
- [ ] May unpushed Mula edits be lost on cache deletion, or must the cache location be treated as durable user data?

## 8. Acceptance Summary

- [ ] CLI contract tests and characterization tests of Mula's merge, push and quarantine rules pass.
- [ ] Library tests cover the new operations and the write whitelist.
- [ ] An end-to-end run of Mula against the built CLI and the real sheet lists, creates, edits, deletes, syncs and resolves a quarantined row.
- [ ] Mula `package.json` and source contain none of the removed stack.
- [ ] Windows verification is recorded separately and does not block merge to `develop`.

## 9. Traceability

- **OpenSpec Change ID:** `chakra-hr-data-and-mula-integration`
- **Proposed branch:** `feature/chakra-hr-data-and-mula-integration` (Chakra); a matching branch in the Mula repo
- **Related issues or references:** Mula `src/main/index.ts`, `services/googleSheetsService.ts`, `services/sheetsSyncService.ts`, `db/schema.ts`
- **Related existing specifications:** `planning/openspec/changes/chakra-shared-library/` (library, CLI, auth, sync, app features)
- **Related ADRs:** [CLI process per call](../../../../backend/knowledge/decisions/cli-process-per-call.md); this change adds an ADR
- **Knowledge consulted:** [product overview](../../../../knowledge/product/overview.md), [library and CLI split](../../../../knowledge/concepts/library-and-cli-split.md), [CLI contract](../../../../backend/knowledge/concepts/cli-contract.md), [Python service](../../../../backend/knowledge/architecture/python-service.md), [library surface](../../../../frontend/knowledge/concepts/library-surface.md), [Electron and dependencies](../../../../frontend/knowledge/architecture/electron-and-dependencies.md)

## 10. Readiness Review

- [x] The problem and motivation are clear.
- [x] Goals and success criteria are observable.
- [x] Scope and non-goals are explicit.
- [x] Stakeholders, constraints and dependencies are identified.
- [x] Assumptions and unresolved questions are visible.
- [x] Consistent with existing specifications, with the cache rule change called out.
- [ ] Remaining open questions answered before implementation starts (default password, durability).
- [x] Stable change ID and branch name.

**Status:** Draft, ready for specification and design pending the open questions
