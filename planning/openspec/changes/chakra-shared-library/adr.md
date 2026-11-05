# Architecture Decision Record: chakra-shared-library

## 1. Decision Status
- **Status:** Accepted (recorded in `backend/knowledge/decisions/cli-process-per-call.md`)
- **OpenSpec Change ID:** `chakra-shared-library`

## 2. Decision Checkpoint
- [x] **New decision required**

Rationale: moves all data/auth logic across a process boundary and fixes the integration style for every future consumer app.

## 3. Context and Problem
Future apps share splash, auth, SQLite and Sheets. These need one owner and one way to be consumed.

## 4. Decision Drivers
Consumer simplicity; secrets isolation; testability; cross-OS distribution; reuse of existing Python tooling; low operational complexity.

## 5. Options Considered
### Option A: Python CLI, process per call, JSON stdio, path set in UI
Advantages: simple, testable by contract, no ports, secrets confined. Disadvantages: spawn latency; per-OS binaries.
### Option B: Long-lived local HTTP/stdio daemon
Advantages: low latency, push events. Disadvantages: lifecycle, ports, auth between processes, more failure modes.
### Option C: Keep logic in TypeScript, CLI only for storage
Advantages: less porting. Disadvantages: every app still carries auth/Sheets logic and secrets; contradicts goal.
### Option D: Bundle CLI inside the npm package
Advantages: zero config. Disadvantages: per-OS packaging in npm, size, contradicts "configure CLI from UI".

## 6. Decision
**Chosen option:** A. Backend owns all logic; library locates the CLI via a UI-configured path; contract in `api-contract.md` with `apiVersion` negotiation.

## 7. Rationale
Meets the goals with the least moving parts; daemon can be added behind the same `CliClient` interface if latency measures badly.

## 8. Consequences
Positive: apps are thin; one place for secrets/data. Negative: CLI must be built/distributed per OS; each call pays process start. Risks: hash-compat and behavior drift during porting (mitigated by characterization tests). Follow-up: record the decision in `backend/knowledge/decisions/` once accepted.

### Related decision: Sheets are the source, SQLite a disposable cache
Content comes from Google Sheets; SQLite only caches it, with no state of record. Local updates are pending until the next sync and are lost if the push fails permanently or the cache is deleted. Chosen over making SQLite authoritative because the sheets are already the operational source and the user accepts this loss. Reconsider if lost updates become a real problem.

## 9. Implementation Guidance
Electron never opens SQLite or Google APIs; `CliClient` is the only caller of the CLI; keep `apiVersion` strict (equal) until compatibility rules are specified.

## 10. Validation
Contract tests, reference consumer app, measured login latency.

## 11. Reversal
Reconsider if per-call latency makes login/sync unacceptable (move to daemon behind `CliClient`), or if CLI distribution proves unworkable (reconsider bundling).

## 12. Traceability
`proposal.md`, `design.md`, `api-contract.md`, `specs/`.

## Decision Summary
- **Decision:** Python CLI over JSON stdio owns all backend logic; library finds it by UI-configured path.
- **Primary reason:** keeps consumer apps free of data, credentials and Sheets code.
- **Key trade-off:** per-call spawn cost and per-OS builds.
- **Review trigger:** unacceptable latency or distribution problems.
