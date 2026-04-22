# Phase 10: Virtual Drive Directory Layout — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-22
**Phase:** 10 — virtual-drive-directory-layout-defined-by-json-config-with-a
**Areas discussed:** JSON leaf semantics, SQLite path delegation, Startup wiring, App folder depth

---

## JSON Leaf "Value" Semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Empty object `{}` = folder marker only | No metadata, just creates the directory | ✓ |
| Rich metadata object | Carry filename hints, purpose labels, etc. | |

**User's choice:** Empty object `{}` — high-level folder structure only. No file tracking in JSON. "Only high level folder structure is tracked."

**Notes:** Can be reorganized in future releases. On each app start, directories are ensured to match the JSON (additive-only, never deletes).

---

## SQLite Path Delegation to Prana

| Option | Description | Selected |
|--------|-------------|----------|
| Prana accepts path from client app | Prana stateless; Chakra provides `sqliteRoot` | ✓ |
| Keep Prana-internal path resolution | Prana decides where SQLite goes | |
| Chakra redirects independently | Chakra manages SQLite outside of Prana | |

**User's choice:** Prana should be stateless. Client app (Chakra) provides the SQLite root path. Prana PR required.

**Notes:** "Prana should be stateless — using app client like Chakra should provide where to save sqlite or state of where to save db data." Phase 10 implementation does not block on the Prana PR — the PR is filed and Chakra wires the path after Prana delivers.

---

## Startup Wiring

| Option | Description | Selected |
|--------|-------------|----------|
| In Chakra splash after dependency checks | After git/ssh/virtual drive checks, before db init | ✓ |
| In Prana startup orchestrator | Prana owns the call | |
| At app-ready event | Too early, before drive mounts | |

**User's choice:** In Chakra splash sequence, after initial dependency checks, before any read/write operations.

**Notes:** "This should happen in splash of Chakra or calling app, not in Prana. JSON data should be available with Chakra and read/write operations should happen after initial dependency checks."

---

## App Folder Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Top-level only: `apps/chakra`, `apps/dhi` | Logical grouping, no sub-structure | ✓ |
| Deeper nesting per app | `apps/chakra/config`, `apps/chakra/data`, etc. | |

**User's choice:** Only parent folders — `apps/chakra`, `apps/dhi`. No deeper structure at the layout level.

**Notes:** "Only the parent folder app/chakra, app/dhi — we should not care about logic inside those apps. We are only here to organize folders into logical groups in Chakra so high-level folder structure is ensured, not pinpointed to all files and metadata like monitoring."

---

## Claude's Discretion

- Where exactly in `bootstrapPranaMain` to inject the `ensureDirectories` call
- Error handling for `ensureDirectories` failures (warn vs. block startup)

## Deferred Ideas

- Sub-directory structure inside `apps/chakra` or `apps/dhi`
- Cleanup of orphaned directories (additive-only is intentional for now)
- Per-folder quota monitoring
