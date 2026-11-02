# Capability: cli-configuration

## ADDED Requirements

### Requirement: Set and verify CLI location
The library SHALL provide a configuration screen where the user sets the CLI executable path and verifies it.

#### Scenario: Valid CLI
- **GIVEN** the user enters the path of a compatible CLI
- **WHEN** they choose Verify
- **THEN** the screen shows the CLI version and the result of each doctor check and enables Save

#### Scenario: Missing or non-executable path
- **WHEN** the path does not exist or is not an executable file
- **THEN** verification fails with a specific message and the path is not saved as verified

#### Scenario: Incompatible API version
- **GIVEN** the CLI reports an `apiVersion` the library does not support
- **WHEN** the user verifies
- **THEN** the screen reports the incompatibility and does not mark the CLI verified

### Requirement: Platforms
The CLI path SHALL accept a Windows `.exe` or a Linux executable, with Windows as the primary supported platform.

#### Scenario: Windows path
- **GIVEN** the user enters a path to `chakra.exe`
- **WHEN** they verify
- **THEN** it is run without a shell and verified as on Linux

### Requirement: Persistent location
The library SHALL persist the CLI path so that consumers never configure it in code.

#### Scenario: Restart
- **GIVEN** a verified path was saved
- **WHEN** the app restarts
- **THEN** boot uses the saved path without prompting
