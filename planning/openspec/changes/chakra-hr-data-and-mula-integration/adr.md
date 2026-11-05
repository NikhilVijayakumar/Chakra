# Architecture Decision Record: chakra-hr-data-and-mula-integration

## 1. Decision Status
- **Status:** Proposed
- **Date:** 2026-11-05
- **OpenSpec Change ID:** `chakra-hr-data-and-mula-integration`
- **Decision owners:** Nikhil Vijayakumar
- **Related artifacts:** `proposal.md`, `design.md`, `specs/`, `api-contract.md`

## 2. Decision Checkpoint
- [x] **New decision required:** This change alters the cache rule and the compatibility model.

### Rationale
The existing decision ([CLI process per call](../../../../backend/knowledge/decisions/cli-process-per-call.md)) states that SQLite is a disposable cache with no state of record and treats apiVersion as strictly equal. Adding durable pending edits, two-way sync and a bumped contract changes both.

## 3. Context and Problem
Mula needs create/update/delete, push, conflict handling and quarantine on data that lives in Google Sheets. Chakra's CLI only reads and pushes password resets. We must decide the write model and how the contract version moves.

## 4. Decision Drivers
Reuse of Mula's proven rules; one generic implementation; no secrets outside the CLI; low operational complexity; safe partial failure; clear upgrade path.

## 5. Options Considered

### Option A: Dirty/deleted flags and `sync` stamps on cache rows (Mula's model), generic over the registry
- **Advantages:** one-to-one transfer of Mula's rules; supports create, update, delete and conflicts; one code path.
- **Disadvantages:** cache holds unpushed state; schema grows.
- **Risks:** losing unpushed edits if the cache is deleted.

### Option B: Extend `pending_updates` to all writes
- **Advantages:** reuses the existing table.
- **Disadvantages:** column-level only; cannot express creates, deletes or per-row stamps; conflict detection awkward.

### Option C: Write straight to the sheet, no local pending state
- **Advantages:** no durable cache state; simple.
- **Disadvantages:** no offline edits, each edit costs a network call (about 0.6 s per tab), diverges from Mula's local-first behavior.

### Option D: Keep Mula's TypeScript sync and use Chakra only for login
- **Advantages:** least change.
- **Disadvantages:** contradicts the goal of one owner for Sheets and SQLite.

## 6. Decision
**Chosen option:** A. Writable contents carry `sync`, `is_dirty`, `is_deleted`; edits stay in the cache until pushed; Mula's push, merge and quarantine rules are implemented once in the CLI over the registry. Password reset uses the same mechanism and `pending_updates` is removed. `apiVersion` becomes 2 and the library keeps requiring equality; library and CLI are released together (0.3.0).

## 7. Rationale
Option A is the only one that preserves Mula's behavior without per-module code. The disposable-cache rule is narrowed, not dropped: everything except unpushed edits is rebuildable. Bumping `apiVersion` is simpler and safer than capability negotiation for a single-consumer ecosystem.

## 8. Consequences
- **Positive:** Mula drops its SQLite/Sheets/auth stack; fixes happen once; future apps get writes for free.
- **Negative:** unpushed edits are lost with the cache; the CLI grows (about 5 modules); old 0.2.0 consumers must upgrade both parts.
- **Risks:** any enabled app may write (permission is per app, as the sheet defines it); id collisions across machines.
- **Follow-up:** amend `knowledge/concepts/library-and-cli-split.md` and the CLI contract concept; add write and quarantine concepts; accept this ADR into `backend/knowledge/decisions/`.

## 9. Implementation Guidance
Registry-driven, no per-content branches except employee password handling. Push before pull per content, parents before children. Dirty cleared only for rows confirmed pushed. Header-based column positions. Keep `Context` seams (sheets, mailer, clock) for tests.

## 10. Validation
Characterization tests of Mula's rules; contract tests; failure-injection tests; Mula e2e against the built CLI; one live read-write run on a scratch copy of the sheet.

## 11. Reversal
Reconsider if lost unpushed edits become a real problem (move pending edits to a separate durable file or write-through), or if call latency makes interactive writes slow (daemon behind the same client interface).

## 12. Traceability
`proposal.md`, `design.md`, `api-contract.md`, `specs/`.

## Decision Summary
- **Decision:** generic dirty/stamp write model in the CLI; apiVersion 2.
- **Primary reason:** reuse Mula's proven rules once, for every app.
- **Key trade-off:** cache holds unpushed state.
- **Review trigger:** lost edits, interactive write latency, or a second consumer needing different permissions.
