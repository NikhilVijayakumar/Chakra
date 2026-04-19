# Feature: Virtual Drive

## Overview

Encrypted virtual drive mounted at application startup using Prana services.

## What It Does

- **Mounts** encrypted virtual drive at startup
- **Decrypts** drive with key from Prana vault
- **Provides** secure storage for all Chakra data
- **Handles** drive lifecycle

## What It Does NOT

- Does not handle encryption keys directly (Prana vault)
- Does not provide system-level access

## Dependencies

### Prana Services
- `driveControllerService` - Virtual drive management
- `mountRegistryService` - Mount point tracking
- `vaultService` - Encrypted vault
- `virtualDriveProvider` - Drive provider

## Implementation

**Startup Flow:**
```
1. App starts → Show login
2. User logs in
3. Mount virtual drive (Prana)
4. Initialize SQLite cache
5. Load configuration
6. Ready for use
```

## Drive Structure

```
/mounted-drive/
├── app/                    # Installed apps
│   ├── dhi/
│   └── {appName}/
├── data/
│   └── governance/        # SSH governance repos
└── cache/
    └── chakra.sqlite      # SQLite cache
```

## Security

| Layer | Protection |
|-------|------------|
| Drive | AES-256 encryption |
| Mount | Password-derived key |
| Access | Login required before mount |

## Integration with Prana

Chakra uses Prana's virtual drive:
- Same mount mechanism as Dhi
- Same encryption (AES-256-GCM)
- Same vault services

For implementation details, see Prana docs:
- `E:\Python\prana\docs\features\storage\virtual-drive.md`

## Known Gaps

- [ ] Manual unmount option
- [ ] Drive health diagnostics

## Related Features

- [Installation](installation/index.md) - Apps installed to drive
- [Governance](governance/index.md) - Governance data on drive
- [Storage](storage/index.md) - Cache on drive