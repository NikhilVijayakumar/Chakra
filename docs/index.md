# Chakra — Documentation Index

## Navigation Guide

**Task-based quick reference:**
- **Add runtime service** → src/main/services/
- **Add UI component** → src/renderer/common/components/
- **Add feature doc** → docs/feature/
- **Update storage config** → docs/feature/storage/
- **Add screen** → src/renderer/[screen-family]/
- **Build/config** → package.json, electron.vite.config.ts

**For detailed docs:** See Feature Details section below.

## Global Constants

| Key | Value |
|-----|------|
| Name | chakra |
| Version | 0.1.0 |
| Type | Electron Application |
| Build | electron-vite |

## High-Level Vision

Chakra is a standalone Electron application that installs other applications via git repositories into an encrypted virtual drive. It provides app management, role-based governance, and secure storage with SQLite caching.

## Dependency Stack

| Library | Source |
|---------|--------|
| @electron-toolkit/preload | ^3.0.2 |
| @electron-toolkit/utils | ^4.0.0 |
| @emotion/react | ^11.14.0 |
| @emotion/styled | ^11.14.0 |
| @mui/icons-material | ^7.3.9 |
| @mui/material | ^7.3.9 |
| astra | github:NikhilVijayakumar/astra |
| prana | github:NikhilVijayakumar/prana |
| react-router-dom | ^7.13.1 |
| sql.js | ^1.14.1 |

## System Map

```
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts      # Main entry
│   │   ├── preload.ts    # Preload scripts
│   │   └── services/    # Runtime services
│   └── renderer/        # React renderer
│       ├── main.tsx     # Renderer entry
│       └── common/
│           └── components/  # UI components
├── docs/
│   └── feature/        # Feature documentation
├── scripts/            # Build scripts
└── package.json
```

## Feature Details

### Core Features

- **Virtual Drive** ([docs/feature/virtual-drive.md](docs/feature/virtual-drive.md))
  - Services: driveControllerService, mountRegistryService
- **Storage** ([docs/feature/storage.md](docs/feature/storage.md))
  - Services: sqliteCacheService, googleSheetsCacheService
- **App Installation** ([docs/feature/installation.md](docs/feature/installation.md))
  - Services: gitInstallerService, appRegistryService
- **App Uninstallation** ([docs/feature/uninstallation.md](docs/feature/uninstallation.md))
  - Services: appRegistryService
- **App Listing** ([docs/feature/listing.md](docs/feature/listing.md))
  - Services: appRegistryService

### Updates & Configuration

- **App Updates** ([docs/feature/updates.md](docs/feature/updates.md))
  - Services: gitInstallerService, appRegistryService
- **Configuration** ([docs/feature/configuration.md](docs/feature/configuration.md))
  - Services: appRegistryService

### Security & Governance

- **Authentication** ([docs/feature/authentication.md](docs/feature/authentication.md))
  - Services: authService
- **Governance** ([docs/feature/governance.md](docs/feature/governance.md))
  - Services: sshGovernanceService
- **Roles** ([docs/feature/governance-roles.md](docs/feature/governance-roles.md))
  - Services: sshGovernanceService


## Concept Mapping

| Concept | Implementation | Location |
|---------|---------------|----------|
| Virtual Drive | driveControllerService | src/main/services/ |
| App Registry | appRegistryService | src/main/services/ |
| Git Installer | gitInstallerService | src/main/services/ |
| SSH Governance | sshGovernanceService | src/main/services/ |
| SQLite Cache | sqliteCacheService | src/main/services/ |
| Google Sheets Cache | googleSheetsCacheService | src/main/services/ |
| Authentication | authService | src/main/services/ |
| UI Components | Astra | src/renderer/common/components/ |

## Edit Map

| Task | Location |
|------|---------|
| Add runtime service | src/main/services/ |
| Add UI component | src/renderer/common/components/ |
| Add feature doc | docs/feature/ |
| Add architecture doc | docs/architecture/ |
| Add screen | src/renderer/[screen-family]/ |

## Critical Flows

### Add runtime service
Create docs/feature/[feature].md → Define service contract → Implement in src/main/services/ → Add IPC handler in preload.ts → Run npm run generate:index

### Add architecture doc
Create docs/architecture/[pattern].md → Add to wiki-steps.json featureDetails → Run npm run generate:index

### Add UI screen
Create Container → ViewModel → View → Export in components/index.ts → Run npm run generate:index

## Documentation Manifest

- **architecture/localization.md** → Architecture: Localization (i18n) Chakra follows Astra's localization system for internationalization.
- **architecture/mvvm-pattern.md** → Architecture: MVVM Pattern Chakra follows Astra's MVVM (Model-View-ViewModel) pattern for all UI implementations.
- **architecture/repository.md** → Architecture: Repository Pattern Chakra follows Astra's Repository pattern for API and data access.
- **architecture/state-management.md** → Architecture: State Management Chakra follows Astra's centralized state management using MVVM patterns.
- **architecture/theming.md** → Architecture: Theming Chakra follows Astra's theming system based on Material UI with custom tokens.
- **feature/authentication.md** → Feature: Authentication Overview
- **feature/configuration.md** → Feature: Configuration Overview
- **feature/governance-roles.md** → Feature: Roles Overview
- **feature/governance.md** → Feature: SSH Governance Overview
- **feature/installation.md** → Feature: App Installation Overview
- **feature/listing.md** → Feature: App Listing Overview
- **feature/storage.md** → Feature: Storage Overview
- **feature/uninstallation.md** → Feature: App Uninstallation Overview
- **feature/updates.md** → Feature: App Updates Overview
- **feature/virtual-drive.md** → Feature: Virtual Drive Overview
- **index.md** → Chakra — Documentation Index Navigation Guide

## Rules

- All apps installed to mounted virtual drive folder under app/
- Git-based installation from configured repositories
- Role-based SSH access for governance repos under data/governance/
- Login required before virtual drive access
- SQLite cache for login, env config, and Google Sheets data
- Use Prana virtual drive for encrypted storage
- Use Astra MVVM pattern: Container → ViewModel → View
- Always use useDataState for async operations
- Never hardcode colors - use theme tokens
- Never hardcode strings - use localization
- Use Prana IPC for internal, ApiService for external

## API Surface

See: src/main/services/ for all runtime services.
See: src/renderer/common/components/index.ts for UI component exports.

## Maintenance

- Config: scripts/wiki-steps.json
- Generated: 2026-04-19
- Version: 0.1.0
