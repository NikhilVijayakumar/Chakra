# Feature: App Installation

## Overview

Chakra installs applications from git repositories into the mounted encrypted virtual drive.

## What It Does

- **Clones** applications from git repositories (GitHub, GitLab, etc.)
- **Installs** to specific folder structure under `/mounted-drive/app/`
- **Tracks** installed apps in the app registry
- **Supports** branch/tag selection
- **Validates** installation before marking as complete

## What It Does NOT

- Does not install from non-git sources (future feature)
- Does not auto-update (handled by updates feature)
- Does not handle system-level installation (runs in virtual drive only)

## Mounted Folder Structure

```
/mounted-drive/
└── app/
    ├── dhi/                  # e.g., Dhi app
    │   ├── src/
    │   ├── package.json
    │   └── ...
    └── {appName}/            # Other installed apps
```

## Dependencies

### Prana Services
- `driveControllerService` - Virtual drive access
- `mountRegistryService` - Mount point management

### Local Services
- `gitInstallerService` - Git clone and installation
- `appRegistryService` - App registration and tracking

## Implementation

**Main Process:** `src/main/services/gitInstallerService.ts`

**IPC Handlers:**
- `app:install` - Install app from git repo
- `app:install:progress` - Report installation progress
- `app:install:complete` - Installation completed
- `app:install:error` - Installation failed

## Installation Flow

```
1. User selects "Install App"
2. Enter git repository URL (e.g., https://github.com/NikhilVijayakumar/dhi)
3. Select branch/tag (optional, defaults to main/master)
4. Chakra validates repository
5. Clone to /mounted-drive/app/{appName}/
6. Register in app registry
7. Success notification
```

## Configuration

| Option | Description | Default |
|--------|-------------|---------|
| `branch` | Git branch to install | main |
| `tag` | Specific tag version | latest |
| `installPath` | Custom install path | /mounted-drive/app/{name} |

## Known Gaps

- [ ] No installation from private repos (requires SSH key)
- [ ] No rollback on failed installation
- [ ] No dependency resolution between apps

## Related Features

- [Uninstallation](uninstallation/index.md) - Remove installed apps
- [App Listing](listing/index.md) - List installed apps
- [Updates](updates/index.md) - Update installed apps