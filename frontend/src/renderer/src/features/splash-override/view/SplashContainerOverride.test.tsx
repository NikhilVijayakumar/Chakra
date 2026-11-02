// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'

const { navigateMock } = vi.hoisted(() => ({
  navigateMock: vi.fn()
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock
}))

import { SplashContainerOverride } from './SplashContainerOverride'

describe('SplashContainerOverride', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    cleanup()
    navigateMock.mockReset()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    cleanup()
  })

  it('shows the mockup hero stage first', () => {
    render(<SplashContainerOverride />)

    expect(screen.getByText('CHAKRA PLATFORM')).toBeTruthy()
    expect(screen.getByTestId('hero-theme-toggle')).toBeTruthy()
    expect(screen.getByTestId('hero-letter-B-3')).toBeTruthy()
    expect(screen.getByTestId('hero-letter-V-5')).toBeTruthy()
  })

  it('navigates to boot after the hero sequence completes', async () => {
    render(<SplashContainerOverride />)

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(navigateMock).toHaveBeenCalledWith('/boot', { replace: true })
  })
})