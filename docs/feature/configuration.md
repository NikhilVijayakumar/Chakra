# Feature: Configuration

## Overview

Manage application settings including minimum supported versions and app-specific configurations.

## What It Does

- **Sets** minimum supported versions per app
- **Configures** app-specific settings
- **Persists** configuration to SQLite cache
- **Validates** configuration before saving

## What It Does NOT

- Does not configure system settings (future)
- Does not handle app-specific runtime config

## Dependencies

### Local Services
- `appRegistryService` - App configuration

## Implementation

**IPC Handlers:**
- `config:get` - Get configuration
- `config:set` - Set configuration
- `config:reset` - Reset to defaults

## Configuration Storage

Stored in SQLite cache (`/mounted-drive/cache/chakra.sqlite`):

```json
{
  "global": {
    "minSupportedVersion": "1.0.0",
    "autoUpdate": false,
    "updateCheckInterval": "daily"
  },
  "apps": {
    "app-name": {
      "minVersion": "2.0.0",
      "customSettings": {}
    }
  }
}
```

## Role-Based Access

| Role | Can Modify |
|------|-----------|
| Admin | All configuration |
| User | Own app settings only |
| Guest | Read-only |

## Security

- Only admins can modify global configuration
- Changes are logged
- Backup before changes

## Known Gaps

- [ ] Import/export configuration
- [ ] Configuration profiles for different environments
- [ ] Remote configuration (Google Sheets or similar)

## Related Features

- [Updates](updates/index.md) - Uses min version for updates
- [Storage](storage/index.md) - Configuration stored in SQLite