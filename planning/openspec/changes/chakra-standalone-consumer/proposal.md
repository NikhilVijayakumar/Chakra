# Change Proposal: chakra-standalone-consumer

## Problem and Motivation
Chakra provides a reusable CLI and Electron UI library. Mūla is a standalone consumer with a registered app ID. The App sheet controls registered apps; AppEmployee and AppTeam with EmployeeTeam describe a user's access to an app. Chakra login currently verifies employee credentials but does not enforce these memberships.

## Desired Outcome
Chakra shall allow an authenticated, active user to enter an enabled registered app only when the user has direct app access or belongs to a team granted access. Chakra UI provides a reusable no-access screen directing the user to contact an administrator. It shall provide a verified bundled CLI default and retain selection of an alternative.

## Scope and Constraints
Update Chakra CLI and UI authentication, access checks, CLI selection, tests, documentation, version and build. Preserve host-controlled app identity; require all consumers to upgrade UI and CLI together for the incompatible apiVersion 3 login contract; do not implement per-sheet access checks or an unrestricted standalone bypass. Keep renderer IPC allowlisted and credentials out of argv.

## Requirements Overview
| ID | Requirement |
|---|---|
| REQ-001 | Check user-to-app access from sheet-backed direct or team membership |
| REQ-002 | Deny unknown, disabled or unauthorized users and apps |
| REQ-003 | Preserve configured app identity and prevent renderer identity spoofing |
| REQ-004 | Support a verified bundled CLI and a user-selected alternative |
| REQ-005 | Verify Windows behavior and produce versioned builds |

## Risks and Open Questions
Determine precise active-status semantics and ensure stale or unavailable membership data does not silently grant access. Treat the CLI's local OS-user boundary honestly; app-level checks do not by themselves protect against direct local process invocation.

## Knowledge References
[Common boundary](../../../../knowledge/concepts/standalone-consumers.md), [CLI contract](../../../../backend/knowledge/concepts/cli-contract.md), [UI surface](../../../../frontend/knowledge/concepts/library-surface.md).

## Traceability
Change: `chakra-standalone-consumer`; branch: `feature/chakra-standalone-consumer`.
