# Capability: backend-cli


## ADDED Requirements

### Requirement: Sheets are the source, SQLite is a cache
Google Sheets SHALL remain the source of content. SQLite SHALL be a cache that can be deleted and rebuilt, except that edits not yet pushed exist only in it and are lost if it is deleted. The CLI SHALL own the SQLite file; no other component SHALL open it.

#### Scenario: Cache deleted
- **GIVEN** the cache file is deleted
- **WHEN** the next operation runs
- **THEN** the cache is recreated empty, `sync status` reports not synced, and content is available again after `sync run`

### Requirement: Uniform JSON contract
The CLI SHALL implement the operations in `api-contract.md` and SHALL report `apiVersion` 2.

#### Scenario: Version
- **WHEN** `meta version` runs
- **THEN** the envelope contains `version` and `apiVersion` 2


### Requirement: New error codes
The CLI SHALL use `validation_failed`, `not_found`, `content_read_only` and `quarantine_unknown` as defined in `api-contract.md`, and SHALL NOT include passwords, hashes or credentials in any message.

#### Scenario: Validation error content
- **WHEN** `content create` fails validation
- **THEN** the error message names the field and does not echo a submitted password

### Requirement: Status includes pending edits
`sync status` SHALL include the number of dirty rows and the number of pending quarantine entries.

#### Scenario: Pending counts
- **GIVEN** two dirty rows and one pending quarantine entry
- **WHEN** `sync status` runs
- **THEN** `pending` is at least 2 and `quarantined` is 1
