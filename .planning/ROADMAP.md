# Roadmap — Milestone v0.2

## Metadata

- **Milestone:** v0.2
- **Started:** 2026-04-19
- **Completed:** —
- **Requirements:** 13
- **Phase count:** 4
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

---

## Phase Summary

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 3 | Auth Gate Foundation | Auth must complete before protected startup | AUTH-01, AUTH-02, AUTH-03, AUTH-04 | 4 |
| 4 | Electron Bootstrap Cleanup | Remove legacy DHI-first startup coupling | BOOT-01, BOOT-02, BOOT-03 | 3 |
| 5 | Env-Driven Runtime Inputs | Normalize env-backed auth/runtime config | ENV-01, ENV-02, ENV-03 | 3 |
| 6 | Cache Path and Env Snapshot | Use chakra-app/cache and persist env snapshot baseline | CACHE-01, CACHE-02, CACHE-03 | 3 |