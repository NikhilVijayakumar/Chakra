# Architecture Decision Record: User-to-app access

## Status
Proposed, 2026-11-08. Change: `chakra-standalone-consumer`.

## Context
The App registry identifies apps; sheet-backed direct and team membership determines whether an authenticated user can use an app. Existing Chakra login checks credentials but not those memberships.

## Decision
Keep the host-controlled registered app ID and enforce user-to-app access inside Chakra. Accept an active direct grant or active team membership and active app-team grant. Fail closed when the data needed for the decision is unavailable. Do not introduce a standalone bypass or per-sheet permissions.

## Alternatives
An unrestricted standalone mode would ignore the owner's stated access rules. Having Mūla read App sheets would duplicate Chakra's backend ownership.

## Consequences
Chakra must reliably synchronize and interpret membership data; startup may deny access until this is available. Local OS users capable of invoking the CLI directly remain outside the UI gate's protection; stronger session enforcement requires separate design.

## Verification and Reconsideration
Test direct and team grants, inactive and missing memberships, disabled apps and spoofing. Reconsider if authorization must protect against direct local CLI invocation.

Knowledge: [standalone consumers](../../../../knowledge/concepts/standalone-consumers.md).
