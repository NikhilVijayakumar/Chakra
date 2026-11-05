# Capability: quarantine


## ADDED Requirements

### Requirement: Recording
A quarantine entry SHALL hold the source content, record id, reason, details, the sheet data, the local data when relevant, a status and a creation time. A repeat of the same content, record id and reason while pending SHALL update the existing entry instead of adding one.

#### Scenario: Repeated problem
- **GIVEN** a pending `missing_required` entry for department `DEPT003`
- **WHEN** sync finds the same problem again
- **THEN** there is still one entry and its data and details are refreshed

### Requirement: List and count
`quarantine list` SHALL return entries with the requested status (default `pending`), newest first; `quarantine count` SHALL return the number of pending entries.

#### Scenario: Count
- **GIVEN** three pending and two resolved entries
- **WHEN** `quarantine count` runs
- **THEN** it returns 3

### Requirement: Resolution
The CLI SHALL provide `reject`, `accept-sheets`, `apply-local`, `fix` and `delete-record`. Each SHALL set the entry status (`rejected` or `resolved`) and SHALL fail with `not_found` for an unknown entry.

#### Scenario: Reject
- **WHEN** an entry is rejected
- **THEN** its status is `rejected` and the data is unchanged

#### Scenario: Accept the sheet version of a conflict
- **GIVEN** a `conflict` entry
- **WHEN** `accept-sheets` runs
- **THEN** the entry becomes `resolved` and local data is unchanged (the sheet version was already applied)

#### Scenario: Accept the sheet version of a validation problem
- **GIVEN** an `invalid_relation` entry
- **WHEN** `accept-sheets` runs
- **THEN** the sheet row is stored locally as clean and the entry is `resolved`

#### Scenario: Apply local version
- **GIVEN** a `conflict` entry with stored local data
- **WHEN** `apply-local` runs
- **THEN** the local data is restored, marked dirty with a new `sync`, and the entry is `resolved`

#### Scenario: Apply local on a non-conflict
- **WHEN** `apply-local` targets a `missing_required` entry
- **THEN** the CLI returns `invalid_request`

#### Scenario: Fix
- **GIVEN** a `missing_required` entry
- **WHEN** `fix` supplies a corrected record
- **THEN** the record is stored dirty with a new `sync` (generating an id if missing), and the entry is `resolved`

#### Scenario: Fix still invalid
- **WHEN** `fix` supplies a record that fails validation
- **THEN** the CLI returns `validation_failed` and the entry stays pending

### Requirement: Scan
`quarantine scan` SHALL validate the cached rows with the same rules as the pull, add entries for problems found and remove those rows from normal results, and return the number of new issues.

#### Scenario: Scan finds a problem
- **GIVEN** a cached employee whose designation was removed
- **WHEN** `quarantine scan` runs
- **THEN** an `invalid_relation` entry exists and the employee no longer appears in `content get`
