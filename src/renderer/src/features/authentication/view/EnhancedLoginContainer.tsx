import { FC, useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
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

/**
 * EnhancedLoginContainer
 * 
 * Manages:
 * - Form validation
 * - Lockout after 3 failed attempts (30 seconds)
 * - API call to auth service
 * - Navigation on success/failure
 * - Error handling and display
 */
export const EnhancedLoginContainer: FC = () => {
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

  // Initialize lockout state from localStorage
  useEffect(() => {
    const lockoutEnd = localStorage.getItem('chakra_lockout_end')
    const attempts = parseInt(localStorage.getItem('chakra_login_attempts') || '0', 10)

    if (lockoutEnd) {
      const now = Date.now()
      const remaining = Math.ceil((parseInt(lockoutEnd, 10) - now) / 1000)

      if (remaining > 0) {
        setState((prev) => ({
          ...prev,
          isLocked: true,
          lockRemainingSeconds: remaining,
          attemptsRemaining: 0
        }))
        startLockoutTimer()
      } else {
        localStorage.removeItem('chakra_lockout_end')
        localStorage.removeItem('chakra_login_attempts')
      }
    } else {
      setState((prev) => ({
        ...prev,
        attemptsRemaining: Math.max(0, 3 - attempts)
      }))
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
          return {
            ...prev,
            isLocked: false,
            lockRemainingSeconds: 0,
            attemptsRemaining: 3,
            error: null
          }
        }
        return { ...prev, lockRemainingSeconds: newRemaining }
      })
    }, 1000)
  }

  const handleLogin = async () => {
    if (state.isLocked) return

    setState((prev) => ({ ...prev, isSubmitting: true, error: null }))

    try {
      // Validate input
      if (!state.email || !state.password) {
        throw new Error('Email and password are required')
      }

      // Call auth API
      // TODO: Replace with actual API call when backend is ready
      const result = await simulateAuthCall(state.email, state.password)

      if (result.success) {
        // Clear lockout on success
        localStorage.removeItem('chakra_lockout_end')
        localStorage.removeItem('chakra_login_attempts')
        navigate('/apps')
      } else {
        // Increment failed attempts
        const attempts = parseInt(localStorage.getItem('chakra_login_attempts') || '0', 10)
        const newAttempts = attempts + 1

        if (newAttempts >= 3) {
          const lockoutEnd = Date.now() + 30000 // 30 seconds
          localStorage.setItem('chakra_lockout_end', lockoutEnd.toString())
          localStorage.removeItem('chakra_login_attempts')

          setState((prev) => ({
            ...prev,
            isSubmitting: false,
            isLocked: true,
            lockRemainingSeconds: 30,
            attemptsRemaining: 0,
            error: 'Too many failed attempts. Please try again in 30 seconds.'
          }))
          startLockoutTimer()
        } else {
          localStorage.setItem('chakra_login_attempts', newAttempts.toString())
          setState((prev) => ({
            ...prev,
            isSubmitting: false,
            attemptsRemaining: 3 - newAttempts,
            error: `Invalid credentials. ${3 - newAttempts} attempt(s) remaining.`
          }))
        }
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        error: err instanceof Error ? err.message : 'An error occurred during login'
      }))
    }
  }

  const handleBack = () => {
    navigate('/splash')
  }

  const handleForgotPassword = () => {
    navigate('/forgot-password')
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
      onBack={handleBack}
      onForgotPassword={handleForgotPassword}
    />
  )
}

/**
 * Simulates authentication API call
 * Replace with actual backend call when available
 * 
 * Expected API:
 * POST /api/auth/login
 * Body: { email, password }
 * Response: { success: boolean, sessionToken?: string, message?: string }
 */
async function simulateAuthCall(
  email: string,
  password: string
): Promise<{ success: boolean; message?: string }> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 800))

  // Demo credentials (development only)
  const DEMO_EMAIL = 'admin@bavans.com'
  const DEMO_PASSWORD = 'Password123!'

  if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
    return { success: true }
  }

  return { success: false, message: 'Invalid email or password' }
}
