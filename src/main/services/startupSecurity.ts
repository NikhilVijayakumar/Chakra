import type { AuthStatus } from 'prana/main/services/authService'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { STARTUP_RUNTIME_KEYS, normalizeEnvValue, readMainViteEnvValue } from './runtimeEnv'

type StartupAuthStatusLoader = () => Promise<AuthStatus>
type StartupDependencyId = 'ssh' | 'git' | 'virtual-drive'

interface StartupDependencyDiagnostic {
  dependency: StartupDependencyId
  available: boolean
  source: 'PATH' | 'CONFIG'
  command: string
  message: string
}

interface StartupDependencyCapabilityResult {
  passed: boolean
  missing: StartupDependencyId[]
  diagnostics: StartupDependencyDiagnostic[]
}

const execFileAsync = promisify(execFile)

export interface StartupSecurityIssue {
  key: string
  message: string
}

export interface StartupSecurityResult {
  allowed: boolean
  reason?: 'ssh_unavailable' | 'invalid_config' | 'missing_dependency'
  message: string
  issues: StartupSecurityIssue[]
}

const checkDependency = async (
  dependency: StartupDependencyId,
  command: string,
  args: string[],
  source: 'PATH' | 'CONFIG'
): Promise<StartupDependencyDiagnostic> => {
  try {
    await execFileAsync(command, args, { timeout: 8000, windowsHide: true })
    return {
      dependency,
      available: true,
      source,
      command: `${command} ${args.join(' ')}`.trim(),
      message: `${dependency} dependency is available.`
    }
  } catch (error: any) {
    const stderr = typeof error?.stderr === 'string' ? error.stderr.trim() : ''
    const stdout = typeof error?.stdout === 'string' ? error.stdout.trim() : ''
    const message = stderr || stdout || `${dependency} dependency is not available.`
    return {
      dependency,
      available: false,
      source,
      command: `${command} ${args.join(' ')}`.trim(),
      message
    }
  }
}

const evaluateHostDependencies = async (): Promise<StartupDependencyCapabilityResult> => {
  const configuredDriveBinary =
    process.env.CHAKRA_VIRTUAL_DRIVE_BINARY ??
    process.env.DHI_VIRTUAL_DRIVE_BINARY ??
    process.env.MAIN_VITE_CHAKRA_VIRTUAL_DRIVE_BINARY ??
    process.env.MAIN_VITE_DHI_VIRTUAL_DRIVE_BINARY

  const diagnostics: StartupDependencyDiagnostic[] = []
  diagnostics.push(await checkDependency('ssh', 'ssh', ['-V'], 'PATH'))
  diagnostics.push(await checkDependency('git', 'git', ['--version'], 'PATH'))

  if (configuredDriveBinary && configuredDriveBinary.trim().length > 0) {
    diagnostics.push(
      await checkDependency('virtual-drive', configuredDriveBinary.trim(), ['version'], 'CONFIG')
    )
  } else {
    diagnostics.push(await checkDependency('virtual-drive', 'rclone', ['version'], 'PATH'))
  }

  const missing = diagnostics.filter((entry) => !entry.available).map((entry) => entry.dependency)
  return {
    passed: missing.length === 0,
    missing,
    diagnostics
  }
}

const REQUIRED_STARTUP_KEYS = [
  'CHAKRA_DEFAULT_COMPANY',
  'CHAKRA_GOV_REPO_URL',
  'CHAKRA_GOV_REPO_PATH',
  'CHAKRA_DIRECTOR_NAME',
  'CHAKRA_DIRECTOR_EMAIL',
  'CHAKRA_DIRECTOR_PASSWORD_HASH',
  'CHAKRA_VAULT_ARCHIVE_PASSWORD',
  'CHAKRA_VAULT_ARCHIVE_SALT',
  'CHAKRA_VAULT_KDF_ITERATIONS'
] as const

const PLACEHOLDER_PATTERNS = [/replace_with/i, /placeholder/i, /change_me/i, /^your_.+/i, /^todo$/i]

const isPlaceholderValue = (value: string): boolean => {
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value))
}

const isPositiveIntegerString = (value: string): boolean => {
  return /^[1-9]\d*$/.test(value)
}

export const reportSecurityError = (operation: string, error: unknown): void => {
  console.error(`[Chakra] ${operation} failed:`, error)
}

export const validateRequiredStartupConfig = (
  env: NodeJS.ProcessEnv = process.env
): StartupSecurityIssue[] => {
  const issues: StartupSecurityIssue[] = []

  const getRequiredValue = (key: (typeof REQUIRED_STARTUP_KEYS)[number]): string | undefined => {
    const legacyKey = key.replace('CHAKRA_', 'DHI_')
    return readMainViteEnvValue(env, key) ?? readMainViteEnvValue(env, legacyKey)
  }

  for (const key of REQUIRED_STARTUP_KEYS) {
    const value = getRequiredValue(key)

    if (!value) {
      issues.push({
        key,
        message: 'Missing required value'
      })
      continue
    }

    if (isPlaceholderValue(value)) {
      issues.push({
        key,
        message: 'Placeholder value is not allowed'
      })
      continue
    }

    if (key === 'CHAKRA_VAULT_KDF_ITERATIONS' && !isPositiveIntegerString(value)) {
      issues.push({
        key,
        message: 'Must be a positive integer'
      })
    }
  }

  return issues
}

export const verifyStartupSafety = async (dependencies: {
  env?: NodeJS.ProcessEnv
  loadAuthStatus?: StartupAuthStatusLoader
  evaluateHostDependencies?: () => Promise<StartupDependencyCapabilityResult>
}): Promise<StartupSecurityResult> => {
  const env = dependencies.env ?? process.env

  try {
    const dependencyCapability = await (dependencies.evaluateHostDependencies ?? evaluateHostDependencies)()
    if (!dependencyCapability.passed) {
      const issues = dependencyCapability.diagnostics
        .filter((entry) => !entry.available)
        .map((entry) => ({
          key: entry.dependency,
          message: entry.message
        }))
      const message = `Missing host dependencies: ${dependencyCapability.missing.join(', ')}`
      reportSecurityError('startup dependency capability', new Error(message))
      return {
        allowed: false,
        reason: 'missing_dependency',
        message,
        issues
      }
    }

    // SSH/auth verification is optional. In Cold-Vault architecture,
    // SSH is verified during the splash screen (app:bootstrap-host flow).
    // Pre-splash, we only validate startup env keys.
    if (dependencies.loadAuthStatus) {
      const authStatus = await dependencies.loadAuthStatus()

      if (!authStatus.sshVerified) {
        const message = authStatus.sshMessage || 'SSH verification failed.'
        reportSecurityError('startup SSH verification', new Error(message))
        return {
          allowed: false,
          reason: 'ssh_unavailable',
          message,
          issues: [{ key: 'SSH', message }]
        }
      }
    }

    const configIssues = validateRequiredStartupConfig(env)

    if (configIssues.length > 0) {
      const summary = configIssues.map((issue) => `${issue.key}: ${issue.message}`).join('; ')
      reportSecurityError('startup configuration validation', new Error(summary))
      return {
        allowed: false,
        reason: 'invalid_config',
        message: summary,
        issues: configIssues
      }
    }

    return {
      allowed: true,
      message: 'Configuration validated. SSH will be verified during splash bootstrap.',
      issues: []
    }
  } catch (error) {
    reportSecurityError('startup verification', error)
    return {
      allowed: false,
      reason: 'ssh_unavailable',
      message: 'Unable to verify startup safety.',
      issues: [{ key: 'startup', message: 'Unable to verify startup safety.' }]
    }
  }
}

export const startupRequiredKeys = [...REQUIRED_STARTUP_KEYS, ...STARTUP_RUNTIME_KEYS]
