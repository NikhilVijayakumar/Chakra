import { beforeEach, describe, expect, it, vi } from 'vitest'
import { verifyStartupSafety, validateRequiredStartupConfig } from './startupSecurity'

const makeEnv = (entries: Record<string, string | undefined>): NodeJS.ProcessEnv => {
  return { ...entries } as NodeJS.ProcessEnv
}

describe('startupSecurity', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('reports missing and placeholder startup config values', () => {
    const issues = validateRequiredStartupConfig(
      makeEnv({
        MAIN_VITE_CHAKRA_DEFAULT_COMPANY: 'acme-company',
        MAIN_VITE_CHAKRA_GOV_REPO_URL: 'https://example.com/repo.git',
        MAIN_VITE_CHAKRA_GOV_REPO_PATH: '/gov/repo',
        MAIN_VITE_CHAKRA_DIRECTOR_NAME: 'Director',
        MAIN_VITE_CHAKRA_DIRECTOR_EMAIL: 'director@example.com',
        MAIN_VITE_CHAKRA_DIRECTOR_PASSWORD_HASH: 'replace_with_bcrypt_hash',
        MAIN_VITE_CHAKRA_VAULT_ARCHIVE_PASSWORD: 'vault-pass',
        MAIN_VITE_CHAKRA_VAULT_ARCHIVE_SALT: 'vault-salt',
        MAIN_VITE_CHAKRA_VAULT_KDF_ITERATIONS: '   '
      })
    )

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'CHAKRA_DIRECTOR_PASSWORD_HASH' }),
        expect.objectContaining({ key: 'CHAKRA_VAULT_KDF_ITERATIONS' })
      ])
    )
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
      })
    })

    expect(result.allowed).toBe(true)
    expect(result.reason).toBeUndefined()
  })

  it('reports invalid config when SSH is verified but config is broken', async () => {
    const result = await verifyStartupSafety({
      env: makeEnv({
        MAIN_VITE_CHAKRA_DEFAULT_COMPANY: 'acme-company',
        MAIN_VITE_CHAKRA_GOV_REPO_URL: 'https://example.com/repo.git',
        MAIN_VITE_CHAKRA_GOV_REPO_PATH: '/gov/repo',
        MAIN_VITE_CHAKRA_DIRECTOR_NAME: 'Director',
        MAIN_VITE_CHAKRA_DIRECTOR_EMAIL: 'director@example.com',
        MAIN_VITE_CHAKRA_DIRECTOR_PASSWORD_HASH: 'replace_with_bcrypt_hash',
        MAIN_VITE_CHAKRA_VAULT_ARCHIVE_PASSWORD: 'vault-pass',
        MAIN_VITE_CHAKRA_VAULT_ARCHIVE_SALT: 'vault-salt',
        MAIN_VITE_CHAKRA_VAULT_KDF_ITERATIONS: '0'
      }),
      loadAuthStatus: async () => ({
        sshVerified: true,
        repoReady: true,
        clonedNow: false,
        sshMessage: 'SSH identity confirmed.',
        repoPath: '/gov/repo',
        repoUrl: 'https://example.com/repo.git'
      })
    })

    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('invalid_config')
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'CHAKRA_DIRECTOR_PASSWORD_HASH' }),
        expect.objectContaining({ key: 'CHAKRA_VAULT_KDF_ITERATIONS' })
      ])
    )
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
      })
    })

    expect(first).toEqual(second)
    expect(first.allowed).toBe(true)
  })
})
