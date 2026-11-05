import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { CliConfig } from '../shared/contract'

/** Electron persists only the CLI location and last verification. Nothing else. */
export const createCliConfigStore = (dir: string) => {
  const file = join(dir, 'chakra-cli.json')
  return {
    get(): CliConfig {
      try {
        const o = JSON.parse(readFileSync(file, 'utf8')) as Partial<CliConfig>
        return { cliPath: typeof o.cliPath === 'string' ? o.cliPath : null, version: o.version ?? null, verifiedAt: o.verifiedAt ?? null }
      } catch {
        return { cliPath: null, version: null, verifiedAt: null }
      }
    },
    set(c: CliConfig): void {
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, JSON.stringify(c, null, 2), 'utf8')
    }
  }
}
export type CliConfigStore = ReturnType<typeof createCliConfigStore>
