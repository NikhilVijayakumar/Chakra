# Chakra

## What This Is

An Electron desktop host built on Prana and Astra to run governance-driven application workflows.

## Core Value

Deliver a clean, predictable startup where authenticated users reach the Chakra workspace safely and quickly.

## Current Milestone: v0.2 [Auth-First Startup Cleanup]

**Goal:** Replace DHI-first bootstrap leftovers with Chakra auth-first startup so the app launches only after successful authentication, then initializes runtime using Chakra paths and cache strategy.

**Target features:**
- Authentication-first app startup and guarded post-login boot
- Electron main bootstrap cleanup to remove obsolete DHI assumptions
- Environment-backed credential loading for login defaults
- Chakra cache/runtime path standardization under chakra-app/cache
- Runtime env snapshot caching for initial milestone baseline

## Active Requirements

_Requirements for the current milestone:_

- See `.planning/REQUIREMENTS.md`

## Validated Requirements

- ✓ User can view full project overview in README.md — v0.1 / Phase 1
- ✓ User can view feature documentation in docs/feature/ — v0.1 / Phase 2
- ✓ Project has feature-specific documentation for core functionality — v0.1 / Phase 2

## Out of Scope

- OAuth / SSO integrations — deferred until local auth flow is stable
- Multi-account tenancy — deferred until single-user bootstrap hardening lands
- Product feature expansion copied from DHI modules — intentionally excluded until Chakra-first baseline is complete

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Authenticate before workspace bootstrap | Prevent partial initialization and stale runtime state before user validation | — Pending |
| Read initial login seed from env | Supports controlled local bootstrap without adding onboarding complexity in this milestone | — Pending |
| Standardize runtime cache path to chakra-app/cache | Removes DHI naming leakage and gives deterministic cache location for support/debugging | — Pending |
| Persist full env snapshot to cache for now | Speeds migration by preserving runtime context while stronger secret filtering is designed | ⚠️ Revisit |

## Context

- **Project type:** Electron + React desktop application with Prana runtime services and Astra UI foundations
- **Current baseline:** Several startup/auth flows still use DHI-prefixed config and legacy assumptions
- **Reference systems:** Prana docs and Astra docs used as architecture/source of truth for integration patterns
- **Target platform:** Windows-first development and local runtime execution

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

**Last updated:** 2026-04-19 after milestone v0.2 initialization