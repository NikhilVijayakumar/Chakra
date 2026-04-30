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
| Version | 0.0.1 |
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
| bcryptjs | ^3.0.3 |
| google-auth-library | ^10.6.2 |
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

- **apps/rita.md** → Project Rita: Automated Attendance Orchestrator Rita (inspired by the Sanskrit Ṛta — the cosmic order) is the first integrated app inside
- **architecture/localization.md** → Architecture: Localization (i18n) Chakra follows Astra's localization system for internationalization.
- **architecture/mvvm-pattern.md** → Architecture: MVVM Pattern Chakra follows Astra's MVVM (Model-View-ViewModel) pattern for all UI implementations.
- **architecture/repository.md** → Architecture: Repository Pattern Chakra follows Astra's Repository pattern for API and data access.
- **architecture/state-management.md** → Architecture: State Management Chakra follows Astra's centralized state management using MVVM patterns.
- **architecture/theming.md** → Architecture: Theming Chakra follows Astra's theming system based on Material UI with custom tokens.
- **design/accessibility.md** → Project NEEV: Accessibility & Inclusive Design Standards > Version: 1.0.0
- **design/atomic-rules.md** → This file serves as the Logic Enforcement layer for the Antigravity Agent . It ensures that every mockup generated by the agent isn't just a random HTML structure, but follows a st
- **design/components.md** → Updated Component Directory Structure When the Python Engine scaffolds a component like agent-health-strip, it will generate the following localized hierarchy:
- **design/localization.md** → Project NEEV: Localization (L10n) & Internationalization (i18n) > Version: 1.0.0
- **design/mui-alignment.md** → React & MUI Alignment Guidelines Overview
- **design/mui-tokens.md** → This file is the Translation Layer . It tells the Antigravity Agent exactly how to map your high-level JavaScript/TypeScript theme objects (like colors.neutral) into the CSS variab
- **design/navigation.md** → ️ Project NEEV: Navigation & Flow Blueprint > Version: 1.0.0
- **design/page.md** → Page Directory Structure
- **design/premium-aesthetics.md** → Premium Brand & Aesthetic Guidelines Overview
- **design/scaffold.md** → This is the final, updated Scaffold Specification . It incorporates the corrected Phase 2 logic, ensuring the separation of global /foundations from localized /theme templates, whi
- **design/theme.md** → Project NEEV: Theme Logic & Visual Contract > Version: 1.0.0
- **design/viewport.md** → ️ Project NEEV: Viewport & Responsive Strategy > Version: 1.0.0
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
- **pr/prana/client-configurable-sqlite-root-path.md** → Prana PR: Client-Configurable SQLite Root Path Status: Partially implemented — sqliteRoot field exists in PranaRuntimeConfig; store services still use bare mkdir (see sqlite-store-
- **pr/prana/drive-decoupling-client-owned-policy-proposal.md** → PR Request for Prana: Decouple Virtual Drive Policy to Client App Status: Proposal only
- **pr/prana/drive-layout-config-root-move.md** → Prana Clarification: drive-layout.json Is Now at the Project Root Status: Informational / path update required
- **pr/prana/drive-root-directory-collision.md** → Prana Clarification: Intended Drive Root Layout (S:\) Status: Clarification / design intent
- **pr/prana/google-bridge-spreadsheet-id-hardcoded-empty.md** → Bug: GoogleBridgeService hardcodes empty spreadsheetId — env var ignored File
- **pr/prana/google-sheets-management-service.md** → feat(google-sheets): add googleSheetsManagementService for spreadsheet and tab lifecycle Background
- **pr/prana/rclone-password-must-be-obscured.md** → Prana Bug: rclone crypt password must be obscured before passing to env vars Status: Bug — drive does not mount; silent fallback to unencrypted local storage
- **pr/prana/service-account-auth-for-google-sheets-cache.md** → feat(google-sheets): add service account authentication to googleSheetsCacheService Background
- **pr/prana/splash-dependency-precheck-proposal.md** → PR Request for Prana: Reusable Host Dependency Capability Service Status: Proposal only (do not implement in Chakra)
- **pr/prana/sqlite-store-mkdir-eperm-fix.md** → Prana Bug: SQLite Store Services EPERM on Windows Drive Root Status: Bug — confirmed in production
- **pr/prana/virtual-drive-security-enforcement.md** → Prana PR: Virtual Drive Security Enforcement Status: Proposal
- **pr/prana/windows-drive-root-mkdir-eperm.md** → Prana Bug Report: Windows EPERM on mkdir at WinFsp drive root Summary
- **pr/prana/windows-virtual-drive-spawn-readiness-bug.md** → Prana Bug Report: Windows virtual drive spawn readiness can break auth startup Summary
- **references/animations.md** → Excellent. Animation is the fastest way to:
- **references/general.md** → NEEV Reference Matrix Canonical UI Reference Benchmarks by Audit Layer
- **references/inspiration.md** → Inspiration This document categorizes your provided reference links into functional "Mastery Groups." Every implementation in Phase 4 must cite one of these groups to justify its "
- **references/lottie.md** → Lottie Usage Reference Documentation For Marketing Website + Internal Electron App
- **references/theme.md** → LIGHT THEME REFERENCES Light mode is harder than dark.
- **references/web-desktop-app.md** → Good. Now we’re designing deliberately.
- **rules/Brand Guideline.md** → NEEV — Premium Brand Guideline Brand Position
- **rules/Core Design Rules.md** → NEEV — Core Design Rules (Premium Product Design Principles)
- **rules/Design Quality Checklist.md** → NEEV — Design Quality Checklist This checklist should be applied to every screen, component, or interface before release.
- **rules/Premium UI Patterns.md** → NEEV — Premium UI Patterns Premium interfaces are defined by clarity, hierarchy, and restraint .
- **sheets/README.md** → Google Sheets Setup All three sheets — Departments , Designations , and Employees — live as separate tabs within a single spreadsheet . One spreadsheet ID covers all three.

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
- Generated: 2026-04-30
- Version: 0.0.1
