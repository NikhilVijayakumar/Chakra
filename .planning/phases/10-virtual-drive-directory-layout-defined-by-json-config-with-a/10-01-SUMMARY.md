---
phase: 10-virtual-drive-directory-layout-defined-by-json-config-with-a
plan: "01"
subsystem: infra
tags: [electron, ipc, virtual-drive, prana, rclone]

requires:
  - phase: 08-prana-dependency-checks
    provides: driveControllerService.getSystemDataRoot() returns real mount point after bootstrapHost
  - phase: 09-startup-dependency-blocking-ui
    provides: splash viewmodel bootstrapHost call site wired and stable

provides:
  - drive-layout.json with apps/cache/data schema (apps/chakra, apps/dhi, cache/sqlite, data/governance)
  - driveLayoutService committed to git tracking
  - chakra:ensure-drive-layout IPC handler in main process
  - api.app.ensureDriveLayout() preload bridge + DhiApi type declaration
  - Splash viewmodel calls ensureDriveLayout() after bootstrapHost resolves (non-fatal)

affects: [any phase that reads/writes to virtual drive root, future sqlite path configuration]

tech-stack:
  added: []
  patterns:
    - additive-only directory creation via ensureDirectories (recursive mkdir, EEXIST swallowed)
    - inner try/catch in IPC handler — failures return {ok: false, error} never throw to renderer
    - dynamic import inside try/catch for IPC handler registration (existing Chakra pattern)

key-files:
  created:
    - src/main/config/drive-layout.json
    - src/main/services/driveLayoutService.ts
  modified:
    - src/main/index.ts
    - src/preload/index.ts
    - src/preload/index.d.ts
    - src/renderer/src/features/splash-override/viewmodel/useDhiSplashViewModel.ts

key-decisions:
  - "Renderer-invoked IPC (not hookSystemService) because hookSystemService has no subscription API"
  - "ensureDriveLayout call placed before currentIndex++ so drive layout is ready before SSH step"
  - "Non-fatal everywhere: main-process inner try/catch + renderer outer try/catch"

patterns-established:
  - "Phase 10 IPC pattern: renderer calls chakra: namespace after mount-dependent operations complete"
  - "Drive layout JSON is bundled at build time — runtime tampering of file on disk has no effect"

requirements-completed:
  - D-01
  - D-03
  - D-04
  - D-09
  - D-10

duration: 25min
completed: 2026-04-22
---

# Phase 10-01: Wire driveLayoutService into startup Summary

**drive-layout.json rewritten to apps/cache/data schema; chakra:ensure-drive-layout IPC wires driveLayoutService.ensureDirectories() into the startup sequence after bootstrapHost resolves**

## Performance

- **Duration:** 25 min
- **Started:** 2026-04-22T00:00:00Z
- **Completed:** 2026-04-22T00:25:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- drive-layout.json corrected: `app` (singular) → `apps`, cache sub-dirs reduced to `sqlite` only, matches D-04 target shape producing 7 paths: apps, apps/chakra, apps/dhi, cache, cache/sqlite, data, data/governance
- `chakra:ensure-drive-layout` IPC handler registered in `bootstrapPranaMain` between `registerDriveLifecycleHooks()` and the SQLite config seed block — dynamically imports `driveControllerService` and `driveLayoutService`, wraps `ensureDirectories` in inner try/catch (D-09 non-fatal)
- Preload bridge `api.app.ensureDriveLayout()` added to `src/preload/index.ts` and typed in `DhiApi.app` in `index.d.ts`; splash viewmodel invokes it once after `bootstrapHost` resolves and before `currentIndex++`, guarded by optional-chaining and outer try/catch

## Task Commits

1. **Task 1: Rewrite drive-layout.json to D-04 target schema** — `3cdc752` (feat)
2. **Task 2: Register chakra:ensure-drive-layout IPC handler** — `827d802` (feat)
3. **Task 3: Expose ensureDriveLayout in preload and invoke from splash** — `69f5db1` (feat)

## Files Created/Modified

- `src/main/config/drive-layout.json` — Corrected virtual drive directory schema (apps/cache/data)
- `src/main/services/driveLayoutService.ts` — Added to git tracking (service was pre-implemented)
- `src/main/index.ts` — New `chakra:ensure-drive-layout` IPC handler in bootstrapPranaMain
- `src/preload/index.ts` — `ensureDriveLayout` method added to api.app
- `src/preload/index.d.ts` — `ensureDriveLayout` signature added to DhiApi.app interface
- `src/renderer/src/features/splash-override/viewmodel/useDhiSplashViewModel.ts` — Non-fatal ensureDriveLayout() call after bootstrapHost

## Decisions Made

- Used renderer-invoked IPC (chakra: namespace) rather than hookSystemService because `hookSystemService.on/.once` do not exist on the Prana service
- Placed the ensureDriveLayout call outside the inner `catch` block but inside the `else` (Electron) branch — ensures it runs on both BLOCKED and non-BLOCKED bootstrapHost success paths
- Timing guarantee satisfied: `bootstrapHost` resolves only after Prana's `initializeSystemDrive()` runs `updateSystemDataRoot`, so `getSystemDataRoot()` returns the real mount point when the handler fires

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- Virtual drive directory layout is now materialized on every startup after mount
- `apps/chakra`, `apps/dhi`, `cache/sqlite`, `data/governance` will exist at drive root
- Future phases can safely read/write to these paths without mkdir guards
- SQLite path configuration (D-07/D-08) is a separate PR tracked in `docs/pr/prana/client-configurable-sqlite-root-path.md`

---
*Phase: 10-virtual-drive-directory-layout-defined-by-json-config-with-a*
*Completed: 2026-04-22*
