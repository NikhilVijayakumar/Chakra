---
phase: 07
slug: now-this-work-do-a-clean-up-our-aprt-from-splash-auth-and-po
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-04-20
---

# Phase 07 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest + TypeScript typecheck |
| **Config file** | `vitest.config.ts`, `tsconfig.node.json`, `tsconfig.web.json` |
| **Quick run command** | `npx vitest run src/renderer/src/features/auth-override/view/LoginContainerOverride.test.tsx src/renderer/src/features/splash-override/view/SplashContainerOverride.test.tsx src/renderer/src/main.test.tsx` |
| **Full suite command** | `npm run typecheck && npm run build && npm test` |
| **Estimated runtime** | ~180 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick route/auth regression slice.
- **After every plan wave:** Run `npm run typecheck && npm run build`.
- **Before `/gsd-verify-work`:** Full suite must be green.
- **Max feedback latency:** 180 seconds.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | CLEAN-05, CLEAN-06 | T-07-01 | Remove Dharma and DHI surfaces without exposing broken preload/main routes | integration | `npm run typecheck` | ✅ | ⬜ pending |
| 07-01-02 | 01 | 1 | CLEAN-02, CLEAN-03, CLEAN-04 | T-07-02 | Keep fail-closed startup + SSH/splash gate while normalizing cache/env path | integration | `npm run build` | ✅ | ⬜ pending |
| 07-02-01 | 02 | 2 | CLEAN-01 | T-07-03 | Successful login routes to listing placeholder; onboarding route removed | unit/integration | `npx vitest run src/renderer/src/features/auth-override/view/LoginContainerOverride.test.tsx src/renderer/src/main.test.tsx` | ✅ | ⬜ pending |
| 07-02-02 | 02 | 2 | CLEAN-02, CLEAN-03 | T-07-04 | Splash route contract preserves login/session branch behavior after cleanup | unit | `npx vitest run src/renderer/src/features/splash-override/view/SplashContainerOverride.test.tsx` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual confirmation that post-login lands on placeholder listing/install screen with Chakra labeling | CLEAN-01, CLEAN-05 | UX copy/visual intent not fully asserted in current automated tests | Run `npm run dev`, login with valid credentials, confirm placeholder screen appears and onboarding no longer appears in normal flow |

---

## Validation Sign-Off

- [x] All tasks have automated verification commands.
- [x] Sampling continuity established across both plans.
- [x] Wave 0 dependencies not required.
- [x] No watch-mode flags in validation commands.
- [ ] `nyquist_compliant: true` set in frontmatter after execution evidence is green.

**Approval:** pending
