# Research — Pitfalls

## Common Mistakes When Building Electron App Installers

### Security Concerns
1. **Node.js in Renderer** — Never enable Node.js integration in renderer unless necessary
2. **Remote Code** — Never load remote code without validation
3. **IPC Exposure** — Validate all IPC messages

### Platform-Specific Issues
1. **Windows Paths** — Handle Windows path separators correctly
2. **Permissions** — Request elevated permissions only when needed
3. **Antivirus** — Code sign to avoid false positives

### Performance
1. **Bundle Size** — Exclude unused dependencies
2. **Startup Time** — Lazy load heavy modules
3. **Memory** — Limit renderer processes

### Build & Distribution
1. **appId Stability** — Never change appId after release
2. **Code Signing** — Get certificates early
3. **Auto-update** — Test update flow in staging

### Prevention Strategy
- Audit security settings in every phase
- Test on real Windows environment
- Set up CI/CD for automated builds