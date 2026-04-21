---
phase: 08-prana-has-fixed-the-pr-we-raised-docs-pr-prana-so-now-we-nee
plan: 02
subsystem: ui
tags: [preload, splash, ipc, routing, startup]
requires:
  - phase: 08-01
    provides: startup dependency gate and drive lifecycle baseline
provides:
  - Typed preload contract for host dependency status
  - Splash now consumes shared dependency status before SSH stage progression
  - Route contract remains stable for /login and /apps paths
affects: [preload-contract, splash-flow, startup]
tech-stack:
  added: []
  patterns:
    - Renderer consumes dependency capability status via preload app contract
    - Splash remains consumer-only and does not perform host dependency probing
key-files:
  created: []
  modified:
    - src/preload/index.ts
    - src/preload/index.d.ts
    - src/renderer/src/features/splash-override/viewmodel/useDhiSplashViewModel.ts
key-decisions:
  - Exposed host dependency status via existing `app:get-startup-status` data to avoid adding new main-process IPC routes in this phase.
  - Kept splash route tests unchanged because behavior contract remained identical.
patterns-established:
  - Capability contract methods should be page-agnostic and typed in preload declarations.
  - Splash checks dependency status from shared main-process contract before SSH verification.
requirements-completed: [P8-IPC-01, P8-REG-01]
duration: 27 min
completed: 2026-04-21
---

# Phase 08 Plan 02 Summary

**Preload now exposes a shared host dependency status contract, and splash consumes it without taking ownership of dependency detection logic.**

## Performance

- **Duration:** 27 min
- **Started:** 2026-04-21T00:44:00Z
- **Completed:** 2026-04-21T01:11:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Added `app.getHostDependencyStatus()` preload API with typed contract.
- Refactored splash view-model to consume dependency readiness from shared contract before SSH checks.
- Verified route contract stability with targeted tests and full build/typecheck pass.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add preload API contract for shared dependency capability status** - `dbd31a4` (feat)
2. **Task 2: Refactor splash view-model to consume shared dependency results** - `9ea3a5e` (feat)

## Files Created/Modified
- `src/preload/index.ts` - Added `getHostDependencyStatus` runtime API based on startup status stages.
- `src/preload/index.d.ts` - Added typed `HostDependencyStatusSnapshot` and app method declaration.
- `src/renderer/src/features/splash-override/viewmodel/useDhiSplashViewModel.ts` - Added shared dependency status consumption before SSH auth check.

## Decisions Made
- Used existing startup-status IPC payload for dependency stage status to keep solution page-agnostic and low-risk.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Both phase 8 plans are implemented and verified.
- Ready for phase-level verification and completion updates.

---
*Phase: 08-prana-has-fixed-the-pr-we-raised-docs-pr-prana-so-now-we-nee*
*Completed: 2026-04-21*
