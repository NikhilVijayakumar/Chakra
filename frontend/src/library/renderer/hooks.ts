import { useCallback, useEffect, useRef, useState } from 'react'
import type { Op, QuarantineEntry, Row, SyncResult, SyncStatus, User, VerifyResult } from '../shared/contract'
import { call, getApi } from './api'
import { defaultStrings, messageFor } from './strings'
import type { Strings } from './strings'

// Headless logic behind the default screens. Apps build their own screens on these.

export type ConnectionState = 'checking' | 'connected' | 'unhealthy' | 'disconnected'

/** Is the CLI configured, reachable, compatible and healthy? Optionally re-checks every `pollMs`. */
export const useCliConnection = (pollMs = 0) => {
  const [state, setState] = useState<ConnectionState>('checking')
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const recheck = useCallback(async () => {
    const r = await getApi().cli.status()
    if (r.ok) { setResult(r.data); setError(null); setState(r.data.healthy ? 'connected' : 'unhealthy') }
    else { setResult(null); setError(messageFor(r.error.code)); setState('disconnected') }
    return r
  }, [])
  useEffect(() => {
    void recheck()
    if (!pollMs) return
    const t = setInterval(() => void recheck(), pollMs)
    return () => clearInterval(t)
  }, [recheck, pollMs])
  return { state, result, error, recheck }
}

export const useCliConfig = (onSaved?: () => void) => {
  const [path, setPath] = useState('')
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [verifiedPath, setVerifiedPath] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  useEffect(() => { void getApi().cli.get().then((c) => c.cliPath && setPath(c.cliPath)) }, [])
  const verify = async (): Promise<void> => {
    setError(null); setResult(null); setSaved(false)
    const r = await getApi().cli.verify(path.trim())
    if (r.ok) { setResult(r.data); setVerifiedPath(path.trim()) } else { setError(messageFor(r.error.code)); setVerifiedPath(null) }
  }
  const save = async (): Promise<void> => {
    const r = await getApi().cli.save(path.trim())
    if (r.ok) { setSaved(true); onSaved?.() } else setError(messageFor(r.error.code))
  }
  return { path, setPath, result, error, saved, canSave: !!result && verifiedPath === path.trim(), verify, save }
}

const MAX_ATTEMPTS = 3
const LOCK_SECONDS = 30

/** Login with a UX-only lockout after 3 bad attempts; the CLI stays the authority. */
export const useLogin = (onLogin: (u: User) => void, strings: Strings = defaultStrings) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lock, setLock] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  useEffect(() => () => clearInterval(timer.current), [])
  useEffect(() => { if (lock <= 0) clearInterval(timer.current) }, [lock])
  const submit = async (): Promise<void> => {
    if (lock > 0 || !email || !password) return
    setBusy(true); setError(null)
    const r = await call<{ user: User }>('auth.login', { email, password })
    setBusy(false); setPassword('')
    if (r.ok) return onLogin(r.data.user)
    if (r.error.code === 'app_access_denied') { setAccessDenied(true); return }
    const n = attempts + 1
    if (r.error.code === 'invalid_credentials' && n >= MAX_ATTEMPTS) {
      setAttempts(0); setLock(LOCK_SECONDS)
      timer.current = setInterval(() => setLock((s) => s - 1), 1000)
    } else setAttempts(n)
    setError(r.error.code === 'invalid_credentials' ? strings.invalidCredentials : messageFor(r.error.code))
  }
  return { email, setEmail, password, setPassword, busy, error, accessDenied, clearAccessDenied: () => setAccessDenied(false), lockSeconds: lock, submit }
}

export type ForgotStep = 'email' | 'otp' | 'password' | 'done'

/** email -> OTP -> new password. The reset token stays inside this hook. */
export const useForgotPassword = () => {
  const [step, setStep] = useState<ForgotStep>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const act = async (fn: () => Promise<string | null>): Promise<void> => {
    setBusy(true); setError(null)
    const code = await fn()
    setBusy(false)
    if (code) setError(messageFor(code))
  }
  const sendOtp = (): Promise<void> => act(async () => {
    const r = await call('auth.otpSend', { email })
    if (r.ok) setStep('otp')
    return r.ok ? null : r.error.code
  })
  const verifyOtp = (): Promise<void> => act(async () => {
    const r = await call<{ resetToken: string }>('auth.otpVerify', { email, otp })
    if (r.ok) { setToken(r.data.resetToken); setStep('password') }
    return r.ok ? null : r.error.code
  })
  const reset = (): Promise<void> => act(async () => {
    const r = await call('auth.resetPassword', { email, resetToken: token, newPassword: password })
    setPassword(''); setToken('')
    if (r.ok) setStep('done')
    else if (r.error.code === 'reset_token_invalid') setStep('email')
    return r.ok ? null : r.error.code
  })
  return { step, email, setEmail, otp, setOtp, password, setPassword, busy, error, sendOtp, verifyOtp, reset }
}

export const useSync = (onChange?: (s: SyncStatus | null) => void) => {
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [last, setLast] = useState<SyncResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const refresh = useCallback(async () => {
    const r = await call<SyncStatus>('sync.status')
    setStatus(r.ok ? r.data : null)
    setError(r.ok ? null : messageFor(r.error.code))
    onChange?.(r.ok ? r.data : null)
  }, [onChange])
  useEffect(() => { void refresh() }, [refresh])
  const run = async (): Promise<void> => {
    setBusy(true)
    const r = await call<SyncResult>('sync.run', { target: 'all' })
    setBusy(false)
    if (r.ok) setLast(r.data); else setError(messageFor(r.error.code))
    await refresh()
  }
  return { status, last, busy, error, refresh, run }
}

/** Validation errors name the field and never a secret (CLI contract), so they are shown as-is; others are mapped. */
const errText = (e: { code: string; message: string }): string => (e.code === 'validation_failed' ? e.message : messageFor(e.code))

/** Live rows of one content. `reload` after changes made elsewhere. */
export const useContent = (content: string, where?: Record<string, string>) => {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const key = JSON.stringify(where ?? null)
  const reload = useCallback(async () => {
    setLoading(true)
    const r = await call<{ rows: Row[] }>('content.get', { content, where: key === 'null' ? undefined : JSON.parse(key) })
    setLoading(false)
    if (r.ok) { setRows(r.data.rows); setError(null) } else setError(errText(r.error))
  }, [content, key])
  useEffect(() => { void reload() }, [reload])
  return { rows, loading, error, reload }
}

export interface MutationResult { ok: boolean; error: string | null; row?: Row }

/** Create, update and delete for one content. Edits stay local until the next sync pushes them. */
export const useContentMutations = (content: string, onChange?: () => void) => {
  const [busy, setBusy] = useState(false)
  const run = async (op: 'content.create' | 'content.update' | 'content.delete', payload: Record<string, unknown>): Promise<MutationResult> => {
    setBusy(true)
    const r = await call<{ row?: Row }>(op, { content, ...payload })
    setBusy(false)
    if (!r.ok) return { ok: false, error: errText(r.error) }
    onChange?.()
    return { ok: true, error: null, row: r.data.row }
  }
  return {
    busy,
    create: (record: Row) => run('content.create', { record }),
    update: (id: string, record: Partial<Row>) => run('content.update', { id, record }),
    remove: (id: string) => run('content.delete', { id })
  }
}

/** Pending quarantine entries with the resolution actions. Every action reloads the list. */
export const useQuarantine = (status = 'pending') => {
  const [entries, setEntries] = useState<QuarantineEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const reload = useCallback(async () => {
    const r = await call<{ entries: QuarantineEntry[] }>('quarantine.list', { status })
    if (r.ok) { setEntries(r.data.entries); setError(null) } else setError(errText(r.error))
  }, [status])
  useEffect(() => { void reload() }, [reload])
  const act = async (op: Op, payload: Record<string, unknown>): Promise<MutationResult> => {
    setBusy(true)
    const r = await call<{ row?: Row; newIssues?: number }>(op, payload)
    setBusy(false)
    if (!r.ok) { const e = errText(r.error); setError(e); return { ok: false, error: e } }
    await reload()
    return { ok: true, error: null, row: r.data.row }
  }
  return {
    entries, error, busy, reload,
    reject: (id: string) => act('quarantine.reject', { id }),
    acceptSheets: (id: string) => act('quarantine.acceptSheets', { id }),
    applyLocal: (id: string) => act('quarantine.applyLocal', { id }),
    fix: (id: string, record: Row) => act('quarantine.fix', { id, record }),
    deleteRecord: (id: string) => act('quarantine.deleteRecord', { id }),
    scan: () => act('quarantine.scan', {})
  }
}

/** Number of pending quarantine entries, for badges. */
export const useQuarantineCount = () => {
  const [count, setCount] = useState(0)
  const reload = useCallback(async () => {
    const r = await call<{ count: number }>('quarantine.count')
    if (r.ok) setCount(r.data.count)
  }, [])
  useEffect(() => { void reload() }, [reload])
  return { count, reload }
}
