import { FC, useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { volatileSessionStore } from 'prana/ui/state/volatileSessionStore'
import { EnhancedLoginView } from './EnhancedLoginView'

interface LoginState {
  email: string
  password: string
  isSubmitting: boolean
  error: string | null
  isLocked: boolean
  lockRemainingSeconds: number
  attemptsRemaining: number
}

export const LoginContainer: FC = () => {
  const navigate = useNavigate()
  const lockoutIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [state, setState] = useState<LoginState>({
    email: '',
    password: '',
    isSubmitting: false,
    error: null,
    isLocked: false,
    lockRemainingSeconds: 0,
    attemptsRemaining: 3
  })

  useEffect(() => {
    const lockoutEnd = localStorage.getItem('chakra_lockout_end')
    const attempts = parseInt(localStorage.getItem('chakra_login_attempts') || '0', 10)

    if (lockoutEnd) {
      const now = Date.now()
      const remaining = Math.ceil((parseInt(lockoutEnd, 10) - now) / 1000)

      if (remaining > 0) {
        setState((prev) => ({ ...prev, isLocked: true, lockRemainingSeconds: remaining, attemptsRemaining: 0 }))
        startLockoutTimer()
      } else {
        localStorage.removeItem('chakra_lockout_end')
        localStorage.removeItem('chakra_login_attempts')
      }
    } else {
      setState((prev) => ({ ...prev, attemptsRemaining: Math.max(0, 3 - attempts) }))
    }
  }, [])

  const startLockoutTimer = () => {
    if (lockoutIntervalRef.current) clearInterval(lockoutIntervalRef.current)

    lockoutIntervalRef.current = setInterval(() => {
      setState((prev) => {
        const newRemaining = prev.lockRemainingSeconds - 1
        if (newRemaining <= 0) {
          if (lockoutIntervalRef.current) clearInterval(lockoutIntervalRef.current)
          localStorage.removeItem('chakra_lockout_end')
          localStorage.removeItem('chakra_login_attempts')
          return { ...prev, isLocked: false, lockRemainingSeconds: 0, attemptsRemaining: 3, error: null }
        }
        return { ...prev, lockRemainingSeconds: newRemaining }
      })
    }, 1000)
  }

  const handleLogin = async () => {
    if (state.isLocked) return

    setState((prev) => ({ ...prev, isSubmitting: true, error: null }))

    try {
      if (!state.email || !state.password) {
        throw new Error('Email and password are required')
      }

      const result = await window.api.auth.loginWithSheets(state.email, state.password)

      if (result.success && result.sessionToken) {
        volatileSessionStore.setSessionToken(result.sessionToken)
        localStorage.setItem('chakra_employee_email', state.email.trim().toLowerCase())
        localStorage.removeItem('chakra_lockout_end')
        localStorage.removeItem('chakra_login_attempts')
        navigate('/home')
      } else if (result.success) {
        throw new Error('Authentication succeeded but no session token was provided')
      } else {
        const attempts = parseInt(localStorage.getItem('chakra_login_attempts') || '0', 10)
        const newAttempts = attempts + 1

        if (newAttempts >= 3) {
          const lockoutEnd = Date.now() + 30000
          localStorage.setItem('chakra_lockout_end', lockoutEnd.toString())
          localStorage.removeItem('chakra_login_attempts')
          setState((prev) => ({ ...prev, isSubmitting: false, isLocked: true, lockRemainingSeconds: 30, attemptsRemaining: 0, error: 'Too many failed attempts. Please try again in 30 seconds.' }))
          startLockoutTimer()
        } else {
          localStorage.setItem('chakra_login_attempts', newAttempts.toString())
          setState((prev) => ({ ...prev, isSubmitting: false, attemptsRemaining: 3 - newAttempts, error: `Invalid credentials. ${3 - newAttempts} attempt(s) remaining.` }))
        }
      }
    } catch (err) {
      setState((prev) => ({ ...prev, isSubmitting: false, error: err instanceof Error ? err.message : 'An error occurred during login' }))
    }
  }

  return (
    <EnhancedLoginView
      email={state.email}
      password={state.password}
      isSubmitting={state.isSubmitting}
      error={state.error}
      isLocked={state.isLocked}
      lockRemainingSeconds={state.lockRemainingSeconds}
      attemptsRemaining={state.attemptsRemaining}
      onEmailChange={(email) => setState((prev) => ({ ...prev, email }))}
      onPasswordChange={(password) => setState((prev) => ({ ...prev, password }))}
      onSubmit={handleLogin}
      onBack={() => navigate('/splash')}
      onForgotPassword={() => navigate('/forgot-password')}
    />
  )
}
