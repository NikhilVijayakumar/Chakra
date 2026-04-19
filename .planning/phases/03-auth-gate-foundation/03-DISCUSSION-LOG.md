# Phase 3: Auth Gate Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves alternatives considered.

**Date:** 2026-04-20
**Phase:** 03-auth-gate-foundation
**Areas discussed:** Session lifecycle contract, Credential source and precedence, Failure and lockout behavior

---

## Session lifecycle contract

| Option | Description | Selected |
|--------|-------------|----------|
| In-memory session token + guarded route checks | Use volatile session as single source for this milestone; restart requires re-auth. | ✓ |
| Persisted session token on disk | Auto-login after restart, but higher security and invalidation complexity. | |
| Hybrid | Persist minimal session marker, revalidate on startup before route unlock. | |

**User's choice:** In-memory session token + guarded route checks
**Notes:** Chosen to keep phase 3 strict and predictable while auth gate is stabilized.

---

## Credential source and precedence

| Option | Description | Selected |
|--------|-------------|----------|
| Env seeds initial values; runtime/SQLite becomes active source after first successful bootstrap | Migration-safe path from DHI carryover while keeping deterministic startup. | ✓ |
| Env always authoritative | Simpler but requires restart/env change for credential updates. | |
| SQLite/runtime always authoritative | Ignore env credentials except one-time setup script. | |

**User's choice:** Env seeds initial values; runtime/SQLite becomes active source after first successful bootstrap
**Notes:** Supports requested env-based bootstrap while still transitioning to runtime-backed behavior.

---

## Failure and lockout behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Generic invalid-credentials message + bounded lockout + stay on login | Clear and safe default; no partial bootstrap. | ✓ |
| Detailed reason shown for each failure type | More transparent, but may leak validation details. | |
| Soft fail with limited read-only access | Not aligned with strict auth gate requirement. | |

**User's choice:** Generic invalid-credentials message + bounded lockout + stay on login
**Notes:** Fail closed; do not unlock protected routes or partial startup on auth failure.

---

## the agent's Discretion

- Specific lockout timing/tuning and copy details that do not alter the fail-closed auth model.

## Deferred Ideas

- Post-login landing should be a new app install screen (new capability; out of phase 3 scope).
