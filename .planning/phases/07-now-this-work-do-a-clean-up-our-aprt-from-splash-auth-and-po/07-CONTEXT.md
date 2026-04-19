# Phase 7: Startup and Post-Login Cleanup - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Reduce Chakra to a minimal auth-first startup and post-login flow: keep splash auth verification and env-to-cache behavior, remove onboarding and Dharma-driven surfaces, keep only required Prana initialization, and route successful login to a placeholder app listing/install screen.

</domain>

<decisions>
## Implementation Decisions

### Post-Login Navigation and Screen Scope
- **D-01:** On successful login, always navigate to a listing/install placeholder route.
- **D-02:** Remove onboarding flow for this phase (route, guard usage, and post-login dependency are out of scope now).
- **D-03:** Post-login surface is a placeholder app listing/install page only; remove non-essential post-login module entry points from default flow.

### Splash and Startup Behavior
- **D-04:** Splash must keep SSH verification behavior before allowing entry to post-login route.
- **D-05:** Splash/startup must keep env-to-cache flow active.
- **D-06:** Keep only the Prana initialization that is required for Prana to function; remove non-required carryover startup behavior.

### Runtime Data Source Contract
- **D-07:** Cache all effective env values in this phase.
- **D-08:** Runtime reads for app behavior should come from SQLite cache after bootstrap (login included where applicable in current architecture constraints).

### Branding and Naming Cleanup
- **D-09:** Rename/remove DHI-facing app identity references to Chakra in user-visible startup/auth surfaces and source labels.
- **D-10:** Update source/package naming where this phase touches startup/auth flow so Chakra is the active app identity.

### Dharma Removal
- **D-11:** Hard-remove Dharma dependency and Dharma references from this app (package dependency, aliases, preload API surface, main registration, and related call paths in this phase scope).

### the agent's Discretion
- Exact placeholder screen visual styling and copy details.
- Precise internal sequence for startup checks as long as D-04 through D-08 remain true.
- Technical migration order for safely removing Dharma references while keeping build/dev functional.

</decisions>

<specifics>
## Specific Ideas

- Post-login should not open onboarding or dashboard-first behavior now; it should land in app listing/install placeholder.
- Keep splash verification and cache behavior, but strip non-essential legacy app flow branches.
- Do not keep Dharma as compatibility baggage for this app.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase contract and milestone intent
- `.planning/ROADMAP.md` — Phase 7 scope anchor and dependency position after phase 6.
- `.planning/PROJECT.md` — Chakra-first startup objective and DHI-cleanup milestone intent.
- `.planning/REQUIREMENTS.md` — auth/startup/env/cache baseline requirements that phase 7 refines.

### Startup and auth implementation anchors
- `src/main/index.ts` — current bootstrap sequence, startup safety gate, DHI naming/logging, Dharma handler registration.
- `src/main/services/runtimeEnv.ts` — env normalization, DHI-prefixed bridges, dev runtime path behavior.
- `src/main/services/startupSecurity.ts` — startup safety checks and required config keys.
- `src/renderer/src/features/splash-override/view/SplashContainerOverride.tsx` — splash completion and session routing handoff.
- `src/renderer/src/features/auth-override/view/LoginContainerOverride.tsx` — login success/failure and post-login navigation target.
- `src/renderer/src/main.tsx` — route topology and current onboarding/protected route structure.

### API contracts and removal targets
- `src/preload/index.ts` — exposed renderer API including Dharma and startup/auth bridge points.
- `src/preload/index.d.ts` — typed preload contract including Dharma and auth/startup interfaces.
- `src/main/services/dharmaIpcHandlers.ts` — Dharma IPC registration surface to remove.
- `src/main/services/dharmaSyncService.ts` — Dharma-backed sync/service dependency path to remove.
- `package.json` — Dharma dependency and package-level identity metadata.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Splash auth gate container already routes to login vs authenticated route using volatile session checks.
- Login override already performs main-process auth and session-token write before route navigation.
- Startup safety service already isolates early startup validation and fail-closed behavior.

### Established Patterns
- Route guarding is centralized in renderer routing/guard wrappers.
- Main-process startup uses staged initialization with safety checks before broader runtime import.
- Preload is the typed contract boundary for renderer access and is the correct place to remove Dharma surface area.

### Integration Points
- `src/main/index.ts` and `src/renderer/src/main.tsx` are the primary routing/bootstrap control points for removing onboarding and setting listing-placeholder as post-login destination.
- `runtimeEnv.ts` + SQLite seed/init paths are the control points for env-cache and runtime source-of-truth behavior.
- `package.json`, preload contracts, and Dharma main services form the removal boundary for Dharma hard-deletion.

</code_context>

<deferred>
## Deferred Ideas

- None recorded in this phase discussion; scope remains focused on cleanup/minimal post-login placeholder and Dharma removal.

</deferred>

---

*Phase: 07-now-this-work-do-a-clean-up-our-aprt-from-splash-auth-and-po*
*Context gathered: 2026-04-20*
