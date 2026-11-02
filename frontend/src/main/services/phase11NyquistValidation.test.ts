import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Phase 11 Nyquist validation', () => {
  it('keeps loadWorkspaceEnvFile startup call wired with explicit dependency keys', () => {
    const mainIndexPath = resolve(process.cwd(), 'src/main/index.ts')
    const mainIndex = readFileSync(mainIndexPath, 'utf8')

    expect(mainIndex).toContain('loadWorkspaceEnvFile({')
    expect(mainIndex).toContain('cwd: process.cwd()')
    expect(mainIndex).toContain('env: process.env')
    expect(mainIndex).toContain('existsSync')
    expect(mainIndex).toContain('readFileSync')
  })

  it('guards invalid cwd before resolving workspace env path', () => {
    const runtimeEnvPath = resolve(process.cwd(), 'src/main/services/runtimeEnv.ts')
    const runtimeEnv = readFileSync(runtimeEnvPath, 'utf8')

    expect(runtimeEnv).toContain('const cwd = normalizeEnvValue(dependencies?.cwd)')
    expect(runtimeEnv).toContain('if (!cwd || !dependencies) {')
    expect(runtimeEnv).toContain("const envPath = resolve(cwd, '.env')")
  })
})
