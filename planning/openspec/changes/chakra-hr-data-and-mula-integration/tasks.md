# Implementation Tasks: chakra-hr-data-and-mula-integration

- **OpenSpec Change ID:** `chakra-hr-data-and-mula-integration`
- **Status:** Not Started
- **Related artifacts:** `proposal.md`, `specs/`, `api-contract.md`, `design.md`, `adr.md`

Ownership: sections 2-6 change only Chakra and must stay Mula-agnostic (no Mula names, ids, UI or defaults; behavior from `specs/`). Section 7 changes only Mula, using Chakra solely through the library. Use test-first where applicable. Do not mark tasks complete without verification evidence; record results in `verification.md`. Branch (Chakra): `feature/chakra-hr-data-and-mula-integration` from `develop`. Mula gets a matching branch from its `develop`; Mula changes need the owner's confirmation per Mula's `AGENTS.md` before section 7 starts. Windows verification is excluded (done separately).

## 1. Preparation and Baseline
- [ ] 1.1 Answer the remaining open questions (default password, durability of cache). Decided already: tab names come from the sheet; permission is per app.
- [ ] 1.2 Registry fixes found against the real sheet: add the `id` key to `employee_teams`; add the `sync` column to every content (all tabs have it); normalize header matching (headers include `short key`, `Holiday Name`, `carry forward`, `value ` with a trailing space); treat `carry_forward` as text, only `count` and `max_forward` as integers. Use a scratch copy of the spreadsheet for write tests.
- [ ] 1.3 Create the Chakra feature branch from `develop`; record baseline: backend `pytest`, frontend `typecheck`, `lint`, `test`.
- [ ] 1.4 Record Mula baseline: `npm install`, `typecheck`, `lint`, `build` (note pre-existing failures).
- [ ] 1.5 Knowledge first: add backend concepts (write path and dirty/stamp model, quarantine), amend `knowledge/concepts/library-and-cli-split.md` and the CLI contract concept for durable pending edits and `apiVersion` 2; run `scripts/verify_knowledge.py` on all bundles.

## 2. Backend: registry, cache schema, validation
**Traceability:** `specs/content-write`, `specs/two-way-sync` (pull validation), design sections 4-5.
- [ ] 2.1 Tests: registry loads new fields; unknown relation/column rejected at load; tables get `sync`, `is_dirty`, `is_deleted`; `quarantine` table exists; older cache version is rebuilt.
- [ ] 2.2 Implement registry fields (`writable`, `id_prefix`, `required`, `relations`, `integers`, `sync_column`), HR content entries, cache schema and `user_version` handling.
- [ ] 2.3 Tests then implementation for `validate.py`: `missing_id`, `missing_required`, `invalid_relation`, `type_mismatch`.
- [ ] 2.4 Give `employees` and `config` features so `content get` can serve them; exclude `password_hash` from `content get`; exclude deleted rows by default.

## 3. Backend: writes
**Traceability:** `specs/content-write`, `specs/app-features`.
- [ ] 3.1 Tests: create (generated id per prefix, validation errors, duplicate id, required, relation), update, delete, durability across a new connection, read-only content.
- [ ] 3.2 Implement `writes.py` and register `content create|update|delete`; employee password hashing (default initial password as a setting); never return hashes.
- [ ] 3.3 Tests then implementation of `can_write` (enabled app allowed; disabled/unknown app `app_not_enabled`; not synced `not_synced`) and the library-supplied `appId` rule at the CLI boundary.

## 4. Backend: two-way sync
**Traceability:** `specs/two-way-sync`, ADR.
- [ ] 4.1 Extend `FakeSheets` (append, range update, delete rows, header order, sync column). Write characterization tests named after Mula's rules: insert absent, sheet-newer replace, skip when local newer, conflict record, absent-and-clean soft delete, absent-and-dirty kept, push new, push newer, skip older, delete phase, dirty cleared only when pushed.
- [ ] 4.2 Implement `sheets.py` additions (append, batch update, delete rows bottom-up, header-based positions) and verify against the Google client with a small live read.
- [ ] 4.3 Implement push then pull in `sync.py` in dependency order; per-content isolation; extended results and `sync status` counts.
- [ ] 4.4 Move password reset onto the dirty-row mechanism and remove `pending_updates`; keep existing reset/login tests passing (update where the storage differs).
- [ ] 4.5 Failure-injection tests: write failure keeps dirty, pull failure keeps previous rows, cache deleted loses unpushed edits only.

## 5. Backend: quarantine and contract
**Traceability:** `specs/quarantine`, `specs/backend-cli`.
- [ ] 5.1 Tests then implementation: record with dedupe, list (status filter, newest first), count, reject, accept-sheets (conflict and validation), apply-local (conflict only), fix (valid and still invalid), delete-record, scan.
- [ ] 5.2 Register `quarantine *` commands; `API_VERSION = 2`; new error codes; update the contract test suite and `meta version` expectations; bump backend version to 0.3.0.
- [ ] 5.3 Rebuild the CLI binary (onefile and onedir); verify `meta version`; generalize `tests/seed_demo.py`.

## 6. Library
**Traceability:** `specs/library-operations`.
- [ ] 6.1 Tests: whitelist includes the new ops and rejects others; `appId` injected for each; `quarantine.scan` and `sync.run` use the long timeout; `SUPPORTED_API_VERSION` 2 rejects a v1 CLI.
- [ ] 6.2 Implement contract, main registration, preload bridge, typed helpers and hooks (`useContent`, `useContentMutations`, `useQuarantine`); mapped error messages (`app_not_enabled`, `validation_failed`).
- [ ] 6.3 Typecheck, lint, tests, `build:lib`; `npm pack`; install the tarball into a blank app and check exports; bump to 0.3.0; update `docs/library.md`.
- [ ] 6.4 Extend the Electron e2e (`frontend/e2e/consumer.mjs`) with create, edit, delete and a sync against a fake-sheet-seeded cache.

## 7. Mula integration (needs owner confirmation first)
**Traceability:** `specs/mula-integration`.
- [ ] 7.1 Confirm scope and branch with the owner; create the Mula branch.
- [ ] 7.2 Add the library dependency `file:../Chakra/frontend`; register it in main with `appId: 'APP008'` (the app's id in the sheet), load the preload bridge, wrap the renderer with `ChakraGate`; app boots through library screens with the CLI path configured.
- [ ] 7.3 Add an adapter layer in the renderer that exposes Mula's existing repo interfaces over library calls (one module at a time: departments, designations, teams, holidays, leaves, attendance keys, configuration, employees, employee-teams); resolve names from returned content.
- [ ] 7.4 Replace the quarantine screen's data source with the library operations.
- [ ] 7.5 Remove Mula's database entirely (no schema, init, migrations or file) together with Mula's `mula:*` auth, sync, CRUD and quarantine IPC handlers, the SQLite/drizzle/Sheets/service-account/bcrypt code, the `google_auth` and data tables, and the dependencies; keep only Mula UI and its own features, with non-HR settings in the platform settings store.
- [ ] 7.6 Mula `typecheck`, `lint`, `build` pass; dependency and import check shows none of the removed stack; `graphify update .` in both repos.
- [ ] 7.7 Switch to the `npm pack` tarball dependency for the release build and confirm it installs and builds.

## 8. Integration and Verification
- [ ] 8.1 Run all Chakra checks: backend pytest, frontend typecheck/lint/test/build, knowledge verify.
- [ ] 8.2 End-to-end run of Mula against the built CLI with a seeded cache: login, list, create, edit, delete, sync, quarantine resolve. Record evidence.
- [ ] 8.3 Live run on the scratch copy of the real sheet: create/edit/delete then sync; confirm the sheet rows (including the `sync` column) and a conflict case from two caches; record timings against the ADR review trigger.
- [ ] 8.4 Verify every scenario in `specs/` and record evidence; list unverified items (Windows).
- [ ] 8.5 Update README, `AGENTS.md`, `docs/library.md`, Mula docs; accept the ADR into `backend/knowledge/decisions/`; update knowledge logs.
- [ ] 8.6 `code-reviewer` review of both repos' diffs; fix findings.

## 9. Merge and Archive
- [ ] 9.1 Merge the Chakra branch to `develop` (no PR, per owner preference) after gates; merge the Mula branch likewise with owner confirmation.
- [ ] 9.2 Archive the change after the Windows verification is recorded.
