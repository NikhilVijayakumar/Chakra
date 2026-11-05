import { spawn } from 'node:child_process'
import { accessSync, constants, statSync } from 'node:fs'
import { SUPPORTED_API_VERSION } from '../shared/contract'
import type { DoctorCheck, Envelope, VerifyResult } from '../shared/contract'

const MAX_STDOUT = 5_000_000
const fail = (code: string, message: string): Envelope<never> => ({ ok: false, error: { code, message } })

/** The path is user supplied: require an existing regular, executable file. */
export const validateCliPath = (p: string): string | null => {
  try {
    if (!statSync(p).isFile()) return 'CLI path is not a file'
    if (process.platform !== 'win32') accessSync(p, constants.X_OK)
    return null
  } catch {
    return 'CLI file does not exist or is not executable'
  }
}

const isEnvelope = (v: unknown): v is Envelope<unknown> => {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  if (o.ok === true) return 'data' in o
  const e = o.error as Record<string, unknown> | undefined
  return o.ok === false && !!e && typeof e.code === 'string' && typeof e.message === 'string'
}

/** Run one CLI call: no shell, request on stdin (secrets never in argv), one JSON envelope on stdout. */
export const runCli = (
  cliPath: string,
  group: string,
  command: string,
  payload: Record<string, unknown> = {},
  timeoutMs = 30_000
): Promise<Envelope<unknown>> =>
  new Promise((resolve) => {
    let out = ''
    let tooBig = false
    let settled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const done = (e: Envelope<unknown>): void => {
      if (!settled) {
        settled = true
        clearTimeout(timer)
        resolve(e)
      }
    }
    let child: ReturnType<typeof spawn>
    try {
      child = spawn(cliPath, [group, command], { shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] })
    } catch {
      return resolve(fail('cli_unavailable', 'Cannot start the CLI'))
    }
    timer = setTimeout(() => {
      child.kill()
      done(fail('cli_timeout', 'The CLI did not respond in time'))
    }, timeoutMs)
    child.on('error', () => done(fail('cli_unavailable', 'Cannot start the CLI')))
    child.stdout?.on('data', (d: Buffer) => {
      out += d.toString('utf8')
      if (out.length > MAX_STDOUT) {
        tooBig = true
        child.kill()
      }
    })
    child.on('close', () => {
      if (tooBig) return done(fail('internal', 'CLI output too large'))
      try {
        const parsed: unknown = JSON.parse(out)
        done(isEnvelope(parsed) ? parsed : fail('internal', 'CLI returned an unexpected response'))
      } catch {
        done(fail('internal', 'CLI returned an unexpected response'))
      }
    })
    child.stdin?.on('error', () => undefined) // process may exit before reading stdin
    child.stdin?.end(JSON.stringify(payload))
  })

/** version -> apiVersion -> doctor. Never trusts the CLI output shape beyond the fields it uses. */
export const verifyCli = async (cliPath: string): Promise<Envelope<VerifyResult>> => {
  const bad = validateCliPath(cliPath)
  if (bad) return fail('cli_unavailable', bad)
  const v = await runCli(cliPath, 'meta', 'version')
  if (!v.ok) return v
  const { version, apiVersion } = v.data as { version?: unknown; apiVersion?: unknown }
  if (typeof version !== 'string' || apiVersion !== SUPPORTED_API_VERSION) {
    return fail('cli_incompatible', `CLI apiVersion ${String(apiVersion)} is not supported (expected ${SUPPORTED_API_VERSION})`)
  }
  const d = await runCli(cliPath, 'meta', 'doctor')
  if (!d.ok) return d
  const checks = ((d.data as { checks?: DoctorCheck[] }).checks ?? []).filter(
    (c) => c && typeof c.id === 'string' && typeof c.ok === 'boolean'
  )
  return { ok: true, data: { version, apiVersion, checks, healthy: checks.every((c) => c.ok) } }
}
