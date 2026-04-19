# Phase 3: Auth Gate Foundation - Research

**Gathered:** 2026-04-20
**Status:** Ready for planning

<scope>
## What This Phase Must Solve

Make Chakra behave like an auth-gated desktop app: the user should not reach protected routes or post-login workspace behavior until login succeeds, and failed auth must fail closed without partially bootstrapping the app.

</scope>

<findings>
## Research Findings

### 1. Existing auth flow already exists, but it is split across renderer state and main/preload contracts
- `src/preload/index.ts` already exposes `auth.getStatus()`, `auth.login()`, `auth.forgotPassword()`, and `auth.resetPassword()`.
- `src/renderer/src/features/auth-override/view/LoginContainerOverride.tsx` already calls `window.api.auth.login(email, password)` and stores `sessionToken` in `volatileSessionStore`.
- `src/renderer/src/features/splash-override/view/SplashContainerOverride.tsx` already uses `volatileSessionStore.hasSession()` to decide whether to go to `/login` or the first main route.
- `src/renderer/src/main.tsx` already treats `/login` as a public route and `/dashboard` / `/onboarding` as guarded routes.

**Implication:** phase 3 is not inventing auth from scratch. The planner should tighten the existing contract, add deterministic checks, and reduce DHI-era ambiguity around when session state unlocks the workspace.

### 2. The source of truth for this phase should stay memory-first
- The current renderer path already uses `volatileSessionStore` as the session gate.
- Login success currently writes the token to volatile storage and uses route navigation rather than reloading the window.

**Recommendation:** keep the phase-3 source of truth in memory and route guards. Do not introduce persistent auth storage in this phase, because that would change invalidation semantics and widen the security surface before the auth gate is stable.

### 3. Credential precedence needs to be explicit because current startup code still carries DHI-prefixed bootstrap values
- `src/main/services/runtimeEnv.ts` loads `.env`, bridges `MAIN_VITE_*` values into runtime env keys, and defaults both `PRANA_*` and `DHI_*` sync settings.
- `src/main/services/startupSecurity.ts` still validates required startup values through `MAIN_VITE_DHI_*` env keys and placeholder detection.
- `docs/feature/authentication.md` states credentials are stored in SQLite cache and that local auth is required before virtual drive access.

**Recommendation:** planner should treat env-supplied login credentials as bootstrap seed values for this milestone, then let runtime/SQLite become the active source after first successful bootstrap. That matches the current mixed environment while avoiding an ambiguous “who wins” rule.

### 4. Startup safety is already fail-closed and should remain so
- `verifyStartupSafety()` blocks startup when required config is missing or SSH validation fails.
- `src/main/index.ts` explicitly stops startup and shows a blocked-startup window when `startupSafety.allowed` is false.

**Implication:** phase 3 should not weaken startup safety while auth is being cleaned up. Any auth-gate changes should preserve fail-closed behavior and keep startup errors actionable.

### 5. There is no Chakra-local auth handler implementation in the repo
- The local code references auth IPC through preload and renderer, but the actual handler implementation is not present in the Chakra source tree.
- The repository currently relies on Prana integration and imported runtime services for the broader auth/bootstrap surface.

**Implication:** the planner should treat the auth IPC boundary as an integration contract, not as a place to invent a brand-new auth subsystem in Chakra. If work is needed on handler semantics, it likely belongs in the integration layer already present in main/preload plumbing.

### 6. Existing tests give a good base for low-risk auth planning
- `src/main/services/runtimeEnv.test.ts` already covers env loading, bridging, and dev runtime paths.
- `src/main/services/startupSecurity.test.ts` already covers config validation and fail-closed startup behavior.
- `src/renderer/src/main.test.tsx` already codifies the route contract from splash to login to onboarding to dashboard.

**Implication:** phase 3 planning should bias toward extending these existing contracts and tests rather than introducing a parallel auth architecture.

</findings>

<recommendation>
## Recommended Planning Direction

Plan phase 3 around four concrete outcomes:
1. Make session state and guarded route checks the explicit auth gate.
2. Keep login failures generic and fail-closed, with bounded lockout behavior.
3. Document and codify env-seeded credential precedence so startup and login agree.
4. Preserve startup safety as a separate fail-closed boundary while auth is cleaned up.

The phase should not try to introduce persistent auth storage, OAuth, or a new post-login product screen. Those would be separate scope changes and are already outside the current phase boundary.

</recommendation>

<code_context>
## Code Context

### Reusable assets
- `volatileSessionStore` in the renderer: existing session gate and session token storage.
- `PublicOnlyGuard`, `MainAppGuard`, `OnboardingGuard`, `ModuleRouteGuard`: existing route protection wrappers.
- `LoginContainerOverride` and `SplashContainerOverride`: the current auth navigation decision points.
- `startupSecurity.test.ts` and `runtimeEnv.test.ts`: existing test scaffolds for startup and env normalization.

### Established patterns
- Session state is memory-first and route-guard driven.
- Startup validation is fail-closed and runs before protected app behavior.
- Env values are normalized and bridged through a single runtime layer.

### Integration points
- `src/preload/index.ts` and `src/preload/index.d.ts` define the auth IPC contract.
- `src/renderer/src/main.tsx` is the route topology for pre-auth and authenticated flows.
- `src/main/index.ts` is the main startup boundary that must stay gated.

</code_context>

<pitfalls>
## Pitfalls To Avoid

1. Don’t convert this phase into a bootstrap cleanup phase. The DHI prefix cleanup belongs to later roadmap work, not the auth-gate foundation itself.
2. Don’t add persistent auth storage just to make restart behavior look convenient. That changes invalidation/security semantics.
3. Don’t move auth failure handling into the renderer only. The main/preload contract and startup safety still matter.
4. Don’t let the planner invent a new app landing screen for this phase. The post-login install screen is a deferred idea, not phase-3 scope.

</pitfalls>

<validation>
## Validation Architecture

Phase 3 should be verified at three layers:

1. **Main/process safety:** startup remains fail-closed when required config or SSH validation fails.
2. **Auth contract:** login success yields a session token and invalid credentials keep the user on the login path.
3. **Route contract:** splash resolves to login when there is no volatile session and to the first authenticated route when a session exists.

Recommended test anchors:
- `src/main/services/startupSecurity.test.ts` for fail-closed startup validation.
- `src/main/services/runtimeEnv.test.ts` for env loading/credential precedence normalization.
- `src/renderer/src/main.test.tsx` for splash/login/onboarding/dashboard route behavior.
- New phase-specific tests around `LoginContainerOverride` or auth IPC contract if planner decides the login/session flow needs tighter regression coverage.

</validation>

<refs>
## Canonical References

- `.planning/PROJECT.md` — milestone goal, core value, and phase direction.
- `.planning/REQUIREMENTS.md` — AUTH/BOOT/ENV/CACHE requirements for milestone v0.2.
- `.planning/ROADMAP.md` — Phase 3 goal and success criteria.
- `.planning/phases/03-auth-gate-foundation/03-CONTEXT.md` — locked decisions from phase discussion.
- `docs/feature/authentication.md` — documented auth intent and known gaps.
- `src/preload/index.ts` — auth IPC surface.
- `src/preload/index.d.ts` — auth and startup contract types.
- `src/renderer/src/main.tsx` — splash/login/onboarding/dashboard route structure.
- `src/renderer/src/features/auth-override/view/LoginContainerOverride.tsx` — login flow and session token write path.
- `src/renderer/src/features/splash-override/view/SplashContainerOverride.tsx` — splash-to-login or splash-to-app routing logic.
- `src/main/index.ts` — main-process startup gate.
- `src/main/services/runtimeEnv.ts` — env normalization and runtime bridging.
- `src/main/services/startupSecurity.ts` — fail-closed startup validation.
- `src/main/services/runtimeEnv.test.ts` — env/runtime behavior tests.
- `src/main/services/startupSecurity.test.ts` — startup gate tests.
- `src/renderer/src/main.test.tsx` — route contract tests.

</refs>

---

*Phase: 03-auth-gate-foundation*
*Research gathered: 2026-04-20*