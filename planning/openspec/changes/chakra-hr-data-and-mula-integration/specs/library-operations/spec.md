# Capability: library-operations


## ADDED Requirements

### Requirement: Operation whitelist
The main process SHALL accept only the operations listed in the library contract, now including `content.create`, `content.update`, `content.delete` and `quarantine.*`, and SHALL map each to a fixed CLI command; any other operation SHALL be rejected with `invalid_request`.

#### Scenario: Unknown operation
- **WHEN** the renderer calls an operation outside the whitelist
- **THEN** it receives `invalid_request` and no process starts

#### Scenario: Write operation mapped
- **WHEN** the renderer calls `content.create`
- **THEN** the CLI runs `content create` with the payload on stdin and the main-process `appId`

### Requirement: Long operations
`sync.run` and `quarantine.scan` SHALL use the long timeout; other operations SHALL use the normal timeout.

#### Scenario: Scan timeout
- **WHEN** a scan takes longer than the normal timeout but less than the long one
- **THEN** it completes successfully

### Requirement: Renderer helpers
The library SHALL export typed helpers for the new operations through `chakraCall` and hooks for listing content, mutating content and the quarantine list and count, returning the sanitized envelope only.

#### Scenario: Error mapping
- **WHEN** the CLI returns `app_not_enabled`
- **THEN** the helper surfaces a mapped message and never the raw CLI text

### Requirement: Version compatibility
The library SHALL require CLI `apiVersion` 2 and report `cli_incompatible` for any other value.

#### Scenario: Old CLI
- **GIVEN** a CLI reporting `apiVersion` 1
- **WHEN** the CLI path is verified
- **THEN** the screen reports the incompatibility and does not mark the CLI verified
