# Capability: content-write


## ADDED Requirements

### Requirement: Writable contents
The registry SHALL mark which contents are writable and, for each, the id prefix, required fields, relations and the sheet `sync` column. The writable contents SHALL be employees, departments, designations, teams, employee_teams, attendance_keys, holidays, leaves and config.

#### Scenario: Read-only content
- **GIVEN** `apps` is not marked writable
- **WHEN** `content create` targets `apps`
- **THEN** the CLI returns `content_read_only` and changes nothing

### Requirement: Create
`content create` SHALL insert a row marked dirty with `sync` set to the current epoch seconds, generate an id when none is given, and return the stored row.

#### Scenario: Generated id
- **GIVEN** departments contain `DEPT001` and `DEPT007`
- **WHEN** a department is created without an id
- **THEN** its id is `DEPT008`

#### Scenario: Required field missing
- **WHEN** a department is created without a name
- **THEN** the CLI returns `validation_failed` naming the field and stores nothing

#### Scenario: Invalid relation
- **GIVEN** no department `DEPT999` exists
- **WHEN** an employee is created with `department_id` `DEPT999`
- **THEN** the CLI returns `validation_failed` and stores nothing

#### Scenario: Duplicate id
- **WHEN** a row is created with an id that already exists and is not deleted
- **THEN** the CLI returns `validation_failed` and stores nothing

#### Scenario: Employee default password
- **WHEN** an employee is created without a password
- **THEN** the stored password hash is a bcrypt hash of the default initial password and the response contains no password or hash

#### Scenario: Employee supplied password
- **WHEN** an employee is created with a password
- **THEN** it is stored as a bcrypt hash and never returned

### Requirement: Update
`content update` SHALL change the given fields of an existing, non-deleted row, mark it dirty and set `sync` to the current epoch seconds.

#### Scenario: Update
- **WHEN** a department name is updated
- **THEN** the row has the new name, is dirty, and `content get` returns it

#### Scenario: Unknown row
- **WHEN** the id does not exist
- **THEN** the CLI returns `not_found`

#### Scenario: Password change
- **WHEN** an employee update supplies a password
- **THEN** it is stored as a bcrypt hash and never returned

### Requirement: Delete
`content delete` SHALL soft-delete the row, mark it dirty and set `sync`; deleted rows SHALL NOT appear in `content get`.

#### Scenario: Delete
- **WHEN** a holiday is deleted
- **THEN** `content get` no longer returns it and `sync status` counts it as pending

### Requirement: Durable until pushed
Dirty and deleted rows SHALL survive process restarts until a push succeeds for them.

#### Scenario: Restart
- **GIVEN** a dirty row
- **WHEN** the CLI process ends and runs again
- **THEN** the row is still dirty and returned by `content get`
