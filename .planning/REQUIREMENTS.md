# Requirements: Chakra

**Defined:** 2026-04-19
**Core Value:** Deliver a clean, predictable startup where authenticated users reach the Chakra workspace safely and quickly.

## v1 Requirements (Milestone v0.2)

### Authentication

- [ ] **AUTH-01**: User can authenticate with credentials before any workspace bootstrap starts.
- [ ] **AUTH-02**: User sees a clear login error state for invalid credentials without partial app initialization.
- [ ] **AUTH-03**: User session token is persisted in runtime state and gates navigation to protected routes.
- [ ] **AUTH-04**: User reaches dashboard/onboarding only after successful auth response from main process.

### Startup Cleanup

- [ ] **BOOT-01**: App startup removes obsolete DHI-specific bootstrap behavior that is not required by Chakra.
- [ ] **BOOT-02**: Main process startup path is split into pre-auth and post-auth stages with explicit sequencing.
- [ ] **BOOT-03**: Startup safety validation failures show actionable Chakra-branded error messaging and fail closed.

### Runtime Environment

- [ ] **ENV-01**: Login username and password can be loaded from env values for initial local bootstrap.
- [ ] **ENV-02**: Runtime env bridge uses Chakra-named configuration aliases while preserving compatibility where needed.
- [ ] **ENV-03**: Effective startup env values are normalized and available to post-auth runtime initialization.

### Cache and Runtime Paths

- [ ] **CACHE-01**: App cache path resolves to chakra-app/cache in local runtime setup.
- [ ] **CACHE-02**: Entire effective env snapshot is cached to chakra-app/cache for this milestone.
- [ ] **CACHE-03**: Cache initialization is deterministic across dev runs and does not crash when cache folders are missing.

### Startup and Post-Login Cleanup Pivot

- [ ] **CLEAN-01**: Successful login routes directly to a Chakra app listing/install placeholder and onboarding route flow is removed from default startup.
- [ ] **CLEAN-02**: Splash flow preserves SSH verification gating before entering post-login route.
- [ ] **CLEAN-03**: Effective startup env is cached fully, and runtime reads use SQLite-backed cache after bootstrap.
- [ ] **CLEAN-04**: Only Prana initialization required for runtime correctness remains in startup path.
- [ ] **CLEAN-05**: DHI-facing naming in startup/auth and touched package metadata is replaced with Chakra identity.
- [ ] **CLEAN-06**: Dharma dependency and runtime references are removed from the app.

### Prana Dependency Capability and Drive Policy Integration

- [ ] **P8-DEP-01**: Startup enforces reusable host dependency capability checks for SSH, Git, and virtual-drive binary.
- [ ] **P8-DEP-02**: Dependency capability implementation remains page-agnostic and is not owned by splash flow.
- [ ] **P8-DRV-01**: Virtual drive policy ownership is client-app controlled while runtime mount mechanics remain reusable.
- [ ] **P8-DRV-02**: Virtual drive mounts on app start and ejects on app stop with deterministic lifecycle handling.
- [ ] **P8-IPC-01**: Preload contract exposes typed dependency capability status for multiple renderer consumers.
- [ ] **P8-REG-01**: Existing phase-7 splash/auth/apps route contract remains intact after dependency integration.

## Future Requirements

### Security Hardening

- **SECU-01**: Env snapshot cache excludes sensitive secrets and uses allowlist-based persistence.
- **SECU-02**: Credentials move from env bootstrap into secure first-run enrollment flow.

### Platform Features

- **PLAT-01**: Restore only Chakra-relevant DHI-derived modules after compatibility audit.
- **PLAT-02**: Expand installer/uninstaller runtime features on top of stabilized auth-first startup.

## Out of Scope

| Feature | Reason |
|---------|--------|
| OAuth and external identity providers | Focus this milestone on stabilizing local auth and startup correctness first |
| Full security redesign of secret handling | Deferred to dedicated hardening milestone after baseline flow is stable |
| Rebuilding all inherited DHI features | Most inherited modules are intentionally deferred pending Chakra-first relevance review |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 3 | Pending |
| AUTH-02 | Phase 3 | Pending |
| AUTH-03 | Phase 3 | Pending |
| AUTH-04 | Phase 3 | Pending |
| BOOT-01 | Phase 4 | Pending |
| BOOT-02 | Phase 4 | Pending |
| BOOT-03 | Phase 4 | Pending |
| ENV-01 | Phase 5 | Pending |
| ENV-02 | Phase 5 | Pending |
| ENV-03 | Phase 5 | Pending |
| CACHE-01 | Phase 6 | Pending |
| CACHE-02 | Phase 6 | Pending |
| CACHE-03 | Phase 6 | Pending |
| CLEAN-01 | Phase 7 | Pending |
| CLEAN-02 | Phase 7 | Pending |
| CLEAN-03 | Phase 7 | Pending |
| CLEAN-04 | Phase 7 | Pending |
| CLEAN-05 | Phase 7 | Pending |
| CLEAN-06 | Phase 7 | Pending |
| P8-DEP-01 | Phase 8 | Pending |
| P8-DEP-02 | Phase 8 | Pending |
| P8-DRV-01 | Phase 8 | Pending |
| P8-DRV-02 | Phase 8 | Pending |
| P8-IPC-01 | Phase 8 | Pending |
| P8-REG-01 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0

---
*Requirements defined: 2026-04-19*
*Last updated: 2026-04-19 after milestone v0.2 definition*