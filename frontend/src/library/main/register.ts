import { APP_SCOPED, IPC, LONG_OPS, OPS } from '../shared/contract'
import type { Envelope, Op } from '../shared/contract'
import { runCli, verifyCli } from './cliClient'
import { createCliConfigStore } from './cliConfigStore'

export interface IpcLike {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Electron handler args are untyped
  handle(channel: string, listener: (event: unknown, ...args: any[]) => unknown): void
}
export interface RegisterOptions {
  /** Identifies the consuming app to the CLI (availability and feature checks). */
  appId: string
  /** Directory for the CLI location file. Defaults to Electron's userData. */
  configDir?: string
  /** Optional bundled CLI, verified when no user selection exists. */
  defaultCliPath?: string
  ipc?: IpcLike
}

const fail = (code: string, message: string): Envelope<never> => ({ ok: false, error: { code, message } })

export const registerChakra = (opts: RegisterOptions): void => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const electron = opts.ipc && opts.configDir ? null : require('electron')
  const ipc: IpcLike = opts.ipc ?? electron.ipcMain
  const store = createCliConfigStore(opts.configDir ?? electron.app.getPath('userData'))

  const resolvedConfig = async () => {
    const saved = store.get()
    if (saved.cliPath || !opts.defaultCliPath) return saved
    const result = await verifyCli(opts.defaultCliPath)
    if (!result.ok || !result.data.healthy) return saved
    return { cliPath: opts.defaultCliPath, version: result.data.version, verifiedAt: Date.now() }
  }

  ipc.handle(IPC.cliGet, () => resolvedConfig())
  ipc.handle(IPC.cliVerify, (_e, path: unknown) =>
    typeof path === 'string' ? verifyCli(path) : fail('invalid_request', 'path must be a string')
  )
  ipc.handle(IPC.cliStatus, async () => {
    const p = (await resolvedConfig()).cliPath
    return p ? verifyCli(p) : fail('cli_unavailable', 'CLI location is not configured')
  })
  ipc.handle(IPC.cliSave, async (_e, path: unknown) => {
    if (typeof path !== 'string') return fail('invalid_request', 'path must be a string')
    const r = await verifyCli(path) // re-verify in main: never trust the renderer's earlier result
    if (r.ok && !r.data.healthy) return fail('config_missing', 'CLI health checks failed')
    if (r.ok) store.set({ cliPath: path, version: r.data.version, verifiedAt: Date.now() })
    return r
  })
  ipc.handle(IPC.call, async (_e, req: unknown) => {
    const { op, payload } = (req ?? {}) as { op?: string; payload?: unknown }
    if (typeof op !== 'string' || !(op in OPS)) return fail('invalid_request', 'unknown operation')
    const cliPath = (await resolvedConfig()).cliPath
    if (!cliPath) return fail('cli_unavailable', 'CLI location is not configured')
    const body: Record<string, unknown> =
      payload && typeof payload === 'object' && !Array.isArray(payload) ? { ...(payload as object) } : {}
    if (APP_SCOPED.has(op as Op)) body.appId = opts.appId // the renderer cannot choose its app identity
    const [group, command] = OPS[op as Op]
    return runCli(cliPath, group, command, body, LONG_OPS.has(op as Op) ? 180_000 : 30_000)
  })
}
