# Research Summary — Chakra v0.1

## Stack Additions
- Electron (latest) for desktop app framework
- Electron Forge or electron-builder for packaging
- NSIS as default Windows installer
- Code signing required for distribution

## Feature Table Stakes
- App Installation (core)
- App Uninstallation (core)
- App Listing (core)

## Differentiators
- Role-based listing after login
- Version management (minimum supported version)
- Configuration management
- Auto-updates

## Watch Out For
1. **Security** — Never expose Node.js in renderer, validate all IPC
2. **appId** — Never change after release
3. **Code signing** — Get certificates early to avoid antivirus issues
4. **Windows paths** — Handle Windows path separators correctly

## Architecture Integration
- Main process handles system operations
- React UI in renderer
- IPC for communication
- JSON/registry for app registry storage