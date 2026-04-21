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
import { verifyStartupSafety } from './services/startupSecurity'
import { setPranaPlatformRuntime } from 'prana/main/services/pranaPlatformRuntime'
import { setPranaRuntimeConfig } from 'prana/main/services/pranaRuntimeConfig'

let driveLifecycleHooksRegistered = false

const registerDriveLifecycleHooks = (): void => {
  if (driveLifecycleHooksRegistered) {
    return
  }

  driveLifecycleHooksRegistered = true
  app.once('before-quit', () => {
    void (async () => {
      try {
        const { driveControllerService } = await import('prana/main/services/driveControllerService')
        await driveControllerService.dispose()
      } catch (error) {
        console.warn('[Chakra] Could not eject virtual drives during shutdown:', error)
      }
    })()
  })
}

const showUnsafeStartupWindow = async (message: string): Promise<void> => {
  await app.whenReady()

  const errorWindow = new BrowserWindow({
    width: 720,
    height: 420,
    autoHideMenuBar: true,
    title: 'Chakra Startup Blocked',
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
          <title>Chakra Startup Blocked</title>
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
  const runtimeEnvValue = (suffix: string): string | undefined => {
    return process.env[`CHAKRA_${suffix}`] ?? process.env[`DHI_${suffix}`]
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
        archivePassword: runtimeEnvValue('VAULT_ARCHIVE_PASSWORD') || 'default',
        archiveSalt: runtimeEnvValue('VAULT_ARCHIVE_SALT') || 'salt',
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
        // Disabled previously to prevent rclone crash, but now Prana's syncProviderService
        // properly catches mount failures, so we can re-enable it. If rclone is missing,
        // it gracefully marks the sync as failed rather than crashing the orchestrator.
        enabled: true
      }
    }

    setPranaRuntimeConfig(config)
    console.info('[Chakra] Injected environment into Prana platform runtime')
  } catch (error) {
    console.warn('[Chakra] Failed to inject environment into Prana platform runtime', error)
  }

  // Pre-splash safety: validate startup env keys before renderer bootstrap.
  // SSH/auth verification is deferred to the splash screen flow
  // (app:bootstrap-host seeds SQLite, then startupOrchestrator verifies SSH).
  // Calling authService.getStatus() here would crash because
  // getRuntimeBootstrapConfig() throws when SQLite is empty (Cold-Vault design).
  const startupSafety = await verifyStartupSafety({ env: process.env })

  if (!startupSafety.allowed) {
    console.error('[Chakra] Unsafe startup blocked:', startupSafety)
    void showUnsafeStartupWindow(startupSafety.message)
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

  await import('prana/main/index')

  try {
    const { driveControllerService } = await import('prana/main/services/driveControllerService')
    registerDriveLifecycleHooks()

    const mountResult = await driveControllerService.initializeSystemDrive()
    if (!mountResult.success) {
      const message = `Virtual drive initialization failed: ${mountResult.message}`
      if (driveControllerService.isFailClosedEnabled()) {
        console.error('[Chakra] Unsafe startup blocked:', message)
        void showUnsafeStartupWindow(message)
        return
      }

      console.warn('[Chakra] Continuing startup with degraded storage posture:', message)
    }
  } catch (error) {
    console.warn('[Chakra] Could not initialize virtual drive lifecycle:', error)
  }

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
      console.info('[Chakra] Seeded SQLite config store with current runtime config if empty')
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
