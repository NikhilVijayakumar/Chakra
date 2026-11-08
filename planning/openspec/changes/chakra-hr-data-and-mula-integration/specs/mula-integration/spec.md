# Capability: mula-integration


## ADDED Requirements

### Requirement: Consume the library
Mula SHALL depend on the Chakra library through the packed npm tarball kept in `libs/`, use its registered app identity through Chakra, load the preload bridge, and render `ChakraGate` before its own screens. Chakra SHALL check the user's direct or team-based access to that app.

#### Scenario: Boot
- **GIVEN** the CLI is configured and healthy
- **WHEN** Mula starts
- **THEN** splash, CLI checks, sync check and login come from the library and Mula's shell appears after login

#### Scenario: CLI not configured
- **GIVEN** no CLI path is saved
- **WHEN** Mula starts
- **THEN** the library verifies and uses the bundled CLI, or shows CLI configuration if it is unavailable

### Requirement: Chakra only
Mula SHALL integrate Chakra only: splash, boot, CLI connection, authentication (login, forgot password, OTP, reset) and all data come from the Chakra library and the installed Chakra CLI. Mula SHALL bundle a compatible CLI and SHALL NOT implement its own splash, login, CLI connection or data access.

#### Scenario: Installed CLI
- **GIVEN** the Chakra CLI (version with `apiVersion` 2) is installed on the machine
- **WHEN** the user enters its path in the library CLI configuration screen
- **THEN** Mula verifies and saves it and needs no other setup

#### Scenario: Older CLI installed
- **GIVEN** the installed CLI reports `apiVersion` 1
- **WHEN** the path is verified
- **THEN** the library reports it incompatible and asks for an upgrade

#### Scenario: Startup checks
- **GIVEN** Mula starts
- **WHEN** the gate runs
- **THEN** splash, CLI and database health, sync status and login are the library's, and Mula has no boot screen or boot IPC of its own

### Requirement: Embed CLI settings
Mula SHALL show the library's CLI configuration in its own settings screen, so the CLI path can be entered and verified there, and SHALL NOT keep a separate copy of that setting. The component surface and boundaries are recorded in [Chakra UI library surface](../../../../../../frontend/knowledge/concepts/library-surface.md) and [Library and CLI split](../../../../../../knowledge/concepts/library-and-cli-split.md).

#### Scenario: Verify a new path
- **GIVEN** Mula is past login
- **WHEN** the user opens Configuration, enters a CLI path and saves it
- **THEN** the library saves and verifies it, and the remaining screens use it without a restart

### Requirement: Use Chakra for data
Every Mula module SHALL list, create, update and delete through library calls, and SHALL derive display names (department, designation, employee, team) from returned content.

#### Scenario: Employee list
- **WHEN** the employee module opens
- **THEN** employees are shown with department and designation names resolved from the departments and designations content

#### Scenario: Create offline
- **GIVEN** the sheet is unreachable
- **WHEN** a holiday is created
- **THEN** it appears in the list, `sync status` shows it pending, and it reaches the sheet at the next successful sync

### Requirement: Quarantine UI
Mula's quarantine screen SHALL use the library quarantine operations and show the same choices as today.

#### Scenario: Resolve conflict
- **GIVEN** a `conflict` entry
- **WHEN** the user chooses to keep the local version
- **THEN** `quarantine.applyLocal` runs and the entry disappears from the pending list

### Requirement: Remove duplicated stack
Mula SHALL NOT contain SQLite, drizzle, Google Sheets, Google credential or password hashing code or dependencies, and SHALL NOT register its own authentication, sync or CRUD IPC handlers.

#### Scenario: Dependency check
- **WHEN** Mula's `package.json` and `src/main` are inspected
- **THEN** none of `better-sqlite3`, `drizzle-orm`, `google-spreadsheet`, `google-auth-library`, `bcryptjs` or their imports are present

### Requirement: Mula has no database
Mula SHALL NOT own, open or create any database. All data is stored, synced and cached by Chakra; Mula SHALL obtain it only through library calls.

#### Scenario: No database in Mula
- **WHEN** Mula is installed fresh and run
- **THEN** it creates no SQLite or other database file of its own, and its code has no schema or migration

#### Scenario: Mula-specific state
- **WHEN** Mula needs non-HR state (such as window size)
- **THEN** it uses the platform settings facilities, not a database

### Requirement: Build and quality gates
Mula SHALL pass its `typecheck`, `lint` and `build` after the change.

#### Scenario: Gates
- **WHEN** the gates run
- **THEN** they pass or any pre-existing failure is recorded with its baseline
