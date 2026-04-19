# Research — Stack

## Electron App Installer Technology Stack

### Core Framework
- **Electron** (latest) — Desktop app framework combining Chromium + Node.js
- **Electron Forge** — Recommended packaging tool (built-in to Electron)
- **electron-builder** — Alternative with more configuration options

### Build Targets
- **NSIS** — Default Windows installer, supports auto-updates
- **MSI** — Enterprise Windows installer
- **Portable** — No installation required
- **AppX** — Windows Store format

### Key Dependencies
- Node.js 12+ (required)
- electron-builder / electron-forge
- Code signing certificates (required for distribution)

### Integration Points
- Main process: system operations, file system, native APIs
- Renderer process: React/Vue for UI
- IPC: communication between processes