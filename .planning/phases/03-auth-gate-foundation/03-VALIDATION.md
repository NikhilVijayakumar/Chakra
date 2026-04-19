---
phase: 3
slug: auth-gate-foundation
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-04-20
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for auth-gate foundation.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run src/main/services/runtimeEnv.test.ts src/main/services/startupSecurity.test.ts src/renderer/src/main.test.tsx` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30-60 seconds |

---

## Sampling Rate

- **After every task commit:** Run the quick run command above.
- **After every plan wave:** Run `npm test`.
- **Before `/gsd-verify-work`:** Full suite must be green.
- **Max feedback latency:** 60 seconds.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | AUTH-01 | T-03-01 / — | Login success writes in-memory session and unlocks guarded routes only after success | unit/integration | `npx vitest run src/renderer/src/main.test.tsx` | ✅ | ⬜ pending |
| 03-01-02 | 01 | 1 | AUTH-02 | T-03-02 / — | Invalid credentials stay on login and show generic error state | unit | `npx vitest run src/renderer/src/features/auth-override/view/LoginContainerOverride.tsx` | ❌ W0 | ⬜ pending |
| 03-02-01 | 01 | 1 | AUTH-03 | T-03-03 / — | Session state is memory-only and route guards respect volatile session | unit | `npx vitest run src/renderer/src/main.test.tsx` | ✅ | ⬜ pending |
| 03-02-02 | 01 | 1 | AUTH-04 | T-03-04 / — | Successful login navigates to the authenticated post-login route, not to an unauthenticated page | integration | `npx vitest run src/renderer/src/features/auth-override/view/LoginContainerOverride.tsx` | ❌ W0 | ⬜ pending |
| 03-03-01 | 02 | 2 | BOOT-01 | T-03-05 / — | Startup stays fail-closed when required config or SSH verification fails | unit | `npx vitest run src/main/services/startupSecurity.test.ts` | ✅ | ⬜ pending |
| 03-03-02 | 02 | 2 | BOOT-02 | T-03-06 / — | Pre-auth and post-auth startup stages remain separated in the route/startup contract | integration | `npx vitest run src/renderer/src/main.test.tsx` | ✅ | ⬜ pending |
| 03-03-03 | 02 | 2 | BOOT-03 | T-03-07 / — | Startup failure message remains actionable and Chakra-branded while failing closed | unit | `npx vitest run src/main/services/startupSecurity.test.ts` | ✅ | ⬜ pending |
| 03-04-01 | 03 | 3 | ENV-01 | T-03-08 / — | Env-seeded username/password inputs are normalized before auth logic consumes them | unit | `npx vitest run src/main/services/runtimeEnv.test.ts` | ✅ | ⬜ pending |
| 03-04-02 | 03 | 3 | ENV-02 | T-03-09 / — | Runtime env bridging preserves the explicit Chakra/DHI compatibility mapping | unit | `npx vitest run src/main/services/runtimeEnv.test.ts` | ✅ | ⬜ pending |
| 03-04-03 | 03 | 3 | ENV-03 | T-03-10 / — | Effective startup env values are deterministic across repeated checks | unit | `npx vitest run src/main/services/startupSecurity.test.ts` | ✅ | ⬜ pending |
| 03-05-01 | 04 | 4 | CACHE-01 | T-03-11 / — | Cache path resolution remains deterministic and writable in dev runtime setup | unit | `npx vitest run src/main/services/runtimeEnv.test.ts` | ✅ | ⬜ pending |
| 03-05-02 | 04 | 4 | CACHE-02 | T-03-12 / — | Startup env snapshot cache is written to the Chakra cache path baseline | integration | `npx vitest run src/main/services/runtimeEnv.test.ts` | ❌ W0 | ⬜ pending |
| 03-05-03 | 04 | 4 | CACHE-03 | T-03-13 / — | Missing cache folders do not crash startup | unit | `npx vitest run src/main/services/runtimeEnv.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ failed · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/renderer/src/features/auth-override/view/LoginContainerOverride.test.tsx` — auth-failure and success navigation regression coverage for AUTH-02 and AUTH-04.
- [ ] `src/main/services/startupSecurity.test.ts` — existing coverage extended for any new env-seeded credential precedence behavior.
- [ ] `src/main/services/runtimeEnv.test.ts` — existing coverage extended for any new cache-path baseline behavior.

*If none: Existing infrastructure covers most phase requirements, but the login override still needs direct regression coverage for auth-failure and post-login navigation.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| None expected | — | All phase behaviors are designed for automated verification. | — |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
