# Capability: app-features


## ADDED Requirements

### Requirement: Write permission
A write (`content create|update|delete`, `quarantine` resolution commands) SHALL be allowed for an app that the sheet marks enabled (the same condition as reads) and SHALL be refused otherwise. The permission is given to the app in the sheet; no separate write feature exists. Writes SHALL be limited to contents the registry marks writable.

#### Scenario: Enabled app writes
- **GIVEN** the sheet marks app `APP008` active
- **WHEN** it creates a department
- **THEN** the row is created

#### Scenario: Disabled or unknown app
- **GIVEN** an app that is not active in the sheet
- **WHEN** it writes
- **THEN** the CLI returns `app_not_enabled` and changes nothing

#### Scenario: Not synced
- **GIVEN** app data has never been synced
- **WHEN** an app writes
- **THEN** the CLI returns `not_synced`

### Requirement: App identity on writes
The library SHALL set `appId` on every write operation in the main process; a value supplied by the renderer SHALL be ignored.

#### Scenario: Spoofed app id
- **WHEN** the renderer sends `appId: "admin"` with a write
- **THEN** the CLI receives the configured `appId`
