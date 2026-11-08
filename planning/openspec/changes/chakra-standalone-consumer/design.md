# Design: chakra-standalone-consumer

## Context
The CLI already uses an app ID to check app availability and caches AppEmployee, AppTeam and EmployeeTeam. Login currently checks credentials and employee status but does not consult these memberships. The renderer is untrusted relative to Electron main.

## Design
The host configures its existing app identity. Chakra UI supplies that identity through its allowlisted main-process bridge; renderer payloads cannot replace it. Chakra CLI verifies credentials, registered app status and direct or team-based membership before the UI gate admits a user. Chakra UI renders a reusable no-access screen directing unauthorized users to contact an administrator. Preserve host-controlled app identity, but require a coordinated UI and CLI upgrade to apiVersion 3 so older clients cannot silently skip app-aware login. Each valid direct or team grant is sufficient independently. If neither can be established and required data has never synchronized, fail closed; after a later sync failure, use the last successfully cached permissions.

The host can supply a bundled CLI default. Existing saved selections take precedence; verify a replacement before persisting it. Keep mutable cache and settings outside installation resources.

## Trust and limitations
Login gating is an application-level control. A local OS user who can invoke or reconfigure the CLI directly is outside the renderer boundary. Do not claim per-sheet authorization or a protected session for later CLI operations unless explicitly implemented and tested.

## Verification and migration
Use test-first CLI and UI coverage for direct grants, team grants, inactive membership, absent sync, disabled app, invalid credentials, identity spoofing and CLI configuration. Reproduce and fix Windows-specific fixture failures. Preserve existing configurations and report unverified live Sheets scenarios. Increment version, build the CLI and UI package, and verify a consumer.

## Open questions
Membership statuses must be active. Cached permissions remain usable after a failed refresh only if every required dataset previously synchronized successfully.

Knowledge: [common boundary](../../../../knowledge/concepts/standalone-consumers.md), [CLI contract](../../../../backend/knowledge/concepts/cli-contract.md), [UI surface](../../../../frontend/knowledge/concepts/library-surface.md).
