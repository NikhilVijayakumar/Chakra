// @vitest-environment jsdom
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'

const { navigateMock, hasSessionMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  hasSessionMock: vi.fn()
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock
}))

vi.mock('prana/ui/authentication/state/volatileSessionStore', () => ({
  volatileSessionStore: {
    hasSession: hasSessionMock
  }
}))

vi.mock('../viewmodel/useDhiSplashViewModel', () => ({
  useDhiSplashViewModel: (handleComplete: () => void, _handleSshFailure: () => void) => {
    React.useEffect(() => {
      handleComplete()
    }, [handleComplete])

    return {
      stages: [],
      handleRetry: vi.fn(),
      isFatalActionableError: false,
      currentStepIndex: 0
    }
  }
}))

vi.mock('./SplashViewOverride', () => ({
  SplashViewOverride: () => <div data-testid="splash-view">Splash</div>
}))

import { SplashContainerOverride } from './SplashContainerOverride'

describe('SplashContainerOverride', () => {
  beforeEach(() => {
    cleanup()
    navigateMock.mockReset()
    hasSessionMock.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('routes to login when there is no session', async () => {
    hasSessionMock.mockReturnValue(false)

    render(<SplashContainerOverride />)

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/login')
    })
  })

  it('routes to the first authenticated route when a session exists', async () => {
    hasSessionMock.mockReturnValue(true)

    render(<SplashContainerOverride />)

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/apps')
    })
  })
})
