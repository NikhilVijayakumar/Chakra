import { FC, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { volatileSessionStore } from 'prana/ui/authentication/state/volatileSessionStore'
import { LoginView } from 'prana/ui/authentication/view/LoginView'

type AuthLoginResult = Awaited<ReturnType<typeof window.api.auth.login>>

/**
 * LoginContainerOverride
 *
 * Wraps Prana's LoginView with proper session management and navigation logic.
 * Handles:
 * - Successful login → set session + navigate to home/onboarding
 * - Failed login → display error
 * - Invalid credentials → show generic error
 *
 * Logs all state transitions for debugging app refresh issues.
 */
export const LoginContainerOverride: FC = () => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (): Promise<void> => {
    console.log('[LoginOverride] Login attempt started', { email })
    setIsSubmitting(true)
    setError(null)

    try {
      const rawResult = await (window.api as any).auth.loginWithSheets(email, password)
      const result = rawResult as Omit<AuthLoginResult, 'reason'> & { reason?: string }

      console.log('[LoginOverride] Login response:', {
        success: result.success,
        reason: result.reason,
        hasSessionToken: !!result.sessionToken,
        isFirstInstall: result.isFirstInstall
      })

      if (!result.success) {
        const errorMessage =
          result.reason === 'no_employees'
            ? 'Employee directory not loaded. Connect Google Sheets and restart.'
            : result.reason === 'account_inactive'
            ? 'Account is inactive.'
            : 'Invalid credentials'
        console.warn('[LoginOverride] Login failed:', { reason: result.reason, errorMessage })
        setError(errorMessage)
        return
      }

      // Success: Store session
      if (result.sessionToken) {
        console.log('[LoginOverride] Storing session token')
        volatileSessionStore.setSessionToken(result.sessionToken)
        volatileSessionStore.setOnboardingStatus('COMPLETED')
      }

      const targetRoute = '/apps'
      console.log('[LoginOverride] Login successful, navigating to:', targetRoute)

      // Use navigate instead of window.location to stay in React router
      // Add a small delay to ensure state is settled before navigation
      setTimeout(() => {
        navigate(targetRoute, { replace: true })
      }, 100)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      console.error('[LoginOverride] Login threw exception:', errorMessage)
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <LoginView
      email={email}
      password={password}
      isLoading={isSubmitting}
      errorKey={error}
      isLocked={false}
      lockRemainingSeconds={0}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleLogin}
      onForgotPassword={() => navigate('/forgot-password')}
    />
  )
}
