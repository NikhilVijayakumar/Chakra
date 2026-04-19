// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

const { navigateMock, loginMock, setSessionTokenMock, setOnboardingStatusMock } = vi.hoisted(
  () => ({
    navigateMock: vi.fn(),
    loginMock: vi.fn(),
    setSessionTokenMock: vi.fn(),
    setOnboardingStatusMock: vi.fn()
  })
)

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock
}))

vi.mock('prana/ui/authentication/state/volatileSessionStore', () => ({
  volatileSessionStore: {
    setSessionToken: setSessionTokenMock,
    setOnboardingStatus: setOnboardingStatusMock
  }
}))

vi.mock('prana/ui/authentication/view/LoginView', () => ({
  LoginView: ({
    email,
    password,
    isLoading,
    errorKey,
    onEmailChange,
    onPasswordChange,
    onSubmit,
    onForgotPassword
  }: {
    email: string
    password: string
    isLoading: boolean
    errorKey: string | null
    onEmailChange: (value: string) => void
    onPasswordChange: (value: string) => void
    onSubmit: () => Promise<void>
    onForgotPassword: () => void
  }) => (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void onSubmit()
      }}
    >
      <label htmlFor="email-input">Email</label>
      <input
        id="email-input"
        data-testid="email-input"
        value={email}
        onChange={(event) => onEmailChange(event.target.value)}
      />
      <label htmlFor="password-input">Password</label>
      <input
        id="password-input"
        data-testid="password-input"
        value={password}
        onChange={(event) => onPasswordChange(event.target.value)}
      />
      <div data-testid="loading-state">{String(isLoading)}</div>
      <div data-testid="error-state">{errorKey ?? ''}</div>
      <button type="submit">Login</button>
      <button type="button" onClick={onForgotPassword}>
        Forgot password
      </button>
    </form>
  )
}))

import { LoginContainerOverride } from './LoginContainerOverride'

describe('LoginContainerOverride', () => {
  beforeEach(() => {
    cleanup()
    navigateMock.mockReset()
    loginMock.mockReset()
    setSessionTokenMock.mockReset()
    setOnboardingStatusMock.mockReset()

    Object.defineProperty(window, 'api', {
      configurable: true,
      value: {
        auth: {
          login: loginMock
        }
      }
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('keeps invalid credentials on the login path with a generic error', async () => {
    loginMock.mockResolvedValue({
      success: false,
      reason: 'invalid_credentials'
    })

    render(<LoginContainerOverride />)

    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'director@example.com' } })
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'wrong-password' } })
    fireEvent.click(screen.getByText('Login'))

    await waitFor(() => {
      expect(screen.getByTestId('error-state').textContent).toBe('Invalid credentials')
    })

    expect(loginMock).toHaveBeenCalledWith('director@example.com', 'wrong-password')
    expect(setSessionTokenMock).not.toHaveBeenCalled()
    expect(setOnboardingStatusMock).not.toHaveBeenCalled()
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('stores session token and navigates to app listing placeholder on first install', async () => {
    loginMock.mockResolvedValue({
      success: true,
      isFirstInstall: true,
      sessionToken: 'session-token-123'
    })

    render(<LoginContainerOverride />)

    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'director@example.com' } })
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'correct-password' } })
    fireEvent.click(screen.getByText('Login'))

    await waitFor(() => {
      expect(setSessionTokenMock).toHaveBeenCalledWith('session-token-123')
    })

    expect(setOnboardingStatusMock).toHaveBeenCalledWith('COMPLETED')
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/apps', { replace: true })
    })
  })

  it('stores session token and navigates to app listing placeholder after bootstrap', async () => {
    loginMock.mockResolvedValue({
      success: true,
      isFirstInstall: false,
      sessionToken: 'session-token-456'
    })

    render(<LoginContainerOverride />)

    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'director@example.com' } })
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'correct-password' } })
    fireEvent.click(screen.getByText('Login'))

    await waitFor(() => {
      expect(setSessionTokenMock).toHaveBeenCalledWith('session-token-456')
    })

    expect(setOnboardingStatusMock).toHaveBeenCalledWith('COMPLETED')
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/apps', { replace: true })
    })
  })
})
