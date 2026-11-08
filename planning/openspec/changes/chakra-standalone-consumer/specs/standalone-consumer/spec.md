# User app access and CLI configuration

## Purpose
Control user access to a registered app using sheet-backed membership and support a verified Chakra CLI.

## ADDED Requirements

### Requirement: Registered app user access
Chakra SHALL allow an active authenticated user to use an enabled registered app only when the user has an active direct grant or an active membership in a team granted access to that app.

#### Scenario: Direct access
- **GIVEN** an active user has an active direct grant to an enabled app
- **WHEN** that user signs in to the app
- **THEN** Chakra allows access.

#### Scenario: Team access
- **GIVEN** an active user belongs to an active team granted active access to an enabled app
- **WHEN** that user signs in to the app
- **THEN** Chakra allows access.

#### Scenario: No access
- **GIVEN** an active user has neither direct nor team access to the app
- **WHEN** the user signs in
- **THEN** Chakra denies app access and its reusable no-access screen directs the user to contact an administrator.

#### Scenario: Disabled app or inactive user
- **WHEN** the app is disabled or the user is inactive
- **THEN** Chakra denies app access.

#### Scenario: Offline after a successful sync
- **GIVEN** access data was synchronized successfully before the latest sync failed
- **WHEN** a user signs in
- **THEN** Chakra uses the last successfully cached permissions.

#### Scenario: Missing access data
- **WHEN** neither a valid direct grant nor a valid team grant can be established and required membership data is unavailable
- **THEN** Chakra denies access and reports a recoverable error.

### Requirement: Main-controlled app identity
Chakra SHALL use the host-configured registered app identity and SHALL ignore renderer attempts to replace it.

#### Scenario: Renderer attempts app spoofing
- **WHEN** renderer input supplies a different app ID
- **THEN** Chakra uses the host-configured app ID.

### Requirement: Verified CLI selection
Chakra SHALL verify a host-provided bundled CLI and allow a user to choose and verify an alternative without overwriting a previously working selection on failure.

#### Scenario: Invalid replacement
- **GIVEN** a working saved selection
- **WHEN** the user selects an incompatible CLI
- **THEN** Chakra reports the failure and retains the previous selection.

Knowledge: [common boundary](../../../../../knowledge/concepts/standalone-consumers.md), [CLI contract](../../../../../backend/knowledge/concepts/cli-contract.md), [UI surface](../../../../../frontend/knowledge/concepts/library-surface.md).
