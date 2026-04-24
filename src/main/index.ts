import { app, BrowserWindow } from 'electron'
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import {
  applyPranaRuntimeDefaults,
  bridgeMainViteRuntimeEnvToRuntime,
  ensureWritableDevRuntimePaths,
  loadWorkspaceEnvFile,
  resolveRendererUrl
} from './services/runtimeEnv'
import { verifyStartupSafety, warnWeakVaultConfig } from './services/startupSecurity'
import { setPranaPlatformRuntime } from 'prana/main/services/pranaPlatformRuntime'
import { setPranaRuntimeConfig } from 'prana/main/services/pranaRuntimeConfig'

let driveLifecycleHooksRegistered = false

const registerDriveLifecycleHooks = (): void => {
  if (driveLifecycleHooksRegistered) {
    return
  }

  driveLifecycleHooksRegistered = true
  app.once('before-quit', (event) => {
    // Prevent the default quit so we can await dispose() before exiting.
    // app.once ensures this handler runs only once, so the subsequent app.quit()
    // call below does not re-trigger it.
    event.preventDefault()
    void (async () => {
      try {
        const { driveControllerService } = await import('prana/main/services/driveControllerService')
        await driveControllerService.dispose()
        console.info('[Chakra] Virtual drives ejected cleanly')
      } catch (error) {
        console.warn('[Chakra] Could not eject virtual drives during shutdown:', error)
      } finally {
        app.quit()
      }
    })()
  })
}

const showUnsafeStartupWindow = async (message: string, diagnosticsJson?: string): Promise<void> => {
  await app.whenReady()

  const errorWindow = new BrowserWindow({
    width: 720,
    height: 480,
    autoHideMenuBar: true,
    title: 'Chakra Startup Blocked',
    webPreferences: {
      sandbox: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js')
    }
  })

  const baseUrl = resolveRendererUrl(process.env) || 'http://localhost:5173'
  let url = `${baseUrl}#/dependency-check?message=${encodeURIComponent(message)}`
  if (diagnosticsJson) {
    url += `&diagnostics=${encodeURIComponent(diagnosticsJson)}`
  }
  errorWindow.loadURL(url)

  errorWindow.on('closed', () => {
    app.quit()
  })
}

const bootstrapPranaMain = async (): Promise<void> => {
  const rendererUrl = resolveRendererUrl(process.env)
  const isDevelopment = process.env.NODE_ENV === 'development' || Boolean(rendererUrl)
  const runtimeEnvValue = (suffix: string): string | undefined => {
    return process.env[`CHAKRA_${suffix}`] ?? process.env[`DHI_${suffix}`]
  }
  const runtimeBooleanValue = (suffix: string): boolean | undefined => {
    const value = runtimeEnvValue(suffix)
    if (!value) {
      return undefined
    }

    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') {
      return true
    }
    if (normalized === 'false') {
      return false
    }

    return undefined
  }

  try {
    setPranaPlatformRuntime({
      ...(rendererUrl ? { rendererUrl } : {}),
      inheritedEnv: process.env as Record<string, string>,
      homeDir: process.env.HOME || process.env.USERPROFILE,
      userProfileDir: process.env.USERPROFILE
    })

    const config = {
      director: {
        name: runtimeEnvValue('DIRECTOR_NAME') || 'Director',
        email: runtimeEnvValue('DIRECTOR_EMAIL') || 'director@example.com',
        password: runtimeEnvValue('DIRECTOR_PASSWORD'),
        passwordHash: runtimeEnvValue('DIRECTOR_PASSWORD_HASH')
      },
      governance: {
        repoUrl: runtimeEnvValue('GOV_REPO_URL') || '',
        repoPath: runtimeEnvValue('GOV_REPO_PATH') || ''
      },
      vault: {
        specVersion: runtimeEnvValue('VAULT_SPEC_VERSION'),
        tempZipExtension: runtimeEnvValue('VAULT_TEMP_ZIP_EXT'),
        outputPrefix: runtimeEnvValue('VAULT_OUTPUT_PREFIX'),
        archivePassword: runtimeEnvValue('VAULT_ARCHIVE_PASSWORD'),
        archiveSalt: runtimeEnvValue('VAULT_ARCHIVE_SALT'),
        kdfIterations: runtimeEnvValue('VAULT_KDF_ITERATIONS')
          ? parseInt(runtimeEnvValue('VAULT_KDF_ITERATIONS') ?? '600000')
          : 600000,
        keepTempOnClose: runtimeEnvValue('VAULT_KEEP_TEMP_ON_CLOSE') === 'true'
      },
      sync: {
        pushIntervalMs: runtimeEnvValue('SYNC_PUSH_INTERVAL_MS')
          ? parseInt(runtimeEnvValue('SYNC_PUSH_INTERVAL_MS') ?? '120000')
          : 120000,
        cronEnabled: runtimeEnvValue('SYNC_CRON_ENABLED') === 'true',
        pushCronExpression: runtimeEnvValue('SYNC_PUSH_CRON_EXPRESSION') || '*/10 * * * *',
        pullCronExpression: runtimeEnvValue('SYNC_PULL_CRON_EXPRESSION') || '*/15 * * * *'
      },
      channels: {
        telegramChannelId: runtimeEnvValue('TELEGRAM_CHANNEL_ID'),
        slackChannelId: runtimeEnvValue('SLACK_CHANNEL_ID'),
        teamsChannelId: runtimeEnvValue('TEAMS_CHANNEL_ID')
      },
      virtualDrives: {
        // In development on Windows, mounting to drive letters like "S:" can fail
        // even when rclone exists (for example when WinFsp is unavailable), which
        // then breaks auth/status storage by pointing app data to an invalid root.
        // Keep production behavior fail-closed, but default dev to fallback storage
        // unless explicitly overridden via CHAKRA_VIRTUAL_DRIVE_ENABLED/DHI_...
        enabled: runtimeBooleanValue('VIRTUAL_DRIVE_ENABLED') ?? !isDevelopment,
        // Forward the generated drive key directly to the crypt remote so Prana
        // does not need to fall back through the vault → archivePassword chain.
        systemCryptPassword: runtimeEnvValue('VAULT_ARCHIVE_PASSWORD'),
        // Fail-closed in production: mount failure blocks startup rather than
        // silently falling back to unencrypted local storage.
        failClosed: runtimeBooleanValue('VIRTUAL_DRIVE_FAIL_CLOSED') ?? !isDevelopment
      }
    }

    setPranaRuntimeConfig(config)
    console.info('[Chakra] Injected environment into Prana platform runtime')
  } catch (error) {
    console.warn('[Chakra] Failed to inject environment into Prana platform runtime', error)
  }

  // Register IPC handlers BEFORE running safety checks
  // This ensures the renderer can communicate with main process
  try {
    const { ipcMain } = await import('electron')
    const { checkHostDependenciesStaged } = await import('./services/startupSecurity')
    ipcMain.handle('app:check-host-dependencies', async () => {
      const diagnostics = await checkHostDependenciesStaged()
      return {
        passed: diagnostics.every((d) => d.available),
        diagnostics
      }
    })
    console.info('[Chakra] Registered app:check-host-dependencies IPC handler')
  } catch (error) {
    console.warn('[Chakra] Could not register dependency check IPC:', error)
  }

  // Pre-splash safety: validate startup env keys before renderer bootstrap.
  // SSH/auth verification is deferred to the splash screen flow
  // (app:bootstrap-host seeds SQLite, then startupOrchestrator verifies SSH).
  // Calling authService.getStatus() here would crash because
  // getRuntimeBootstrapConfig() throws when SQLite is empty (Cold-Vault design).
  const startupSafety = await verifyStartupSafety({ env: process.env })

  if (!startupSafety.allowed) {
    console.error('[Chakra] Unsafe startup blocked:', startupSafety)
    // Pass diagnostics via URL params so renderer can display stepper states
    const diagnosticsJson = JSON.stringify(startupSafety.issues)
    void showUnsafeStartupWindow(startupSafety.message, diagnosticsJson)
    return
  }

  warnWeakVaultConfig(process.env)

  // css-tree's CJS build reads ../data/patch.json relative to bundled chunks.
  // In dev/runtime bundling that file may be absent under out/main/data.
  try {
    const cssTreePackagePath = require.resolve('css-tree/package.json')
    const cssTreePackageDir = dirname(cssTreePackagePath)
    const cssTreePatchSource = join(cssTreePackageDir, 'data', 'patch.json')
    const cssTreePatchTargetDir = join(__dirname, 'data')
    const cssTreePatchTarget = join(cssTreePatchTargetDir, 'patch.json')
    if (!existsSync(cssTreePatchTarget)) {
      mkdirSync(cssTreePatchTargetDir, { recursive: true })
      copyFileSync(cssTreePatchSource, cssTreePatchTarget)
    }
  } catch (error) {
    console.warn('[Chakra] Could not stage css-tree patch.json runtime asset', error)
  }

  await import('prana/main/index')

  try {
    await import('prana/main/services/driveControllerService')
    // Prana mounts system storage during app:bootstrap-host after runtime config
    // is validated and seeded. Mounting here can force app data root to an
    // unavailable drive letter (for example "S:") before bootstrap completes.
    registerDriveLifecycleHooks()
  } catch (error) {
    console.warn('[Chakra] Could not register virtual drive lifecycle hooks:', error)
  }

  try {
    const { ipcMain } = await import('electron')
    const { driveControllerService } = await import('prana/main/services/driveControllerService')
    const { driveLayoutService } = await import('./services/driveLayoutService')
    ipcMain.handle('chakra:ensure-drive-layout', async () => {
      try {
        const driveRoot = driveControllerService.getSystemDataRoot()
        const created = await driveLayoutService.ensureDirectories(driveRoot)

        // Route SQLite to S:\cache\sqlite (matching drive-layout.json) so that
        // authStoreService.mkdir(getSqliteRoot()) never targets the bare drive root.
        // This works around authStoreService using bare mkdir() without the WinFsp
        // EPERM guard that mkdirSafe() provides (pending Prana fix in authStoreService.ts).
        try {
          const { setSqliteRootOverride } = await import('prana/main/services/governanceRepoService')
          const sqliteRoot = join(driveRoot, 'cache', 'sqlite')
          setSqliteRootOverride(sqliteRoot)
          console.info('[Chakra] SQLite root pinned to cache/sqlite under drive root')

          console.info('[Chakra] SQLite root set; employee store will lazy-init on first use')
        } catch (sqliteErr) {
          console.warn('[Chakra] Could not pin SQLite root override:', sqliteErr)
        }

        return { ok: true, driveRoot, createdCount: created.length }
      } catch (err) {
        console.warn('[Chakra] ensureDirectories failed (non-fatal):', err)
        return { ok: false, error: (err as Error)?.message ?? 'unknown error' }
      }
    })
    console.info('[Chakra] Registered chakra:ensure-drive-layout IPC handler')
  } catch (error) {
    console.warn('[Chakra] Could not register chakra:ensure-drive-layout IPC:', error)
  }

  // Google Sheets integration IPC handlers
  try {
    const { ipcMain } = await import('electron')
    const googleAuth = await import('./services/googleAuthService')
    const sheetsSync = await import('./services/sheetsSyncService')
    const employeeStore = await import('./services/employeeStoreService')

    ipcMain.handle('chakra:google-auth-status', async () => {
      const clientId = runtimeEnvValue('GOOGLE_CLIENT_ID') ?? ''
      const clientSecret = runtimeEnvValue('GOOGLE_CLIENT_SECRET') ?? ''
      if (!clientId || !clientSecret) {
        return { authenticated: false, error: 'GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured.' }
      }
      return googleAuth.getAuthStatus(clientId, clientSecret)
    })

    ipcMain.handle('chakra:google-auth-start', async () => {
      const clientId = runtimeEnvValue('GOOGLE_CLIENT_ID') ?? ''
      const clientSecret = runtimeEnvValue('GOOGLE_CLIENT_SECRET') ?? ''
      if (!clientId || !clientSecret) {
        return { success: false, error: 'GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured in .env.' }
      }
      return googleAuth.runOAuthFlow(clientId, clientSecret)
    })

    ipcMain.handle('chakra:google-auth-revoke', async () => {
      await googleAuth.clearStoredAuth()
      return { success: true }
    })

    ipcMain.handle('chakra:sheets-employee-sheet-set', async (_event, payload: { employee_sheet_id: string }) => {
      await googleAuth.saveEmployeeSheetId(payload.employee_sheet_id)
      return { success: true }
    })

    ipcMain.handle('chakra:sheets-sync', async () => {
      const clientId = runtimeEnvValue('GOOGLE_CLIENT_ID') ?? ''
      const clientSecret = runtimeEnvValue('GOOGLE_CLIENT_SECRET') ?? ''

      if (!clientId || !clientSecret) {
        return { success: false, errors: ['Google OAuth credentials not configured in .env.'], employeesLoaded: 0, departmentsLoaded: 0, designationsLoaded: 0 }
      }

      const accessToken = await googleAuth.getValidAccessToken(clientId, clientSecret)
      if (!accessToken) {
        return { success: false, errors: ['Not authenticated with Google. Run chakra:google-auth-start first.'], employeesLoaded: 0, departmentsLoaded: 0, designationsLoaded: 0 }
      }

      const stored = await googleAuth.getAuthStatus(clientId, clientSecret)
      const spreadsheetId = stored?.employee_sheet_id ?? runtimeEnvValue('GOOGLE_EMPLOYEE_SHEET_ID') ?? ''

      if (!spreadsheetId) {
        return { success: false, errors: ['Spreadsheet ID not configured. Set MAIN_VITE_CHAKRA_GOOGLE_EMPLOYEE_SHEET_ID in .env.'], employeesLoaded: 0, departmentsLoaded: 0, designationsLoaded: 0 }
      }

      return sheetsSync.syncHrFromSheets(accessToken, spreadsheetId)
    })

    ipcMain.handle('chakra:auth-login', async (_event, payload: { email: string; password: string }) => {
      const { email, password } = payload

      const populated = await employeeStore.hasEmployees()
      if (!populated) {
        return {
          success: false,
          reason: 'no_employees',
          directorName: null,
          email: null,
          isFirstInstall: false,
          sessionToken: null
        }
      }

      const result = await employeeStore.loginEmployee(email, password)
      if (result.success) {
        return {
          success: true,
          directorName: result.employee?.full_name ?? null,
          email: result.employee?.email ?? null,
          isFirstInstall: false,
          sessionToken: result.sessionToken ?? null
        }
      }

      return {
        success: false,
        reason: result.reason === 'invalid_password' ? 'invalid_credentials' : result.reason,
        directorName: null,
        email: null,
        isFirstInstall: false,
        sessionToken: null
      }
    })

    console.info('[Chakra] Registered Google Sheets IPC handlers')
  } catch (error) {
    console.warn('[Chakra] Could not register Google Sheets IPC handlers:', error)
  }

  // Ensure SQLite runtime config snapshot exists.
  // In development, overwrite with current env-derived config so stale snapshots
  // cannot pin obsolete virtual-drive settings (for example enabled drive letters).
  // In production, keep first-write behavior to avoid clobbering runtime updates.
  try {
    const { sqliteConfigStoreService } =
      await import('prana/main/services/sqliteConfigStoreService')
    const { getPranaRuntimeConfig } = await import('prana/main/services/pranaRuntimeConfig')
    const currentConfig = getPranaRuntimeConfig()
    if (currentConfig) {
      if (isDevelopment) {
        await sqliteConfigStoreService.overwriteFromRuntimeProps(currentConfig)
        console.info('[Chakra] Refreshed SQLite config snapshot from runtime config (development)')
      } else {
        await sqliteConfigStoreService.seedFromRuntimePropsIfEmpty(currentConfig)
        console.info('[Chakra] Seeded SQLite config store with current runtime config if empty')
      }
    }
  } catch (error) {
    console.warn('[Chakra] Could not seed SQLite config store:', error)
  }

}

loadWorkspaceEnvFile({
  cwd: process.cwd(),
  env: process.env,
  existsSync,
  readFileSync
})
bridgeMainViteRuntimeEnvToRuntime(process.env)
applyPranaRuntimeDefaults(process.env)
ensureWritableDevRuntimePaths({
  env: process.env,
  processId: process.pid,
  getAppPath: (name) => app.getPath(name),
  setAppPath: (name, value) => app.setPath(name, value),
  existsSync,
  mkdirSync
})

void bootstrapPranaMain()
