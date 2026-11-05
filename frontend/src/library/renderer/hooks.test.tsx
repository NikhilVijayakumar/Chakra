// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Envelope } from '../shared/contract'
import { useContent, useContentMutations, useQuarantine } from './hooks'

afterEach(cleanup)
const ok = <T,>(data: T): Envelope<T> => ({ ok: true, data })
const err = (code: string, message = 'raw cli text'): Envelope<never> => ({ ok: false, error: { code, message } })
const install = (handler: (op: string, payload: any) => Envelope<any>) => {
  const callFn = vi.fn(async (op: string, payload: any) => handler(op, payload))
  ;(window as any).chakra = { cli: {}, call: callFn }
  return callFn
}

describe('useContent', () => {
  it('loads rows and maps errors', async () => {
    install(() => ok({ rows: [{ id: 'd1', name: 'Eng' }] }))
    const { result } = renderHook(() => useContent('departments'))
    await waitFor(() => expect(result.current.rows).toEqual([{ id: 'd1', name: 'Eng' }]))
    install(() => err('feature_denied'))
    const bad = renderHook(() => useContent('apps'))
    await waitFor(() => expect(bad.result.current.error).toBe('This app may not use that feature.'))
  })
})

describe('useContentMutations', () => {
  it('sends content with the record, notifies on success', async () => {
    const calls = install(() => ok({ row: { id: 'DEPT001', name: 'Ops' } }))
    const onChange = vi.fn()
    const { result } = renderHook(() => useContentMutations('departments', onChange))
    let r: any
    await act(async () => { r = await result.current.create({ name: 'Ops' }) })
    expect(r).toMatchObject({ ok: true, row: { id: 'DEPT001' } })
    expect(calls).toHaveBeenCalledWith('content.create', { content: 'departments', record: { name: 'Ops' } })
    expect(onChange).toHaveBeenCalledOnce()
    await act(async () => { await result.current.update('d1', { name: 'X' }); await result.current.remove('d1') })
    expect(calls).toHaveBeenCalledWith('content.update', { content: 'departments', id: 'd1', record: { name: 'X' } })
    expect(calls).toHaveBeenCalledWith('content.delete', { content: 'departments', id: 'd1' })
  })
  it('shows the field message for validation errors but a mapped message for others', async () => {
    install(() => err('validation_failed', 'name is required'))
    const { result } = renderHook(() => useContentMutations('departments'))
    let r: any
    await act(async () => { r = await result.current.create({}) })
    expect(r).toEqual({ ok: false, error: 'name is required' })
    install(() => err('app_not_enabled', 'secret internals'))
    await act(async () => { r = await result.current.create({ name: 'x' }) })
    expect(r.error).toBe('This app is not enabled for your organization.')
    expect(r.error).not.toContain('secret')
  })
})

describe('useQuarantine', () => {
  it('lists, acts and reloads', async () => {
    let entries = [{ id: 'Q1', content: 'departments', recordId: 'd5', reason: 'missing_required', details: '', sheetsData: {}, localData: null, status: 'pending', createdAt: 1 }]
    const calls = install((op) => {
      if (op === 'quarantine.list') return ok({ entries })
      if (op === 'quarantine.reject') { entries = []; return ok({ updated: true }) }
      return ok({})
    })
    const { result } = renderHook(() => useQuarantine())
    await waitFor(() => expect(result.current.entries).toHaveLength(1))
    await act(async () => { await result.current.reject('Q1') })
    expect(calls).toHaveBeenCalledWith('quarantine.reject', { id: 'Q1' })
    await waitFor(() => expect(result.current.entries).toHaveLength(0))
  })
  it('reports an unknown entry with a mapped message', async () => {
    install((op) => (op === 'quarantine.list' ? ok({ entries: [] }) : err('quarantine_unknown')))
    const { result } = renderHook(() => useQuarantine())
    let r: any
    await act(async () => { r = await result.current.applyLocal('nope') })
    expect(r.error).toBe('That quarantine entry no longer exists.')
  })
})
