import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IPC } from '../shared/contract'

const mocked = vi.hoisted(() => ({ verifyCli: vi.fn(), runCli: vi.fn() }))
vi.mock('./cliClient', () => mocked)

import { registerChakra } from './register'

const healthy = { ok: true, data: { version: '1', apiVersion: 3, checks: [], healthy: true } }
const bad = { ok: false, error: { code: 'cli_incompatible', message: 'bad' } }

const setup = () => {
  const dir = mkdtempSync(join(tmpdir(), 'chakra-bundle-'))
  const h: Record<string, (event: unknown, ...args: unknown[]) => unknown> = {}
  registerChakra({ appId: 'consumer', defaultCliPath: 'bundled.exe', configDir: dir, ipc: { handle: (c, f) => { h[c] = f } } })
  return h
}

beforeEach(() => { mocked.verifyCli.mockReset(); mocked.runCli.mockReset() })

describe('bundled CLI selection', () => {
  it('verifies and uses the bundled default when nothing is saved', async () => {
    mocked.verifyCli.mockResolvedValue(healthy)
    const h = setup()
    expect(await h[IPC.cliGet]({})).toMatchObject({ cliPath: 'bundled.exe' })
    expect(mocked.verifyCli).toHaveBeenCalledWith('bundled.exe')
  })

  it('keeps the saved selection when an invalid replacement is requested', async () => {
    mocked.verifyCli.mockResolvedValueOnce(healthy).mockResolvedValueOnce(bad)
    const h = setup()
    expect(await h[IPC.cliSave]({}, 'selected.exe')).toMatchObject({ ok: true })
    expect(await h[IPC.cliSave]({}, 'bad.exe')).toMatchObject({ ok: false })
    expect(await h[IPC.cliGet]({})).toMatchObject({ cliPath: 'selected.exe' })
  })

  it('does not replace a saved CLI with an unhealthy candidate', async () => {
    mocked.verifyCli.mockResolvedValueOnce(healthy).mockResolvedValueOnce({ ok: true, data: { ...healthy.data, healthy: false } })
    const h = setup()
    await h[IPC.cliSave]({}, 'selected.exe')
    expect(await h[IPC.cliSave]({}, 'unhealthy.exe')).toMatchObject({ ok: false })
    expect(await h[IPC.cliGet]({})).toMatchObject({ cliPath: 'selected.exe' })
  })

  it('does not use an invalid bundled default', async () => {
    mocked.verifyCli.mockResolvedValue(bad)
    const h = setup()
    expect(await h[IPC.cliGet]({})).toMatchObject({ cliPath: null })
  })
})
