import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

export const DEFAULT_PRANA_SYNC_PUSH_INTERVAL_MS = '120000'
export const DEFAULT_PRANA_SYNC_CRON_ENABLED = 'true'
export const DEFAULT_PRANA_SYNC_PUSH_CRON_EXPRESSION = '*/10 * * * *'
export const DEFAULT_PRANA_SYNC_PULL_CRON_EXPRESSION = '*/15 * * * *'

const RUNTIME_KEY_SUFFIXES = [
  'DEFAULT_COMPANY',
  'GOV_REPO_URL',
  'GOV_REPO_PATH',
  'DIRECTOR_NAME',
  'DIRECTOR_EMAIL',
  'DIRECTOR_PASSWORD',
  'DIRECTOR_PASSWORD_HASH',
  'VAULT_SPEC_VERSION',
  'VAULT_TEMP_ZIP_EXT',
  'VAULT_OUTPUT_PREFIX',
  'VAULT_ARCHIVE_PASSWORD',
  'VAULT_ARCHIVE_SALT',
  'VAULT_KDF_ITERATIONS',
  'VAULT_KEEP_TEMP_ON_CLOSE',
  'SYNC_PUSH_INTERVAL_MS',
  'SYNC_CRON_ENABLED',
  'SYNC_PUSH_CRON_EXPRESSION',
  'SYNC_PULL_CRON_EXPRESSION',
  'TELEGRAM_CHANNEL_ID',
  'SLACK_CHANNEL_ID',
  'TEAMS_CHANNEL_ID',
  'VIRTUAL_DRIVE_ENABLED'
] as const

export const CHAKRA_RUNTIME_KEYS = RUNTIME_KEY_SUFFIXES.map((suffix) => `CHAKRA_${suffix}`)
export const DHI_RUNTIME_KEYS = RUNTIME_KEY_SUFFIXES.map((suffix) => `DHI_${suffix}`)
export const STARTUP_RUNTIME_KEYS = [...CHAKRA_RUNTIME_KEYS, ...DHI_RUNTIME_KEYS] as const

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
      'chakra-app-dev-runtime',
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
    console.warn('[Chakra] Unable to apply writable dev runtime paths', error)
  }
}

export const bridgeMainViteRuntimeEnvToRuntime = (env: NodeJS.ProcessEnv): void => {
  for (const suffix of RUNTIME_KEY_SUFFIXES) {
    const chakraKey = `CHAKRA_${suffix}`
    const dhiKey = `DHI_${suffix}`
    const chakraValue = readMainViteEnvValue(env, chakraKey)
    const dhiValue = readMainViteEnvValue(env, dhiKey)
    const preferredValue = chakraValue ?? dhiValue

    setEnvValueIfMissing(env, chakraKey, preferredValue)
    setEnvValueIfMissing(env, dhiKey, preferredValue)
  }

  const governanceRepoUrl = normalizeEnvValue(env.CHAKRA_GOV_REPO_URL) ?? normalizeEnvValue(env.DHI_GOV_REPO_URL)
  const governanceRepoPath = normalizeEnvValue(env.CHAKRA_GOV_REPO_PATH) ?? normalizeEnvValue(env.DHI_GOV_REPO_PATH)
  setEnvValueIfMissing(env, 'PRANA_GOVERNANCE_REPO_URL', governanceRepoUrl)
  setEnvValueIfMissing(env, 'PRANA_GOVERNANCE_REPO_PATH', governanceRepoPath)
}

export const bridgeMainViteDhiEnvToRuntime = bridgeMainViteRuntimeEnvToRuntime

export const applyPranaRuntimeDefaults = (env: NodeJS.ProcessEnv): void => {
  setDefaultEnvValue(env, 'PRANA_SYNC_PUSH_INTERVAL_MS', DEFAULT_PRANA_SYNC_PUSH_INTERVAL_MS)
  setDefaultEnvValue(env, 'CHAKRA_SYNC_PUSH_INTERVAL_MS', DEFAULT_PRANA_SYNC_PUSH_INTERVAL_MS)
  setDefaultEnvValue(env, 'DHI_SYNC_PUSH_INTERVAL_MS', DEFAULT_PRANA_SYNC_PUSH_INTERVAL_MS)

  setDefaultEnvValue(env, 'PRANA_SYNC_CRON_ENABLED', DEFAULT_PRANA_SYNC_CRON_ENABLED)
  setDefaultEnvValue(env, 'CHAKRA_SYNC_CRON_ENABLED', DEFAULT_PRANA_SYNC_CRON_ENABLED)
  setDefaultEnvValue(env, 'DHI_SYNC_CRON_ENABLED', DEFAULT_PRANA_SYNC_CRON_ENABLED)

  setDefaultEnvValue(
    env,
    'PRANA_SYNC_PUSH_CRON_EXPRESSION',
    DEFAULT_PRANA_SYNC_PUSH_CRON_EXPRESSION
  )
  setDefaultEnvValue(
    env,
    'CHAKRA_SYNC_PUSH_CRON_EXPRESSION',
    DEFAULT_PRANA_SYNC_PUSH_CRON_EXPRESSION
  )
  setDefaultEnvValue(env, 'DHI_SYNC_PUSH_CRON_EXPRESSION', DEFAULT_PRANA_SYNC_PUSH_CRON_EXPRESSION)

  setDefaultEnvValue(
    env,
    'PRANA_SYNC_PULL_CRON_EXPRESSION',
    DEFAULT_PRANA_SYNC_PULL_CRON_EXPRESSION
  )
  setDefaultEnvValue(
    env,
    'CHAKRA_SYNC_PULL_CRON_EXPRESSION',
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
