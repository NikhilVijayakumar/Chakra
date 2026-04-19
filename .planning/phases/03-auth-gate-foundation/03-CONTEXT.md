# Phase 3: Auth Gate Foundation - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish a reliable authentication gate so protected Chakra routes and startup progression unlock only after successful login, and invalid credentials never trigger partial workspace bootstrap.

</domain>

<decisions>
## Implementation Decisions

### Session Lifecycle Contract
- **D-01:** Use in-memory session token and guarded route checks as the phase-3 source of truth.
- **D-02:** Authentication state must unlock navigation only after main-process login success response includes a valid session token.
- **D-03:** Restarting the app requires re-authentication in this milestone (no persistent auth token yet).

### Credential Source and Precedence
- **D-04:** Env values are used as bootstrap seed credentials; runtime/SQLite becomes the active source after first successful bootstrap/login initialization.
- **D-05:** Credential resolution must be deterministic and documented in startup/auth services to avoid DHI legacy ambiguity.

### Failure and Lockout Behavior
- **D-06:** Invalid credentials remain on login with generic auth-failed messaging (no partial protected startup).
- **D-07:** Lockout remains bounded and enforced at auth boundary before any post-login bootstrap steps.

### the agent's Discretion
- Exact lockout thresholds/messages for non-security-sensitive copy as long as generic failure behavior is preserved.
- Minor sequencing internals between renderer guards and main auth status checks, provided D-01 through D-07 remain true.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase and requirement contract
- `.planning/ROADMAP.md` — Phase 3 goal, requirements mapping, and success criteria.
- `.planning/REQUIREMENTS.md` — AUTH-01 through AUTH-04 acceptance scope.
- `.planning/PROJECT.md` — Milestone v0.2 priorities and startup cleanup context.

### Authentication behavior and UX expectations
- `docs/feature/authentication.md` — Current auth flow intent and known gaps.
- `src/renderer/src/localization/namespaces/auth.ts` — Current user-facing auth error/lockout text keys.

### Existing implementation anchors
- `src/renderer/src/features/auth-override/view/LoginContainerOverride.tsx` — Current login submit path and route transitions.
- `src/renderer/src/main.tsx` — Route guards and protected route structure.
- `src/main/index.ts` — Main bootstrap sequence that must remain gated.
- `src/main/services/startupSecurity.ts` — Startup safety/failure validation behavior.
- `src/preload/index.d.ts` — Auth IPC contract types used by renderer.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `LoginContainerOverride` (`src/renderer/src/features/auth-override/view/LoginContainerOverride.tsx`): Existing login flow wrapper with session token handling and post-login navigation.
- Prana guards in `src/renderer/src/main.tsx`: `PublicOnlyGuard`, `MainAppGuard`, `OnboardingGuard`, `ModuleRouteGuard` already provide route-gating integration points.
- `volatileSessionStore` usage in login and app bootstrap paths supports memory-first session strategy.

### Established Patterns
- Renderer route protection is already centralized in route guard wrappers rather than per-component checks.
- Main-process startup currently performs env validation before heavy runtime import; phase 3 must preserve fail-closed behavior while tightening auth gate boundaries.
- Preload typings define explicit auth IPC result shape (`AuthLoginResult`) that planner can treat as contract boundary.

### Integration Points
- Main auth IPC handlers in `src/main/services/dharmaIpcHandlers.ts` are the enforcement boundary for auth result semantics.
- Renderer login route and transitions in `src/renderer/src/main.tsx` + login override are where successful auth unlock should be reflected.
- Startup/bootstrap code in `src/main/index.ts` is where post-auth gating constraints must be honored for protected initialization.

</code_context>

<specifics>
## Specific Ideas

No additional visual/design specificity requested for phase 3 beyond strict auth gating and deterministic credential precedence.

</specifics>

<deferred>
## Deferred Ideas

- Post-login default destination should become a new app install screen. This is tracked as a future capability and not included in phase 3 auth-gate scope.

</deferred>

---

*Phase: 03-auth-gate-foundation*
*Context gathered: 2026-04-20*
