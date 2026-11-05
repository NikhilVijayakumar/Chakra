// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { Splash } from './Splash'

afterEach(cleanup)

const timeToDone = (reduced: boolean): number => {
  window.matchMedia = ((q: string) => ({ matches: reduced && q.includes('reduce') })) as never
  vi.useFakeTimers()
  const onDone = vi.fn()
  render(<Splash brand="AB" tagline="t" onDone={onDone} />)
  let t = 0
  while (!onDone.mock.calls.length && t < 10_000) { act(() => { vi.advanceTimersByTime(10) }); t += 10 }
  vi.useRealTimers()
  return t
}

it('completes faster when the user prefers reduced motion', () => {
  const fast = timeToDone(true)
  const normal = timeToDone(false)
  expect(fast).toBeLessThan(normal)
})
