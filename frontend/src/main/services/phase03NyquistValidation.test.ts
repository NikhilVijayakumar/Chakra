import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Phase 03 Nyquist validation', () => {
  it('pins prana dependency to an immutable commit SHA', () => {
    const packageJsonPath = resolve(process.cwd(), 'package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      dependencies?: Record<string, string>
    }

    const pranaRef = packageJson.dependencies?.prana
    expect(pranaRef).toBeDefined()
    expect(pranaRef).toMatch(/^github:NikhilVijayakumar\/prana#[0-9a-f]{40}$/)
  })

  it('exposes prana bootstrap/startup preload contract methods', () => {
    const preloadRuntimePath = resolve(process.cwd(), 'src/preload/index.ts')
    const preloadTypesPath = resolve(process.cwd(), 'src/preload/index.d.ts')

    const preloadRuntime = readFileSync(preloadRuntimePath, 'utf8')
    const preloadTypes = readFileSync(preloadTypesPath, 'utf8')

    const requiredMethods = ['getBootstrapConfig', 'getBrandingConfig', 'onStartupProgress']

    for (const methodName of requiredMethods) {
      expect(preloadRuntime).toContain(methodName)
      expect(preloadTypes).toContain(methodName)
    }
  })

  it('keeps required prana-backed route surfaces registered', () => {
    const rendererMainPath = resolve(process.cwd(), 'src/renderer/src/main.tsx')
    const rendererMain = readFileSync(rendererMainPath, 'utf8')

    const requiredRoutes = ['/splash', '/login', '/vault', '/onboarding']

    for (const routePath of requiredRoutes) {
      expect(rendererMain).toContain(`path="${routePath}"`)
    }
  })
})
