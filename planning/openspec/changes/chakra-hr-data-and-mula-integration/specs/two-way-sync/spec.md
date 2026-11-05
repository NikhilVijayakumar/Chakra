# Capability: two-way-sync


## ADDED Requirements

### Requirement: Manual sync of all content
`sync run` SHALL, for each target content, first push local edits and then pull the sheet, and SHALL report per-content `rows`, `ok`, `pushed` and `message`. A content that fails SHALL keep its previous rows; other contents SHALL still sync. Pending password updates SHALL still be pushed as before.

#### Scenario: Partial failure
- **GIVEN** one content's sheet is unreachable
- **WHEN** `sync run` runs with target `all`
- **THEN** the other contents sync and the failure is reported with `ok:false`

#### Scenario: Failed push keeps edits
- **GIVEN** a dirty row and a failing sheet write
- **WHEN** `sync run` runs
- **THEN** the row stays dirty and the result reports the error


### Requirement: Push rules
For each content the CLI SHALL first delete from the sheet the rows that are deleted and dirty, then upsert the rows that are dirty and not deleted. A dirty row already present in the sheet SHALL be pushed only if its `sync` is zero or greater than the sheet row's `sync`. Dirty flags SHALL be cleared only for rows actually pushed.

#### Scenario: New row appended
- **GIVEN** a dirty row whose id is not in the sheet
- **WHEN** sync runs
- **THEN** it is appended with its `sync` value and is no longer dirty

#### Scenario: Newer local row updates the sheet
- **GIVEN** a dirty row with `sync` 200 and the sheet row has `sync` 100
- **WHEN** sync runs
- **THEN** the sheet row is overwritten and the local row is clean

#### Scenario: Older local row is not pushed
- **GIVEN** a dirty row with `sync` 100 and the sheet row has `sync` 200
- **WHEN** sync runs
- **THEN** the sheet row is not changed; the pull step applies the sheet row (see conflict handling)

#### Scenario: Deleted row removed from the sheet
- **GIVEN** a row that is deleted and dirty
- **WHEN** sync runs
- **THEN** the matching sheet row is removed and the local row is no longer dirty

### Requirement: Pull and merge rules
After pushing, the CLI SHALL read the sheet and, per row: insert it when absent locally; replace the local row when the sheet `sync` is greater than the local `sync` and the local row is not deleted-and-dirty; and leave it unchanged otherwise. A local row that is absent from the sheet and not dirty SHALL be soft-deleted without being marked dirty.

#### Scenario: Sheet is newer
- **GIVEN** a clean local row with `sync` 100 and the sheet row has `sync` 200
- **WHEN** sync runs
- **THEN** the local row takes the sheet values and `sync` 200

#### Scenario: Removed in the sheet
- **GIVEN** a clean local row that is not in the sheet
- **WHEN** sync runs
- **THEN** the local row is soft-deleted and not pending

#### Scenario: Local new row not in the sheet yet
- **GIVEN** a dirty local row absent from the sheet and a push failure
- **WHEN** sync runs
- **THEN** the row is kept and still dirty

#### Scenario: Both changed
- **GIVEN** a dirty local row and a newer sheet row
- **WHEN** sync runs
- **THEN** the sheet values replace the local row and a `conflict` quarantine entry holding both versions is recorded

### Requirement: Pull validation
While pulling, the CLI SHALL quarantine instead of loading a row that has no id (`missing_id`), lacks a required field (`missing_required`), references a missing related row (`invalid_relation`) or has a non-integer in an integer field (`type_mismatch`).

#### Scenario: Missing name
- **GIVEN** a department sheet row with an id and no name
- **WHEN** sync runs
- **THEN** it is not loaded and a `missing_required` quarantine entry exists

#### Scenario: Unknown department on employee
- **GIVEN** an employee row referencing a department that does not exist
- **WHEN** sync runs
- **THEN** it is not loaded and an `invalid_relation` entry exists

#### Scenario: Non-integer leave count
- **GIVEN** a leave row with count `abc`
- **WHEN** sync runs
- **THEN** it is not loaded and a `type_mismatch` entry exists

### Requirement: Cache deletion
Deleting the cache SHALL lose edits that have not been pushed; a later sync SHALL rebuild all other content.

#### Scenario: Cache deleted with pending edits
- **GIVEN** dirty rows and the cache file is deleted
- **WHEN** `sync run` runs
- **THEN** content is rebuilt from the sheet and the unpushed edits are gone
