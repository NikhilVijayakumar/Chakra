import { useCallback, useEffect, useRef, useState } from 'react'
import type { SyncResult, SyncStatus, User, VerifyResult } from '../shared/contract'
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
    const n = attempts + 1
    if (r.error.code === 'invalid_credentials' && n >= MAX_ATTEMPTS) {
      setAttempts(0); setLock(LOCK_SECONDS)
      timer.current = setInterval(() => setLock((s) => s - 1), 1000)
    } else setAttempts(n)
    setError(r.error.code === 'invalid_credentials' ? strings.invalidCredentials : messageFor(r.error.code))
  }
  return { email, setEmail, password, setPassword, busy, error, lockSeconds: lock, submit }
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
