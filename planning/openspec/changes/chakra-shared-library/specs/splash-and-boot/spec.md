# Capability: splash-and-boot

## ADDED Requirements

### Requirement: Startup sequence
The library SHALL show the splash screen, then a boot check that verifies the configured CLI, and only then route to authentication.

#### Scenario: CLI configured and healthy
- **GIVEN** a verified CLI path is stored and `meta doctor` reports all checks ok
- **WHEN** the app starts
- **THEN** splash, boot progress and the login screen appear in that order

#### Scenario: CLI not configured
- **GIVEN** no CLI path is stored
- **WHEN** boot runs
- **THEN** the user is routed to the CLI configuration screen and cannot reach login

#### Scenario: CLI unhealthy
- **GIVEN** `meta doctor` returns a failing check
- **WHEN** boot runs
- **THEN** the failing check id and message are shown with a link to the CLI configuration screen

### Requirement: Reduced motion
The splash SHALL honor `prefers-reduced-motion` by shortening or suppressing animation.

#### Scenario: Reduced motion
- **GIVEN** the user prefers reduced motion
- **WHEN** the splash plays
- **THEN** it completes in less time than the default and without elaborate transitions

### Requirement: Connection check
The boot sequence SHALL verify that the saved CLI is connected, meaning it starts, reports a supported `apiVersion` and answers `meta doctor`, and SHALL expose the same check to apps.

#### Scenario: Saved CLI unreachable
- **GIVEN** a CLI path is saved but the file is gone or not executable
- **WHEN** boot runs
- **THEN** boot reports the CLI as not connected and shows the CLI configuration screen

#### Scenario: App checks connection later
- **WHEN** an app uses the connection hook or status badge
- **THEN** it reflects connected, needs attention, or not connected from the same check

### Requirement: Extensible screens and stages
The library SHALL let an app replace any default screen, add its own boot stages that run after the built-in ones, and build screens from headless hooks.

#### Scenario: App boot stage fails
- **GIVEN** an app-supplied stage returns a message
- **WHEN** boot reaches it
- **THEN** the message is shown and the login screen is not reached

#### Scenario: App replaces login
- **GIVEN** the app supplies its own login screen
- **WHEN** boot completes
- **THEN** the app's screen is shown and calling its `onLogin` continues into the app
