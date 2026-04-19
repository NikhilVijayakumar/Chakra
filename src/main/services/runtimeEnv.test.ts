import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resolve } from 'node:path'
import {
  applyPranaRuntimeDefaults,
  bridgeMainViteRuntimeEnvToRuntime,
  ensureWritableDevRuntimePaths,
  loadWorkspaceEnvFile,
  normalizeEnvValue,
  readMainViteEnvValue,
  resolveRendererUrl
} from './runtimeEnv'

const createEnv = (entries: Record<string, string | undefined> = {}): NodeJS.ProcessEnv => {
  return { ...entries } as NodeJS.ProcessEnv
}

describe('runtimeEnv', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('normalizes values by trimming whitespace and rejecting blanks', () => {
    expect(normalizeEnvValue('  hello  ')).toBe('hello')
    expect(normalizeEnvValue('   ')).toBeUndefined()
    expect(normalizeEnvValue(undefined)).toBeUndefined()
  })

  it('loads .env values without overriding existing non-empty env entries', () => {
    const cwd = 'E:/Python/chakra'
    const envPath = resolve(cwd, '.env')
    const env = createEnv({
      EXISTING: 'keep-me'
    })
    const existsSync = vi.fn((path: string) => path === envPath)
    const readFileSync = vi.fn(() =>
      [
        '# comment',
        'NEW_VALUE = from-file',
        'EXISTING=from-file',
        'EMPTY_VALUE=   ',
        'MALFORMED_LINE'
      ].join('\n')
    )

    loadWorkspaceEnvFile({ cwd, env, existsSync, readFileSync })

    expect(env.NEW_VALUE).toBe('from-file')
    expect(env.EXISTING).toBe('keep-me')
    expect(env.EMPTY_VALUE).toBe('')
    expect(readFileSync).toHaveBeenCalledWith(envPath, 'utf8')
  })

  it('returns safely when loader dependencies are missing', () => {
    expect(() => {
      loadWorkspaceEnvFile(undefined)
    }).not.toThrow()
  })

  it('returns safely when cwd is blank and does not read env file', () => {
    const env = createEnv({ EXISTING: 'keep-me' })
    const existsSync = vi.fn(() => {
      throw new Error('existsSync should not be called when cwd is invalid')
    })
    const readFileSync = vi.fn(() => {
      throw new Error('readFileSync should not be called when cwd is invalid')
    })

    expect(() => {
      loadWorkspaceEnvFile({
        cwd: '   ',
        env,
        existsSync,
        readFileSync
      })
    }).not.toThrow()

    expect(readFileSync).not.toHaveBeenCalled()
  })

  it('bridges MAIN_VITE values only into missing runtime keys', () => {
    const env = createEnv({
      MAIN_VITE_CHAKRA_DEFAULT_COMPANY: 'acme-company',
      DHI_GOV_REPO_URL: 'https://existing.example/repo',
      MAIN_VITE_CHAKRA_GOV_REPO_URL: ' https://bridge.example/repo ',
      MAIN_VITE_CHAKRA_DIRECTOR_NAME: 'Director Name',
      MAIN_VITE_CHAKRA_SYNC_PUSH_INTERVAL_MS: '300000',
      DHI_DIRECTOR_NAME: 'Existing Director'
    })

    bridgeMainViteRuntimeEnvToRuntime(env)

    expect(env.DHI_GOV_REPO_URL).toBe('https://existing.example/repo')
    expect(env.CHAKRA_GOV_REPO_URL).toBe('https://bridge.example/repo')
    expect(env.DHI_DIRECTOR_NAME).toBe('Existing Director')
    expect(env.DHI_SYNC_PUSH_INTERVAL_MS).toBe('300000')
    expect(env.CHAKRA_DEFAULT_COMPANY).toBe('acme-company')
    expect(env.PRANA_GOVERNANCE_REPO_URL).toBe('https://existing.example/repo')
  })

  it('reads runtime values from MAIN_VITE-prefixed keys', () => {
    const env = createEnv({
      MAIN_VITE_DHI_DEFAULT_COMPANY: 'fallback-company',
      DHI_DIRECTOR_NAME: 'Direct Name'
    })

    expect(readMainViteEnvValue(env, 'DHI_DEFAULT_COMPANY')).toBe('fallback-company')
    expect(readMainViteEnvValue(env, 'DHI_DIRECTOR_NAME')).toBeUndefined()
    expect(readMainViteEnvValue(env, 'DHI_GOV_REPO_URL')).toBeUndefined()
  })

  it('applies runtime defaults only when values are missing', () => {
    const env = createEnv({
      PRANA_SYNC_PUSH_INTERVAL_MS: '450000',
      CHAKRA_SYNC_CRON_ENABLED: 'false'
    })

    applyPranaRuntimeDefaults(env)

    expect(env.PRANA_SYNC_PUSH_INTERVAL_MS).toBe('450000')
    expect(env.CHAKRA_SYNC_PUSH_INTERVAL_MS).toBe('120000')
    expect(env.DHI_SYNC_PUSH_INTERVAL_MS).toBe('120000')
    expect(env.CHAKRA_SYNC_CRON_ENABLED).toBe('false')
    expect(env.DHI_SYNC_CRON_ENABLED).toBe('true')
    expect(env.PRANA_SYNC_PULL_CRON_EXPRESSION).toBe('*/15 * * * *')
  })

  it('resolves renderer url from trimmed environment values', () => {
    expect(
      resolveRendererUrl(createEnv({ ELECTRON_RENDERER_URL: '  http://localhost:5173  ' }))
    ).toBe('http://localhost:5173')
    expect(resolveRendererUrl(createEnv({ ELECTRON_RENDERER_URL: '   ' }))).toBeUndefined()
  })

  it('creates writable runtime paths during development', () => {
    const existsSync = vi.fn(() => false)
    const mkdirSync = vi.fn()
    const setAppPath = vi.fn()

    ensureWritableDevRuntimePaths({
      env: createEnv({ NODE_ENV: 'development' }),
      processId: 12345,
      getAppPath: () => 'C:/temp',
      setAppPath,
      existsSync,
      mkdirSync
    })

    expect(mkdirSync).toHaveBeenCalledTimes(2)
    expect(setAppPath).toHaveBeenCalledWith('sessionData', expect.stringContaining('pid-12345'))
    expect(setAppPath).toHaveBeenCalledWith('cache', expect.stringContaining('pid-12345'))
  })
})
