// @vitest-environment jsdom
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'

const { navigateMock, onCompleteMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  onCompleteMock: vi.fn()
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock
}))

vi.mock('../viewmodel/useBootViewModel', () => ({
  useBootViewModel: (onComplete: () => void, _onSshFailure: () => void) => {
    React.useEffect(() => {
      onCompleteMock()
      onComplete()
    }, [onComplete])

    return {
      stages: [],
      handleRetry: vi.fn(),
      isFatalActionableError: false
    }
  }
}))

vi.mock('./BootView', () => ({
  BootView: () => <div data-testid="boot-view">Boot</div>
}))

import { BootContainer } from './BootContainer'

describe('BootContainer', () => {
  beforeEach(() => {
    cleanup()
    navigateMock.mockReset()
    onCompleteMock.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('routes to login when boot completes', async () => {
    render(<BootContainer />)

    await waitFor(() => {
      expect(onCompleteMock).toHaveBeenCalled()
      expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true })
    })
  })
})