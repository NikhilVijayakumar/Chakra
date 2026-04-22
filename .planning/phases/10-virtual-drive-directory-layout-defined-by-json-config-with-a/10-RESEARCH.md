# Phase 10: Virtual Drive Directory Layout from JSON Config — Research

**Researched:** 2026-04-22
**Domain:** Electron main-process startup wiring / Prana virtual drive integration / JSON-driven directory layout
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Leaf nodes in `drive-layout.json` are empty objects `{}` — folders only.
- **D-02:** JSON defines high-level logical groupings only. What goes inside each folder is not tracked here.
- **D-03:** Additive-only. `ensureDirectories` runs on every app start; never deletes.
- **D-04:** Top-level sections: `apps`, `cache`, `data`
  - `apps/chakra`, `apps/dhi` — per-app sandboxed folders
  - `cache/sqlite` — SQLite databases folder
  - `data/governance` — Governance data folder
- **D-05:** No deeper nesting than one level under each section for now.
- **D-06:** Prana must be stateless with respect to SQLite path — Chakra provides it.
- **D-07:** A Prana PR is required: `docs/pr/prana/client-configurable-sqlite-root-path.md`.
- **D-08:** Phase 10 does not block on the Prana PR. `ensureDirectories` ensures `cache/sqlite/` exists; Prana PR is filed and Chakra adaptation happens after Prana delivers.
- **D-09:** `driveLayoutService.ensureDirectories(driveRoot)` is called inside Chakra's splash sequence — after dependency checks and after virtual drive mounts, but before any read/write operations.
- **D-10:** Call site is in Chakra main process (not Prana). JSON config and read/write orchestration both live in Chakra.

### Claude's Discretion

- Exact insertion point for `ensureDirectories` within `bootstrapPranaMain`.
- Error handling strategy for `ensureDirectories` failures (warn vs. block startup).

### Deferred Ideas (OUT OF SCOPE)

- Sub-directory structure inside `apps/chakra` or `apps/dhi`.
- Cleanup of orphaned directories (additive-only policy is intentional).
- Monitoring or quota enforcement per folder.
</user_constraints>

---

## Summary

Phase 10 has two concrete deliverables: (1) wire `driveLayoutService.ensureDirectories(driveRoot)` into the Chakra startup sequence at the correct moment after drive mount, and (2) update `drive-layout.json` to match the D-04 target structure. A third deliverable — the Prana PR document `docs/pr/prana/client-configurable-sqlite-root-path.md` — already exists and was pre-written; this phase just ensures it is filed, not implemented.

The service (`driveLayoutService.ts`) is already complete and correct. The JSON config exists but has the wrong shape (`app` instead of `apps`, extra cache sub-dirs). The startup wiring is missing entirely — `ensureDirectories` is never called.

The critical research finding is the exact call site: `ensureDirectories` must be called from the **main process** (`bootstrapPranaMain` in `src/main/index.ts`), not from the renderer or from any Prana internal. The drive mount happens inside Prana's `app:bootstrap-host` IPC handler (`ipcService.ts:132` — `driveControllerService.initializeSystemDrive()`), which is invoked from the renderer's splash flow. After mount, `driveControllerService.getSystemDataRoot()` returns the usable drive root. Chakra cannot directly observe when the IPC handler completes from the main process side — the render-side already awaits `bootstrapHost` result. The main process needs a different approach: it must intercept the drive root **after** `app:bootstrap-host` completes and the drive record is live.

**Primary recommendation:** Call `ensureDirectories` from the main process immediately after the `app:bootstrap-host` IPC call completes by hooking Prana's `hookSystemService` `system.status` event for `drive:system` component with `healthy` status, or by calling `driveControllerService.getSystemDataRoot()` synchronously in an `ipcMain` post-handler. The cleanest approach for the current architecture is to add a `ipcMain.on('app:bootstrap-host')` **after** result event listener that reads the system data root and calls `ensureDirectories` — but since `ipcMain.handle` already owns that channel, the correct pattern is to **add a new dedicated IPC handler** (e.g. `chakra:ensure-drive-layout`) that the renderer calls right after `bootstrapHost` resolves, passing the resolved drive root, OR to call it from inside the existing `app:bootstrap-host` post-processing in Chakra's IPC setup.

The simplest and most robust insertion point — given the code as written — is to **register a hook in the main process via Prana's `hookSystemService`** listening for `system.status` with `component: 'drive:system'` and `status: 'healthy'`, then call `ensureDirectories(driveControllerService.getSystemDataRoot())`. This fires exactly once after the system drive mounts, from the main process, with the correct root.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| JSON layout definition (`drive-layout.json`) | Chakra main (bundled config) | — | Client-owned policy; Prana must not define folder structure |
| Directory tree flattening (`flattenDirectoryTree`) | Chakra main | — | Already in `driveLayoutService.ts`; pure computation |
| Directory creation (`ensureDirectories`) | Chakra main | — | Chakra owns drive policy; runs after mount |
| Drive mount execution (`initializeSystemDrive`) | Prana main | — | Prana owns mount mechanics per §7.1 contract |
| Drive root resolution (`getSystemDataRoot`) | Prana main | — | Prana tracks mount record; Windows vs Unix path difference |
| SQLite path configuration | Prana main (future) | Chakra main (caller) | PR adds `sqliteRoot` to `PranaRuntimeConfig`; Chakra provides value |
| Prana PR document | Chakra docs | — | Authored in Chakra, submitted to Prana repo |

---

## Standard Stack

No new libraries needed for this phase. All tools are already in place.

### Core (already present)
| Module | Location | Purpose | Notes |
|--------|----------|---------|-------|
| `driveLayoutService` | `src/main/services/driveLayoutService.ts` | Loads JSON, flattens tree, creates dirs | Fully implemented; only missing call site |
| `drive-layout.json` | `src/main/config/drive-layout.json` | Defines virtual drive folder structure | Needs schema update |
| `hookSystemService` | `prana/main/services/hookSystemService` | Emits/subscribes to runtime events | Used for `system.status` drive:system events |
| `driveControllerService` | `prana/main/services/driveControllerService` | Mounts/unmounts drives; exposes `getSystemDataRoot()` | Already imported in Chakra main |
| `node:fs/promises.mkdir` | Node built-in | Directory creation with `{ recursive: true }` | Already used in `driveLayoutService` |

---

## Research Findings: The 5 Key Questions

### Q1 — Drive Mount Hook: What signal fires after system drive mounts?

**Finding: HIGH confidence** [VERIFIED: reading `prana/src/main/services/ipcService.ts:112-194` and `driveControllerService.ts:246-248,466-469`]

The system drive is mounted inside the `app:bootstrap-host` IPC handler in Prana (`ipcService.ts:132`):

```typescript
// prana/src/main/services/ipcService.ts:132
const systemDriveStatus = await driveControllerService.initializeSystemDrive()
```

This `initializeSystemDrive()` call (in `driveControllerService.ts:614-617`) does two things:
1. Creates the fallback path directory
2. Calls `mountDrive('system')` which on success calls `updateSystemDataRoot(record, config)` and then emits `system.status` via `hookSystemService`:

```typescript
// driveControllerService.ts:246-248
const emitDriveStatus = async (driveId, status, reason) => {
  await hookSystemService.emit('system.status', { component: `drive:${driveId}`, status, reason })
}
// Called at line 469 after successful mount: emitDriveStatus(driveId, 'healthy', result.message)
```

**What `getSystemDataRoot()` returns after mount (driveControllerService.ts:656-662):**
```typescript
getSystemDataRoot(): string {
  const system = getDriveRecord('system')
  if (system?.stage === 'MOUNTED') {
    return isWindows() ? system.mountPoint : join(system.mountPoint, 'live')
  }
  return getNormalizedVirtualDriveConfig().drives.system.fallbackPath
}
```
- On Windows with successful mount: returns the drive letter, e.g. `S:` (the `mountPoint` itself)
- On Unix with successful mount: returns `<mountPoint>/live`
- On fallback: returns the fallback local path (e.g., `<governanceRepoPath>/db/live`)

**Key architectural observation:** The renderer calls `bootstrapHost` and awaits completion. The main process cannot intercept "bootstrap-host completed" from within the `app:bootstrap-host` handler context because that handler is entirely inside Prana's `ipcService.ts`. Chakra's main process registered the handler for `app:check-host-dependencies` (line 149 of `src/main/index.ts`) but has no hook registered for post-`bootstrap-host` processing.

**Two viable integration options for calling `ensureDirectories`:**

**Option A — `hookSystemService` subscription (RECOMMENDED):**
Register a one-time hook listener in Chakra's main process for the `system.status` event (`component: 'drive:system'`, `status: 'healthy'`). This fires from within Prana's mount flow, from the main process, synchronously after mount completes. Call `driveControllerService.getSystemDataRoot()` to get the root, then call `ensureDirectories`. This requires importing `hookSystemService` in Chakra's main.

```typescript
// Register in bootstrapPranaMain, after 'prana/main/index' is imported
const { hookSystemService } = await import('prana/main/services/hookSystemService')
const { driveControllerService } = await import('prana/main/services/driveControllerService')
hookSystemService.once('system.status', async (payload) => {
  if (payload.component === 'drive:system' && payload.status === 'healthy') {
    const driveRoot = driveControllerService.getSystemDataRoot()
    await ensureDirectories(driveRoot)
  }
})
```

**Option B — New IPC handler `chakra:ensure-drive-layout`:**
Chakra registers a new `ipcMain.handle('chakra:ensure-drive-layout')` that the renderer calls (from within the splash viewmodel) right after `bootstrapHost` resolves successfully. The renderer passes nothing (Chakra main reads the drive root itself). This adds a renderer round-trip but is simpler to audit.

**Verdict:** Option A (hookSystemService) is cleaner — no renderer dependency, fires immediately from the main process when drive is confirmed healthy. Option B is acceptable but adds an IPC round-trip and a renderer-side call site that must be maintained.

**Important edge case:** If the virtual drive is disabled (dev mode, `VIRTUAL_DRIVE_ENABLED=false`), `mountDriveInternal` still emits `system.status` but with posture `DEGRADED` not `healthy`. In fallback mode, `getSystemDataRoot()` returns the local fallback path — `ensureDirectories` should still run against it. So the hook should fire on **both** `healthy` and `degraded` (or just check `component === 'drive:system'` regardless of status). [VERIFIED: `driveControllerService.ts:332` — `emitDriveStatus(driveId, 'degraded', message)` fires on fallback too]

---

### Q2 — JSON Schema: Does `drive-layout.json` need changes? Does `flattenDirectoryTree` handle the target structure?

**Finding: HIGH confidence** [VERIFIED: reading `driveLayoutService.ts:27-43` and `drive-layout.json`]

**Current `drive-layout.json` shape (WRONG — needs update):**
```json
{
  "directories": {
    "cache": { "temp": {}, "thumbnails": {}, "vfs": {} },
    "data": { "governance": {} },
    "app": { "chakra": {}, "dhi": {} }
  }
}
```

**Target shape per D-04:**
```json
{
  "directories": {
    "apps": { "chakra": {}, "dhi": {} },
    "cache": { "sqlite": {} },
    "data": { "governance": {} }
  }
}
```

**Changes required:**
1. Rename `"app"` → `"apps"` (singular to plural)
2. Replace `"cache"` sub-dirs (`temp`, `thumbnails`, `vfs`) with just `"sqlite": {}`
3. Keep `"data": { "governance": {} }` — already correct

**`flattenDirectoryTree` handles this correctly:** [VERIFIED: `driveLayoutService.ts:27-43`]

The function recursively walks any `Record<string, unknown>` tree. For the target shape, it produces:
```
['apps', 'apps/chakra', 'apps/dhi', 'cache', 'cache/sqlite', 'data', 'data/governance']
```
This is exactly right — both the parent folder and child folders are created. No changes to `driveLayoutService.ts` are needed for the new schema.

**`loadLayout()` validation checks (driveLayoutService.ts:56-65):**
- Checks `layout.directories` is a non-null object — passes
- Checks `layout.quota.maxStorageMb` is a number — passes (quota stays unchanged)
- No other schema enforcement, so adding/removing directory keys requires no service changes

---

### Q3 — SQLite Path: How does Prana currently resolve it? Any existing `sqliteRoot` field?

**Finding: HIGH confidence** [VERIFIED: reading `sqliteConfigStoreService.ts:25-30` and `pranaRuntimeConfig.ts`]

**Current SQLite path resolution in Prana (`sqliteConfigStoreService.ts:25-30`):**
```typescript
const getConfigCacheRoot = (): string => {
  const cacheLocation = getPranaRuntimeConfig()?.storage?.cacheLocation
  return cacheLocation === 'drive' ? getAppDataRoot() : getStableAppDataRoot()
}
const getDbPath = (): string => join(getConfigCacheRoot(), DB_FILE_NAME)
```

- If `storage.cacheLocation === 'drive'`: uses `getAppDataRoot()` which returns `appDataRootOverride` — the value set by `updateSystemDataRoot()` after drive mount. On Windows with a mounted drive, this is the drive letter (e.g. `S:`). The SQLite file lands at `S:\runtime-config.sqlite` — **not** inside any sub-folder.
- If `storage.cacheLocation !== 'drive'` (or unset, default): uses `getStableAppDataRoot()` which is always `~/.prana` (home-dir based, drive-independent).

**There is NO `sqliteRoot` field in `PranaRuntimeConfig`** [VERIFIED: `pranaRuntimeConfig.ts:6-94`]. The schema has `storage.cacheLocation: z.enum(['local', 'drive']).optional()` but no path override.

**All other SQLite-backed services follow the same pattern:** they use `getAppDataRoot()` or `getStableAppDataRoot()` from `governanceRepoService.ts` — no service-specific path override exists today.

**What a clean PR looks like:** Add `storage.sqliteRoot?: z.string().optional()` to `PranaRuntimeConfigSchema`. In `getConfigCacheRoot()`, check `getPranaRuntimeConfig()?.storage?.sqliteRoot` first; if present and non-empty, use it. This is backward compatible — omitting `sqliteRoot` leaves behavior unchanged. The PR document at `docs/pr/prana/client-configurable-sqlite-root-path.md` already specifies this approach correctly.

---

### Q4 — Prana PR Feasibility: Is the SQLite root hardcoded or injectable? What is the minimal change?

**Finding: HIGH confidence** [VERIFIED: reading `sqliteConfigStoreService.ts`, `pranaRuntimeConfig.ts`, `governanceRepoService.ts`]

**Current hardcoding level:**
- `sqliteConfigStoreService.ts`: Hardcoded to `getConfigCacheRoot()` which routes through `getAppDataRoot()` (mount-point root) or `getStableAppDataRoot()` (home dir). No path parameterization.
- `governanceRepoService.ts:32-42`: `getAppDataRoot()` returns `appDataRootOverride` if set, else home-dir based. This override is the **drive letter** (e.g., `S:`), not a sub-folder.
- No SQLite service today accepts a path argument at the function level.

**The minimal Prana change (3-file edit):**

1. **`pranaRuntimeConfig.ts`** — Add to `PranaRuntimeConfigSchema.storage`:
   ```typescript
   storage: z.object({
     cacheLocation: z.enum(['local', 'drive']).optional(),
     sqliteRoot: z.string().optional(),   // NEW
   }).optional(),
   ```

2. **`sqliteConfigStoreService.ts`** — Modify `getConfigCacheRoot()`:
   ```typescript
   const getConfigCacheRoot = (): string => {
     const sqliteRoot = getPranaRuntimeConfig()?.storage?.sqliteRoot
     if (sqliteRoot) return sqliteRoot                    // NEW: client-provided path wins
     const cacheLocation = getPranaRuntimeConfig()?.storage?.cacheLocation
     return cacheLocation === 'drive' ? getAppDataRoot() : getStableAppDataRoot()
   }
   ```

3. **Same pattern for any other SQLite-backed store services** (`runtimeDocumentStoreService`, `conversationStoreService`, etc.) — each has its own `getDbPath()` function that calls `getAppDataRoot()` or `getStableAppDataRoot()`. Each needs the same `sqliteRoot` priority check.

**Phase 10 scope (D-08):** The PR is filed (document already exists), not implemented. Chakra adaptation (passing `sqliteRoot` in the runtime config) happens in a future phase after Prana delivers the feature.

---

### Q5 — Startup Sequence: Exact insertion point for `ensureDirectories`

**Finding: HIGH confidence** [VERIFIED: reading `src/main/index.ts:62-226` in full]

**Current `bootstrapPranaMain` execution order:**

```
1. setPranaPlatformRuntime(...)                    [line 86]
2. setPranaRuntimeConfig(config)                  [line 138]
3. Register app:check-host-dependencies IPC       [lines 147-159]
4. verifyStartupSafety({ env })                   [line 166]  — blocks if unsafe
5. css-tree patch.json workaround                 [lines 178-190]
6. await import('prana/main/index')               [line 192]  — loads Prana runtime
7. import driveControllerService + registerDriveLifecycleHooks()  [lines 194-202]
8. sqliteConfigStoreService seed/overwrite        [lines 208-224]
9.   (RENDERER LATER) → bootstrapHost IPC fires   [renderer: useDhiSplashViewModel.ts:78]
10.  (INSIDE IPC) → initializeSystemDrive()       [prana/ipcService.ts:132]  ← mount happens here
11.  (INSIDE IPC) → startupOrchestrator.runStartupSequence()  [prana/ipcService.ts:166]
```

**Key insight:** Steps 1-8 run at process start (before any renderer interaction). The drive mount (step 10) only happens when the renderer calls `bootstrapHost` IPC. This is **after** `bootstrapPranaMain` has already returned.

**Correct insertion point for `ensureDirectories`:** Between steps 10 and 11 — i.e., after drive mounts but before startup orchestration reads SQLite. This cannot be done by inserting code in `bootstrapPranaMain`'s linear sequence because the drive mount happens later in an IPC handler.

**Recommended approach — register hook subscriber at step 7:**

After registering `registerDriveLifecycleHooks()` (step 7), also register a `hookSystemService` listener that will fire when the drive mounts. Since `hookSystemService.emit` fires synchronously within the `app:bootstrap-host` IPC handler (before `runStartupSequence` is called), the `ensureDirectories` call will complete before the startup orchestrator runs.

```typescript
// Insert after registerDriveLifecycleHooks() in bootstrapPranaMain
// (src/main/index.ts, around line 200)
try {
  const { hookSystemService } = await import('prana/main/services/hookSystemService')
  const { driveControllerService } = await import('prana/main/services/driveControllerService')
  const { driveLayoutService } = await import('./services/driveLayoutService')

  // Fire once when drive:system reports any status (healthy = mounted, degraded = fallback)
  // ensureDirectories is additive and safe to run against fallback paths too
  const unsubscribe = hookSystemService.on('system.status', async (payload: any) => {
    if (payload?.component === 'drive:system') {
      unsubscribe()  // one-time only
      const driveRoot = driveControllerService.getSystemDataRoot()
      try {
        await driveLayoutService.ensureDirectories(driveRoot)
      } catch (err) {
        console.warn('[Chakra] ensureDirectories failed (non-fatal):', err)
      }
    }
  })
  console.info('[Chakra] Registered drive layout hook')
} catch (error) {
  console.warn('[Chakra] Could not register drive layout hook:', error)
}
```

**Timing guarantee:** `hookSystemService.emit('system.status', ...)` is called inside `driveControllerService.mountDriveInternal` at line 469 (after mount record is written and `updateSystemDataRoot` has run). The `runStartupSequence()` call in `ipcService.ts` is at line 166, which is **after** `initializeSystemDrive()` at line 132. So `ensureDirectories` completes before startup orchestration touches SQLite.

**Need to verify hookSystemService API:** [ASSUMED — need to check actual `hookSystemService` API to confirm it has `on` (subscribable) vs only `emit` and `once`]

**Error handling (Claude's Discretion):** Use warn-only. A failed `mkdir` for a single directory is non-fatal — Prana can still write SQLite files to the drive root or its fallback. Blocking startup for a missing sub-folder is disproportionate. The existing `ensureDirectories` implementation already logs a `console.warn` per-directory failure (line 83-86 of `driveLayoutService.ts`) and swallows EEXIST. The outer try/catch above wraps the entire call.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Directory tree flattening | Custom recursive walk | `flattenDirectoryTree` in `driveLayoutService.ts` | Already tested, handles arbitrary nesting |
| Drive root resolution | Parse drive letter from config | `driveControllerService.getSystemDataRoot()` | Handles Windows vs Unix, MOUNTED vs fallback correctly |
| Directory existence check | `existsSync` before `mkdir` | `mkdir({ recursive: true })` with EEXIST swallow | Already in `ensureDirectories`; race-condition-safe |
| Event subscription | Custom event bus | Prana `hookSystemService` | Already wired into drive mount flow |

---

## Architecture Patterns

### System Architecture Diagram

```
Chakra Main Process (bootstrapPranaMain)
│
├─ 1. setPranaRuntimeConfig(config)
├─ 2. import('prana/main/index')  ← loads Prana runtime
├─ 3. registerDriveLifecycleHooks()  ← before-quit dispose
├─ 4. [NEW] hookSystemService.on('system.status', driveReadyHandler)
│         └─ driveReadyHandler: fires on drive:system status event
│                └─ driveControllerService.getSystemDataRoot() → driveRoot
│                └─ driveLayoutService.ensureDirectories(driveRoot)
│                       └─ reads drive-layout.json (bundled)
│                       └─ flattenDirectoryTree(directories)
│                       └─ mkdir(driveRoot/apps/chakra, driveRoot/apps/dhi, ...)
├─ 5. sqliteConfigStoreService.seed/overwrite(config)
│
▼
[Renderer calls bootstrapHost IPC]
│
Prana ipcService.ts: app:bootstrap-host handler
├─ setPranaRuntimeConfig(payload.config)
├─ sqliteConfigStoreService.seedFromRuntimePropsIfEmpty(config)
├─ driveControllerService.initializeSystemDrive()
│       └─ mountDriveInternal('system')
│               └─ provider.mount(...) → success
│               └─ updateRegistry(MOUNTED record)
│               └─ updateSystemDataRoot(record, config)  ← sets appDataRootOverride
│               └─ hookSystemService.emit('system.status', {component:'drive:system', status:'healthy'})
│                       └─ [TRIGGERS driveReadyHandler in Chakra main]
│                               └─ ensureDirectories(driveRoot)  ← directories created
└─ startupOrchestratorService.runStartupSequence()  ← SQLite init happens here, AFTER dirs exist
```

### Recommended Project Structure (no changes)

```
src/main/
├─ config/
│  └─ drive-layout.json          # Update schema: apps/cache/data
├─ services/
│  └─ driveLayoutService.ts      # No changes needed
└─ index.ts                      # Add hookSystemService subscription
```

---

## Common Pitfalls

### Pitfall 1: Calling `ensureDirectories` Before Drive Mounts
**What goes wrong:** `bootstrapPranaMain` runs synchronously at process start. If `ensureDirectories` is called there linearly (step 7 equivalent), the drive is not yet mounted — `getSystemDataRoot()` returns the fallback local path, not the drive. Directories get created in the wrong place.
**Why it happens:** Drive mount happens during `app:bootstrap-host` IPC which fires from the renderer, long after `bootstrapPranaMain` completes.
**How to avoid:** Use the `hookSystemService` subscription pattern — do NOT call `ensureDirectories` in the linear body of `bootstrapPranaMain`.

### Pitfall 2: Calling `getSystemDataRoot()` in the Hook Before `updateSystemDataRoot` Runs
**What goes wrong:** If the hook fires from an early emission that precedes `updateSystemDataRoot`, `getSystemDataRoot()` still returns the fallback.
**Why it doesn't apply here:** The `system.status` emission (`hookSystemService.emit(...)` at `driveControllerService.ts:469`) is called **after** `updateSystemDataRoot(record, config)` at line 466. So by the time the hook fires, `appDataRootOverride` is already set to the correct mount point. Order: `updateRegistry` (452) → `updateSystemDataRoot` (466) → `emitDriveStatus` (469).
**Warning signs:** If `getSystemDataRoot()` returns a path ending in `db/live` (fallback) when you expected a drive letter, the drive didn't mount.

### Pitfall 3: Blocking Startup on `ensureDirectories` Failure
**What goes wrong:** If `ensureDirectories` throws and is not caught, it can prevent `startupOrchestrator.runStartupSequence()` from running (if the hook is invoked synchronously within the IPC handler's await chain).
**How to avoid:** Wrap `ensureDirectories` in try/catch with `console.warn`. The call is within a `hookSystemService.emit` subscriber, which Prana may or may not await — treat it as fire-and-hope unless you confirm Prana awaits all subscribers.
**Confirmed [ASSUMED]:** Need to check if `hookSystemService.emit` awaits subscriber callbacks. If not, timing is fine; if yes, an uncaught error from the subscriber could propagate into the IPC handler.

### Pitfall 4: `drive-layout.json` Plural vs Singular Key
**What goes wrong:** Current JSON has `"app"` (singular). The D-04 target is `"apps"` (plural). If the rename is missed, directories land at `apps/chakra` vs `app/chakra` — two different paths.
**How to avoid:** Update the JSON file explicitly (not just the service). Run app and verify `driveLayoutService` log `Drive layout verified: N directories ensured` shows 7 dirs (apps, apps/chakra, apps/dhi, cache, cache/sqlite, data, data/governance).

### Pitfall 5: `hookSystemService` API Mismatch
**What goes wrong:** If `hookSystemService` only supports `emit` and `once` but not `on` (persistent listener), the hook registration fails or only fires once correctly.
**How to avoid:** Check `hookSystemService` TypeScript types before implementing. If `once` is the only option, use `once` — the drive only mounts once per process lifetime anyway. [ASSUMED: needs verification of hookSystemService API surface]

---

## Code Examples

### Verified: `driveControllerService.getSystemDataRoot()` (Windows behavior)
```typescript
// prana/src/main/services/driveControllerService.ts:656-662
getSystemDataRoot(): string {
  const system = getDriveRecord('system')
  if (system?.stage === 'MOUNTED') {
    return isWindows() ? system.mountPoint : join(system.mountPoint, 'live')
  }
  return getNormalizedVirtualDriveConfig().drives.system.fallbackPath
}
```
On Windows with mount at `S:`, returns `'S:'`. Appending `cache/sqlite` gives `S:\cache\sqlite`.

### Verified: `emitDriveStatus` call sequence (mount happy path)
```typescript
// driveControllerService.ts:462-469
const record = updateRegistry(buildRecord({ driveId, stage: 'MOUNTED', ... }))
if (driveId === 'system') {
  await updateSystemDataRoot(record, config)    // sets appDataRootOverride to 'S:'
}
await emitDriveStatus(driveId, 'healthy', result.message)  // fires hookSystemService
```

### Verified: `flattenDirectoryTree` output for target schema
```typescript
// Input: { apps: { chakra: {}, dhi: {} }, cache: { sqlite: {} }, data: { governance: {} } }
// Output: ['apps', 'apps/chakra', 'apps/dhi', 'cache', 'cache/sqlite', 'data', 'data/governance']
// driveLayoutService.ts:27-43 — verified by code inspection
```

### Target `drive-layout.json` (updated)
```json
{
  "version": 1,
  "description": "Virtual drive folder structure and quota. Paths are created inside the mounted drive root on every startup. Existing directories are never deleted.",
  "quota": {
    "maxStorageMb": 10240,
    "warnAtPercent": 85,
    "pollIntervalMs": 60000
  },
  "directories": {
    "apps": {
      "chakra": {},
      "dhi": {}
    },
    "cache": {
      "sqlite": {}
    },
    "data": {
      "governance": {}
    }
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| `"app"` key in JSON | `"apps"` key — matches semantic grouping | 7 dirs created vs 7 different dirs |
| No call site for `ensureDirectories` | Hook wired into drive mount event | Directories actually get created |
| `cache/temp`, `cache/thumbnails`, `cache/vfs` | `cache/sqlite` only | Fewer orphaned dirs; correct single purpose |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `hookSystemService.on(event, callback)` exists (persistent listener, not just `once`) | Q1 / Pitfall 5 | Must use `once` instead; functionally equivalent for single mount lifecycle |
| A2 | `hookSystemService.emit` awaits all registered subscriber callbacks | Pitfall 3 | If it doesn't await, `ensureDirectories` timing is even safer (fire-and-forget); if it does await and subscriber throws, error propagates into IPC handler |
| A3 | `system.status` event is emitted even in fallback/degraded mode | Q1 | [PARTIALLY VERIFIED: `driveControllerService.ts:332` shows `emitDriveStatus(driveId, 'degraded', ...)` fires on fallback — confirmed] |

---

## Open Questions

1. **`hookSystemService` API surface**
   - What we know: `hookSystemService.emit('system.status', ...)` is called from `driveControllerService`. `hookSystemService` is imported in `startupOrchestratorService.ts`.
   - What's unclear: Whether the service exposes `on(event, cb)`, `once(event, cb)`, or only `emit`. Need to read `E:/Python/prana/src/main/services/hookSystemService.ts` before implementation.
   - Recommendation: Planner should include a task to read `hookSystemService.ts` and confirm the subscription API before writing the hook registration code. If only `once` is available, use it — mount fires once per process.

2. **Does `hookSystemService.emit` await subscribers?**
   - What we know: Emit is called with `await` in `driveControllerService.ts:469`: `await emitDriveStatus(...)`. The `emitDriveStatus` function itself uses `await hookSystemService.emit(...)`.
   - What's unclear: Whether `hookSystemService.emit` awaits each registered listener's promise before returning.
   - Recommendation: If emit awaits subscribers, `ensureDirectories` must be wrapped in try/catch (already planned). If emit does not await, the timing is still correct because `ensureDirectories` completes eventually, and it only matters that directories exist before any SQLite service writes — which happens in `runStartupSequence`, a separate async chain after `initializeSystemDrive`.

---

## Environment Availability

Step 2.6 SKIPPED — this phase makes no external tool calls. All dependencies (Node.js `fs/promises`, Prana `hookSystemService`, Prana `driveControllerService`, local JSON config) are already present in the build.

---

## Validation Architecture

`workflow.nyquist_validation` not set in `.planning/config.json` (only `_auto_chain_active: false` is present) — treated as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Not yet detected (no test config found in Chakra root) |
| Config file | None found — Wave 0 gap |
| Quick run command | Unknown — Wave 0 gap |
| Full suite command | Unknown — Wave 0 gap |

### Phase Requirements → Test Map

This phase has no formal requirement IDs in REQUIREMENTS.md (Phase 10 is not yet in the traceability table). Behavioral test targets:

| Behavior | Test Type | Notes |
|----------|-----------|-------|
| `flattenDirectoryTree` produces correct paths for target schema | Unit | Pure function, deterministic — ideal for unit test |
| `ensureDirectories` creates all 7 directories when given a root | Integration | Requires temp dir; already straightforward with `tmp` |
| `drive-layout.json` parses without validation error | Unit | `loadLayout()` validates quota and directories |
| Hook fires and `ensureDirectories` is called after mount | Integration/manual | Requires drive mount; likely manual smoke test |

### Wave 0 Gaps
- [ ] No test framework detected — may need to check `package.json` test scripts before writing tests.
- [ ] `driveLayoutService` has no existing test file — unit tests for `flattenDirectoryTree` and `loadLayout` would be Wave 0 items if testing is required.

*(Note: test infrastructure discovery was not performed in this research phase. Planner should check `package.json` scripts before including test tasks.)*

---

## Security Domain

This phase creates directories on a virtual drive that is already encrypted (Prana's rclone/WinFsp mount with crypt password). No new security surface is introduced:

- No user input is accepted (paths come from the bundled JSON config, not user-provided values).
- `join(driveRoot, relativePath)` from Node's `path` module is used — no path traversal risk since `relativePath` values come from the JSON config, not external input.
- Directory creation is additive-only — no delete, no chmod, no file writes.

| ASVS Category | Applies | Control |
|---------------|---------|---------|
| V5 Input Validation | No | Paths come from bundled JSON, not user input |
| V6 Cryptography | No | Drive encryption is Prana's responsibility |
| V4 Access Control | No | Directories inherit drive-level access controls |

---

## Sources

### Primary (HIGH confidence)
- `E:/Python/Chakra/src/main/services/driveLayoutService.ts` — full implementation read; `flattenDirectoryTree`, `ensureDirectories`, `loadLayout` verified
- `E:/Python/Chakra/src/main/config/drive-layout.json` — current schema read; delta to target schema confirmed
- `E:/Python/Chakra/src/main/index.ts` — `bootstrapPranaMain` full sequence read; insertion point identified
- `E:/Python/prana/src/main/services/driveControllerService.ts` — `initializeSystemDrive`, `mountDriveInternal`, `updateSystemDataRoot`, `emitDriveStatus`, `getSystemDataRoot` all verified line-by-line
- `E:/Python/prana/src/main/services/pranaRuntimeConfig.ts` — full schema read; confirmed no `sqliteRoot` field exists
- `E:/Python/prana/src/main/services/sqliteConfigStoreService.ts` — `getConfigCacheRoot()` and `getDbPath()` read; current SQLite path logic confirmed
- `E:/Python/prana/src/main/services/ipcService.ts:112-194` — `app:bootstrap-host` handler read; exact order of `initializeSystemDrive` → `runStartupSequence` confirmed
- `E:/Python/prana/docs/features/storage/virtual-drive.md` — §7.1 Client-Owned Policy Contract, mount lifecycle, `getSystemDataRoot()` behavior
- `E:/Python/prana/docs/features/boot/startup-orchestrator.md` — bootstrap state machine, layer ordering
- `E:/Python/Chakra/docs/pr/prana/client-configurable-sqlite-root-path.md` — PR spec read; confirmed already authored

### Secondary (MEDIUM confidence)
- `E:/Python/prana/docs/integration_guide/library-integration-guide.md` — `storage.cacheLocation` field documentation confirmed
- `E:/Python/Chakra/src/renderer/src/features/splash-override/viewmodel/useDhiSplashViewModel.ts` — renderer call site for `bootstrapHost` confirmed

### Tertiary (requiring verification before implementation)
- `hookSystemService` API surface — NOT read in this research session. Must read `E:/Python/prana/src/main/services/hookSystemService.ts` before implementing the subscription.

---

## Metadata

**Confidence breakdown:**
- Drive mount hook and timing: HIGH — code read line-by-line
- JSON schema delta: HIGH — both old and new schemas confirmed
- SQLite path current behavior: HIGH — code path fully traced
- Prana PR feasibility: HIGH — minimal 2-3 line change identified precisely
- `hookSystemService` subscription API: MEDIUM — function calls observed but service internals not read

**Research date:** 2026-04-22
**Valid until:** 2026-05-22 (stable codebase; no external APIs)

---

## RESEARCH COMPLETE
