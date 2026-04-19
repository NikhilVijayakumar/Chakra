# Phase 07 Research: Startup and Post-Login Cleanup

## Scope
Phase 7 converts Chakra into a minimal auth-first startup path with:
- splash SSH verification + env-to-cache flow retained,
- onboarding removed,
- post-login routed to listing/install placeholder,
- hard Dharma removal,
- Chakra naming replacing DHI naming in touched startup/auth/package surfaces.

## Codebase Findings

### Startup Core
- `src/main/index.ts` is the highest-leverage integration point.
- It currently still includes DHI naming (`[DHI]` logs, `DHI Startup Blocked` title), DHI env key usage, and Dharma IPC registration.
- Splash gating currently depends on startup safety plus renderer splash behavior, so removal work must preserve fail-closed startup semantics.

### Runtime Env and Cache
- `src/main/services/runtimeEnv.ts` currently bridges `MAIN_VITE_DHI_*` and `DHI_*` keys and sets writable dev paths under `dhi-app-dev-runtime`.
- `ensureWritableDevRuntimePaths()` is where cache/session path naming should pivot to Chakra.
- `src/main/services/startupSecurity.ts` validates required DHI-prefixed keys today; this must be normalized to Chakra-first compatibility without breaking Phase 5/6 behavior.

### Renderer Routing
- `src/renderer/src/main.tsx` currently imports onboarding container and uses onboarding route/guards.
- `src/renderer/src/features/auth-override/view/LoginContainerOverride.tsx` currently routes success to `/onboarding` (first install) or `/dashboard`.
- `src/renderer/src/features/splash-override/view/SplashContainerOverride.tsx` routes by volatile session and `getFirstEnabledMainRoute()`.

### Dharma Surface Area
- `package.json` includes `dharma` dependency.
- `src/preload/index.ts` and `src/preload/index.d.ts` expose a large `api.dharma` contract.
- `src/main/index.ts` dynamically registers `registerDharmaIpcHandlers()`.
- `src/main/services/dharmaIpcHandlers.ts` and `src/main/services/dharmaSyncService.ts` form main-process Dharma integration.
- Build aliases reference Dharma in `electron.vite.config.ts`, `tsconfig.node.json`, `tsconfig.web.json`, and `vitest.config.ts`.

## Constraints and Risks
- Hard Dharma removal is cross-cutting; leaving any dangling imports in preload typings, renderer consumers, or config aliases will break typecheck/dev.
- Removing onboarding route requires guard and redirect cleanup to avoid route dead ends.
- Startup naming cleanup must keep Prana-required initialization intact; over-pruning main bootstrap can break app host bootstrap.
- Existing dev runtime has prior `jsdom`/asset fragility in bundled main; route/config cleanup should avoid introducing additional bundling risks.

## Recommended Implementation Strategy
1. Remove Dharma from dependency + alias + main/preload surfaces in one wave to keep compilation coherent.
2. Pivot startup/auth naming to Chakra in touched files while preserving backward-compatible env bridge behavior where needed.
3. Replace post-login target with listing placeholder route and remove onboarding route path from main router.
4. Add/update focused tests for splash route gating and login success target to prevent regressions.

## Validation Architecture
- Primary automated checks should be fast and phase-specific:
  - `npm run typecheck`
  - targeted vitest for splash/login/main route contract
  - `npm run build`
- Verify route contract after onboarding removal:
  - login success lands on listing placeholder
  - splash without session lands on login
  - splash with session lands on listing placeholder/main route without onboarding dependency
- Verify no Dharma symbols remain in package/config/main/preload surfaces.

## Canonical References
- `.planning/phases/07-now-this-work-do-a-clean-up-our-aprt-from-splash-auth-and-po/07-CONTEXT.md`
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `src/main/index.ts`
- `src/main/services/runtimeEnv.ts`
- `src/main/services/startupSecurity.ts`
- `src/preload/index.ts`
- `src/preload/index.d.ts`
- `src/renderer/src/main.tsx`
- `src/renderer/src/features/splash-override/view/SplashContainerOverride.tsx`
- `src/renderer/src/features/auth-override/view/LoginContainerOverride.tsx`
- `src/main/services/dharmaIpcHandlers.ts`
- `src/main/services/dharmaSyncService.ts`
- `package.json`
- `docs/feature/listing.md`
- `docs/feature/installation.md`
