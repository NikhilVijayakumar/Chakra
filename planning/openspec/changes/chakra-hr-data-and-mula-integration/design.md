# Design: chakra-hr-data-and-mula-integration

## 1. Overview

### Purpose
Let Mula use Chakra for all HR data, Sheets access and authentication by giving the CLI Mula's write, push, merge and quarantine behavior, and the library matching operations.

### Scope
`backend/` (registry, cache schema, new modules, commands), `frontend/src/library` (contract, IPC, preload, hooks), Mula's main, preload and renderer. Not the sheet layout.

### Design Principles
One generic path driven by the registry instead of per-module code; transfer Mula's rules unchanged (they are the behavior users already rely on); keep the process-per-call model ([CLI process per call](../../../../backend/knowledge/decisions/cli-process-per-call.md)); secrets and hashing stay in the CLI; smallest additions to the existing modules.

## 2. Context and Constraints

### Current State
- CLI (`backend/src/chakra_backend`, 666 lines): `registry.py` loads `contents.json`; `db.py` creates `c_<id>` text tables plus `sync_meta`, `pending_updates`, `otp`; `sync.py` replaces each content from its sheet and pushes `pending_updates`; `appfeatures.py` gates `content get`; `auth.py` handles login/OTP/reset; `commands.py` is the command table.
- Library: `src/library/{main,preload,renderer,shared}`; `shared/contract.ts` holds `OPS`, `APP_SCOPED`, `LONG_OPS`; `main/register.ts` whitelists and injects `appId`.
- Mula: logic described in the proposal evidence section.

### Constraints
- Technical: stdlib `sqlite3`, existing `google-api-python-client`; no new dependency. Sheets reads are one call per tab (about 0.6 s each), so pushing must read each dirty content's tab once.
- Security: passwords/hashes only in the CLI; stdin for secrets; no secrets in errors.
- Reliability: a failed content must not block others; dirty flags cleared only after a confirmed push.
- Compatibility: `apiVersion` 2; library and CLI released together (0.3.0).
- Operational: Windows is verified separately; code stays cross-OS (paths via `pathlib`, env per machine).

### Existing Decisions and Conventions
[CLI process per call](../../../../backend/knowledge/decisions/cli-process-per-call.md) (kept); [library and CLI split](../../../../knowledge/concepts/library-and-cli-split.md) (amended: pending edits are not disposable until pushed); ponytail style: data in the registry, shortcuts marked.

## 3. Requirements and Traceability

| Requirement or Spec | Design Element | Verification |
|---|---|---|
| content-write | `writes.py` (create/update/delete/id/validation), registry fields | backend unit tests with fake sheets |
| two-way-sync push/pull/validation | `sync.py` split into `push`, `pull`, shared `validate` | characterization tests mirroring Mula rules |
| quarantine | `quarantine.py`, `quarantine` table | backend tests per action and reason |
| app-features write | `appfeatures.can_write` | tests for granted/denied/disabled/not synced |
| backend-cli | `API_VERSION = 2`, new error codes, cache version | contract tests |
| library-operations | `OPS`, `APP_SCOPED`, `LONG_OPS`, preload, hooks | vitest (`register.test.ts`, hooks tests) |
| mula-integration | Mula adapter layer and removal | Mula typecheck/build, e2e against real CLI |

## 4. Architecture and Design

### Architectural Approach
The CLI keeps Sheets as the source and SQLite as the working copy. Each writable content table gains `sync`, `is_dirty`, `is_deleted`. Create/update/delete only touch the cache and mark rows dirty. `sync run` per content: push (delete phase, then upsert phase), then pull with validation and merge. This is Mula's model moved behind the CLI.

### Components and Responsibilities
| Component | Responsibility | Dependencies |
|---|---|---|
| `registry.py` + `contents.json` (tabs are exactly the sheet's names; `employee_teams` gains its `id` key; header lookup is normalized: case, surrounding spaces, and spaces vs underscores) | Describe contents: tab, columns, key, `writable`, `id_prefix`, `required`, `relations`, `integers`, `sync_column` | none |
| `db.py` | Create tables with sync/dirty/deleted and `quarantine`; schema version; `effective_rows` excludes deleted | registry |
| `writes.py` (new) | create/update/delete, id generation, validation, bcrypt of employee passwords | db, registry, auth hashing helper |
| `validate.py` (new) | One validator used by writes, pull and scan: required, relation, integer | registry, db |
| `sync.py` | Orchestrate per content: push then pull; results and counts | sheets, validate, quarantine |
| `sheets.py` | Add `append`, `batch_update`, `delete_rows(sheet_id, rows)`, `sheet_id(tab)`; header-based column positions | google client |
| `quarantine.py` (new) | record/dedupe, list, count, resolve actions, scan | db, validate |
| `appfeatures.py` | add `can_write` (app enabled); give `employees`/`config` features | registry |
| `commands.py` | register new commands, `API_VERSION = 2` | all |
| Library `shared/contract.ts`, `main/register.ts` | new ops in `OPS`, `APP_SCOPED`, `LONG_OPS` | contract |
| Library `preload`, `renderer/hooks.ts` | typed helpers and hooks | contract |
| Mula adapter (`src/renderer/src/common/chakra/`) | Thin repos over `chakraCall`; id-to-name resolution | library |

### Interfaces and Contracts
See `api-contract.md`. Owner of the contract is the CLI; the library mirrors it in `contract.ts` with the same names.

### Key Workflows
Sync of one writable content:

```
push:  rows = dirty AND deleted      -> delete matching sheet rows by id (bottom-up), clear dirty
       rows = dirty AND NOT deleted  -> read tab once; for each: if in sheet and local.sync != 0 and
                                        local.sync <= sheet.sync: skip; else update in place or append
                                     -> clear dirty only for rows pushed
pull:  read tab; for each sheet row: validate (missing_id, missing_required, invalid_relation,
       type_mismatch) -> quarantine and skip; absent locally -> insert clean;
       sheet.sync > local.sync and not (deleted and dirty) -> if local dirty, record conflict; replace row
       local rows not in sheet and not dirty -> soft-delete (not dirty)
```

Order of contents matters for relations: departments, designations, teams, attendance_keys, holidays, leaves, employees, config, employee_teams (parents first), as in Mula. Employee relation checks use the already-pulled parents.

Create flow in Mula: UI -> `content.create` -> main injects `appId` -> CLI validates, generates id, stores dirty -> row returned; sync later pushes.

## 5. Data and State Management

- Tables `c_<content>` get `sync INTEGER`, `is_dirty INTEGER DEFAULT 0`, `is_deleted INTEGER DEFAULT 0`. `quarantine(id PK, content, record_id, reason, details, sheets_data, local_data, status, created_at)`.
- Cache schema version in `PRAGMA user_version`. A version change drops and recreates `c_*` tables (a rebuild), after carrying forward `pending_updates` rows by marking the matching employee dirty once the new tables are synced (see below). Quarantine is created fresh.
- Password reset moves to the same mechanism: it sets the employee's `password_hash`, `is_dirty`, `sync`. `pending_updates` is removed; its push is subsumed by the employee push. Existing reset tests are updated, behavior (stays pending until a push succeeds; login works immediately) is preserved.
- Concurrency: one CLI process per call; SQLite file locking serializes writers; `sync run` holds a transaction per content phase. Two machines editing the same row resolve by `sync` stamp (newer wins; conflict entry kept).
- Time source is the injected clock already used by `Context`, so tests are deterministic.
- Deletion/recovery: soft deletes stay in the cache until pushed and pulled absent; deleting the cache loses unpushed edits (accepted, documented).

## 6. Error Handling and Resilience

| Failure Scenario | Expected Behavior | Recovery or Mitigation |
|---|---|---|
| Sheet write fails for a content | That content's dirty rows stay dirty; result `ok:false` with message; other contents continue | Retry sync |
| Push succeeded, pull failed | Dirty cleared (pushed), previous rows kept, content reported not synced | Re-run sync |
| Sheet row deleted by someone while local edit pending | Dirty row is kept and pushed as new on the next sync | none needed |
| Duplicate ids from two machines | Same id: stamp comparison decides; different rows with the same generated id would collide | Open risk; mitigate by pulling before create when online (optional follow-up) |
| Crash mid-push | Rows pushed but still marked dirty are pushed again; push is idempotent because rows are matched by id | none |
| Unknown content / column | `unknown_content` / `validation_failed` | caller fixes |
| Interrupted scan | Entries recorded so far remain; repeat scan dedupes | Re-run |

## 7. Security and Privacy

- Writes are authorized exactly like reads: the app must be active in the sheet's `App` tab (permission is given to the app). No separate write feature. Writes are limited to registry-writable contents. Per-employee access (`AppEmployee`, `AppTeam`) is not checked by the CLI today and stays out of scope.
- `appId` is injected by the main process; the renderer cannot choose it (existing control, extended to new ops).
- Password hashes are never returned by `content get`; default initial password is a setting, not echoed.
- Error messages for validation name fields only.
- Google credentials remain in the CLI environment; Mula loses its copy (`googleServiceAccountService`, `google_auth` table).

## 8. Quality Attributes

| Attribute | Requirement or Constraint | Design Response | Verification |
|---|---|---|---|
| Behavior parity | Mula's rules preserved | Characterization tests copy Mula's rule comments into named tests | backend pytest |
| Performance | Sync of 12 tabs about 7 s read-only today | Push reads each dirty tab once; skip tabs with no dirty rows; pull unchanged | live sync timing recorded |
| Maintainability | One generic path | Registry-driven; no per-module code | code review |
| Reliability | No data loss on partial failure | Dirty cleared only after push | failure-injection tests with fake sheets |

## 9. Testing and Verification Strategy

### Behavioral Verification
Every scenario in `specs/` maps to a named test; cases include merge ordering, conflict, deletion, validation reasons, id generation, permissions.

### Test Strategy
- Backend: unit tests with the existing `FakeSheets` extended (append, update range, delete row, header ordering) and `FakeMailer`; contract tests via `run()`; cache version rebuild test.
- Library: vitest for whitelist, `appId` injection, timeouts, helpers, `cli_incompatible` on apiVersion 1.
- Mula: typecheck, lint, build; a Playwright Electron run (pattern from `frontend/e2e/consumer.mjs`) against the built CLI and a seeded cache.
- Live: one read-write run against the real sheet in a scratch copy of the spreadsheet, not production data (needs the owner to supply or approve the copy).

### Testability
`Context` already injects sheets, mailer and clock; add nothing global. Seed script generalized (`backend/tests/seed_demo.py`).

### Verification Evidence
Test output, Mula build output, e2e log, live-sync timing, dependency listing for Mula; recorded in a `verification.md`.

## 10. Implementation and Migration Considerations

### Implementation Order
1. Knowledge concepts (write path, quarantine). 2. Backend: registry fields, db schema, validate, writes, sync push/pull, quarantine, permissions, commands. 3. Library: contract, IPC, preload, hooks, tests. 4. Rebuild CLI, pack library. 5. Mula adapter and screens, then removal of old stack. 6. e2e and live verification.

### Migration and Rollout
Mula's local SQLite is abandoned; the first sync rebuilds from the sheet. Owner should push any unsynced Mula edits with the old build first. Mula's library dependency: `file:../Chakra/frontend` while both evolve, then the `npm pack` tarball. Rollback: Mula's previous commit and library 0.2.0 + CLI 0.2.0.

### Documentation and Operations
Update `docs/library.md`, README, backend knowledge (new concepts), Mula `docs`.

## 11. Architecture Decision Checkpoint

- **New ADR required:** Yes
- **Related ADRs:** [CLI process per call](../../../../backend/knowledge/decisions/cli-process-per-call.md)
- **Decision rationale:** the cache is no longer purely disposable, the contract version moves, and writes introduce a conflict model; see `adr.md`.

## 12. Risks, Trade-offs, and Open Questions

### Risks
| Risk | Impact | Mitigation |
|---|---|---|
| Any enabled app may write | Another enabled app could modify HR data | Permission is per app by the owner's decision; revisit if more apps consume Chakra |
| Generated ids collide across machines | Overwritten row | Last-writer by stamp; follow-up to check against the sheet before create |
| Header-based writes depend on header names | Wrong column if a header renamed | Registry names are data; a missing header fails that content with a clear message |
| Password reset rework changes existing behavior | Regression | Existing reset tests retained and updated |
| Mula refactor size | Regressions | Adapter layer first, delete old code last, gates after each step |

### Trade-offs
Cache holds unpushed edits: accepted for Mula's local-first model; mitigated by pending counts and docs. Sequential tab calls keep code simple; speed-up via one `batchGet` is left for later.

### Open Questions
- [ ] Default initial password policy (blocks employee-create task only).

## 13. Traceability

- **OpenSpec Change ID:** `chakra-hr-data-and-mula-integration`
- **Proposal:** `proposal.md`
- **Specifications:** `specs/content-write`, `specs/two-way-sync`, `specs/quarantine`, `specs/backend-cli`, `specs/app-features`, `specs/library-operations`, `specs/mula-integration`
- **ADRs:** `adr.md`
- **Tasks:** `tasks.md`
- **Related existing architecture and documentation:** [Python service](../../../../backend/knowledge/architecture/python-service.md), [Electron and dependencies](../../../../frontend/knowledge/architecture/electron-and-dependencies.md), `docs/library.md`

## 14. Design Readiness Review

- [x] The design addresses the proposal and specs.
- [x] Component responsibilities and boundaries are clear.
- [x] Interfaces, contracts and workflows are defined.
- [x] Data, failure, security and quality concerns are addressed.
- [x] Testing and verification approaches are defined.
- [x] Existing decisions are respected (one amended, recorded in the ADR).
- [x] ADR checkpoint complete.
- [x] Risks and open questions are explicit.
- [x] Detailed enough to derive tasks.

**Status:** Ready for task breakdown
