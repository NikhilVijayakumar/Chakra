import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

export const DEFAULT_PRANA_SYNC_PUSH_INTERVAL_MS = '120000'
export const DEFAULT_PRANA_SYNC_CRON_ENABLED = 'true'
export const DEFAULT_PRANA_SYNC_PUSH_CRON_EXPRESSION = '*/10 * * * *'
export const DEFAULT_PRANA_SYNC_PULL_CRON_EXPRESSION = '*/15 * * * *'

export const DHI_RUNTIME_KEYS = [
  'DHI_DEFAULT_COMPANY',
  'DHI_GOV_REPO_URL',
  'DHI_GOV_REPO_PATH',
  'DHI_DIRECTOR_NAME',
  'DHI_DIRECTOR_EMAIL',
  'DHI_DIRECTOR_PASSWORD',
  'DHI_DIRECTOR_PASSWORD_HASH',
  'DHI_VAULT_SPEC_VERSION',
  'DHI_VAULT_TEMP_ZIP_EXT',
  'DHI_VAULT_OUTPUT_PREFIX',
  'DHI_VAULT_ARCHIVE_PASSWORD',
  'DHI_VAULT_ARCHIVE_SALT',
  'DHI_VAULT_KDF_ITERATIONS',
  'DHI_VAULT_KEEP_TEMP_ON_CLOSE',
  'DHI_SYNC_PUSH_INTERVAL_MS',
  'DHI_SYNC_CRON_ENABLED',
  'DHI_SYNC_PUSH_CRON_EXPRESSION',
  'DHI_SYNC_PULL_CRON_EXPRESSION',
  'DHI_TELEGRAM_CHANNEL_ID',
  'DHI_SLACK_CHANNEL_ID',
  'DHI_TEAMS_CHANNEL_ID'
] as const

interface WorkspaceEnvDependencies {
  cwd: string | undefined
  env: NodeJS.ProcessEnv
  existsSync: typeof existsSync
  readFileSync: typeof readFileSync
}

interface DevRuntimePathDependencies {
  env: NodeJS.ProcessEnv
  processId: number
  getAppPath: (name: 'temp') => string
  setAppPath: (name: 'sessionData' | 'cache', value: string) => void
  existsSync: typeof existsSync
  mkdirSync: typeof mkdirSync
}

const setDefaultEnvValue = (env: NodeJS.ProcessEnv, key: string, fallback: string): void => {
  const current = normalizeEnvValue(env[key])
  if (!current) {
    env[key] = fallback
  }
}

const setEnvValueIfMissing = (
  env: NodeJS.ProcessEnv,
  key: string,
  value: string | undefined
): void => {
  if (!value) {
    return
  }

  if (!normalizeEnvValue(env[key])) {
    env[key] = value
  }
}

export const normalizeEnvValue = (value: string | undefined): string | undefined => {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalizedValue = value.trim()
  return normalizedValue.length > 0 ? normalizedValue : undefined
}

export const readMainViteEnvValue = (env: NodeJS.ProcessEnv, key: string): string | undefined => {
  return normalizeEnvValue(env[`MAIN_VITE_${key}`])
}

export const loadWorkspaceEnvFile = (dependencies: WorkspaceEnvDependencies | undefined): void => {
  const cwd = normalizeEnvValue(dependencies?.cwd)
  if (!cwd || !dependencies) {
    return
  }

  const envPath = resolve(cwd, '.env')
  if (!dependencies.existsSync(envPath)) {
    return
  }

  const raw = dependencies.readFileSync(envPath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmedLine = line.trim()
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmedLine.indexOf('=')
    if (separatorIndex <= 0) {
      continue
    }

    const key = trimmedLine.slice(0, separatorIndex).trim()
    if (!key) {
      continue
    }

    const value = trimmedLine.slice(separatorIndex + 1).trim()
    if (!normalizeEnvValue(dependencies.env[key])) {
      dependencies.env[key] = value
    }
  }
}

export const ensureWritableDevRuntimePaths = (dependencies: DevRuntimePathDependencies): void => {
  const isDevelopment =
    dependencies.env.NODE_ENV === 'development' || Boolean(dependencies.env.ELECTRON_RENDERER_URL)
  if (!isDevelopment) {
    return
  }

  try {
    const devRuntimeRoot = join(
      dependencies.getAppPath('temp'),
      'dhi-app-dev-runtime',
      `pid-${dependencies.processId}`
    )
    const sessionDataPath = join(devRuntimeRoot, 'session-data')
    const cachePath = join(devRuntimeRoot, 'cache')

    if (!dependencies.existsSync(sessionDataPath)) {
      dependencies.mkdirSync(sessionDataPath, { recursive: true })
    }
    if (!dependencies.existsSync(cachePath)) {
      dependencies.mkdirSync(cachePath, { recursive: true })
    }

    dependencies.setAppPath('sessionData', sessionDataPath)
    dependencies.setAppPath('cache', cachePath)
  } catch (error) {
    console.warn('[DHI] Unable to apply writable dev runtime paths', error)
  }
}

export const bridgeMainViteDhiEnvToRuntime = (env: NodeJS.ProcessEnv): void => {
  for (const key of DHI_RUNTIME_KEYS) {
    const sourceValue = readMainViteEnvValue(env, key)
    setEnvValueIfMissing(env, key, sourceValue)
  }

  setEnvValueIfMissing(env, 'PRANA_GOVERNANCE_REPO_URL', normalizeEnvValue(env.DHI_GOV_REPO_URL))
  setEnvValueIfMissing(env, 'PRANA_GOVERNANCE_REPO_PATH', normalizeEnvValue(env.DHI_GOV_REPO_PATH))
}

export const applyPranaRuntimeDefaults = (env: NodeJS.ProcessEnv): void => {
  setDefaultEnvValue(env, 'PRANA_SYNC_PUSH_INTERVAL_MS', DEFAULT_PRANA_SYNC_PUSH_INTERVAL_MS)
  setDefaultEnvValue(env, 'DHI_SYNC_PUSH_INTERVAL_MS', DEFAULT_PRANA_SYNC_PUSH_INTERVAL_MS)

  setDefaultEnvValue(env, 'PRANA_SYNC_CRON_ENABLED', DEFAULT_PRANA_SYNC_CRON_ENABLED)
  setDefaultEnvValue(env, 'DHI_SYNC_CRON_ENABLED', DEFAULT_PRANA_SYNC_CRON_ENABLED)

  setDefaultEnvValue(
    env,
    'PRANA_SYNC_PUSH_CRON_EXPRESSION',
    DEFAULT_PRANA_SYNC_PUSH_CRON_EXPRESSION
  )
  setDefaultEnvValue(env, 'DHI_SYNC_PUSH_CRON_EXPRESSION', DEFAULT_PRANA_SYNC_PUSH_CRON_EXPRESSION)

  setDefaultEnvValue(
    env,
    'PRANA_SYNC_PULL_CRON_EXPRESSION',
    DEFAULT_PRANA_SYNC_PULL_CRON_EXPRESSION
  )
  setDefaultEnvValue(env, 'DHI_SYNC_PULL_CRON_EXPRESSION', DEFAULT_PRANA_SYNC_PULL_CRON_EXPRESSION)
}

export const resolveRendererUrl = (env: NodeJS.ProcessEnv): string | undefined => {
  const rendererUrl = env.ELECTRON_RENDERER_URL
  if (typeof rendererUrl !== 'string') {
    return undefined
  }

  const normalizedRendererUrl = rendererUrl.trim()
  return normalizedRendererUrl.length > 0 ? normalizedRendererUrl : undefined
}
