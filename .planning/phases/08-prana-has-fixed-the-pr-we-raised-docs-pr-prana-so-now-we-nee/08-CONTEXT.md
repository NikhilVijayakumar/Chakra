# Phase 8: Prana Dependency + Drive Decoupling Integration - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Integrate the upstream Prana outcomes requested in `docs/pr/prana` into Chakra startup/runtime flow: enforce host dependency capability checks (Git, SSH, virtual drive binary), keep the dependency check service page-agnostic (not splash-coupled), and adopt client-owned virtual drive policy with app-managed lifecycle (mount on app start, eject on app stop).

</domain>

<decisions>
## Implementation Decisions

### Host Dependency Capability Contract
- **D-01:** Chakra must verify host dependency capabilities for SSH binary, Git binary, and virtual drive binary.
- **D-02:** Dependency checking must consume a shared reusable capability contract/service and must not be implemented as splash-only logic.
- **D-03:** Dependency check result must remain structured and dependency-specific (which dependency is missing and diagnostics), with caller-owned UI handling.

### Integration Surface and Flow Placement
- **D-04:** Dependency checks are general runtime capability checks and must be callable from startup and non-startup flows (for example diagnostics/settings), not only splash.
- **D-05:** Splash can consume dependency status, but splash must not own the dependency-check implementation.
- **D-06:** Existing SSH startup gating behavior from prior phases remains preserved while broadening capability checks to include Git and virtual drive binary.

### Virtual Drive Ownership and Lifecycle
- **D-07:** Virtual drive runtime mechanism remains reusable in Prana, but policy is owned by Chakra (content, folder structure, and encryption policy decisions).
- **D-08:** Drive lifecycle is mandatory: mount/open on app start and eject/unmount on app stop.
- **D-09:** Encryption must remain enforced, with unlock managed by app flow or provided key path per client policy.
- **D-10:** Do not re-couple virtual drive ownership to Vault/SQLite schema assumptions; Chakra controls drive policy.

### Compatibility and Scope Guardrails
- **D-11:** Do not reintroduce splash-coupled dependency architecture while implementing this phase.
- **D-12:** Keep current Chakra auth-first startup contract intact (post-login to `/apps`, splash SSH gate semantics) while adding capability coverage.

### the agent's Discretion
- Exact naming/location of Chakra adapter modules for dependency checks and drive policy.
- Exact error copy and presentation details, provided dependency-specific diagnostics remain available to callers.
- Internal sequencing details for mount/eject hooks as long as D-08 and D-12 remain true.

</decisions>

<specifics>
## Specific Ideas

- Reuse/align with the Prana PR proposals in `docs/pr/prana/splash-dependency-precheck-proposal.md` and `docs/pr/prana/drive-decoupling-client-owned-policy-proposal.md`.
- Treat dependency capability as a foundational runtime service used by multiple surfaces.
- Keep implementation independent from splash orchestration internals.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase and planning contract
- `.planning/ROADMAP.md` — Phase 8 description, dependency on phase 7, and planning slot.
- `.planning/PROJECT.md` — Chakra auth-first startup intent and cleanup baseline.
- `.planning/phases/07-now-this-work-do-a-clean-up-our-aprt-from-splash-auth-and-po/07-CONTEXT.md` — Prior locked startup/splash/auth decisions that must remain stable.
- `.planning/phases/07-now-this-work-do-a-clean-up-our-aprt-from-splash-auth-and-po/07-01-SUMMARY.md` — Startup/runtime/env cleanup baseline after Dharma removal.
- `.planning/phases/07-now-this-work-do-a-clean-up-our-aprt-from-splash-auth-and-po/07-02-SUMMARY.md` — Renderer route and splash handoff baseline.

### Prana PR intent docs (in-repo)
- `docs/pr/prana/splash-dependency-precheck-proposal.md` — Shared dependency capability requirements (SSH, Git, virtual drive binary), no splash coupling.
- `docs/pr/prana/drive-decoupling-client-owned-policy-proposal.md` — Client-owned drive policy and lifecycle requirements.

### Runtime integration anchors
- `src/main/services/startupSecurity.ts` — Current startup safety and SSH-focused gating behavior.
- `src/main/index.ts` — Main bootstrap, runtime config injection, and virtual drive enablement/lifecycle anchor.
- `src/renderer/src/features/splash-override/viewmodel/useDhiSplashViewModel.ts` — Current splash-stage behavior that must consume, not own, dependency checks.
- `src/preload/index.ts` — IPC exposure boundary for reusable runtime capability checks.
- `src/preload/index.d.ts` — Contract types for renderer-visible capability APIs.

### External upstream references (outside this workspace)
- `E:/Python/prana/docs/index.md` — Upstream Prana docs index.
- `E:/Python/prana/docs/features` — Upstream feature-level behavior docs.
- `E:/Python/prana/docs/pr` — Upstream PR artifacts for integration details.
- `E:/Python/prana/src` — Upstream implementation source for exact API shapes.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `verifyStartupSafety` in `src/main/services/startupSecurity.ts` already centralizes startup gating and can be extended to consume broader dependency capabilities.
- `bootstrapPranaMain` in `src/main/index.ts` is the central startup orchestration point for host checks and runtime lifecycle hooks.
- `useDhiSplashViewModel` in `src/renderer/src/features/splash-override/viewmodel/useDhiSplashViewModel.ts` already models staged checks and is a consumer location for generalized capability results.

### Established Patterns
- Startup follows fail-closed validation before broad runtime initialization.
- Splash remains a verification consumer and route gate; core capability checks should live outside view-model-specific orchestration.
- IPC preload contracts are the typed integration boundary for renderer access.

### Integration Points
- Main-process capability service -> preload contract -> splash/settings/diagnostics consumers.
- App lifecycle hooks in main process for drive mount on startup and eject on shutdown.
- Existing SSH verification path must coexist with generalized dependency capability checks without regressions.

</code_context>

<deferred>
## Deferred Ideas

- Auto-installing missing host dependencies is out of scope.
- New UX-heavy dependency management dashboard beyond minimal caller handling is deferred.
- Any Chakra-specific drive schema expansion beyond policy ownership needed for this phase is deferred.

</deferred>

---

*Phase: 08-prana-has-fixed-the-pr-we-raised-docs-pr-prana-so-now-we-nee*
*Context gathered: 2026-04-21*
