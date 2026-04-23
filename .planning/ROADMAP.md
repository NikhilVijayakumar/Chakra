# Roadmap — Milestone v0.2

## Metadata

- **Milestone:** v0.2
- **Started:** 2026-04-19
- **Completed:** —
- **Requirements:** 19
- **Phase count:** 5
- **Status:** In Progress

---

## Phase 3: Auth Gate Foundation

**Goal:** Establish a reliable auth gate so protected app startup only occurs after successful login.

**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04

**Success criteria:**
1. Login flow fails safely on invalid credentials without launching protected startup routines.
2. Successful login sets runtime session state used by protected navigation.
3. App route transition to dashboard/onboarding occurs only after successful auth.
4. Auth errors are visible and actionable in UI without hard crash.

---

## Phase 4: Electron Bootstrap Cleanup

**Goal:** Refactor Chakra main process startup to remove unnecessary DHI carryover and enforce explicit startup stages.

**Requirements:** BOOT-01, BOOT-02, BOOT-03

**Success criteria:**
1. Bootstrap logic is split into pre-auth safety and post-auth runtime initialization.
2. Startup safety failure path shows Chakra-appropriate blocked startup UX.
3. Obsolete DHI-only bootstrap branches are removed or isolated behind compatibility adapters.

---

## Phase 5: Env-Driven Runtime Inputs

**Goal:** Formalize env loading for auth defaults and runtime setup while keeping compatibility aliases explicit.

**Requirements:** ENV-01, ENV-02, ENV-03

**Success criteria:**
1. Username/password seed values can be loaded from env for local bootstrap.
2. Runtime env bridge documents and applies Chakra aliases deterministically.
3. Effective startup env object is normalized once and reused across bootstrap stages.

---

## Phase 6: Cache Path and Env Snapshot

**Goal:** Standardize cache behavior to Chakra naming and persist full startup env snapshot as temporary migration baseline.

**Requirements:** CACHE-01, CACHE-02, CACHE-03

**Success criteria:**
1. Runtime cache path resolves to chakra-app/cache across local runs.
2. Missing cache directories are auto-created without startup failure.
3. Effective env snapshot is written/read from cache for this milestone's baseline.

### Phase 7: now this work do a clean up our aprt from splash auth and postlogin screen remove all postlogin is our app listing and install page for now keep a place holder now in splash we need ssh verification  nad env to cache flow rest is not needed now prana initlization or something which is required by parano to work then donot remove that next app is not dhi it is chakra so update that  update in src package as well and dharma is not needed in this app you can remove from git and all refence to that can also removed

**Goal:** Deliver a Chakra-only post-login skeleton by removing onboarding/Dharma carryover while preserving splash SSH verification, env caching, and required Prana initialization.
**Requirements**: CLEAN-01, CLEAN-02, CLEAN-03, CLEAN-04, CLEAN-05, CLEAN-06
**Depends on:** Phase 6
**Plans:** 2/2 plans complete

Plans:
- [x] 07-01-PLAN.md — Core startup cleanup: DHI to Chakra naming, env/cache contract hardening, and Dharma removal in main/preload/package surfaces.
- [x] 07-02-PLAN.md — Renderer route cleanup: remove onboarding path, force post-login listing placeholder, and align regression coverage.

### Phase 8: prana has fixed the pr we raised docs/pr/prana so now we need to implement we need to check all dependency services are installed like git, ssh and virtual drive binary. check prana documentation for details E:/Python/prana/docs/index.md you can also check their implementation if you want E:/Python/prana/src feature documentation E:/Python/prana/docs/features and pr E:/Python/prana/docs/pr

**Goal:** Integrate Prana's reusable host dependency capability and client-owned drive policy so Chakra startup enforces host readiness (SSH/Git/virtual-drive) and deterministic drive lifecycle without splash coupling.
**Requirements**: P8-DEP-01, P8-DEP-02, P8-DRV-01, P8-DRV-02, P8-IPC-01, P8-REG-01
**Depends on:** Phase 7
**Plans:** 2/2 plans complete

Plans:
- [x] 08-01-PLAN.md — Main-process dependency capability enforcement and drive lifecycle orchestration.
- [x] 08-02-PLAN.md — Preload contract exposure and splash consumer refactor without architecture coupling.

### Phase 9: Improve startup dependency blocking UI with vertical status checks showing tick/cross states before moving to blocking state

**Goal:** Replace the immediate blocking error with a visual stepper showing dependency status (SSH, Git, virtual-drive) with tick/cross states BEFORE moving to blocking state. After all checks complete, if any failed, transition to blocking with full diagnostic detail and retry mechanism.
**Requirements**: TBD
**Depends on:** Phase 8
**Plans:** 2/2 plans

Plans:
- [x] 09-01-PLAN.md — Main-process: Extend verifyStartupSafety for progressive results + IPC + updated blocking window.
- [x] 09-02-PLAN.md — Renderer: Create DependencyStepper component + viewmodel + integrate into blocking flow.

### Phase 10: virtual drive directory layout defined by json config with apps cache and data sections supporting sub-objects prana integration or pr if needed

**Goal:** Wire the JSON-driven virtual-drive directory layout (apps/cache/data) into Chakra's startup so that after the system drive mounts, the folder tree described by drive-layout.json is materialised before any read/write operation; implement Prana SQLite configurable root path and drive security enforcement.
**Requirements**: D-01, D-03, D-04, D-07, D-08, D-09, D-10, D-11, D-12, D-13, D-14, D-15
**Depends on:** Phase 9
**Plans:** 2 plans

Plans:
- [x] 10-01-PLAN.md - Update drive-layout.json to apps/cache/data schema, register chakra:ensure-drive-layout IPC handler in main, expose ensureDriveLayout on the preload bridge, and invoke it from the splash viewmodel immediately after bootstrapHost resolves.
- [ ] 10-02-PLAN.md - Prana SQLite root config (sqliteRoot in PranaRuntimeConfig, getSqliteRoot helper, 4 store services migrated) + drive security (failClosed default true, weak-password warning) + Chakra wiring + PR docs updated to Implemented.

---

## Phase Summary

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 3 | Auth Gate Foundation | Auth must complete before protected startup | AUTH-01, AUTH-02, AUTH-03, AUTH-04 | 4 |
| 4 | Electron Bootstrap Cleanup | Remove legacy DHI-first startup coupling | BOOT-01, BOOT-02, BOOT-03 | 3 |
| 5 | Env-Driven Runtime Inputs | Normalize env-backed auth/runtime config | ENV-01, ENV-02, ENV-03 | 3 |
| 6 | Cache Path and Env Snapshot | Use chakra-app/cache and persist env snapshot baseline | CACHE-01, CACHE-02, CACHE-03 | 3 |
| 7 | now this work do a clean up our aprt from splash auth and postlogin screen remove all postlogin is our app listing and install page for now keep a place holder now in splash we need ssh verification  nad env to cache flow rest is not needed now prana initlization or something which is required by parano to work then donot remove that next app is not dhi it is chakra so update that  update in src package as well and dharma is not needed in this app you can remove from git and all refence to that can also removed | 2/2 | Complete    | 2026-04-19 |