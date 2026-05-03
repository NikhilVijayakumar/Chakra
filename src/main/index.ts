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

import { initTemplateRenderer, renderEmailTemplate } from './services/templateRenderer'

let driveLifecycleHooksRegistered = false

// ── Embedded app WebContentsView state ────────────────────────────────────────
let activeEmbeddedView: import('electron').WebContentsView | null = null
let embeddedViewResizeHandler: (() => void) | null = null
let embeddedViewWindow: import('electron').BrowserWindow | null = null
const EMBEDDED_TOP_BAR_H = 52

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
          const sqliteRoot = join(driveRoot, 'cache', 'sqlite')

          // Tell Prana services (authStoreService etc.) about the new root
          const { setSqliteRootOverride } = await import('prana/main/services/governanceRepoService')
          setSqliteRootOverride(sqliteRoot)
          console.info('[Chakra] SQLite root pinned to cache/sqlite under drive root')

          // Tell Chakra's own employeeStoreService directly — avoids the
          // cross-chunk require() that fails in the built output
          const { setSqliteRoot } = await import('./services/employeeStoreService')
          setSqliteRoot(sqliteRoot)
          console.info('[Chakra] SQLite root set; employee store will lazy-init on first use')
        } catch (sqliteErr) {
          console.warn('[Chakra] Could not pin SQLite root override:', sqliteErr)
        }

        // Fire startup sync in background — does not block the boot response
        void (async () => {
          try {
            const serviceAccount = await import('./services/googleServiceAccountService')
            const status = await serviceAccount.getServiceAccountStatus()
            if (!status.available) return

            const { getStoredSheetId } = await import('./services/employeeStoreService')
            const spreadsheetId =
              (await getStoredSheetId()) ??
              runtimeEnvValue('GOOGLE_EMPLOYEE_SHEET_ID') ??
              ''
            if (!spreadsheetId) return

            const { syncHrFromSheets, syncAppsFromSheets } = await import('./services/sheetsSyncService')
            const [hr, apps] = await Promise.all([
              syncHrFromSheets(spreadsheetId),
              syncAppsFromSheets(spreadsheetId)
            ])
            console.info(
              `[Chakra] Startup sync complete — employees: ${hr.employeesLoaded}, apps: ${apps.appsLoaded}`
            )
          } catch (err) {
            console.warn('[Chakra] Startup sync failed (non-fatal):', err)
          }
        })()

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
    const serviceAccount = await import('./services/googleServiceAccountService')
    const sheetsSync = await import('./services/sheetsSyncService')
    const employeeStore = await import('./services/employeeStoreService')

    ipcMain.handle('chakra:google-auth-status', async () => {
      const status = await serviceAccount.getServiceAccountStatus()
      const sheetId = await employeeStore.getStoredSheetId()
      return {
        authenticated: status.available,
        serviceAccountEmail: status.email,
        employee_sheet_id: sheetId ?? undefined,
        error: status.error
      }
    })

    ipcMain.handle('chakra:sheets-employee-sheet-set', async (_event, payload: { employee_sheet_id: string }) => {
      await employeeStore.saveEmployeeSheetId(payload.employee_sheet_id)
      return { success: true }
    })

    ipcMain.handle('chakra:sheets-sync', async () => {
      const zeros = { departmentsLoaded: 0, designationsLoaded: 0, employeesLoaded: 0 }
      try {
        const status = await serviceAccount.getServiceAccountStatus()
        if (!status.available) {
          return { success: false, errors: [status.error ?? 'Service account key not available'], ...zeros }
        }
        const spreadsheetId = (await employeeStore.getStoredSheetId()) ?? runtimeEnvValue('GOOGLE_EMPLOYEE_SHEET_ID') ?? ''
        if (!spreadsheetId) {
          return { success: false, errors: ['Spreadsheet ID not configured. Enter it in Google Sheets Settings.'], ...zeros }
        }
        return sheetsSync.syncHrFromSheets(spreadsheetId)
      } catch (err) {
        return { success: false, errors: [(err as Error).message ?? 'Sync failed'], ...zeros }
      }
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

  // Email service for OTP verification
  try {
    const { ipcMain } = await import('electron')
    const { configureChakraEmailService, sendChakraEmail } = await import('./services/chakraEmailService')

    const agentMailApiKey = process.env.CHAKRA_AGENTMAIL_API_KEY ?? process.env.MAIN_VITE_CHAKRA_AGENTMAIL_API_KEY
    const systemInboxId = process.env.CHAKRA_SYSTEM_INBOX_ID ?? process.env.MAIN_VITE_CHAKRA_SYSTEM_INBOX_ID

    if (agentMailApiKey && systemInboxId) {
      initTemplateRenderer()

      const templateRenderer = async (templateName: string, data: any): Promise<string> => {
        try {
          return await renderEmailTemplate(templateName, data)
        } catch (error) {
          console.error('[EMAIL] Template render failed:', error)
          return ''
        }
      }

      configureChakraEmailService(agentMailApiKey, systemInboxId, templateRenderer)
      console.info('[Chakra] Configured email service with AgentMail (chakraEmailService)')
    } else {
      console.warn('[Chakra] Email service not configured - missing AGENTMAIL_API_KEY or SYSTEM_INBOX_ID')
    }

    ipcMain.handle('chakra:send-otp-email', async (_event, payload: { email: string; otp: string }) => {
      try {
        const result = await sendChakraEmail({
          to: [payload.email],
          subject: '[Chakra] Password Reset OTP',
          templateName: 'otp-email',
          data: { otpCode: payload.otp, expiryMinutes: 5 }
        })
        return { success: result.success, error: result.error }
      } catch (error) {
        console.error('[Chakra] Failed to send OTP email:', error)
        return { success: false, error: (error as Error).message }
      }
    })
    console.info('[Chakra] Registered chakra:send-otp-email IPC handler')

    ipcMain.handle('chakra:forgot-password', async (_event, payload: { email: string }) => {
      try {
        const email = payload.email.trim().toLowerCase()
        const employeeStore = await import('./services/employeeStoreService')
        
        const isActive = await employeeStore.checkActiveEmployee(email)
        if (!isActive) {
          return { success: false, reason: 'email_mismatch' }
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const bcrypt = (await import('bcryptjs')).default
        const codeHash = await bcrypt.hash(otp, 10)
        const codeExpiry = Date.now() + 5 * 60 * 1000 // 5 minutes

        // Use the configured chakraEmailService
        console.info('[Chakra] forgot-password: sending OTP email to', email)
        const emailResult = await sendChakraEmail({
          to: [email],
          subject: '[Chakra] Password Reset OTP',
          templateName: 'otp-email',
          data: { otpCode: otp, expiryMinutes: 5 }
        })
        console.info('[Chakra] forgot-password: email result:', JSON.stringify(emailResult))

        if (!emailResult.success) {
          console.error('[Chakra] forgot-password: email_failed reason:', emailResult.error)
          return { success: false, reason: 'email_failed' }
        }

        const saved = await employeeStore.saveEmployeeOtp(email, codeHash, codeExpiry)
        if (!saved) {
          return { success: false, reason: 'db_error' }
        }

        return { success: true }
      } catch (err) {
        console.error('[Chakra] forgot-password failed:', err)
        return { success: false, reason: 'unknown_error' }
      }
    })
    console.info('[Chakra] Registered chakra:forgot-password IPC handler')

    // Bypass: validate email without sending OTP (for development/testing)
    ipcMain.handle('chakra:validate-employee-email', async (_event, payload: { email: string }) => {
      try {
        const email = payload.email.trim().toLowerCase()
        const employeeStore = await import('./services/employeeStoreService')
        const isActive = await employeeStore.checkActiveEmployee(email)
        if (!isActive) {
          return { success: false, reason: 'email_mismatch' }
        }
        return { success: true }
      } catch (err) {
        console.error('[Chakra] validate-employee-email failed:', err)
        return { success: false, reason: 'unknown_error' }
      }
    })
    console.info('[Chakra] Registered chakra:validate-employee-email IPC handler')

    ipcMain.handle('chakra:verify-otp', async (_event, payload: { email: string, otp: string }) => {
      try {
        const employeeStore = await import('./services/employeeStoreService')
        const result = await employeeStore.verifyEmployeeOtp(payload.email, payload.otp)
        return result
      } catch (err) {
        console.error('[Chakra] verify-otp failed:', err)
        return { success: false, reason: 'unknown_error' }
      }
    })
    console.info('[Chakra] Registered chakra:verify-otp IPC handler')

    ipcMain.handle('chakra:reset-password', async (_event, payload: { email: string, newPassword: string }) => {
      try {
        const email = payload.email.trim().toLowerCase()
        const employeeStore = await import('./services/employeeStoreService')
        const bcrypt = (await import('bcryptjs')).default
        const hash = await bcrypt.hash(payload.newPassword, 10)

        // Step 1: SQLite update — marks isDirty=true
        const saved = await employeeStore.updateEmployeePassword(email, hash)
        if (!saved) return { success: false, reason: 'db_error' }

        // Step 2: Sheets push with up to 3 retries
        const MAX_RETRIES = 3
        let pushed = false
        let lastErr = ''
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          try {
            const serviceAccount = await import('./services/googleServiceAccountService')
            const accessToken = await serviceAccount.getServiceAccountToken()
            const spreadsheetId =
              (await employeeStore.getStoredSheetId()) ??
              process.env.CHAKRA_GOOGLE_EMPLOYEE_SHEET_ID ??
              process.env.MAIN_VITE_CHAKRA_GOOGLE_EMPLOYEE_SHEET_ID
            if (!spreadsheetId) { lastErr = 'No spreadsheet ID configured'; break }
            const sheetsService = await import('./services/googleSheetsService')
            await sheetsService.updateEmployeePasswordInSheet(spreadsheetId, accessToken, email, hash)
            pushed = true
            break
          } catch (err) {
            lastErr = (err as Error).message
            console.warn(`[Chakra] reset-password: Sheets push attempt ${attempt}/${MAX_RETRIES} failed:`, lastErr)
            if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, 1000))
          }
        }

        if (!pushed) {
          // isDirty=true remains — next startup sync will push it
          console.warn('[Chakra] reset-password: Sheets push failed after all retries, leaving isDirty=true')
          return { success: false, reason: 'sheets_push_failed', detail: lastErr }
        }

        // Step 3: Clear dirty flag after confirmed push
        const { getDb } = await import('./db/init')
        const { employees } = await import('./db/schema')
        const { eq } = await import('drizzle-orm')
        getDb().update(employees).set({ isDirty: false }).where(eq(employees.email, email)).run()
        console.info('[Chakra] reset-password: complete for', email)

        return { success: true }
      } catch (err) {
        console.error('[Chakra] reset-password failed:', err)
        return { success: false, reason: 'unknown_error' }
      }
    })
    console.info('[Chakra] Registered chakra:reset-password IPC handler')
  } catch (error) {
    console.warn('[Chakra] Could not register email service IPC handlers:', error)
  }

  // App install / access IPC handlers
  try {
    const { ipcMain } = await import('electron')
    const appSvc = await import('./services/appInstallService')
    const { syncAppsFromSheets } = await import('./services/sheetsSyncService')
    const employeeStore = await import('./services/employeeStoreService')

    ipcMain.handle('chakra:sync-app-sheets', async () => {
      const zeros = { appsLoaded: 0, appUsersLoaded: 0, appTeamsLoaded: 0, teamsLoaded: 0, employeeTeamsLoaded: 0 }
      try {
        const serviceAccount = await import('./services/googleServiceAccountService')
        const status = await serviceAccount.getServiceAccountStatus()
        if (!status.available) {
          return { success: false, errors: [status.error ?? 'Service account not available'], ...zeros }
        }
        const spreadsheetId = (await employeeStore.getStoredSheetId()) ?? runtimeEnvValue('GOOGLE_EMPLOYEE_SHEET_ID') ?? ''
        if (!spreadsheetId) {
          return { success: false, errors: ['Spreadsheet ID not configured'], ...zeros }
        }
        return syncAppsFromSheets(spreadsheetId)
      } catch (err) {
        return { success: false, errors: [(err as Error).message ?? 'Sync failed'], ...zeros }
      }
    })

    ipcMain.handle('chakra:get-user-apps', async (_event, payload: { email: string }) => {
      try {
        const employeeId = appSvc.getEmployeeIdByEmail(payload.email)
        if (!employeeId) {
          return { success: false, error: 'Employee not found', apps: [] }
        }
        const userApps = appSvc.getUserAccessibleApps(employeeId)
        return { success: true, apps: userApps }
      } catch (err) {
        return { success: false, error: (err as Error).message, apps: [] }
      }
    })

    ipcMain.handle('chakra:install-app', async (event, payload: { appId: string; appName: string; cloneUrl: string }) => {
      try {
        // Resolve commit hash from DB (Apps table) so renderer doesn't need to pass it
        const { getDb } = await import('./db/init')
        const { apps: appsTable } = await import('./db/schema')
        const { eq } = await import('drizzle-orm')
        const db = getDb()
        const appRow = db.select().from(appsTable).where(eq(appsTable.id, payload.appId)).get()
        const commitHash = appRow?.commitHash?.trim() || null

        const result = await appSvc.installApp(
          payload.appId,
          payload.appName,
          payload.cloneUrl,
          commitHash,
          (step, percent, log) => {
            try { event.sender.send('chakra:install-progress', { step, percent, log }) } catch { /* renderer navigated away */ }
          }
        )
        return { success: true, installPath: result.installPath }
      } catch (err) {
        return { success: false, error: (err as Error).message }
      }
    })

    ipcMain.handle('chakra:uninstall-app', async (_event, payload: { appId: string }) => {
      try {
        await appSvc.uninstallApp(payload.appId)
        return { success: true }
      } catch (err) {
        return { success: false, error: (err as Error).message }
      }
    })

    // ── Embedded launch via WebContentsView ─────────────────────────────────
    ipcMain.handle('chakra:launch-webview', async (event, payload: { appId: string }) => {
      try {
        const { WebContentsView, BrowserWindow } = await import('electron')
        const win = BrowserWindow.fromWebContents(event.sender)
        if (!win) return { success: false, error: 'No window found' }

        const { installPath } = appSvc.getInstallRecord(payload.appId)
        if (!installPath || !existsSync(installPath)) {
          return { success: false, error: 'App is not installed' }
        }

        const entryPoint = appSvc.findAppEntryPoint(installPath)
        if (!entryPoint) {
          return { success: false, error: 'No built output found. Reinstall the app to build it.' }
        }

        // Clean up any existing embedded view
        if (activeEmbeddedView && embeddedViewWindow) {
          try { embeddedViewWindow.contentView.removeChildView(activeEmbeddedView) } catch { /* ignore */ }
          if (embeddedViewResizeHandler) embeddedViewWindow.off('resize', embeddedViewResizeHandler)
          try { activeEmbeddedView.webContents.close() } catch { /* ignore */ }
          activeEmbeddedView = null
          embeddedViewResizeHandler = null
          embeddedViewWindow = null
        }

        const view = new WebContentsView({
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false
          }
        })

        const [w, h] = win.getContentSize()
        view.setBounds({ x: 0, y: EMBEDDED_TOP_BAR_H, width: w, height: h - EMBEDDED_TOP_BAR_H })
        win.contentView.addChildView(view)
        await view.webContents.loadFile(entryPoint)

        activeEmbeddedView = view
        embeddedViewWindow = win

        embeddedViewResizeHandler = () => {
          if (!activeEmbeddedView) return
          const [nw, nh] = win.getContentSize()
          activeEmbeddedView.setBounds({ x: 0, y: EMBEDDED_TOP_BAR_H, width: nw, height: nh - EMBEDDED_TOP_BAR_H })
        }
        win.on('resize', embeddedViewResizeHandler)

        console.info(`[Chakra] Embedded app launched: ${payload.appId} → ${entryPoint}`)
        return { success: true }
      } catch (err) {
        return { success: false, error: (err as Error).message }
      }
    })

    ipcMain.handle('chakra:exit-webview', async (event) => {
      try {
        const { BrowserWindow } = await import('electron')
        const win = BrowserWindow.fromWebContents(event.sender)
        if (activeEmbeddedView) {
          const targetWin = embeddedViewWindow ?? win
          if (targetWin) {
            try { targetWin.contentView.removeChildView(activeEmbeddedView) } catch { /* ignore */ }
            if (embeddedViewResizeHandler) targetWin.off('resize', embeddedViewResizeHandler)
          }
          try { activeEmbeddedView.webContents.close() } catch { /* ignore */ }
          activeEmbeddedView = null
          embeddedViewResizeHandler = null
          embeddedViewWindow = null
        }
        return { success: true }
      } catch (err) {
        return { success: false, error: (err as Error).message }
      }
    })

    console.info('[Chakra] Registered app install IPC handlers')
  } catch (error) {
    console.warn('[Chakra] Could not register app install IPC handlers:', error)
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
