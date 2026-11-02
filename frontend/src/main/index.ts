import { app, BrowserWindow } from 'electron'
import { copyFileSync, existsSync, mkdirSync, readFileSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'

// Patch better-sqlite3 Statement prototype to add sql.js compat shims.
// Prana's sqlite services were written against sql.js API (free/bind/step/getAsObject)
// but the runtime uses better-sqlite3 which lacks those methods.
;(() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const BetterSQLite3 = require('better-sqlite3') as typeof import('better-sqlite3')
    const _db = new BetterSQLite3(':memory:')
    const _stmt = _db.prepare('SELECT 1')
    const proto = Object.getPrototypeOf(_stmt) as Record<string, unknown>
    _db.close()

    if (!proto.free) {
      proto.free = function () { return true }
    }

    if (!proto.bind) {
      proto.bind = function (params?: unknown[] | unknown) {
        this._sqlJsBound = Array.isArray(params) ? params : params !== undefined ? [params] : []
        return true
      }
    }

    // Wrap get/all/run so bound params are used when no args supplied
    const origGet = proto.get as (...a: unknown[]) => unknown
    proto.get = function (...args: unknown[]) {
      if (args.length === 0 && this._sqlJsBound?.length) return origGet.call(this, ...this._sqlJsBound)
      return origGet.call(this, ...args)
    }

    const origAll = proto.all as (...a: unknown[]) => unknown
    proto.all = function (...args: unknown[]) {
      if (args.length === 0 && this._sqlJsBound?.length) return origAll.call(this, ...this._sqlJsBound)
      return origAll.call(this, ...args)
    }

    if (!proto.step) {
      proto.step = function () {
        if (!this._sqlJsIter) {
          this._sqlJsIter = (this.iterate as (...a: unknown[]) => Iterable<unknown>)(...(this._sqlJsBound ?? []))
        }
        this._sqlJsCurrent = (this._sqlJsIter as Iterator<unknown>).next()
        return !(this._sqlJsCurrent as IteratorResult<unknown>).done
      }
    }

    if (!proto.getAsObject) {
      proto.getAsObject = function () {
        return (this._sqlJsCurrent as IteratorResult<unknown>)?.value ?? {}
      }
    }
  } catch {
    // better-sqlite3 unavailable — skip patching
  }
})()
import {
  applyPranaRuntimeDefaults,
  bridgeMainViteRuntimeEnvToRuntime,
  ensureWritableDevRuntimePaths,
  loadWorkspaceEnvFile,
  resolveRendererUrl
} from './services/runtimeEnv'
import { verifyStartupSafety } from './services/startupSecurity'
import { setPranaPlatformRuntime } from 'prana/main/services/pranaPlatformRuntime'
import { setPranaRuntimeConfig } from 'prana/main/services/pranaRuntimeConfig'

import { initTemplateRenderer, renderEmailTemplate } from './services/templateRenderer'

// ── Embedded app WebContentsView state ────────────────────────────────────────
let activeEmbeddedView: import('electron').WebContentsView | null = null
let embeddedViewResizeHandler: (() => void) | null = null
let embeddedViewWindow: import('electron').BrowserWindow | null = null
const EMBEDDED_TOP_BAR_H = 52
// Set to true by exit-webview to abort any in-progress loadFile in launch-webview.
// Prevents orphaned views when the user exits before the initial load completes.
let activeLaunchCancelled = false

// ── Active plugin session (capability-governed IPC gateway) ───────────────────
// Tracks which plugin is running and what it is allowed to do.
// Only one plugin runs at a time; capabilities are cleared on exit.
interface ActivePluginSession {
  appId: string
  runtimeId: string
  capabilities: {
    sqlite?: { read: boolean; write: boolean }
    vault?: { read: boolean; write: boolean }
    notifications?: { emit: boolean }
    sync?: { read: boolean }
  }
  webContentsId: number
  sandboxSessionId: string
}
let activePlugin: ActivePluginSession | null = null

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

  // Removes a corrupt runtime-config.sqlite from the Prana app-data dir so that
  // initializeDatabase() can start fresh with an in-memory DB on the next attempt.
  const recoverCorruptPranaDb = async (): Promise<void> => {
    const home = process.env.USERPROFILE || process.env.HOME || ''
    const pranaDir = join(home, '.prana')
    const dhiDir = join(home, '.dhi')
    const appDir = (existsSync(dhiDir) && !existsSync(pranaDir)) ? dhiDir : pranaDir
    for (const f of [join(appDir, 'runtime-config.sqlite'), join(appDir, 'runtime-config.sqlite.tmp')]) {
      if (existsSync(f)) { unlinkSync(f); console.info('[Chakra] Deleted corrupt Prana DB file:', f) }
    }
    const { sqliteConfigStoreService: scs } = await import('prana/main/services/sqliteConfigStoreService')
    const { getPranaRuntimeConfig: getRtCfg } = await import('prana/main/services/pranaRuntimeConfig')
    const cfg = getRtCfg()
    if (cfg) {
      if (isDevelopment) {
        await scs.overwriteFromRuntimeProps(cfg)
      } else {
        await scs.seedFromRuntimePropsIfEmpty(cfg)
      }
    }
  }

  try {
    setPranaPlatformRuntime({
      ...(rendererUrl ? { rendererUrl } : {}),
      inheritedEnv: process.env as Record<string, string>,
      homeDir: process.env.HOME || process.env.USERPROFILE,
      userProfileDir: process.env.USERPROFILE
    })

    // Runtime config source: chakra-runtime.json (serviceAccountKeyPath + configSheetId).
    // All master data syncs from the configured Google Sheet into SQLite on boot.

    // Set Prana's internal SQLite root to a path near the app.
    // Dev:  <repo>/data/prana  (inside the project, easy to inspect and wipe)
    // Prod: <exe-dir>/data/prana  (next to the installed executable)
    try {
      const sqliteRoot = isDevelopment
        ? join(app.getAppPath(), 'data', 'prana')
        : join(dirname(app.getPath('exe')), 'data', 'prana')
      if (!existsSync(sqliteRoot)) {
        mkdirSync(sqliteRoot, { recursive: true })
      }
      const { setSqliteRootOverride } = await import('prana/main/services/governanceRepoService')
      setSqliteRootOverride(sqliteRoot)
      console.info(`[Chakra] SQLite root: ${sqliteRoot}`)
    } catch (err) {
      console.warn('[Chakra] Could not set SQLite root override at boot:', err)
    }

    let sqliteSyncConfig = null
    try {
      const { buildSyncConfigFromSQLite } = await import('./services/configStoreService')
      sqliteSyncConfig = buildSyncConfigFromSQLite()
    } catch {
      // SQLite not ready on first run — sync defaults apply
    }

    const config = {
      director: {
        name: runtimeEnvValue('DEFAULT_COMPANY') || 'Chakra Host',
        email: runtimeEnvValue('DIRECTOR_EMAIL') || 'host@bavans.app',
      },
      governance: {
        repoUrl: 'not-configured',
        repoPath: 'not-configured'
      },
      vault: {
        specVersion: 'v1',
        tempZipExtension: '.vdhi',
        outputPrefix: 'chakra_vault_export_',
        // Prana sandbox manages vault internally. Placeholders satisfy the schema;
        // Chakra never accesses vault directly.
        archivePassword: 'chakra-host',
        archiveSalt: 'chakra-host-salt',
        kdfIterations: 210000,
        keepTempOnClose: false
      },
      sync: sqliteSyncConfig?.sync ?? {
        pushIntervalMs: 120000,
        cronEnabled: false,
        pushCronExpression: '*/10 * * * *',
        pullCronExpression: '*/15 * * * *'
      },
      channels: {
        telegramChannelId: runtimeEnvValue('TELEGRAM_CHANNEL_ID'),
        slackChannelId: runtimeEnvValue('SLACK_CHANNEL_ID'),
        teamsChannelId: runtimeEnvValue('TEAMS_CHANNEL_ID')
      },
      virtualDrives: { enabled: false, failClosed: false }
    }

    setPranaRuntimeConfig(config)
    console.info('[Chakra] Prana runtime config set')
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

  const { registerIpcHandlers } = await import('prana/main/index')
  registerIpcHandlers()
  console.info('[Chakra] Registered Prana IPC handlers')

  // Seed the SQLite bootstrap config immediately after Prana registers its
  // window-all-closed / before-quit handlers (which call cleanupTemporaryWorkspace).
  // Without this, closing the window before the late seeding block at the bottom
  // of this function causes an unhandled [PRANA_CONFIG_ERROR] rejection.
  try {
    const { sqliteConfigStoreService } =
      await import('prana/main/services/sqliteConfigStoreService')
    const { getPranaRuntimeConfig } = await import('prana/main/services/pranaRuntimeConfig')
    const currentConfig = getPranaRuntimeConfig()
    if (currentConfig) {
      if (isDevelopment) {
        await sqliteConfigStoreService.overwriteFromRuntimeProps(currentConfig)
        console.info('[Chakra] Early-seeded SQLite config snapshot from runtime config (development)')
      } else {
        await sqliteConfigStoreService.seedFromRuntimePropsIfEmpty(currentConfig)
        console.info('[Chakra] Early-seeded SQLite config store with current runtime config if empty')
      }
    } else {
      console.warn('[Chakra] Early seed skipped: runtime config not available yet')
    }
  } catch (error: any) {
    if (error?.code === 'SQLITE_NOTADB') {
      try {
        await recoverCorruptPranaDb()
        console.info('[Chakra] Early SQLite config seeded after corrupt DB recovery')
      } catch (retryErr) {
        console.warn('[Chakra] Early SQLite recovery retry failed:', retryErr)
      }
    } else {
      console.warn('[Chakra] Early SQLite config seed failed:', error)
    }
  }

  // ── Sandbox-based post-boot: set up local SQLite paths + background sync ──────
  // Replaces the old virtual-drive-based chakra:ensure-drive-layout flow.
  // Apps are now isolated via Prana's sandboxRuntimeEngine (process isolation),
  // not filesystem virtual drives.
  try {
    const { ipcMain } = await import('electron')

    // Keep the old IPC name so the existing renderer code keeps working.
    // SQLite root is already set at boot — this is a no-op confirmation for the renderer.
    ipcMain.handle('chakra:ensure-drive-layout', async () => ({ ok: true }))
    console.info('[Chakra] Registered chakra:ensure-drive-layout IPC handler (sandbox mode)')
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

    // Full pre-login sync: called from Boot Step 1 — MUST complete before login screen.
    // Order: ChakraConfig (sheet IDs) → Config tab (runtime config) → HR data → app catalog.
    // All data flows: Google Sheets → SQLite cache. App always reads from cache.
    ipcMain.handle('chakra:sheets-sync', async () => {
      const zeros = {
        configsLoaded: 0, departmentsLoaded: 0, designationsLoaded: 0, employeesLoaded: 0,
        attendanceKeysLoaded: 0, holidaysLoaded: 0, leavesLoaded: 0, appsLoaded: 0,
        appUsersLoaded: 0, appTeamsLoaded: 0, teamsLoaded: 0, employeeTeamsLoaded: 0
      }
      const errors: string[] = []

      try {
        const status = await serviceAccount.getServiceAccountStatus()
        if (!status.available) {
          return { success: false, errors: [status.error ?? 'Service account key not available'], ...zeros }
        }

        // Sheet IDs come directly from chakra-runtime.json — not looked up from Google Sheets.
        const { getBootstrapConfigSheetId, getAppCatalogSheetId } = await import('./services/bootstrapConfigService')
        const employeeSheetId = getBootstrapConfigSheetId() ?? ''
        if (!employeeSheetId) {
          return { success: false, errors: ['configSheetId not set in config/chakra-runtime.json'], ...zeros }
        }

        // 3. Sync Config tab from the employee/HR sheet → SQLite configs table (runtime config source).
        const { syncConfigFromSheets, syncHrFromSheets, syncAppsFromSheets } = sheetsSync
        const configResult = await syncConfigFromSheets(employeeSheetId)
        if (!configResult.success) errors.push(...configResult.errors)

        // 4. Refresh sync settings + email service from fresh SQLite values.
        //    Vault/governance are Prana-internal and never sourced from Sheets.
        if (configResult.configsLoaded > 0) {
          try {
            const { buildSyncConfigFromSQLite, buildEmailConfigFromSQLite } =
              await import('./services/configStoreService')
            const { getPranaRuntimeConfig } = await import('prana/main/services/pranaRuntimeConfig')
            const syncConfig = buildSyncConfigFromSQLite()
            if (syncConfig) {
              const current = getPranaRuntimeConfig()
              if (current) {
                setPranaRuntimeConfig({ ...current, sync: syncConfig.sync })
                console.info('[Chakra] Sync config refreshed from Config tab')
              }
            }
            const emailCfg = buildEmailConfigFromSQLite()
            if (emailCfg.agentMailApiKey && emailCfg.systemInboxId) {
              const { configureChakraEmailService } = await import('./services/chakraEmailService')
              const { renderEmailTemplate } = await import('./services/templateRenderer')
              configureChakraEmailService(
                emailCfg.agentMailApiKey,
                emailCfg.systemInboxId,
                async (tpl, data) => { try { return await renderEmailTemplate(tpl, data) } catch { return '' } }
              )
              console.info('[Chakra] Email service reconfigured from Config tab')
            }
          } catch (err) {
            console.warn('[Chakra] Sync config/email refresh failed (non-fatal):', err)
          }
        }

        // 5. Sync employee/HR data (employees, departments, designations, etc.).
        const hrResult = await syncHrFromSheets(employeeSheetId)
        if (!hrResult.success) errors.push(...hrResult.errors)

        // 6. Sync app catalog (separate sheet if appCatalogSheetId set, otherwise same sheet).
        const appCatalogSheetId = getAppCatalogSheetId() ?? ''
        let appsResult = { appsLoaded: 0, appUsersLoaded: 0, appTeamsLoaded: 0, teamsLoaded: 0, employeeTeamsLoaded: 0, errors: [] as string[] }
        if (appCatalogSheetId) {
          appsResult = await syncAppsFromSheets(appCatalogSheetId)
          if (!appsResult) appsResult = { appsLoaded: 0, appUsersLoaded: 0, appTeamsLoaded: 0, teamsLoaded: 0, employeeTeamsLoaded: 0, errors: [] }
          errors.push(...appsResult.errors)
        } else {
          console.warn('[Chakra] App catalog sheet ID not configured — app catalog sync skipped')
        }

        console.info(
          `[Chakra] Pre-login sync complete — configs: ${configResult.configsLoaded}, employees: ${hrResult.employeesLoaded}, apps: ${appsResult.appsLoaded}`
        )

        return {
          success: errors.length === 0,
          configsLoaded: configResult.configsLoaded,
          departmentsLoaded: hrResult.departmentsLoaded,
          designationsLoaded: hrResult.designationsLoaded,
          employeesLoaded: hrResult.employeesLoaded,
          attendanceKeysLoaded: hrResult.attendanceKeysLoaded,
          holidaysLoaded: hrResult.holidaysLoaded,
          leavesLoaded: hrResult.leavesLoaded,
          appsLoaded: appsResult.appsLoaded,
          appUsersLoaded: appsResult.appUsersLoaded,
          appTeamsLoaded: appsResult.appTeamsLoaded,
          teamsLoaded: appsResult.teamsLoaded,
          employeeTeamsLoaded: appsResult.employeeTeamsLoaded,
          errors
        }
      } catch (err) {
        return { success: false, errors: [(err as Error).message ?? 'Sync failed'], ...zeros }
      }
    })

    ipcMain.handle('chakra:check-host-ready', async () => {
      try {
        const hasEmp = await employeeStore.hasEmployees()
        const { getBootstrapConfigSheetId } = await import('./services/bootstrapConfigService')
        const configSheetId = getBootstrapConfigSheetId()
        const saStatus = await serviceAccount.getServiceAccountStatus()

        let employeeCount = 0
        if (hasEmp) {
          try {
            const { getDb } = await import('./db/init')
            const db = getDb()
            const row = db.prepare('SELECT COUNT(*) as count FROM employees').get() as { count: number } | undefined
            employeeCount = row?.count ?? 0
          } catch { /* count is optional */ }
        }

        return {
          ready: hasEmp,
          hasEmployees: hasEmp,
          employeeCount,
          hasConfig: !!configSheetId && saStatus.available,
          configSheetId: configSheetId ?? null,
          serviceAccountEmail: saStatus.email ?? null
        }
      } catch (err) {
        return { ready: false, hasEmployees: false, employeeCount: 0, hasConfig: false, error: (err as Error).message }
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

    // Email config: SQLite configs table (populated from Config tab) → env vars as dev/testing fallback.
    let agentMailApiKey: string | null | undefined
    let systemInboxId: string | null | undefined
    try {
      const { buildEmailConfigFromSQLite } = await import('./services/configStoreService')
      const emailCfg = buildEmailConfigFromSQLite()
      agentMailApiKey = emailCfg.agentMailApiKey
      systemInboxId = emailCfg.systemInboxId
    } catch { /* SQLite not ready */ }
    agentMailApiKey ??= process.env.CHAKRA_AGENTMAIL_API_KEY ?? process.env.MAIN_VITE_CHAKRA_AGENTMAIL_API_KEY
    systemInboxId ??= process.env.CHAKRA_SYSTEM_INBOX_ID ?? process.env.MAIN_VITE_CHAKRA_SYSTEM_INBOX_ID

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
            const { getBootstrapConfigSheetId } = await import('./services/bootstrapConfigService')
            const spreadsheetId = getBootstrapConfigSheetId()
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
        const { getAppCatalogSheetId } = await import('./services/bootstrapConfigService')
        const appCatalogId = getAppCatalogSheetId() ?? ''
        if (!appCatalogId) {
          return { success: false, errors: ['App catalog sheet ID not configured (set configSheetId or appCatalogSheetId in config/chakra-runtime.json)'], ...zeros }
        }
        return syncAppsFromSheets(appCatalogId)
      } catch (err) {
        return { success: false, errors: [(err as Error).message ?? 'Sync failed'], ...zeros }
      }
    })

    // Sync Config tab from the main sheet into SQLite.
    ipcMain.handle('chakra:sync-config', async () => {
      try {
        const { getBootstrapConfigSheetId } = await import('./services/bootstrapConfigService')
        const sheetId = getBootstrapConfigSheetId()
        if (!sheetId) {
          return { success: false, errors: ['configSheetId not set in config/chakra-runtime.json'] }
        }
        const { syncConfigFromSheets } = await import('./services/sheetsSyncService')
        const result = await syncConfigFromSheets(sheetId)
        return { success: result.success, errors: result.errors }
      } catch (err) {
        return { success: false, errors: [(err as Error).message ?? 'Config sync failed'] }
      }
    })

    // Return the currently stored Chakra config (reads from runtime config + SQLite, no network call).
    ipcMain.handle('chakra:get-config', async () => {
      const { getBootstrapConfigSheetId, getAppCatalogSheetId } = await import('./services/bootstrapConfigService')
      const { getChakraConfigValue } = await import('./services/chakraConfigSheetService')
      return {
        companyName: getChakraConfigValue('company_name'),
        employeeSheetId: getBootstrapConfigSheetId(),
        appCatalogSheetId: getAppCatalogSheetId()
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
        // If the app being uninstalled is currently running as an active plugin,
        // force-close its WebContentsView first to release all file locks.
        if (activePlugin?.appId === payload.appId) {
          const targetWin = embeddedViewWindow
          if (activeEmbeddedView) {
            try { targetWin?.contentView.removeChildView(activeEmbeddedView) } catch { /* ignore */ }
            if (embeddedViewResizeHandler && targetWin) targetWin.off('resize', embeddedViewResizeHandler)
            try { activeEmbeddedView.webContents.close() } catch { /* ignore */ }
          }
          if (activePlugin.sandboxSessionId) {
            try {
              const { sandboxRuntimeEngine } = await import('prana/main/features/sandbox/sandboxRuntimeEngine')
              await sandboxRuntimeEngine.stopModuleContainer(activePlugin.sandboxSessionId)
            } catch { /* ignore */ }
          }
          activeEmbeddedView = null
          embeddedViewResizeHandler = null
          embeddedViewWindow = null
          activePlugin = null
          // Give Electron a moment to release file handles before deleting
          await new Promise(r => setTimeout(r, 500))
        }
        await appSvc.uninstallApp(payload.appId)
        return { success: true }
      } catch (err) {
        return { success: false, error: (err as Error).message }
      }
    })

    // ── Embedded launch via WebContentsView (sandbox container model) ──────────
    // Each installed app is a plugin container. Only one runs at a time.
    // Architecture: WebContentsView provides Electron-native process isolation for UI
    // plugins; sandboxRuntimeEngine.startModuleContainer() tracks the lifecycle in the
    // Prana container model (IDLE→RUNNING→DESTROYED) and activates the supervisor.
    ipcMain.handle('chakra:launch-webview', async (event, payload: { appId: string }) => {
      try {
        const { WebContentsView, BrowserWindow } = await import('electron')
        const win = BrowserWindow.fromWebContents(event.sender)
        if (!win) return { success: false, error: 'No window found' }

        // Reset the cancellation flag — a new launch supersedes any prior exit request.
        activeLaunchCancelled = false

        const { installPath } = appSvc.getInstallRecord(payload.appId)
        if (!installPath || !existsSync(installPath)) {
          return { success: false, error: 'App is not installed' }
        }

        const entryPoint = appSvc.findAppEntryPoint(installPath)
        if (!entryPoint) {
          return { success: false, error: 'No built output found. Reinstall the app to build it.' }
        }

        // Read plugin capabilities from runtime.json (or use safe defaults)
        const capabilities = appSvc.getAppCapabilities(installPath)
        const manifest = appSvc.readRuntimeManifest(installPath)
        const runtimeId = manifest?.runtime?.id ?? payload.appId

        // Enforce one plugin at a time: stop the current container before starting a new one
        if (activeEmbeddedView && embeddedViewWindow) {
          try { embeddedViewWindow.contentView.removeChildView(activeEmbeddedView) } catch { /* ignore */ }
          if (embeddedViewResizeHandler) embeddedViewWindow.off('resize', embeddedViewResizeHandler)
          try { activeEmbeddedView.webContents.close() } catch { /* ignore */ }
          if (activePlugin?.sandboxSessionId) {
            try {
              const { sandboxRuntimeEngine } = await import('prana/main/features/sandbox/sandboxRuntimeEngine')
              await sandboxRuntimeEngine.stopModuleContainer(activePlugin.sandboxSessionId)
            } catch { /* ignore — previous container already gone */ }
          }
          activeEmbeddedView = null
          embeddedViewResizeHandler = null
          embeddedViewWindow = null
          activePlugin = null
        }

        // Defensive guard: if a crash left a RUNNING module container behind
        // (crash handler's async stopModuleContainer may have failed or the session
        // was never cleaned up), force-stop it now so startModuleContainer won't throw.
        try {
          const { sandboxRuntimeEngine } = await import('prana/main/features/sandbox/sandboxRuntimeEngine')
          const stuckModule = sandboxRuntimeEngine.listContainers().find(
            (c: { type: string; state: string }) => c.type === 'module' && c.state === 'RUNNING'
          )
          if (stuckModule) {
            // stopModuleContainer resolves the container via getActiveModuleContainer(),
            // not by sessionId. Pass the known sessionId when available so the session
            // manager can clean up properly; fall back to a sentinel for orphaned containers.
            const sid = activePlugin?.sandboxSessionId || 'orphaned'
            await sandboxRuntimeEngine.stopModuleContainer(sid)
            console.warn('[Chakra] Force-stopped orphaned module container before launch')
          }
        } catch { /* ignore — if engine not yet operational, startModuleContainer will handle it */ }

        // Register this app with the sandbox runtime engine for lifecycle tracking.
        // resolveImage reads runtime.json; if absent we build a synthetic RuntimeImage
        // from the appId + entryPoint so the engine still manages a proper container.
        let sandboxSessionId = ''
        try {
          const { sandboxRuntimeEngine } = await import('prana/main/features/sandbox/sandboxRuntimeEngine')
          const { runtimeImageManagerService } = await import('prana/main/features/sandbox/runtimeImageManagerService')
          let image
          try {
            image = await sandboxRuntimeEngine.resolveImage(installPath)
          } catch {
            const synthManifest = {
              schemaVersion: 1,
              runtime: { id: runtimeId, version: '1.0.0', entry: entryPoint },
              permissions: capabilities,
            }
            image = runtimeImageManagerService.resolveFromManifest(synthManifest, entryPoint)
          }
          const session = await sandboxRuntimeEngine.startModuleContainer(image, capabilities)
          sandboxSessionId = session.sessionId
        } catch (engineErr) {
          console.warn('[Chakra] Sandbox engine module start failed (non-fatal):', engineErr)
        }

        // Plugin preload: gives the plugin access only to declared capabilities.
        // Located at out/main/preload/plugin.js (built alongside the host preload).
        const pluginPreloadPath = join(__dirname, 'preload', 'plugin.js')
        const hasPluginPreload = existsSync(pluginPreloadPath)

        const view = new WebContentsView({
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            ...(hasPluginPreload ? { preload: pluginPreloadPath } : {})
          }
        })

        const [w, h] = win.getContentSize()
        view.setBounds({ x: 0, y: EMBEDDED_TOP_BAR_H, width: w, height: h - EMBEDDED_TOP_BAR_H })

        // Track the view before loadFile so that any concurrent launch call's
        // "enforce one plugin at a time" block can find and clean it up.
        activeEmbeddedView = view
        embeddedViewWindow = win

        win.contentView.addChildView(view)
        await view.webContents.loadFile(entryPoint)

        // If exit-webview was called while we were waiting for loadFile, clean up and bail out.
        // Without this guard, the view gets set AFTER the exit handler already ran,
        // leaving an orphaned WebContentsView with no way to remove it.
        if (activeLaunchCancelled) {
          activeLaunchCancelled = false
          activeEmbeddedView = null
          embeddedViewWindow = null
          try { win.contentView.removeChildView(view) } catch { /* ignore */ }
          try { view.webContents.close() } catch { /* ignore */ }
          if (sandboxSessionId) {
            try {
              const { sandboxRuntimeEngine } = await import('prana/main/features/sandbox/sandboxRuntimeEngine')
              await sandboxRuntimeEngine.stopModuleContainer(sandboxSessionId)
            } catch { /* ignore */ }
          }
          return { success: false, error: 'Launch cancelled by exit request' }
        }

        // activeEmbeddedView and embeddedViewWindow already set above.
        activePlugin = {
          appId: payload.appId,
          runtimeId,
          capabilities,
          webContentsId: view.webContents.id,
          sandboxSessionId,
        }

        embeddedViewResizeHandler = () => {
          if (!activeEmbeddedView) return
          const [nw, nh] = win.getContentSize()
          activeEmbeddedView.setBounds({ x: 0, y: EMBEDDED_TOP_BAR_H, width: nw, height: nh - EMBEDDED_TOP_BAR_H })
        }
        win.on('resize', embeddedViewResizeHandler)

        // Auto-cleanup on plugin crash so the host app remains usable.
        view.webContents.on('render-process-gone', (_event, details) => {
          console.warn(`[Chakra] Plugin renderer crashed (${details.reason}): ${runtimeId} — cleaning up`)
          try { win.contentView.removeChildView(view) } catch { /* ignore */ }
          if (embeddedViewResizeHandler) win.off('resize', embeddedViewResizeHandler)
          // Capture sessionId in a local const BEFORE nulling activePlugin —
          // the import().then() callback runs async, after activePlugin is already null.
          const crashedSessionId = activePlugin?.sandboxSessionId ?? null
          activeEmbeddedView = null
          embeddedViewResizeHandler = null
          embeddedViewWindow = null
          activePlugin = null
          if (crashedSessionId) {
            import('prana/main/features/sandbox/sandboxRuntimeEngine').then(({ sandboxRuntimeEngine }) => {
              sandboxRuntimeEngine.stopModuleContainer(crashedSessionId).catch(() => { /* ignore */ })
            }).catch(() => { /* ignore */ })
          }
          // Notify the host renderer so it can navigate back to the home screen.
          win.webContents.send('chakra:plugin-crashed', { runtimeId, reason: details.reason })
        })

        console.info(`[Chakra] Plugin container started: ${runtimeId} (${payload.appId}) session=${sandboxSessionId || 'none'} → ${entryPoint}`)
        return { success: true, runtimeId, capabilities, sandboxSessionId }
      } catch (err) {
        // If exitWebview cancelled this launch (e.g. React StrictMode cleanup),
        // return a recognisable sentinel so the renderer can ignore it and let
        // the subsequent mount re-launch cleanly.
        if (activeLaunchCancelled) {
          activeLaunchCancelled = false
          return { success: false as const, error: 'Launch cancelled by exit request' }
        }
        return { success: false as const, error: (err as Error).message }
      }
    })

    ipcMain.handle('chakra:exit-webview', async (event) => {
      try {
        // Signal any in-progress launch to abort after loadFile resolves.
        activeLaunchCancelled = true
        const { BrowserWindow } = await import('electron')
        const win = BrowserWindow.fromWebContents(event.sender)
        if (activeEmbeddedView) {
          const targetWin = embeddedViewWindow ?? win
          if (targetWin) {
            try { targetWin.contentView.removeChildView(activeEmbeddedView) } catch { /* ignore */ }
            if (embeddedViewResizeHandler) targetWin.off('resize', embeddedViewResizeHandler)
          }
          try { activeEmbeddedView.webContents.close() } catch { /* ignore */ }
        }
        if (activePlugin?.sandboxSessionId) {
          try {
            const { sandboxRuntimeEngine } = await import('prana/main/features/sandbox/sandboxRuntimeEngine')
            await sandboxRuntimeEngine.stopModuleContainer(activePlugin.sandboxSessionId)
          } catch { /* ignore — container may already be stopped */ }
        }
        activeEmbeddedView = null
        embeddedViewResizeHandler = null
        embeddedViewWindow = null
        activePlugin = null
        return { success: true }
      } catch (err) {
        return { success: false, error: (err as Error).message }
      }
    })

    console.info('[Chakra] Registered app install IPC handlers')
  } catch (error) {
    console.warn('[Chakra] Could not register app install IPC handlers:', error)
  }

  // ── Plugin IPC gateway ────────────────────────────────────────────────────────
  // Routes plugin renderer IPC calls through Prana's sandboxIpcGateway.
  // The gateway enforces capability checks (sqlite.read/write, notifications.emit)
  // before invoking the registered production handler.
  // API surface matches pluginRuntimeClient so plugin code is portable between
  // development sandbox (fork) and production (WebContentsView).
  try {
    const { ipcMain } = await import('electron')
    const { createSandboxIpcGateway } = await import('prana/main/features/sandbox/sandboxIpcGateway')
    const { getDb } = await import('./db/init')

    const chakraGateway = createSandboxIpcGateway()

    const isValidName = (t: string): boolean => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(t)

    // sqlite:read — table-based SELECT, requires sqlite.read
    chakraGateway.registerRoute('sqlite:read', async (payload) => {
      const { table, query } = payload as { table: string; query?: Record<string, unknown> }
      if (!isValidName(table)) return []
      const db = getDb()
      try {
        if (query && Object.keys(query).length > 0) {
          const conditions = Object.entries(query)
          const sql = `SELECT * FROM ${table} WHERE ${conditions.map(([k]) => `${k} = ?`).join(' AND ')}`
          const params = conditions.map(([, v]) => (typeof v === 'object' ? JSON.stringify(v) : String(v)))
          return db.prepare(sql).all(...params)
        }
        return db.prepare(`SELECT * FROM ${table}`).all()
      } catch {
        return []
      }
    })

    // sqlite:write — table-based INSERT OR REPLACE, requires sqlite.write
    chakraGateway.registerRoute('sqlite:write', async (payload) => {
      const { table, rows } = payload as { table: string; rows: Record<string, unknown>[] }
      if (!isValidName(table) || !Array.isArray(rows) || rows.length === 0) return { written: 0 }
      const cols = Object.keys(rows[0]).filter(isValidName)
      if (cols.length === 0) return { written: 0 }
      const db = getDb()
      try {
        db.exec(`CREATE TABLE IF NOT EXISTS ${table} (${cols.map(c => `${c} TEXT`).join(', ')})`)
      } catch { /* table already exists */ }
      const upsert = db.prepare(
        `INSERT OR REPLACE INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`
      )
      const writeAll = db.transaction((data: Record<string, unknown>[]) => {
        for (const row of data) {
          upsert.run(cols.map(c => row[c] === null || row[c] === undefined ? null : typeof row[c] === 'object' ? JSON.stringify(row[c]) : String(row[c])))
        }
        return data.length
      })
      return { written: writeAll(rows) as number }
    })

    // notifications:emit — emit to Prana notification centre, requires notifications.emit
    chakraGateway.registerRoute('notifications:emit', async (payload) => {
      const { eventType, payload: evtPayload } = payload as { eventType: string; payload: Record<string, unknown> }
      try {
        const { notificationCentreService } = await import('prana/main/features/communication/notificationCentreService')
        await notificationCentreService.emit({
          eventType,
          priority: 'INFO',
          source: 'sandbox:plugin',
          message: eventType,
          payload: evtPayload ?? {},
        })
      } catch { /* notification centre may be unavailable — non-fatal */ }
    })

    const assertPluginCaller = (senderId: number): ActivePluginSession => {
      if (!activePlugin) throw new Error('No plugin container is running')
      if (activePlugin.webContentsId !== senderId) throw new Error('IPC sender is not the active plugin container')
      return activePlugin
    }

    // plugin:sqlite:read — maps to gateway route 'sqlite:read'
    ipcMain.handle('plugin:sqlite:read', async (event, payload: { table: string; query?: Record<string, unknown> }) => {
      try {
        const session = assertPluginCaller(event.sender.id)
        const msg = chakraGateway.buildMessage('sqlite:read', session.sandboxSessionId || session.runtimeId, session.runtimeId, payload)
        return chakraGateway.route(msg, session.capabilities)
      } catch (err) {
        return { ok: false, error: (err as Error).message }
      }
    })

    // plugin:sqlite:write — maps to gateway route 'sqlite:write'
    ipcMain.handle('plugin:sqlite:write', async (event, payload: { table: string; rows: Record<string, unknown>[] }) => {
      try {
        const session = assertPluginCaller(event.sender.id)
        const msg = chakraGateway.buildMessage('sqlite:write', session.sandboxSessionId || session.runtimeId, session.runtimeId, payload)
        return chakraGateway.route(msg, session.capabilities)
      } catch (err) {
        return { ok: false, error: (err as Error).message }
      }
    })

    // plugin:sqlite:exec — raw SQL execution; requires sqlite.write capability.
    // Not routed through the gateway (exec is not in the capability operation map)
    // but guarded by the same capability check before execution.
    ipcMain.handle('plugin:sqlite:exec', async (event, payload: { sql: string }) => {
      try {
        const session = assertPluginCaller(event.sender.id)
        if (!session.capabilities.sqlite?.write) {
          return { ok: false, error: "Capability 'sqlite.write' required for exec" }
        }
        const db = getDb()
        db.exec(payload.sql)
        return { ok: true }
      } catch (err) {
        return { ok: false, error: (err as Error).message }
      }
    })

    // plugin:notifications:emit — maps to gateway route 'notifications:emit'
    ipcMain.handle('plugin:notifications:emit', async (event, payload: { eventType: string; payload: Record<string, unknown> }) => {
      try {
        const session = assertPluginCaller(event.sender.id)
        const msg = chakraGateway.buildMessage('notifications:emit', session.sandboxSessionId || session.runtimeId, session.runtimeId, payload)
        return chakraGateway.route(msg, session.capabilities)
      } catch (err) {
        return { ok: false, error: (err as Error).message }
      }
    })

    // plugin:runtime:info — returns session metadata to the plugin
    ipcMain.handle('plugin:runtime:info', async (event) => {
      try {
        const session = assertPluginCaller(event.sender.id)
        return { ok: true, runtimeId: session.runtimeId, sessionId: session.sandboxSessionId, capabilities: session.capabilities }
      } catch (err) {
        return { ok: false, error: (err as Error).message }
      }
    })

    console.info('[Chakra] Registered plugin IPC gateway handlers (sandboxIpcGateway)')
  } catch (error) {
    console.warn('[Chakra] Could not register plugin IPC gateway:', error)
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
  } catch (error: any) {
    if (error?.code === 'SQLITE_NOTADB') {
      try {
        await recoverCorruptPranaDb()
        console.info('[Chakra] SQLite config seeded after corrupt DB recovery')
      } catch (retryErr) {
        console.warn('[Chakra] SQLite recovery retry failed:', retryErr)
      }
    } else {
      console.warn('[Chakra] Could not seed SQLite config store:', error)
    }
  }

  // ── Sandbox runtime engine init ───────────────────────────────────────────────
  // Initialise the Prana sandbox engine BEFORE the main window opens so the engine
  // is in 'operational' state when the renderer triggers chakra:launch-webview.
  // suppressHostBoot = true: the Startup Orchestrator runs later via app:bootstrap-host
  // (the splash-screen flow); we must not run it twice.
  // db = getDb(): projects vault file index into vault_files / vault_staging tables in
  // Chakra's SQLite cache; silently skipped when vault credentials are not yet configured.
  try {
    const { sandboxRuntimeEngine } = await import('prana/main/features/sandbox/sandboxRuntimeEngine')
    const { initDb, getDb } = await import('./db/init')
    initDb() // ensure Chakra's cache DB is open before passing it to the engine
    await sandboxRuntimeEngine.initialize({ suppressHostBoot: true, db: getDb() })
    console.info('[Chakra] Sandbox runtime engine operational')
  } catch (error) {
    // If already initialised (e.g. renderer called sandbox:initialize first) the engine
    // throws "cannot initialize: already <state>". That is fine — we just verify state.
    try {
      const { sandboxRuntimeEngine } = await import('prana/main/features/sandbox/sandboxRuntimeEngine')
      if (sandboxRuntimeEngine.getEngineState() === 'operational') {
        console.info('[Chakra] Sandbox runtime engine already operational')
      } else {
        console.warn('[Chakra] Sandbox engine init failed, engine state:', sandboxRuntimeEngine.getEngineState(), error)
      }
    } catch {
      console.warn('[Chakra] Could not initialise sandbox runtime engine:', error)
    }
  }

  // ── Plugin IPC bridges (app-specific host handlers) ──────────────────────────
  // Register IPC surface layers for installed plugins that expect host-side channels.
  // Each bridge is only registered when the corresponding app is installed,
  // so startup overhead and log noise are proportional to what is actually present.
  try {
    const { ipcMain } = await import('electron')
    const { getDb } = await import('./db/init')
    const { installedApps: installedAppsTable } = await import('./db/schema')
    const { readRuntimeManifest } = await import('./services/appInstallService')
    const db = getDb()
    const allInstalled = db.select().from(installedAppsTable).all()
    const hasMula = allInstalled.some((r: { appId: string; installPath: string | null }) => {
      if (!r.installPath) return false
      try {
        const manifest = readRuntimeManifest(r.installPath)
        return manifest?.runtime?.id === 'plugin.mula'
      } catch { return false }
    })
    if (hasMula) {
      const { registerMulaBridge } = await import('./services/mulaPluginBridgeService')
      await registerMulaBridge(ipcMain)
    }
  } catch (error) {
    console.warn('[Chakra] Could not register plugin IPC bridges:', error)
  }

  // Flush vault sync and tear down all containers on quit.
  app.on('before-quit', () => {
    import('prana/main/features/sandbox/sandboxRuntimeEngine').then(({ sandboxRuntimeEngine }) => {
      sandboxRuntimeEngine.shutdown().catch(() => { /* ignore errors on quit */ })
    }).catch(() => { /* ignore import errors on quit */ })
  })

  // Create the main application window
  await app.whenReady()

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      sandbox: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload', 'index.js')
    }
  })

  const baseUrl = resolveRendererUrl(process.env) || 'http://localhost:5173'
  mainWindow.loadURL(baseUrl)

  app.on('window-all-closed', () => {
    app.quit()
  })

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
