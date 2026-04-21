---
phase: 08
slug: prana-has-fixed-the-pr-we-raised-docs-pr-prana-so-now-we-nee
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-21
---

# Phase 08 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest + TypeScript typecheck |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm run typecheck` |
| **Full suite command** | `npm run build && npm run test -- --runInBand` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck`
- **After every plan wave:** Run `npm run build && npm run test -- --runInBand`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | P8-DEP-01 | T-08-01 | Missing host deps block startup with diagnostics | unit/integration | `npm run test -- src/main/services/startupSecurity.test.ts` | ✅ | ⬜ pending |
| 08-02-01 | 02 | 1 | P8-DRV-01 | T-08-02 | Drive policy ownership remains client-managed without runtime coupling | unit/integration | `npm run test -- src/main/services/startupSecurity.test.ts` | ✅ | ⬜ pending |
| 08-03-01 | 03 | 2 | P8-IPC-01 | T-08-03 | Shared capability API surfaced via preload and consumed by splash without ownership coupling | unit | `npm run test -- src/renderer/src/features/splash-override/view/SplashContainerOverride.test.tsx` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| App start mounts drive and app stop ejects drive in packaged runtime | P8-DRV-02 | Lifecycle event timing and environment-specific mount semantics | Start app, verify mounted state, close app, verify ejected state |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
