// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ChakraApi, Envelope } from '../shared/contract'
import { ChakraGate } from './ChakraGate'
import { CliStatusBadge } from './CliStatusBadge'

const ok = <T,>(data: T): Envelope<T> => ({ ok: true, data })
const err = (code: string): Envelope<never> => ({ ok: false, error: { code, message: 'raw cli text' } })

const install = (o: { cliPath?: string | null; verify?: Envelope<any>; calls?: Record<string, (p: any) => Envelope<any>> }): ChakraApi => {
  const calls = o.calls ?? {}
  const api = {
    cli: {
      get: vi.fn(async () => ({ cliPath: o.cliPath === undefined ? '/bin/chakra' : o.cliPath, version: null, verifiedAt: null })),
      verify: vi.fn(async () => o.verify ?? ok({ version: '1', apiVersion: 1, checks: [], healthy: true })),
      status: vi.fn(async () => o.verify ?? ok({ version: '1', apiVersion: 1, checks: [], healthy: true })),
      save: vi.fn()
    },
    call: vi.fn(async (op: string, p: any) => (calls[op] ? calls[op](p) : err('invalid_request')))
  } as unknown as ChakraApi
  window.chakra = api
  return api
}
const synced = { synced: true, lastSyncAt: 1, contents: [], pending: 0 }
const healthyCalls = {
  'sync.status': () => ok(synced),
  'app.info': () => ok({ appId: 'a', enabled: true, features: ['holidays'] })
}
const gate = () => render(<ChakraGate skipSplash>{({ user }) => <div>home for {user.name}</div>}</ChakraGate>)

afterEach(() => { cleanup(); delete window.chakra })

describe('ChakraGate boot', () => {
  it('goes to CLI configuration when no CLI is set', async () => {
    install({ cliPath: null })
    gate()
    expect(await screen.findByTestId('cli-config')).toBeTruthy()
    expect(screen.queryByTestId('login')).toBeNull()
  })

  it('shows the failing doctor check and never reaches login', async () => {
    install({ verify: ok({ version: '1', apiVersion: 1, healthy: false, checks: [{ id: 'google_credentials', ok: false, message: 'no key' }] }) })
    gate()
    expect(await screen.findByText(/google_credentials: no key/)).toBeTruthy()
    expect(screen.queryByTestId('login')).toBeNull()
  })

  it('offers sync when content is not synced', async () => {
    install({ calls: { 'sync.status': () => ok({ ...synced, synced: false }) } })
    gate()
    expect(await screen.findByTestId('sync-panel')).toBeTruthy()
  })

  it('blocks an app that is not enabled with a mapped message, not the raw CLI text', async () => {
    install({ calls: { ...healthyCalls, 'app.info': () => err('app_not_enabled') } })
    gate()
    expect(await screen.findByText(/not enabled/)).toBeTruthy()
    expect(screen.queryByText(/raw cli text/)).toBeNull()
  })

  it('logs in and renders the consumer app; wrong password shows a generic error', async () => {
    let good = false
    install({ calls: { ...healthyCalls, 'auth.login': () => (good ? ok({ user: { id: '1', email: 'a@b.c', name: 'Asha', role: null } }) : err('invalid_credentials')) } })
    gate()
    const email = await screen.findByLabelText('Email')
    fireEvent.change(email, { target: { value: 'a@b.c' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'bad' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('Invalid email or password.')).toBeTruthy()
    good = true
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(screen.getByText('home for Asha')).toBeTruthy())
  })

  it('locks the form after three failed attempts', async () => {
    const api = install({ calls: { ...healthyCalls, 'auth.login': () => err('invalid_credentials') } })
    gate()
    fireEvent.change(await screen.findByLabelText('Email'), { target: { value: 'a@b.c' } })
    const logins = (): number => (api.call as any).mock.calls.filter((c: any[]) => c[0] === 'auth.login').length
    for (let i = 1; i <= 3; i++) {
      await waitFor(() => expect((screen.getByRole('button', { name: 'Sign in' }) as HTMLButtonElement).disabled).toBe(false))
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'x' } })
      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
      await waitFor(() => expect(logins()).toBe(i))
    }
    expect(await screen.findByText(/Too many failed attempts/)).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Sign in' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('treats an unreachable saved CLI as disconnected and sends the user to CLI configuration', async () => {
    install({ verify: err('cli_unavailable') })
    gate()
    expect(await screen.findByTestId('cli-config')).toBeTruthy()
    expect(document.querySelector('[role="alert"]')).toBeNull()
    expect(screen.getByText(/cannot be started/)).toBeTruthy()
    expect(screen.queryByTestId('login')).toBeNull()
  })

  it('lets the app replace a screen and add its own boot stage', async () => {
    install({ calls: healthyCalls })
    const run = vi.fn(async () => null)
    render(
      <ChakraGate skipSplash extraStages={[{ id: 'license', label: 'License', run }]} screens={{ login: ({ onLogin }) => <button onClick={() => onLogin({ id: '1', email: 'e', name: 'Custom', role: null })}>my login</button> }}>
        {({ user }) => <div>home for {user.name}</div>}
      </ChakraGate>
    )
    fireEvent.click(await screen.findByText('my login'))
    await waitFor(() => expect(screen.getByText('home for Custom')).toBeTruthy())
    expect(run).toHaveBeenCalledWith({ app: expect.objectContaining({ appId: 'a' }) })
  })

  it('a failing app stage blocks login with its message', async () => {
    install({ calls: healthyCalls })
    render(<ChakraGate skipSplash extraStages={[{ id: 'license', label: 'License', run: async () => 'License expired' }]}>{() => <div>home</div>}</ChakraGate>)
    expect((await screen.findAllByText('License expired')).length).toBeGreaterThan(0)
    expect(screen.queryByTestId('login')).toBeNull()
  })

  it('CliStatusBadge is red when the CLI is not connected', async () => {
    install({ verify: err('cli_unavailable') })
    render(<CliStatusBadge />)
    const dot = await screen.findByLabelText(/not connected/)
    expect(dot.getAttribute('data-state')).toBe('error')
  })

  it('CliStatusBadge shows connected with the CLI version', async () => {
    install({})
    render(<CliStatusBadge />)
    const dot = await screen.findByLabelText(/connected v1/)
    expect(dot.getAttribute('data-state')).toBe('ok')
  })
})
