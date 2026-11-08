import { Button, Stack } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppInfo, SyncStatus, User } from '../shared/contract'
import { call, getApi } from './api'
import { BootScreen } from './BootScreen'
import type { Stage, StageState } from './BootScreen'
import { CliConfigScreen } from './CliConfigScreen'
import { ForgotPassword } from './ForgotPassword'
import { LoginScreen } from './LoginScreen'
import { Splash } from './Splash'
import type { SplashLetter } from './Splash'
import { SyncPanel } from './SyncPanel'
import { defaultStrings, messageFor } from './strings'
import type { Strings } from './strings'

type Phase = 'splash' | 'boot' | 'cli-config' | 'sync' | 'login' | 'forgot' | 'ready'

/** An app-specific boot check, run after the built-in ones. Return an error message to fail it. */
export interface ExtraStage {
  id: string
  label: string
  run: (ctx: { app: AppInfo }) => Promise<string | null | void>
}

/** Replace any default screen. Each receives what it needs to continue the flow. */
export interface GateScreens {
  splash?: (p: { onDone: () => void }) => ReactNode
  boot?: (p: { stages: Stage[]; error: string | null; retry: () => void; configureCli: () => void }) => ReactNode
  cliConfig?: (p: { error: string | null; onSaved: () => void }) => ReactNode
  syncPrompt?: (p: { stages: Stage[]; error: string | null; onSynced: () => void }) => ReactNode
  login?: (p: { onLogin: (u: User) => void; onForgot: () => void }) => ReactNode
  forgot?: (p: { onBack: () => void }) => ReactNode
}

export interface ChakraGateProps {
  /** Rendered once the user is authenticated and the app is enabled. */
  children: (ctx: { user: User; app: AppInfo; logout: () => void }) => ReactNode
  strings?: Partial<Strings>
  splashLetters?: SplashLetter[]
  skipSplash?: boolean
  screens?: GateScreens
  extraStages?: ExtraStage[]
}

const baseStages = (s: Strings): Stage[] => [
  { id: 'cli', label: s.stageCli, state: 'pending' },
  { id: 'health', label: s.stageHealth, state: 'pending' },
  { id: 'sync', label: s.stageSync, state: 'pending' },
  { id: 'app', label: s.stageApp, state: 'pending' }
]

/** splash -> boot (CLI connected, healthy, synced, app enabled, your own stages) -> login -> children. */
export const ChakraGate = ({ children, strings: over, splashLetters, skipSplash, screens = {}, extraStages = [] }: ChakraGateProps) => {
  const strings: Strings = { ...defaultStrings, ...over }
  const fresh = (): Stage[] => [...baseStages(strings), ...extraStages.map((e) => ({ id: e.id, label: e.label, state: 'pending' as StageState }))]
  const [phase, setPhase] = useState<Phase>(skipSplash ? 'boot' : 'splash')
  const [stages, setStages] = useState<Stage[]>(fresh)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [app, setApp] = useState<AppInfo | null>(null)

  const mark = useCallback((id: string, state: StageState, detail?: string) => {
    setStages((all) => all.map((s) => (s.id === id ? { ...s, state, detail } : s)))
  }, [])

  const boot = useCallback(async () => {
    setError(null); setStages(fresh())
    mark('cli', 'running')
    const cfg = await getApi().cli.get()
    if (!cfg.cliPath) { mark('cli', 'error', 'not configured'); return setPhase('cli-config') }

    // "Connected": the saved CLI starts, speaks a supported API version and answers its health check.
    mark('health', 'running')
    const v = await getApi().cli.status()
    if (!v.ok) { mark('cli', 'error', 'cannot connect'); mark('health', 'pending'); setError(messageFor(v.error.code)); return setPhase('cli-config') }
    mark('cli', 'ok', cfg.cliPath)
    const bad = v.data.checks.filter((c) => !c.ok)
    if (bad.length) {
      mark('health', 'error', bad.map((c) => `${c.id}: ${c.message}`).join('; '))
      return setError(messageFor('config_missing')) // stay on boot; user can fix the CLI config and retry
    }
    mark('health', 'ok', `v${v.data.version}`)

    mark('sync', 'running')
    const st = await call<SyncStatus>('sync.status')
    if (!st.ok) { mark('sync', 'error'); return setError(messageFor(st.error.code)) }
    const cachedContent = (id: string): boolean => st.data.contents.some((c) =>
      c.id === id && typeof c.lastSyncAt === 'number' && c.lastSyncAt > 0)
    const cached = cachedContent('apps') && cachedContent('employees') &&
      (cachedContent('app_employees') || ['app_teams', 'employee_teams', 'teams'].every(cachedContent))
    if (!st.data.synced && !cached) { mark('sync', 'error', 'not synced'); return setPhase('sync') }
    mark('sync', 'ok')

    mark('app', 'running')
    const info = await call<AppInfo>('app.info')
    if (!info.ok) {
      mark('app', 'error')
      if (info.error.code === 'not_synced') return setPhase('sync')
      return setError(messageFor(info.error.code))
    }
    mark('app', 'ok')

    for (const e of extraStages) {
      mark(e.id, 'running')
      let msg: string | null | void
      try { msg = await e.run({ app: info.data }) } catch { msg = 'check failed' }
      if (msg) { mark(e.id, 'error', msg); return setError(msg) }
      mark(e.id, 'ok')
    }
    setApp(info.data)
    setPhase('login')
  }, [mark, strings, extraStages]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (phase === 'boot') void boot() }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const goBoot = (): void => setPhase('boot')
  const retry = (): void => void boot()
  const configureCli = (): void => setPhase('cli-config')

  if (phase === 'splash') {
    const done = (): void => setPhase('boot')
    return <>{screens.splash ? screens.splash({ onDone: done }) : <Splash brand={strings.brandName} tagline={strings.tagline} letters={splashLetters} onDone={done} />}</>
  }
  if (phase === 'cli-config') {
    return <>{screens.cliConfig ? screens.cliConfig({ error, onSaved: goBoot }) : <CliConfigScreen strings={strings} error={error} onSaved={goBoot} />}</>
  }
  if (phase === 'sync') {
    if (screens.syncPrompt) return <>{screens.syncPrompt({ stages, error, onSynced: goBoot })}</>
    return <BootScreen title={strings.bootTitle} stages={stages} error={error}
      actions={<Stack spacing={1}><SyncPanel strings={strings} onChange={(s) => s?.synced && goBoot()} /></Stack>} />
  }
  if (phase === 'login') {
    const onLogin = (u: User): void => { setUser(u); setPhase('ready') }
    const onForgot = (): void => setPhase('forgot')
    return <>{screens.login ? screens.login({ onLogin, onForgot }) : <LoginScreen strings={strings} onLogin={onLogin} onForgot={onForgot} />}</>
  }
  if (phase === 'forgot') {
    const onBack = (): void => setPhase('login')
    return <>{screens.forgot ? screens.forgot({ onBack }) : <ForgotPassword strings={strings} onBack={onBack} />}</>
  }
  if (phase === 'ready' && user && app) return <>{children({ user, app, logout: () => { setUser(null); setPhase('login') } })}</>

  if (screens.boot) return <>{screens.boot({ stages, error, retry, configureCli })}</>
  return <BootScreen title={strings.bootTitle} stages={stages} error={error}
    actions={error ? <Stack direction="row" spacing={1}><Button onClick={retry}>{strings.retry}</Button><Button onClick={configureCli}>{strings.configureCli}</Button></Stack> : undefined} />
}
