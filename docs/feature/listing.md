# Feature: App Listing

## Overview

Display installed applications with role-based filtering.

## What It Does

- **Lists** all installed apps from `/mounted-drive/app/`
- **Filters** by user role (admin sees all, user sees permitted)
- **Searches** by app name or version
- **Sorts** by name, date installed, version

## What It Does NOT

- Does not show governance data (separate feature)
- Does not show system files

## Dependencies

### Local Services
- `appRegistryService` - App registration and listing

## Implementation

**IPC Handlers:**
- `app:list` - Get all apps
- `app:search` - Search apps
- `app:filter` - Filter by criteria

## Role-Based Access

| Role | Can See |
|------|--------|
| Admin | All apps including system |
| User | Permitted apps only |
| Guest | Basic info (name, version) |

## UI Components

- App card grid/list view
- Search bar
- Filter dropdown
- Sort options

## Known Gaps

- [ ] No grouping by category
- [ ] No favorites

## Related Features

- [Installation](installation/index.md) - Install apps
- [Uninstallation](uninstallation/index.md) - Remove apps