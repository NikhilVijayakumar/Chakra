---
phase: 07-now-this-work-do-a-clean-up-our-aprt-from-splash-auth-and-po
plan: 01
subsystem: infra
tags: [electron, preload, startup, env, chakra, prana]
requires:
  - phase: 06-cache-path-and-env-snapshot
    provides: env cache path baseline
provides:
  - Dharma runtime dependency removed from main startup path
  - Chakra-first startup labels and runtime env bridge
  - Startup safety and env/cache flow retained with compatibility fallbacks
affects: [startup, preload, runtime-env, renderer-typing]
tech-stack:
  added: []
  patterns:
    - Chakra-first env keys with DHI compatibility fallback
    - startup fail-closed behavior preserved during identity cleanup
key-files:
  created: []
  modified:
    - package.json
    - electron.vite.config.ts
    - src/main/index.ts
    - src/main/services/runtimeEnv.ts
    - src/main/services/startupSecurity.ts
    - src/preload/index.ts
    - src/preload/index.d.ts
key-decisions:
  - Keep renderer compatibility typings for legacy dharma callsites while removing Dharma runtime wiring from startup/preload execution.
  - Prefer Chakra-prefixed env keys with DHI fallback to avoid breaking existing local env files during cleanup.
patterns-established:
  - Use Chakra labels in startup logs and unsafe-startup UI while retaining runtime behavior.
requirements-completed: [CLEAN-02, CLEAN-03, CLEAN-04, CLEAN-05, CLEAN-06]
duration: 38 min
completed: 2026-04-20
---

# Phase 07 Plan 01 Summary

**Chakra-first startup now runs without Dharma service wiring while preserving safety gating and env-cache bootstrap compatibility.**

## Performance

- **Duration:** 38 min
- **Started:** 2026-04-20T19:05:00Z
- **Completed:** 2026-04-20T19:43:00Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Removed Dharma dependency and alias wiring from package/build/test/type surfaces.
- Deleted Dharma main services and removed Dharma registration from startup bootstrap.
- Shifted startup/user-facing naming to Chakra and introduced Chakra-first env bridging with DHI fallback.

## Task Commits

1. **Task 1: Remove Dharma dependency and runtime integration surfaces** - `8583813` (feat)
2. **Task 2: Normalize startup naming and preserve required startup safety/cache behavior** - `ba47601` (feat)

## Files Created/Modified
- `package.json` - Removed Dharma package dependency.
- `electron.vite.config.ts` - Removed Dharma alias/exclusion wiring.
- `vitest.config.ts` - Removed Dharma alias.
- `tsconfig.node.json` - Removed Dharma paths mapping.
- `tsconfig.web.json` - Removed Dharma paths mapping.
- `src/main/index.ts` - Removed Dharma startup registration and renamed startup labels to Chakra.
- `src/main/services/runtimeEnv.ts` - Added Chakra-first runtime env bridge and Chakra dev runtime path naming.
- `src/main/services/startupSecurity.ts` - Switched required startup key validation to Chakra names with DHI fallback.
- `src/preload/index.ts` - Removed Dharma runtime IPC API block.
- `src/preload/index.d.ts` - Removed Dharma contract surface and kept temporary compatibility typing for legacy renderer callsites.

## Decisions Made
- Kept compatibility typings in preload declarations to avoid breaking non-active renderer modules during this cleanup phase.
- Preserved DHI env fallback to keep current local configurations valid while moving startup identity to Chakra.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Renderer typecheck failures after preload Dharma contract removal**
- **Found during:** Task 1 verification
- **Issue:** Multiple renderer repositories still referenced `window.api.dharma` and failed compile.
- **Fix:** Added temporary compatibility typings in `src/preload/index.d.ts` while retaining runtime Dharma removal.
- **Verification:** `npm run typecheck` passed.
- **Committed in:** `8583813`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** No scope creep; fix was required to keep buildability while completing runtime cleanup.

## Issues Encountered
- Initial typecheck failed due legacy renderer references to removed Dharma preload contract; resolved with temporary compatibility typing.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Ready for plan 07-02 route cleanup (remove onboarding-first flow and move login success to listing placeholder).
- Existing legacy renderer modules still carry Dharma callsites but are no longer required for startup path.

---
*Phase: 07-now-this-work-do-a-clean-up-our-aprt-from-splash-auth-and-po*
*Completed: 2026-04-20*
