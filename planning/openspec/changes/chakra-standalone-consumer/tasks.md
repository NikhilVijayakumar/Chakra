# Implementation Tasks: chakra-standalone-consumer

- **OpenSpec Change ID:** `chakra-standalone-consumer`
- **Status:** In Progress

## 1. Reconcile and verify contracts
- [ ] 1.1 Reconcile existing Chakra and Mūla changes with user-to-app authorization; validate revised artifacts.
- [ ] 1.2 Confirm sheet status semantics and fail-closed synchronization checks for direct and team membership; document the contract.
- [x] 1.3 Diagnose and fix Windows frontend and backend baseline test failures; record evidence.

## 2. User-to-app authorization
- [x] 2.1 Write failing tests and implement active direct app grants and denials in Chakra CLI.
- [x] 2.2 Write failing tests and implement active team-based app grants and denials in Chakra CLI.
- [x] 2.3 Test missing or unsynchronized data, inactive app/user/membership and preserve existing scoped clients.
- [ ] 2.4 Pass host app identity to login through restricted IPC; test spoofing and authentication failure UI.

## 3. CLI selection and build
- [x] 3.1 Test and implement a verified bundled CLI default and user-selected alternative; preserve saved settings on failure.
- [ ] 3.2 Increment UI and CLI versions and document authorization and compatibility; validate knowledge.
- [ ] 3.3 Run backend and frontend suites, typecheck, lint and builds; record actual results.
- [ ] 3.4 Build Windows CLI and UI package; smoke-test and verify consumer integration.
- [ ] 3.5 Review security and acceptance coverage, validate OpenSpec and record evidence.

## Verification Record
| Check | Result | Notes |
|---|---|---|
| Backend two-way sync tests | Passed | Windows: 13 passed after closing test SQLite connection |
| User-to-app authorization | Passed | 12 direct, team, inactive, missing and cached-permission tests |
| Frontend and Windows package | Partial | 39 UI tests passed before final test-only change; 0.4.0 CLI, installer and tarball built; consumer install not verified |
