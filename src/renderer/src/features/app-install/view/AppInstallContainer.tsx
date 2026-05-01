import { FC, useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AppInstallView } from './AppInstallView'

type InstallStep = 'select' | 'confirm' | 'installing' | 'complete'

interface InstallState {
  step: InstallStep
  selectedAppId: string | null
  selectedAppName: string | null
  installProgress: number
  error: string | null
  isLoading: boolean
}

/**
 * AppInstallContainer
 * 
 * Manages installation wizard state:
 * 1. App selection from list
 * 2. Installation confirmation
 * 3. Installation execution with progress
 * 4. Completion screen
 * 
 * TODO: Implement actual app installation via IPC
 */
export const AppInstallContainer: FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [state, setState] = useState<InstallState>({
    step: 'select',
    selectedAppId: location.state?.appId || null,
    selectedAppName: location.state?.appName || null,
    installProgress: 0,
    error: null,
    isLoading: false
  })

  // If app was pre-selected, jump to confirm step
  useEffect(() => {
    if (state.selectedAppId && state.step === 'select') {
      setState((prev) => ({ ...prev, step: 'confirm' }))
    }
  }, [])

  const handleSelectApp = (appId: string, appName: string) => {
    setState((prev) => ({
      ...prev,
      selectedAppId: appId,
      selectedAppName: appName
    }))
  }

  const handleConfirmInstall = () => {
    setState((prev) => ({ ...prev, step: 'confirm' }))
  }

  const handleStartInstall = async () => {
    setState((prev) => ({
      ...prev,
      step: 'installing',
      isLoading: true,
      installProgress: 0,
      error: null
    }))

    try {
      // TODO: Call IPC to start installation
      // window.api.apps.install(state.selectedAppId)

      // Simulate installation progress
      let progress = 0
      progressIntervalRef.current = setInterval(() => {
        progress += Math.random() * 15
        if (progress >= 100) {
          progress = 100
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
          }
          completeInstallation()
          return
        }
        setState((prev) => ({ ...prev, installProgress: Math.min(progress, 99) }))
      }, 500)
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Installation failed'
      }))
    }
  }

  const completeInstallation = async () => {
    try {
      // Simulate final step
      await new Promise((r) => setTimeout(r, 500))
      setState((prev) => ({
        ...prev,
        step: 'complete',
        installProgress: 100,
        isLoading: false
      }))
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to complete installation'
      }))
    }
  }

  const handleComplete = () => {
    navigate('/home')
  }

  const handleBack = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }

    if (state.step === 'select') {
      navigate('/home')
    } else if (state.step === 'confirm') {
      setState((prev) => ({ ...prev, step: 'select' }))
    } else if (state.step === 'installing') {
      // Allow cancellation only if not too far along
      if (state.installProgress < 90) {
        setState((prev) => ({ ...prev, step: 'confirm' }))
      }
    } else if (state.step === 'complete') {
      navigate('/home')
    }
  }

  const getActiveStep = (): number => {
    switch (state.step) {
      case 'select':
        return 0
      case 'confirm':
        return 1
      case 'installing':
        return 2
      case 'complete':
        return 3
      default:
        return 0
    }
  }

  return (
    <AppInstallView
      step={state.step}
      activeStep={getActiveStep()}
      selectedAppId={state.selectedAppId}
      selectedAppName={state.selectedAppName}
      installProgress={state.installProgress}
      error={state.error}
      isLoading={state.isLoading}
      onSelectApp={handleSelectApp}
      onConfirmInstall={handleConfirmInstall}
      onStartInstall={handleStartInstall}
      onComplete={handleComplete}
      onBack={handleBack}
    />
  )
}
