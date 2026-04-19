# Feature: Storage

## Overview

SQLite cache for Chakra data including login credentials, environment configuration, and Google Sheets data.

## What It Does

- **Stores** login credentials (encrypted)
- **Caches** environment configuration
- **Caches** Google Sheets data
- **Tracks** installed applications
- **Persists** user preferences

## What It Does NOT

- Does not store installed app code (in app/ folder)
- Does not sync to external (except governance repos)

## Storage Structure

```
/mounted-drive/cache/
└── chakra.sqlite
```

## Cache Domains

### Login

```json
{
  "users": [
    {
      "id": "uuid",
      "username": "admin",
      "passwordHash": "bcrypt",
      "role": "admin"
    }
  ]
}
```

### Configuration

```json
{
  "config": {
    "global": {
      "autoUpdate": false,
      "updateCheckInterval": "daily"
    },
    "apps": {
      "dhi": {
        "minVersion": "1.0.0"
      }
    }
  }
}
```

### Google Sheets Cache

```json
{
  "sheets": {
    "spreadsheet-id": {
      "lastSync": "2026-04-19T00:00:00Z",
      "data": [...],
      "sheetIds": [...]
    }
  }
}
```

## Dependencies

### Prana Services
- `sqliteConfigStoreService` - SQLite operations
- `runtimeDocumentStoreService` - Document storage
- `sqliteCryptoUtil` - Encryption

### Local Services
- `sqliteCacheService` - Chakra cache management
- `googleSheetsCacheService` - Google Sheets cache

## Google Sheets Integration

Google Sheets data is cached locally:

1. **Initial load:** Fetch from Google Sheets API
2. **Store:** Cache in SQLite
3. **Refresh:** On-demand or scheduled
4. **Fallback:** Use cache when offline

### Configuration

| Setting | Description | Default |
|--------|-------------|---------|
| `sheets.cache` | Enable caching | true |
| `sheets.refreshInterval` | How often to refresh | 1 hour |

## Implementation

**IPC Handlers:**
- `storage:cache:get` - Get cached data
- `storage:cache:set` - Set cached data
- `storage:sheets:sync` - Sync Google Sheets
- `storage:sheets:clear` - Clear cache

## Known Gaps

- [ ] Scheduled sync for Google Sheets
- [ ] Cache size limits
- [ ] Cache invalidation strategy

## Related Features

- [Authentication](authentication/index.md) - Login uses cache
- [Virtual Drive](virtual-drive/index.md) - Stored on drive
- [Configuration](configuration/index.md) - Config stored in cache