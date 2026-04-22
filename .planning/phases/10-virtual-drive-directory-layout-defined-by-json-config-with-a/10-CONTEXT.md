# Phase 10: Virtual Drive Directory Layout from JSON Config — Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

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

### Prana SQLite Path — Client-Configurable (Prana PR Required)
- **D-06:** Prana should be stateless with respect to SQLite path decisions. Chakra (the client app) must provide the SQLite root path to Prana at startup rather than Prana resolving it internally from the System Drive.
- **D-07:** A Prana PR is required: `docs/pr/prana/client-configurable-sqlite-root-path.md`. See that file for the full PR spec.
- **D-08:** Until the Prana PR is implemented, `ensureDirectories` ensures `cache/sqlite` folder exists but Prana continues to write SQLite files wherever it currently does. Phase 10 implementation does not block on the Prana PR — the PR is filed and Chakra adaptation happens after Prana delivers.

### Startup Wiring
- **D-09:** `driveLayoutService.ensureDirectories(driveRoot)` is called inside Chakra's splash sequence — after the initial dependency checks (git, ssh, virtual drive binary — from Phase 8/9) and after the virtual drive mounts successfully, but before any read/write operations (SQLite init, governance, etc.).
- **D-10:** The call site is in Chakra (not in Prana). The JSON config and the read/write orchestration both live in Chakra. Prana is only responsible for mount mechanics.

### Claude's Discretion
- Where exactly in `bootstrapPranaMain` to inject the `ensureDirectories` call — Claude decides based on the existing hook sequence.
- Error handling strategy for `ensureDirectories` failures (warn vs. block startup) — Claude decides; leaning toward warn-only since individual directory failures are non-fatal.

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

### New Prana PR (to be filed as part of this phase)
- `docs/pr/prana/client-configurable-sqlite-root-path.md` — New PR: Prana SQLite services accept root path from client app

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
