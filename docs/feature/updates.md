# Feature: App Updates

## Overview

Check for and apply updates to installed applications.

## What It Does

- **Checks** for available updates from git remote
- **Downloads** update packages
- **Applies** updates to installed apps
- **Reports** changelog

## What It Does NOT

- Does not auto-update (configurable, off by default)
- Does not handle breaking changes automatically

## Dependencies

### Local Services
- `gitInstallerService` - Git operations
- `appRegistryService` - App tracking

## Implementation

**IPC Handlers:**
- `app:update:check` - Check for updates
- `app:update:download` - Download update
- `app:update:apply` - Apply update
- `app:update:progress` - Report progress

## Update Flow

```
1. User navigates to "Updates"
2. System checks git remotes
3. Update list displays with changelog
4. User selects apps to update
5. Download and apply
6. Success notification
```

## Auto-Update Configuration

| Setting | Description | Default |
|--------|-------------|---------|
| `autoUpdate` | Auto-update on new version | false |
| `checkInterval` | How often to check | daily |
| `allowMajor` | Allow major version updates | false |

## Known Gaps

- [ ] Scheduled updates
- [ ] Rollback on failure
- [ ] Delta updates (only changed files)

## Related Features

- [Installation](installation/index.md) - Install apps
- [Configuration](configuration/index.md) - Update settings