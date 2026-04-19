# Feature: App Uninstallation

## Overview

Clean removal of installed applications from the virtual drive.

## What It Does

- **Removes** application from `/mounted-drive/app/`
- **Cleans** app registry entries
- **Validates** before uninstallation
- **Logs** uninstallation for audit

## What It Does NOT

- Does not remove shared dependencies if used by other apps
- Does not clean governance data (separate feature)

## Dependencies

### Local Services
- `appRegistryService` - App registration

## Implementation

**Main Process:** `src/main/services/appRegistryService.ts`

**IPC Handlers:**
- `app:uninstall` - Uninstall app
- `app:uninstall:progress` - Report progress
- `app:uninstall:complete` - Uninstall completed

## Uninstallation Flow

```
1. User selects app from list
2. Click "Uninstall"
3. Confirmation dialog
4. Remove from app/
5. Clean registry
6. Success notification
```

## Safety Checks

- Prevent uninstallation of system-critical apps
- Require confirmation
- Log all uninstallations

## Known Gaps

- [ ] No shared dependency check
- [ ] No partial cleanup option

## Related Features

- [Installation](installation/index.md) - Install apps
- [App Listing](listing/index.md) - List apps