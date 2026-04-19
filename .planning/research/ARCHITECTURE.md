# Research — Architecture

## Chakra Architecture

### Main/Renderer Architecture
- **Main Process**: System operations, app installation/uninstallation, native APIs
- **Renderer Process**: React/Vue UI, user interaction
- **IPC**: Communication between processes

### New Components Required
- App registry (JSON/database for installed apps)
- Auth module (for role-based access)
- Configuration module (min version, app settings)
- Update checker (for auto-updates)

### Data Flow
1. User action in Renderer → IPC → Main Process
2. Main process executes system operation
3. Result → IPC → Renderer updates UI

### Build Order Considerations
1. Set up Electron + React skeleton first
2. Implement core (install/uninstall/list)
3. Add auth/roles
4. Add configuration
5. Add updates
6. Package and sign