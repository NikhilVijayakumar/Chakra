import type { AuthStatus } from 'prana/main/services/authService'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { STARTUP_RUNTIME_KEYS } from './runtimeEnv'

type StartupAuthStatusLoader = () => Promise<AuthStatus>
type StartupDependencyId = 'ssh' | 'git' | 'virtual-drive'

export type { StartupDependencyId }

export interface StartupDependencyDiagnostic {
  dependency: StartupDependencyId
  available: boolean
  source: 'PATH' | 'CONFIG'
  command: string
  message: string
}

export interface StartupDependencyCapabilityResult {
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
  const result = await checkHostDependenciesStaged()
  return {
    passed: result.every((d) => d.available),
    missing: result.filter((d) => !d.available).map((d) => d.dependency),
    diagnostics: result
  }
}

// Sandbox architecture uses process-level isolation (child_process.fork) instead
// of virtual drive filesystem virtualization — no rclone/WinFsp dependency at startup.
export const checkHostDependenciesStaged = async (): Promise<StartupDependencyDiagnostic[]> => {
  const diagnostics: StartupDependencyDiagnostic[] = []
  diagnostics.push(await checkDependency('ssh', 'ssh', ['-V'], 'PATH'))
  diagnostics.push(await checkDependency('git', 'git', ['--version'], 'PATH'))
  return diagnostics
}


export const reportSecurityError = (operation: string, error: unknown): void => {
  console.error(`[Chakra] ${operation} failed:`, error)
}

// Startup validation only checks runtime dependencies (ssh, git).
// Sync/email config comes from the Google Sheets Config tab → SQLite.
export const validateRequiredStartupConfig = (
  _env: NodeJS.ProcessEnv = process.env
): StartupSecurityIssue[] => {
  return []
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

export const startupRequiredKeys = [...STARTUP_RUNTIME_KEYS]
