# Capability: app-features

## ADDED Requirements

### Requirement: App availability from the sheet
The CLI SHALL report whether the calling app is registered and enabled according to the synced sheet data, and the library SHALL block boot for an app that is not enabled.

#### Scenario: Enabled app
- **GIVEN** the app's row is present and enabled in the synced data
- **WHEN** `app info` runs with its `appId`
- **THEN** `enabled` is true and its granted features are listed

#### Scenario: Unknown or disabled app
- **WHEN** `app info` runs for an unregistered or disabled app
- **THEN** the CLI returns `app_not_enabled` and the library shows a blocking message at boot

#### Scenario: Not yet synced
- **GIVEN** the cache is empty
- **WHEN** the app boots
- **THEN** the library offers a manual sync before evaluating availability

### Requirement: Feature-scoped content access
An app SHALL read only the content permitted by the features granted to it in the sheet.

#### Scenario: Allowed content
- **GIVEN** the app has the feature that maps to content `holidays`
- **WHEN** it calls `content get` for `holidays`
- **THEN** the cached rows are returned

#### Scenario: Denied content
- **GIVEN** the app lacks that feature
- **WHEN** it calls `content get`
- **THEN** the CLI returns `feature_denied` and no rows

### Requirement: Sync visibility to apps
The library SHALL expose sync status and manual sync to the app and the CLI configuration screen.

#### Scenario: Manual sync from UI
- **GIVEN** `sync status` reports content not synced
- **WHEN** the user triggers sync
- **THEN** per-content results are shown and status refreshes
