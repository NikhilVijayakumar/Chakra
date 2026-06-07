import { beforeEach, describe, expect, it, vi } from 'vitest'
import { verifyStartupSafety, validateRequiredStartupConfig } from './startupSecurity'

const makeEnv = (entries: Record<string, string | undefined>): NodeJS.ProcessEnv => {
  return { ...entries } as NodeJS.ProcessEnv
}

describe('startupSecurity', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns no issues at startup — vault config comes from Google Sheets Config tab, not env vars', () => {
    const issues = validateRequiredStartupConfig(makeEnv({}))
    expect(issues).toEqual([])
  })

  it('blocks startup when SSH verification is unavailable', async () => {
    const result = await verifyStartupSafety({
      env: makeEnv({
        MAIN_VITE_CHAKRA_DEFAULT_COMPANY: 'acme-company',
        MAIN_VITE_CHAKRA_GOV_REPO_URL: 'https://example.com/repo.git',
        MAIN_VITE_CHAKRA_GOV_REPO_PATH: '/gov/repo',
        MAIN_VITE_CHAKRA_DIRECTOR_NAME: 'Director',
        MAIN_VITE_CHAKRA_DIRECTOR_EMAIL: 'director@example.com',
        MAIN_VITE_CHAKRA_DIRECTOR_PASSWORD_HASH: 'hash',
        MAIN_VITE_CHAKRA_VAULT_ARCHIVE_PASSWORD: 'vault-pass',
        MAIN_VITE_CHAKRA_VAULT_ARCHIVE_SALT: 'vault-salt',
        MAIN_VITE_CHAKRA_VAULT_KDF_ITERATIONS: '210000'
      }),
      loadAuthStatus: async () => ({
        sshVerified: false,
        repoReady: false,
        clonedNow: false,
        sshMessage: 'Unable to verify SSH access to governance repository.',
        repoPath: '/gov/repo',
        repoUrl: 'https://example.com/repo.git'
      }),
      evaluateHostDependencies: async () => ({
        passed: true,
        missing: [],
        diagnostics: []
      })
    })

    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('ssh_unavailable')
    expect(result.message).toContain('SSH')
  })

  it('allows startup when SSH is verified and config is valid', async () => {
    const result = await verifyStartupSafety({
      env: makeEnv({
        MAIN_VITE_CHAKRA_DEFAULT_COMPANY: 'acme-company',
        MAIN_VITE_CHAKRA_GOV_REPO_URL: 'https://example.com/repo.git',
        MAIN_VITE_CHAKRA_GOV_REPO_PATH: '/gov/repo',
        MAIN_VITE_CHAKRA_DIRECTOR_NAME: 'Director',
        MAIN_VITE_CHAKRA_DIRECTOR_EMAIL: 'director@example.com',
        MAIN_VITE_CHAKRA_DIRECTOR_PASSWORD_HASH: 'hash',
        MAIN_VITE_CHAKRA_VAULT_ARCHIVE_PASSWORD: 'vault-pass',
        MAIN_VITE_CHAKRA_VAULT_ARCHIVE_SALT: 'vault-salt',
        MAIN_VITE_CHAKRA_VAULT_KDF_ITERATIONS: '210000'
      }),
      loadAuthStatus: async () => ({
        sshVerified: true,
        repoReady: true,
        clonedNow: false,
        sshMessage: 'SSH identity confirmed.',
        repoPath: '/gov/repo',
        repoUrl: 'https://example.com/repo.git'
      }),
      evaluateHostDependencies: async () => ({
        passed: true,
        missing: [],
        diagnostics: []
      })
    })

    expect(result.allowed).toBe(true)
    expect(result.reason).toBeUndefined()
  })

  it('allows startup when SSH is verified regardless of vault env vars — vault comes from Google Sheets Config tab', async () => {
    const result = await verifyStartupSafety({
      env: makeEnv({}),
      loadAuthStatus: async () => ({
        sshVerified: true,
        repoReady: true,
        clonedNow: false,
        sshMessage: 'SSH identity confirmed.',
        repoPath: '/gov/repo',
        repoUrl: 'https://example.com/repo.git'
      }),
      evaluateHostDependencies: async () => ({
        passed: true,
        missing: [],
        diagnostics: []
      })
    })

    expect(result.allowed).toBe(true)
    expect(result.issues).toEqual([])
  })

  it('accepts MAIN_VITE_DHI_DEFAULT_COMPANY as fallback when CHAKRA_DEFAULT_COMPANY is absent', async () => {
    const result = await verifyStartupSafety({
      env: makeEnv({
        MAIN_VITE_DHI_DEFAULT_COMPANY: 'acme-company',
        MAIN_VITE_DHI_GOV_REPO_URL: 'https://example.com/repo.git',
        MAIN_VITE_DHI_GOV_REPO_PATH: '/gov/repo',
        MAIN_VITE_DHI_DIRECTOR_NAME: 'Director',
        MAIN_VITE_DHI_DIRECTOR_EMAIL: 'director@example.com',
        MAIN_VITE_DHI_DIRECTOR_PASSWORD_HASH: 'hash',
        MAIN_VITE_DHI_VAULT_ARCHIVE_PASSWORD: 'vault-pass',
        MAIN_VITE_DHI_VAULT_ARCHIVE_SALT: 'vault-salt',
        MAIN_VITE_DHI_VAULT_KDF_ITERATIONS: '210000'
      }),
      loadAuthStatus: async () => ({
        sshVerified: true,
        repoReady: true,
        clonedNow: false,
        sshMessage: 'SSH identity confirmed.',
        repoPath: '/gov/repo',
        repoUrl: 'https://example.com/repo.git'
      }),
      evaluateHostDependencies: async () => ({
        passed: true,
        missing: [],
        diagnostics: []
      })
    })

    expect(result.allowed).toBe(true)
    expect(result.reason).toBeUndefined()
  })

  it('keeps startup validation deterministic and fail-safe across repeated checks', async () => {
    const env = makeEnv({
      MAIN_VITE_CHAKRA_DEFAULT_COMPANY: 'acme-company',
      MAIN_VITE_CHAKRA_GOV_REPO_URL: 'https://example.com/repo.git',
      MAIN_VITE_CHAKRA_GOV_REPO_PATH: '/gov/repo',
      MAIN_VITE_CHAKRA_DIRECTOR_NAME: 'Director',
      MAIN_VITE_CHAKRA_DIRECTOR_EMAIL: 'director@example.com',
      MAIN_VITE_CHAKRA_DIRECTOR_PASSWORD_HASH: 'hash',
      MAIN_VITE_CHAKRA_VAULT_ARCHIVE_PASSWORD: 'vault-pass',
      MAIN_VITE_CHAKRA_VAULT_ARCHIVE_SALT: 'vault-salt',
      MAIN_VITE_CHAKRA_VAULT_KDF_ITERATIONS: '210000'
    })

    const first = await verifyStartupSafety({
      env,
      loadAuthStatus: async () => ({
        sshVerified: true,
        repoReady: true,
        clonedNow: false,
        sshMessage: 'SSH identity confirmed.',
        repoPath: '/gov/repo',
        repoUrl: 'https://example.com/repo.git'
      }),
      evaluateHostDependencies: async () => ({
        passed: true,
        missing: [],
        diagnostics: []
      })
    })

    const second = await verifyStartupSafety({
      env,
      loadAuthStatus: async () => ({
        sshVerified: true,
        repoReady: true,
        clonedNow: false,
        sshMessage: 'SSH identity confirmed.',
        repoPath: '/gov/repo',
        repoUrl: 'https://example.com/repo.git'
      }),
      evaluateHostDependencies: async () => ({
        passed: true,
        missing: [],
        diagnostics: []
      })
    })

    expect(first).toEqual(second)
    expect(first.allowed).toBe(true)
  })

  it('blocks startup when required host dependencies are missing', async () => {
    const result = await verifyStartupSafety({
      env: makeEnv({
        MAIN_VITE_CHAKRA_DEFAULT_COMPANY: 'acme-company',
        MAIN_VITE_CHAKRA_GOV_REPO_URL: 'https://example.com/repo.git',
        MAIN_VITE_CHAKRA_GOV_REPO_PATH: '/gov/repo',
        MAIN_VITE_CHAKRA_DIRECTOR_NAME: 'Director',
        MAIN_VITE_CHAKRA_DIRECTOR_EMAIL: 'director@example.com',
        MAIN_VITE_CHAKRA_DIRECTOR_PASSWORD_HASH: 'hash',
        MAIN_VITE_CHAKRA_VAULT_ARCHIVE_PASSWORD: 'vault-pass',
        MAIN_VITE_CHAKRA_VAULT_ARCHIVE_SALT: 'vault-salt',
        MAIN_VITE_CHAKRA_VAULT_KDF_ITERATIONS: '210000'
      }),
      evaluateHostDependencies: async () => ({
        passed: false,
        missing: ['git'],
        diagnostics: [
          {
            dependency: 'git',
            available: false,
            source: 'PATH',
            command: 'git --version',
            message: 'git is not available on PATH.'
          }
        ]
      })
    })

    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('missing_dependency')
    expect(result.issues).toEqual([{ key: 'git', message: 'git is not available on PATH.' }])
  })
})
