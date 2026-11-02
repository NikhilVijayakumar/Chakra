# Capability: library-packaging

## ADDED Requirements

### Requirement: Installable library
The frontend SHALL be installable by a consuming Electron app as a package from git and SHALL export a main-process registration function, a preload bridge, and renderer components.

#### Scenario: Consumer mounts the library
- **GIVEN** a minimal Electron app that depends on the library
- **WHEN** it calls the main registration function, loads the preload bridge, and renders the provider and routes
- **THEN** splash, login and CLI configuration screens are reachable without the app containing database, Sheets or credential code

### Requirement: No Prana dependency
The library SHALL NOT depend on `prana`.

#### Scenario: Dependency check
- **WHEN** `package.json` and the source are inspected
- **THEN** there is no `prana` dependency or import

### Requirement: No installer features
The library SHALL NOT contain virtual drive, vault, app install, uninstall, listing, runner, SSH governance, or the plugin SQLite bridge.

#### Scenario: Removed features absent
- **WHEN** the repository is searched for the removed IPC channels, routes, services and docs
- **THEN** none are found and the library typecheck and build succeed
