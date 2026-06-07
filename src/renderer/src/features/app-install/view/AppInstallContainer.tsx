import { FC, useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AppInstallView, InstallPhase } from './AppInstallView'

interface InstallRouteState {
  appId: string
  appName: string
  cloneUrl: string
}

export const AppInstallContainer: FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? {}) as Partial<InstallRouteState>

  const { appId = '', appName = 'App', cloneUrl = '' } = state

  const [phase, setPhase] = useState<InstallPhase>('installing')
  const [progress, setProgress] = useState(0)
  const [currentLog, setCurrentLog] = useState('> Preparing installation...')
  const [error, setError] = useState<string | null>(null)

  const started = useRef(false)

  useEffect(() => {
    if (started.current || !appId || !cloneUrl) return
    started.current = true

    // Subscribe to progress events from main process
    const unsubscribe = window.api.apps.onInstallProgress(({ step, percent, log }) => {
      setProgress(percent)
      setCurrentLog(log)
      if (step === 'complete') {
        setPhase('complete')
      }
    })

    // Start installation
    window.api.apps.install(appId, appName, cloneUrl).then((result) => {
      unsubscribe()
      if (result.success) {
        setProgress(100)
        setCurrentLog('> Installation complete.')
        setPhase('complete')
      } else {
        setPhase('error')
        setError(result.error ?? 'Installation failed')
        setCurrentLog(`> Error: ${result.error ?? 'unknown'}`)
        setProgress(0)
      }
    }).catch((err: unknown) => {
      unsubscribe()
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setPhase('error')
      setError(msg)
      setCurrentLog(`> Error: ${msg}`)
    })

    return () => {
      // best-effort unsubscribe if component unmounts early
      try { unsubscribe() } catch { /* ignore */ }
    }
  }, [appId, appName, cloneUrl])

  // Redirect to home if no app info was passed
  useEffect(() => {
    if (!appId || !cloneUrl) {
      navigate('/home', { replace: true })
    }
  }, [appId, cloneUrl, navigate])

  const handleCancel = () => {
    navigate('/home')
  }

  const handleDone = () => {
    navigate('/home')
  }

  return (
    <AppInstallView
      appName={appName}
      phase={phase}
      progress={progress}
      currentLog={currentLog}
      error={error}
      onCancel={handleCancel}
      onDone={handleDone}
    />
  )
}
