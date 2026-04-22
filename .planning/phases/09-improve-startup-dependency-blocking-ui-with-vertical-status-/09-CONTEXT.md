# Phase 9: Improve Startup Dependency Blocking UI - Context

**Gathered:** 2026-04-21
**Updated:** 2026-04-21 (fixing architectural mismatch)
**Status:** Ready for replanning

<domain>
## Phase Boundary

Replace the immediate blocking error UI with a visual stepper showing dependency status checks (SSH, Git, virtual-drive) with tick/cross states BEFORE moving to blocking state. After all checks complete, if any failed, transition to blocking with full diagnostic detail and retry mechanism.

</domain>

<decisions>
## Implementation Decisions

### CRITICAL: Architectural Fix Required
**Problem identified:** The main process runs `verifyStartupSafety()` and blocks startup BEFORE the IPC handler is available. This causes immediate blocking without showing the stepper UI.

**Root cause in src/main/index.ts:**
1. Lines 126-131: `verifyStartupSafety()` runs FIRST and can block with `showUnsafeStartupWindow(message)`
2. Lines 152-165: IPC handler `app:check-host-dependencies` is registered AFTER the blocking check
3. The unsafe window receives only a message string, not diagnostic data

**Fix required:** IPC handler must be registered BEFORE the safety check, OR diagnostics must be passed to the window via URL params or preload bridge.

### UI Timing
- **D-01:** Display dependency status UI BEFORE blocking - show each dependency check as it runs
- **D-02:** Use pre-splash (unsafe startup) window as the status display surface - not splash or main window

### Status Display
- **D-03:** Use vertical stepper layout showing all 3 dependencies: SSH, Git, virtual-drive
- **D-04:** Each dependency shows: pending (empty circle) → loading spinner → green checkmark (available) OR red cross (missing)
- **D-05:** Display diagnostic message for each failed dependency (what command was run, what error occurred)
- **D-06:** Keep visual consistency with existing splash stage stepper in `SplashViewOverride.tsx`

### Blocking Transition
- **D-07:** Run ALL dependency checks FIRST before transitioning to blocking state
- **D-08:** After all checks complete, if ANY failed: transition to full blocking UI
- **D-09:** Blocking UI must show full diagnostic detail: which dependencies failed and why
- **D-10:** Must provide retry mechanism - user can fix external dependencies, then restart check

### Retry Behavior
- **D-11:** On retry: re-run ALL dependency checks (full recheck for consistent state)
- **D-12:** After successful retry (all pass): proceed to normal startup flow

### Integration Points
- **D-13:** Extend existing `verifyStartupSafety` to expose structured diagnostic results to renderer
- **D-14:** Create new IPC method for staged dependency check with progress callbacks
- **D-15:** Reuse existing splash stepper styling from `SplashViewOverride.tsx`

### Additional Checks (from user issue)
- **D-16:** The startup flow has multiple dependency checks:
  1. SSH, Git, virtual-drive (in startupSecurity.ts)
  2. Virtual drive initialization (in Prana's driveControllerService)
- **D-17:** All checks should show in stepper UI, not just the first 3

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase and planning contract
- `.planning/ROADMAP.md` — Phase 9 description, depends on Phase 8.
- `.planning/PROJECT.md` — Chakra auth-first startup intent.
- `.planning/phases/08-prana-has-fixed-the-pr-we-raised-docs-pr-prana-so-now-we-nee/08-CONTEXT.md` — Prior dependency capability decisions (must remain stable).

### Implementation anchors
- `src/main/services/startupSecurity.ts` — Current `verifyStartupSafety` and `evaluateHostDependencies` that checks SSH, Git, virtual-drive.
- `src/main/index.ts` — Main bootstrap, `showUnsafeStartupWindow` call for blocking.
- `src/renderer/src/features/splash-override/view/SplashViewOverride.tsx` — Existing vertical stepper UI to reuse styling from.
- `src/renderer/src/features/splash-override/viewmodel/useDhiSplashViewModel.ts` — Existing stage state management pattern.

### Prana reference (external)
- `E:/Python/prana/docs/index.md` — Upstream Prana dependency capability docs.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `verifyStartupSafety` in `startupSecurity.ts` already runs dependency checks - needs refactoring to expose results progressively
- `evaluateHostDependencies` returns structured diagnostics with `diagnostics[]` array containing each dependency's status
- `showUnsafeStartupWindow` in `src/main/index.ts` is the blocking UI entry point
- `SplashViewOverride.tsx` has vertical stepper with icons (loading, success, error, skipped) - reuse styling

### Established Patterns
- Stage-based progress display with icons matching status
- IPC preload contracts for renderer communication
- Fail-closed security model

### Integration Points
- Main process dependency service → new staged IPC method → renderer stepper component
- Extend current blocking window to show stepper, not just error text

### Known Issues (from implementation)
- **Issue 1:** `verifyStartupSafety()` at line 126 blocks BEFORE IPC handler registration at line 152
- **Issue 2:** `showUnsafeStartupWindow()` only receives message string, not diagnostics array
- **Issue 3:** Initial state shows `pending` but immediately transitions to `loading` - too fast to see
- **Issue 4:** Multiple blocking checks exist: startupSecurity.ts AND driveControllerService.initializeSystemDrive()

 </code_context>

<specifics>
## Specific Ideas

- Reuse the exact icon components from SplashViewOverride (CheckCircleIcon, ErrorOutlineIcon, CircularProgress)
- Show command that was run and error output for each failed dependency
- Add "Retry" button in blocking UI that re-runs full dependency check

</specifics>

<deferred>
## Deferred Ideas

- Auto-installing missing dependencies - out of scope for this phase
- Background monitoring of dependencies after startup - deferred

</deferred>

---

*Phase: 09-improve-startup-dependency-blocking-ui-with-vertical-status-*
*Context gathered: 2026-04-21*