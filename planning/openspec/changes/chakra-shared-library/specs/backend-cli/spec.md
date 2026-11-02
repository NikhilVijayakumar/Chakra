# Capability: backend-cli

## ADDED Requirements

### Requirement: Uniform JSON contract
The CLI SHALL implement the operations in `api-contract.md`, reading JSON from stdin and writing one envelope to stdout with a non-zero exit code on failure.

#### Scenario: Version
- **WHEN** `meta version` runs
- **THEN** the envelope contains `version` and `apiVersion`

#### Scenario: Malformed request
- **WHEN** stdin is not valid JSON
- **THEN** the CLI returns `invalid_request` and exits non-zero

### Requirement: Sheets are the source, SQLite is a cache
The CLI SHALL treat Google Sheets as the source of content and SQLite as a cache that can be deleted and rebuilt, and SHALL own the SQLite file; no other component SHALL open it.

#### Scenario: Cache deleted
- **GIVEN** the cache file is deleted
- **WHEN** the next operation runs
- **THEN** the cache is recreated empty, `sync status` reports not synced, and content is available again after `sync run`

### Requirement: Manual sync of all content
The CLI SHALL sync every registered content from its sheet on `sync run` and report per-content results.

#### Scenario: Partial failure
- **GIVEN** one content's sheet is unreachable
- **WHEN** `sync run` runs with target `all`
- **THEN** the other contents are synced and the failure is reported for that content with `ok:false`

#### Scenario: Failed sync keeps previous cache
- **GIVEN** a content was synced earlier
- **WHEN** a later sync of it fails
- **THEN** the previously cached rows remain and the content is reported as not synced with the error

### Requirement: Sync status
The CLI SHALL report whether all content is synced, per-content state and the count of pending local updates, without contacting Google.

#### Scenario: Never synced
- **GIVEN** an empty cache
- **WHEN** `sync status` runs
- **THEN** `synced` is false and every content is listed as not synced

### Requirement: Pending local updates
The CLI SHALL write local updates (such as a password reset) to the cache, mark them pending, and push them to the sheet at the next sync; they SHALL NOT be recovered if the cache is deleted.

#### Scenario: Push failure
- **GIVEN** a pending update
- **WHEN** the push fails during sync
- **THEN** the update stays pending and `pendingLeft` is greater than zero

### Requirement: Doctor
The CLI SHALL report `sqlite`, `google_credentials`, `email` and `sheet_config` checks without exposing credential content.

#### Scenario: Missing credentials
- **GIVEN** no Google credentials are configured
- **WHEN** `meta doctor` runs
- **THEN** `google_credentials` is not ok with an actionable message

### Requirement: Build
`backend/` SHALL build a standalone executable of the CLI.

#### Scenario: Built binary
- **WHEN** the build command runs on a supported OS
- **THEN** the produced executable answers `meta version` without a Python install
