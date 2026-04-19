import { app, BrowserWindow } from 'electron'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import {
  applyPranaRuntimeDefaults,
  bridgeMainViteDhiEnvToRuntime,
  ensureWritableDevRuntimePaths,
  loadWorkspaceEnvFile,
  resolveRendererUrl
} from './services/runtimeEnv'
import { verifyStartupSafety } from './services/startupSecurity'
import { setPranaPlatformRuntime } from 'prana/main/services/pranaPlatformRuntime'
import { setPranaRuntimeConfig } from 'prana/main/services/pranaRuntimeConfig'

const showUnsafeStartupWindow = async (message: string): Promise<void> => {
  await app.whenReady()

  const errorWindow = new BrowserWindow({
    width: 720,
    height: 420,
    autoHideMenuBar: true,
    title: 'DHI Startup Blocked',
    webPreferences: {
      sandbox: false,
      contextIsolation: true
    }
  })

  errorWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(`
      <html>
        <head>
          <meta charset="utf-8" />
          <title>DHI Startup Blocked</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 32px; background: #111827; color: #f9fafb; }
            .card { max-width: 640px; margin: 0 auto; padding: 24px; border-radius: 16px; background: #1f2937; box-shadow: 0 18px 40px rgba(0,0,0,.35); }
            h1 { margin-top: 0; font-size: 24px; }
            p { line-height: 1.5; color: #d1d5db; }
            code { display: block; white-space: pre-wrap; padding: 16px; border-radius: 12px; background: #0f172a; color: #fca5a5; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Startup blocked</h1>
            <p>The governance repository could not be reached over SSH, so the app has been stopped for safety.</p>
            <code>${message.replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</code>
          </div>
        </body>
      </html>
    `)}`
  )

  errorWindow.on('closed', () => {
    app.quit()
  })
}

const bootstrapPranaMain = async (): Promise<void> => {
  const rendererUrl = resolveRendererUrl(process.env)
  try {
    setPranaPlatformRuntime({
      ...(rendererUrl ? { rendererUrl } : {}),
      inheritedEnv: process.env as Record<string, string>,
      homeDir: process.env.HOME || process.env.USERPROFILE,
      userProfileDir: process.env.USERPROFILE
    })

    const config = {
      director: {
        name: process.env.DHI_DIRECTOR_NAME || 'Director',
        email: process.env.DHI_DIRECTOR_EMAIL || 'director@example.com',
        password: process.env.DHI_DIRECTOR_PASSWORD,
        passwordHash: process.env.DHI_DIRECTOR_PASSWORD_HASH
      },
      governance: {
        repoUrl: process.env.DHI_GOV_REPO_URL || '',
        repoPath: process.env.DHI_GOV_REPO_PATH || ''
      },
      vault: {
        specVersion: process.env.DHI_VAULT_SPEC_VERSION,
        tempZipExtension: process.env.DHI_VAULT_TEMP_ZIP_EXT,
        outputPrefix: process.env.DHI_VAULT_OUTPUT_PREFIX,
        archivePassword: process.env.DHI_VAULT_ARCHIVE_PASSWORD || 'default',
        archiveSalt: process.env.DHI_VAULT_ARCHIVE_SALT || 'salt',
        kdfIterations: process.env.DHI_VAULT_KDF_ITERATIONS
          ? parseInt(process.env.DHI_VAULT_KDF_ITERATIONS)
          : 600000,
        keepTempOnClose: process.env.DHI_VAULT_KEEP_TEMP_ON_CLOSE === 'true'
      },
      sync: {
        pushIntervalMs: process.env.DHI_SYNC_PUSH_INTERVAL_MS
          ? parseInt(process.env.DHI_SYNC_PUSH_INTERVAL_MS)
          : 120000,
        cronEnabled: process.env.DHI_SYNC_CRON_ENABLED === 'true',
        pushCronExpression: process.env.DHI_SYNC_PUSH_CRON_EXPRESSION || '*/10 * * * *',
        pullCronExpression: process.env.DHI_SYNC_PULL_CRON_EXPRESSION || '*/15 * * * *'
      },
      channels: {
        telegramChannelId: process.env.DHI_TELEGRAM_CHANNEL_ID,
        slackChannelId: process.env.DHI_SLACK_CHANNEL_ID,
        teamsChannelId: process.env.DHI_TEAMS_CHANNEL_ID
      },
      virtualDrives: {
        // Disabled previously to prevent rclone crash, but now Prana's syncProviderService
        // properly catches mount failures, so we can re-enable it. If rclone is missing,
        // it gracefully marks the sync as failed rather than crashing the orchestrator.
        enabled: true
      }
    }

    setPranaRuntimeConfig(config)
    console.info('[DHI] Injected environment into Prana platform runtime')
  } catch (error) {
    console.warn('[DHI] Failed to inject environment into Prana platform runtime', error)
  }

  // Pre-splash safety: only validate Dhi's own env keys.
  // SSH/auth verification is deferred to the splash screen flow
  // (app:bootstrap-host seeds SQLite, then startupOrchestrator verifies SSH).
  // Calling authService.getStatus() here would crash because
  // getRuntimeBootstrapConfig() throws when SQLite is empty (Cold-Vault design).
  const startupSafety = await verifyStartupSafety({ env: process.env })

  if (!startupSafety.allowed) {
    console.error('[DHI] Unsafe startup blocked:', startupSafety)
    void showUnsafeStartupWindow(startupSafety.message)
    return
  }

  await import('prana/main/index')

  // Ensure SQLite config store is populated on first-run.
  // We use seedFromRuntimePropsIfEmpty to avoid overwriting user preferences
  // on subsequent application startups.
  try {
    const { sqliteConfigStoreService } =
      await import('prana/main/services/sqliteConfigStoreService')
    const { getPranaRuntimeConfig } = await import('prana/main/services/pranaRuntimeConfig')
    const currentConfig = getPranaRuntimeConfig()
    if (currentConfig) {
      await sqliteConfigStoreService.seedFromRuntimePropsIfEmpty(currentConfig)
      console.info('[DHI] Seeded SQLite config store with current runtime config if empty')
    }
  } catch (error) {
    console.warn('[DHI] Could not seed SQLite config store:', error)
  }

  try {
    const { registerDharmaIpcHandlers } = await import('./services/dharmaIpcHandlers')
    registerDharmaIpcHandlers()
    console.info('[DHI] Dharma IPC handlers registered')
  } catch (error) {
    console.warn('[DHI] Failed to register Dharma IPC handlers', error)
  }
}

loadWorkspaceEnvFile({
  cwd: process.cwd(),
  env: process.env,
  existsSync,
  readFileSync
})
bridgeMainViteDhiEnvToRuntime(process.env)
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
