# Phase 9: Improve Startup Dependency Blocking UI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-21
**Phase:** 09-improve-startup-dependency-blocking-ui-with-vertical-status-
**Areas discussed:** UI Timing, Status Display, Block Transition, Retry

---

## UI Timing

| Option | Description | Selected |
|--------|-------------|----------|
| Show during checks | Display vertical stepper showing each dependency check as it runs (loading → tick/cross), then move to blocking only after all complete | ✓ |
| Show only after fail | Keep current behavior - block immediately, then show status when user acknowledges | |

**User's choice:** Show during checks
**Notes:** Wants to see progress before blocking

---

## Status Display

| Option | Description | Selected |
|--------|-------------|----------|
| Vertical stepper | Vertical list with icons: loading spinner → green checkmark (available) or red cross (missing). Shows all 3: SSH, Git, virtual-drive. | ✓ |
| Compact summary | Single line showing pass/fail count like '2/3 dependencies available' | |
| Expandable details | Minimal summary with tap to expand diagnostic details | |

**User's choice:** Vertical stepper
**Notes:** Reuse existing splash stepper icons and styling

---

## Block Transition

| Option | Description | Selected |
|--------|-------------|----------|
| All checks complete | Run all checks first. If any fail, show blocking only after ALL are done (shows full status with tick/cross for each) | ✓ |
| Fail fast | Block immediately on first failure, don't run remaining checks | |

**User's choice:** All checks complete - show proper detail of all failure and provide retry mechanism
**Notes:** User wants "run all checks and if failure is there then goto blocking state should proper detail of all failure and should provide retry mechnaism as the external dependices are fixied then user can restart check and move on to app functionality"

---

## Retry

| Option | Description | Selected |
|--------|-------------|----------|
| Full recheck | Re-run all dependency checks fresh - consistent state verification | ✓ |
| Only failed | Only re-check failed items to save time | |

**User's choice:** Full recheck
**Notes:** Consistent state verification

---

*Decision captured in 09-CONTEXT.md*