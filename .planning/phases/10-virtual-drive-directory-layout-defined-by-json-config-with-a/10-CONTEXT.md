# Phase 10: Virtual Drive Directory Layout from JSON Config — Context

**Gathered:** 2026-04-22
**Updated:** 2026-04-22 (session 2 — SQLite path implementation + drive security enforcement added)
**Status:** Ready for planning (Phase 10-02)

<domain>
## Phase Boundary

Replace any hardcoded virtual drive directory creation with a JSON-driven layout service. The JSON defines a high-level logical folder structure — `apps`, `cache`, `data` — which is ensured on every app start. Prana must accept the SQLite root path from the client app (Chakra) rather than resolving it internally, requiring a Prana PR for that capability.

</domain>

<decisions>
## Implementation Decisions

### JSON Schema Design
- **D-01:** Leaf nodes in `drive-layout.json` are empty objects `{}` — they represent folders only. No file metadata, no SQLite filenames, no purpose labels are tracked in the JSON.
- **D-02:** The JSON defines high-level logical groupings only. What goes inside each folder is not tracked here and is not the concern of the layout service.
- **D-03:** The structure can be reorganized between releases. On every app start, `ensureDirectories` runs and ensures all folders in the JSON exist (additive-only — never deletes).

### Target `drive-layout.json` Structure
- **D-04:** Top-level sections are: `apps`, `cache`, `data`
  - `apps/chakra` — Chakra app folder (no sub-directories defined)
  - `apps/dhi` — Dhi app folder (no sub-directories defined)
  - `cache/sqlite` — SQLite databases folder
  - `data/governance` — Governance data folder
- **D-05:** No deeper nesting than one level under each section for now. Sub-structure inside `apps/chakra` or `apps/dhi` is not Chakra's concern at the layout level — those apps manage their own internals.

### Prana SQLite Path — Implement Now (Option B)
- **D-06:** Prana should be stateless with respect to SQLite path decisions. Chakra (the client app) must provide the SQLite root path to Prana at startup rather than Prana resolving it internally from the System Drive.
- **D-07:** The Prana changes are implemented directly in `E:/Python/prana` as part of Phase 10. The PR spec at `docs/pr/prana/client-configurable-sqlite-root-path.md` is the implementation contract.
- **D-08 (REVISED):** ~~Defer to a future Prana PR~~ → **Implement now.** Approach: **Option B** — add `sqliteRoot?: string` to `PranaRuntimeConfig`. All Prana SQLite services call `getSqliteRoot()` (new helper, falls back to `getAppDataRoot()` if not set). Chakra sets `sqliteRoot = join(driveRoot, 'cache', 'sqlite')` via `setPranaRuntimeConfig` before `bootstrapHost` is invoked, AFTER `ensureDirectories` has created the folder. This is a backwards-compatible, no-breaking-change addition.
- **D-11:** SQLite services to update: `authStoreService`, `businessContextStoreService`, `contextDigestStoreService`, `sqliteConfigStoreService`, `runtimeDocumentStoreService`, and any other service that calls `join(getAppDataRoot(), DB_FILE_NAME)` for a `.sqlite` file. Non-SQLite services (governance repo, whatsapp session dir, audit log) keep using `getAppDataRoot()` unchanged.

### Drive Encryption & Locking (New — Prana PR Scope Addition)
- **D-12:** The virtual drive must be inaccessible when the app is not running. Currently the rclone process can outlive the app, leaving the mount browsable. Fix: Prana must enforce `dispose()` (unmount) on app quit — this is already hooked in Chakra via `registerDriveLifecycleHooks()` but the hook must be verified to actually kill the rclone process.
- **D-13:** `failClosed` must default to `true` for the system drive. If the encrypted rclone mount fails, Prana must NOT silently fall back to plaintext storage. The fallback to `{path}/db/live/` is acceptable ONLY in dev mode with `VIRTUAL_DRIVE_ENABLED=false`; in production the app must block startup if the encrypted drive is unavailable.
- **D-14:** If `cryptPassword` is the default placeholder value (`'default'` or empty), Prana must log a `[Prana] SECURITY WARNING: virtual drive is using a default/weak crypt password` at startup. This is non-blocking (user may be in dev mode) but must be visible.
- **D-15:** Both D-12 and D-13 are documented in a new companion PR: `docs/pr/prana/virtual-drive-security-enforcement.md`. This is filed alongside the SQLite PR as a separate Prana change.

### Startup Wiring
- **D-09:** `driveLayoutService.ensureDirectories(driveRoot)` is called inside Chakra's splash sequence — after the initial dependency checks (git, ssh, virtual drive binary — from Phase 8/9) and after the virtual drive mounts successfully, but before any read/write operations (SQLite init, governance, etc.).
- **D-10:** The call site is in Chakra (not in Prana). The JSON config and the read/write orchestration both live in Chakra. Prana is only responsible for mount mechanics.

### Claude's Discretion
- Exact placement of `setSqliteRoot` call in `bootstrapPranaMain` relative to `setPranaRuntimeConfig` — must be before any SQLite service opens a connection.
- Whether `getSqliteRoot()` lives in `governanceRepoService.ts` alongside `getAppDataRoot()` or in a new `sqlitePathService.ts` — Claude decides based on minimal footprint.
- Verification approach for the rclone process kill on quit — Claude checks `registerDriveLifecycleHooks` and the `dispose()` implementation.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prana Virtual Drive
- `E:/Python/prana/docs/features/storage/virtual-drive.md` — Virtual drive lifecycle, System Drive mechanics, Client-Owned Policy contract (§7.1)

### Prana Storage Governance
- `E:/Python/prana/docs/features/storage/governance/index.md` — Storage contract model, how client apps register cache/vault domains

### Existing Chakra Drive Decoupling PR (already filed)
- `docs/pr/prana/drive-decoupling-client-owned-policy-proposal.md` — Prior PR covering folder structure ownership being client-controlled (already submitted to Prana)

### Prana PRs (to implement as part of this phase)
- `docs/pr/prana/client-configurable-sqlite-root-path.md` — PR: add `sqliteRoot` to `PranaRuntimeConfig`, all SQLite services use `getSqliteRoot()` (D-07, D-08, D-11)
- `docs/pr/prana/virtual-drive-security-enforcement.md` — New companion PR: enforce unmount on quit, `failClosed` default, weak-password warning (D-12, D-13, D-14, D-15)

### Implementation Files
- `src/main/services/driveLayoutService.ts` — Already implemented; reads JSON, flattens tree, creates dirs. `ensureDirectories()` needs a call site wired into splash.
- `src/main/config/drive-layout.json` — JSON config to be updated with the correct directory structure.
- `src/main/index.ts` — Startup bootstrap; `registerDriveLifecycleHooks` and `bootstrapPranaMain` are the call site candidates.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `driveLayoutService.ts`: Fully implemented — `loadLayout()`, `ensureDirectories(driveRoot)`, `flattenDirectoryTree()`, `resolvePath()`, `getDirectoryPaths()`, `getQuotaConfig()`. Only missing: a caller.
- `drive-layout.json`: Exists but uses `app` (singular) and has extra cache sub-dirs (`temp`, `thumbnails`, `vfs`) that need to be reviewed against the new schema.

### Established Patterns
- Directory creation is additive-only — `ensureDirectories` uses `mkdir({ recursive: true })` and swallows EEXIST. This is correct and should stay.
- Prana's `driveControllerService.dispose()` is hooked on `before-quit` in Chakra — the drive lifecycle hook pattern is already established.

### Integration Points
- `bootstrapPranaMain` in `src/main/index.ts` is where `ensureDirectories` gets called — after drive mount event fires, before SQLite seed happens (currently around line 195–224).
- The `app:bootstrap-host` event from Prana signals that the drive is mounted and runtime config is validated — this is the right hook to call `ensureDirectories` after.

### Prana Implementation Targets (Phase 10-02)
- `E:/Python/prana/src/main/services/governanceRepoService.ts` — Add `getSqliteRoot()` / `setSqliteRootOverride()` alongside existing `getAppDataRoot()` / `setAppDataRootOverride()`.
- `E:/Python/prana/src/main/services/pranaRuntimeConfig.ts` — Add `sqliteRoot?: string` to config shape.
- All SQLite store services under `E:/Python/prana/src/main/services/` that call `join(getAppDataRoot(), '*.sqlite')`: `authStoreService`, `businessContextStoreService`, `contextDigestStoreService`, `sqliteConfigStoreService`, `runtimeDocumentStoreService` and any others — update to `getSqliteRoot()`.
- `E:/Python/prana/src/main/services/driveControllerService.ts` — Verify `dispose()` kills rclone process (D-12). Add weak-password warning (D-14). Default `failClosed` logic review (D-13).
- `src/main/index.ts` (Chakra) — After `ensureDirectories`, call `setPranaRuntimeConfig({ ..., sqliteRoot: join(driveRoot, 'cache', 'sqlite') })` before `bootstrapHost`.

</code_context>

<specifics>
## Specific Ideas

- The user's mental model: `apps` = per-app sandboxed folders, `cache` = runtime cache (sqlite for now), `data` = persistent data (governance for now). Each section can grow independently without touching the service logic.
- "Reorganize" means: if the JSON changes between versions, the new folders appear on next start. Old folders are never cleaned up automatically — that is intentional.
- Prana stateless principle: "Prana should be stateless — using app client like Chakra should provide where to save sqlite or state of where to save db data."

</specifics>

<deferred>
## Deferred Ideas

- Sub-directory structure inside `apps/chakra` or `apps/dhi` — not tracked at this level, each app manages its own internals.
- Cleanup of orphaned directories (folders in drive that are no longer in JSON) — explicitly not in scope; additive-only is the current policy.
- Monitoring or quota enforcement per folder — not in scope for this phase.

</deferred>

---

*Phase: 10-virtual-drive-directory-layout-defined-by-json-config-with-a*
*Context gathered: 2026-04-22*
