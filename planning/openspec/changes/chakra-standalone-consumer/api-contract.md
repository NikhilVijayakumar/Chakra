# Interface and Data Contract: chakra-standalone-consumer

## Operations
The Electron main process supplies the host-configured app ID for authentication and app-scoped calls, discarding any renderer-supplied app identity. The CLI checks active app, active employee, direct AppEmployee grants, and team-based AppTeam and EmployeeTeam relationships. A valid direct or team grant is independently sufficient; if neither can be established and required membership data has never synchronized, fail closed. A later sync failure uses the last successfully cached permissions. The JSON envelope and secrets-on-stdin contract remain, but app-aware login requires CLI apiVersion 3. Chakra UI and CLI must be upgraded together; the UI rejects older API versions.

The host may supply a bundled CLI path; an existing saved selection takes precedence. Main verifies compatibility and health before using or persisting a new path. Failure returns the existing typed error and preserves a saved path.

## Data and trust boundaries
Chakra CLI owns sheet synchronization, cache, authentication and app-access decisions; the UI mediates an allowlisted IPC surface. The local OS user can run a CLI directly; UI gating alone is not a security boundary against that user. No per-sheet authorization is implied.

## Open questions
Previously synchronized membership data may be used after a failed refresh; never-synchronized data must fail closed.

Knowledge: [common boundary](../../../../knowledge/concepts/standalone-consumers.md), [CLI contract](../../../../backend/knowledge/concepts/cli-contract.md), [UI surface](../../../../frontend/knowledge/concepts/library-surface.md).
