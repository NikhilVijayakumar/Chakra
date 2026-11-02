import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const root = process.cwd()

const read = (relativePath: string): string => {
  const fullPath = join(root, relativePath)
  return readFileSync(fullPath, 'utf8')
}

describe('phase 02 nyquist validation', () => {
  it('pins dharma dependency to an immutable commit SHA (DHAR-01)', () => {
    const packageJson = read('package.json')

    expect(packageJson).toMatch(/"dharma"\s*:\s*"github:NikhilVijayakumar\/dharma#[0-9a-f]{40}"/)
  })

  it('keeps standardized dharma sync failure logging in service and tests (DHAR-02)', () => {
    const syncService = read('src/main/services/dharmaSyncService.ts')
    const syncServiceTests = read('src/main/services/dharmaSyncService.test.ts')

    expect(syncService).toContain('[DharmaSync] ${operation} failed:')
    expect(syncServiceTests).toContain('[DharmaSync] get company (missing-company) failed:')
    expect(syncServiceTests).toContain('[DharmaSync] get agents (missing-company) failed:')
  })

  it('enforces loader-first generated registry handling and cleanup guardrails (DHAR-03)', () => {
    const packageJson = read('package.json')
    const gitignore = read('.gitignore')

    expect(gitignore).toContain('src/renderer/src/shared/registry/generated/')
    expect(gitignore).toContain('/src/renderer/src/shared/registry/generated/*.generated.ts')

    expect(packageJson).not.toMatch(/"prebuild"\s*:/)
    expect(packageJson).not.toMatch(/"pretypecheck"\s*:/)
    expect(packageJson).not.toMatch(/"pretest"\s*:/)

    expect(existsSync(join(root, 'scripts/ensure-registry-from-dharma.mjs'))).toBe(false)
  })
})
